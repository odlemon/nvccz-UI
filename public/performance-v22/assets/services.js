(function (global) {
  'use strict';
  if (!global.MatanhoApiClient) return;
  const api = new global.MatanhoApiClient({ baseUrl: global.MATANHO_CONFIG?.apiBaseUrl });
  const enc = encodeURIComponent;
  const resource = name => ({
    list: query => api.get(`/${name}`, query),
    get: id => api.get(`/${name}/${enc(id)}`),
    create: payload => api.post(`/${name}`, payload),
    update: (id, payload) => api.patch(`/${name}/${enc(id)}`, payload),
    remove: id => api.delete(`/${name}/${enc(id)}`)
  });

  global.MatanhoServices = Object.freeze({
    api,
    bootstrap: () => api.get('/bootstrap'),
    health: () => api.get('/health'),
    strategy: {
      ...resource('strategy'),
      submit: id => api.post(`/strategy/${enc(id)}/submit`, {})
    },
    goals: resource('goals'),
    kpis: {
      ...resource('kpis'),
      recordObservation: (id, payload) => api.post(`/kpis/${enc(id)}/observations`, payload)
    },
    scorecards: {
      ...resource('scorecards'),
      updateEntry: (scorecardId, entryId, payload) => api.patch(`/scorecards/${enc(scorecardId)}/entries/${enc(entryId)}`, payload),
      publish: id => api.post(`/scorecards/${enc(id)}/publish`, {})
    },
    contracts: resource('contracts'),
    reviews: {
      ...resource('reviews'),
      finalize: (id, payload = {}) => api.post(`/reviews/${enc(id)}/finalize`, payload)
    },
    tasks: {
      ...resource('tasks'),
      comment: (id, body) => api.post(`/tasks/${enc(id)}/comments`, { body }),
      addSubtask: (id, payload) => api.post(`/tasks/${enc(id)}/subtasks`, payload)
    },
    projects: {
      ...resource('projects'),
      setMembers: (id, members) => api.put(`/projects/${enc(id)}/members`, { members })
    },
    timesheets: {
      current: () => api.get('/timesheets/current'),
      saveCurrent: payload => api.patch('/timesheets/current', payload),
      startTimer: payload => api.post('/timesheets/timer/start', payload),
      stopTimer: () => api.post('/timesheets/timer/stop', {})
    },
    correctiveActions: resource('corrective-actions'),
    reports: {
      ...resource('reports'),
      preview: id => api.get(`/reports/${enc(id)}/preview`),
      run: (id, payload = {}) => api.post(`/reports/${enc(id)}/run`, payload)
    },
    risks: {
      ...resource('risks'),
      addControl: (id, payload) => api.post(`/risks/${enc(id)}/controls`, payload),
      addTreatment: (id, payload) => api.post(`/risks/${enc(id)}/treatments`, payload),
      addKri: (id, payload) => api.post(`/risks/${enc(id)}/kris`, payload)
    },
    documents: {
      ...resource('documents'),
      previewUrl: id => `${String(global.MATANHO_CONFIG?.apiBaseUrl || '/api/v1').replace(/\/$/,'')}/documents/${enc(id)}/preview`
    },
    notifications: {
      list: query => api.get('/notifications', query),
      markRead: id => api.post(`/notifications/${enc(id)}/read`, {})
    },
    users: resource('users'),
    roles: { list: () => api.get('/roles') },
    audit: { list: query => api.get('/audit-events', query) }
  });
})(window);
