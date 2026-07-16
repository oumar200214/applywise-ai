'use client'

import Link from 'next/link'

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Navigation */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-xl font-black tracking-tight text-primary-container">Postulis</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-primary-container hover:opacity-80 transition-opacity">← Back to Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-[36px] font-bold text-primary mb-2 tracking-tight">Refund Policy</h1>
        <p className="text-sm text-slate-400 mb-12">Last updated: July 7, 2026</p>

        <div className="space-y-10 text-on-surface-variant leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">1. Overview</h2>
            <p>At Postulis (&quot;the Service&quot;, &quot;we&quot;, &quot;us&quot;), we are committed to providing a high-quality AI-powered job application service. This Refund Policy explains under what circumstances refunds may be granted for paid subscriptions and credit purchases.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">2. Free Plan</h2>
            <p>The Free plan is provided at no charge and includes a limited number of AI generations. Since no payment is made, no refund applies to the Free plan.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">3. Paid Subscriptions (Pro & Premium)</h2>
            <p className="mb-4">We offer a <strong>7-day money-back guarantee</strong> on all new paid subscriptions, subject to the conditions below.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refund requests must be submitted within 7 days of the initial subscription purchase.</li>
              <li>Refunds are only available for your <strong>first purchase</strong> of a given plan. Renewals and plan upgrades are not eligible.</li>
              <li>If you have used more than <strong>50% of the AI generation credits</strong> included in your plan during the refund window, your request may be partially or fully declined at our discretion.</li>
              <li>Refunds will not be issued for subscriptions that were suspended or terminated due to a violation of our Terms of Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">4. Subscription Renewals</h2>
            <p>Subscriptions renew automatically at the end of each billing period. We send a reminder email before each renewal. Renewal charges are <strong>non-refundable</strong>. To avoid being charged for a renewal, you must cancel your subscription at least 24 hours before the renewal date via your account settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">5. Service Disruptions</h2>
            <p>If the Service is unavailable for an extended period (more than 48 consecutive hours) due to issues on our end, affected users may be eligible for a pro-rated credit or refund for the period of unavailability. This does not apply to scheduled maintenance or disruptions caused by third-party services (e.g., AI model providers, hosting providers).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">6. How to Request a Refund</h2>
            <p className="mb-4">To request a refund, please contact us by email with the following information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your registered email address</li>
              <li>Your subscription plan and purchase date</li>
              <li>The reason for your refund request</li>
            </ul>
            <p className="mt-4">
              Email:{' '}
              <a href="mailto:contact@postulis.io" className="text-primary-container font-semibold hover:underline">
                contact@postulis.io
              </a>
            </p>
            <p className="mt-2">We aim to respond to all refund requests within <strong>3 business days</strong>. Approved refunds are processed within 5–10 business days and credited back to the original payment method.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">7. Chargebacks</h2>
            <p>Filing a chargeback without first contacting us may result in the permanent suspension of your account. We encourage you to reach out to our support team first — we are committed to resolving any billing issues quickly and fairly.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">8. Changes to This Policy</h2>
            <p>We reserve the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated date. Your continued use of the Service after changes are posted constitutes your acceptance of the revised policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">9. Contact</h2>
            <p>
              For any questions regarding this policy, please contact us at{' '}
              <a href="mailto:contact@postulis.io" className="text-primary-container font-semibold hover:underline">
                contact@postulis.io
              </a>
              .
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 mt-12">
        <div className="max-w-3xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">© 2026 Postulis. All rights reserved.</p>
          <div className="flex gap-6 text-xs">
            <Link href="/privacy" className="text-slate-500 hover:text-slate-800 transition-colors font-medium">Privacy Policy</Link>
            <Link href="/terms" className="text-slate-500 hover:text-slate-800 transition-colors font-medium">Terms of Service</Link>
            <Link href="/refund-policy" className="text-slate-500 hover:text-slate-800 transition-colors font-medium">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
