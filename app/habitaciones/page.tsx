'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Room, Reservation } from '@/lib/data'
import { BedDouble, Wrench, Sparkles, UserCheck, X, CheckCircle, User, Plus } from 'lucide-react'
import AlertDialog from '@/components/AlertDialog'
import GuestModal from '@/components/GuestModal'

type RoomStatus = Room['status'] | 'all'

const statusMeta: Record<string,{label:string;cls:string;dot:string}> = {
  available:   { label:'Disponible',  cls:'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', dot:'bg-emerald-400' },
  occupied:    { label:'Ocupada',     cls:'bg-blue-500/10 border-blue-500/30   text-blue-300',   dot:'bg-blue-400'    },
  cleaning:    { label:'Limpieza',    cls:'bg-amber-500/10 border-amber-500/30  text-amber-300',  dot:'bg-amber-400'   },
  maintenance: { label:'Mantención', cls:'bg-gray-500/10  border-gray-500/30   text-gray-400',   dot:'bg-gray-500'    },
}

interface Confirm { title:string; desc:string; action:()=>void }

// P1 FIX: Modal de detalle para habitacion clickeada
function RoomInfoModal({ room, reservation, onClose, onStatusChange }: {
  room: Room
  reservation: Reservation | undefined
  onClose: () => void
  onStatusChange: (status: Room['status']) => void
}) {
  const meta = statusMeta[room.status]
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Hab. {room.number}</h2>
            <p className="text-xs text-gray-500">Piso {room.floor} · {room.type === 'single' ? 'Simple' : 'Doble'}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-4 border ${meta.cls}`}>
          <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
          <span className="text-sm font-medium">{meta.label}</span>
        </div>
        {reservation && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-blue-400 font-medium mb-1">Huésped</p>
            <p className="text-sm text-white font-semibold">{reservation.guest}</p>
            <p className="text-xs text-gray-400">{reservation.checkIn} → {reservation.checkOut}</p>
          </div>
        )}
        <div className="space-y-2">
          {room.status === 'available' && (
            <p className="text-center text-sm text-gray-500 py-2">Habitación libre y disponible.</p>
          )}
          {(room.status === 'cleaning' || room.status === 'maintenance') && (
            <button
              onClick={() => { onStatusChange('available'); onClose() }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Marcar como Disponible
            </button>
          )}
          {room.status === 'maintenance' && (
            <button
              onClick={() => { onStatusChange('cleaning'); onClose() }}
              className="w-full bg-amber-700/40 hover:bg-amber-700/60 py-2.5 rounded-xl text-sm font-medium transition-colors text-amber-300"
            >
              Pasar a Limpieza
            </button>
          )}
          {room.status === 'occupied' && !reservation && (
            <button
              onClick={() => { onStatusChange('available'); onClose() }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Liberar habitación
            </button>
          )}
          <button onClick={onClose} className="w-full bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl text-sm text-gray-400 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HabitacionesPage() {
  const { rooms, reservations, updateRoomStatus, setSelectedGuest } = useStore()
  const [filter, setFilter] = useState<RoomStatus>('all')
  const [confirm, setConfirm] = useState<Confirm|null>(null)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room|null>(null)

  // P4 FIX: solo habitaciones activas (enabled)
  const activeRooms = rooms.filter(r => r.enabled !== false)
  const displayed  = filter === 'all' ? activeRooms : activeRooms.filter(r => r.status === filter)

  const counts = {
    all:         activeRooms.length,
    available:   activeRooms.filter(r=>r.status==='available').length,
    occupied:    activeRooms.filter(r=>r.status==='occupied').length,
    cleaning:    activeRooms.filter(r=>r.status==='cleaning').length,
    maintenance: activeRooms.filter(r=>r.status==='maintenance').length,
  }

  // P1 FIX: TODAS las habitaciones son clickeables
  const handleRoomClick = (room: Room) => {
    const res = reservations.find(r =>
      r.room === room.number && ['checked-in','confirmed','pending'].includes(r.status)
    )
    if (room.status === 'occupied' && res) {
      setSelectedGuest(res)
      setShowGuestModal(true)
    } else {
      setSelectedRoom(room)
    }
  }

  const getRoomReservation = (room: Room) =>
    reservations.find(r => r.room === room.number && ['checked-in','confirmed','pending'].includes(r.status))

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
      <div className="flex flex-wrap gap-2">
        {(['all','available','occupied','cleaning','maintenance'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {s !== 'all' && <div className={`w-1.5 h-1.5 rounded-full ${statusMeta[s].dot}`} />}
            {s === 'all' ? `Todas (${counts.all})` : `${statusMeta[s].label} (${counts[s]})`}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {displayed.map(room => {
          const meta = statusMeta[room.status]
          const res = getRoomReservation(room)
          return (
            <div
              key={room.number}
              onClick={() => handleRoomClick(room)}
              className={`border rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${meta.cls}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white">{room.number}</span>
                <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-gray-400">
                  {room.type === 'single' ? 'S' : 'D'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                <span className="text-xs">{meta.label}</span>
              </div>
              {res && (
                <p className="text-[11px] text-gray-400 truncate mt-1">{res.guest}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* MODALES */}
      {selectedRoom && (
        <RoomInfoModal
          room={selectedRoom}
          reservation={getRoomReservation(selectedRoom)}
          onClose={() => setSelectedRoom(null)}
          onStatusChange={(status) => updateRoomStatus(selectedRoom.number, status)}
        />
      )}
      {confirm && (
        <AlertDialog
          title={confirm.title}
          description={confirm.desc}
          onConfirm={() => { confirm.action(); setConfirm(null) }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {showGuestModal && <GuestModal onClose={() => { setShowGuestModal(false); setSelectedGuest(null) }} />}
    </div>
  )
}
