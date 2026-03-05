'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BedDouble, Calendar, Users, Bot, Settings, DollarSign, Hotel } from 'lucide-react'
import { useStore } from '@/lib/store'

// ADD-22 FIX: href actualizado a /dashboard como ruta principal autenticada
const nav = [
  { icon:LayoutDashboard, label:'Dashboard',      href:'/dashboard'      },
  { icon:BedDouble,       label:'Habitaciones',   href:'/habitaciones'   },
  { icon:Calendar,        label:'Reservas',       href:'/reservas'       },
  { icon:Users,           label:'Huéspedes',       href:'/huespedes'       },
  { icon:DollarSign,      label:'Caja',           href:'/caja'           },
  { icon:Bot,             label:'IA Concierge',   href:'/concierge'      },
  { icon:Settings,        label:'Configuración',  href:'/configuracion'  },
]

export default function Sidebar() {
  const pathname   = usePathname()
  const { reservations, hotelLogo } = useStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const pendingCount = mounted ? reservations.filter(r => r.status === 'pending').length : 0

  // UX-12: Hotel name from config
  const [hotelName, setHotelName] = useState('Guestara')
  useEffect(() => {
    try {
      const config = localStorage.getItem('guestara_hotel_config')
      if (config) setHotelName(JSON.parse(config).nombre || 'Guestara')
    } catch {}
  }, [])

  // ADD-22 FIX: isActive maneja tanto / como /dashboard
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 overflow-y-auto">
      {/* LOGO / HOTEL */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          {hotelLogo ? (
            <img src={hotelLogo} alt="Logo" className="h-8 w-8 object-contain rounded" />
          ) : (
            <Hotel className="w-6 h-6 text-orange-400" />
          )}
          <div className="min-w-0">
            {/* UX-12 FIX: APP_NAME = Guestara siempre, hotel name configurable */}
            <span className="text-sm font-bold block truncate">{hotelName}</span>
            <span className="text-[10px] text-gray-500">Powered by Guestara</span>
          </div>
        </div>
      </div>

      {/* NAV LINKS */}
      {/* ADD-22 FIX: Usar componente Link de Next.js en TODOS los items */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ icon:Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              isActive(href)
                ? 'bg-violet-600 text-white font-semibold'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
            {/* Badge para reservas pendientes en el nav de Reservas */}
            {href === '/reservas' && pendingCount > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* FOOTER VERSION */}
      <div className="p-3 border-t border-gray-800">
        <p className="text-[10px] text-gray-600 text-center">Guestara PMS v2.0</p>
      </div>
    </aside>
  )
}
