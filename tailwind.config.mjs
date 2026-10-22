/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#008254',
          deep: '#006642',
          forest: '#00482f',
        },
        lime: {
          logo: '#8dc63f',
          hero: '#9ae600',
          panel: '#e8fdac',
          accent: '#ddfa88',
          ribbon: '#a8ea4c',
        },
        canvas: {
          DEFAULT: '#ffffff',
          soft: '#f7f7f7',
        },
        mint: {
          50: '#effcf8',
          100: '#e3faf2',
          200: '#b7ecda',
        },
        hairline: {
          DEFAULT: '#ebebec',
          strong: '#d8d9da',
        },
        ink: '#000000',
        copy: '#3d4045',
        muted: '#4e5156',
        faint: '#9aa0a6',
        link: '#005fb9',
        info: '#4b99e6',
        error: '#de2828',
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        xxl: '12px',
        xxxl: '16px',
      },
      boxShadow: {
        'flat-subtle': 'rgba(100,102,106,0.05) 0 4px 16px, rgba(100,102,104,0.05) 0 16px 40px',
        'flat-overlay': '0 20px 25px -5px rgba(0,0,0,0.04), 0 8px 10px -6px rgba(0,0,0,0.04)',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
