'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Perfil = {
  id: string;
  user_id: string;
  nombre: string;
  email?: string | null;
  ciudad?: string | null;
  estado: "activo" | "inactivo";
  rol?: string | null;
};

export default function AdminPage() {
  const [jugadores, setJugadores] = useState<Perfil[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verificarAdmin = async () => {
      const { data: userData, error } = await supabase.auth.getUser();

      if (error || !userData.user) {
        router.push("/login");
        return;
      }

      const { data: perfilData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userData.user.id)
        .single();

      if (!perfilData || perfilData.rol !== "admin") {
        router.push("/");
        return;
      }

      const { data } = await supabase.from("profiles").select("*").order("nombre");
      setJugadores((data ?? []) as Perfil[]);
      setLoading(false);
    };

    verificarAdmin();
  }, [router]);

  const cambiarEstado = async (jugador: Perfil) => {
    const nuevoEstado = jugador.estado === "activo" ? "inactivo" : "activo";

    await supabase.from("profiles").update({ estado: nuevoEstado }).eq("id", jugador.id);

    const { data } = await supabase.from("profiles").select("*").order("nombre");
    setJugadores((data ?? []) as Perfil[]);
    setJugadorSeleccionado(null);
  };

  const filtrados = jugadores.filter(j =>
    j.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const activos = filtrados.filter(j => j.estado === "activo");
  const inactivos = filtrados.filter(j => j.estado === "inactivo");

  if (loading) return <p className="p-8">Cargando...</p>;

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-6">Panel de Administración</h1>

      <input
        type="text"
        placeholder="Buscar jugador por nombre"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="border p-3 rounded mb-8 w-full max-w-md"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl mb-4">Jugadores Activos</h2>
          {activos.map(j => (
            <p key={j.id} className="mb-2">
              {j.nombre} 
              <button 
                className="ml-4 text-blue-500 underline" 
                onClick={() => setJugadorSeleccionado(j)}
              >
                Ver
              </button>
            </p>
          ))}
        </div>

        <div>
          <h2 className="text-2xl mb-4">Jugadores Inactivos</h2>
          {inactivos.map(j => (
            <p key={j.id} className="mb-2">
              {j.nombre} 
              <button 
                className="ml-4 text-blue-500 underline" 
                onClick={() => setJugadorSeleccionado(j)}
              >
                Ver
              </button>
            </p>
          ))}
        </div>
      </div>

      {jugadorSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
            <h3 className="text-xl mb-4">Detalles del jugador</h3>
            <p><b>Nombre:</b> {jugadorSeleccionado.nombre}</p>
            <p><b>Email:</b> {jugadorSeleccionado.email}</p>
            <p><b>Ciudad:</b> {jugadorSeleccionado.ciudad}</p>
            <p><b>Estado:</b> {jugadorSeleccionado.estado}</p>

            <button
              onClick={() => cambiarEstado(jugadorSeleccionado)}
              className="bg-green-500 text-white px-4 py-2 mt-4 rounded"
            >
              Cambiar a {jugadorSeleccionado.estado === "activo" ? "INACTIVO" : "ACTIVO"}
            </button>

            <button
              onClick={() => setJugadorSeleccionado(null)}
              className="ml-4 text-gray-500 underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
