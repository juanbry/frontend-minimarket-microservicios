// La URL base de tu API, ahora con el puerto correcto.
const API_BASE_URL = 'http://3.133.127.246:8888';

/**
 * Realiza una petición a la API de forma centralizada.
 * @param {string} endpoint El endpoint al que se llamará (ej. /auth/token).
 * @param {string} method El método HTTP (GET, POST, etc.).
 * @param {object} [body] El cuerpo de la petición para métodos como POST.
 * @param {string} [token] El token de autenticación.
 * @returns {Promise<Response>} La respuesta de la API.
 */
// api.js
async function apiFetch(endpoint, method = 'GET', body = null, token = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json' };

    if (token) { headers['Authorization'] = `Bearer ${token}`; }

    const options = { method, headers };
    if (body) { options.body = JSON.stringify(body); }
    
    try {
        const response = await fetch(url, options);
        return response; // Retornamos la respuesta completa para validar response.ok
    } catch (error) {
        console.error('Error de red:', error);
        throw new Error('No se pudo conectar con el servidor.');
    }
}
