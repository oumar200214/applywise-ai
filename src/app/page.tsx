import Link from 'next/link'

export const metadata = {
  title: 'ApplyWise AI — AI-Powered Job Application Assistant',
  description: 'Turn any job post into a tailored CV, cover letter, interview prep, and skill gap analysis. Built for students and young professionals.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Navigation */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-xl font-black tracking-tight text-primary-container">ApplyWise AI</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a className="text-slate-500 hover:text-primary transition-colors px-3 py-2 rounded-lg text-sm font-semibold" href="#features">Features</a>
            <Link className="text-slate-500 hover:text-primary transition-colors px-3 py-2 rounded-lg text-sm font-semibold" href="/pricing">Pricing</Link>
            <a className="text-slate-500 hover:text-primary transition-colors px-3 py-2 rounded-lg text-sm font-semibold" href="#testimonials">Testimonials</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="text-primary-container text-sm font-semibold hover:opacity-80 transition-opacity px-4 py-2">
              Login
            </Link>
            <Link href="/auth?mode=signup" className="bg-primary-container text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/10">
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-surface-container-low to-surface-container">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-tertiary-container/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-container/10 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-container/20 text-secondary rounded-full text-xs font-bold border border-secondary-container/30">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Powered by Advanced AI
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary leading-tight tracking-tight">
              Your AI career assistant.{' '}
              <span className="bg-gradient-to-r from-tertiary-container to-secondary bg-clip-text text-transparent">
                Land your dream job.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Paste a job offer, add your CV, and let our AI generate a tailored application pack — CV, cover letter, interview questions, and skill analysis — in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth?mode=signup"
                className="bg-primary-container text-white px-8 py-3.5 rounded-xl text-base font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/15 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">rocket_launch</span>
                Start Free — No credit card
              </Link>
              <a href="#how-it-works" className="text-primary-container px-6 py-3.5 rounded-xl text-base font-bold hover:bg-slate-50 transition-all flex items-center gap-2 border border-slate-200">
                <span className="material-symbols-outlined text-xl">play_circle</span>
                See how it works
              </a>
            </div>
            <p className="text-xs text-slate-400">✓ 1 free generation  ✓ No credit card  ✓ Your data stays private</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-[1440px] mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">How ApplyWise AI Works</h2>
          <p className="text-on-surface-variant text-lg max-w-xl mx-auto">Three simple steps to a complete application pack.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 text-center group hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <div className="w-14 h-14 bg-primary-fixed rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-primary-container text-3xl">content_paste</span>
            </div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-primary-container text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <h3 className="text-xl font-bold text-primary mb-3">Paste the Job Offer</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">Copy the job description and paste it into ApplyWise. We automatically extract key requirements, skills, and company info.</p>
          </div>
          {/* Step 2 */}
          <div className="relative bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 text-center group hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <div className="w-14 h-14 bg-secondary-container/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-secondary text-3xl">upload_file</span>
            </div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-primary-container text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <h3 className="text-xl font-bold text-primary mb-3">Add Your CV</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">Upload your CV or paste your profile. ApplyWise extracts your skills, experience, and education to match against the job.</p>
          </div>
          {/* Step 3 */}
          <div className="relative bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 text-center group hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <div className="w-14 h-14 bg-tertiary-fixed/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-tertiary-container text-3xl">auto_awesome</span>
            </div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-primary-container text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <h3 className="text-xl font-bold text-primary mb-3">Get Your Pack</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">AI generates a tailored CV, cover letter, interview prep, ATS keywords, and skill gap analysis — ready to use.</p>
          </div>
        </div>
      </section>

      {/* Features Section — Bento Grid */}
      <section id="features" className="bg-surface-container-low py-20 md:py-28">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Everything you need to land the job</h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto">AI-powered tools designed specifically for students and early-career professionals.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Feature 1 - Large */}
            <div className="md:col-span-7 bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-fixed/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-white text-2xl">description</span>
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">AI-Tailored CV</h3>
                <p className="text-on-surface-variant leading-relaxed">Our AI rewrites your CV for each specific job, injecting relevant ATS keywords, reordering experience, and quantifying your achievements to maximize recruiter attention.</p>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="md:col-span-5 bg-tertiary-container p-8 rounded-2xl text-white relative overflow-hidden min-h-[250px] group hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12 group-hover:rotate-45 transition-transform duration-500">
                <span className="material-symbols-outlined text-[120px]">mail</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-3">Cover Letter Generator</h3>
                <p className="opacity-90 leading-relaxed">Automatic, personalized cover letters that speak directly to the role — with your story, their culture, and the right keywords.</p>
              </div>
            </div>
            {/* Feature 3 */}
            <div className="md:col-span-5 bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 group hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-secondary-container/30 rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-secondary text-2xl">record_voice_over</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">Interview Preparation</h3>
              <p className="text-on-surface-variant leading-relaxed">Get likely interview questions with STAR-method answers, tips from real recruiters, and questions to ask back.</p>
            </div>
            {/* Feature 4 */}
            <div className="md:col-span-7 bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] p-8 rounded-2xl border border-white/50 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex gap-6">
                <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-tertiary-container text-2xl">analytics</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary-container mb-3">Match Score & Skill Gap</h3>
                  <p className="text-slate-700 leading-relaxed">Instantly see how well your profile matches the job. Identify missing skills and get a 7-day preparation plan with course recommendations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-[1440px] mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-4xl font-extrabold text-primary mb-2">40%</p>
            <p className="text-sm text-on-surface-variant">Increase in interview rates</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-extrabold text-secondary mb-2">10K+</p>
            <p className="text-sm text-on-surface-variant">Applications generated</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-extrabold text-tertiary-container mb-2">95%</p>
            <p className="text-sm text-on-surface-variant">ATS compatibility score</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-extrabold text-primary-container mb-2">3 min</p>
            <p className="text-sm text-on-surface-variant">Average generation time</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-surface-container-low py-20 md:py-28">
        <div className="max-w-[1440px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-16">What students are saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100">
              <div className="flex gap-1 mb-4 text-amber-400">
                {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">&ldquo;I landed 3 interviews in my first week using ApplyWise. The tailored CVs were spot-on and the interview prep gave me real confidence.&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-fixed rounded-full flex items-center justify-center text-primary-container font-bold text-sm">SM</div>
                <div>
                  <p className="text-sm font-bold text-primary">Sarah M.</p>
                  <p className="text-xs text-slate-500">CS Student, University of Toronto</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100">
              <div className="flex gap-1 mb-4 text-amber-400">
                {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">&ldquo;The skill gap analysis showed me exactly what I was missing. I followed the 7-day plan and nailed the technical interview.&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary-container/30 rounded-full flex items-center justify-center text-secondary font-bold text-sm">JK</div>
                <div>
                  <p className="text-sm font-bold text-primary">James K.</p>
                  <p className="text-xs text-slate-500">Junior Dev, Bootcamp Graduate</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100">
              <div className="flex gap-1 mb-4 text-amber-400">
                {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">&ldquo;As a non-native English speaker, the cover letter generator saved me hours. It perfectly adapted my tone for the UK market.&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tertiary-fixed/30 rounded-full flex items-center justify-center text-tertiary-container font-bold text-sm">AH</div>
                <div>
                  <p className="text-sm font-bold text-primary">Aïcha H.</p>
                  <p className="text-xs text-slate-500">Marketing Intern, Sciences Po</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-[1440px] mx-auto px-6 py-20">
        <div className="bg-primary-container p-12 md:p-16 rounded-3xl text-white text-center relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to land your dream role?</h2>
            <p className="text-on-primary-container text-lg">Join thousands of students already using ApplyWise AI to boost their applications.</p>
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center gap-2 bg-white text-primary-container px-8 py-3.5 rounded-xl text-base font-bold hover:bg-slate-100 transition-all shadow-xl"
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              Get Started — It&apos;s Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="font-bold text-slate-900 text-sm">ApplyWise AI</p>
            <p className="text-xs text-slate-500 mt-1">© 2024 ApplyWise AI. Empowering students with AI.</p>
          </div>
          <div className="flex gap-8 text-xs">
            <Link className="text-slate-500 hover:text-slate-800 transition-colors font-medium" href="/privacy">Privacy Policy</Link>
            <Link className="text-slate-500 hover:text-slate-800 transition-colors font-medium" href="/terms">Terms of Service</Link>
            <Link className="text-slate-500 hover:text-slate-800 transition-colors font-medium" href="/pricing">Pricing</Link>
            <a className="text-slate-500 hover:text-slate-800 transition-colors font-medium" href="mailto:support@applywise.ai">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
