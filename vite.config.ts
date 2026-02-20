import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "favicon.png", "og-image.png"],
      manifest: {
        name: "SpeedWork – Facturation & Devis",
        short_name: "SpeedWork",
        description: "Gérez vos factures et devis professionnels, même hors ligne.",
        theme_color: "#1a56db",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "fr",
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        screenshots: [
          {
            src: "/og-image.png",
            sizes: "1200x630",
            type: "image/png",
            form_factor: "wide",
          },
        ],
        categories: ["business", "finance", "productivity"],
        shortcuts: [
          {
            name: "Nouvelle Facture",
            short_name: "Facture",
            description: "Créer une nouvelle facture",
            url: "/create/invoice",
            icons: [{ src: "/favicon.png", sizes: "96x96" }],
          },
          {
            name: "Nouveau Devis",
            short_name: "Devis",
            description: "Créer un nouveau devis",
            url: "/create/quote",
            icons: [{ src: "/favicon.png", sizes: "96x96" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/share\//],
        runtimeCaching: [
          {
            // Cache Supabase API calls for offline reading
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 24h
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache static assets aggressively
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
          ],
          "vendor-charts": ["recharts"],
          "vendor-query": ["@tanstack/react-query"],
        },
      },
    },
  },
}));
