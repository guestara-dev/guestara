'use client'
// FIX bug: multiline strings now use template literals — no more "Unterminated string constant"
// FIX [C-08] Context-aware AI responses
// FIX [M-03] Markdown rendering
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Room, Reservation } from '@/lib/data'
import MarkdownText from '@/components/MarkdownText'

type Msg = { role: 'ai' | 'user'; text: string }

function generateResponse(input: string, rooms: Room[], reservations: Reservation[]): string {
  const q        = input.toLowerCase()
  const available = rooms.filter(r => r.status === 'available')
  const cleaning  = rooms.filter(r => r.status === 'cleaning')
  const maint     = rooms.filter(r => r.status === 'maintenance')
  const inHouse   = reservations.filter(r => r.status === 'checked-in')
  const confirmed = reservations.filter(r => r.status === 'confirmed')
  const pending   = reservations.filter(r => r.status === 'pending')
  const occ       = rooms.filter(r => r.status === 'occupied').length
  const pct       = Math.round(occ / rooms.length * 100)
  const singles   = available.filter(r => r.type === 'single')
  const doubles   = available.filter(r => r.type === 'double')

  if (q.includes('disponible') || q.includes('libre') || q.includes('habitaci')) {
    if (available.length === 0) return 'No hay habitaciones disponibles en este momento. Todas están ocupadas o en mantenimiento.'
    const parts = [`**Habitaciones disponibles: ${available.length}**`]
    if (singles.length) parts.push(`**Singles** ($89/noche): ${singles.map(x => x.number).join(', ')}`)
    if (doubles.length) parts.push(`**Dobles** ($129/noche): ${doubles.map(x => x.number).join(', ')}`)
    return parts.join('\n')
  }

  if (q.includes('single')) {
    if (!singles.length) return 'No hay habitaciones single disponibles ahora.'
    return `**Singles disponibles (${singles.length}):** ${singles.map(x => x.number).join(', ')} — $89/noche`
  }

  if (q.includes('doble') || q.includes('double')) {
    if (!doubles.length) return 'No hay habitaciones doble disponibles ahora.'
    return `**Dobles disponibles (${doubles.length}):** ${doubles.map(x => x.number).join(', ')} — $129/noche`
  }

  if (q.includes('en casa') || q.includes('check-in') || q.includes('huesped') || q.includes('huésped') || q.includes('ocupad')) {
    if (!inHouse.length) return 'No hay huéspedes con check-in activo en este momento.'
    const lines = [`**Huéspedes en casa (${inHouse.length}):**`]
    inHouse.forEach(x => lines.push(`- **${x.guest}** — Hab. ${x.room} (sale ${x.checkOut})`))
    return lines.join('\n')
  }

  if (q.includes('ocupaci') || q.includes('estadística') || q.includes('reporte') || q.includes('resumen')) {
    return [
      `**Resumen de ocupación:**`,
      `- Ocupación: **${pct}%** (${occ}/${rooms.length} habitaciones)`,
      `- En casa: **${inHouse.length}** huéspedes`,
      `- Disponibles: **${available.length}** habitaciones`,
      `- En limpieza: **${cleaning.length}** · En mantención: **${maint.length}**`,
    ].join('\n')
  }

  if (q.includes('pendiente') || q.includes('confirmar')) {
    if (!pending.length) return 'No hay reservas pendientes de confirmación.'
    const lines = [`**Reservas pendientes (${pending.length}):**`]
    pending.forEach(x => lines.push(`- ${x.guest} — Hab. ${x.room} (${x.checkIn})`))
    return lines.join('\n')
  }

  if (q.includes('llega') || q.includes('hoy') || q.includes('mañana')) {
    return [
      `**Actividad de hoy:**`,
      `- Huéspedes en casa: ${inHouse.length}`,
      `- Por llegar (confirmadas): ${confirmed.length}`,
      `- Pendientes de confirmar: ${pending.length}`,
    ].join('\n')
  }

  if (q.includes('precio') || q.includes('tarifa') || q.includes('costo')) {
    return [
      `**Tarifas vigentes:**`,
      `- **Single** (1 persona): $89 USD/noche`,
      `- **Doble** (2 personas): $129 USD/noche`,
      ``,
      `Puedes agregar extras como desayuno, spa, transfer y más desde el perfil de cada reserva.`,
    ].join('\n')
  }

  if (q.includes('limpieza')) {
    if (!cleaning.length) return 'No hay habitaciones en limpieza actualmente.'
    return `**Habitaciones en limpieza (${cleaning.length}):** ${cleaning.map(r => r.number).join(', ')}`
  }

  if (q.includes('mantenci') || q.includes('mantención')) {
    if (!maint.length) return 'No hay habitaciones en mantención.'
    return `**Habitaciones en mantención (${maint.length}):** ${maint.map(r => r.number).join(', ')}`
  }

  return [
    `Actualmente hay **${available.length} habitaciones disponibles** y **${inHouse.length} huéspedes en casa**.`,
    `La ocupación es del **${pct}%**.`,
    ``,
    `Puedo ayudarte con: disponibilidad, huéspedes activos, ocupación, tarifas, próximas llegadas o estado de habitaciones.`,
  ].join('\n')
}

export default function ConciergePage() {
  const { rooms, reservations } = useStore()
  const available = rooms.filter(r => r.status === 'available').length
  const inHouse   = reservations.filter(r => r.status === 'checked-in').length

  const welcome = [
    `Hola 👋 Soy el **Concierge IA** de Guestara.`,
    ``,
    `Actualmente hay **${available} habitaciones disponibles** y **${inHouse} huéspedes en casa**.`,
    ``,
    `Puedo responder preguntas como:`,
    `- ¿Qué habitaciones singles están disponibles?`,
    `- ¿Quién está en casa hoy?`,
    `- ¿Cuál es la ocupación actual?`,
    `- ¿Cuáles son las tarifas?`,
  ].join('\n')

  const [chat,  setChat]  = useState<Msg[]>([{ role:'ai', text: welcome }])
  const [input, setInput] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.scrollIntoView({ behavior:'smooth' }) }, [chat])

  const send = () => {
    if (!input.trim()) return
    const userMsg = input.trim(); setInput('')
    setChat(p => [...p, { role:'user', text:userMsg }])
    setTimeout(() => {
      const reply = generateResponse(userMsg, rooms, reservations)
      setChat(p => [...p, { role:'ai', text:reply }])
    }, 500)
  }

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      <div>
        <h1 className="text-xl font-bold">IA Concierge</h1>
        <p className="text-gray-400 text-xs">{inHouse} huéspedes en casa · {available} disponibles</p>
      </div>
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chat.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':''}`}>
              {m.role==='ai' && (
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5"/>
                </div>
              )}
              <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.role==='ai' ? 'bg-gray-800 text-gray-100 rounded-tl-sm' : 'bg-violet-600 text-white rounded-tr-sm'
              }`}>
                {m.role==='ai' ? <MarkdownText text={m.text}/> : m.text}
              </div>
              {m.role==='user' && (
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5"/>
                </div>
              )}
            </div>
          ))}
          <div ref={ref}/>
        </div>
        <div className="p-3 border-t border-gray-800 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && send()}
            placeholder="Ej: ¿Qué habitaciones hay disponibles? ¿Quién está en casa?"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"/>
          <button onClick={send} className="bg-violet-600 hover:bg-violet-500 px-3 py-2 rounded-xl transition-colors">
            <Send className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>
  )
}
