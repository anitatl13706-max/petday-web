import { cleanToastMessage, showToast } from './ToastProvider';

/** Central API origin for deployed frontend. Empty by default: localhost Vite proxy. */
const configuredOrigin = (import.meta.env.VITE_API_ORIGIN || '').trim().replace(/\/+$/, '');
if (configuredOrigin && !/^https:\/\/[^/]+(?:\:\d+)?$/i.test(configuredOrigin) && !/^http:\/\/localhost(?::\d+)?$/i.test(configuredOrigin)) {
  throw new Error('VITE_API_ORIGIN phải là địa chỉ máy chủ HTTPS hợp lệ (hoặc localhost khi phát triển).');
}
export const backendAssetUrl = (value: string) =>
  configuredOrigin && value.startsWith('/uploads/') ? configuredOrigin + value : value;
/** Prefix only local API and uploaded-photo requests; leave other fetch calls untouched. */
export const apiFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : null;
  const target = configuredOrigin && url && (url.startsWith('/api/') || url.startsWith('/uploads/'))
    ? configuredOrigin + url
    : input;
  const response = await fetch(target, init);
  const method = (init?.method || 'GET').toUpperCase();
  if (!response.ok && method !== 'GET' && url?.startsWith('/api/')) {
    void response.clone().json().catch(() => ({})).then((body) => {
      const technical = body?.error || body?.message || `HTTP ${response.status}`;
      console.error('[PetDay API]', { url, method, status: response.status, error: technical });
      showToast(cleanToastMessage(technical), 'error');
    });
  }
  const quietMutation = url === '/api/auth/login' || url === '/api/payments/qr-session' || url === '/api/assistant/chat' || Boolean(url?.match(/^\/api\/bookings\/[^/]+\/care-events\/\d+\/images$/));
  if (response.ok && method !== 'GET' && url?.startsWith('/api/') && !quietMutation) {
    void response.clone().json().catch(() => ({})).then((body) => {
      showToast(body?.message || 'Thao tác đã được thực hiện thành công.', 'success');
    });
  }
  return response;
};

