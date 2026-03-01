'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, UserCheck, Users, Clock, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Reservation } from '@/lib/data'

function parseCheckOut(co: string): Date | null {
  try {
    const [datePart, timePart] = co.split(' ')
    const [day, month] = datePart.split('/')
    if (!day || !month) return null
    const year = new Date().getFullYear()
    const [h, m] = (timePart ?? '12:00').split(':').map(Number)
    const d = new Date(year, parseInt(month) - 1, parseInt(day), h || 12, m || 0)
    return d
  } catch { return null }
}

function ProximasModal({ items, onClose }: { items: Reservation[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="font-semibold">Próximas a vencer</h2>
            <p className="text-xs text-gray-400 mt-0.5">{items.length} habitación{items.length!==1?'es':''} próxima{items.length!==1?'s':''} a salir</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-sm">No hay salidas próximas</p>
          ) : items.map(r => {
            const co = parseCheckOut(r.checkOut)
            const now = new Date()
            const diffH = co ? Math.round((co.getTime() - now.getTime()) / 3600000) : null
            const urgent = diffH !== null && diffH <= 2
            return (
              <div key={r.id} className={`flex items-center justify-between rounded-xl p-3 border ${
                urgent ? 'bg-red-950/40 border-red-700/40' : 'bg-gray-800 border-gray-700/50'
              }`}>
                <div>
                  <p className="text-sm font-medium">{r.guest}</p>
                  <p className="text-xs text-gray-400">Hab. {r.room} · Sale {r.checkOut}</p>
                </div>
                <div className="text-right">
                  {diffH !== null ? (
                    <span className={`text-xs font-semibold ${urgent ? 'text-red-400' : 'text-amber-400'}`}>
                      {diffH <= 0 ? '¡Ahora!' : `${diffH}h`}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Hoy</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function StatsGrid() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [showProximas, setShowProximas] = useState(false)
  const { reservations, extras } = useStore()

  if (!mounted) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_,i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-gray-800 rounded"/>
                <div className="h-8 w-16 bg-gray-800 rounded"/>
                <div className="h-2 w-24 bg-gray-800 rounded"/>
              </div>
              <div className="w-9 h-9 bg-gray-800 rounded-lg"/>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const active      = reservations.filter(r => !['cancelled','completed'].includes(r.status))
  const checkedIn   = reservations.filter(r => r.status === 'checked-in')
  const pending     = active.filter(r => r.status === 'pending')
  const resRevenue  = active.reduce((s,r) => s + r.amount, 0)
  const extRevenue  = (extras ?? []).reduce((s,e) => s + e.total, 0)
  const revenue     = resRevenue + extRevenue

  // Próximas a vencer: checked-in with checkout within next 24h
  const now      = new Date()
  const next24h  = new Date(now.getTime() + 24 * 3600000)
  const proximas = checkedIn.filter(r => {
    const co = parseCheckOut(r.checkOut)
    return !co || co <= next24h   // include if today/can't parse
  })
  const urgent = proximas.filter(r => {
    const co = parseCheckOut(r.checkOut)
    return co ? (co.getTime() - now.getTime()) / 3600000 <= 2 : false
  })

  const clr: Record<string,string> = {
    amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    violet:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
    rose:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {/* CARD 1: Próximas a vencer — reemplaza Ocupación */}
        <div onClick={() => setShowProximas(true)}
          className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
            urgent.length > 0 ? 'border-red-600/50 hover:border-red-500/70 hover:shadow-red-900/30' : 'border-gray-800 hover:border-amber-600/40'
          }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">Próximas a vencer</p>
              <p className={`text-2xl font-bold mt-1 ${urgent.length > 0 ? 'text-red-400' : 'text-amber-400'}`}>
                {proximas.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">salidas en ≤24h</p>
            </div>
            <div className={`p-2 rounded-lg border ${urgent.length > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : clr.amber}`}>
              <Clock className="w-4 h-4"/>
            </div>
          </div>
          {urgent.length > 0 && (
            <p className="text-[10px] text-red-400 mt-2 font-medium">⚠ {urgent.length} en ≤2h · click para ver</p>
          )}
          {urgent.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">click para ver detalle</p>
          )}
        </div>

        {/* CARD 2: Ingresos */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">Ingresos totales</p>
              <p className="text-2xl font-bold mt-1">${revenue}</p>
              <p className="text-xs text-gray-500 mt-0.5">USD — hab. + extras</p>
            </div>
            <div className={`p-2 rounded-lg border ${clr.emerald}`}><TrendingUp className="w-4 h-4"/></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{active.length} reservas activas</p>
        </div>

        {/* CARD 3: Confirmadas */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">Confirmadas</p>
              <p className="text-2xl font-bold mt-1">{active.filter(r=>r.status==='confirmed').length}</p>
              <p className="text-xs text-gray-500 mt-0.5">pendientes check-in</p>
            </div>
            <div className={`p-2 rounded-lg border ${clr.violet}`}><UserCheck className="w-4 h-4"/></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{pending.length > 0 ? `${pending.length} pendientes` : 'Al día'}</p>
        </div>

        {/* CARD 4: En casa */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">En casa</p>
              <p className="text-2xl font-bold mt-1">{checkedIn.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">huéspedes activos</p>
            </div>
            <div className={`p-2 rounded-lg border ${clr.rose}`}><Users className="w-4 h-4"/></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Con check-in</p>
        </div>
      </div>

      {showProximas && <ProximasModal items={proximas} onClose={() => setShowProximas(false)}/>}
    </>
  )
}
