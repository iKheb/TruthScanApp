/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6C5CE7",
        accent: "#00D1FF",
        danger: "#FF4D6D",
      },
      backgroundImage: {
        "app-gradient": "radial-gradient(circle at 20% 20%, rgba(108, 92, 231, 0.22), transparent 45%), radial-gradient(circle at 80% 0%, rgba(0, 209, 255, 0.2), transparent 40%), linear-gradient(180deg, #06060a 0%, #0f1020 60%, #050509 100%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(108, 92, 231, 0.45)",
        neon: "0 0 22px rgba(0, 209, 255, 0.38)",
      },
      keyframes: {
        pulseGradient: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
      },
      animation: {
        "pulse-gradient": "pulseGradient 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};