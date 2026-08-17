(function (global) {
  'use strict';

  const cfg = () => global.MATANHO_CONFIG || {};

  function cookie(name) {
    if (!name || typeof document === 'undefined') return '';
    const target = encodeURIComponent(name) + '=';
    return document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith(target))?.slice(target.length) || '';
  }

  class ApiError extends Error {
    constructor(message, status, payload, url) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.payload = payload;
      this.url = url;
    }
  }

  class ApiClient {
    constructor(options = {}) {
      const c = cfg();
      this.baseUrl = String(options.baseUrl || c.apiBaseUrl || '/api/v1').replace(/\/$/, '');
      this.timeoutMs = Number(options.timeoutMs || c.requestTimeoutMs || 15000);
      this.authMode = options.authMode || c.authMode || 'cookie';
      this.csrfCookieName = options.csrfCookieName || c.csrfCookieName || 'XSRF-TOKEN';
      this.csrfHeaderName = options.csrfHeaderName || c.csrfHeaderName || 'X-CSRF-TOKEN';
      this.tokenProvider = options.tokenProvider || (() => global.localStorage?.getItem('matanho_access_token') || '');
    }

    url(path, query) {
      const p = String(path || '').startsWith('/') ? String(path) : '/' + String(path || '');
      const u = new URL(this.baseUrl + p, global.location?.origin || 'http://localhost');
      Object.entries(query || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v));
      });
      return u.toString();
    }

    async request(method, path, options = {}) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Number(options.timeoutMs || this.timeoutMs));
      const headers = new Headers(options.headers || {});
      const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
      const isBlob = typeof Blob !== 'undefined' && options.body instanceof Blob;
      let body = options.body;
      if (body !== undefined && body !== null && !isForm && !isBlob && typeof body !== 'string') {
        headers.set('Content-Type', 'application/json');
        body = JSON.stringify(body);
      }
      headers.set('Accept', options.accept || 'application/json');

      if (this.authMode === 'bearer') {
        const token = await this.tokenProvider();
        if (token) headers.set('Authorization', 'Bearer ' + token);
      } else if (!['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase())) {
        const csrf = decodeURIComponent(cookie(this.csrfCookieName) || '');
        if (csrf) headers.set(this.csrfHeaderName, csrf);
      }

      let response;
      try {
        response = await fetch(this.url(path, options.query), {
          method,
          headers,
          body,
          credentials: this.authMode === 'cookie' ? 'include' : 'same-origin',
          signal: controller.signal
        });
      } catch (error) {
        clearTimeout(timer);
        if (error?.name === 'AbortError') throw new ApiError('Request timed out', 0, null, path);
        throw new ApiError(error?.message || 'Network request failed', 0, null, path);
      }
      clearTimeout(timer);

      if (response.status === 204) return null;
      const type = response.headers.get('content-type') || '';
      const payload = type.includes('application/json') ? await response.json() : await response.text();
      if (!response.ok) {
        const message = payload?.message || payload?.error || response.statusText || 'Request failed';
        throw new ApiError(message, response.status, payload, response.url);
      }
      return payload;
    }

    get(path, query, options = {}) { return this.request('GET', path, { ...options, query }); }
    post(path, body, options = {}) { return this.request('POST', path, { ...options, body }); }
    put(path, body, options = {}) { return this.request('PUT', path, { ...options, body }); }
    patch(path, body, options = {}) { return this.request('PATCH', path, { ...options, body }); }
    delete(path, body, options = {}) { return this.request('DELETE', path, { ...options, body }); }
  }

  global.MatanhoApiClient = ApiClient;
  global.MatanhoApiError = ApiError;
})(window);
