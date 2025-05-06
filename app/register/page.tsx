'use client';

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function RegisterPage() {
  const router = useRouter();
  
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [telefono, setTelefono] = useState<string | undefined>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!nombre || !ciudad || !telefono || !email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    setError(null);

    // Crear usuario en Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Insertar en profiles
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        user_id: data.user?.id,
        nombre,
        ciudad,
        telefono,
        email,
        rol: 'jugador',
        estado: 'activo'
      }
    ]);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    // Redirigir al login
    router.push('/login');
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl mb-6">Registro de Jugador</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

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

      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-3 rounded mb-4 w-full"
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-3 rounded mb-6 w-full"
      />

      <button
        onClick={handleRegister}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 w-full"
      >
        {loading ? "Registrando..." : "Registrarse"}
      </button>
    </div>
  );
}
