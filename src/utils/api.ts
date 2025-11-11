const ENVIRONMENTS = {
  local: "http://127.0.0.1:8000",
//   staging: "https://staging-fastapi.onrender.com",
//   production: "https://fastapi-prod.onrender.com",
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || ENVIRONMENTS.local;

export async function fetchFromFastAPI(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return await res.json(); // ✅ returns parsed JSON
  } catch (err) {
    console.error(`[FastAPI Fetch Error] ${endpoint}`, err);
    throw err;
  }
}