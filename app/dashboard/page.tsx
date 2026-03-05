'use client'
import { useState, useEffect } from 'react'
import RoomGrid from '@/components/RoomGrid'
import ReservationModal from '@/components/ReservationModal'
import GuestModal from '@/components/GuestModal'
import { useStore } from '@/lib/store'
import { Plus, BedDouble, Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'

const statusCfg: Record<string,{label:string;cls:string}> = {
  'pending':    { label:'Pendiente',  cls:'bg-amber-500/20 text-amber-300'   },
  'confirmed':  { label:'Confirmada', cls:'bg-emerald-500/20 text-emerald-300' },
  'checked-in': { label:'En Casa',    cls:'bg-blue-500/20 text-blue-300'     },
  'completed':  { label:'Completada', cls:'bg-gray-500/20 text-gray-400'     },
  'cancelled':  { label:'Cancelada',  cls:'bg-red-500/20 text-red-400'       },
}

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false)
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const { reservations, rooms, extras, hotelLogo, setSelectedGuest, selectedRoomNumber, setSelectedRoomNumber, resetDashboard } = useStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const enabledRooms  = rooms.filter(r => r.enabled !== false)
  const active        = reservations.filter(r => !['cancelled','completed'].includes(r.status))
  const inHouse       = reservations.filter(r => r.status === 'checked-in')
  const available     = enabledRooms.filter(r => r.status === 'available').length
  const occupied      = enabledRooms.filter(r => r.status === 'occupied').length
  const occupancyPct  = enabledRooms.length > 0 ? Math.round((occupied / enabledRooms.length) * 100) : 0
  const revenue       = reservations.filter(r => r.status !== 'cancelled').reduce((s,r) => s + r.amount, 0)
  const extrasRev     = (extras ?? []).reduce((s,e) => s + e.total, 0)
  const totalRevenue  = revenue + extrasRev
  const today         = new Date().toLocaleDateString('es-CL', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  const time          = mounted ? new Date().toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' }) : '--:--'

  useEffect(() => { if (selectedRoomNumber) setShowModal(true) }, [selectedRoomNumber])
  const handleClose = () => { setShowModal(false); setSelectedRoomNumber(null) }

  // FUNC-11 FIX: Detectar reservas vencidas (status checked-in pero checkout < hoy)
  const now = new Date()
  const overdueRes = reservations.filter(r => {
    if (r.status !== 'checked-in') return false
    const checkout = new Date(r.checkOut)
    return checkout < now
  })

  const stats = [
    { label:'Disponibles', value:available,             sub:`de ${enabledRooms.length} hab. activas`, icon:BedDouble,   color:'text-emerald-400', bg:'bg-emerald-500/10 border-emerald-500/20' },
    { label:'En Casa',     value:inHouse.length,         sub:`${active.length} reservas activas`,      icon:Users,       color:'text-blue-400',    bg:'bg-blue-500/10 border-blue-500/20'     },
    { label:'Ocupación',   value:`${occupancyPct}%`,     sub:`${occupied} ocupadas`,                  icon:TrendingUp,  color:'text-violet-400',  bg:'bg-violet-500/10 border-violet-500/20' },
    { label:'Ingresos',    value:`$${totalRevenue.toLocaleString()}`, sub:`+$${extrasRev.toLocaleString()} extras`, icon:DollarSign, color:'text-amber-400', bg:'bg-amber-500/10 border-amber-500/20' },
  ]

  return (
    <div className="p-5 space-y-5 max-w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hotelLogo && <img src={hotelLogo} alt="logo" className="w-8 h-8 rounded-lg object-cover" />}
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-xs text-gray-500">{today} &middot; {time}</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-violet-900/30"
        >
          <Plus className="w-4 h-4" /> Nueva Reserva
        </button>
      </div>

      {/* FUNC-11: Alerta reservas vencidas */}
      {overdueRes.length > 0 && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">{overdueRes.length} reserva{overdueRes.length > 1 ? 's' : ''} vencida{overdueRes.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-red-400/70">{overdueRes.map(r => `Hab.${r.room} — ${r.guest}`).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className={`border rounded-xl p-4 ${bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[11px] text-gray-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ROOM GRID */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Estado de Habitaciones</h2>
          <span className="text-[11px] text-gray-500">{enabledRooms.length} activas · {rooms.filter(r=>r.enabled===false).length} ocultas</span>
        </div>
        <RoomGrid />
      </div>

      {/* ACTIVITY FEED */}
      {active.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h2 className="font-semibold text-sm mb-3">Actividad · {active.length} activas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {active.slice(0, 6).map(r => {
              // FUNC-11 FIX: Badge vencida
              const isOverdue = r.status === 'checked-in' && new Date(r.checkOut) < now
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedGuest(r)}
                  className={`rounded-xl p-3 cursor-pointer border transition-all hover:scale-[1.01] ${
                    isOverdue
                      ? 'bg-red-500/5 border-red-500/30 hover:border-red-500/50'
                      : 'bg-gray-800/60 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">{r.guest}</span>
                    {isOverdue && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        <AlertTriangle className="w-2.5 h-2.5" /> Vencida
                      </span>
                    )}
                    {!isOverdue && (
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${statusCfg[r.status]?.cls}`}>
                        {statusCfg[r.status]?.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">Hab. {r.room} · {r.checkIn} → {r.checkOut}</p>
                  <p className="text-[11px] text-gray-500">${r.amount.toLocaleString()} · {r.nights}n</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showModal && <ReservationModal onClose={handleClose} />}
      {selectedRoomNumber && !showModal && <GuestModal onClose={() => { setSelectedGuest(null); setSelectedRoomNumber(null) }} />}
    </div>
  )
}
