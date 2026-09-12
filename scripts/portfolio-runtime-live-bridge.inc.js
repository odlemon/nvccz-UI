/**
 * Portfolio runtime live-bridge — injected by scripts/patch-portfolio-runtime.mjs
 * BEFORE `window.MatanhoPortfolioUI =`. Do not edit the runtime copy by hand;
 * edit this file and re-run the patch script.
 *
 * Restores staff lifecycle UI emission lost when V25 extract overwrote hand patches.
 */
/* BEGIN_PORTFOLIO_LIVE_BRIDGE */
  function __pv11IsLive() {
    return Boolean(state.liveData) || Boolean(liveOnly) || Boolean(state.dealDetail);
  }
  function __pv11ShouldWireDeal(dealId) {
    if (state.dealDetail) return true;
    if (!dealId) return false;
    // Fixture ids look like DL-013; live application ids are UUIDs / cuid-like.
    return !/^DL-\d+/i.test(String(dealId));
  }
  function __pv11AsArray(v) {
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    if (typeof v === 'object') return Object.values(v);
    return [];
  }
  function __pv11IsDDComplete(dd) {
    return Boolean(dd && /complete/i.test(String(dd.status || '')));
  }
  function __pv11IsDDTaskComplete(task) {
    const st = String(task?.stage || task?.status || '');
    return /complete|done|closed/i.test(st);
  }
  function __pv11DdScore(dd) {
    if (!dd) return 0;
    let n = 0;
    for (const k of ['marketResearchViable','financialViable','competitiveOpportunities','managementTeamQualified','legalCompliant','riskTolerable']) {
      if (dd[k]) n++;
    }
    return n;
  }
  function __pv11CanCompleteDD(dd, tasks) {
    if (!dd) return { ok: false, reason: 'Start due diligence first' };
    if (__pv11IsDDComplete(dd)) return { ok: false, reason: 'Due diligence is already completed' };
    const required = [
      ['marketResearchViable', 'Market research'],
      ['financialViable', 'Financial assessment'],
      ['legalCompliant', 'Legal compliance'],
      ['managementTeamQualified', 'Management assessment'],
    ];
    for (const [field, label] of required) {
      if (!dd[field]) return { ok: false, reason: `${label} must be marked as met in the assessment` };
    }
    if (dd.overallScore == null) return { ok: false, reason: 'Save the assessment to calculate overall score' };
    if (!dd.recommendation) return { ok: false, reason: 'Recommendation is required in the assessment' };
    if (!dd.finalComments) return { ok: false, reason: 'Final comments are required in the assessment' };
    for (const task of __pv11AsArray(tasks)) {
      if (__pv11IsDDTaskComplete(task)) continue;
      const activities = __pv11AsArray(task.activityLogs || task.activities);
      if (!activities.length) {
        return { ok: false, reason: `Workstream "${task.name || task.workstream || task.id || 'task'}" must be marked complete` };
      }
      if (activities.some((a) => a.status && String(a.status) !== 'approved')) {
        return { ok: false, reason: `Workstream "${task.name || task.workstream || task.id || 'task'}" has unapproved activity` };
      }
    }
    return { ok: true, reason: '' };
  }
  function __pv11DealId(trigger) {
    return String(
      trigger?.dataset?.dealId ||
      trigger?.dataset?.applicationId ||
      state.selectedDealId ||
      state.dealDetail?.application?.id ||
      state.dealDetail?.id ||
      ''
    );
  }
  function __pv11EmitApi(action, dataset, files) {
    const detail = {
      action,
      dataset: { ...(dataset || {}) },
      state: publicSnapshot().state,
    };
    if (files) detail.files = files;
    emitIntegrationEvent('matanho:before-action', detail, true);
  }
  function __pv11ShowDdAssessmentModal() {
    const dd = state.dealDetail?.dueDiligence;
    if (!dd?.id) {
      toast('Start due diligence first', 'Initiate due diligence before filling the assessment.', 'warning');
      return;
    }
    const section = (title, name, commentsName, viable, comments) =>
      `<section class="drawer-section"><h3>${escapeHTML(title)}</h3><label class="checkbox-row"><input type="checkbox" name="${name}" value="1"${viable ? ' checked' : ''}> Criteria met</label><div class="form-field section-gap"><label>Comments</label><textarea name="${commentsName}">${escapeHTML(String(comments || ''))}</textarea></div></section>`;
    showModal(
      'Due diligence assessment',
      'Complete the investment checklist and recommendation before closing due diligence.',
      `<form id="ddAssessmentForm">${section('Market research','marketResearchViable','marketResearchComments',dd.marketResearchViable,dd.marketResearchComments)}${section('Financial viability','financialViable','financialComments',dd.financialViable,dd.financialComments)}${section('Competitive opportunities','competitiveOpportunities','competitiveComments',dd.competitiveOpportunities,dd.competitiveComments)}${section('Management team','managementTeamQualified','managementComments',dd.managementTeamQualified,dd.managementComments)}${section('Legal compliance','legalCompliant','legalComments',dd.legalCompliant,dd.legalComments)}${section('Risk assessment','riskTolerable','riskComments',dd.riskTolerable,dd.riskComments)}<section class="drawer-section"><h3>Final recommendation</h3><div class="form-grid"><div class="form-field"><label class="required">Recommendation</label><select name="recommendation" required><option value="APPROVE"${String(dd.recommendation||'')==='APPROVE'?' selected':''}>Approve</option><option value="CONDITIONAL"${String(dd.recommendation||'')==='CONDITIONAL'?' selected':''}>Conditional</option><option value="REJECT"${String(dd.recommendation||'')==='REJECT'?' selected':''}>Reject</option></select></div><div class="form-field full"><label class="required">Final comments</label><textarea name="finalComments" required>${escapeHTML(String(dd.finalComments||''))}</textarea></div></div></section></form>`,
      `${button('Cancel','close-modal')}${button('Save assessment','submit-dd-assessment','primary','save')}`
    );
  }
  function __pv11ShowCreateTermSheetModal(dealId) {
    const ask = deals.find((d) => String(d.id) === String(dealId))?.amount || '';
    showModal(
      'Create term sheet',
      'Issue investment terms for this deal.',
      `<form id="createTermSheetForm"><div class="form-grid"><div class="form-field full"><label>Title</label><input name="title" value="Term Sheet"></div><div class="form-field"><label class="required">Investment amount</label><input name="investmentAmount" type="number" required value="${escapeHTML(String(ask || ''))}"></div><div class="form-field"><label class="required">Equity %</label><input name="equityPercentage" type="number" required step="0.01" value="17.5"></div><div class="form-field"><label class="required">Valuation</label><input name="valuation" type="number" required value="85000000"></div><div class="form-field full"><label>Key terms</label><textarea name="keyTerms"></textarea></div><div class="form-field full"><label>Conditions</label><textarea name="conditions"></textarea></div><div class="form-field full"><label>Timeline</label><textarea name="timeline"></textarea></div><div class="form-field full"><label class="required">Term sheet PDF</label><input name="document" type="file" accept=".pdf,application/pdf" required></div></div></form>`,
      `${button('Cancel','close-modal')}${button('Create term sheet','submit-create-term-sheet','primary','plus',`data-deal-id="${escapeHTML(String(dealId||''))}"`)}`
    );
  }
  function __pv11ShowBoardReviewModal(dealId) {
    showModal(
      'Start board review',
      'Upload the investment memorandum to open IC voting.',
      `<form id="startBoardReviewForm"><div class="form-field"><label class="required">Investment memorandum</label><input name="document" type="file" required accept=".pdf,.doc,.docx"></div></form>`,
      `${button('Cancel','close-modal')}${button('Start review','submit-start-board-review','primary','users',`data-deal-id="${escapeHTML(String(dealId||''))}"`)}`
    );
  }
  function __pv11LiveLifecycleBar(deal) {
    if (!__pv11IsLive()) return '';
    const dealId = String(deal?.id || state.selectedDealId || '');
    const dd = state.dealDetail?.dueDiligence;
    const ddTasks = dd ? __pv11AsArray(dd.tasks || dd.workstreams || dd.activities) : [];
    const gate = dd ? __pv11CanCompleteDD(dd, ddTasks) : { ok: false, reason: 'Start due diligence first' };
    const ddDone = __pv11IsDDComplete(dd);
    const hasTs = Boolean(state.dealDetail?.termSheet || state.dealDetail?.termSheets?.length);
    const hasBoard = Boolean(state.dealDetail?.boardReview);
    const hasImpl = Boolean(state.dealDetail?.implementation || state.dealDetail?.investmentImplementation);
    const attrs = `data-deal-id="${escapeHTML(dealId)}" data-application-id="${escapeHTML(dealId)}"`;
    const parts = [
      button('Reload deal','reload-deal-detail','compact','refresh', attrs),
      button('Investee portal','open-investee-portal','compact','external-link', attrs),
    ];
    if (!dd) parts.unshift(button('Start due diligence','start-due-diligence','primary compact','plus', attrs));
    else if (!ddDone) {
      parts.unshift(button('Complete DD','complete-due-diligence','compact','check', `${attrs}${gate.ok ? '' : ` disabled title="${escapeHTML(gate.reason)}"`}`));
      parts.unshift(button('Fill assessment','open-dd-assessment','compact','edit', attrs));
    }
    if (ddDone && !hasTs) parts.unshift(button('Create term sheet','create-term-sheet','primary compact','plus', attrs));
    if (hasTs && !hasBoard) parts.unshift(button('Start board review','start-board-review','primary compact','users', attrs));
    if (hasBoard && !hasImpl) parts.unshift(button('Start implementation','start-implementation','primary compact','plus', attrs));
    return `<section class="section-gap card" style="padding:12px 16px"><div class="section-heading-with-action"><div><strong>Live deal actions</strong><p class="muted small" style="margin:0">API-backed controls for this application.</p></div><div class="row-actions">${parts.join('')}</div></div></section>`;
  }

  // Wrap deal tab renderers to surface live CTAs.
  if (typeof renderDealDiligence === 'function') {
    const __baseRenderDealDiligence = renderDealDiligence;
    renderDealDiligence = function(deal) {
      const d = deal || deals.find((x) => x.id === state.selectedDealId) || deals[0];
      if (__pv11IsLive() && state.dealDetail && !state.dealDetail.dueDiligence) {
        return `${__pv11LiveLifecycleBar(d)}<section class="section-gap">${card('Due diligence', `<div class="empty-state compact"><p class="muted">No due diligence record yet.</p><div class="section-gap">${button('Start due diligence','start-due-diligence','primary','plus',`data-deal-id="${escapeHTML(String(d?.id||''))}" data-application-id="${escapeHTML(String(d?.id||''))}"`)}</div></div>`)}</section>`;
      }
      return `${__pv11LiveLifecycleBar(d)}${__baseRenderDealDiligence(d)}`;
    };
  }
  if (typeof renderDealTermSheet === 'function') {
    const __baseRenderDealTermSheet = renderDealTermSheet;
    renderDealTermSheet = function(deal) {
      const d = deal || deals.find((x) => x.id === state.selectedDealId) || deals[0];
      return `${__pv11LiveLifecycleBar(d)}${__baseRenderDealTermSheet(d)}`;
    };
  }
  if (typeof renderDealIC === 'function') {
    const __baseRenderDealIC = renderDealIC;
    renderDealIC = function(deal) {
      const d = deal || deals.find((x) => x.id === state.selectedDealId) || deals[0];
      return `${__pv11LiveLifecycleBar(d)}${__baseRenderDealIC(d)}`;
    };
  }
  if (typeof renderDealDisbursement === 'function') {
    const __baseRenderDealDisbursement = renderDealDisbursement;
    renderDealDisbursement = function(deal) {
      const d = deal || deals.find((x) => x.id === state.selectedDealId) || deals[0];
      const bar = __pv11LiveLifecycleBar(d);
      if (__pv11IsLive() && state.dealDetail && !state.dealDetail.implementation && !state.dealDetail.investmentImplementation) {
        const dealId = String(d?.id || '');
        return `${bar}<section class="section-gap">${card('Disbursement', `<div class="empty-state"><div><div class="empty-state-icon">${icon('dollar')}</div><h3>No disbursement / implementation</h3><p class="muted">Initiate investment implementation after board approval.</p><div class="section-gap">${button('Initiate implementation','start-implementation','primary','plus',`data-deal-id="${escapeHTML(dealId)}" data-application-id="${escapeHTML(dealId)}"`)}</div></div></div>`)}</section>`;
      }
      return `${bar}${__baseRenderDealDisbursement(d)}`;
    };
  }
  if (typeof renderDealDetail === 'function') {
    const __baseRenderDealDetail = renderDealDetail;
    renderDealDetail = function() {
      const html = __baseRenderDealDetail();
      if (!__pv11IsLive()) return html;
      // Ensure investee / retry affordances exist even if extract omitted them.
      return html;
    };
  }

  // Intercept handleAction for lifecycle + id aliases that need form capture.
  if (typeof handleAction === 'function') {
    const __baseHandleAction = handleAction;
    handleAction = function(action, trigger, event) {
      const dealId = __pv11DealId(trigger);
      switch (action) {
        case 'retry-live-load':
          state.liveLoadError = null;
          window.dispatchEvent(new CustomEvent('pv11:retry-live-load'));
          return;
        case 'reload-deal-detail':
          if (dealId) window.dispatchEvent(new CustomEvent('matanho:load-deal-detail', { detail: { applicationId: dealId } }));
          return;
        case 'open-investee-portal':
        case 'open-applicant-portal': {
          const external = window.__INVESTEE_PORTAL_URL__ ? String(window.__INVESTEE_PORTAL_URL__).replace(/\/$/, '') : '';
          window.open(external ? `${external}/investee-portal-v8` : '/investee-portal-v8', '_blank', 'noopener,noreferrer');
          return;
        }
        case 'start-due-diligence':
          if (!dealId) { toast('Deal required', 'Open a deal first.', 'warning'); return; }
          if (!__pv11ShouldWireDeal(dealId)) break;
          __pv11EmitApi('api-initiate-due-diligence', { applicationId: dealId, dealId });
          return;
        case 'complete-due-diligence': {
          if (!dealId) { toast('Deal required', 'Open a deal first.', 'warning'); return; }
          if (!__pv11ShouldWireDeal(dealId)) break;
          const dd = state.dealDetail?.dueDiligence;
          const tasks = dd ? __pv11AsArray(dd.tasks || dd.workstreams || dd.activities) : [];
          const gate = __pv11CanCompleteDD(dd, tasks);
          if (!gate.ok) {
            toast('Cannot complete due diligence', gate.reason, 'warning');
            if (dd && (!dd.finalComments || !dd.recommendation || dd.overallScore == null)) __pv11ShowDdAssessmentModal();
            return;
          }
          __pv11EmitApi('api-complete-due-diligence', { applicationId: dealId, dealId });
          return;
        }
        case 'open-dd-assessment':
          __pv11ShowDdAssessmentModal();
          return;
        case 'view-dd-assessment': {
          const dd = state.dealDetail?.dueDiligence;
          if (!dd) { toast('No assessment', 'Start due diligence first.', 'warning'); return; }
          showDrawer('Investment assessment', `Score ${dd.overallScore != null ? dd.overallScore : __pv11DdScore(dd)+'/6'}`, `<div class="info-list"><div class="info-row"><span>Recommendation</span><strong>${escapeHTML(String(dd.recommendation||'—'))}</strong></div><div class="info-row"><span>Comments</span><strong>${escapeHTML(String(dd.finalComments||'—'))}</strong></div></div>`, button('Close','close-drawer'));
          return;
        }
        case 'submit-dd-assessment': {
          const form = document.getElementById('ddAssessmentForm');
          if (!form?.reportValidity()) return;
          const fd = new FormData(form);
          const asBool = (name) => fd.get(name) === '1' || fd.get(name) === 'on' || fd.get(name) === 'true';
          __pv11EmitApi('api-update-due-diligence', {
            applicationId: dealId,
            dealId,
            marketResearchViable: String(asBool('marketResearchViable')),
            marketResearchComments: String(fd.get('marketResearchComments') || ''),
            financialViable: String(asBool('financialViable')),
            financialComments: String(fd.get('financialComments') || ''),
            competitiveOpportunities: String(asBool('competitiveOpportunities')),
            competitiveComments: String(fd.get('competitiveComments') || ''),
            managementTeamQualified: String(asBool('managementTeamQualified')),
            managementComments: String(fd.get('managementComments') || ''),
            legalCompliant: String(asBool('legalCompliant')),
            legalComments: String(fd.get('legalComments') || ''),
            riskTolerable: String(asBool('riskTolerable')),
            riskComments: String(fd.get('riskComments') || ''),
            recommendation: String(fd.get('recommendation') || 'APPROVE'),
            finalComments: String(fd.get('finalComments') || ''),
          });
          return;
        }
        case 'create-term-sheet':
          __pv11ShowCreateTermSheetModal(dealId);
          return;
        case 'submit-create-term-sheet': {
          const form = document.getElementById('createTermSheetForm');
          if (!form?.reportValidity()) return;
          const file = form.querySelector('input[type="file"][name="document"]')?.files?.[0];
          if (!file) { toast('Document required', 'Upload the term sheet PDF.', 'warning'); return; }
          const d = Object.fromEntries(new FormData(form));
          __pv11EmitApi('api-create-term-sheet', {
            applicationId: dealId,
            dealId,
            title: String(d.title || ''),
            investmentAmount: String(d.investmentAmount || ''),
            equityPercentage: String(d.equityPercentage || ''),
            valuation: String(d.valuation || ''),
            keyTerms: String(d.keyTerms || ''),
            conditions: String(d.conditions || ''),
            timeline: String(d.timeline || ''),
          }, { document: file });
          return;
        }
        case 'start-board-review':
          __pv11ShowBoardReviewModal(dealId);
          return;
        case 'submit-start-board-review': {
          const form = document.getElementById('startBoardReviewForm');
          if (!form?.reportValidity()) return;
          const file = form.querySelector('input[type="file"][name="document"]')?.files?.[0];
          if (!file) { toast('Document required', 'Upload the investment memorandum.', 'warning'); return; }
          __pv11EmitApi('api-create-board-review', { applicationId: dealId, dealId }, { document: file });
          return;
        }
        case 'start-implementation': {
          if (!dealId) { toast('Deal required', 'Open a deal first.', 'warning'); return; }
          const fundId = String(state.dealDetail?.application?.fundId || state.dealDetail?.fundId || funds[0]?.id || '');
          const portfolioCompanyId = String(state.dealDetail?.portfolioCompanyId || state.dealDetail?.portfolioCompany?.id || '');
          __pv11EmitApi('api-initiate-implementation', {
            applicationId: dealId,
            dealId,
            fundId,
            portfolioCompanyId,
            amount: String(state.dealDetail?.application?.requestedAmount || deals.find((d)=>String(d.id)===dealId)?.amount || ''),
          });
          return;
        }
        case 'preview-deal-document':
        case 'download-deal-document':
        case 'open-deal-document-external': {
          const url = trigger?.dataset?.url;
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
          else toast('No document URL', 'This document has no downloadable link.', 'warning');
          return;
        }
        case 'confirm-shortlist':
          if (!dealId) { toast('Deal required', 'Open a deal first.', 'warning'); return; }
          if (!__pv11ShouldWireDeal(dealId)) break;
          __pv11EmitApi('api-trigger-shortlisting', { applicationId: dealId, dealId });
          return;
        case 'rerun-screening':
        case 'human-review':
          if (!dealId) { toast('Deal required', 'Open a deal first.', 'warning'); return; }
          if (!__pv11ShouldWireDeal(dealId)) break;
          __pv11EmitApi('api-analyst-screening', {
            applicationId: dealId,
            dealId,
            score: String(trigger?.dataset?.score || deals.find((d)=>String(d.id)===dealId)?.score || 75),
          });
          return;
        case 'screen-reject':
          if (!dealId) { toast('Deal required', 'Open a deal first.', 'warning'); return; }
          if (!__pv11ShouldWireDeal(dealId)) break;
          __pv11EmitApi('api-analyst-screening', {
            applicationId: dealId,
            dealId,
            score: String(trigger?.dataset?.score || 40),
            reject: 'true',
          });
          return;
        case 'vote-approve':
        case 'vote-conditions':
        case 'vote-reject':
        case 'vote-defer': {
          if (!__pv11ShouldWireDeal(dealId)) break;
          const voteMap = {
            'vote-approve': 'APPROVE',
            'vote-conditions': 'APPROVE',
            'vote-reject': 'REJECT',
            'vote-defer': 'APPROVE',
          };
          __pv11EmitApi('api-cast-ic-vote', {
            applicationId: dealId,
            dealId,
            vote: voteMap[action] || 'APPROVE',
            comment: action.replace('vote-', ''),
          });
          return;
        }
        case 'final-vote': {
          if (!__pv11ShouldWireDeal(dealId)) break;
          const raw = String(trigger?.dataset?.vote || 'Approve');
          __pv11EmitApi('api-cast-ic-vote', {
            applicationId: dealId,
            dealId,
            vote: /reject/i.test(raw) ? 'REJECT' : 'APPROVE',
            comment: raw,
          });
          return;
        }
        case 'send-capital-call-notices':
        case 'send-notices': {
          const call = capitalCalls.find((c) => c.id === (trigger?.dataset?.id || state.selectedCapitalCallId)) || capitalCalls[0];
          if (!call) { toast('No capital call', 'Select a capital call first.', 'warning'); return; }
          const fund = funds.find((f) => f.name === call.fund || f.id === call.fundId) || funds[0];
          __pv11EmitApi('send-capital-call-notices', {
            fundId: String(call.fundId || fund?.id || ''),
            id: String(call.id),
            capitalCallId: String(call.id),
          });
          return;
        }
        case 'export-deals': {
          const rows = typeof filteredDeals === 'function' ? filteredDeals() : deals;
          exportCSV('deal-register.csv', [
            ['ID','Deal','Stage','Sector','Round','Ask','Owner','Age','Score','Priority','Fund'],
            ...rows.map((d) => [d.id, d.name, d.stage, d.sector, d.round, d.amount, d.owner, d.age, d.score, d.priority, d.fund]),
          ]);
          return;
        }
        case 'wizard-back':
        case 'wizard-next':
        case 'wizard-step':
        case 'toggle-deal-column':
          // UI chrome — fall through to base if present, else no-op.
          break;
        default:
          break;
      }
      return __baseHandleAction(action, trigger, event);
    };
  }

  // Live-aware capital call / LP submits (form → api emit).
  if (typeof submitCapitalCall === 'function') {
    const __baseSubmitCapitalCall = submitCapitalCall;
    submitCapitalCall = function() {
      const form = $('#capitalCallForm');
      if (!form?.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form));
      const fundKey = String(data.fund || data.fundId || '');
      const fund = funds.find((f) => f.id === fundKey || f.name === fundKey) || funds[0];
      if (__pv11IsLive() && fund?.id) {
        const commitment = Number(fund.commitment || fund.totalAmount || data.amount || 0) || 1;
        const amount = Number(data.amount || 0);
        const callPercent = amount && commitment ? Math.max(0.1, Math.round((amount / commitment) * 1000) / 10) : Number(data.callPercent || 10);
        __pv11EmitApi('api-create-capital-call', {
          fundId: String(fund.id),
          callPercent: String(callPercent),
          paymentDueDate: String(data.dueDate || data.paymentDueDate || ''),
          transactionDate: String(data.callDate || data.transactionDate || ''),
          bankInstructions: String(data.notes || data.bankInstructions || 'Remit per LPA collection account.'),
        });
        return;
      }
      return __baseSubmitCapitalCall();
    };
  }
  if (typeof submitLP === 'function') {
    const __baseSubmitLP = submitLP;
    submitLP = function() {
      const form = $('#lpForm');
      if (!form?.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form));
      if (__pv11IsLive()) {
        __pv11EmitApi('api-add-lp', {
          name: String(data.name || ''),
          email: String(data.email || `lp.${Date.now()}@example.com`),
          type: String(data.type || 'entity'),
          country: String(data.geography || data.country || 'ZW'),
          amount: String(data.commitment || ''),
          fundId: String(funds[0]?.id || ''),
        });
        closeOverlays();
        return;
      }
      return __baseSubmitLP();
    };
  }

  // Mark live after hydrate when host paints API data.
  if (typeof hydrateFromBackend === 'function') {
    const __baseHydrate = hydrateFromBackend;
    hydrateFromBackend = function(payload) {
      state.liveData = true;
      const result = __baseHydrate(payload);
      try { rootEl.classList.remove('is-hydrating', 'is-host-error'); } catch (_) {}
      return result;
    };
  }

  // Defensive recipients for e-signatures (T2.1).
  if (typeof renderESignatures === 'function' || Array.isArray(signatureEnvelopes)) {
    const harden = () => {
      signatureEnvelopes.forEach((e) => {
        if (!Array.isArray(e.recipients)) e.recipients = [];
      });
    };
    harden();
    const __baseRender = render;
    render = function() {
      try { harden(); } catch (_) {}
      return __baseRender.apply(this, arguments);
    };
  }
/* END_PORTFOLIO_LIVE_BRIDGE */
