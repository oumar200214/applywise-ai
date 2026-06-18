import SideNavBar from '@/components/SideNavBar'
import TopNavBar from '@/components/TopNavBar'
import BottomNavBar from '@/components/BottomNavBar'
import Footer from '@/components/Footer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <SideNavBar />
      <main className="lg:ml-64 min-h-screen pb-24 lg:pb-0">
        <TopNavBar />
        <div className="max-w-[1440px] mx-auto p-6 md:p-10">
          {children}
        </div>
        <Footer />
      </main>
      <BottomNavBar />
    </div>
  )
}
