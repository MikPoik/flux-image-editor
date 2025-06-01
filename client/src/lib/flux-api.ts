import { apiRequest } from "./queryClient";

export interface FluxUploadResponse {
  id: number;
  originalUrl: string;
  currentUrl: string;
  editHistory: Array<{
    prompt: string;
    imageUrl: string;
    timestamp: string;
  }>;
}

export interface FluxEditResponse {
  id: number;
  originalUrl: string;
  currentUrl: string;
  editHistory: Array<{
    prompt: string;
    imageUrl: string;
    timestamp: string;
  }>;
}

export async function uploadImage(file: File): Promise<FluxUploadResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/images/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to upload image');
  }

  return response.json();
}

export async function editImage(imageId: number, prompt: string): Promise<FluxEditResponse> {
  const response = await apiRequest('POST', `/api/images/${imageId}/edit`, { prompt });
  return response.json();
}

export async function resetImage(imageId: number): Promise<FluxEditResponse> {
  const response = await apiRequest('POST', `/api/images/${imageId}/reset`);
  return response.json();
}

export async function revertImage(imageId: number, historyIndex: number): Promise<FluxEditResponse> {
  const response = await apiRequest('POST', `/api/images/${imageId}/revert`, { historyIndex });
  return response.json();
}

export async function getImage(imageId: number): Promise<FluxEditResponse> {
  const response = await apiRequest('GET', `/api/images/${imageId}`);
  return response.json();
}

export interface UpscaleResponse {
  upscaledImageUrl: string;
}

export async function upscaleImage(imageId: number, scale: number = 2): Promise<UpscaleResponse> {
  const response = await apiRequest('POST', `/api/images/${imageId}/upscale`, { scale });
  return response.json();
}
