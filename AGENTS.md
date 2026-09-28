# AGENTS.md

Guía para agentes que trabajan en **projects-admin-frontend**, el panel interno para administrar los proyectos de alejoide.com a través de projects-api.

## Comandos

- Gestor de paquetes: **pnpm** (10.11.0). No usar npm ni yarn.
- `pnpm install`: instala las dependencias.
- `pnpm dev`: servidor de desarrollo (necesita `.env` con `PROJECTS_API_URL` y `PROJECTS_API_KEY`).
- `pnpm build`: `astro check` + `astro build`. Es la verificación principal, porque no hay tests unitarios.
- TypeScript se mantiene en 6.x porque `astro check` todavía no soporta TypeScript 7.

## Arquitectura y reglas

- Astro SSR (`@astrojs/node` standalone) con islas de React 19 (`client:load`).
- **La API key nunca debe llegar al cliente**: se importa solo en `src/lib/projectsApi.ts` desde `astro:env/server`. No agregar variables `context: "client"` con secretos.
- Toda llamada del navegador pasa por `src/lib/client.ts`, que agrega el header CSRF (`X-Admin-Request`). Las rutas nuevas de escritura en `/api/` quedan protegidas automáticamente por `src/middleware.ts`.
- Los errores de las rutas `/api/` responden `{ message }` con el status original de projects-api (`forwardToApi` normaliza el `detail` de FastAPI).
- Baja lógica: "Ocultar" = `DELETE`, "Restaurar" = `PUT active=true`. Nunca se borra físicamente.

## Estilo

- TypeScript strict, `import type` para imports de solo tipos, 2 espacios, comillas dobles y punto y coma.
- CSS plano (sin Tailwind). Los colores se toman de las variables de `src/styles/globals.css` (paleta de alejoide.com); no hardcodear colores en los componentes.
- Componentes en PascalCase y archivos de estilos en minúsculas.
- Textos de la interfaz en español (es-AR).

## Commits

Conventional Commits (`feat:`, `fix:`, `chore:`...). semantic-release genera versión, tag y CHANGELOG en `main`.
