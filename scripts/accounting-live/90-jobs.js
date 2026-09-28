/* Scheduled Jobs: /accounting/jobs — the jobs that run on their own (interest accrual, depreciation, recurring journals,
 * the daily rate, reminders, the ledger check): when each runs, whether it is on, what its last runs did, and Run now. */
AL.jobsLoad = () => AL.res('jobs', () => AL.get('/accounting/jobs'));
AL.jobWhen = (s) => {
  if (!s) return '—';
  if (s.kind === 'daily') return `Every day at ${s.at}`;
  if (s.kind === 'monthly') return `Monthly on day ${s.day} at ${s.at}`;
  if (s.kind === 'month-end') return `Last day of the month at ${s.at}`;
  if (s.kind === 'business-days') return `First ${s.days} working days of the month at ${s.at}`;
  return '—';
};
AL.jobSummary = (run) => {
  if (!run) return 'Not run yet';
  if (run.status === 'failed') return run.error || 'Failed';
  const s = run.summary || {};
  const bits = [];
  if (s.outcome === 'recorded') bits.push(`Rate ${s.rate}`);
  if (s.outcome === 'already_recorded') bits.push('Already recorded');
  if (s.processed != null) bits.push(`${s.processed} day-accrual(s) posted`);
  if (s.processedAssets != null) bits.push(`${s.processedAssets} asset(s), ${AL.money(s.totalDepreciation)} for ${s.period}`);
  if (s.created != null) bits.push(`${s.created} journal(s) created`);
  if (s.overdue != null && s.outstanding != null) bits.push(`${s.overdue} overdue invoice(s), ${AL.money(s.outstanding)}`);
  else if (s.overdue != null && s.due != null) bits.push(`${s.due} maturing, ${s.overdue} past maturity`);
  else if (s.overdue === 0) bits.push('Nothing overdue');
  if (s.open != null) bits.push(`${s.open} open close task(s)`);
  if (s.ok != null) bits.push(s.ok ? 'Ledger balances' : `${s.unbalancedJournals} unbalanced journal(s), trial balance off by ${AL.money(s.trialBalanceDifference)}${s.overlappingPeriods ? `, ${s.overlappingPeriods} overlapping period(s)` : ''}`);
  if (s.yearMonth) bits.push(`Revaluation for ${s.yearMonth}`);
  return bits.join(' · ') || 'Done';
};
AL.page('jobs', () => {
  AL.meLoad();
  // running a job now or switching it is for people who may post to the ledger (the server's rule too)
  const canRun = AL.can('manage_ledger');
  const e = AL.jobsLoad();
  const head = AL.head('Governance', 'Scheduled Jobs', 'Work Accounting does on its own, in Harare time.');
  const g = AL.gate(e, { key: 'jobs', errorTitle: 'The scheduled jobs could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const d = e.data;
  const jobs = d.jobs || [];
  // a run that failed, or a check that ran and found something (the ledger integrity check)
  const failed = jobs.filter((j) => j.lastRun && (j.lastRun.status === 'failed' || (j.lastRun.summary && j.lastRun.summary.ok === false))).length;
  const off = jobs.filter((j) => !j.enabled).length;
  const kpis = AL.kpis([
    ['Jobs', String(jobs.length), `${jobs.filter((j) => j.postsToLedger).length} post to the ledger`],
    ['Needs attention', String(failed), failed ? 'A run failed or found a problem' : 'Nothing to act on', failed ? '#d92d20' : '#12b76a'],
    ['Switched off', String(off), off ? 'Not running on schedule' : 'All running', off ? '#f79009' : '#12b76a'],
    ['Time zone', d.timezone, `Now ${d.now ? `${String(d.now.hh).padStart(2, '0')}:${String(d.now.mm).padStart(2, '0')} on ${AL.date(d.now.date)}` : ''}`],
  ]);
  const rows = jobs.map((j) => {
    const last = j.lastRun;
    return `<tr>
      <td><strong>${ae(j.label)}</strong><span class="v28-sub">${ae(j.description)}</span></td>
      <td>${ae(AL.jobWhen(j.schedule))}</td>
      <td>${j.enabled ? AL.status('On', 'ok') : AL.status(j.disabledByEnvironment ? 'Off (server setting)' : 'Off', 'warn')}</td>
      <td>${last ? `${AL.status(last.status === 'succeeded' ? 'Succeeded' : last.status === 'failed' ? 'Failed' : 'Running')}<span class="v28-sub">${ae(AL.dateTime(last.startedAt))}${last.trigger === 'manual' ? ' · run by hand' : ''}</span>` : AL.status('Never run', 'info')}</td>
      <td class="al-wrap">${ae(AL.jobSummary(last))}</td>
      <td class="al-actions">${canRun ? AL.btn('Run now', 'job-run', 'small', `data-key="${ae(j.key)}"`) : ''}${j.disabledByEnvironment || !canRun ? '' : AL.btn(j.enabled ? 'Switch off' : 'Switch on', 'job-toggle', 'small', `data-key="${ae(j.key)}" data-on="${j.enabled ? '0' : '1'}"`)}${AL.btn('History', 'job-history', 'small', `data-key="${ae(j.key)}"`)}</td>
    </tr>`;
  }).join('');
  return `<div class="v28-page">${head}${kpis}${AL.panel('Jobs', '', AL.table(['Job', 'When', 'Schedule', 'Last run', 'Result', ''], rows, '1100px'))}</div>`;
});
AL.actions['job-run'] = (el) => {
  const j = ((AL.cache.jobs && AL.cache.jobs.data && AL.cache.jobs.data.jobs) || []).find((x) => x.key === el.dataset.key);
  if (!j) return;
  AL.confirm({
    title: `Run ${j.label} now`, sub: AL.jobWhen(j.schedule),
    body: j.postsToLedger ? `${j.description} It posts to the ledger. Work already done (a day already accrued, a month already depreciated) is not posted again.` : j.description,
    confirmLabel: 'Run now', doneTitle: `${j.label} ran`,
    onConfirm: async () => {
      const r = await AL.post(`/accounting/jobs/${encodeURIComponent(j.key)}/run`, {});
      if (r && r.status === 'failed') throw new Error(r.error || 'The run failed.');
      return AL.jobSummary(r && { status: r.status, summary: r.summary });
    },
    after: () => AL.run('jobs'),
  });
};
AL.actions['job-toggle'] = (el) => AL.busy(el, async () => { await AL.patch(`/accounting/jobs/${encodeURIComponent(el.dataset.key)}`, { enabled: el.dataset.on === '1' }); await AL.run('jobs'); }, [el.dataset.on === '1' ? 'Switched on' : 'Switched off', 'The schedule is updated.']);
AL.actions['job-history'] = (el) => {
  const j = ((AL.cache.jobs && AL.cache.jobs.data && AL.cache.jobs.data.jobs) || []).find((x) => x.key === el.dataset.key);
  if (!j) return;
  const rows = (j.recent || []).map((r) => `<tr><td>${ae(AL.dateTime(r.startedAt))}</td><td>${ae(r.trigger === 'manual' ? 'By hand' : r.slot)}</td><td>${AL.status(r.status === 'succeeded' ? 'Succeeded' : r.status === 'failed' ? 'Failed' : 'Running')}</td><td class="al-wrap">${ae(AL.jobSummary(r))}</td></tr>`).join('');
  AL.form({ title: `${j.label}: recent runs`, sub: AL.jobWhen(j.schedule), wide: true, submitLabel: 'Close', viewOnly: true, fields: [], extra: `<div class="al-wide">${AL.table(['Started', 'Slot', 'Result', 'Detail'], rows, '640px')}</div>`, onSubmit: async () => false });
};
AL.navAdd('Governance', ['jobs', 'Scheduled Jobs', 'settings'], 'settings');
