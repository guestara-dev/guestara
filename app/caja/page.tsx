'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import AlertDialog from '@/components/AlertDialog'
import { DollarSign, TrendingUp, LogOut, LogIn, Calendar, CheckCircle, Clock, FileText } from 'lucide-react'

const statusCls: Record<string,string> = {
  'checked-in':'bg-blue-500/20 text-blue-300', 'completed':'bg-gray-500/20 text-gray-400',
  'confirmed':'bg-emerald-500/20 text-emerald-300', 'pending':'bg-amber-500/20 text-amber-300',
  'cancelled':'bg-red-500/20 text-red-400',
}
const statusLabel: Record<string,string> = {
  'checked-in':'En Casa', completed:'Completada', confirmed:'Confirmada',
  pending:'Pendiente', cancelled:'Cancelada',
}

export default function CajaPage() {
  const { reservations, extras, cashClosings = [], closeCaja } = useStore()
  const [notes,   setNotes]   = useState('')
  const [confirm, setConfirm] = useState(false)
  const [tab,     setTab]     = useState<'hoy'|'historial'>('hoy')

  const today       = new Date().toLocaleDateString('es-CL', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  const checkoutsHoy = reservations.filter(r => r.status === 'completed')
  const checkinsHoy  = reservations.filter(r => r.status === 'checked-in')
  const pendientes   = reservations.filter(r => ['pending','confirmed'].includes(r.status))
  const roomsTotal   = reservations.filter(r => r.status !== 'cancelled').reduce((s,r) => s + r.amount, 0)
  const extrasTotal  = (extras ?? []).reduce((s,e) => s + e.total, 0)
  const grandTotal   = roomsTotal + extrasTotal
  const lastClosing  = cashClosings.length > 0 ? cashClosings[0] : null

  const stats = [
    { label:'Ingresos totales',       value:`$${grandTotal}`, sub:'habitaciones + extras',
      icon:DollarSign, cls:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label:'Por habitaciones',       value:`$${roomsTotal}`, sub:`${reservations.filter(r=>r.status!=='cancelled').length} reservas`,
      icon:TrendingUp, cls:'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    { label:'Por extras',             value:`$${extrasTotal}`, sub:`${(extras??[]).length} ítems facturados`,
      icon:FileText,   cls:'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label:'Check-outs completados', value:String(checkoutsHoy.length), sub:'del período',
      icon:LogOut,     cls:'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ]

  return (
    <div className="p-5 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Cierre de Caja</h1>
          <p className="text-gray-400 text-xs mt-0.5 capitalize">{today}</p>
          {lastClosing && (
            <p className="text-[10px] text-gray-600 mt-1">
              Último cierre: {lastClosing.date} a las {lastClosing.closedAt} — ${lastClosing.grandTotal} USD
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {(['hoy','historial'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                tab===t ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}>
              {t==='hoy' ? 'Actividad del día' : `Historial (${cashClosings.length})`}
            </button>
          ))}
        </div>
      </div>

      {tab === 'hoy' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {stats.map(({ label,value,sub,icon:Icon,cls }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${cls}`}><Icon className="w-4 h-4"/></div>
                </div>
              </div>
            ))}
          </div>

          {/* Reservations table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Reservas del período</h2>
              <span className="text-xs text-gray-500">
                {reservations.filter(r=>r.status!=='cancelled').length} activas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/30">
                    {['Huésped','Hab.','Check-in','Check-out','Noches','Habitación','Extras','Total','Estado'].map(h=>(
                      <th key={h} className="px-3 py-2.5 text-xs text-gray-400 font-medium text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservations.filter(r=>r.status!=='cancelled').map(r => {
                    const resExtras  = (extras??[]).filter(e => e.reservationId === r.id)
                    const extSubtotal = resExtras.reduce((s,e)=>s+e.total, 0)
                    return (
                      <tr key={r.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                        <td className="px-3 py-2.5 text-sm font-medium whitespace-nowrap">{r.guest}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-300">{r.room}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-400">{r.checkIn}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-400">{r.checkOut}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-400 text-center">{r.nights}</td>
                        <td className="px-3 py-2.5 text-sm">${r.amount}</td>
                        <td className="px-3 py-2.5 text-sm text-blue-400">{extSubtotal>0?`$${extSubtotal}`:'—'}</td>
                        <td className="px-3 py-2.5 text-sm font-bold text-emerald-400">${r.amount+extSubtotal}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusCls[r.status]}`}>
                            {statusLabel[r.status]}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-800/50 border-t border-gray-700">
                    <td colSpan={6} className="px-3 py-3 text-sm font-semibold text-right text-gray-300">Totales:</td>
                    <td className="px-3 py-3 text-sm font-bold text-blue-400">${extrasTotal}</td>
                    <td className="px-3 py-3 text-base font-extrabold text-emerald-400">${grandTotal} USD</td>
                    <td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Extras detail */}
          {(extras??[]).length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <h2 className="text-sm font-semibold">Extras facturados — ${extrasTotal} USD</h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2">
                {(extras??[]).map(e => {
                  const res = reservations.find(r=>r.id===e.reservationId)
                  return (
                    <div key={e.instanceId} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-xs font-medium">{e.name} <span className="text-gray-500">×{e.quantity}</span></p>
                        <p className="text-[10px] text-gray-500">{res?.guest ?? '—'} — Hab. {res?.room}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">${e.total}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Close caja panel */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold">Cerrar Caja</h2>
                <p className="text-xs text-gray-400 mt-0.5">Registra el resumen del día con los totales actuales</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-emerald-400">${grandTotal} USD</p>
                <p className="text-xs text-gray-500">total del período</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="bg-gray-800 rounded-lg p-3">
                <LogOut className="w-4 h-4 text-amber-400 mx-auto mb-1"/>
                <p className="text-lg font-bold">{checkoutsHoy.length}</p>
                <p className="text-[10px] text-gray-400">Check-outs</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <LogIn className="w-4 h-4 text-blue-400 mx-auto mb-1"/>
                <p className="text-lg font-bold">{checkinsHoy.length}</p>
                <p className="text-[10px] text-gray-400">En casa</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <Clock className="w-4 h-4 text-violet-400 mx-auto mb-1"/>
                <p className="text-lg font-bold">{pendientes.length}</p>
                <p className="text-[10px] text-gray-400">Pendientes</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1.5">Notas del cierre (opcional)</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
                placeholder="Observaciones del turno, incidencias, pagos en efectivo..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none"/>
            </div>
            <button onClick={() => setConfirm(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-semibold transition-colors">
              <CheckCircle className="w-5 h-5"/>
              Cerrar Caja — ${grandTotal} USD
            </button>
          </div>
        </>
      )}

      {/* Historial */}
      {tab === 'historial' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {cashClosings.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-10 h-10 text-gray-700 mx-auto mb-3"/>
              <p className="text-gray-500 text-sm">Aún no hay cierres registrados</p>
              <p className="text-gray-600 text-xs mt-1">Los cierres diarios aparecerán aquí</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/30">
                    {['Fecha','Hora','Hab.','Extras','Total','En casa','Check-outs','Usuario','Notas'].map(h=>(
                      <th key={h} className="px-4 py-3 text-xs text-gray-400 font-medium text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cashClosings.map(c => (
                    <tr key={c.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                      <td className="px-4 py-3 text-sm font-medium">{c.date}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{c.closedAt}</td>
                      <td className="px-4 py-3 text-sm">${c.roomsTotal}</td>
                      <td className="px-4 py-3 text-sm text-blue-400">${c.extrasTotal}</td>
                      <td className="px-4 py-3 text-sm font-bold text-emerald-400">${c.grandTotal}</td>
                      <td className="px-4 py-3 text-xs text-center text-gray-400">{c.checkinsCount}</td>
                      <td className="px-4 py-3 text-xs text-center text-gray-400">{c.checkoutsCount}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.user}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">{c.notes||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={confirm} title="Cerrar Caja"
        description={`¿Confirmas el cierre por $${grandTotal} USD? Se registrará en el historial.`}
        variant="warning" confirmLabel="Sí, cerrar caja" cancelLabel="Cancelar"
        onConfirm={() => { closeCaja(notes); setConfirm(false); setNotes(''); setTab('historial') }}
        onCancel={() => setConfirm(false)}/>
    </div>
  )
}
