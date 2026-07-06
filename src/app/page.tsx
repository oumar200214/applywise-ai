import Link from 'next/link'

export const metadata = {
  title: 'Postulis — Assistant IA pour vos candidatures',
  description: 'Transformez chaque offre d\'emploi en candidature complète : CV personnalisé, lettre de motivation, préparation entretien et analyse de compétences. Conçu pour les étudiants et jeunes professionnels.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Navigation */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-xl font-black tracking-tight text-primary-container">Postulis</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a className="text-slate-500 hover:text-primary transition-colors px-3 py-2 rounded-lg text-sm font-semibold" href="#features">Fonctionnalités</a>
            <Link className="text-slate-500 hover:text-primary transition-colors px-3 py-2 rounded-lg text-sm font-semibold" href="/pricing">Tarifs</Link>
            <a className="text-slate-500 hover:text-primary transition-colors px-3 py-2 rounded-lg text-sm font-semibold" href="#testimonials">Témoignages</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="text-primary-container text-sm font-semibold hover:opacity-80 transition-opacity px-4 py-2">Connexion</Link>
            <Link href="/auth?mode=signup" className="bg-primary-container text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/10">Commencer gratuitement</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-surface-container-low to-surface-container">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-tertiary-container/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-container/10 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-container/20 text-secondary rounded-full text-xs font-bold border border-secondary-container/30">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Propulsé par l&apos;IA de pointe
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary leading-tight tracking-tight">
              Votre assistant IA pour votre carrière.{' '}
              <span className="bg-gradient-to-r from-tertiary-container to-secondary bg-clip-text text-transparent">
                Décrochez votre emploi idéal.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Collez une offre d&apos;emploi, ajoutez votre CV, et laissez notre IA générer un dossier de candidature complet — CV, lettre de motivation, questions d&apos;entretien et analyse de compétences — en quelques minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth?mode=signup" className="bg-primary-container text-white px-8 py-3.5 rounded-xl text-base font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/15 flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">rocket_launch</span>
                Commencer gratuitement — Sans carte
              </Link>
              <a href="#how-it-works" className="text-primary-container px-6 py-3.5 rounded-xl text-base font-bold hover:bg-slate-50 transition-all flex items-center gap-2 border border-slate-200">
                <span className="material-symbols-outlined text-xl">play_circle</span>
                Comment ça marche
              </a>
            </div>
            <p className="text-xs text-slate-400">✓ 3 générations gratuites  ✓ Sans carte bancaire  ✓ Vos données restent privées</p>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="how-it-works" className="max-w-[1440px] mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Comment fonctionne Postulis</h2>
          <p className="text-on-surface-variant text-lg max-w-xl mx-auto">Trois étapes simples pour un dossier de candidature complet.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 text-center group hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <div className="w-14 h-14 bg-primary-fixed rounded-2xl flex items-center justify-center mx-auto mb-6"><span className="material-symbols-outlined text-primary-container text-3xl">content_paste</span></div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-primary-container text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <h3 className="text-xl font-bold text-primary mb-3">Collez l&apos;offre d&apos;emploi</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">Copiez la description du poste et collez-la dans Postulis. Nous extrayons automatiquement les compétences requises, les exigences et les informations sur l&apos;entreprise.</p>
          </div>
          <div className="relative bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 text-center group hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <div className="w-14 h-14 bg-secondary-container/20 rounded-2xl flex items-center justify-center mx-auto mb-6"><span className="material-symbols-outlined text-secondary text-3xl">upload_file</span></div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-primary-container text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <h3 className="text-xl font-bold text-primary mb-3">Ajoutez votre CV</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">Importez votre CV ou collez votre profil. Postulis extrait vos compétences, expériences et formations pour les comparer au poste ciblé.</p>
          </div>
          <div className="relative bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 text-center group hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <div className="w-14 h-14 bg-tertiary-fixed/30 rounded-2xl flex items-center justify-center mx-auto mb-6"><span className="material-symbols-outlined text-tertiary-container text-3xl">auto_awesome</span></div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-primary-container text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <h3 className="text-xl font-bold text-primary mb-3">Recevez votre dossier</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">L&apos;IA génère un CV personnalisé, une lettre de motivation, des questions d&apos;entretien, des mots-clés ATS et une analyse de compétences — prêts à l&apos;emploi.</p>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="features" className="bg-surface-container-low py-20 md:py-28">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Tout ce qu&apos;il vous faut pour décrocher le poste</h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto">Des outils IA conçus spécifiquement pour les étudiants et les jeunes professionnels.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-fixed/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center mb-6"><span className="material-symbols-outlined text-white text-2xl">description</span></div>
                <h3 className="text-xl font-bold text-primary mb-3">CV personnalisé par IA</h3>
                <p className="text-on-surface-variant leading-relaxed">Notre IA réécrit votre CV pour chaque poste, injecte les mots-clés ATS pertinents, réorganise vos expériences et quantifie vos réalisations pour maximiser l&apos;attention des recruteurs.</p>
              </div>
            </div>
            <div className="md:col-span-5 bg-tertiary-container p-8 rounded-2xl text-white relative overflow-hidden min-h-[250px] group hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12 group-hover:rotate-45 transition-transform duration-500"><span className="material-symbols-outlined text-[120px]">mail</span></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-3">Lettre de motivation</h3>
                <p className="opacity-90 leading-relaxed">Des lettres personnalisées et percutantes qui parlent directement au recruteur — avec votre histoire, la culture de l&apos;entreprise et les bons mots-clés.</p>
              </div>
            </div>
            <div className="md:col-span-5 bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 group hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-secondary-container/30 rounded-xl flex items-center justify-center mb-6"><span className="material-symbols-outlined text-secondary text-2xl">record_voice_over</span></div>
              <h3 className="text-xl font-bold text-primary mb-3">Préparation aux entretiens</h3>
              <p className="text-on-surface-variant leading-relaxed">Obtenez les questions d&apos;entretien probables avec des réponses structurées (méthode STAR), des conseils de recruteurs et des questions à poser à votre tour.</p>
            </div>
            <div className="md:col-span-7 bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] p-8 rounded-2xl border border-white/50 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex gap-6">
                <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-tertiary-container text-2xl">analytics</span></div>
                <div>
                  <h3 className="text-xl font-bold text-primary-container mb-3">Score de correspondance & Compétences</h3>
                  <p className="text-slate-700 leading-relaxed">Voyez instantanément à quel point votre profil correspond au poste. Identifiez les compétences manquantes et obtenez un plan de préparation de 7 jours avec des recommandations de cours.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="max-w-[1440px] mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[['40%','Augmentation du taux d\'entretien'],['10K+','Candidatures générées'],['95%','Score de compatibilité ATS'],['3 min','Temps de génération moyen']].map(([v,l]) => (
            <div key={l} className="text-center">
              <p className="text-4xl font-extrabold text-primary mb-2">{v}</p>
              <p className="text-sm text-on-surface-variant">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Témoignages */}
      <section id="testimonials" className="bg-surface-container-low py-20 md:py-28">
        <div className="max-w-[1440px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-16">Ce que disent nos utilisateurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { initials: 'SM', name: 'Sarah M.', role: 'Étudiante en informatique, Université de Montréal', bg: 'bg-primary-fixed', text: 'text-primary-container', quote: 'J\'ai obtenu 3 entretiens en une semaine grâce à Postulis. Les CV personnalisés étaient parfaitement adaptés et la préparation entretien m\'a donné une vraie confiance.' },
              { initials: 'JK', name: 'James K.', role: 'Développeur junior, Bootcamp', bg: 'bg-secondary-container/30', text: 'text-secondary', quote: 'L\'analyse des compétences m\'a montré exactement ce qui me manquait. J\'ai suivi le plan de 7 jours et j\'ai réussi l\'entretien technique.' },
              { initials: 'AH', name: 'Aïcha H.', role: 'Stagiaire Marketing, Sciences Po Paris', bg: 'bg-tertiary-fixed/30', text: 'text-tertiary-container', quote: 'Le générateur de lettres de motivation m\'a économisé des heures. Il a parfaitement adapté mon ton et mis en valeur mon parcours pour le marché français.' },
            ].map(t => (
              <div key={t.name} className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100">
                <div className="flex gap-1 mb-4 text-amber-400">{[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}</div>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.bg} rounded-full flex items-center justify-center ${t.text} font-bold text-sm`}>{t.initials}</div>
                  <div><p className="text-sm font-bold text-primary">{t.name}</p><p className="text-xs text-slate-500">{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1440px] mx-auto px-6 py-20">
        <div className="bg-primary-container p-12 md:p-16 rounded-3xl text-white text-center relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">Prêt à décrocher votre emploi idéal ?</h2>
            <p className="text-on-primary-container text-lg">Rejoignez des milliers d&apos;étudiants qui utilisent déjà Postulis pour booster leurs candidatures.</p>
            <Link href="/auth?mode=signup" className="inline-flex items-center gap-2 bg-white text-primary-container px-8 py-3.5 rounded-xl text-base font-bold hover:bg-slate-100 transition-all shadow-xl">
              <span className="material-symbols-outlined">rocket_launch</span>
              Commencer — C&apos;est gratuit
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="font-bold text-slate-900 text-sm">Postulis</p>
            <p className="text-xs text-slate-500 mt-1">© 2026 Postulis. L&apos;IA au service de votre carrière.</p>
          </div>
          <div className="flex gap-8 text-xs">
            <Link className="text-slate-500 hover:text-slate-800 transition-colors font-medium" href="/privacy">Politique de confidentialité</Link>
            <Link className="text-slate-500 hover:text-slate-800 transition-colors font-medium" href="/terms">Conditions d&apos;utilisation</Link>
            <Link className="text-slate-500 hover:text-slate-800 transition-colors font-medium" href="/pricing">Tarifs</Link>
            <a className="text-slate-500 hover:text-slate-800 transition-colors font-medium" href="mailto:contact@postulis.io">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
