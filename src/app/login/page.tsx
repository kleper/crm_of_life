import LoginForm from "./LoginForm"

export default async function LoginPage(props: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const searchParams = await props.searchParams
  const callbackUrl = searchParams?.callbackUrl || "/select-tenant"

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Lado izquierdo: Branding e Ilustración Geométrica */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Patrón geométrico sutil de fondo */}
        <svg className="absolute inset-0 w-full h-full opacity-10" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridPattern)" />
          
          <circle cx="80%" cy="20%" r="150" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <rect x="10%" y="60%" width="300" height="300" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" transform="rotate(45 10% 60%)" />
        </svg>

        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white tracking-tight">CRM VIDA</h1>
          <p className="text-indigo-200 mt-4 text-lg font-medium max-w-sm">
            Convierte tus tareas diarias en un juego. Sube de nivel, mantén tu racha y organiza tus contactos sin fricción.
          </p>
        </div>

        <div className="relative z-10 flex gap-4 text-white opacity-80">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-indigo-500 font-bold text-xs">🚀</span>
            <span className="font-bold text-sm">Progreso</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-indigo-500 font-bold text-xs">👥</span>
            <span className="font-bold text-sm">Equipo</span>
          </div>
        </div>
      </div>

      {/* Lado derecho: Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md bg-white p-8 border border-slate-200 shadow-xl relative z-10">
          <div className="text-left mb-8">
            <div className="md:hidden text-indigo-600 font-black text-2xl tracking-tight mb-6">CRM VIDA</div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido</h2>
            <p className="text-slate-500 mt-2">Inicia sesión en tu cuenta para continuar</p>
          </div>
          
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  )
}
