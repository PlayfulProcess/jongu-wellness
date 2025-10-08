/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/channels/**/*.{mdx}',
  ],
  safelist: [
    // Gradient classes for channels
    'from-blue-50', 'to-indigo-100',
    'from-purple-50', 'to-pink-100',
    'from-green-50', 'to-teal-100',
    'from-orange-50', 'to-yellow-100',
    'from-rose-50', 'to-red-100',
    'from-cyan-50', 'to-blue-100',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}