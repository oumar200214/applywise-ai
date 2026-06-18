import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12 px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <p className="font-bold text-slate-900 text-sm">ApplyWise AI</p>
          <p className="text-xs text-slate-500 mt-1">© 2024 ApplyWise AI. Empowering students with AI.</p>
        </div>
        <div className="flex gap-8 text-xs">
          <Link className="text-slate-500 hover:text-slate-800 transition-colors" href="#">Privacy Policy</Link>
          <Link className="text-slate-500 hover:text-slate-800 transition-colors" href="#">Terms of Service</Link>
          <Link className="text-slate-500 hover:text-slate-800 transition-colors" href="#">Contact</Link>
          <Link className="text-slate-500 hover:text-slate-800 transition-colors" href="#">Blog</Link>
        </div>
      </div>
    </footer>
  )
}
