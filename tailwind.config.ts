import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "#f5f5f5",        // para cajas en modo claro
        mutedDark: "#1a1a1a",    // para cajas en modo oscuro
        primary: "#2563eb",      // azul bonito para botones
        success: "#22c55e",      // verde para botones de ok
      },
    },
  },
  plugins: [],
}

export default config;
