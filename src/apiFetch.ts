/** Central API origin for deployed frontend. Empty by default: localhost Vite proxy. */
const configuredOrigin = (import.meta.env.VITE_API_ORIGIN || '').trim().replace(/\/+$/, '');
if (configuredOrigin && !/^https:\/\/[^/]+(?:\:\d+)?$/i.test(configuredOrigin) && !/^http:\/\/localhost(?::\d+)?$/i.test(configuredOrigin)) {
  throw new Error('VITE_API_ORIGIN phải là địa chỉ máy chủ HTTPS hợp lệ (hoặc localhost khi phát triển).');
}
export const backendAssetUrl = (value: string) =>
  configuredOrigin && value.startsWith('/uploads/') ? configuredOrigin + value : value;
/** Prefix only local API and uploaded-photo requests; leave other fetch calls untouched. */
export const apiFetch: typeof fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : null;
  if (configuredOrigin && url && (url.startsWith('/api/') || url.startsWith('/uploads/'))) {
    return fetch(configuredOrigin + url, init);
  }
  return fetch(input, init);
};
