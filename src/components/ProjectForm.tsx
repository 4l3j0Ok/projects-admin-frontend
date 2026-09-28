import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";

import {
  DESCRIPTION_MAX_LENGTH,
  IMAGE_MAX_SIZE_MB,
  TITLE_MAX_LENGTH,
} from "../types/project";
import type { Project } from "../types/project";

interface ProjectFormProps {
  project: Project | null;
  onCancel: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

interface FormErrors {
  title?: string;
  description?: string;
  url?: string;
  repo_url?: string;
  image?: string;
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ProjectForm({ project, onCancel, onSubmit }: ProjectFormProps) {
  const formId = useId();
  const isEditing = project !== null;

  const [title, setTitle] = useState<string>(project?.title ?? "");
  const [description, setDescription] = useState<string>(project?.description ?? "");
  const [url, setUrl] = useState<string>(project?.url ?? "");
  const [repoUrl, setRepoUrl] = useState<string>(project?.repo_url ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, submitting]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const currentImage = removeImage ? null : (previewUrl ?? project?.image ?? null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setErrors((prev) => ({ ...prev, image: undefined }));
    if (file && !file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "El archivo debe ser una imagen." }));
      event.target.value = "";
      return;
    }
    if (file && file.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: `La imagen supera el máximo de ${IMAGE_MAX_SIZE_MB} MB.`,
      }));
      event.target.value = "";
      return;
    }
    setImageFile(file);
    if (file) setRemoveImage(false);
  };

  const clearSelectedImage = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): FormErrors => {
    const result: FormErrors = {};
    if (!title.trim()) result.title = "El título es obligatorio.";
    else if (title.trim().length > TITLE_MAX_LENGTH)
      result.title = `Máximo ${TITLE_MAX_LENGTH} caracteres.`;

    if (!description.trim()) result.description = "La descripción es obligatoria.";
    else if (description.trim().length > DESCRIPTION_MAX_LENGTH)
      result.description = `Máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`;

    if (!url.trim()) result.url = "La URL es obligatoria.";
    else if (!isValidUrl(url.trim())) result.url = "Ingresá una URL válida (http o https).";

    if (repoUrl.trim() && !isValidUrl(repoUrl.trim()))
      result.repo_url = "Ingresá una URL válida (http o https).";

    return result;
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("description", description.trim());
    formData.set("url", url.trim());
    // En edición, un repo vacío le indica a la API que lo quite
    if (repoUrl.trim() || isEditing) formData.set("repo_url", repoUrl.trim());
    if (imageFile) formData.set("image", imageFile);
    if (isEditing && removeImage && !imageFile) formData.set("remove_image", "true");

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error inesperado.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onCancel();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
      >
        <header className="modal-header">
          <h2 id={`${formId}-title`}>
            {isEditing ? "Editar proyecto" : "Nuevo proyecto"}
          </h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Cerrar"
            onClick={onCancel}
            disabled={submitting}
          >
            ×
          </button>
        </header>

        <form className="project-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor={`${formId}-name`}>Título</label>
            <input
              ref={titleInputRef}
              id={`${formId}-name`}
              name="title"
              type="text"
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={Boolean(errors.title)}
              required
            />
            <div className="field-meta">
              <span className="field-error">{errors.title}</span>
              <span className="counter">
                {title.length}/{TITLE_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div className="field">
            <label htmlFor={`${formId}-description`}>Descripción</label>
            <textarea
              id={`${formId}-description`}
              name="description"
              rows={4}
              value={description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={Boolean(errors.description)}
              required
            />
            <div className="field-meta">
              <span className="field-error">{errors.description}</span>
              <span className="counter">
                {description.length}/{DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor={`${formId}-url`}>URL del sitio</label>
              <input
                id={`${formId}-url`}
                name="url"
                type="url"
                placeholder="https://"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-invalid={Boolean(errors.url)}
                required
              />
              <span className="field-error">{errors.url}</span>
            </div>

            <div className="field">
              <label htmlFor={`${formId}-repo`}>
                URL del repositorio <span className="optional">(opcional)</span>
              </label>
              <input
                id={`${formId}-repo`}
                name="repo_url"
                type="url"
                placeholder="https://github.com/..."
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                aria-invalid={Boolean(errors.repo_url)}
              />
              <span className="field-error">{errors.repo_url}</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor={`${formId}-image`}>
              Imagen <span className="optional">(opcional, máx. {IMAGE_MAX_SIZE_MB} MB)</span>
            </label>
            <div className="image-field">
              <div className="image-preview">
                {currentImage ? (
                  <img src={currentImage} alt="Vista previa de la imagen" />
                ) : (
                  <span>Sin imagen</span>
                )}
              </div>
              <div className="image-actions">
                <input
                  ref={fileInputRef}
                  id={`${formId}-image`}
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imageFile && (
                  <button type="button" className="button button-ghost" onClick={clearSelectedImage}>
                    Descartar imagen nueva
                  </button>
                )}
                {isEditing && project?.image && !imageFile && (
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={removeImage}
                      onChange={(e) => setRemoveImage(e.target.checked)}
                    />
                    Quitar imagen actual
                  </label>
                )}
              </div>
            </div>
            <span className="field-error">{errors.image}</span>
          </div>

          {submitError && (
            <p className="alert alert-error" role="alert">
              {submitError}
            </p>
          )}

          <footer className="modal-footer">
            <button
              type="button"
              className="button button-ghost"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button type="submit" className="button button-primary" disabled={submitting}>
              {submitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear proyecto"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
