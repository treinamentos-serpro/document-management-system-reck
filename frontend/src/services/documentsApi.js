async function request(path, { userId, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (userId) headers.set('X-User-Id', userId);

  const response = await fetch(`/api${path}`, { ...options, headers });
  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.';
    try {
      const body = await response.json();
      message = body.error?.message || message;
    } catch {
      // Mantém a mensagem padrão se a resposta não for JSON.
    }
    throw new Error(message);
  }

  return response;
}

export async function listDocuments(userId, { signal } = {}) {
  const response = await request('/documents', { userId, signal });
  const body = await response.json();
  return body.documents;
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    userId,
    body: formData,
  });
  const body = await response.json();
  return body.document;
}

export async function downloadDocument(id, userId) {
  const response = await request(
    `/documents/${encodeURIComponent(id)}/download`,
    { userId },
  );
  return response.blob();
}