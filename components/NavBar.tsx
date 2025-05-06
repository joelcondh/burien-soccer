'use client';

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, List } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/profile");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="text-2xl font-bold text-gray-800">
        Burien Soccer
      </Link>

      <div className="flex items-center space-x-6 text-gray-700 text-sm">
        {isDashboard ? (
          <>
            <button onClick={() => router.push("/dashboard")} className="flex items-center space-x-2 hover:text-blue-600">
              <List className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button onClick={() => router.push("/profile")} className="flex items-center space-x-2 hover:text-blue-600">
              <User className="w-4 h-4" />
              <span>Mi Perfil</span>
            </button>

            <button onClick={handleLogout} className="flex items-center space-x-2 hover:text-red-600">
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-blue-600">
              Iniciar sesión
            </Link>

            <Link href="/register" className="hover:text-blue-600">
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
