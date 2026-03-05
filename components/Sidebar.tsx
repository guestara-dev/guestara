'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BedDouble, Calendar, Users, Bot, Settings, Hotel, DollarSign } from 'lucide-react'
import { useStore } from '@/lib/store'

const nav = [
  { icon: LayoutDashboard, label: 'Dashboard',      href: '/' },
  { icon: BedDouble,       label: 'Habitaciones',  href: '/habitaciones' },
  { icon: Calendar,        label: 'Reservas',      href: '/reservas' },
  { icon: Users,           label: 'Huéspedes',     href: '/huespedes' },
  { icon: DollarSign,      label: 'Caja',          href: '/caja' },
  { icon: Bot,             label: 'IA Concierge',  href: '/concierge' },
  { icon: Settings,        label: 'Configuración', href: '/configuracion' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { reservations, hotelLogo } = useStore()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])

  // Only compute badge after mount to avoid hydration mismatch
  const pendingCount = mounted ? reservations.filter(r => r.status === 'pending').length : 0

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          {hotelLogo ? (
            <img src={hotelLogo} alt="Logo" className="h-8 w-8 object-contain rounded" />
          ) : (
            <div className="w-8 h-8 bg-violet-600 rounded flex items-center justify-center">
              <Hotel className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="font-bold text-xl tracking-tight text-white">ONIX</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {nav.map((item) => {
          const active = pathname === item.href
          const isReservas = item.href === '/reservas'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center justify-between px-5 py-3 transition-all group
                ${active 
                  ? 'bg-violet-600/10 text-violet-400 border-r-2 border-violet-600' 
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}
              `}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${active ? 'text-violet-400' : 'text-gray-500 group-hover:text-violet-400'} transition-colors`} />
                <span className="font-medium">{item.label}</span>
              </div>

              {isReservas && pendingCount > 0 && (
                <span className={`
                  flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold
                  ${active ? 'bg-white text-violet-600' : 'bg-amber-500 text-black shadow-sm'}
                `}>
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 rounded-2xl p-4 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">IA Activa</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Asistente Onyx listo para optimizar tu ocupación.
          </p>
        </div>
      </div>
    </aside>
  )
}
