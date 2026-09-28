/* Integrations: /accounting/integrations — how each connected module feeds the ledger, from the records: journals it
 * raised (last 30 days, waiting to be posted, voided, the latest), the scheduled jobs that carry it and their last run,
 * failures recorded for it. A module opens in a new tab; an accounting page opens here. Data: /accounting/integrations. */
AL.intLoad = () => AL.res('int', () => AL.get('/accounting/integrations'));

AL.page('integrations', () => {
  AL.meLoad();
  const e = AL.intLoad();
  const head = AL.head('Administration', 'Integrations', 'What each module has posted to the ledger, and whether its scheduled jobs ran.', AL.btn('Refresh', 'int-refresh'));
  const g = AL.gate(e, { key: 'int', errorTitle: 'Integrations could not be loaded' });
  if (g) return `<div class="v28-page">${head}${g}</div>`;
  const list = e.data || [];
  const jobsFailed = list.reduce((s, x) => s + x.jobs.filter((j) => j.status === 'failed').length, 0);
  const waiting = list.reduce((s, x) => s + ((x.journals && x.journals.pending) || 0), 0);
  const kpis = AL.kpis([
    ['Connected modules', String(list.filter((x) => (x.journals && x.journals.total) || x.jobs.some((j) => j.status)).length), `of ${list.length}`],
    ['Journals, last 30 days', list.reduce((s, x) => s + ((x.journals && x.journals.last30) || 0), 0).toLocaleString('en-US'), 'Raised by other modules'],
    ['Waiting to be posted', String(waiting), 'In the Approval Queue', waiting ? '#f79009' : '#12b76a'],
    ['Job failures', String(jobsFailed), 'Last run of each job', jobsFailed ? '#d92d20' : '#12b76a'],
  ]);
  const rows = list.map((x) => {
    const j = x.journals;
    const health = x.jobs.some((y) => y.status === 'failed') ? AL.status('Job failed', 'bad') : x.failures30 ? AL.status(`${x.failures30} failure${x.failures30 === 1 ? '' : 's'} in 30 days`, 'warn') : (j && j.total) || x.jobs.some((y) => y.status) ? AL.status('Working', 'ok') : AL.status('Nothing yet', 'info');
    const jobs = x.jobs.length ? x.jobs.map((y) => `${ae(y.label)}: ${y.status ? `${ae(y.status === 'succeeded' ? 'ran' : y.status)} ${ae(AL.dateTime(y.at))}` : 'never run'}${y.error ? ` <span class="al-bad">${ae(String(y.error).slice(0, 120))}</span>` : ''}`).join('<br>') : '<span class="v28-sub">—</span>';
    const open = x.link ? `<a class="v28-btn small" href="${ae(x.link)}" target="_blank" rel="noopener">Open ${ae(x.label)}</a>` : x.page ? AL.btn('Open', 'int-go', 'small', `data-page="${ae(x.page)}"`) : '';
    return `<tr>
      <td><strong>${ae(x.label)}</strong><span class="v28-sub">${ae(x.feeds)}</span></td>
      <td>${j ? `${j.last30.toLocaleString('en-US')}<span class="v28-sub">${j.total.toLocaleString('en-US')} in all</span>` : x.extra && x.extra.lastRateDate ? `Rate of ${ae(AL.date(x.extra.lastRateDate))}<span class="v28-sub">${ae(x.extra.source === 'MANUAL' ? 'Entered by hand' : 'From the official source')}</span>` : '—'}</td>
      <td>${j ? (j.pending ? `<span class="al-bad">${j.pending}</span>` : '0') : '—'}${j && j.voided ? `<span class="v28-sub">${j.voided} voided</span>` : ''}</td>
      <td>${j && j.latest ? `${ae(j.latest.referenceNumber.length > 28 ? `${j.latest.referenceNumber.slice(0, 28)}…` : j.latest.referenceNumber)}<span class="v28-sub">${ae(AL.dateTime(j.latest.createdAt))}</span>` : '—'}</td>
      <td class="al-wrap">${jobs}</td>
      <td>${health}</td>
      <td class="al-actions">${open}</td>
    </tr>`;
  }).join('');
  return `<div class="v28-page">${head}${kpis}${AL.panel('Modules feeding the ledger', '', AL.table(['Module', 'Journals, 30 days', 'Waiting', 'Latest', 'Scheduled jobs', 'State', ''], rows, '1180px'))}</div>`;
});
AL.actions['int-refresh'] = (el) => AL.busy(el, async () => { await AL.run('int'); });
AL.actions['int-go'] = (el) => AL.go(el.dataset.page);
