import type { APIRoute } from "astro";

import { forwardToApi, readFormData } from "../../../lib/projectsApi";

export const GET: APIRoute = async () => {
  return forwardToApi("/projects/?include_inactive=true");
};

export const POST: APIRoute = async ({ request }) => {
  const formData = await readFormData(request);
  if (!formData) {
    return Response.json(
      { message: "Se esperaba un formulario multipart/form-data." },
      { status: 400 },
    );
  }
  return forwardToApi("/projects/", { method: "POST", body: formData });
};
