# Projects Admin Frontend

Panel interno para administrar los proyectos que se muestran en [alejoide.com](https://alejoide.com). Consume [projects-api](https://github.com/4l3j0Ok/projects-api) y está pensado para exponerse **solo en la red interna** mediante nginx-proxy-manager.

## Funcionalidades

- Listado de todos los proyectos (publicados y ocultos) con filtro por estado y búsqueda.
- Alta y edición de proyectos: título, descripción, URL, repositorio e imagen (con vista previa y opción para quitarla).
- Ocultar proyectos (baja lógica: `DELETE` en la API marca `active=false`) y restaurarlos.

## Arquitectura

```
Navegador ──► projects-admin-frontend (Astro SSR, :4321) ──► projects-api (:8000)
                  └─ /api/projects[/:id]  agrega X-API-Key del lado del servidor
```

- La API key (`PROJECTS_API_KEY`) **nunca llega al navegador**: las rutas de `src/pages/api/` hacen de proxy hacia projects-api y la agregan en el servidor.
- Las requests de escritura a `/api/*` exigen el header `X-Admin-Request: 1` (protección CSRF, ver `src/middleware.ts`).
- El panel no tiene login propio: el acceso se restringe desde nginx-proxy-manager (access list / red interna).

## Estructura

```sh
src
├── components
│   ├── ConfirmDialog.tsx # Diálogo de confirmación (ocultar proyecto)
│   ├── ProjectForm.tsx # Modal de alta/edición con validación en cliente
│   ├── ProjectsAdmin.tsx # Contenedor: estado, filtros y acciones
│   └── ProjectsTable.tsx # Tabla de proyectos (se ve como tarjetas en mobile)
├── layouts/Layout.astro # Shell HTML (header, fuentes, estilos globales)
├── lib
│   ├── client.ts # Llamadas del navegador a /api/projects
│   ├── constants.ts # Constantes compartidas cliente/servidor
│   └── projectsApi.ts # Proxy del lado del servidor hacia projects-api
├── middleware.ts # Protección CSRF, límite de tamaño y noindex
├── pages
│   ├── api/projects/index.ts # GET (lista con inactivos) / POST
│   ├── api/projects/[id].ts # GET / PUT / DELETE
│   └── index.astro # Página principal del panel
├── styles # globals.css (paleta de alejoide.com) y admin.css
└── types/project.ts # Tipos y límites de validación
```

## Desarrollo

Requiere Node LTS y [pnpm](https://pnpm.io) 10, y una instancia de projects-api con `ADMIN_API_KEY` configurada.

```sh
cp .env.example .env # completar PROJECTS_API_URL y PROJECTS_API_KEY
pnpm install
pnpm dev # http://localhost:4321
pnpm build # astro check + build
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `PROJECTS_API_URL` | URL interna de projects-api (en Docker: `http://projects-api:8000`). |
| `PROJECTS_API_KEY` | Debe coincidir con `ADMIN_API_KEY` de projects-api. |

## Despliegue

Al crear un tag en `main`, Woodpecker construye y publica `alejoide/projects-admin-frontend` y dispara el deploy de [alejoide.com](https://github.com/4l3j0Ok/alejoide.com), cuyo `deploy/compose.yaml` define el servicio. En nginx-proxy-manager se crea un proxy host hacia `projects-admin-frontend:4321` con una access list que limite el acceso a la red interna.

## Licencia

[MIT](LICENSE.md)
