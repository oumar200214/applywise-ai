import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

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
    // Validate API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in your .env.local file.', code: 'CONFIG_ERROR' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { jobTitle, companyName, jobDescription, cvText, selectedOutputs, tone, outputLanguage, plan } = body

    if (!jobTitle || !jobDescription || !cvText) {
      return NextResponse.json(
        { error: 'Missing required fields: job title, job description, and CV text are required.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // ── Build Prompt ──────────────────────────────────────────
    const prompt = `You are an elite Career Strategist, ATS Optimization Expert, and Behavioral Psychologist specializing in recruitment. Your goal is to construct the ultimate application package that maximizes the candidate's chances.

## CONTEXT
Job Title: ${jobTitle}
Company: ${companyName || 'Not specified'}
Target Language: ${outputLanguage || 'English'}
Requested Tone: ${tone || 'Professional'}

## JOB DESCRIPTION
${jobDescription}

## RAW CANDIDATE PROFILE
${cvText}

## CORE INSTRUCTIONS

### ⚠️ ABSOLUTE RULE — ZERO HALLUCINATION, MAXIMUM EXPLOITATION ⚠️
You are STRICTLY FORBIDDEN from inventing, fabricating, or hallucinating ANY information that does not appear in the RAW CANDIDATE PROFILE above.
- NEVER invent fake companies, job titles, dates, degrees, universities, skills, certifications, projects, or achievements.
- NEVER add experiences or qualifications the candidate does not have.
- If the candidate has limited experience, work with what they have. A short but honest CV is infinitely better than a fabricated one.

### 📋 MANDATORY CV DATA EXTRACTION CHECKLIST
Before generating ANYTHING, you MUST first extract ALL of the following from the RAW CANDIDATE PROFILE. Use EVERY piece of real data you find:

1. **Full Name** — Extract the candidate's real name exactly as written.
2. **Contact Info** — Email, phone, LinkedIn, GitHub, portfolio, address — include everything provided.
3. **Education** — EVERY degree, university/school name, dates, GPA, honors, relevant coursework — copy them exactly.
4. **Work Experience** — EVERY job: company name, job title, exact dates, responsibilities, and achievements. Reframe bullet points using the XYZ formula but NEVER change the company, title, or dates.
5. **Projects** — EVERY project mentioned: name, technologies used, description, outcomes.
6. **Technical Skills** — EVERY programming language, framework, tool, platform mentioned.
7. **Soft Skills** — EVERY interpersonal skill, leadership experience, or teamwork evidence.
8. **Languages** — EVERY language spoken and proficiency level.
9. **Certifications** — EVERY certification, license, or training.
10. **Volunteering / Extracurriculars** — EVERY volunteer role, club, association.
11. **Publications / Awards** — ANY paper, award, competition, or recognition.

### YOUR JOB IS TO OPTIMIZE, NOT INVENT
Take the REAL data extracted above and:
- Rewrite bullet points to be impactful using the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]"
- Reorder sections to put the most relevant experience for THIS specific job first
- Inject ATS keywords from the job description naturally into the existing real experience
- Highlight transferable skills that match the job requirements
- Quantify achievements where the data supports it (but NEVER invent metrics)

1. THE MATCH SCORE (BRUTALLY HONEST & CONTEXTUAL)
Act as a strict, top-tier recruiter. Calculate a highly accurate, realistic match score (0-100) reflecting the candidate's ACTUAL chances of getting an interview. 
- Do NOT just do simple keyword matching. 
- Analyze market standards: factor in university prestige (e.g., target schools vs non-target for elite industries like Investment Banking), previous company caliber (FAANG, top tier vs unknown), tenure, and career trajectory.
- A candidate with a short CV but elite pedigree applying to a matching elite firm should score higher than a keyword-stuffed CV from an unrelated background. Be completely honest and contextual.

2. THE TAILORED CV (ATS-OPTIMIZED & PERFECT FIT)
Create a CV structure in clean, RAW text format designed to flawlessly parse through any ATS (Taleo, Workday, Greenhouse).
- You MUST include the candidate's REAL name, REAL contact info, REAL education, REAL work experience, REAL projects, REAL skills — everything from the checklist above.
- Reframe and elevate the candidate's ACTUAL experience to construct the "ideal profile" for THIS specific job without fabricating facts.
- Emphasize and aggressively highlight the exact skills and achievements that align with the core needs of the role. Transform weak points into relevant strengths where possible.
- Seamlessly inject critical ATS keywords extracted from the job description. Do not keyword-stuff unnaturally, but ensure maximum ATS density.
- The 'full_cv_text' must be a complete, perfectly formatted RAW text CV containing ALL the candidate's real information, ready to export to .docx.

3. THE COVER LETTER (NATURAL & HYPER-PERSUASIVE)
Write an honest yet extremely persuasive cover letter using the candidate's REAL background:
- Use the candidate's REAL name in the signature.
- Reference their REAL companies, roles, and achievements — not invented ones.
- Hook the reader immediately (skip generic "I am writing to apply..." openings).
- Authority/Credibility: Quickly establish competence with a hard-hitting REAL metric or achievement.
- Liking/Affinity: Show deep, genuine alignment with the company's specific mission, culture, or recent news.
- Scarcity/Uniqueness: Frame the candidate's unique blend of REAL skills and experiences as a rare and highly valuable asset.
- Keep it concise, natural, and compelling.

You MUST respond with ONLY valid JSON (no markdown, no explanation, no code fences). The JSON must match this exact structure:
{
  "match_score": <number 0-100 (realistic, rigorous, and contextual)>,
  "strong_fit_areas": ["area1", "area2", "area3"],
  "missing_skills": ["skill1", "skill2"],
  "ats_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "ai_summary": "<strategic fit summary detailing the brutal truth about their chances and why, considering their background vs the company profile>",
  "recommended_action": "<one-line strategic recommendation to maximize their chances>",
  "tailored_cv": {
    "header_section": "<Name | Title | Contact info in raw parseable format>",
    "summary_section": "<High-impact ATS-optimized professional summary>",
    "education_section": "<Clean, standard ATS format: Degree, School, Year>",
    "experience_section": "<Company - Title - Dates\\n- Bullet points using XYZ formula focusing on perfect-fit traits>",
    "projects_section": "<Relevant projects formatted cleanly>",
    "skills_section": "<Categorized comma-separated skills for perfect ATS parsing>",
    "certifications_section": "<Certifications cleanly formatted>",
    "languages_section": "<Languages cleanly formatted>",
    "full_cv_text": "<The complete, perfectly formatted RAW text CV ready to be exported to .docx without parsing issues>"
  },
  "cover_letter": {
    "opening_paragraph": "<Psychological hook>",
    "body_paragraph_1": "<Authority and exact experience match>",
    "body_paragraph_2": "<Liking, culture fit, and uniqueness>",
    "closing_paragraph": "<Call to action>",
    "full_letter_text": "<Complete cohesive letter>"
  },
  "interview_pack": {
    "general_questions": ["q1", "q2", "q3"],
    "behavioral_questions": ["q1", "q2", "q3"],
    "technical_questions": ["q1", "q2"],
    "company_questions": ["q1", "q2"],
    "suggested_answers": ["a1", "a2", "a3"],
    "star_answers": ["star1", "star2"],
    "questions_to_ask_recruiter": ["q1", "q2", "q3"],
    "interview_summary": "<interview preparation summary>"
  },
  "skill_gap_analysis": {
    "required_skills": ["s1", "s2"],
    "user_skills": ["s1", "s2"],
    "missing_skills": ["s1", "s2"],
    "priority_skills": ["s1"],
    "skill_gap_summary": "<summary>",
    "seven_day_plan": "<day-by-day plan>"
  },
  "course_recommendations": [
    {
      "skill": "<skill name>",
      "reason": "<why this course>",
      "level": "Beginner|Intermediate|Advanced",
      "recommended_search_query": "<search query for finding courses>"
    }
  ]
}

${plan === 'free' ? `
IMPORTANT ACCOUNT LIMITATION (FREE PLAN): 
The user is currently on the FREE tier. You MUST limit the generation significantly to save computational resources. 
- Do NOT generate 'full_cv_text' or 'full_letter_text' (leave them empty strings or put a placeholder like "Upgrade to Premium to view your tailored CV").
- Keep 'interview_pack' questions to exactly 1 question per category.
- Keep 'course_recommendations' to exactly 1 course.
- Keep the 'ai_summary' short and direct.
` : `
ACCOUNT TIER: PREMIUM
Generate the complete and exhaustive response. Do not hold back on the quality, length, and detail of the CV and Cover letter.
`}
`

    // ── Call Anthropic API ─────────────────────────────────────
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
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
