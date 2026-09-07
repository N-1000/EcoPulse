/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Verde bosque oscuro — color de identidad EcoPulse
        bosque: {
          DEFAULT: '#2D6A4F',
          light:   '#3D8B68',
          dark:    '#1A3A2A',
          night:   '#0F1F17',
        },
        // Terracota cálida — acento secundario
        terra: {
          DEFAULT: '#D05A3F',
          light:   '#E07055',
          dark:    '#B84D34',
        },
        // Hueso / fondo cálido
        hueso: {
          DEFAULT: '#FAFAF7',
          mid:     '#F5F5F2',
          dark:    '#EBEBEA',
        },
        // Verde menta para texto sobre fondo oscuro
        menta: {
          DEFAULT: '#A8C5B0',
          dark:    '#6B9E7A',
        },
        // Compatibilidad con nombres anteriores (no romper código existente)
        palma: {
          DEFAULT: '#2D6A4F',
          light:   '#3D8B68',
          dark:    '#1A3A2A',
        },
        tangara: {
          DEFAULT: '#2D6A4F',
          light:   '#3D8B68',
          dark:    '#1A3A2A',
        },
        citrico: {
          DEFAULT: '#D05A3F',
          light:   '#E07055',
          dark:    '#B84D34',
        },
        pastel: {
          DEFAULT: '#E8F0E9',
          dark:    '#C5D9C9',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 3px 8px rgba(0,0,0,0.07)',
      },
      animation: {
        'fade-in':   'fadeIn 0.25s ease-out',
        'slide-up':  'slideUp 0.25s ease-out',
        'pulse-dot': 'pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'river-flow': 'dashFlow 30s linear infinite',
        'wind-flow':  'dashFlow 15s linear infinite',
        'halo-pulse': 'haloPulse 3s ease-in-out infinite',
        'bounce-in':  'bounceIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ring-pulse': 'ringPulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        dashFlow: {
          'to': { strokeDashoffset: '-1000' },
        },
        haloPulse: {
          '0%':   { transform: 'scale(0.85)', opacity: '0.5' },
          '50%':  { transform: 'scale(1.2)',  opacity: '0.1' },
          '100%': { transform: 'scale(0.85)', opacity: '0.5' },
        },
        bounceIn: {
          '0%':   { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        ringPulse: {
          '0%':   { boxShadow: '0 0 0 0 rgba(45, 106, 79, 0.4)' },
          '70%':  { boxShadow: '0 0 0 12px rgba(45, 106, 79, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(45, 106, 79, 0)' },
        },
      },
    },
  },
  plugins: [],
}
