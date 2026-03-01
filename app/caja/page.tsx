'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import AlertDialog from '@/components/AlertDialog'
import { DollarSign, TrendingUp, LogOut, LogIn, Calendar, CheckCircle, Clock, FileText, CreditCard } from 'lucide-react'

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
  const { reservations, extras, cashClosings = [], payments = [], closeCaja } = useStore()
  const [notes, setNotes] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [tab, setTab] = useState<'hoy'|'historial'|'pagos'>('hoy')
  
  const today = new Date().toLocaleDateString('es-CL', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  
  const checkoutsHoy = reservations.filter(r => r.status === 'completed')
  const checkinsHoy = reservations.filter(r => r.status === 'checked-in')
  const pendientes = reservations.filter(r => ['pending','confirmed'].includes(r.status))
  
  const roomsTotal = reservations.filter(r => r.status !== 'cancelled').reduce((s,r) => s + r.amount, 0)
  const extrasTotal = (extras ?? []).reduce((s,e) => s + e.total, 0)
  const grandTotal = roomsTotal + extrasTotal
  
  // Pagos del período (hoy)
  const paymentsTotal = (payments ?? []).reduce((s,p) => s + p.totalAmount, 0)
  
  const lastClosing = cashClosings.length > 0 ? cashClosings[0] : null

  const stats = [
    { label:'Ingresos Esperados', value:`$${grandTotal}`, sub:'hab. + extras activas', 
      icon:DollarSign, cls:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label:'Pagos Recibidos', value:`$${paymentsTotal}`, sub:`${(payments??[]).length} transacciones`, 
      icon:CreditCard, cls:'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label:'Check-outs', value:String(checkoutsHoy.length), sub:'completados', 
      icon:LogOut, cls:'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label:'Pendientes', value:String(pendientes.length), sub:'por recibir', 
      icon:Clock, cls:'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  ]

  return (
    <div className="p-5 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Caja y Finanzas</h1>
          <p className="text-gray-400 text-xs mt-0.5 capitalize">{today}</p>
          {lastClosing && (
            <p className="text-[10px] text-gray-600 mt-1">
              Último cierre: {lastClosing.date} — ${lastClosing.grandTotal} USD
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {(['hoy','pagos','historial'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                tab===t ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}>
              {t==='hoy' ? 'Resumen' : t==='pagos' ? 'Pagos' : `Cierres (${cashClosings.length})`}
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

          <div className="grid grid-cols-3 gap-5">
            {/* Actividad Reciente */}
            <div className="col-span-2 space-y-5">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Reservas del período</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] text-gray-500 uppercase bg-gray-800/30">
                      <tr>
                        <th className="px-4 py-3 font-medium">Huésped</th>
                        <th className="px-4 py-3 font-medium">Hab.</th>
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                        <th className="px-4 py-3 font-medium text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {reservations.filter(r=>r.status!=='cancelled').slice(0,8).map(r => {
                        const resExtras = (extras??[]).filter(e => e.reservationId === r.id)
                        const total = r.amount + resExtras.reduce((s,e)=>s+e.total, 0)
                        return (
                          <tr key={r.id} className="hover:bg-gray-800/20">
                            <td className="px-4 py-3 text-sm font-medium">{r.guest}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{r.room}</td>
                            <td className="px-4 py-3 text-sm font-bold text-emerald-400 text-right">${total}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusCls[r.status]}`}>
                                {statusLabel[r.status]}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Panel de Cierre */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 h-fit">
              <h2 className="font-semibold mb-1">Cierre de Caja</h2>
              <p className="text-xs text-gray-500 mb-6">Finaliza el turno actual</p>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total recaudado</span>
                  <span className="font-bold text-emerald-400">${paymentsTotal} USD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Transacciones</span>
                  <span>{(payments??[]).length}</span>
                </div>
                <hr className="border-gray-800" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Ingresos proyectados</span>
                  <span className="text-gray-300">${grandTotal}</span>
                </div>
              </div>

              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
                placeholder="Notas o descuadres..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:border-violet-500 resize-none"/>
              
              <button onClick={() => setConfirm(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-semibold transition-colors text-sm">
                Cerrar Caja
              </button>
            </div>
          </div>
        </>
      )}

      {tab === 'pagos' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-800/30 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Huésped</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {payments.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-gray-500">No hay pagos registrados hoy</td></tr>
              ) : payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-800/20">
                  <td className="px-4 py-3 text-xs text-gray-400">{p.date} {p.time}</td>
                  <td className="px-4 py-3 text-sm font-medium">{p.guest}</td>
                  <td className="px-4 py-3 text-xs capitalize text-blue-300">{p.method}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{p.authCode || '—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-400 text-right">${p.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'historial' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden text-center py-20">
           <Calendar className="w-10 h-10 text-gray-800 mx-auto mb-3" />
           <p className="text-gray-500 text-sm">Historial de cierres disponible próximamente</p>
        </div>
      )}

      <AlertDialog open={confirm} title="¿Confirmar Cierre?"
        description={`Se cerrará la caja con un total recaudado de $${paymentsTotal} USD.`}
        variant="warning" confirmLabel="Cerrar Caja" cancelLabel="Cancelar"
        onConfirm={() => { closeCaja(notes); setConfirm(false); setNotes(''); setTab('historial') }}
        onCancel={() => setConfirm(false)}/>
    </div>
  )
}
