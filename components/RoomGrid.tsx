'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Room } from '@/lib/data'
import { Plus, Wrench, Sparkles, User, X, CheckCircle, Calendar } from 'lucide-react'

function RoomStatusModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const { updateRoomStatus } = useStore()
  const isMaint = room.status === 'maintenance'
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Hab. {room.number}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white"/></button>
        </div>
        <div className={`rounded-xl p-4 mb-4 text-center ${isMaint?'bg-gray-800/60':'bg-amber-950/30'}`}>
          {isMaint ? <Wrench className="w-8 h-8 text-gray-500 mx-auto mb-2"/> : <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2"/>}
          <p className="font-medium capitalize">{room.status === 'maintenance' ? 'En mantención' : 'En limpieza'}</p>
          <p className="text-xs text-gray-400 mt-1">Piso {room.floor} · {room.type}</p>
        </div>
        <div className="space-y-2">
          <button onClick={() => { updateRoomStatus(room.number, 'available'); onClose() }}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <CheckCircle className="w-4 h-4"/> Marcar como Disponible
          </button>
          {isMaint && (
            <button onClick={() => { updateRoomStatus(room.number, 'cleaning'); onClose() }}
              className="w-full bg-amber-700/40 hover:bg-amber-700/60 py-2.5 rounded-xl text-sm font-medium transition-colors text-amber-300">
              Pasar a Limpieza
            </button>
          )}
          <button onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl text-sm text-gray-400 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function RoomCard({ room, onManage }: { room: Room; onManage: (r: Room) => void }) {
  const typeTag = room.type === 'single' ? 'S' : 'D'
  
  if (room.status === 'available') {
    return (
      <div className="group bg-gray-900/40 border border-gray-800 rounded-xl p-2.5 hover:border-violet-500/50 transition-all cursor-default">
        <div className="flex items-start justify-between">
          <span className="text-base font-semibold text-gray-400 group-hover:text-violet-400 transition-colors leading-none">{room.number}</span>
          <span className="text-[9px] bg-gray-800 text-gray-500 px-1 py-0.5 rounded">{typeTag}</span>
        </div>
        <div className="mt-2 text-center py-2">
          <div className="w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-1 group-hover:bg-emerald-500/20 transition-colors">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          </div>
          <p className="text-[10px] text-emerald-500/80 font-medium">Libre</p>
        </div>
      </div>
    )
  }

  if (room.status === 'occupied') {
    return (
      <div className="bg-violet-600/10 border border-violet-500/30 rounded-xl p-2.5 relative overflow-hidden group">
        <div className="flex items-start justify-between relative z-10">
          <span className="text-base font-semibold text-violet-300 leading-none">{room.number}</span>
          <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1 py-0.5 rounded">{typeTag}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 relative z-10">
          <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-violet-400"/>
          </div>
          <span className="text-[10px] text-violet-200 font-medium">Ocupada</span>
        </div>
        <div className="absolute -right-2 -bottom-2 opacity-5">
          <User className="w-12 h-12 text-white"/>
        </div>
      </div>
    )
  }

  if (room.status === 'cleaning') {
    return (
      <div onClick={() => onManage(room)} 
        className="border border-amber-600/30 bg-amber-950/20 rounded-xl p-2.5 cursor-pointer hover:bg-amber-950/40 opacity-70 hover:opacity-90 transition-all">
        <div className="flex items-start justify-between">
          <span className="text-base font-semibold text-amber-600/80 leading-none">{room.number}</span>
          <span className="text-[9px] bg-amber-500/10 text-amber-600/70 px-1 py-0.5 rounded">{typeTag}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1 text-amber-600/70">
          <Sparkles className="w-2.5 h-2.5"/><span className="text-[10px]">Limpieza</span>
        </div>
      </div>
    )
  }

  return (
    <div onClick={() => onManage(room)} 
      className="border border-gray-600/50 bg-gray-800/30 rounded-xl p-2.5 cursor-pointer hover:bg-gray-800/50 hover:opacity-70 opacity-50 transition-all">
      <div className="flex items-start justify-between">
        <span className="text-base font-semibold text-gray-500 leading-none">{room.number}</span>
        <span className="text-[9px] bg-gray-700/30 text-gray-600 px-1 py-0.5 rounded">{typeTag}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1 text-gray-600">
        <Wrench className="w-2.5 h-2.5"/><span className="text-[10px]">Mant.</span>
      </div>
    </div>
  )
}

export default function RoomGrid() {
  const { rooms, reservations } = useStore()
  const [mounted, setMounted] = useState(false)
  const [managingRoom, setManagingRoom] = useState<Room | null>(null)

  useEffect(() => setMounted(true), [])

  // FIX: Filter rooms by enabled status
  const activeRooms = rooms.filter(r => r.enabled)
  const disabledCount = rooms.length - activeRooms.length

  if (!mounted) return <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2 animate-pulse">{Array(20).fill(0).map((_,i)=><div key={i} className="aspect-square bg-gray-800 rounded-xl"/>)}</div>

  return (
    <div className="space-y-4">
      {disabledCount > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-900/50 border border-gray-800 w-fit px-3 py-1 rounded-full italic">
          <Plus className="w-3 h-3 rotate-45"/> {disabledCount} habitaciones ocultas (deshabilitadas)
        </div>
      )}
      
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2">
        {activeRooms.map(room => (
          <RoomCard key={room.number} room={room} onManage={setManagingRoom} />
        ))}
      </div>

      {managingRoom && <RoomStatusModal room={managingRoom} onClose={() => setManagingRoom(null)} />}
    </div>
  )
}
