/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primaryGold: '#D4AF37',
        goldLight: '#F1E5AC',
        goldGlow: 'rgba(212, 175, 55, 0.15)',
        matteBlack: '#0A0A0A',
        surfaceBlack: '#121212',
        borderDark: '#1F1F1F',
        mutedWhite: 'rgba(255, 255, 255, 0.3)',
        successGreen: '#10B981',
        light: {
          100: '#D6C6FF',
          200: '#A8B5DB',
          300: '#9CA4AB'
        },
        dark: {
          100: '#221f3d',
          200: '#0f0d23',
        }
      }
    },
  },
  plugins: [],
}