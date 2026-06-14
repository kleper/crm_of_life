"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        rememberMe: rememberMe ? "true" : "false",
        redirect: false,
      });

      if (res?.error) {
        setError("Credenciales inválidas. Por favor intenta de nuevo.");
        setLoading(false);
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setError("Ocurrió un error inesperado.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}
      
      <div>
        <Input 
          label="Email"
          name="email" 
          type="email" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
        />
      </div>
      
      <div>
        <Input 
          label="Contraseña"
          name="password" 
          type="password" 
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input 
          type="checkbox" 
          id="rememberMe" 
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded-none border-gray-300 text-indigo-600 focus:ring-indigo-600"
        />
        <div className="flex flex-col">
          <label htmlFor="rememberMe" className="text-sm font-medium text-slate-700">Recordarme en este dispositivo</label>
          <span className="text-xs text-slate-500">Mantén tu sesión activa para recibir notificaciones y acceder rápido.</span>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full mt-2" 
        size="lg"
        disabled={loading}
      >
        {loading ? "Verificando..." : "Entrar a tu espacio"}
      </Button>
    </form>
  );
}
