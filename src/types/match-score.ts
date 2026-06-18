export interface SkillMatch {
  skill: string
  found: boolean
  synonymsFound: string[]       // ex: "ML" trouvé pour "Machine Learning"
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert' | 'not_assessed'
  importance: 'required' | 'preferred' | 'bonus'
  gap: boolean
}

export interface DimensionScore {
  score: number         // 0–100
  weight: number        // 0–1
  weightedScore: number
  details: string
}

export interface CertificationRec {
  name: string
  provider: string              // ex: "Coursera", "Google", "AWS"
  url?: string
  estimatedTime: string         // ex: "3 mois"
  priority: 'high' | 'medium' | 'low'
  addressesGap: string[]        // skills comblées par cette certif
}

export interface MatchScoreResult {
  // Score global (0–100)
  overallScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'

  // Dimensions pondérées
  dimensions: {
    hardSkills: DimensionScore      // poids: 35%
    softSkills: DimensionScore      // poids: 15%
    experience: DimensionScore      // poids: 25%
    education: DimensionScore       // poids: 15%
    languageTools: DimensionScore   // poids: 10%
  }

  // Analyse des compétences
  matchedSkills: SkillMatch[]
  missingRequiredSkills: string[]   // Bloquants → gap critique
  missingPreferredSkills: string[]  // Non bloquants → gap secondaire
  bonusSkills: string[]             // Compétences valorisantes non demandées

  // Recommandations
  recommendations: {
    certifications: CertificationRec[]
    improvements: string[]
    strengths: string[]
  }

  // Méta
  analysisDate: string
  jobTitle: string
  company?: string
}
