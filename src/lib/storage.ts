/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Postulis — localStorage Data Persistence
 * 
 * Provides typed CRUD operations for all application data.
 * Uses 'postulis_' prefix to avoid key collisions.
 * 
 * This is a temporary bridge until Supabase DB tables are configured.
 * Each function can be swapped for a Supabase call later.
 */

let PREFIX = 'postulis_'

export function setStorageUserId(userId: string | null) {
  PREFIX = userId ? `postulis_${userId}_` : 'postulis_'
}

// ─── Helpers ────────────────────────────────────────────────

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setItem(key: string, value: any): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage write failed:', e)
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}

// ─── Application Types ──────────────────────────────────────

export interface StoredApplication {
  id: string
  userId: string
  jobTitle: string
  companyName: string
  jobDescription: string
  jobUrl?: string
  country?: string
  jobType?: string
  cvText: string
  selectedOutputs: string[]
  tone: string
  outputLanguage: string
  status: 'draft' | 'generating' | 'generated' | 'error'
  matchScore?: number
  strongFitAreas?: string[]
  missingSkills?: string[]
  atsKeywords?: string[]
  aiSummary?: string
  recommendedAction?: string
  createdAt: string
  updatedAt: string
}

export interface StoredResult {
  applicationId: string
  data: any // AIGenerationResponse
  tokensUsed?: number
  generatedAt: string
}

export interface StoredProfile {
  fullName: string
  email: string
  role: string
  educationLevel: string
  fieldOfStudy: string
  targetIndustries: string[]
  targetRegions: string[]
  languagePreference: string
  preferredTone: string
  preferredCvStyle: string
  onboardingCompleted: boolean
  avatarUrl?: string
  plan?: 'free' | 'pro' | 'premium'
}

export interface TrackerEntry {
  id: string
  applicationId: string
  jobTitle: string
  companyName: string
  matchScore?: number
  status: 'draft' | 'ready' | 'applied' | 'interview' | 'rejected' | 'offer'
  deadline?: string
  dateApplied?: string
  notes?: string
  docsReady: boolean
  createdAt: string
  updatedAt: string
}

// ─── Applications CRUD ──────────────────────────────────────

export function saveApplication(app: StoredApplication): void {
  const apps = getApplications()
  const index = apps.findIndex(a => a.id === app.id)
  if (index >= 0) {
    apps[index] = { ...app, updatedAt: new Date().toISOString() }
  } else {
    apps.unshift(app) // newest first
  }
  setItem('applications', apps)
}

export function getApplications(): StoredApplication[] {
  return getItem<StoredApplication[]>('applications', [])
}

export function getApplication(id: string): StoredApplication | null {
  const apps = getApplications()
  return apps.find(a => a.id === id) || null
}

export function updateApplication(id: string, updates: Partial<StoredApplication>): void {
  const apps = getApplications()
  const index = apps.findIndex(a => a.id === id)
  if (index >= 0) {
    apps[index] = { ...apps[index], ...updates, updatedAt: new Date().toISOString() }
    setItem('applications', apps)
  }
}

export function deleteApplication(id: string): void {
  const apps = getApplications().filter(a => a.id !== id)
  setItem('applications', apps)
}

// ─── AI Generation Results ──────────────────────────────────

export function saveGenerationResult(result: StoredResult): void {
  const results = getItem<StoredResult[]>('results', [])
  const index = results.findIndex(r => r.applicationId === result.applicationId)
  if (index >= 0) {
    results[index] = result
  } else {
    results.unshift(result)
  }
  setItem('results', results)
}

export function getGenerationResult(applicationId: string): StoredResult | null {
  const results = getItem<StoredResult[]>('results', [])
  return results.find(r => r.applicationId === applicationId) || null
}

// ─── User Profile ───────────────────────────────────────────

const DEFAULT_PROFILE: StoredProfile = {
  fullName: '',
  email: '',
  role: '',
  educationLevel: '',
  fieldOfStudy: '',
  targetIndustries: [],
  targetRegions: [],
  languagePreference: 'en',
  preferredTone: 'Professional',
  preferredCvStyle: 'Modern',
  onboardingCompleted: false,
  plan: 'free',
}

export function getUserProfile(): StoredProfile {
  return getItem<StoredProfile>('profile', DEFAULT_PROFILE)
}

export function updateUserProfile(updates: Partial<StoredProfile>): void {
  const profile = getUserProfile()
  setItem('profile', { ...profile, ...updates })
}

export function isOnboardingCompleted(): boolean {
  return getUserProfile().onboardingCompleted
}

export function isPremiumUser(): boolean {
  return getUserProfile().plan === 'premium'
}

// ─── Credits System ─────────────────────────────────────────

const FREE_PLAN_MAX_CREDITS = 3

/** Check if user has a paid plan (pro or premium) = unlimited generations */
export function hasPaidPlan(): boolean {
  const profile = getUserProfile()
  return profile.plan === 'pro' || profile.plan === 'premium'
}

/** Get remaining credits. Paid plans return Infinity. */
export function getCredits(): number {
  if (hasPaidPlan()) return Infinity
  return getItem<number>('credits', FREE_PLAN_MAX_CREDITS)
}

/** Overwrite the stored credit count (used to sync from Supabase). */
export function setCredits(amount: number): void {
  setItem('credits', amount)
}

/** Check if the user can generate (has credits or paid plan) */
export function canGenerate(): boolean {
  if (hasPaidPlan()) return true
  return getCredits() > 0
}

/** Deduct 1 credit. Returns false if no credits left (free plan only). */
export function deductCredit(): boolean {
  // Paid plans: unlimited, no deduction needed
  if (hasPaidPlan()) {
    // Still log the transaction for tracking
    const transactions = getItem<any[]>('credit_transactions', [])
    transactions.unshift({
      id: generateId(),
      type: 'used',
      amount: 0,
      reason: 'AI Application Generation (Paid Plan — Unlimited)',
      createdAt: new Date().toISOString(),
    })
    setItem('credit_transactions', transactions)
    return true
  }

  // Free plan: deduct from limited pool
  const current = getCredits()
  if (current <= 0) return false
  setItem('credits', current - 1)

  // Log transaction
  const transactions = getItem<any[]>('credit_transactions', [])
  transactions.unshift({
    id: generateId(),
    type: 'used',
    amount: -1,
    reason: 'AI Application Generation',
    createdAt: new Date().toISOString(),
  })
  setItem('credit_transactions', transactions)

  return true
}

export function addCredits(amount: number, reason: string = 'Purchase'): void {
  const current = getItem<number>('credits', FREE_PLAN_MAX_CREDITS)
  setItem('credits', current + amount)

  const transactions = getItem<any[]>('credit_transactions', [])
  transactions.unshift({
    id: generateId(),
    type: 'added',
    amount,
    reason,
    createdAt: new Date().toISOString(),
  })
  setItem('credit_transactions', transactions)
}

export function getCreditTransactions(): any[] {
  return getItem<any[]>('credit_transactions', [])
}

// ─── Tracker ────────────────────────────────────────────────

export function getTrackerEntries(): TrackerEntry[] {
  return getItem<TrackerEntry[]>('tracker', [])
}

export function addTrackerEntry(entry: Omit<TrackerEntry, 'id' | 'createdAt' | 'updatedAt'>): TrackerEntry {
  const entries = getTrackerEntries()
  const newEntry: TrackerEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  entries.unshift(newEntry)
  setItem('tracker', entries)
  return newEntry
}

export function updateTrackerEntry(id: string, updates: Partial<TrackerEntry>): void {
  const entries = getTrackerEntries()
  const index = entries.findIndex(e => e.id === id)
  if (index >= 0) {
    entries[index] = { ...entries[index], ...updates, updatedAt: new Date().toISOString() }
    setItem('tracker', entries)
  }
}

export function deleteTrackerEntry(id: string): void {
  const entries = getTrackerEntries().filter(e => e.id !== id)
  setItem('tracker', entries)
}

// ─── Dashboard Stats (Computed) ─────────────────────────────

export interface DashboardStats {
  totalApplications: number
  creditsRemaining: number
  avgMatchScore: number
  interviewRate: number
  weeklyGrowth: number
}

export function getDashboardStats(): DashboardStats {
  const apps = getApplications()
  const tracker = getTrackerEntries()
  const credits = getCredits()

  const generatedApps = apps.filter(a => a.status === 'generated')
  const scores = generatedApps.map(a => a.matchScore || 0).filter(s => s > 0)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  const interviewCount = tracker.filter(t => ['interview', 'offer'].includes(t.status)).length
  const appliedCount = tracker.filter(t => t.status !== 'draft' && t.status !== 'ready').length
  const interviewRate = appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0

  // Count apps created in last 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const weeklyGrowth = apps.filter(a => a.createdAt > oneWeekAgo).length

  return {
    totalApplications: apps.length,
    creditsRemaining: credits,
    avgMatchScore: avgScore,
    interviewRate,
    weeklyGrowth,
  }
}
