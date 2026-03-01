'use client'
// Solución definitiva al hydration mismatch de Next.js + localStorage
// Envuelve todo el contenido dinámico en un único boundary cliente.
import { useState, useEffect, ReactNode } from 'react'

export default function ClientOnly({ children, fallback }: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <>{fallback ?? null}</>
  return <>{children}</>
}
