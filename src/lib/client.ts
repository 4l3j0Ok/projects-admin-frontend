import type { ApiError, Project } from "../types/project";
import { CSRF_HEADER } from "./constants";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set(CSRF_HEADER, "1");

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (data as ApiError | null)?.message;
    throw new Error(message || `Error ${response.status}`);
  }
  return data as T;
}

export function listProjects(): Promise<Project[]> {
  return request<Project[]>("/api/projects");
}

export function createProject(formData: FormData): Promise<Project> {
  return request<Project>("/api/projects", { method: "POST", body: formData });
}

export function updateProject(id: number, formData: FormData): Promise<Project> {
  return request<Project>(`/api/projects/${id}`, { method: "PUT", body: formData });
}

export function setProjectActive(id: number, active: boolean): Promise<Project | undefined> {
  if (!active) {
    return request<undefined>(`/api/projects/${id}`, { method: "DELETE" });
  }
  const formData = new FormData();
  formData.set("active", "true");
  return updateProject(id, formData);
}
