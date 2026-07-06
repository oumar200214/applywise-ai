import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { guardFeature } from '@/lib/plan-guard'
import type { MatchScoreResult } from '@/types/match-score'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // ── Guard plan ────────────────────────────────────────────────────────
    const { allowed, plan } = await guardFeature(user.id, 'match_score')
    if (!allowed) {
      return NextResponse.json(
        { error: `La fonctionnalité Match Score requiert un plan Pro ou Premium. Plan actuel : ${plan}`, code: 'PLAN_REQUIRED' },
        { status: 403 }
      )
    }

    // ── Payload ───────────────────────────────────────────────────────────
    const { userProfile, jobDescription, jobTitle, company } = await req.json()

    if (!userProfile || !jobDescription || !jobTitle) {
      return NextResponse.json(
        { error: 'Champs requis manquants : userProfile, jobDescription, jobTitle' },
        { status: 400 }
      )
    }

    // ── System prompt ─────────────────────────────────────────────────────
    const systemPrompt = `Tu es un expert ATS (Applicant Tracking System) et consultant en recrutement avec 15 ans d'expérience.
Tu analyses la compatibilité entre un profil candidat et une offre d'emploi avec une précision chirurgicale.

RÈGLES D'ANALYSE :
1. Utilise la reconnaissance sémantique : "ML" = "Machine Learning", "JS" = "JavaScript", "LLM" = "Large Language Model", etc.
2. Tiens compte du contexte : 3 ans d'expérience en startup vaut parfois 5 ans en grande entreprise
3. Les compétences transversales (leadership, communication, gestion de projet) ont une vraie valeur
4. Une certification récente peut compenser un manque d'expérience
5. Sois honnête : un score de 45% est utile, ne l'inflate pas artificiellement
6. Différencie les compétences REQUISES (bloquantes) des PRÉFÉRÉES (souhaitables)

SYSTÈME DE PONDÉRATION STRICT :
- Hard Skills techniques : 35 points (poids 0.35)
- Expérience professionnelle (années, secteur, niveau hiérarchique) : 25 points (poids 0.25)
- Formation & éducation (diplôme, école, spécialité) : 15 points (poids 0.15)
- Soft Skills & comportements : 15 points (poids 0.15)
- Langues & outils spécifiques (langues parlées, logiciels, frameworks) : 10 points (poids 0.10)

CALCUL DU SCORE GLOBAL : overallScore = Σ (score_dimension × weight)
GRILLES DE NOTATION :
- A : 85–100 (Excellent fit — candidat prioritaire)
- B : 70–84 (Bon fit — candidat solide)
- C : 55–69 (Fit partiel — worth considering)
- D : 40–54 (Fit faible — gaps importants)
- F : < 40 (Fit très faible — candiat éloigné du profil)

RÉPONDS UNIQUEMENT EN JSON VALIDE selon le schéma MatchScoreResult. Aucun texte avant ou après le JSON.`

    const userMessage = `Analyse ce profil candidat vs cette offre d'emploi.

PROFIL CANDIDAT :
${JSON.stringify(userProfile, null, 2)}

OFFRE D'EMPLOI (${jobTitle}${company ? ` chez ${company}` : ''}) :
${jobDescription}

Retourne un JSON complet respectant EXACTEMENT cette structure TypeScript :

{
  "overallScore": <number 0-100, calculé comme Σ(score × weight)>,
  "grade": <"A" | "B" | "C" | "D" | "F">,
  "dimensions": {
    "hardSkills":     { "score": <0-100>, "weight": 0.35, "weightedScore": <score×0.35>, "details": "<explication>" },
    "softSkills":     { "score": <0-100>, "weight": 0.15, "weightedScore": <score×0.15>, "details": "<explication>" },
    "experience":     { "score": <0-100>, "weight": 0.25, "weightedScore": <score×0.25>, "details": "<explication>" },
    "education":      { "score": <0-100>, "weight": 0.15, "weightedScore": <score×0.15>, "details": "<explication>" },
    "languageTools":  { "score": <0-100>, "weight": 0.10, "weightedScore": <score×0.10>, "details": "<explication>" }
  },
  "matchedSkills": [
    {
      "skill": "<nom de la compétence>",
      "found": <true|false>,
      "synonymsFound": ["<synonyme trouvé si applicable>"],
      "proficiencyLevel": <"beginner"|"intermediate"|"expert"|"not_assessed">,
      "importance": <"required"|"preferred"|"bonus">,
      "gap": <true si compétence requise et non trouvée>
    }
  ],
  "missingRequiredSkills": ["<compétences obligatoires absentes — bloquantes>"],
  "missingPreferredSkills": ["<compétences souhaitées absentes — non bloquantes>"],
  "bonusSkills": ["<compétences du candidat non demandées mais valorisantes>"],
  "recommendations": {
    "certifications": [
      {
        "name": "<nom de la certification>",
        "provider": "<Coursera|Google|AWS|Microsoft|autre>",
        "url": "<URL si connue>",
        "estimatedTime": "<ex: 3 mois>",
        "priority": <"high"|"medium"|"low">,
        "addressesGap": ["<skills comblées>"]
      }
    ],
    "improvements": ["<3 actions concrètes pour améliorer le profil>"],
    "strengths": ["<3 points forts du candidat pour ce poste spécifique>"]
  },
  "analysisDate": "${new Date().toISOString()}",
  "jobTitle": "${jobTitle}",
  "company": "${company ?? ''}"
}`

    // ── Appel Claude ──────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    // Nettoyage au cas où Claude enveloppe dans des backticks
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const result: MatchScoreResult = JSON.parse(cleaned)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[MATCH_SCORE_ERROR]', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Erreur de parsing JSON dans la réponse IA. Veuillez réessayer.', code: 'PARSE_ERROR' },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
