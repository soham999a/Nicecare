const FALLBACK_FUNCTIONS_URL = '';

export function getFunctionsUrl() {
  return (import.meta.env.VITE_FUNCTIONS_URL || FALLBACK_FUNCTIONS_URL).trim();
}

export function assertBackendConfig() {
  const functionsUrl = getFunctionsUrl();
  if (!functionsUrl && import.meta.env.PROD) {
    console.warn(
      '[backend] VITE_FUNCTIONS_URL is not set. Cloud Function requests may fail in production.'
    );
  }
  return { functionsUrl };
}
