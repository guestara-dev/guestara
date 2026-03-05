// BUG-02 FIX: PublicLayout para /login
// Sobreescribe el RootLayout de app/layout.tsx para esta ruta.
// Al definir este layout en app/login/, Next.js App Router lo aplica SOLO
// a las rutas dentro de /login, eliminando Sidebar y Topbar del DOM.
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    // Fondo limpio, sin sidebar ni topbar
    // El RootLayout sigue aplicando el <html>/<body> base
    <div className="min-h-screen bg-gray-950 text-white">
      {children}
    </div>
  )
}
