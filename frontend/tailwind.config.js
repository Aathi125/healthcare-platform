/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1e5eff",
        "primary-dark": "#1848c5",
        "primary-soft": "#eaf1ff",
        "health-bg": "#f4f7fc",
        "health-text": "#12304f",
        "health-muted": "#5a718c"
      }
    }
  },
  plugins: []
};
