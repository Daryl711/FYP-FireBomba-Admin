// Thin fetch wrapper that always sends the httpOnly auth cookie.
//
// The access token now lives in an httpOnly cookie set by the backend at
// login, so it is never readable by JavaScript. For the browser to attach that
// cookie to a cross-origin (localhost:8081 -> localhost:3000) request, the
// fetch must use credentials: "include". Routing every API call through this
// helper guarantees that without repeating it at each call site.
export function apiFetch(input, options = {}) {
  return fetch(input, { ...options, credentials: "include" });
}
