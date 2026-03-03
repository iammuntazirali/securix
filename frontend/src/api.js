// This allows the frontend to easily switch between local and deployed backend without code changes

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export default API_BASE;
