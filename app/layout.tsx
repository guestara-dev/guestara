import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { StoreProvider } from '@/lib/store'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import ClientOnly from '@/components/ClientOnly'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Guestara — Hotel PMS',
  description: 'Sistema de gestión hotelera',
}

// Skeleton de carga mientras hidrata el cliente
function AppSkeleton() {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar skeleton */}
      <div className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 animate-pulse">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-700 rounded"/>
            <div className="h-5 w-20 bg-gray-700 rounded"/>
          </div>
        </div>
        <div className="p-3 space-y-1">
          {[...Array(7)].map((_,i) => (
            <div key={i} className="h-9 bg-gray-800 rounded-lg"/>
          ))}
        </div>
      </div>
      {/* Main skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 bg-gray-900 border-b border-gray-800 animate-pulse"/>
        <div className="flex-1 p-5 space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_,i) => (
              <div key={i} className="h-24 bg-gray-900 rounded-xl border border-gray-800"/>
            ))}
          </div>
          <div className="h-64 bg-gray-900 rounded-xl border border-gray-800"/>
        </div>
      </div>
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-950 text-white`} suppressHydrationWarning>
        <StoreProvider>
          <ClientOnly fallback={<AppSkeleton />}>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto">
                  {children}
                </main>
              </div>
            </div>
          </ClientOnly>
        </StoreProvider>
      </body>
    </html>
  )
}
