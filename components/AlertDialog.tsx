'use client'
// FIX [C-02] [C-03] [U-02] Reusable confirmation dialog
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export default function AlertDialog({
  open, title, description,
  confirmLabel='Confirmar', cancelLabel='Cancelar',
  variant='warning', onConfirm, onCancel,
}: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${variant==='danger'?'text-red-400':'text-amber-400'}`} />
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
          <button onClick={onCancel} className="ml-auto text-gray-600 hover:text-gray-300 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onCancel}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors">
            {cancelLabel}
          </button>
          <button onClick={() => { onConfirm(); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              variant==='danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
