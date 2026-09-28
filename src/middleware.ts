import { defineMiddleware } from "astro:middleware";

import { CSRF_HEADER } from "./lib/constants";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const MAX_BODY_BYTES = 6 * 1024 * 1024; // 6 MB (la API limita las imágenes a 5 MB)

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/") && !SAFE_METHODS.has(request.method)) {
    // Un header propio no puede enviarse desde otro origen sin preflight CORS,
    // que este servidor no habilita: sirve como protección CSRF detrás del proxy.
    if (request.headers.get(CSRF_HEADER) !== "1") {
      return Response.json({ message: "Solicitud no permitida." }, { status: 403 });
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return Response.json({ message: "Solicitud demasiado grande." }, { status: 413 });
    }
  }

  const response = await next();
  try {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  } catch {
    // Algunas respuestas tienen headers inmutables; no es crítico.
  }
  return response;
});
