import { AiExtractionResponse } from '../types/ai';

import { API_BASE_URL } from './apiConfig';

export async function extractFromTextApi(token: string, text: string): Promise<AiExtractionResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/extract-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    let errMessage = `Erro na extração de texto: ${res.status}`;
    try {
      const body = await res.json();
      if (body.message) errMessage = body.message;
    } catch {
      // Ignora erro de JSON
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<AiExtractionResponse>;
}

export async function extractFromAudioApi(
  token: string,
  audioBlob: Blob,
  filename = 'audio.webm'
): Promise<AiExtractionResponse> {
  const formData = new FormData();
  formData.append('file', audioBlob, filename);

  const res = await fetch(`${API_BASE_URL}/ai/extract-audio`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // browser define o boundary automaticamente para multipart
    },
    body: formData,
  });

  if (!res.ok) {
    let errMessage = `Erro na transcrição e extração de áudio: ${res.status}`;
    try {
      const body = await res.json();
      if (body.message) errMessage = body.message;
    } catch {
      // Ignora erro de JSON
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<AiExtractionResponse>;
}
