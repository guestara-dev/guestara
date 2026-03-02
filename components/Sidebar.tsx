'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BedDouble, Calendar, Users, Bot, Settings, Hotel, DollarSign } from 'lucide-react'
import { useStore } from '@/lib/store'

const nav = [
  { icon:LayoutDashboard, label:'Dashboard',     href:'/'              },
  { icon:BedDouble,       label:'Habitaciones',  href:'/habitaciones'  },
  { icon:Calendar,        label:'Reservas',      href:'/reservas'      },
  { icon:Users,           label:'Huéspedes',     href:'/huespedes'     },
  { icon:DollarSign,      label:'Caja',          href:'/caja'          },
  { icon:Bot,             label:'IA Concierge',  href:'/concierge'     },
  { icon:Settings,        label:'Configuración', href:'/configuracion' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { reservations, hotelLogo } = useStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Only compute badge after mount to avoid hydration mismatch
  const pendingCount = mounted ? reservations.filter(r => r.status === 'pending').length : 0

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
{hotelLogo ? (
            <img src={hotelLogo} alt="Logo" className="h-8 w-8 object-contain rounded" />
          ) : (
            <Hotel className="w-6 h-6 text-violet-400"/>
          )}
          <span className="text-lg font-bold">{hotelLogo ? '' : 'Onix'}</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">Hotel Boutique Del Mar</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ icon:Icon, label, href }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              pathname === href ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}>
            <Icon className="w-4 h-4 shrink-0"/>
            <span className="flex-1">{label}</span>
            {label === 'Reservas' && pendingCount > 0 && (
              <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-800">
        <div className="bg-violet-900/30 rounded-lg p-3">
          <p className="text-xs text-violet-300 font-medium">IA Activa</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Concierge en línea</p>
        </div>
      </div>
    </aside>
  )
}
