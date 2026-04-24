/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4285F4',
        success: '#34A853',
        warning: '#FBBC05',
        danger: '#EA4335',
        'bg-base': '#F8F9FA',
        'text-primary': '#333333',
        'text-secondary': '#666666',
      },
    },
  },
  plugins: [],
}
