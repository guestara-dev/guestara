'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Reservation } from '@/lib/data'
import { LogIn, LogOut, XCircle, Filter, Search } from 'lucide-react'
import AlertDialog from '@/components/AlertDialog'
import PaymentModal from '@/components/PaymentModal'
import GuestModal from '@/components/GuestModal'

type Status = 'all'|'pending'|'confirmed'|'checked-in'|'completed'|'cancelled'

const statusLabel: Record<string,string> = {
  pending:'Pendiente', confirmed:'Confirmada', 'checked-in':'En Casa',
  completed:'Completada', cancelled:'Cancelada',
}
const statusCls: Record<string,string> = {
  pending:'bg-amber-500/20 text-amber-300', confirmed:'bg-emerald-500/20 text-emerald-300',
  'checked-in':'bg-blue-500/20 text-blue-300', completed:'bg-gray-500/20 text-gray-400',
  cancelled:'bg-red-500/20 text-red-400',
}

interface Confirm { title:string; desc:string; action:()=>void; variant:'danger'|'warning' }

export default function ReservasPage() {
  const { reservations, extras, checkIn, cancelReservation, setSelectedGuest } = useStore()

  const [filter,       setFilter]       = useState<Status>('all')
  const [search,       setSearch]       = useState('')
  const [confirm,      setConfirm]      = useState<Confirm|null>(null)
  const [payRes,       setPayRes]       = useState<Reservation|null>(null)   // BUG #5
  const [viewGuest,    setViewGuest]    = useState<Reservation|null>(null)

  // BUG #8 FIX: total includes extras
  const totalRevenue = reservations
    .filter(r => !['cancelled'].includes(r.status))
    .reduce((s,r) => {
      const ext = (extras ?? []).filter(e=>e.reservationId===r.id).reduce((a,e)=>a+e.total,0)
      return s + r.amount + ext
    }, 0)

  const filtered = reservations.filter(r => {
    const matchStatus = filter==='all' || r.status===filter
    const matchSearch = r.guest.toLowerCase().includes(search.toLowerCase()) || r.room.includes(search)
    return matchStatus && matchSearch
  })

  const ask = (title:string, desc:string, action:()=>void, variant:'danger'|'warning') =>
    setConfirm({title,desc,action,variant})

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Reservas</h1>
          {/* BUG #8 FIX: shows total with extras */}
          <p className="text-xs text-gray-400 mt-0.5">
            {reservations.filter(r=>!['cancelled'].includes(r.status)).length} activas ·{' '}
            <span className="text-emerald-400 font-medium">${totalRevenue} USD</span>
            {(extras??[]).length>0 && <span className="text-gray-500"> (incl. extras)</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar huésped..."
            className="bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-violet-500 w-48"/>
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-gray-500"/>
          {(['all','pending','confirmed','checked-in','completed','cancelled'] as Status[]).map(s=>(
            <button key={s} onClick={()=>setFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${filter===s?'bg-violet-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {s==='all'?'Todas':statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/30">
                {['Huésped','Hab.','Check-in','Check-out','Noches','Habitación','Extras','Total','Estado','Acciones'].map(h=>(
                  <th key={h} className="px-3 py-3 text-xs text-gray-400 font-medium text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-500 text-sm">Sin resultados</td></tr>
              ) : filtered.map(r => {
                const resExtras    = (extras??[]).filter(e=>e.reservationId===r.id)
                const extSubtotal  = resExtras.reduce((s,e)=>s+e.total,0)
                return (
                  <tr key={r.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                    <td className="px-3 py-3 text-sm font-medium cursor-pointer hover:text-violet-400 whitespace-nowrap"
                      onClick={()=>setViewGuest(r)}>{r.guest}</td>
                    <td className="px-3 py-3 text-sm text-gray-300">{r.room}</td>
                    <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">{r.checkIn}</td>
                    <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">{r.checkOut}</td>
                    <td className="px-3 py-3 text-xs text-gray-400 text-center">{r.nights}</td>
                    <td className="px-3 py-3 text-sm">${r.amount}</td>
                    <td className="px-3 py-3 text-sm text-blue-400">{extSubtotal>0?`$${extSubtotal}`:'—'}</td>
                    <td className="px-3 py-3 text-sm font-bold text-emerald-400">${r.amount+extSubtotal}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusCls[r.status]}`}>
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        {r.status==='confirmed'&&(
                          <button onClick={()=>ask('Check-in',`Check-in para ${r.guest}?`,()=>checkIn(r.id),'warning')}
                            className="flex items-center gap-1 text-[10px] bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                            <LogIn className="w-3 h-3"/>Check-in
                          </button>
                        )}
                        {/* BUG #5 FIX: checkout → payment modal */}
                        {r.status==='checked-in'&&(
                          <button onClick={()=>setPayRes(r)}
                            className="flex items-center gap-1 text-[10px] bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                            <LogOut className="w-3 h-3"/>Check-out
                          </button>
                        )}
                        {['pending','confirmed'].includes(r.status)&&(
                          <button onClick={()=>ask('Cancelar',`¿Cancelar reserva de ${r.guest}?`,()=>cancelReservation(r.id),'danger')}
                            className="flex items-center gap-1 text-[10px] bg-red-600/20 text-red-300 hover:bg-red-600/40 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                            <XCircle className="w-3 h-3"/>Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BUG #5 FIX: payment modal before checkout */}
      {payRes && (() => {
        const resExtras   = (extras??[]).filter(e=>e.reservationId===payRes.id)
        const extSubtotal = resExtras.reduce((s,e)=>s+e.total,0)
        return (
          <PaymentModal
            reservationId={payRes.id}
            guest={payRes.guest}
            room={payRes.room}
            roomAmount={payRes.amount}
            extrasAmount={extSubtotal}
            onSuccess={() => { setPayRes(null) }}
            onClose={() => setPayRes(null)}
          />
        )
      })()}

      {viewGuest && <GuestModal onClose={()=>setViewGuest(null)}/>}
      {confirm && (
        <AlertDialog open title={confirm.title} description={confirm.desc}
          variant={confirm.variant} confirmLabel="Confirmar" cancelLabel="Cancelar"
          onConfirm={()=>{confirm.action();setConfirm(null)}}
          onCancel={()=>setConfirm(null)}/>
      )}
    </div>
  )
}
