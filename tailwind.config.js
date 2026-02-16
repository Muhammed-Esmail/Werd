/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
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
        circleIndicator : '#FFD700',
        surahMarker: '#C5A059',
        settingsGold: '#C5A059',
        juzStar: '#F3E5AB',
        matteBlack: '#0A0A0A',
        surfaceBlack: '#121212',
        bgBlack: '#0c0c0c',
        borderDark: '#1F1F1F',
        mutedWhite: 'rgba(255, 255, 255, 0.42)',
        successGreen: '#10B981',

        // --- NEW LIGHT THEME COLORS ---
        bgWhite: '#FDFBF7',      // Warm Ivory background
        surfaceWhite: '#FFFFFF', // Pure white for cards/inputs
        textDeep: '#1A1A1A',     // Near-black for readability
        textSoft: '#666666',     // Muted text for sub-labels
        borderGold: '#E5D1B0',   // Champagne/Soft gold for borders
        goldMuted: '#FAF3E0',
      },
      fontFamily: {
        'Amiri-Bold': ['Amiri-Bold'],
        'Amiri-BoldItalic': ['Amiri-BoldItalic'],
        'Amiri-Italic': ['Amiri-Italic'],
        'Amiri-Regular': ['Amiri-Regular'],
        'D1': ['D1'],
        'D2': ['D2'],
        'HAFS': ['HAFS'],
        'J1': ['J1'],
        'J2': ['J2'],
        'Q1': ['Q1'],
        'U3': ['U3'],
        'UthmanTN1-Ver10': ['UthmanTN1-Ver10'],
        'UthmanTN_v2-0': ['UthmanTN_v2-0'],
        // Keeping your custom aliases below
        'amiri': ['Amiri-Regular'],
        'amiri-bold': ['Amiri-Bold'],
        'quran': ['HAFS']
      },
    },
  },
  plugins: [],
}