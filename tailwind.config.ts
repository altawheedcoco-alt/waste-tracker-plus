import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			cairo: [
  				'Cairo',
  				'sans-serif'
  			],
  			sans: [
  				'Work Sans',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			serif: [
  				'Lora',
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'Inconsolata',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			eco: {
  				green: 'hsl(var(--eco-green))',
  				'green-dark': 'hsl(var(--eco-green-dark))',
  				'green-light': 'hsl(var(--eco-green-light))',
  				emerald: 'hsl(var(--eco-emerald))',
  				teal: 'hsl(var(--eco-teal))',
  				cream: 'hsl(var(--eco-cream))',
  				sand: 'hsl(var(--eco-sand))',
  				ocean: 'hsl(var(--eco-ocean))',
  				gold: 'hsl(var(--eco-gold))',
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'fade-in': {
  				from: { opacity: '0', transform: 'translateY(20px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'fade-in-up': {
  				from: { opacity: '0', transform: 'translateY(40px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'fade-up': {
  				from: { opacity: '0', transform: 'translateY(24px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'scale-in': {
  				from: { opacity: '0', transform: 'scale(0.9)' },
  				to: { opacity: '1', transform: 'scale(1)' }
  			},
  			float: {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-10px)' }
  			},
  			'float-slow': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-12px)' }
  			},
  			'float-delayed': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-10px)' }
  			},
  			'hero-zoom': {
  				from: { transform: 'scale(1.1)' },
  				to: { transform: 'scale(1)' }
  			},
  			ticker: {
  				from: { transform: 'translateX(0%)' },
  				to: { transform: 'translateX(50%)' }
  			},
			'pulse-glow': {
				'0%, 100%': { boxShadow: '0 0 20px hsl(142, 71%, 45%, 0.3)' },
				'50%': { boxShadow: '0 0 40px hsl(142, 71%, 45%, 0.5)' }
			},
			'bell-shake': {
				'0%': { transform: 'rotate(0deg)' },
				'15%': { transform: 'rotate(14deg)' },
				'30%': { transform: 'rotate(-12deg)' },
				'45%': { transform: 'rotate(10deg)' },
				'60%': { transform: 'rotate(-8deg)' },
				'75%': { transform: 'rotate(4deg)' },
				'90%': { transform: 'rotate(-2deg)' },
				'100%': { transform: 'rotate(0deg)' }
			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.6s ease-out forwards',
  			'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
  			'fade-up': 'fade-up 0.6s ease-out both',
  			'scale-in': 'scale-in 0.5s ease-out forwards',
  			float: 'float 3s ease-in-out infinite',
  			'float-slow': 'float-slow 4s ease-in-out infinite',
  			'float-delayed': 'float-delayed 5s ease-in-out 1s infinite',
  			'hero-zoom': 'hero-zoom 8s ease-out forwards',
  			ticker: 'ticker 120s linear infinite',
			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
			'bell-shake': 'bell-shake 0.5s ease-in-out'
  		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
