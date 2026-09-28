// @ts-check
import { defineConfig, envField } from "astro/config";

import node from "@astrojs/node";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  env: {
    schema: {
      // URL interna de projects-api (por ejemplo http://projects-api:8000 dentro de Docker)
      PROJECTS_API_URL: envField.string({
        context: "server",
        access: "secret",
        default: "http://localhost:8000",
      }),
      // Debe coincidir con ADMIN_API_KEY de projects-api. Nunca se envía al navegador.
      PROJECTS_API_KEY: envField.string({ context: "server", access: "secret" }),
    },
  },

  security: {
    // El panel corre detrás de nginx-proxy-manager, que reescribe host/protocolo.
    // La protección CSRF se hace en src/middleware.ts con un header propio.
    checkOrigin: false,
  },

  output: "server",

  adapter: node({
    mode: "standalone",
  }),
});
