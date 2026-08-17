/*
  Copy the handlers you are ready to migrate into a real file and load it after backend-bridge.js.
  Set MATANHO_CONFIG.interceptMutations=true only after the relevant handlers are registered.
*/
(function (global) {
  const bridge = global.MatanhoBackendBridge;
  if (!bridge) return;

  bridge.registerAction('v20-action', 'project-save', async ({ element }, api) => {
    const form = document.getElementById('v20ProjectForm');
    if (!form) throw new Error('Project form not found');
    const data = Object.fromEntries(new FormData(form));
    return api.post('/projects', data);
  });

  bridge.registerAction('v20-action', 'kpi-save', async ({ id }, api) => {
    const form = document.getElementById('v20KpiForm');
    if (!form) throw new Error('KPI form not found');
    const data = Object.fromEntries(new FormData(form));
    return id ? api.patch(`/kpis/${encodeURIComponent(id)}`, data) : api.post('/kpis', data);
  });

  bridge.registerAction('v13-action', 'review-save', async ({ id }, api) => {
    const form = document.querySelector('[data-review-form]');
    const data = form ? Object.fromEntries(new FormData(form)) : {};
    return api.patch(`/reviews/${encodeURIComponent(id)}`, data);
  });
})(window);
