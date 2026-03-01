'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Trash2, AlertTriangle, CheckCircle, Settings, Database, ShieldAlert } from 'lucide-react'
import AlertDialog from '@/components/AlertDialog'

export default function ConfiguracionPage() {
  const { resetDashboard } = useStore()
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    try {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('session='))
      if (cookie) {
        const val = JSON.parse(atob(decodeURIComponent(cookie.split('=')[1])))
        setRole(val.role)
      } else {
        setRole('receptionist')
      }
    } catch {
      setRole('receptionist')
    }
  }, [])

  const handleReset = async () => {
    await resetDashboard()
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  const handleOpenSetup = () => {
    if (role === 'admin') {
      router.push('/setup')
    }
  }

  return (
    <div className="p-5 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Configuración</h1>
        <p className="text-xs text-gray-400 mt-0.5">Ajustes del sistema Guestara</p>
      </div>

      {/* Setup wizard link */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
            <Settings className="w-4 h-4 text-violet-400"/>
          </div>
          <div>
            <h2 className="font-semibold text-sm">Información del hotel</h2>
            <p className="text-xs text-gray-400">Nombre, logo, colores y horarios</p>
          </div>
        </div>
        {role === 'admin' ? (
          <button
            onClick={handleOpenSetup}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Settings className="w-4 h-4"/> Abrir asistente de configuración
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-700/40 rounded-xl px-4 py-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0"/>
            <p className="text-xs text-amber-300">Solo el Administrador puede acceder a la configuración del hotel.</p>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-gray-900 border border-red-900/40 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <Database className="w-4 h-4 text-red-400"/>
          </div>
          <div>
            <h2 className="font-semibold text-sm text-red-300">Zona de peligro</h2>
            <p className="text-xs text-gray-400">Acciones irreversibles</p>
          </div>
        </div>
        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-semibold text-red-300">Limpiar base de datos</p>
              <p className="text-xs text-gray-400 mt-1">
                Elimina <strong className="text-white">todas las reservas, pagos, extras y cierres de caja</strong>.
                Las habitaciones vuelven a estado disponible. Esta acción <strong className="text-red-400">no se puede deshacer</strong>.
              </p>
            </div>
          </div>
        </div>
        {done ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4"/>Base limpiada — dashboard en cero
          </div>
        ) : (
          <button onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 border border-red-600/40 hover:border-red-500 text-red-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
            <Trash2 className="w-4 h-4"/> Limpiar base completa
          </button>
        )}
      </div>

      {showConfirm && (
        <AlertDialog
          open
          title="¿Limpiar toda la base?"
          description="Se eliminarán TODAS las reservas, pagos, extras y cierres de caja. Las 30 habitaciones quedarán disponibles. Esta acción es irreversible."
          variant="danger"
          confirmLabel="Sí, limpiar todo"
          cancelLabel="Cancelar"
          onConfirm={() => { setShowConfirm(false); handleReset() }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
