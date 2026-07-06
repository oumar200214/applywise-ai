import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/plan-guard'

// Edge Runtime: I/O wait time (Anthropic API) does NOT count against CPU budget.
// This lets long generations (30-90s) complete even on Vercel Hobby plan.
export const runtime = 'edge'
export const maxDuration = 60

// ─── Anthropic Client ───────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── Helper: Categorize Anthropic Errors ────────────────────
function categorizeError(error: unknown): { message: string; code: string; status: number } {
  if (error instanceof Anthropic.APIError) {
    const body = error.error as { error?: { type?: string; message?: string } } | undefined
    const apiMessage = body?.error?.message || error.message
    const apiType = body?.error?.type || ''

    // Credit / billing issues
    if (apiMessage.toLowerCase().includes('credit balance') || apiMessage.toLowerCase().includes('billing')) {
      return {
        message: 'Anthropic API credits exhausted. Please add credits at console.anthropic.com to resume AI generation.',
        code: 'CREDITS_EXHAUSTED',
        status: 402,
      }
    }

    // Authentication issues
    if (error.status === 401 || apiType === 'authentication_error') {
      return {
        message: 'Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY in .env.local.',
        code: 'AUTH_ERROR',
        status: 401,
      }
    }

    // Rate limiting
    if (error.status === 429 || apiType === 'rate_limit_error') {
      return {
        message: 'AI rate limit reached. Please wait a moment and try again.',
        code: 'RATE_LIMITED',
        status: 429,
      }
    }

    // Model not found
    if (apiType === 'not_found_error' || apiMessage.toLowerCase().includes('model')) {
      return {
        message: 'AI model not available. The system will be updated shortly.',
        code: 'MODEL_ERROR',
        status: 404,
      }
    }

    // Overloaded
    if (error.status === 529 || apiType === 'overloaded_error') {
      return {
        message: 'Anthropic API is currently overloaded. Please try again in a few minutes.',
        code: 'OVERLOADED',
        status: 503,
      }
    }

    // Generic API error
    return {
      message: `AI service error: ${apiMessage}`,
      code: 'API_ERROR',
      status: error.status || 500,
    }
  }

  // JSON parsing error
  if (error instanceof SyntaxError) {
    return {
      message: 'Failed to parse AI response. Please try again.',
      code: 'PARSE_ERROR',
      status: 500,
    }
  }

  // Unknown error
  const msg = error instanceof Error ? error.message : 'Unknown error'
  return {
    message: `Generation failed: ${msg}`,
    code: 'UNKNOWN_ERROR',
    status: 500,
  }
}

// ─── Helper: Extract JSON from AI response ──────────────────
function extractJSON(text: string): Record<string, unknown> {
  // 1. Try to find JSON inside markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim())
  }

  // 2. Try to extract the outermost { ... } block
  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (braceMatch) {
    return JSON.parse(braceMatch[0])
  }

  // 3. Try parsing the entire text as JSON
  return JSON.parse(text)
}

// ─── POST Handler ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Validate API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in your .env.local file.', code: 'CONFIG_ERROR' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { jobTitle, companyName, jobDescription, cvText, tone, outputLanguage } = body

    if (!jobTitle || !jobDescription || !cvText) {
      return NextResponse.json(
        { error: 'Missing required fields: job title, job description, and CV text are required.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Input size caps to prevent token abuse
    if (jobDescription.length > 20000 || cvText.length > 20000) {
      return NextResponse.json(
        { error: 'Input too large. Job description and CV must be under 20,000 characters each.', code: 'INPUT_TOO_LARGE' },
        { status: 400 }
      )
    }

    // ── Server-side plan lookup (never trust client) ───────────
    const plan = await getUserPlan(user.id)

    // ── Build Prompt ──────────────────────────────────────────
    const prompt = `You are an elite Career Strategist, ATS Optimization Expert, and Executive Recruiter with 20+ years of experience placing candidates at FAANG, McKinsey, Goldman Sachs, and top-tier firms worldwide. Your goal: produce the OPTIMAL, COMPLETE application package that gives the candidate the maximum competitive edge.

## CONTEXT
Job Title: ${jobTitle}
Company: ${companyName || 'Not specified'}
Target Language for CV & Letter: ${outputLanguage || 'English'}
Requested Tone: ${tone || 'Professional'}

## JOB DESCRIPTION
${jobDescription}

## RAW CANDIDATE PROFILE
${cvText}

---

## ⚠️ ABSOLUTE RULE — ZERO HALLUCINATION, MAXIMUM EXPLOITATION ⚠️
You are STRICTLY FORBIDDEN from inventing ANY information not present in the RAW CANDIDATE PROFILE.
- NEVER invent companies, job titles, dates, degrees, schools, skills, certifications, projects, or metrics.
- If the candidate has limited experience, make every real piece of data shine — a short honest CV beats a fabricated one.
- You MAY reframe, reword, and elevate existing real data. You may NOT create new facts.

---

## STEP 1 — MANDATORY DATA EXTRACTION
Before generating, extract ALL of the following from the RAW CANDIDATE PROFILE:
1. Full legal name (exactly as written)
2. ALL contact details: email, phone, LinkedIn, GitHub, portfolio, city/country
3. ALL work experiences: company name, exact job title, exact dates (month/year), ALL responsibilities mentioned
4. ALL education: degree name, institution, graduation year, GPA if mentioned, honors, relevant courses
5. ALL projects: name, technologies, outcomes, dates
6. ALL technical skills: languages, frameworks, tools, platforms, cloud services, databases
7. ALL soft skills and leadership evidence
8. ALL languages with proficiency levels
9. ALL certifications, licenses, training
10. ALL volunteering, extracurriculars, associations, awards

---

## STEP 2 — CV GENERATION (PREMIUM QUALITY — ATS-OPTIMIZED)

### MANDATORY EXPERIENCE FORMAT — FOLLOW EXACTLY:
For EACH work experience, write in this PRECISE format (the parser depends on it):
**[Company Name]** | [Job Title] | [Month Year] – [Month Year or Présent/Present]
• [Achievement using XYZ: "Accomplished X measured by Y by doing Z" — quantify when data supports it]
• [Achievement 2 — inject a relevant ATS keyword from the job description naturally]
• [Achievement 3 — emphasize transferable skill matching the role]
• [Achievement 4]
• [Achievement 5 — minimum 3 bullets, maximum 6 per role]

Rules:
- ENRICH sparse bullet points using contextual inference but NEVER invent facts
- REORDER experiences so the most relevant one appears FIRST
- Each bullet must contain at least one ATS keyword from the job description where genuinely applicable

### MANDATORY EDUCATION FORMAT:
**[Degree/Diploma]** — [Institution Name] | [Year or Year Range]
[Relevant coursework / GPA / honors / distinction if provided]

### MANDATORY SKILLS FORMAT — CATEGORIZED:
Compétences techniques : [comma-separated: languages, frameworks, libraries]
Outils & Plateformes : [tools, cloud, databases, IDEs, software]
Méthodes : [Agile, Scrum, Lean, CI/CD etc if applicable]
Compétences transversales : [leadership, communication, etc]

(Adapt category names to the target language if not French)

### SUMMARY REQUIREMENTS:
Write 4-5 powerful sentences:
1. Hook: value proposition tied to THIS specific role
2. Experience overview: years + domain expertise
3. Key technical match: 2-3 skills from JD that the candidate genuinely has
4. Differentiator: what makes this candidate stand out for THIS company
5. Forward-looking: eagerness + alignment with company mission

### CONTENT VOLUME REQUIREMENT:
The CV must fill a minimum of 2 FULL A4 PAGES (approximately 3,500+ characters across all sections).
Generate comprehensive, detailed content — not bare minimum.

---

## STEP 3 — MATCH SCORE (BRUTALLY HONEST)
Calculate a rigorous, contextual score (0-100) based on:
- Keyword match between candidate skills and JD requirements
- Seniority alignment (years of experience vs. required level)
- Company/university prestige caliber for the target company
- Career trajectory fit (is this a natural progression?)
- Missing critical requirements that are hard to compensate

---

## STEP 4 — COVER LETTER (HYPER-PERSUASIVE)
- Use REAL name in signature, REAL companies and achievements
- Skip generic openings — start with a powerful hook
- Apply Cialdini's principles: Authority, Liking, Scarcity
- Maximum 4 paragraphs, natural and compelling

---

You MUST respond with ONLY valid JSON (no markdown, no explanation, no code fences). Exact structure:
{
  "match_score": <number 0-100>,
  "strong_fit_areas": ["area1", "area2", "area3", "area4"],
  "missing_skills": ["skill1", "skill2"],
  "ats_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
  "ai_summary": "<strategic fit summary — honest, contextual, specific>",
  "recommended_action": "<one concrete strategic action to maximize chances>",
  "tailored_cv": {
    "header_section": "<Full Name on first line, then contact details on subsequent lines: email | phone | LinkedIn | city>",
    "summary_section": "<4-5 sentence high-impact ATS-optimized professional summary>",
    "education_section": "<Each degree on its own entry using the MANDATORY FORMAT above>",
    "experience_section": "<ALL experiences using the MANDATORY FORMAT above — minimum 3 bullets per role>",
    "projects_section": "<Each project: Name | Technologies | Year\\n• Outcome/achievement bullet points>",
    "skills_section": "<Using the MANDATORY CATEGORIZED FORMAT above>",
    "certifications_section": "<One certification per line: Name — Issuer — Year>",
    "languages_section": "<One language per line: Language — Proficiency level>",
    "full_cv_text": "<Complete perfectly formatted raw text version of the entire CV, ready for DOCX export>"
  },
  "cover_letter": {
    "opening_paragraph": "<Powerful psychological hook — not 'I am writing to apply'>",
    "body_paragraph_1": "<Authority: credibility via real metric or elite achievement>",
    "body_paragraph_2": "<Liking + Scarcity: cultural fit + unique value proposition>",
    "closing_paragraph": "<Confident call to action>",
    "full_letter_text": "<Complete cohesive letter as single flowing text>"
  },
  "interview_pack": {
    "general_questions": ["q1", "q2", "q3", "q4"],
    "behavioral_questions": ["q1", "q2", "q3", "q4"],
    "technical_questions": ["q1", "q2", "q3"],
    "company_questions": ["q1", "q2", "q3"],
    "suggested_answers": ["a1", "a2", "a3"],
    "star_answers": ["SITUATION: ... ACTION: ... RESULT: ...", "SITUATION: ... ACTION: ... RESULT: ..."],
    "questions_to_ask_recruiter": ["q1", "q2", "q3"],
    "interview_summary": "<preparation summary with key focus areas>"
  },
  "skill_gap_analysis": {
    "required_skills": ["s1", "s2", "s3"],
    "user_skills": ["s1", "s2"],
    "missing_skills": ["s1", "s2"],
    "priority_skills": ["s1"],
    "skill_gap_summary": "<honest gap analysis with actionable next steps>",
    "seven_day_plan": "<Day 1: ... Day 2: ... Day 3: ... Day 4: ... Day 5: ... Day 6-7: ...>"
  },
  "course_recommendations": [
    {
      "skill": "<skill name>",
      "reason": "<why this matters for this specific role>",
      "level": "Beginner|Intermediate|Advanced",
      "recommended_search_query": "<optimized YouTube/Udemy search query>"
    }
  ]
}

${plan === 'free' ? `
ACCOUNT TIER: FREE
Limit generation to save resources:
- Set full_cv_text and full_letter_text to "" (empty)
- 1 question per interview category only
- 1 course recommendation only
- Keep ai_summary to 2 sentences
- Keep experience bullets to 2 per role max
` : `
ACCOUNT TIER: PRO/PREMIUM — Generate a COMPLETE, EXHAUSTIVE, TOP-QUALITY response.
- Every experience entry must have 4-6 detailed bullet points
- The full_cv_text must be the complete formatted CV (all sections)
- The full_letter_text must be the complete cover letter
- Be comprehensive, specific, and deeply tailored to the exact JD and company
`}
`

    // ── Call Anthropic API ─────────────────────────────────────
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 16384,
      messages: [{ role: 'user', content: prompt }],
    })

    // ── Extract text content ──────────────────────────────────
    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'No text response from AI. Please try again.', code: 'EMPTY_RESPONSE' },
        { status: 500 }
      )
    }

    // ── Parse JSON from response ──────────────────────────────
    let result: Record<string, unknown>
    try {
      result = extractJSON(textContent.text)
    } catch {
      console.error('JSON Parse Error. Raw AI response (first 500 chars):', textContent.text.substring(0, 500))
      return NextResponse.json(
        { error: 'Failed to parse AI response. The AI returned malformed data. Please try again.', code: 'PARSE_ERROR' },
        { status: 500 }
      )
    }

    // ── Check for truncated response (stop_reason) ────────────
    if (message.stop_reason === 'max_tokens') {
      console.warn('AI response was truncated due to max_tokens limit.')
      // Still return partial data with a warning
      return NextResponse.json({
        success: true,
        data: result,
        tokens_used: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
        warning: 'Response was partially truncated. Some sections may be incomplete.',
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
      tokens_used: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
    })
  } catch (error: unknown) {
    console.error('AI Generation Error:', error)
    const categorized = categorizeError(error)
    return NextResponse.json(
      { error: categorized.message, code: categorized.code },
      { status: categorized.status }
    )
  }
}
