'use client'
import { useState, useEffect } from 'react'
import RoomGrid from '@/components/RoomGrid'
import ReservationModal from '@/components/ReservationModal'
import GuestModal from '@/components/GuestModal'
import { useStore } from '@/lib/store'
import { Plus, BedDouble, Users, DollarSign, TrendingUp, Clock, Hotel } from 'lucide-react'

const statusCfg: Record<string,{label:string;cls:string}> = {
  'pending':    {label:'Pendiente',  cls:'bg-amber-500/20 text-amber-300'},
  'confirmed':  {label:'Confirmada', cls:'bg-emerald-500/20 text-emerald-300'},
  'checked-in': {label:'En Casa',    cls:'bg-blue-500/20 text-blue-300'},
  'completed':  {label:'Completada', cls:'bg-gray-500/20 text-gray-400'},
  'cancelled':  {label:'Cancelada',  cls:'bg-red-500/20 text-red-400'},
}

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const { reservations, rooms, extras, hotelLogo, setSelectedGuest, selectedRoomNumber, setSelectedRoomNumber } = useStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // P1 FIX: use only enabled rooms for all metrics
  const enabledRooms  = rooms.filter(r => r.enabled !== false)
  const active        = reservations.filter(r => !['cancelled','completed'].includes(r.status))
  const inHouse       = reservations.filter(r => r.status === 'checked-in')
  const available     = enabledRooms.filter(r => r.status === 'available').length
  const occupied      = enabledRooms.filter(r => r.status === 'occupied').length
  const occupancyPct  = enabledRooms.length > 0 ? Math.round((occupied / enabledRooms.length) * 100) : 0
  const revenue       = reservations.filter(r => r.status !== 'cancelled').reduce((s,r) => s + r.amount, 0)
  const extrasRev     = (extras ?? []).reduce((s,e) => s + e.total, 0)
  const totalRevenue  = revenue + extrasRev

  const today = new Date().toLocaleDateString('es-CL', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  const time  = mounted ? new Date().toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' }) : '--:--'

  useEffect(() => { if (selectedRoomNumber) setShowModal(true) }, [selectedRoomNumber])
  const handleClose = () => { setShowModal(false); setSelectedRoomNumber(null) }

  const stats = [
    {
      label: 'Disponibles',
      value: available,
      sub: `de ${enabledRooms.length} hab. activas`,
      icon: BedDouble,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'En Casa',
      value: inHouse.length,
      sub: `${active.length} reservas activas`,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Ocupación',
      value: `${occupancyPct}%`,
      sub: `${occupied} ocupadas`,
      icon: TrendingUp,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Ingresos',
      value: `$${totalRevenue.toLocaleString()}`,
      sub: `+$${extrasRev.toLocaleString()} extras`,
      icon: DollarSign,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-5 min-h-screen">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hotelLogo
            ? <img src={hotelLogo} alt="logo" className="h-9 w-9 object-contain rounded-lg" />
            : <div className="h-9 w-9 rounded-lg bg-violet-600/20 flex items-center justify-center"><Hotel className="w-5 h-5 text-violet-400" /></div>
          }
          <div>
            <h1 className="text-base font-bold leading-tight">Dashboard</h1>
            <p className="text-xs text-gray-500 capitalize">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{time}</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-violet-900/30"
          >
            <Plus className="w-4 h-4" /> Nueva Reserva
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-4 ${bg} flex flex-col gap-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[11px] text-gray-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── ROOM GRID ── */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-300">Estado de Habitaciones</h2>
          <span className="text-xs text-gray-500">{enabledRooms.length} activas · {rooms.filter(r=>r.enabled===false).length} ocultas</span>
        </div>
        <RoomGrid />
      </div>

      {/* ── ACTIVITY FEED ── */}
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Actividad · {active.length} activas</h2>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {active.slice(0, 6).map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedGuest(r)}
                className="bg-gray-900 hover:bg-gray-800 rounded-xl p-3 cursor-pointer border border-gray-800 hover:border-gray-700 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{r.guest}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusCfg[r.status].cls}`}>
                    {statusCfg[r.status].label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Hab. {r.room} · {r.checkIn} → {r.checkOut}</p>
                <p className="text-xs text-gray-400 mt-1">${r.amount.toLocaleString()} · {r.nights}n</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && <ReservationModal onClose={handleClose} />}
      {selectedRoomNumber && !showModal && <GuestModal onClose={handleClose} />}
    </div>
  )
}
