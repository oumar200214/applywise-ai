'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Navigation */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-xl font-black tracking-tight text-primary-container">ApplyWise AI</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-primary-container hover:opacity-80 transition-opacity">← Back to Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-[36px] font-bold text-primary mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-12">Last updated: June 18, 2025</p>

        <div className="space-y-10 text-on-surface-variant leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using ApplyWise AI (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service. We reserve the right to update these terms at any time, and your continued use of the Service constitutes acceptance of any modifications.</p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">2. Description of Service</h2>
            <p>ApplyWise AI is an AI-powered job application assistant that helps users generate tailored CVs, cover letters, interview preparation materials, and skill gap analyses based on job descriptions and user-provided profile information. The Service uses third-party AI models (including Anthropic&apos;s Claude) to generate content.</p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must be at least 16 years old to use the Service.</li>
              <li>One person may not maintain more than one free account.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">4. Free and Paid Plans</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Free Plan:</strong> Limited to 3 AI-generated application packs. No credit card required.</li>
              <li><strong>Pro Plan:</strong> Unlimited generations, advanced features. Billed monthly or annually.</li>
              <li><strong>Premium Plan:</strong> All Pro features plus unlimited interview simulations and priority support.</li>
              <li>Paid subscriptions are processed through Dodo Payments. Refund policies are subject to Dodo Payments&apos; terms.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">5. Acceptable Use</h2>
            <p className="mb-3">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service to generate fraudulent, misleading, or deceptive application materials.</li>
              <li>Submit false information or impersonate another person.</li>
              <li>Attempt to reverse-engineer, decompile, or extract the AI prompts or algorithms.</li>
              <li>Use automated tools (bots, scrapers) to access the Service.</li>
              <li>Resell, redistribute, or commercially exploit generated content without authorization.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">6. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Content you provide (CV text, profile information) remains your property.</li>
              <li>AI-generated outputs (tailored CVs, cover letters, etc.) are licensed to you for personal, non-commercial use related to job applications.</li>
              <li>The ApplyWise AI brand, logo, design, and underlying technology remain our exclusive property.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">7. AI-Generated Content Disclaimer</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
              <p><strong>Important:</strong> AI-generated content is provided &quot;as is&quot; for assistance purposes only. While we strive for accuracy, the AI may occasionally produce imperfect results. You are solely responsible for reviewing, editing, and verifying all generated content before submitting it to employers. ApplyWise AI does not guarantee job placement or interview outcomes.</p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, ApplyWise AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, employment opportunities, or goodwill, arising out of or in connection with your use of the Service.</p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">9. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time for violation of these Terms. Upon termination, your right to use the Service ceases immediately. You may delete your account at any time from the Settings page.</p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">10. Contact</h2>
            <p>For questions about these Terms, please contact us at <a href="mailto:support@applywise.ai" className="text-primary-container font-semibold hover:underline">support@applywise.ai</a>.</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/terms" className="hover:text-primary transition-colors font-semibold">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors font-semibold">Privacy Policy</Link>
          <Link href="/pricing" className="hover:text-primary transition-colors font-semibold">Pricing</Link>
        </div>
        <p>© {new Date().getFullYear()} ApplyWise AI. All rights reserved.</p>
      </footer>
    </div>
  )
}
