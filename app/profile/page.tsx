'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { RequireAuth } from "@/lib/require-auth";

type Perfil = {
  id: string;
  user_id: string;
  nombre: string;
  ciudad?: string | null;
  telefono?: string | null;
};

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [telefono, setTelefono] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? { id: data.user.id } : null);

      const { data: perfilData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.user?.id)
        .single();

      if (perfilData) {
        setPerfil(perfilData as Perfil);
        setNombre(perfilData.nombre);
        setCiudad(perfilData.ciudad ?? '');
        setTelefono(perfilData.telefono ?? undefined);
      }
    };

    getUserAndProfile();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nombre,
        ciudad,
        telefono
      })
      .eq("user_id", user.id);

    setLoading(false);

    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (!perfil) return <p className="p-8">Cargando perfil...</p>;

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl mb-6">Editar Perfil</h1>

      <input
        type="text"
        placeholder="Nombre completo"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="border p-3 rounded mb-4 w-full"
      />

      <input
        type="text"
        placeholder="Ciudad"
        value={ciudad}
        onChange={(e) => setCiudad(e.target.value)}
        className="border p-3 rounded mb-4 w-full"
      />

      <PhoneInput
        placeholder="Número de teléfono"
        value={telefono}
        onChange={setTelefono}
        defaultCountry="US"
        className="border p-3 rounded mb-4 w-full"
      />

      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 w-full"
      >
        {loading ? "Guardando..." : "Guardar Cambios"}
      </button>

      {success && (
        <p className="text-green-600 mt-4">✅ Cambios guardados con éxito.</p>
      )}
    </div>
  );
}
