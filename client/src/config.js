/**
 * App configuration — resolves API base URL from environment.
 *
 * Dev:  empty string (Vite proxy handles /api → localhost:3000)
 * Prod: VITE_API_URL env var (e.g. https://brokerpilot-production.up.railway.app)
 */
export const API_BASE = import.meta.env.VITE_API_URL || '';
