const PRODUCTION_APP_URL = 'https://gate-2028.vercel.app';

export function getAppUrl(path = ''): string {
  const configuredUrl = import.meta.env?.VITE_APP_URL?.trim();
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = configuredUrl || (runtimeOrigin && !runtimeOrigin.includes('localhost') ? runtimeOrigin : PRODUCTION_APP_URL);

  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
