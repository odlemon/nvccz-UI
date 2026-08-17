(function (global) {
  'use strict';

  const config = global.MATANHO_CONFIG || {};
  const api = new global.MatanhoApiClient({ baseUrl: config.apiBaseUrl });
  const handlers = new Map();
  const actionAttrs = [
    'data-action','data-v5-action','data-v6-action','data-v7-action','data-v8-action','data-v9-action','data-v10-action',
    'data-v11-strategy-action','data-v13-action','data-v14-action','data-v15-action','data-v17-action','data-v18-action',
    'data-v19-kr-action','data-v20-action','data-v21-action','data-v22-action','data-sc-action','data-sc83-action'
  ];
  const actionSelector = actionAttrs.map(a => `[${a}]`).join(',');
  const attrKey = name => name.replace(/^data-/, '');

  function emit(name, detail) {
    global.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function findAction(el) {
    if (!el) return null;
    for (const attr of actionAttrs) {
      if (el.hasAttribute(attr)) return { namespace: attrKey(attr), action: el.getAttribute(attr) };
    }
    return null;
  }

  function currentContext(el, hit) {
    const safeState = typeof state !== 'undefined' ? state : {};
    return {
      namespace: hit?.namespace || '',
      action: hit?.action || '',
      id: el?.dataset?.id || '',
      page: safeState.page || '',
      role: safeState.role || '',
      entity: safeState.entity || '',
      year: safeState.year || '',
      element: el,
      state: safeState
    };
  }

  function registerAction(namespace, action, handler) {
    const key = `${namespace || '*'}:${action}`;
    handlers.set(key, handler);
    return () => handlers.delete(key);
  }

  function resolveHandler(hit) {
    return handlers.get(`${hit.namespace}:${hit.action}`) || handlers.get(`*:${hit.action}`) || null;
  }

  function patchPrototypeState(payload) {
    if (!payload || typeof payload !== 'object' || typeof state === 'undefined') return;
    if (payload.shell && typeof payload.shell === 'object') {
      const shell = payload.shell;
      if (shell.role) state.role = shell.role;
      if (shell.entity) state.entity = shell.entity;
      if (shell.year) state.year = shell.year;
      if (Number.isFinite(shell.notifications)) state.notifications = shell.notifications;
      if (Array.isArray(shell.documents)) state.docs = shell.documents;
    }
    global.MatanhoServerData = payload.modules || payload.data || {};
    try {
      const roleSelect = document.getElementById('roleSelect');
      if (roleSelect && state.role) roleSelect.value = state.role;
      const roleCopy = document.getElementById('userRoleCopy');
      if (roleCopy && state.role) roleCopy.textContent = state.role;
      if (typeof render === 'function') render();
    } catch (error) {
      if (config.debug) console.warn('[Matanho bridge] state hydration render failed', error);
    }
  }

  async function bootstrap() {
    if (!config.enableBackendHydration) {
      emit('matanho:backend-skipped', { reason: 'enableBackendHydration=false' });
      return null;
    }
    emit('matanho:backend-loading', {});
    try {
      const payload = await api.get('/bootstrap');
      patchPrototypeState(payload);
      emit('matanho:backend-ready', payload);
      return payload;
    } catch (error) {
      emit('matanho:backend-error', { error });
      if (config.debug) console.error('[Matanho bridge] bootstrap failed', error);
      return null;
    }
  }

  document.addEventListener('click', async event => {
    const el = event.target.closest(actionSelector);
    if (!el) return;
    const hit = findAction(el);
    if (!hit || !hit.action || hit.action.includes('${')) return;
    const context = currentContext(el, hit);
    emit('matanho:ui-action', { ...context, element: undefined, state: undefined });
    if (!config.interceptMutations) return;
    const handler = resolveHandler(hit);
    if (!handler) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      el.setAttribute('aria-busy', 'true');
      const result = await handler(context, api);
      emit('matanho:mutation-success', { action: hit.action, id: context.id, result });
      if (typeof render === 'function') render();
    } catch (error) {
      emit('matanho:mutation-error', { action: hit.action, id: context.id, error });
      if (typeof toast === 'function') toast('Unable to save', error?.message || 'The backend request failed.');
      else console.error(error);
    } finally {
      el.removeAttribute('aria-busy');
    }
  }, true);

  global.MatanhoBackendBridge = Object.freeze({
    api,
    services: global.MatanhoServices || null,
    bootstrap,
    patchPrototypeState,
    registerAction,
    emit,
    findAction,
    actionAttributes: [...actionAttrs]
  });

  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
})(window);
