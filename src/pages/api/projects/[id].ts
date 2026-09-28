import type { APIRoute } from "astro";

import { forwardToApi, parseProjectId, readFormData } from "../../../lib/projectsApi";

function invalidId(): Response {
  return Response.json({ message: "Id de proyecto inválido." }, { status: 400 });
}

export const GET: APIRoute = async ({ params }) => {
  const id = parseProjectId(params.id);
  if (!id) return invalidId();
  return forwardToApi(`/projects/${id}`);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = parseProjectId(params.id);
  if (!id) return invalidId();

  const formData = await readFormData(request);
  if (!formData) {
    return Response.json(
      { message: "Se esperaba un formulario multipart/form-data." },
      { status: 400 },
    );
  }
  return forwardToApi(`/projects/${id}`, { method: "PUT", body: formData });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = parseProjectId(params.id);
  if (!id) return invalidId();
  return forwardToApi(`/projects/${id}`, { method: "DELETE" });
};
