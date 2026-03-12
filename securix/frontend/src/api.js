// If VITE_API_URL is intentionally set to something else, use it.
// Default to dynamic absolute URL pointing to port 5000 on the same host IP
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

export default API_BASE;
