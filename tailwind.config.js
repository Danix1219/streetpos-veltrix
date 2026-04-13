/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
theme: {
  extend: {
    animation: {
      'toast-in': 'toastIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards',
      'modal-in': 'modalIn 0.3s ease-out forwards',
      'icon-pop': 'iconPop 0.4s ease-out 0.2s both',
      'shimmer': 'shimmer 2s infinite linear',
    },
    keyframes: {
      toastIn: {
        '0%': { transform: 'translateX(100%) scale(0.9)', opacity: '0' },
        '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
      },
      modalIn: {
        '0%': { transform: 'scale(0.9) translateY(20px)', opacity: '0' },
        '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
      },
      iconPop: {
        '0%': { transform: 'scale(0) rotate(-45deg)', opacity: '0' },
        '70%': { transform: 'scale(1.2) rotate(10deg)' },
        '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
      },
      shimmer: {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      }
    }
  }
},
  plugins: [],
}

