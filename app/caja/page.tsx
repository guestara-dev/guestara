'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import AlertDialog from '@/components/AlertDialog'
import { DollarSign, TrendingUp, LogOut, LogIn, Calendar, CheckCircle, Clock, FileText, CreditCard, X } from 'lucide-react'

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
  const checkinsHoy  = reservations.filter(r => r.status === 'checked-in')
  const pendientes   = reservations.filter(r => ['pending','confirmed'].includes(r.status))

  const roomsTotal   = reservations.filter(r => r.status !== 'cancelled').reduce((s,r) => s + r.amount, 0)
  const extrasTotal  = (extras ?? []).reduce((s,e) => s + e.total, 0)
  const grandTotal   = roomsTotal + extrasTotal

  const paymentsTotal = (payments ?? []).reduce((s,p) => s + p.totalAmount, 0)
  const payByMethod = (method: string) => (payments ?? []).filter(p => p.method === method).reduce((s,p) => s + p.totalAmount, 0)

  const handleClose = () => {
    closeCaja({ notes, roomsTotal, extrasTotal, grandTotal, checkoutsCount: checkoutsHoy.length, checkinsCount: checkinsHoy.length, newReservations: pendientes.length })
    setNotes('')
    setConfirm(false)
  }

  const tabs = [{ id:'hoy', label:'Resumen del Día', icon: Calendar },{ id:'historial', label:'Historial Cierres', icon: FileText },{ id:'pagos', label:'Pagos', icon: CreditCard }] as const

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Caja</h1>
          <p className="text-sm text-zinc-400 capitalize">{today}</p>
        </div>
        <button onClick={() => setConfirm(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold transition">
          <CheckCircle className="w-4 h-4" /> Cerrar Caja
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-700">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-white'
            }`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* TAB: HOY */}
      {tab === 'hoy' && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">Ingresos Habitaciones</p>
              <p className="text-2xl font-bold text-white">${roomsTotal.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">Extras</p>
              <p className="text-2xl font-bold text-amber-400">${extrasTotal.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">Total del Día</p>
              <p className="text-2xl font-bold text-emerald-400">${grandTotal.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">Cobrado</p>
              <p className="text-2xl font-bold text-blue-400">${paymentsTotal.toLocaleString()}</p>
            </div>
          </div>

          {/* Desglose por método de pago */}
          <div className="bg-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Desglose por Método de Pago</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[{key:'cash',label:'Efectivo'},{key:'card_credit',label:'Tarj. Crédito'},{key:'card_debit',label:'Tarj. Débito'},{key:'pos',label:'POS'}].map(m=>(
                <div key={m.key} className="text-center">
                  <p className="text-xs text-zinc-400">{m.label}</p>
                  <p className="text-lg font-bold text-white">${payByMethod(m.key).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reservas activas */}
          <div className="bg-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Reservas Activas ({checkinsHoy.length + pendientes.length})</h3>
            <div className="space-y-2">
              {[...checkinsHoy, ...pendientes].map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-zinc-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-sm">#{r.room}</span>
                    <span className="text-white text-sm font-medium">{r.guest}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusCls[r.status]}`}>{statusLabel[r.status]}</span>
                    <span className="text-white font-semibold">${r.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="bg-zinc-800 rounded-xl p-4">
            <label className="text-sm text-zinc-400 block mb-2">Notas del cierre</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones, incidencias, etc..."
              className="w-full bg-zinc-700 text-white text-sm rounded-lg p-3 h-24 resize-none border border-zinc-600 focus:outline-none focus:border-emerald-500" />
          </div>
        </div>
      )}

      {/* TAB: HISTORIAL */}
      {tab === 'historial' && (
        <div className="space-y-3">
          {cashClosings.length === 0 ? (
            <div className="bg-zinc-800 rounded-xl p-8 text-center">
              <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400">No hay cierres registrados aún</p>
            </div>
          ) : [...cashClosings].reverse().map((c: any) => (
            <div key={c.id} className="bg-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white font-semibold">{c.date}</p>
                  <p className="text-xs text-zinc-400">Cerrado a las {c.closedAt} · por {c.user}</p>
                </div>
                <p className="text-emerald-400 font-bold text-lg">${c.grandTotal?.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400">
                <span><LogOut className="w-3 h-3 inline mr-1" />{c.checkoutsCount} checkouts</span>
                <span><LogIn className="w-3 h-3 inline mr-1" />{c.checkinsCount} checkins</span>
                <span><DollarSign className="w-3 h-3 inline mr-1" />Extras: ${c.extrasTotal?.toLocaleString()}</span>
              </div>
              {c.notes && <p className="mt-2 text-xs text-zinc-500 italic">"{c.notes}"</p>}
            </div>
          ))}
        </div>
      )}

      {/* TAB: PAGOS */}
      {tab === 'pagos' && (
        <div className="space-y-3">
          {(payments ?? []).length === 0 ? (
            <div className="bg-zinc-800 rounded-xl p-8 text-center">
              <CreditCard className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400">No hay pagos registrados</p>
            </div>
          ) : [...(payments ?? [])].reverse().map((p: any) => (
            <div key={p.id} className={`bg-zinc-800 rounded-xl p-4 border-l-4 ${p.status === 'approved' ? 'border-emerald-500' : 'border-red-500'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{p.guest} · Hab {p.room}</p>
                  <p className="text-xs text-zinc-400">{p.date} {p.time} · {p.method === 'cash' ? 'Efectivo' : p.method === 'card_credit' ? 'Crédito' : p.method === 'card_debit' ? 'Débito' : 'POS'}
                    {p.cardLast4 ? ` *${p.cardLast4}` : ''}
                    {p.authCode ? ` · Auth: ${p.authCode}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${p.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>${p.totalAmount?.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500">{p.status === 'approved' ? 'Aprobado' : 'Rechazado'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog
        open={confirm}
        title="Cerrar Caja del Día"
        description={`¿Confirmas el cierre de caja? Total del día: $${grandTotal.toLocaleString()}. Esta acción quedará registrada en el historial.`}
        onConfirm={handleClose}
        onCancel={() => setConfirm(false)}
      />
    </div>
  )
}
