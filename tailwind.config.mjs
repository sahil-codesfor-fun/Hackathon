/** @type {import('tailwindcss').Config} */
const config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'cyber-blue': '#58a6ff',
                'cyber-dark': '#0d1117',
                'cyber-black': '#010409',
                'matrix-green': '#238636',
                'hazard-yellow': '#e3b341',
                'alert-red': '#f85149',
            },
            fontFamily: {
                mono: ["JetBrains Mono", "ui-monospace", "monospace"],
                sans: ["Space Grotesk", "Inter", "sans-serif"],
            },
            animation: {
                'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                'pulse-slow': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                }
            }
        },
    },
    plugins: [],
};

export default config;
