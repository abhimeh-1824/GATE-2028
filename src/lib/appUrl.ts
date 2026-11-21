const PRODUCTION_APP_URL = 'https://gate-2028.vercel.app';

function isLocalUrl(url: string): boolean {
  return /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(url);
}

export function getAppUrl(path = ''): string {
  const configuredUrl = import.meta.env?.VITE_APP_URL?.trim() || '';
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const usableConfiguredUrl = configuredUrl && !isLocalUrl(configuredUrl) ? configuredUrl : '';
  const usableRuntimeOrigin = runtimeOrigin && !runtimeOrigin.includes('localhost') && !runtimeOrigin.includes('127.0.0.1')
    ? runtimeOrigin
    : '';

  const baseUrl = usableConfiguredUrl || usableRuntimeOrigin || PRODUCTION_APP_URL;

  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
