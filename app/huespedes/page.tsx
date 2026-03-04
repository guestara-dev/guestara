'use client'
// FIX [A-02] Full guest profile modal with edit functionality
// FIX [A-06] Search filter
// FEAT: Historical guests tab
import { useState } from 'react'
import { useStore } from '@/lib/store'
import GuestModal from '@/components/GuestModal'
import { X, Search, User, Phone, Mail, FileText, Save, Users, History } from 'lucide-react'

const statusCls: Record<string,string> = {
  'checked-in':'bg-blue-500/20 text-blue-300','confirmed':'bg-emerald-500/20 text-emerald-300',
  'pending':'bg-amber-500/20 text-amber-300','completed':'bg-gray-500/20 text-gray-400',
  'cancelled':'bg-red-500/20 text-red-400',
}
const statusLabel: Record<string,string> = {
  'checked-in':'En Casa','confirmed':'Confirmada','pending':'Pendiente','completed':'Completada','cancelled':'Cancelada'
}

export default function HuespedesPage() {
  const { reservations, setSelectedGuest, guestProfiles, updateGuestProfile } = useStore()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'activos' | 'historial'>('activos')
  const [profileName, setProfileName] = useState<string|null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editDoc, setEditDoc] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const guests = Object.values(
    reservations.reduce((acc,r)=>{
      if(!acc[r.guest]) acc[r.guest]={name:r.guest,reservations:[],total:0}
      acc[r.guest].reservations.push(r)
      if(r.status!=='cancelled') acc[r.guest].total+=r.amount
      return acc
    },{} as Record<string,{name:string;reservations:typeof reservations;total:number}>)
  ).filter(g=>!search||g.name.toLowerCase().includes(search.toLowerCase()))

  const displayedGuests = guests.filter(g => {
    const hasActive = g.reservations.some(r => ['checked-in', 'confirmed', 'pending'].includes(r.status))
    return activeTab === 'activos' ? hasActive : !hasActive
  })

  const openProfile = (name: string) => {
    const p = guestProfiles[name] ?? {}
    setEditEmail(p.email??''); setEditPhone(p.phone??''); setEditDoc(p.document??''); setEditNotes(p.notes??'')
    setProfileName(name)
  }
  const saveProfile = () => {
    if(!profileName) return
    updateGuestProfile(profileName,{email:editEmail,phone:editPhone,document:editDoc,notes:editNotes})
    setProfileName(null)
  }
  const profileGuest = profileName ? guests.find(g=>g.name===profileName) : null
  
  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Huéspedes</h1>
          <p className="text-gray-400 text-xs">
            {guests.length} huéspedes en total · {reservations.filter(r=>r.status==='checked-in').length} en casa
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800">
          <button 
            onClick={() => setActiveTab('activos')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'activos' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Activos
          </button>
          <button 
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'historial' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historial
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-violet-500 transition-all text-white"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedGuests.length === 0 ? (
          <div className="col-span-2 py-20 text-center bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl">
            <p className="text-gray-500 text-sm">No se encontraron huéspedes en esta categoría.</p>
          </div>
        ) : (
          displayedGuests.map(g=>{
            const active = g.reservations.find(r=>['checked-in','confirmed','pending'].includes(r.status))
            const p = guestProfiles[g.name] ?? {}
            const initials = g.name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()
            return (
              <div key={g.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-sm font-bold shrink-0 text-white">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button onClick={()=>openProfile(g.name)} className="font-medium hover:text-violet-400 transition-colors text-left truncate w-full text-white">
                      {g.name}
                    </button>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.email && <span className="text-[10px] text-gray-500 truncate">{p.email}</span>}
                      {!p.email && <span className="text-[10px] text-gray-600 italic">Sin perfil completo</span>}
                    </div>
                  </div>
                  {active && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${statusCls[active.status]}`}>
                      {statusLabel[active.status]}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2.5">
                  <span>{g.reservations.length} reserva{g.reservations.length>1?'s':''}</span>
                  <span className="font-medium text-white">${g.total} USD</span>
                </div>
                <div className="space-y-1.5">
                  {g.reservations.slice(0,3).map(r=>(
                    <div key={r.id} onClick={()=>['pending','confirmed','checked-in'].includes(r.status)&&setSelectedGuest(r)}
                      className={`rounded-lg px-2.5 py-2 flex justify-between items-center transition-colors ${
                        r.status==='cancelled'?'bg-gray-800/40 opacity-50':'bg-gray-800 hover:bg-gray-700 cursor-pointer'
                      }`}>
                      <span className="text-xs text-gray-300">Hab. {r.room} · {r.checkIn}→{r.checkOut}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusCls[r.status]}`}>{statusLabel[r.status]}</span>
                    </div>
                  ))}
                  {g.reservations.length>3 && (
                    <p className="text-[10px] text-gray-600 text-center">+{g.reservations.length-3} más</p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {profileName && profileGuest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center font-bold text-white">
                  {profileName.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-white">{profileName}</h2>
                  <p className="text-xs text-gray-400">{profileGuest.reservations.length} reservas · ${profileGuest.total} USD</p>
                </div>
              </div>
              <button onClick={()=>setProfileName(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Mail className="w-3 h-3"/>Email</label>
                  <input value={editEmail} onChange={e=>setEditEmail(e.target.value)} placeholder="email@ejemplo.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-violet-500 text-white"/>
                </div>
                <div>
                  <label className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Phone className="w-3 h-3"/>Teléfono</label>
                  <input value={editPhone} onChange={e=>setEditPhone(e.target.value)} placeholder="+56 9..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-violet-500 text-white"/>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 flex items-center gap-1 mb-1"><FileText className="w-3 h-3"/>Documento</label>
                <input value={editDoc} onChange={e=>setEditDoc(e.target.value)} placeholder="RUT / Pasaporte"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-violet-500 text-white"/>
              </div>
              <div>
                <label className="text-xs text-gray-400 flex items-center gap-1 mb-1"><User className="w-3 h-3"/>Notas</label>
                <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} placeholder="Preferencias, alergias, VIP..."
                  rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none text-white"/>
              </div>
              <div className="pt-1">
                <p className="text-xs text-gray-500 font-medium mb-2">Historial de estadías</p>
                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                  {profileGuest.reservations.map(r=>(
                    <div key={r.id} className="flex items-center justify-between text-xs bg-gray-800 rounded-lg px-2.5 py-2">
                      <span className="text-gray-300">Hab. {r.room} · {r.checkIn}→{r.checkOut}</span>
                      <span className="text-gray-400">${r.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800">
              <button onClick={saveProfile}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 py-2.5 rounded-xl text-sm font-medium transition-colors text-white">
                <Save className="w-4 h-4"/>Guardar perfil
              </button>
            </div>
          </div>
        </div>
      )}
      <GuestModal/>
    </div>
  )
}
