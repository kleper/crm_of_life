"use client";

export default function OfflinePage() {
  return (
    <main className="flex flex-col flex-1 p-6 h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white p-8 border border-slate-200 shadow-sm rounded-none text-center">
        <div className="text-5xl mb-4 grayscale opacity-60">📡</div>
        <h1 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-wider">Estás Desconectado</h1>
        <p className="text-slate-500 font-medium mb-6">
          Parece que no tienes conexión a internet. Los datos mostrados podrían no estar actualizados.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white font-bold uppercase tracking-wider text-xs px-6 py-3 hover:bg-indigo-700 w-full"
        >
          Reintentar Conexión
        </button>
      </div>
    </main>
  );
}
