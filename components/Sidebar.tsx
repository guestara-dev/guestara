'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, BedDouble, Calendar, Users, Bot, Settings, Hotel, DollarSign, LogOut } from 'lucide-react'
import { useStore } from '@/lib/store'

const nav = [
  { icon:LayoutDashboard, label:'Dashboard',      href:'/'               },
  { icon:BedDouble,       label:'Habitaciones',   href:'/habitaciones'   },
  { icon:Calendar,        label:'Reservas',       href:'/reservas'       },
  { icon:Users,           label:'Huéspedes',      href:'/huespedes'      },
  { icon:DollarSign,      label:'Caja',           href:'/caja'           },
  { icon:Bot,             label:'IA Concierge',   href:'/concierge'      },
  { icon:Settings,        label:'Configuración',  href:'/configuracion'  },
]

export default function Sidebar() {
  const pathname   = usePathname()
  const router     = useRouter()
  const { reservations, hotelLogo } = useStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const pendingCount = mounted ? reservations.filter(r => r.status === 'pending').length : 0

  // P5 FIX: logout function clears cookie and redirects to login
  const handleLogout = useCallback(() => {
    document.cookie = 'g_auth=; path=/; max-age=0'
    localStorage.removeItem('g_last_activity')
    router.push('/login')
  }, [router])

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">

      {/* LOGO / HOTEL */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          {hotelLogo ? (
            <img src={hotelLogo} alt="Logo" className="h-8 w-8 object-contain rounded" />
          ) : (
            <Hotel className="w-6 h-6 text-orange-400"/>
          )}
          <span className="text-lg font-bold">{hotelLogo ? '' : 'Guestara'}</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">Hotel Boutique Del Mar</p>
      </div>

      {/* NAV LINKS */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ icon:Icon, label, href }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              pathname === href
                ? 'bg-orange-500 text-white font-semibold'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0"/>
            <span className="flex-1">{label}</span>
            {label === 'Reservas' && pendingCount > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* FOOTER: IA STATUS + LOGOUT */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        <div className="bg-orange-500/10 rounded-lg p-3">
          <p className="text-xs text-orange-300 font-medium">IA Activa</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Concierge en línea</p>
        </div>
        {/* P5 FIX: Logout button always visible at bottom of sidebar */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
