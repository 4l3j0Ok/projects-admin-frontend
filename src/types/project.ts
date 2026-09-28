export interface Project {
  id: number;
  title: string;
  description: string;
  url: string | null;
  repo_url: string | null;
  image: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  message: string;
}

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
export const IMAGE_MAX_SIZE_MB = 5;
