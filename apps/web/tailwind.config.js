/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Sistema de colores original (shadcn/ui)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // 🎨 PALETA INSTITUCIONAL NUNA CURATE - MUSEO DIGITAL
        // Basado en investigación de psicología del color y diseño de museos NFT

        // Purple Royal (#9a7ad7) - COLOR PRINCIPAL (40-45% uso)
        // Realeza, sofisticación, creatividad, espiritualidad
        museum: {
          purple: {
            50: '#f7f4fc',
            100: '#e9dff5',
            200: '#d3bfeb',
            300: '#bd9fe1',
            400: '#a78cd7',
            500: '#9a7ad7',  // PRINCIPAL - Purple Royal
            600: '#7a5ab7',
            700: '#6a4aa7',
            800: '#5a3a97',
            900: '#4a2a87',
            950: '#2a1a57',
          },
          // Golden Amber (#e4af25) - SECUNDARIO PRINCIPAL (20-25% uso)
          // Riqueza, valor, optimismo, logro
          gold: {
            50: '#fef9ec',
            100: '#fcefc2',
            200: '#f9df81',
            300: '#f3cf4f',
            400: '#ecbf37',
            500: '#e4af25',  // PRINCIPAL - Golden Amber
            600: '#b88a1e',
            700: '#8c6916',
            800: '#60470f',
            900: '#342608',
          },
          // Crimson Red (#da3617) - ACENTO EMOCIONAL (10-15% uso)
          // Pasión, energía, drama, urgencia
          red: {
            50: '#fef2f0',
            100: '#fcd8d1',
            200: '#f9a89a',
            300: '#f57762',
            400: '#f1512a',
            500: '#da3617',  // PRINCIPAL - Crimson Red
            600: '#ae2b13',
            700: '#82200e',
            800: '#56150a',
            900: '#2a0b05',
          },
          // Coral Orange (#ec5a31) - ACENTO CÁLIDO (15-20% uso)
          // Creatividad, amigabilidad, entusiasmo, innovación
          orange: {
            50: '#fef5f1',
            100: '#fce0d4',
            200: '#f9b399',
            300: '#f6865e',
            400: '#f36d47',
            500: '#ec5a31',  // PRINCIPAL - Coral Orange
            600: '#bd4827',
            700: '#8e361d',
            800: '#5e2413',
            900: '#2f120a',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // 🎭 TIPOGRAFÍA MUSEO
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        mono: ['var(--font-mono)', 'Monaco', 'monospace'],
      },

      // ✨ ESPACIADO GENEROSO (Museo)
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // 🎨 GRADIENTES MUSEO
      backgroundImage: {
        'museum-gradient': 'linear-gradient(135deg, #9a7ad7 0%, #7a5ab7 50%, #5a3a97 100%)',
        'golden-hour': 'linear-gradient(135deg, #e4af25 0%, #ec5a31 100%)',
        'passionate': 'linear-gradient(135deg, #da3617 0%, #ec5a31 100%)',
        'majestic': 'linear-gradient(135deg, #9a7ad7 0%, #e4af25 50%, #ec5a31 100%)',
        'museum-dark': 'linear-gradient(180deg, #1a1625 0%, #2a2035 100%)',
      },

      // 🎭 ANIMACIONES MUSEO
      keyframes: {
        // Animaciones originales
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },

        // 🏛️ Animaciones Museo
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'zoom-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
        'glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(154, 122, 215, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(154, 122, 215, 0.6)',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'fade-in-down': 'fade-in-down 0.6s ease-out',
        'zoom-in': 'zoom-in 0.5s ease-out',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },

      // 🖼️ SOMBRAS MUSEO
      boxShadow: {
        'museum': '0 10px 40px -10px rgba(154, 122, 215, 0.3)',
        'museum-lg': '0 20px 60px -15px rgba(154, 122, 215, 0.4)',
        'gold': '0 10px 40px -10px rgba(228, 175, 37, 0.3)',
        'gold-lg': '0 20px 60px -15px rgba(228, 175, 37, 0.4)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
