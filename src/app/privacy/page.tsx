'use client'

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Navigation */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-xl font-black tracking-tight text-primary-container">Postulis</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-primary-container hover:opacity-80 transition-opacity">â† Back to Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-[36px] font-bold text-primary mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-12">Last updated: June 18, 2025</p>

        <div className="space-y-10 text-on-surface-variant leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">1. Introduction</h2>
            <p>Postulis (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal information when you use our AI-powered job application assistant.</p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">2. Information We Collect</h2>
            <h3 className="text-sm font-bold text-primary-container mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Data:</strong> Full name, email address, and password when you create an account.</li>
              <li><strong>CV / Profile Data:</strong> Resume text, work experience, education, skills, and other professional information you provide for AI generation.</li>
              <li><strong>Job Descriptions:</strong> Text of job postings you submit for analysis.</li>
              <li><strong>Preferences:</strong> Language, tone, output format, and other settings.</li>
            </ul>

            <h3 className="text-sm font-bold text-primary-container mt-4 mb-2">2.2 Automatically Collected Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, generation counts, and interaction patterns.</li>
              <li><strong>Device Data:</strong> Browser type, operating system, screen resolution, and IP address.</li>
              <li><strong>Cookies:</strong> Authentication tokens and session cookies necessary for the Service to function.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Delivery:</strong> To generate tailored CVs, cover letters, interview prep, and skill gap analyses.</li>
              <li><strong>Account Management:</strong> To authenticate you, manage your subscription, and provide customer support.</li>
              <li><strong>Improvement:</strong> To analyze usage patterns and improve the Service (aggregated, anonymized data only).</li>
              <li><strong>Communication:</strong> To send transactional emails (confirmations, billing) and, with your consent, product updates.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">4. AI Processing & Third-Party Services</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm mb-4">
              <p><strong>Important:</strong> When you generate application materials, your CV text and job descriptions are sent to Anthropic&apos;s Claude API for AI processing. This data is transmitted securely and is subject to <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-container font-semibold hover:underline">Anthropic&apos;s Privacy Policy</a>. Anthropic does not use your data to train their AI models.</p>
            </div>
            <p className="mb-3">We also use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> Authentication and database (hosted in the EU/US).</li>
              <li><strong>Dodo Payments:</strong> Payment processing. We do not store your credit card details.</li>
              <li><strong>Vercel:</strong> Hosting and infrastructure.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">5. Data Storage & Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data is stored securely on Supabase with encryption at rest and in transit.</li>
              <li>Application data (CVs, generated content) is stored locally in your browser (localStorage) and is not transmitted to our servers unless you explicitly generate content.</li>
              <li>We use HTTPS/TLS encryption for all data transmissions.</li>
              <li>We implement industry-standard security measures including access controls, monitoring, and regular security reviews.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">6. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Data:</strong> Retained for as long as your account is active. Deleted within 30 days of account deletion.</li>
              <li><strong>Generated Content:</strong> Stored locally in your browser. You can clear it at any time from Settings.</li>
              <li><strong>AI Processing:</strong> CV text and job descriptions sent to the AI are not stored by us after generation is complete. They are processed in memory only.</li>
              <li><strong>Payment Records:</strong> Retained for 7 years as required by financial regulations.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">7. Your Rights (GDPR / CCPA)</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the following rights:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: 'visibility', title: 'Right to Access', desc: 'Request a copy of your personal data.' },
                { icon: 'edit', title: 'Right to Rectification', desc: 'Correct inaccurate or incomplete data.' },
                { icon: 'delete', title: 'Right to Erasure', desc: 'Request deletion of your data.' },
                { icon: 'download', title: 'Right to Portability', desc: 'Export your data in a standard format.' },
                { icon: 'block', title: 'Right to Object', desc: 'Object to certain processing activities.' },
                { icon: 'gavel', title: 'Right to Complain', desc: 'Lodge a complaint with a supervisory authority.' },
              ].map(r => (
                <div key={r.title} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary-container text-lg">{r.icon}</span>
                    <h4 className="text-sm font-bold text-primary">{r.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500">{r.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm">To exercise any of these rights, contact us at <a href="mailto:privacy@postulis.io" className="text-primary-container font-semibold hover:underline">privacy@postulis.io</a>.</p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">8. Cookies</h2>
            <p>We use only essential cookies required for authentication and session management. We do not use advertising or tracking cookies. No third-party analytics cookies are used without your explicit consent.</p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">9. Children&apos;s Privacy</h2>
            <p>Our Service is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If you believe a child has provided us with personal data, please contact us immediately.</p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the Service or by email. Your continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">11. Contact Us</h2>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <p className="mb-2">For any privacy-related questions or requests:</p>
              <p className="text-sm"><strong>Email:</strong> <a href="mailto:privacy@postulis.io" className="text-primary-container font-semibold hover:underline">privacy@postulis.io</a></p>
              <p className="text-sm"><strong>Support:</strong> <a href="mailto:support@postulis.io" className="text-primary-container font-semibold hover:underline">support@postulis.io</a></p>
            </div>
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
        <p>Â© {new Date().getFullYear()} Postulis. All rights reserved.</p>
      </footer>
    </div>
  )
}
