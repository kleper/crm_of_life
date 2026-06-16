"use client";

import { useState } from "react";
import { getKudoOptions } from "@/lib/kudos";
import { Button } from "@/components/ui/Button";
import SendKudoModal from "@/components/kudos/SendKudoModal";

function Avatar({ name, image, size = "md" }: { name: string, image?: string | null, size?: "sm" | "md" | "lg" }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  let sizeClass = "w-8 h-8 text-xs";
  if (size === "sm") sizeClass = "w-6 h-6 text-[10px]";
  if (size === "lg") sizeClass = "w-10 h-10 text-sm";
  
  return (
    <div className={`rounded-none bg-slate-200 text-slate-700 flex items-center justify-center font-bold ${sizeClass} overflow-hidden border border-slate-300`} title={name}>
      {image ? <img src={image} alt={name} className="w-full h-full object-cover" /> : initial}
    </div>
  );
}

function KudoCard({ kudo, mode }: { kudo: any, mode: "received" | "sent" | "wall" }) {
  const options = getKudoOptions();
  const meta = options.find(o => o.type === kudo.type);

  const dateStr = new Date(kudo.createdAt).toLocaleDateString("es-ES", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white border border-slate-200 p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
      <div className="text-4xl bg-indigo-50 border border-indigo-100 p-3 rounded-none flex-shrink-0">
        {meta?.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h4 className="font-bold text-slate-800 text-base">{meta?.label}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              {mode === "received" && (
                <><span>De:</span> <Avatar name={kudo.fromUser?.name} image={kudo.fromUser?.image} size="sm" /> <span>{kudo.fromUser?.name}</span></>
              )}
              {mode === "sent" && (
                <><span>Para:</span> <Avatar name={kudo.toUser?.name} image={kudo.toUser?.image} size="sm" /> <span>{kudo.toUser?.name}</span></>
              )}
              {mode === "wall" && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-slate-700">{kudo.fromUser?.name}</span>
                  <span>reconoció a</span>
                  <span className="font-medium text-slate-700">{kudo.toUser?.name}</span>
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 whitespace-nowrap">{dateStr}</span>
        </div>
        
        {kudo.message && (
          <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 border-l-2 border-indigo-300 italic">
            "{kudo.message}"
          </p>
        )}
      </div>
    </div>
  );
}

export default function KudosClient({ receivedKudos, sentKudos, summary, publicWall, currentUserId, tenantUsers }: any) {
  const [tab, setTab] = useState<"wall" | "received" | "sent">("wall");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const options = getKudoOptions();

  return (
    <div className="flex flex-col gap-6">
      {/* Medallero */}
      <div className="bg-white border border-slate-200 p-4 md:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-bold text-slate-800">Mi Medallero</h2>
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">+ Enviar Kudo</Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 md:gap-4">
          {options.map(opt => {
            const count = summary.received[opt.type] || 0;
            const hasReceived = count > 0;
            return (
              <div 
                key={opt.type} 
                className={`flex flex-col items-center p-3 border transition-all ${hasReceived ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-slate-50 opacity-60 grayscale"}`}
              >
                <span className="text-3xl mb-1">{opt.icon}</span>
                <span className="text-[10px] text-center font-bold text-slate-600 leading-tight h-6">
                  {opt.label}
                </span>
                {hasReceived && (
                  <span className="mt-1 text-xs font-black text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                    x{count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-row overflow-x-auto gap-1 sm:gap-2 border-b border-slate-200 shrink-0 scrollbar-hide">
        <button 
          onClick={() => setTab("wall")}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold uppercase transition-colors whitespace-nowrap ${tab === "wall" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500 hover:text-slate-800"}`}
        >
          Equipo
        </button>
        <button 
          onClick={() => setTab("received")}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold uppercase transition-colors whitespace-nowrap ${tab === "received" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500 hover:text-slate-800"}`}
        >
          Recibidos
        </button>
        <button 
          onClick={() => setTab("sent")}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold uppercase transition-colors whitespace-nowrap flex items-center gap-1.5 ${tab === "sent" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500 hover:text-slate-800"}`}
        >
          Enviados
          <span className="text-[9px] sm:text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-none tracking-tighter">
            {summary.totalSent}/3 hoy
          </span>
        </button>
      </div>

      {/* List */}
      <div className="pb-8">
        <div className="flex flex-col gap-4 max-w-3xl">
          {tab === "wall" && publicWall.length === 0 && (
            <div className="text-center p-10 border border-dashed border-slate-300 text-slate-500">
              <span className="text-4xl block mb-2">🌱</span>
              Aún no hay reconocimientos en el equipo. ¡Sé el primero en enviar uno!
            </div>
          )}
          {tab === "wall" && publicWall.map((k: any) => <KudoCard key={k.id} kudo={k} mode="wall" />)}

          {tab === "received" && receivedKudos.length === 0 && (
            <div className="text-center p-10 border border-dashed border-slate-300 text-slate-500">
              <span className="text-4xl block mb-2">🎁</span>
              Aún no has recibido reconocimientos. ¡Sigue dando lo mejor de ti!
            </div>
          )}
          {tab === "received" && receivedKudos.map((k: any) => <KudoCard key={k.id} kudo={k} mode="received" />)}

          {tab === "sent" && sentKudos.length === 0 && (
            <div className="text-center p-10 border border-dashed border-slate-300 text-slate-500">
              <span className="text-4xl block mb-2">🚀</span>
              No has enviado ningún reconocimiento. ¡Anima a tus compañeros!
            </div>
          )}
          {tab === "sent" && sentKudos.map((k: any) => <KudoCard key={k.id} kudo={k} mode="sent" />)}
        </div>
      </div>

      <SendKudoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantUsers={tenantUsers}
        currentUserId={currentUserId}
      />
    </div>
  );
}
