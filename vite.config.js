import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Remplace "kanji-note" par le nom exact de ton dépôt GitHub
// si tu déploies sur GitHub Pages (https://<user>.github.io/<repo>/).
// Si tu déploies ailleurs (Vercel, Netlify...), remets base: "/".
export default defineConfig({
  plugins: [react()],
  base: "/kanji-note/",
});
