import { PROJECTS_API_KEY, PROJECTS_API_URL } from "astro:env/server";

interface ValidationIssue {
  loc?: (string | number)[];
  msg?: string;
}

/** Convierte el `detail` de FastAPI (string o lista de errores de validación) en un mensaje legible. */
function detailToMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((issue: ValidationIssue) => {
        const field = issue.loc?.[issue.loc.length - 1];
        return field ? `${field}: ${issue.msg}` : (issue.msg ?? "");
      })
      .filter(Boolean)
      .join(" · ");
  }
  return fallback;
}

/**
 * Reenvía una request a projects-api agregando la API key del lado del servidor
 * y normaliza la respuesta al formato `{ message }` en caso de error.
 */
export async function forwardToApi(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("X-API-Key", PROJECTS_API_KEY);
  headers.set("Accept", "application/json");

  const baseUrl = PROJECTS_API_URL.replace(/\/+$/, "");
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  } catch (error) {
    console.error(`Error conectando con projects-api (${init.method ?? "GET"} ${path}):`, error);
    return Response.json(
      { message: "No se pudo conectar con projects-api." },
      { status: 502 },
    );
  }

  if (response.status === 204) {
    return new Response(null, { status: 204 });
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = (data as { detail?: unknown } | null)?.detail;
    const message = detailToMessage(detail, `Error ${response.status} en projects-api.`);
    console.error(`projects-api respondió ${response.status} (${init.method ?? "GET"} ${path}):`, message);
    return Response.json({ message }, { status: response.status });
  }

  return Response.json(data, { status: response.status });
}

/** Valida que el id de la ruta sea un entero positivo. */
export function parseProjectId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

export async function readFormData(request: Request): Promise<FormData | null> {
  try {
    return await request.formData();
  } catch {
    return null;
  }
}
