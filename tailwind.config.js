/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#4F46E5',
        'brand-alt': '#818CF8',
        sidebar: '#0F172A',
        surface: '#FFFFFF',
        'surface-alt': '#F1F5F9',
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
      },
    },
  },
  plugins: [],
};
