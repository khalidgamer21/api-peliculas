export async function request(module, { id, method = 'GET', body, signal } = {}) {
  const path = id === undefined ? module : module + '/' + id;
  let response;
  try {
    response = await fetch('/api/' + path, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con la API. Revisa que el servidor de Node.js este iniciado.');
  }

  if (response.status === 204) return null;

  const json = await response.json().catch(() => null);
  if (!json) {
    throw new Error('La API no esta disponible. Revisa que el servidor de Node.js este iniciado.');
  }
  if (!response.ok) {
    throw Object.assign(new Error(json.error || 'La API no pudo completar la solicitud.'), {
      status: response.status,
    });
  }
  return json;
}
