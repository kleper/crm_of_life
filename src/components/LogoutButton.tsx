"use client";

import { logoutAction } from "@/app/actions";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="text-sm text-red-600 hover:text-red-800 font-medium">
        Cerrar Sesión
      </button>
    </form>
  );
}
