'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Room } from '@/lib/data'
import { BedDouble, Wrench, Sparkles, UserCheck } from 'lucide-react'
import AlertDialog from '@/components/AlertDialog'
import GuestModal from '@/components/GuestModal'

type RoomStatus = Room['status'] | 'all'

const statusMeta: Record<string,{label:string;cls:string;dot:string}> = {
  available:   { label:'Disponible',  cls:'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', dot:'bg-emerald-400' },
  occupied:    { label:'Ocupada',     cls:'bg-blue-500/10   border-blue-500/30   text-blue-300',     dot:'bg-blue-400' },
  cleaning:    { label:'Limpieza',    cls:'bg-amber-500/10  border-amber-500/30  text-amber-300',    dot:'bg-amber-400' },
  maintenance: { label:'Mantención',  cls:'bg-gray-500/10   border-gray-500/30   text-gray-400',     dot:'bg-gray-500' },
}

interface Confirm { title:string; desc:string; action:()=>void }

export default function HabitacionesPage() {
  const { rooms, reservations, updateRoomStatus, setSelectedGuest } = useStore()
  const [filter, setFilter] = useState<RoomStatus|'all'>('all')
  const [confirm, setConfirm] = useState<Confirm|null>(null)
  const [showGuestModal, setShowGuestModal] = useState(false)

  const ask = (title:string, desc:string, action:()=>void) => setConfirm({title,desc,action})

  // P4 FIX: solo habitaciones activas (enabled)
  const activeRooms = rooms.filter(r => r.enabled !== false)
  const displayed   = filter === 'all' ? activeRooms : activeRooms.filter(r => r.status === filter)

  const counts = {
    all:         activeRooms.length,
    available:   activeRooms.filter(r=>r.status==='available').length,
    occupied:    activeRooms.filter(r=>r.status==='occupied').length,
    cleaning:    activeRooms.filter(r=>r.status==='cleaning').length,
    maintenance: activeRooms.filter(r=>r.status==='maintenance').length,
  }

  const openGuestModal = (room: Room) => {
    const res = reservations.find(r =>
      r.room === room.number && ['checked-in','confirmed','pending'].includes(r.status))
    if (res) {
      setSelectedGuest(res)
      setShowGuestModal(true)
    }
  }

  return (
    <div className="p-5 space-y-5">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold">Habitaciones</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Inventario operativo · {counts.available} disponibles · {counts.occupied} ocupadas · {rooms.filter(r=>r.enabled===false).length} ocultas en configuración
        </p>
      </div>

      {/* FILTROS */}
      <div className="flex gap-2 flex-wrap">
        {(['all','available','occupied','cleaning','maintenance'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {s !== 'all' && <span className={`w-2 h-2 rounded-full ${statusMeta[s].dot}`} />}
            {s === 'all' ? `Todas (${counts.all})` : `${statusMeta[s].label} (${counts[s]})`}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {displayed.map(room => {
          const meta = statusMeta[room.status]
          const res  = reservations.find(r => r.room===room.number && ['checked-in','confirmed','pending'].includes(r.status))
          const canManage = ['cleaning','maintenance'].includes(room.status)
          const canGuest  = room.status === 'occupied' && !!res

          return (
            <div
              key={room.number}
              onClick={() => {
                if (canGuest) openGuestModal(room)
                else if (canManage) ask(
                  `Hab. ${room.number} — ${meta.label}`,
                  '¿Marcar como disponible?',
                  () => updateRoomStatus(room.number, 'available')
                )
              }}
              className={`border rounded-xl p-3 transition-all ${
                (canGuest || canManage) ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'
              } ${meta.cls}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">{room.number}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
              </div>
              <p className="text-[11px] font-medium">{meta.label}</p>
              <p className="text-[10px] opacity-60 mt-0.5">{room.type === 'single' ? 'Simple' : 'Doble'}</p>
              {res && (
                <p className="text-[10px] mt-1.5 truncate opacity-80">{res.guest}</p>
              )}
            </div>
          )
        })}
      </div>

      {confirm && (
        <AlertDialog
          title={confirm.title}
          desc={confirm.desc}
          variant="warning"
          onConfirm={() => { confirm.action(); setConfirm(null) }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {showGuestModal && <GuestModal onClose={() => { setShowGuestModal(false); setSelectedGuest(null) }} />}
    </div>
  )
}
