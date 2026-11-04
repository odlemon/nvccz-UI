/* Scheduled Jobs: /accounting/jobs — the jobs that run on their own (interest accrual, depreciation, recurring journals,
 * the daily rate, reminders, the ledger check): when each runs, whether it is on, what its last runs did, and Run now. */
AL.jobsLoad = () => AL.res('jobs', () => AL.get('/accounting/jobs'));
const JOBS_PAGE_SIZE = 8;
const jobsPage = () => Math.max(1, Number(AL.ui.jobsPage || 1));
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
  return bits.join(' | ') || 'Done';
};
AL.page('jobs', () => {
  AL.meLoad();
  // running a job now or switching it is for people who may post to the ledger (the server's rule too)
  const canRun = AL.can('manage_ledger');
  const e = AL.jobsLoad();
  const head = AL.head('Governance', 'Scheduled Jobs', 'Work Accounting does on its own, in Harare time.', `${AL.btn('Refresh', 'jobs-refresh', 'small')}${AL.exportBtns('jobs-export')}`);
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
  const pages = Math.max(1, Math.ceil(jobs.length / JOBS_PAGE_SIZE));
  const page = Math.min(jobsPage(), pages);
  AL.ui.jobsPage = page;
  const visibleJobs = jobs.slice((page - 1) * JOBS_PAGE_SIZE, page * JOBS_PAGE_SIZE);
  const rows = visibleJobs.map((j) => {
    const last = j.lastRun;
    return `<tr>
      <td><strong>${ae(j.label)}</strong><span class="v28-sub">${ae(j.description)}</span></td>
      <td>${ae(AL.jobWhen(j.schedule))}</td>
      <td>${j.enabled ? AL.status('On', 'ok') : AL.status(j.disabledByEnvironment ? 'Off (server setting)' : 'Off', 'warn')}</td>
      <td>${last ? `${AL.status(last.status === 'succeeded' ? 'Succeeded' : last.status === 'failed' ? 'Failed' : 'Running')}<span class="v28-sub">${ae(AL.dateTime(last.startedAt))}${last.trigger === 'manual' ? ' - run by hand' : ''}</span>` : AL.status('Never run', 'info')}</td>
      <td class="al-wrap">${ae(AL.jobSummary(last))}</td>
      <td class="al-actions">${AL.btn('Manage', 'job-manage', 'small', `data-key="${ae(j.key)}"`)}</td>
    </tr>`;
  }).join('');
  const pager = `<div class="al-jobs-pager" role="navigation" aria-label="Scheduled jobs pages"><span>Showing ${jobs.length ? (page - 1) * JOBS_PAGE_SIZE + 1 : 0}-${Math.min(page * JOBS_PAGE_SIZE, jobs.length)} of ${jobs.length} jobs</span><div><button type="button" class="v28-btn small" data-al="jobs-page" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${page} of ${pages}</span><button type="button" class="v28-btn small" data-al="jobs-page" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Next</button></div></div>`;
  return `<div class="v28-page al-jobs-page">${head}${kpis}${AL.panel('Jobs', 'Review the schedule, recent result and next action for each job.', `<div class="al-jobs-table">${AL.table(['Job', 'When', 'Schedule', 'Last run', 'Result', 'Actions'], rows, '1100px')}</div>${pager}`)}</div>`;
});
AL.actions['jobs-page'] = (el) => { AL.ui.jobsPage = Number(el.dataset.page) || 1; AL.redraw(); };
AL.actions['jobs-refresh'] = (el) => AL.busy(el, () => AL.run('jobs'), ['Updated', 'Scheduled job data was refreshed.']);
AL.actions['job-manage'] = (el) => {
  const j = ((AL.cache.jobs && AL.cache.jobs.data && AL.cache.jobs.data.jobs) || []).find((x) => x.key === el.dataset.key);
  if (!j) return;
  const canRun = AL.can('manage_ledger');
  const actions = `${canRun ? AL.btn('Run now', 'job-run', 'small', `type="button" data-key="${ae(j.key)}"`) : ''}${j.disabledByEnvironment || !canRun ? '' : AL.btn(j.enabled ? 'Switch off' : 'Switch on', 'job-toggle', 'small', `type="button" data-key="${ae(j.key)}" data-on="${j.enabled ? '0' : '1'}"`)}${AL.btn('View run history', 'job-history', 'small', `type="button" data-key="${ae(j.key)}"`)}`;
  AL.form({ title: j.label, sub: AL.jobWhen(j.schedule), wide: true, submitLabel: 'Close', viewOnly: true, fields: [], extra: `<p class="al-job-description">${ae(j.description)}</p><p class="al-job-posting">${j.postsToLedger ? 'This job can post to the general ledger.' : 'This job does not post to the general ledger.'} Schedule status: ${j.enabled ? 'On' : j.disabledByEnvironment ? 'Off by server setting' : 'Off'}.</p><div class="al-job-controls">${actions}</div>`, onSubmit: async () => false });
};
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
AL.actions['job-toggle'] = (el) => AL.busy(el, async () => { await AL.patch(`/accounting/jobs/${encodeURIComponent(el.dataset.key)}`, { enabled: el.dataset.on === '1' }); await AL.run('jobs'); AL.close(); }, [el.dataset.on === '1' ? 'Switched on' : 'Switched off', 'The schedule is updated.']);
AL.actions['job-history'] = (el) => {
  const j = ((AL.cache.jobs && AL.cache.jobs.data && AL.cache.jobs.data.jobs) || []).find((x) => x.key === el.dataset.key);
  if (!j) return;
  const rows = (j.recent || []).map((r) => `<tr><td>${ae(AL.dateTime(r.startedAt))}</td><td>${ae(r.trigger === 'manual' ? 'By hand' : r.slot)}</td><td>${AL.status(r.status === 'succeeded' ? 'Succeeded' : r.status === 'failed' ? 'Failed' : 'Running')}</td><td class="al-wrap">${ae(AL.jobSummary(r))}</td></tr>`).join('');
  AL.form({ title: `${j.label}: recent runs`, sub: AL.jobWhen(j.schedule), wide: true, submitLabel: 'Close', viewOnly: true, fields: [], extra: `<div class="al-wide">${AL.table(['Started', 'Slot', 'Result', 'Detail'], rows, '640px')}</div>`, onSubmit: async () => false });
};
AL.actions['jobs-export'] = (el) => {
  const d = AL.cache.jobs && AL.cache.jobs.data;
  if (!d) return;
  const jobs = d.jobs || [];
  const spec = {
    title: 'Scheduled Jobs',
    subtitle: `Accounting job schedule and latest results | ${d.timezone || 'Africa/Harare'}`,
    meta: [['Time zone', d.timezone || 'Africa/Harare'], ['Total jobs', String(jobs.length)], ['Needs attention', String(jobs.filter((j) => j.lastRun && (j.lastRun.status === 'failed' || (j.lastRun.summary && j.lastRun.summary.ok === false))).length)]],
    columns: ['Job', 'Description', 'When', 'Schedule status', 'Ledger posting', 'Last run', 'Run result'],
    rows: jobs.map((j) => [j.label, j.description, AL.jobWhen(j.schedule), j.enabled ? 'On' : j.disabledByEnvironment ? 'Off (server setting)' : 'Off', j.postsToLedger ? 'Yes' : 'No', j.lastRun ? AL.dateTime(j.lastRun.startedAt) : 'Never run', AL.jobSummary(j.lastRun)]),
    filename: 'accounting-scheduled-jobs',
    landscape: true,
    note: 'Scheduled job run results are informational. Ledger postings remain subject to the Accounting approval and period-lock controls.',
  };
  AL.exportRun(el, spec, 'jobs');
};
AL.navAdd('Governance', ['jobs', 'Scheduled Jobs', 'settings'], 'settings');
