'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Room } from '@/lib/data'
import { Wrench, Sparkles, X, CheckCircle, BedDouble, User, AlertCircle } from 'lucide-react'

// P1 FIX: Modal unificado para TODOS los estados de habitacion
function RoomDetailModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const { updateRoomStatus, reservations } = useStore()
  const reservation = reservations.find(
    r => r.room === room.number && ['checked-in', 'confirmed', 'pending'].includes(r.status)
  )

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    available:   { label: 'Disponible',  color: 'text-emerald-400', icon: <CheckCircle className="w-6 h-6 text-emerald-400" /> },
    occupied:    { label: 'Ocupada',     color: 'text-blue-400',    icon: <User className="w-6 h-6 text-blue-400" /> },
    cleaning:    { label: 'En Limpieza', color: 'text-amber-400',   icon: <Sparkles className="w-6 h-6 text-amber-400" /> },
    maintenance: { label: 'Mantención', color: 'text-gray-400',    icon: <Wrench className="w-6 h-6 text-gray-400" /> },
  }

  const cfg = statusConfig[room.status] || statusConfig.maintenance

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Hab. {room.number}</h2>
            <p className="text-xs text-gray-500">Piso {room.floor} · {room.type === 'single' ? 'Simple' : 'Doble'}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>

        {/* Estado actual */}
        <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl p-3 mb-4">
          {cfg.icon}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Estado actual</p>
            <p className={`font-semibold ${cfg.color}`}>{cfg.label}</p>
          </div>
        </div>

        {/* Info reserva si existe */}
        {reservation && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-blue-400 font-medium mb-1">Huésped en habitación</p>
            <p className="text-sm text-white font-semibold">{reservation.guest}</p>
            <p className="text-xs text-gray-400">{reservation.checkIn} → {reservation.checkOut}</p>
          </div>
        )}

        {/* Acciones según estado */}
        <div className="space-y-2">
          {room.status === 'available' && (
            <p className="text-center text-sm text-gray-500 py-2">Esta habitación está libre y disponible.</p>
          )}
          {(room.status === 'cleaning' || room.status === 'maintenance') && (
            <button
              onClick={() => { updateRoomStatus(room.number, 'available'); onClose() }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Marcar como Disponible
            </button>
          )}
          {room.status === 'maintenance' && (
            <button
              onClick={() => { updateRoomStatus(room.number, 'cleaning'); onClose() }}
              className="w-full bg-amber-700/40 hover:bg-amber-700/60 py-2.5 rounded-xl text-sm font-medium transition-colors text-amber-300"
            >
              Pasar a Limpieza
            </button>
          )}
          {room.status === 'occupied' && !reservation && (
            <button
              onClick={() => { updateRoomStatus(room.number, 'available'); onClose() }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Liberar habitación
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl text-sm text-gray-400 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function RoomCard({ room, onManage }: { room: Room; onManage: (r: Room) => void }) {
  const typeTag = room.type === 'single' ? 'S' : 'D'

  const statusStyles: Record<string, string> = {
    available:   'border-emerald-500/30 bg-emerald-500/5  hover:bg-emerald-500/10',
    occupied:    'border-blue-500/30    bg-blue-500/5     hover:bg-blue-500/10',
    cleaning:    'border-amber-500/30   bg-amber-950/20   hover:bg-amber-950/40',
    maintenance: 'border-gray-600/40   bg-gray-800/20    hover:bg-gray-800/40',
  }

  const dotColors: Record<string, string> = {
    available:   'bg-emerald-400',
    occupied:    'bg-blue-400',
    cleaning:    'bg-amber-400',
    maintenance: 'bg-gray-500',
  }

  const labels: Record<string, string> = {
    available:   'Libre',
    occupied:    'Ocupada',
    cleaning:    'Limpieza',
    maintenance: 'Mant.',
  }

  const style = statusStyles[room.status] || statusStyles.maintenance
  const dot = dotColors[room.status] || 'bg-gray-500'
  const label = labels[room.status] || room.status

  return (
    // P1 FIX: TODAS las tarjetas son clickeables
    <div
      onClick={() => onManage(room)}
      className={`border rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${style}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-base font-semibold text-gray-200 leading-none">{room.number}</span>
        <span className="text-[9px] bg-gray-800 text-gray-500 px-1 py-0.5 rounded">{typeTag}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${dot}`}></div>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    </div>
  )
}

export default function RoomGrid() {
  const { rooms } = useStore()
  const [mounted, setMounted] = useState(false)
  const [managingRoom, setManagingRoom] = useState<Room | null>(null)
  useEffect(() => setMounted(true), [])

  // P1 FIX: Filter rooms by enabled status
  const activeRooms = rooms.filter(r => r.enabled !== false)

  if (!mounted) return (
    <div className="grid grid-cols-4 gap-2">
      {Array(20).fill(0).map((_,i)=>
        <div key={i} className="h-16 bg-gray-800/40 rounded-xl animate-pulse" />
      )}
    </div>
  )

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {activeRooms.map(room => (
          <RoomCard key={room.number} room={room} onManage={setManagingRoom} />
        ))}
      </div>
      {managingRoom && (
        <RoomDetailModal room={managingRoom} onClose={() => setManagingRoom(null)} />
      )}
    </div>
  )
}
