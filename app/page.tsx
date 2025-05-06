'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (data?.user) {
        setUser(data.user);

        const { data: perfilData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", data.user.id)
          .single();

        setPerfil(perfilData);
      }
    };

    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 flex justify-center items-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full text-center animate-fadeIn">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Bienvenido a Burien Soccer</h1>
        <p className="text-lg text-gray-600 mb-8">Organiza tus partidos de fútbol cada domingo. Reserva tu lugar y mantente al día.</p>

        {!user ? (
          <>
            <button 
              onClick={() => router.push("/login")}
              className="block bg-blue-600 hover:bg-blue-700 text-white text-center px-6 py-3 rounded-lg w-full mb-4 transition"
            >
              Iniciar Sesión
            </button>

            <button 
              onClick={() => router.push("/register")}
              className="block bg-green-600 hover:bg-green-700 text-white text-center px-6 py-3 rounded-lg w-full transition"
            >
              Registrarse
            </button>
          </>
        ) : (
          <>
            <p className="mb-6 text-gray-700">Hola, {perfil?.nombre || user.email}</p>

            <button 
              onClick={() => router.push("/dashboard")}
              className="block bg-blue-600 hover:bg-blue-700 text-white text-center px-6 py-3 rounded-lg w-full mb-4 transition"
            >
              Ir al Dashboard
            </button>

            {perfil?.rol === "admin" && (
              <button 
                onClick={() => router.push("/admin")}
                className="block bg-purple-600 hover:bg-purple-700 text-white text-center px-6 py-3 rounded-lg w-full transition"
              >
                Administrar jugadores
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
