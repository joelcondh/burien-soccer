'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/lib/require-auth";

type Equipo = "Rojo" | "Azul" | "Verde" | "Naranja" | "Sin equipo";

async function redistribuirEquipos() {
    // Obtener todas las reservas actuales ordenadas por el momento en que reservaron
    const { data: reservasActuales } = await supabase
        .from("reservas")
        .select("*")
        .order("reservado_en", { ascending: true });

    if (!reservasActuales) return;

    const totalJugadores = reservasActuales.length;

    // Determinar qué equipos están disponibles en este momento
    const equiposDisponibles: Equipo[] = ["Rojo", "Azul"];
    if (totalJugadores >= 12) equiposDisponibles.push("Verde");
    if (totalJugadores >= 24) equiposDisponibles.push("Naranja");

    // Repartir en orden (round robin) a todos los jugadores en los equipos habilitados
    let index = 0;

    for (const r of reservasActuales) {
        const nuevoEquipo = equiposDisponibles[index];

        await supabase
            .from("reservas")
            .update({ equipo: nuevoEquipo })
            .eq("id", r.id);

        index++;
        if (index >= equiposDisponibles.length) index = 0;
    }
}

function asignarEquipo(reservas: any[]): Equipo {
    const equiposDisponibles: Equipo[] = ["Rojo", "Azul"];
    const totalJugadores = reservas.length;

    if (totalJugadores >= 12) {
        equiposDisponibles.push("Verde");
    }

    if (totalJugadores >= 24) {
        equiposDisponibles.push("Naranja");
    }

    const conteo: { [key in Equipo]: number } = {
        Rojo: 0,
        Azul: 0,
        Verde: 0,
        Naranja: 0,
        "Sin equipo": 0
    };

    reservas.forEach(r => {
        conteo[r.equipo as Equipo]++;
    });

    // Buscamos el equipo con MENOS jugadores (para mantener el orden)
    let menorEquipo: Equipo = equiposDisponibles[0];
    let menorCantidad = conteo[menorEquipo];

    equiposDisponibles.forEach(equipo => {
        if (conteo[equipo] < menorCantidad) {
            menorEquipo = equipo;
            menorCantidad = conteo[equipo];
        }
    });

    return menorEquipo;
}

export default function DashboardPage() {
    return (
        <RequireAuth>
            <DashboardContent />
        </RequireAuth>
    );
}

function DashboardContent() {
    const [user, setUser] = useState<any>(null);
    const [perfil, setPerfil] = useState<any>(null);
    const [reservas, setReservas] = useState<any[]>([]);
    const [miEquipo, setMiEquipo] = useState<Equipo>("Sin equipo");
    const [showInactivoModal, setShowInactivoModal] = useState(false);
    const [ultimoJugador, setUltimoJugador] = useState<string | null>(null);
    const router = useRouter();

    const equipos: Equipo[] = ["Rojo", "Azul", "Verde", "Naranja"];

    const getReservas = async () => {
        const { data } = await supabase
            .from("reservas")
            .select("*")
            .order("reservado_en", { ascending: true });

        setReservas(data || []);
    };

    const verificarMiReserva = async (userId: string) => {
        const { data } = await supabase
            .from("reservas")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

        if (data) {
            setMiEquipo(data.equipo);
        } else {
            setMiEquipo("Sin equipo");
        }
    };

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);

                const { data: perfilData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", data.user.id)
                    .single();

                setPerfil(perfilData);

                if (perfilData?.estado === "activo" || perfilData?.rol === "admin") {
                    router.push("/dashboard");
                }

                await getReservas();
                await verificarMiReserva(data.user.id);
            }
        };

        getUser();

        const channel = supabase
            .channel('reservas_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, (payload) => {
                getReservas();
                if (user?.id) verificarMiReserva(user.id);

                if (payload.eventType === 'INSERT') {
                    const nuevoJugador = payload.new?.nombre_jugador ?? "Un nuevo jugador";
                    setUltimoJugador(nuevoJugador);
                    setTimeout(() => setUltimoJugador(null), 5000);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router, user?.id]);


    // 👇 AQUI ABAJO AGREGA EL NUEVO TIMER
    useEffect(() => {
        const intervalo = setInterval(() => {
            if (document.visibilityState === "visible") {
                getReservas();
            }
        }, 10000);

        return () => clearInterval(intervalo);
    }, []);

    const handleReservar = async () => {
        if (!user || !perfil) return;
    
        if (perfil.estado !== "activo") {
            setShowInactivoModal(true);
            return;
        }
    
        const { data: reservaExistente } = await supabase
            .from("reservas")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
    
        if (reservaExistente) return;
    
        // 🚨 NUEVO -> Revisar cantidad total actual de reservas
        const totalReservas = reservas.length;
    
        if (totalReservas === 12 || totalReservas === 24) {
            await redistribuirEquipos(); // redistribuye todos los jugadores actuales
            await getReservas(); // vuelve a cargar las reservas redistribuidas
        }
    
        // ✅ Asignar equipo para el NUEVO jugador que está reservando
        const equipoAsignado = asignarEquipo(reservas);
    
        const { error } = await supabase.from("reservas").insert([
            { user_id: user.id, equipo: equipoAsignado }
        ]);
    
        if (!error) {
            await verificarMiReserva(user.id);
            await getReservas(); // ✅ Cargar de BD con nombre_jugador correcto
        }
    };

    const handleCancelarReserva = async () => {
        const { data: reservaExistente } = await supabase
            .from("reservas")
            .select("*")
            .eq("user_id", user?.id)
            .maybeSingle();

        if (!reservaExistente) return;

        const { error } = await supabase
            .from("reservas")
            .delete()
            .eq("id", reservaExistente.id);

        if (!error) {
            await verificarMiReserva(user!.id);
            await getReservas();
        }
    };

    const jugadoresPorEquipo = (equipo: Equipo) =>
        reservas.filter(r => r.equipo === equipo);

    if (!user) return <p className="p-8">Cargando...</p>;

    return (
        <div className="p-8">
            <h1 className="text-3xl mb-6">Bienvenido, {perfil?.nombre}</h1>

            {ultimoJugador && (
                <div className="mb-6 p-4 bg-yellow-200 text-yellow-800 rounded shadow transition-opacity duration-500 animate-fade">
                    🎉 <b>{ultimoJugador}</b> acaba de reservar su lugar!
                </div>
            )}

            <h2 className="text-xl mb-4">Equipos para este domingo:</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {equipos.map(equipo => (
                    <div key={equipo} className="p-4 bg-gray-100 rounded shadow">
                        <h3 className={
                            equipo === "Rojo" ? "text-red-600 font-bold text-lg mb-2" :
                                equipo === "Azul" ? "text-blue-600 font-bold text-lg mb-2" :
                                    equipo === "Verde" ? "text-green-600 font-bold text-lg mb-2" :
                                        equipo === "Naranja" ? "text-orange-500 font-bold text-lg mb-2" :
                                            "text-gray-700 text-lg mb-2"
                        }>
                            {equipo}
                        </h3>

                        {jugadoresPorEquipo(equipo).length === 0 && <p className="text-gray-900">No hay jugadores aún</p>}

                        {jugadoresPorEquipo(equipo).map((r, index) => (
                            <p key={r.id} className="text-gray-900">
                                <span className="font-semibold">{index + 1}.</span>{" "}
                                {r.user_id === user?.id ? "(Yo)" : r.nombre_jugador ?? "Jugador desconocido"}
                            </p>
                        ))}
                    </div>
                ))}
            </div>

            {miEquipo !== "Sin equipo" ? (
                <button
                    onClick={handleCancelarReserva}
                    className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600"
                >
                    Cancelar reserva para este domingo
                </button>
            ) : (
                <button
                    onClick={handleReservar}
                    className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600"
                >
                    Reservar mi lugar para este domingo
                </button>
            )}

            <p className="mt-4">
                Tu equipo actual: <b className={
                    miEquipo === "Rojo" ? "text-red-600" :
                        miEquipo === "Azul" ? "text-blue-600" :
                            miEquipo === "Verde" ? "text-green-600" :
                                miEquipo === "Naranja" ? "text-orange-500" :
                                    "text-gray-500"
                }>
                    {miEquipo}
                </b>
            </p>
        </div>
    );
}
