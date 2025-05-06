'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verificar = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        router.replace("/login");
      } else {
        setChecking(false);
      }
    };

    verificar();
  }, [router]);

  if (checking) return <p className="p-8">Verificando sesión...</p>;

  return <>{children}</>;
}
