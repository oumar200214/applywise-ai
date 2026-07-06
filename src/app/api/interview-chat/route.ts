import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { guardFeature } from '@/lib/plan-guard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed, plan } = await guardFeature(user.id, 'interview_sim')
  if (!allowed) {
    return NextResponse.json(
      { error: `Mock interview requires Premium plan. Current plan: ${plan}`, code: 'PLAN_REQUIRED' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { messages, question, role, company, userAnswer } = body as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    question: string
    role: string
    company: string
    userAnswer?: string
  }

  // Input guards — prevent token abuse
  if (!question || typeof question !== 'string' || question.length > 2000) {
    return NextResponse.json({ error: 'Invalid question.' }, { status: 400 })
  }
  if (Array.isArray(messages) && messages.length > 40) {
    return NextResponse.json({ error: 'Too many messages in conversation.' }, { status: 400 })
  }
  if (userAnswer && userAnswer.length > 5000) {
    return NextResponse.json({ error: 'Answer too long.' }, { status: 400 })
  }

  const safeRole = (role || 'professional').slice(0, 200)
  const safeCompany = (company || 'a company').slice(0, 200)

  const systemPrompt = `You are an expert interview coach helping a candidate prepare for a ${safeRole} role at ${safeCompany}.

Your coaching style:
- Give specific, actionable feedback (not vague encouragement)
- Use STAR method (Situation, Task, Action, Result) framework when evaluating behavioral answers
- Identify concrete strengths and 1-2 specific improvement areas
- Keep feedback concise (3-5 sentences max per response)
- Be warm but direct — like a mentor who wants the candidate to succeed
- When the user has given an answer, always end with a brief "Better version:" example sentence showing how to start a stronger answer

Current interview question being practiced:
"${question}"`

  const conversationMessages = messages?.length > 0 ? messages : userAnswer
    ? [{ role: 'user' as const, content: userAnswer }]
    : [{ role: 'user' as const, content: 'Please give me a tip on how to approach this question.' }]

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-5',
      max_tokens: 512,
      system: systemPrompt,
      messages: conversationMessages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch {
          controller.error(new Error('Stream error'))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    console.error('[interview-chat]', err)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 500 })
  }
}
