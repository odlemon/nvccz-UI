/* Auto-extracted Matanho Investor KYC — adapted for Next.js */
export function startFundraisingKycRuntime(rootEl, options = {}) {
  window.__FR_KYC_NAV__ = options.onNavigate || (() => {});
  window.MATANHO_CONFIG = window.MATANHO_CONFIG || {
    apiBaseUrl: '',
    useMockApi: true,
    livenessProvider: 'mock',
    supportEmail: 'onboarding@example.co.zw',
    supportPhone: '+263 00 000 0000',
    maxUploadMb: 15,
    sessionIdleMinutes: 20,
  };

  rootEl.innerHTML = options.shellHtml || '<div id="app"></div>';

  const __frAbort = new AbortController();
  const __frSig = { signal: __frAbort.signal };
  let apiHandle = { setStep() {}, destroy() {} };

function createDefaultApplication() {
  return {
    applicationId: '',
    reference: '',
    applicantType: '',
    relationshipType: '',
    product: '',
    identity: {
      legalName: '',
      tradingName: '',
      entityType: '',
      registrationNumber: '',
      regulator: '',
      licenceNumber: '',
      zimraNumber: '',
      country: 'Zimbabwe',
      province: 'Harare Metropolitan',
      city: 'Harare',
      physicalAddress: '',
      contactName: '',
      contactRole: '',
      email: '',
      mobile: '+263 ',
      nationalId: '',
      passportNumber: '',
      dateOfBirth: '',
      taxResidence: 'Zimbabwe',
    },
    liveness: {
      subjectName: '',
      subjectRole: '',
      consent: false,
      status: 'not_started',
      providerSessionId: '',
      score: null,
      selfieDataUrl: '',
    },
    ownership: {
      noReportableOwners: false,
      controlExplanation: '',
      persons: [],
    },
    investment: {
      amount: '',
      currency: 'USD',
      investmentPurpose: '',
      sourceOfWealth: '',
      sourceOfFunds: '',
      bankName: '',
      accountHolder: '',
      bankCountry: 'Zimbabwe',
      expectedTransactions: '',
    },
    compliance: {
      pep: '',
      sanctions: '',
      criminalOrRegulatory: '',
      adverseMedia: '',
      taxCompliant: '',
      usPerson: '',
      crsTaxResidencies: 'Zimbabwe',
      explanation: '',
    },
    documents: [],
    declarations: {
      informationAccurate: false,
      verificationConsent: false,
      electronicCommunicationConsent: false,
      privacyNoticeAccepted: false,
      signerName: '',
      signerCapacity: '',
      signedAt: '',
    },
  };
}

function createPreviewApplication() {
  const application = createDefaultApplication();
  application.applicantType = 'institutional_lp';
  application.relationshipType = 'limited_partner';
  application.product = 'Matanho Growth Fund I';
  Object.assign(application.identity, {
    legalName: 'BancABC Pension Fund',
    entityType: 'Pension fund',
    registrationNumber: 'PF-2014-1087',
    regulator: 'Insurance and Pensions Commission',
    contactName: 'Rudo Muchengeti',
    contactRole: 'Chairperson, Board of Trustees',
    email: 'rudo@example.co.zw',
    mobile: '+263771234567',
    physicalAddress: 'Borrowdale Office Park, Harare',
  });
  Object.assign(application.liveness, {
    subjectName: 'Rudo Muchengeti',
    subjectRole: 'Authorised representative',
    consent: true,
  });
  return application;
}

const onboardingSteps = [
  { title: 'Applicant profile', short: 'Applicant profile', description: 'Relationship and product' },
  { title: 'Identity and contact', short: 'Identity and contact', description: 'Zimbabwe KYC details' },
  { title: 'Selfie and liveness', short: 'Selfie and liveness', description: 'Authorised person check' },
  { title: 'Ownership and control', short: 'Ownership and control', description: 'UBOs and controllers' },
  { title: 'Investment and funds', short: 'Investment and funds', description: 'Purpose and origin' },
  { title: 'Compliance declarations', short: 'Compliance declarations', description: 'PEP, sanctions and tax' },
  { title: 'Documents and signature', short: 'Documents and signature', description: 'Paperless evidence' },
  { title: 'Review and submit', short: 'Review and submit', description: 'Final certification' },
];

const stepDescriptions = [
  'Tell us who is applying and which fund, mandate or investment relationship this application supports.',
  'Provide the legal identity, regulatory, tax, contact and Zimbabwe address information required for verification.',
  'Confirm the identity and presence of the individual applicant or authorised person completing an entity application.',
  'Identify the natural persons who ultimately own or control the applicant and explain any layered structure.',
  'Describe the investment purpose, expected amount, source of wealth and immediate source of the remitting funds.',
  'Complete the risk, PEP, sanctions, adverse-media and tax declarations used for the compliance assessment.',
  'Upload supporting evidence, accept the privacy and verification notices, and sign the application electronically.',
  'Review the complete application before sending it to the compliance team for risk-based due diligence.',
];

const provinces = [
  'Harare Metropolitan',
  'Bulawayo Metropolitan',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
];


function validateZimbabweMobile(value) {
  return /^\+2637\d{8}$/.test(String(value || '').replace(/\s/g, ''));
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function calculateIndicativeRisk(data) {
  let score = 12;
  if (['trust', 'partnership', 'other'].includes(data.applicantType)) score += 12;
  if (data.applicantType === 'institutional_lp') score += 4;
  if (data.identity.country !== 'Zimbabwe') score += 8;
  if (data.investment.bankCountry !== 'Zimbabwe') score += 7;
  const riskAnswers = [
    data.compliance.pep,
    data.compliance.sanctions,
    data.compliance.criminalOrRegulatory,
    data.compliance.adverseMedia,
  ];
  score += riskAnswers.filter((answer) => answer === 'yes').length * 18;
  if (data.compliance.usPerson === 'yes') score += 5;
  if (data.ownership.persons.length > 4) score += 6;
  score = Math.min(score, 100);
  return { score, band: score >= 60 || data.compliance.sanctions === 'yes' ? 'High' : score >= 35 ? 'Medium' : 'Low' };
}

function validateStep(step, data) {
  if (step === 0 && (!data.applicantType || !data.relationshipType || !data.product)) {
    return 'Select the applicant type, relationship and fund or product.';
  }

  if (step === 1) {
    if (!data.identity.legalName || !data.identity.contactName || !data.identity.contactRole) {
      return 'Complete the legal name and authorised contact details.';
    }
    if (!validateEmail(data.identity.email)) return 'Enter a valid email address.';
    if (!validateZimbabweMobile(data.identity.mobile)) return 'Use a Zimbabwe mobile number in +263 7XXXXXXXX format.';
    if (data.applicantType === 'individual' && !data.identity.nationalId && !data.identity.passportNumber) {
      return 'Provide a Zimbabwe national ID or passport number.';
    }
    if (data.applicantType !== 'individual' && !data.identity.registrationNumber) {
      return 'Provide the entity registration, licence or establishing instrument number.';
    }
  }

  if (step === 2) {
    if (!data.liveness.consent) return 'Give biometric consent before completing the liveness check.';
    if (!['captured', 'assisted_review'].includes(data.liveness.status)) {
      return 'Complete the selfie and liveness check or request assisted verification.';
    }
  }

  if (step === 3 && data.applicantType !== 'individual') {
    if (!data.ownership.noReportableOwners && data.ownership.persons.length === 0) {
      return 'Add at least one beneficial owner or controlling person.';
    }
    if (data.ownership.noReportableOwners && !data.ownership.controlExplanation.trim()) {
      return 'Explain the ownership and senior controlling-person structure.';
    }
  }

  if (step === 4) {
    const amount = Number(data.investment.amount);
    if (!Number.isFinite(amount) || amount <= 0) return 'Enter the expected investment or mandate amount.';
    if (!data.investment.sourceOfWealth.trim() || !data.investment.sourceOfFunds.trim()) {
      return 'Explain both source of wealth and source of funds.';
    }
    if (!data.investment.bankName.trim() || !data.investment.accountHolder.trim()) {
      return 'Provide the remitting bank or custodian and account holder.';
    }
  }

  if (step === 5) {
    const answers = [
      data.compliance.pep,
      data.compliance.sanctions,
      data.compliance.criminalOrRegulatory,
      data.compliance.adverseMedia,
      data.compliance.taxCompliant,
      data.compliance.usPerson,
    ];
    if (answers.some((answer) => !answer)) return 'Complete every compliance declaration.';
    const riskyYes = [data.compliance.pep, data.compliance.sanctions, data.compliance.criminalOrRegulatory, data.compliance.adverseMedia].some((answer) => answer === 'yes');
    if (riskyYes && !data.compliance.explanation.trim()) return 'Explain every material declaration answered Yes.';
  }

  if (step === 6) {
    if (!data.documents.some((document) => document.status === 'uploaded')) return 'Upload at least one required identity or entity document.';
    const declaration = data.declarations;
    if (!declaration.informationAccurate || !declaration.verificationConsent || !declaration.electronicCommunicationConsent || !declaration.privacyNoticeAccepted) {
      return 'Accept all declarations and the privacy notice.';
    }
    if (!declaration.signerName.trim() || !declaration.signerCapacity.trim()) {
      return 'Complete the electronic signature and signing capacity.';
    }
  }

  return '';
}


const STORAGE_KEY = 'matanho-onboarding-draft-v1';

function storageAvailable() {
  try {
    const key = '__matanho_storage_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function saveLocalDraft(data) {
  if (!storageAvailable()) return false;
  const safeDraft = structuredClone(data);
  safeDraft.liveness.selfieDataUrl = '';
  safeDraft.documents = safeDraft.documents.map((document) => ({
    ...document,
    status: document.status === 'uploaded' ? 'uploaded' : 'selected',
  }));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeDraft));
  return true;
}

function loadLocalDraft() {
  if (!storageAvailable()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearLocalDraft() {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}


const apiModuleConfig = window.MATANHO_CONFIG || {};
const apiBaseUrl = String(apiModuleConfig.apiBaseUrl || '').replace(/\/$/, '');
const useMockApi = apiModuleConfig.useMockApi !== false;

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Application': 'matanho-onboard-web',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let detail = '';
    try {
      const problem = await response.json();
      detail = problem.detail || problem.title || '';
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || `Request failed with status ${response.status}.`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function mockApplication(status = 'draft', existingId = '') {
  const applicationId = existingId || crypto.randomUUID();
  return {
    applicationId,
    reference: `ZW-KYC-${new Date().getFullYear()}-${applicationId.slice(0, 6).toUpperCase()}`,
    status,
    updatedAt: new Date().toISOString(),
    version: 1,
  };
}

const api = {
  async createDraft(data) {
    if (useMockApi) return mockApplication('draft');
    return request('/api/v1/onboarding/applications', { method: 'POST', body: JSON.stringify(data) });
  },

  async saveDraft(applicationId, data) {
    if (useMockApi) return { ...mockApplication('draft', applicationId), reference: data.reference || mockApplication().reference };
    return request(`/api/v1/onboarding/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify(data),
    });
  },

  async createLivenessSession(applicationId) {
    if (useMockApi) return { sessionId: `live_${crypto.randomUUID()}` };
    return request(`/api/v1/onboarding/applications/${applicationId}/liveness/session`, { method: 'POST', body: '{}' });
  },

  async completeLivenessSession(applicationId, payload) {
    if (useMockApi) return { status: 'passed', score: 96 };
    return request(`/api/v1/onboarding/applications/${applicationId}/liveness/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async requestDocumentUpload(applicationId, metadata) {
    if (useMockApi) return { documentId: `doc_${crypto.randomUUID()}`, uploadUrl: 'mock://upload' };
    return request(`/api/v1/onboarding/applications/${applicationId}/documents/presign`, {
      method: 'POST',
      body: JSON.stringify(metadata),
    });
  },

  async uploadDocument(upload, file) {
    if (useMockApi || String(upload.uploadUrl).startsWith('mock://')) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      return;
    }
    const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: upload.headers || {}, body: file });
    if (!response.ok) throw new Error('Document upload failed.');
  },

  async registerDocument(applicationId, documentId) {
    if (useMockApi) return;
    await request(`/api/v1/onboarding/applications/${applicationId}/documents`, {
      method: 'POST',
      body: JSON.stringify({ documentId }),
    });
  },

  async submit(applicationId) {
    if (useMockApi) return mockApplication('submitted', applicationId);
    return request(`/api/v1/onboarding/applications/${applicationId}/submit`, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: '{}',
    });
  },
};






// Tailwind build safelist for classes selected dynamically by JavaScript.
const TAILWIND_SAFELIST = 'status-neutral status-success status-warning status-danger choice-card-active bg-white/12 bg-white/10 bg-white/5 bg-matanho-500 bg-white/15 text-white/38 text-white/50 text-white/55 text-white/65 text-white/85 border-white/10 border-white/15 border-white/25 border-matanho-500/60 bg-matanho-500/25 opacity-40 opacity-60 cursor-wait cursor-not-allowed';
void TAILWIND_SAFELIST;

const config = window.MATANHO_CONFIG || {};
const maxUploadMb = Number(config.maxUploadMb || 15);
const supportEmail = config.supportEmail || 'onboarding@example.co.zw';
const supportPhone = config.supportPhone || '+263 00 000 0000';
const appRoot = rootEl.querySelector('#app') || rootEl;

const preview = options.preview || new URLSearchParams(window.location.search).get('preview');
let application = preview ? createPreviewApplication() : loadLocalDraft() || createDefaultApplication();
let currentStep = typeof options.initialStep === 'number' ? options.initialStep : (preview === 'liveness' ? 2 : preview === 'review' ? 7 : 0);
let busy = false;
let receipt = null;
let autosaveTimer = null;
let toastTimer = null;
let cameraStream = null;
let livenessRunning = false;
let sidebarCollapsed = false;
try {
  sidebarCollapsed = localStorage.getItem('fr-kyc-sidebar') === '1';
} catch (_) {}

const applicantTypes = [
  ['individual', 'ID', 'Individual', 'Natural person, wealth or advisory client.'],
  ['company', 'CO', 'Company', 'Operating company, holding company or investment vehicle.'],
  ['institutional_lp', 'LP', 'Institutional LP', 'Pension fund, insurer, asset manager or regulated fund.'],
  ['trust', 'TR', 'Trust', 'Trustees, founder, protector and beneficiaries.'],
  ['partnership', 'PT', 'Partnership', 'General or limited partnership.'],
  ['other', 'OT', 'Other arrangement', 'Foundation, association or another legal arrangement.'],
];

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getPath(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object);
}

function setPath(object, path, value) {
  const keys = path.split('.');
  let target = object;
  keys.slice(0, -1).forEach((key) => {
    target = target[key];
  });
  target[keys.at(-1)] = value;
}

function statusPill(label, tone = 'neutral') {
  return `<span class="status-pill status-${tone}">${escapeHtml(label)}</span>`;
}

function callout(title, body, tone = 'info') {
  return `<div class="callout callout-${tone}"><strong class="block text-sm">${escapeHtml(title)}</strong><div class="mt-1 opacity-80">${body}</div></div>`;
}

function field(label, path, options = {}) {
  const value = getPath(application, path) ?? '';
  const required = options.required ? '<span class="text-red-600">*</span>' : '';
  const hint = options.hint ? `<span class="mt-1.5 block text-xs leading-5 text-ink-500">${options.hint}</span>` : '';
  const className = options.className || '';
  const attrs = `${options.type ? `type="${options.type}"` : 'type="text"'} ${options.placeholder ? `placeholder="${escapeHtml(options.placeholder)}"` : ''} ${options.min !== undefined ? `min="${options.min}"` : ''} ${options.max !== undefined ? `max="${options.max}"` : ''}`;
  return `<label class="block ${className}"><span class="field-label">${escapeHtml(label)} ${required}</span><input class="field-input" data-path="${path}" value="${escapeHtml(value)}" ${attrs}>${hint}</label>`;
}

function dateField(label, path, required = false, className = '') {
  const value = getPath(application, path) ?? '';
  return `<label class="block ${className}"><span class="field-label">${escapeHtml(label)} ${required ? '<span class="text-red-600">*</span>' : ''}</span><div class="rounded-xl border border-ink-100 bg-white px-3.5 py-3 focus-within:border-matanho-500 focus-within:ring-4 focus-within:ring-matanho-100"><input type="date" data-path="${path}" value="${escapeHtml(value)}" class="block w-full min-w-0 border-0 bg-transparent p-0 text-sm text-ink-950 outline-none"></div></label>`;
}

function selectField(label, path, options, settings = {}) {
  const value = getPath(application, path) ?? '';
  const required = settings.required ? '<span class="text-red-600">*</span>' : '';
  const hint = settings.hint ? `<span class="mt-1.5 block text-xs leading-5 text-ink-500">${settings.hint}</span>` : '';
  const optionHtml = options.map((option) => {
    const item = Array.isArray(option) ? option : [option, option];
    return `<option value="${escapeHtml(item[0])}" ${String(value) === String(item[0]) ? 'selected' : ''}>${escapeHtml(item[1])}</option>`;
  }).join('');
  return `<label class="block ${settings.className || ''}"><span class="field-label">${escapeHtml(label)} ${required}</span><select class="field-input" data-path="${path}" ${settings.rerender ? 'data-rerender="true"' : ''}>${optionHtml}</select>${hint}</label>`;
}

function textareaField(label, path, options = {}) {
  const value = getPath(application, path) ?? '';
  return `<label class="block ${options.className || ''}"><span class="field-label">${escapeHtml(label)} ${options.required ? '<span class="text-red-600">*</span>' : ''}</span><textarea class="field-input min-h-28 resize-y" data-path="${path}" placeholder="${escapeHtml(options.placeholder || '')}">${escapeHtml(value)}</textarea>${options.hint ? `<span class="mt-1.5 block text-xs leading-5 text-ink-500">${options.hint}</span>` : ''}</label>`;
}

function checkRow(id, path, title, description) {
  const checked = Boolean(getPath(application, path));
  return `<label for="${id}" class="flex cursor-pointer gap-3 rounded-xl border border-ink-100 bg-white p-4 transition hover:bg-ink-50"><input id="${id}" type="checkbox" data-path="${path}" ${checked ? 'checked' : ''} class="mt-0.5 h-4 w-4 rounded border-ink-300 text-matanho-700 focus:ring-matanho-500"><span><strong class="block text-sm font-semibold text-ink-950">${escapeHtml(title)}</strong><span class="mt-1 block text-xs leading-5 text-ink-500">${escapeHtml(description)}</span></span></label>`;
}

function scheduleAutosave() {
  window.clearTimeout(autosaveTimer);
  setAutosaveStatus('saving');
  autosaveTimer = window.setTimeout(async () => {
    try {
      saveLocalDraft(application);
      if (application.applicationId) await api.saveDraft(application.applicationId, application);
      setAutosaveStatus('saved');
    } catch {
      setAutosaveStatus('error');
    }
  }, 1200);
}

function setAutosaveStatus(status) {
  const indicator = document.querySelector('#autosave-indicator');
  const text = document.querySelector('#autosave-text');
  if (!indicator || !text) return;
  indicator.className = `h-2 w-2 rounded-full ${status === 'error' ? 'bg-red-500' : status === 'saving' ? 'bg-amber-500' : 'bg-matanho-500'}`;
  text.textContent = status === 'error' ? 'Autosave needs attention' : status === 'saving' ? 'Saving changes...' : 'Changes saved';
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.add('hidden'), 4500);
}

function setBusy(value) {
  busy = value;
  document.querySelectorAll('[data-disable-when-busy]').forEach((button) => {
    button.disabled = value;
  });
  const nextButton = document.querySelector('#next-button');
  if (nextButton) nextButton.textContent = value ? 'Please wait...' : currentStep === onboardingSteps.length - 1 ? 'Submit application' : 'Continue';
}

async function ensureApplication() {
  if (application.applicationId) return application.applicationId;
  const response = await api.createDraft(application);
  application.applicationId = response.applicationId;
  application.reference = response.reference;
  saveLocalDraft(application);
  const reference = document.querySelector('#application-reference');
  if (reference) reference.textContent = application.reference;
  return response.applicationId;
}

function renderProgressRail() {
  return onboardingSteps.map((step, index) => {
    const active = index === currentStep;
    const complete = index < currentStep;
    const buttonClass = active
      ? 'bg-white/12 text-white'
      : complete
        ? 'text-white/85 hover:bg-white/5'
        : 'cursor-default text-white/38';
    const numberClass = active
      ? 'border-white/25 bg-white text-matanho-900'
      : complete
        ? 'border-matanho-500/60 bg-matanho-500/25 text-white'
        : 'border-white/15';
    return `<button type="button" data-action="jump-step" data-step="${index}" ${index > currentStep ? 'disabled' : ''} class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${buttonClass}"><span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs font-bold ${numberClass}">${complete ? '✓' : index + 1}</span><span class="min-w-0"><strong class="block truncate text-xs font-semibold">${escapeHtml(step.short)}</strong><span class="mt-0.5 block truncate text-[11px] text-white/50">${escapeHtml(step.description)}</span></span></button>`;
  }).join('');
}

function renderMobileProgress() {
  return `<div class="lg:hidden"><div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">Application progress</p><p class="mt-1 text-sm font-semibold text-white">${currentStep + 1} of ${onboardingSteps.length}: ${escapeHtml(onboardingSteps[currentStep].short)}</p></div><span class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">${Math.round(((currentStep + 1) / onboardingSteps.length) * 100)}%</span></div><div class="mt-4 flex gap-1.5">${onboardingSteps.map((step, index) => `<button type="button" data-action="jump-step" data-step="${index}" aria-label="Go to ${escapeHtml(step.title)}" ${index > currentStep ? 'disabled' : ''} class="h-1.5 flex-1 rounded-full ${index <= currentStep ? 'bg-matanho-500' : 'bg-white/15'}"></button>`).join('')}</div></div>`;
}

function renderReceipt() {
  return `<main class="min-h-screen bg-ink-50 px-4 py-10 sm:px-6 sm:py-16"><div class="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft"><div class="bg-gradient-to-br from-matanho-950 via-matanho-900 to-ink-950 px-6 py-8 text-white sm:px-10 sm:py-10"><div class="inline-flex rounded-2xl bg-white p-3"><img src="/fundraising-kyc/assets/matanho-logo.png" alt="Matanho Investment Management ERP" class="h-9 w-auto"></div><div class="mt-10 grid h-14 w-14 place-items-center rounded-2xl bg-matanho-500 text-2xl">✓</div><h1 class="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">Application submitted</h1><p class="mt-2 max-w-xl text-sm leading-6 text-white/65">Your paperless application has been sent to the compliance team. No payment should be made until verified instructions are issued.</p></div><div class="space-y-5 px-6 py-8 sm:px-10"><div class="grid gap-3 sm:grid-cols-2"><div class="rounded-2xl border border-ink-100 bg-ink-50 p-4"><span class="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">Application reference</span><strong class="mt-2 block text-base text-ink-950">${escapeHtml(receipt.reference)}</strong></div><div class="rounded-2xl border border-ink-100 bg-ink-50 p-4"><span class="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">Submitted</span><strong class="mt-2 block text-base text-ink-950">${escapeHtml(new Date(receipt.submittedAt).toLocaleString())}</strong></div></div>${callout('What happens next', 'The applicant will receive secure requests if additional evidence or enhanced due diligence is required. Keep the reference above for support enquiries.', 'success')}<button type="button" data-action="restart" class="button-primary">Start another application</button></div></div></main>`;
}

function renderApplicationShell() {
  const applicationReference = application.reference || 'New paperless application';
  return `<div class="kyc-app-shell min-h-screen bg-ink-50 lg:grid lg:grid-cols-[300px_minmax(0,1fr)]"><aside class="kyc-sidebar sidebar-glow relative overflow-hidden bg-gradient-to-b from-matanho-950 via-matanho-900 to-ink-950 px-4 py-5 text-white lg:sticky lg:top-0 lg:h-screen lg:px-5 lg:py-7"><div class="kyc-sidebar-inner relative z-10 mx-auto max-w-6xl lg:flex lg:h-full lg:min-h-0 lg:flex-col"><div class="flex items-center justify-between gap-4 lg:block"><div class="inline-flex rounded-2xl bg-white px-3 py-2 shadow-card"><img src="/fundraising-kyc/assets/matanho-logo.png" alt="Matanho Investment Management ERP" class="h-8 w-auto sm:h-9"></div><div class="kyc-sidebar-copy text-right lg:mt-5 lg:text-left"><p class="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Secure onboarding</p><p class="mt-1 text-xs text-white/65">Client and limited partner application</p></div></div><div class="kyc-sidebar-meta mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur lg:mt-7"><div class="flex items-center justify-between gap-3"><div><p class="text-xs text-white/50">Application</p><p id="application-reference" class="mt-1 text-xs font-semibold text-white">${escapeHtml(applicationReference)}</p></div>${statusPill('Encrypted', 'success')}</div><p class="mt-3 text-xs leading-5 text-white/55">Your progress is saved automatically. Biometric images and file contents are not stored in browser draft storage.</p></div><div class="kyc-sidebar-scroll mt-5 lg:mt-7 lg:min-h-0 lg:flex-1 lg:pr-1">${renderMobileProgress()}<div class="kyc-step-rail hidden space-y-1 lg:block">${renderProgressRail()}</div></div><div class="kyc-sidebar-help mt-5 hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-white/55 lg:block">Need help?<br><a class="font-semibold text-white" href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a><br><a class="font-semibold text-white" href="tel:${escapeHtml(supportPhone.replace(/\s/g, ''))}">${escapeHtml(supportPhone)}</a></div><button type="button" data-action="toggle-sidebar" class="kyc-sidebar-toggle mt-4 hidden w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 lg:flex" aria-label="${sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}"><span aria-hidden="true">${sidebarCollapsed ? '›' : '‹'}</span><span class="kyc-sidebar-toggle-label">${sidebarCollapsed ? 'Expand steps' : 'Collapse steps'}</span></button></div></aside><main class="kyc-main min-w-0 px-4 py-5 sm:px-6 sm:py-8 xl:px-10 xl:py-10"><div class="mx-auto max-w-6xl"><div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-xs font-semibold uppercase tracking-[0.16em] text-matanho-700">Zimbabwe paperless KYC and AML</p><h1 class="mt-1 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">Investor onboarding application</h1></div><div class="flex items-center gap-2 text-xs text-ink-500"><span id="autosave-indicator" class="h-2 w-2 rounded-full bg-matanho-500"></span><span id="autosave-text">Changes saved</span></div></div><section class="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft"><div class="flex flex-col gap-3 border-b border-ink-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7"><div><h2 class="text-lg font-semibold tracking-tight text-ink-950 sm:text-xl">${escapeHtml(onboardingSteps[currentStep].title)}</h2><p class="mt-1 max-w-2xl text-sm leading-6 text-ink-500">${escapeHtml(stepDescriptions[currentStep])}</p></div>${statusPill(`Step ${currentStep + 1} of ${onboardingSteps.length}`, 'success')}</div><div id="step-content" class="px-5 py-6 sm:px-7 sm:py-7">${renderStep()}</div><div class="flex flex-col-reverse gap-3 border-t border-ink-100 bg-ink-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"><button type="button" data-action="back" data-disable-when-busy ${currentStep === 0 ? 'disabled' : ''} class="button-secondary">Back</button><div class="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" data-action="save" data-disable-when-busy class="button-secondary">Save and exit later</button><button id="next-button" type="button" data-action="${currentStep === onboardingSteps.length - 1 ? 'submit' : 'next'}" data-disable-when-busy class="button-primary">${currentStep === onboardingSteps.length - 1 ? 'Submit application' : 'Continue'}</button></div></div></section><div class="mt-5 grid gap-3 text-xs leading-5 text-ink-500 sm:grid-cols-3"><div class="rounded-2xl border border-ink-100 bg-white p-4"><strong class="block text-ink-950">Paperless by design</strong><span class="mt-1 block">Digital forms, uploads, consent, signature and secure requests.</span></div><div class="rounded-2xl border border-ink-100 bg-white p-4"><strong class="block text-ink-950">Risk-based workflow</strong><span class="mt-1 block">Questions and evidence adapt to applicant type and risk.</span></div><div class="rounded-2xl border border-ink-100 bg-white p-4"><strong class="block text-ink-950">Applicant support</strong><span class="mt-1 block">Assisted verification remains available without bypassing compliance.</span></div></div></div></main><div id="toast" role="status" aria-live="polite" class="fixed bottom-4 left-1/2 z-50 hidden w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-ink-100 bg-ink-950 px-4 py-3 text-center text-sm font-semibold text-white shadow-soft"></div></div>`;
}

function render() {
  stopCamera();
  appRoot.innerHTML = receipt ? renderReceipt() : renderApplicationShell();
  rootEl.classList.toggle('kyc-sidebar-collapsed', sidebarCollapsed);
  bindFieldInputs();
  if (!receipt && currentStep === 2) bindLivenessStep();
}

function renderStep() {
  switch (currentStep) {
    case 0: return renderApplicantProfile();
    case 1: return renderIdentity();
    case 2: return renderLiveness();
    case 3: return renderOwnership();
    case 4: return renderInvestment();
    case 5: return renderCompliance();
    case 6: return renderDocuments();
    default: return renderReview();
  }
}

function renderApplicantProfile() {
  const choices = applicantTypes.map(([value, icon, title, description]) => {
    const active = application.applicantType === value;
    return `<button type="button" data-action="select-applicant-type" data-value="${value}" class="choice-card ${active ? 'choice-card-active' : ''}"><span class="grid h-10 w-10 place-items-center rounded-xl text-sm font-semibold ${active ? 'bg-matanho-700 text-white' : 'bg-ink-50 text-ink-700'}">${icon}</span><strong class="mt-4 block text-sm text-ink-950">${title}</strong><span class="mt-1.5 block text-xs leading-5 text-ink-500">${description}</span></button>`;
  }).join('');
  return `<div class="space-y-6"><div><p class="text-xs font-semibold uppercase tracking-[0.16em] text-matanho-700">Who is applying?</p><div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">${choices}</div></div><div class="grid gap-4 sm:grid-cols-2">${selectField('Relationship', 'relationshipType', [['', 'Select relationship'], ['limited_partner', 'Limited partner investment'], ['investment_management', 'Investment management mandate'], ['advisory', 'Investment advisory mandate'], ['co_investment', 'Co-investment opportunity']], { required: true })}${selectField('Fund, strategy or product', 'product', [['', 'Select product'], ['Matanho Growth Fund I', 'Matanho Growth Fund I'], ['Matanho Venture Fund I', 'Matanho Venture Fund I'], ['Private Markets Advisory Mandate', 'Private Markets Advisory Mandate'], ['Separate Account Mandate', 'Separate Account Mandate']], { required: true })}</div>${callout('A shorter route is used where appropriate', 'The questions and document list adapt to applicant type. Individuals do not see corporate ownership questions, while pension funds, insurers, trusts and investment entities receive the relevant control and regulatory fields.')}</div>`;
}

function renderIdentity() {
  const isIndividual = application.applicantType === 'individual';
  const legalFields = isIndividual
    ? `${field('Full legal name', 'identity.legalName', { required: true, className: 'sm:col-span-2', placeholder: 'As shown on identity documents' })}${field('Zimbabwe national ID', 'identity.nationalId', { placeholder: 'Or provide a passport number' })}${field('Passport number', 'identity.passportNumber')}${dateField('Date of birth', 'identity.dateOfBirth', true)}${field('Primary tax residence', 'identity.taxResidence', { required: true })}`
    : `${field('Registered legal name', 'identity.legalName', { required: true, className: 'sm:col-span-2', placeholder: 'As shown on registration or establishing documents' })}${field('Trading name', 'identity.tradingName')}${selectField('Entity or institution type', 'identity.entityType', [['', 'Select type'], ['Private limited company', 'Private limited company'], ['Public company', 'Public company'], ['Pension fund', 'Pension fund'], ['Insurance company', 'Insurance company'], ['Asset manager', 'Asset manager'], ['Collective investment scheme', 'Collective investment scheme'], ['Trust', 'Trust'], ['Partnership', 'Partnership'], ['Foundation or association', 'Foundation or association']], { required: true })}${field('Registration or establishing instrument number', 'identity.registrationNumber', { required: true, placeholder: 'Companies Registry, trust deed or regulator reference' })}${selectField('Regulator', 'identity.regulator', [['', 'Not regulated / select regulator'], ['SEC Zimbabwe', 'SEC Zimbabwe'], ['Insurance and Pensions Commission', 'Insurance and Pensions Commission'], ['Reserve Bank of Zimbabwe', 'Reserve Bank of Zimbabwe'], ['Public Accountants and Auditors Board', 'Public Accountants and Auditors Board'], ['Other regulator', 'Other regulator']])}${field('Regulatory licence number', 'identity.licenceNumber')}${field('ZIMRA TIN / business partner number', 'identity.zimraNumber')}`;
  const provinceField = application.identity.country === 'Zimbabwe'
    ? selectField('Province', 'identity.province', provinces.map((province) => [province, province]), { required: true })
    : field('Province or state', 'identity.province', { required: true });
  return `<div class="space-y-6"><div class="grid gap-4 sm:grid-cols-2">${legalFields}</div><div class="border-t border-ink-100 pt-6"><h3 class="text-sm font-semibold text-ink-950">Authorised contact and address</h3><p class="mt-1 text-xs leading-5 text-ink-500">For an entity, this person should be authorised to complete onboarding and sign declarations.</p><div class="mt-4 grid gap-4 sm:grid-cols-2">${field('Authorised contact', 'identity.contactName', { required: true })}${field('Role or capacity', 'identity.contactRole', { required: true, placeholder: 'Director, trustee, applicant, authorised representative' })}${field('Email address', 'identity.email', { required: true, type: 'email', placeholder: 'name@organisation.co.zw' })}${field('Zimbabwe mobile number', 'identity.mobile', { required: true, type: 'tel', hint: 'Use international format, for example +263 77 123 4567.' })}${selectField('Country', 'identity.country', ['Zimbabwe', 'South Africa', 'Mauritius', 'Botswana', 'Zambia', 'United Kingdom', 'United States', 'Other'].map((item) => [item, item]), { required: true, rerender: true })}${provinceField}${field('City or town', 'identity.city', { required: true })}${field('Physical address', 'identity.physicalAddress', { required: true, placeholder: 'Street, building, suburb and city' })}</div></div></div>`;
}

function livenessStatusRow(label, complete) {
  return `<div class="flex items-center justify-between gap-3 border-b border-ink-100 pb-3 last:border-0 last:pb-0"><span class="text-sm text-ink-700">${label}</span>${statusPill(complete ? 'Complete' : 'Pending', complete ? 'success' : 'neutral')}</div>`;
}

function renderLiveness() {
  const liveness = application.liveness;
  const completed = liveness.status === 'captured';
  const assisted = liveness.status === 'assisted_review';
  const image = liveness.selfieDataUrl
    ? `<img src="${liveness.selfieDataUrl}" alt="Captured applicant selfie" class="h-full w-full object-cover">`
    : '<video id="camera-video" muted playsinline class="h-full w-full -scale-x-100 object-cover"></video>';
  return `<div class="space-y-5"><div class="grid gap-4 sm:grid-cols-2">${field('Person completing this check', 'liveness.subjectName', { required: true, placeholder: 'Full legal name' })}${field('Capacity or role', 'liveness.subjectRole', { required: true, placeholder: 'Applicant, director, trustee, authorised representative', hint: 'For an entity, use the authorised representative or signatory.' })}</div>${checkRow('biometric-consent', 'liveness.consent', 'I consent to biometric identity verification', 'The selfie and liveness result may be used for identity verification, fraud prevention, KYC/AML compliance and legally required record-keeping.')}<div class="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]"><div class="overflow-hidden rounded-2xl border border-ink-100 bg-ink-950"><div class="relative aspect-[4/3] min-h-[280px] bg-ink-900">${image}<div class="pointer-events-none absolute inset-0 grid place-items-center"><div class="face-mask h-[72%] w-[58%] rounded-[48%] border-2 border-dashed border-white/70"></div></div><div class="absolute left-4 top-4 flex gap-2"><span id="camera-badge" class="status-pill ${completed ? 'status-success' : 'status-neutral'}">${completed ? 'Captured' : 'Camera off'}</span>${liveness.score ? statusPill(`${liveness.score}% quality`, 'success') : ''}</div>${!liveness.selfieDataUrl ? '<div id="camera-help" class="absolute inset-x-8 bottom-8 rounded-2xl border border-white/10 bg-black/35 p-4 text-center backdrop-blur"><p class="text-sm font-semibold text-white">Your camera starts only after you choose Start camera.</p><p class="mt-1 text-xs leading-5 text-white/60">Use a bright, glare-free setting and keep your full face visible.</p></div>' : ''}</div><div class="flex flex-col gap-3 border-t border-white/10 bg-ink-950 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between"><p id="challenge-text" class="text-xs leading-5 text-white/70">${completed ? 'Selfie and liveness completed.' : assisted ? 'Selfie captured and queued for assisted verification.' : 'Start the camera when you are ready.'}</p><div class="flex shrink-0 flex-wrap gap-2">${liveness.selfieDataUrl ? '<button type="button" data-action="retake-selfie" class="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold transition hover:bg-white/10">Retake</button>' : '<button type="button" data-action="start-camera" class="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Start camera</button><button id="run-liveness" type="button" data-action="run-liveness" disabled class="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Run liveness</button><button id="capture-selfie" type="button" data-action="capture-selfie" disabled class="rounded-xl bg-matanho-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-matanho-600 disabled:cursor-not-allowed disabled:opacity-40">Take selfie</button>'}</div></div><canvas id="selfie-canvas" class="hidden"></canvas></div><div class="space-y-3"><div class="rounded-2xl border border-ink-100 bg-white p-5 shadow-card"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">Verification status</p><h3 class="mt-1 text-lg font-semibold text-ink-950">${completed ? 'Face verification ready' : assisted ? 'Assisted review requested' : 'Complete the live check'}</h3></div><span class="grid h-10 w-10 place-items-center rounded-xl ${completed ? 'bg-matanho-50 text-matanho-800' : 'bg-ink-50 text-ink-500'}">${completed ? '✓' : '◎'}</span></div><div class="mt-5 space-y-3">${livenessStatusRow('Biometric consent', liveness.consent)}${livenessStatusRow('Live camera session', ['camera_ready', 'challenge_passed', 'captured'].includes(liveness.status))}${livenessStatusRow('Motion challenge', ['challenge_passed', 'captured'].includes(liveness.status))}${livenessStatusRow('Selfie captured', Boolean(liveness.selfieDataUrl))}</div></div>${callout('Camera unavailable?', '<p>Use a recent mobile selfie below. The application remains paperless, but activation is held for assisted identity review.</p><label class="mt-3 inline-flex cursor-pointer rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50">Upload mobile selfie<input id="selfie-upload" type="file" accept="image/*" capture="user" class="hidden"></label><button type="button" data-action="request-assisted" class="ml-2 mt-3 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50">Request assisted check</button>', 'warning')}${callout('Production integration note', config.livenessProvider === 'mock' ? 'This package uses a mock result for demonstration. Change config.js to vendor mode and connect the documented session endpoints before production.' : 'Liveness sessions are created and completed through the backend API. The browser should never receive private vendor credentials.')}</div></div></div>`;
}

function renderOwnership() {
  if (application.applicantType === 'individual') {
    return callout('Ownership look-through is not required for an individual applicant', 'The applicant is the natural person being verified. The compliance team may still request information about authorised agents, joint holders or persons acting on the applicant\'s behalf.', 'success');
  }
  const persons = application.ownership.persons.map((person) => `<div class="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong class="text-sm text-ink-950">${escapeHtml(person.fullName)}</strong><p class="mt-1 text-xs text-ink-500">${escapeHtml(person.controlRole)} · ${escapeHtml(person.ownershipPercent || 'Control only')}${person.ownershipPercent ? '%' : ''} · ${escapeHtml(person.nationality)}</p></div><div class="flex items-center gap-2">${statusPill(person.pep === 'yes' ? 'PEP disclosed' : 'Captured', person.pep === 'yes' ? 'warning' : 'success')}<button type="button" data-action="remove-ubo" data-id="${person.id}" class="rounded-lg px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-red-50 hover:text-red-700">Remove</button></div></div>`).join('');
  return `<div class="space-y-6">${callout('Who must be added?', 'Add each natural person who ultimately owns 25% or more, exercises control through other means, or acts as a trustee, founder, protector, partner, director or senior controlling official. The backend rules engine can configure a lower threshold.')}${persons ? `<div class="space-y-2">${persons}</div>` : ''}<div class="rounded-2xl border border-ink-100 bg-ink-50 p-4 sm:p-5"><h3 class="text-sm font-semibold text-ink-950">Add beneficial owner or controller</h3><div class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><label class="block"><span class="field-label">Full legal name <span class="text-red-600">*</span></span><input id="ubo-name" class="field-input"></label><label class="block"><span class="field-label">Nationality <span class="text-red-600">*</span></span><input id="ubo-nationality" class="field-input" value="Zimbabwean"></label><label class="block"><span class="field-label">Date of birth <span class="text-red-600">*</span></span><div class="rounded-xl border border-ink-100 bg-white px-3.5 py-3"><input id="ubo-dob" type="date" class="block w-full border-0 bg-transparent p-0 text-sm outline-none"></div></label><label class="block"><span class="field-label">Identity type</span><select id="ubo-id-type" class="field-input"><option value="national_id">National ID</option><option value="passport">Passport</option><option value="other">Other official ID</option></select></label><label class="block"><span class="field-label">Identity number</span><input id="ubo-id-number" class="field-input"></label><label class="block"><span class="field-label">Ownership percentage</span><input id="ubo-percent" class="field-input" type="number" min="0" max="100"></label><label class="block"><span class="field-label">Control role <span class="text-red-600">*</span></span><input id="ubo-role" class="field-input" placeholder="Shareholder, trustee, director"></label><label class="block"><span class="field-label">PEP status</span><select id="ubo-pep" class="field-input"><option value="">Select</option><option value="no">No</option><option value="yes">Yes</option></select></label></div><button type="button" data-action="add-ubo" class="mt-4 rounded-xl bg-ink-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-ink-900">Add person</button></div>${checkRow('no-reportable-owners', 'ownership.noReportableOwners', 'No natural person meets the ownership threshold', 'Use this only after reasonable look-through. Identify the senior controlling person and explain the structure below.')}${textareaField('Ownership and control explanation', 'ownership.controlExplanation', { required: application.ownership.noReportableOwners, placeholder: 'Describe parent entities, nominees, trusts, control rights and the senior controlling person.' })}</div>`;
}

function renderInvestment() {
  return `<div class="space-y-6"><div class="grid gap-4 sm:grid-cols-2">${field('Expected investment or mandate amount', 'investment.amount', { required: true, type: 'number', min: 0, placeholder: '0.00' })}${selectField('Currency', 'investment.currency', ['USD', 'ZiG', 'ZAR', 'GBP'].map((item) => [item, item]), { required: true })}${textareaField('Purpose of the investment or mandate', 'investment.investmentPurpose', { required: true, className: 'sm:col-span-2', placeholder: 'Explain the investment objective, strategy allocation or advisory need.' })}${textareaField('Source of wealth or institutional capital', 'investment.sourceOfWealth', { required: true, className: 'sm:col-span-2', placeholder: 'Business income, pension contributions, investment returns, asset sale, inheritance, institutional reserves...', hint: 'Explain how the applicant accumulated the overall capital, not only the immediate payment.' })}${textareaField('Source of funds for this transaction', 'investment.sourceOfFunds', { required: true, className: 'sm:col-span-2', placeholder: 'Custodian cash account, operating bank account, redemption proceeds...', hint: 'Identify the immediate origin and account from which the funds will be remitted.' })}${field('Bank or custodian', 'investment.bankName', { required: true })}${field('Account holder', 'investment.accountHolder', { required: true, hint: 'Third-party payments should be disclosed and approved before remittance.' })}${field('Bank country', 'investment.bankCountry', { required: true })}${field('Expected transaction pattern', 'investment.expectedTransactions', { placeholder: 'Initial subscription plus quarterly capital calls' })}</div>${callout('Do not send money yet', 'Payment instructions should only be issued through the firm\'s verified channel after compliance approval. Applicants should never rely on bank details sent in an unverified email or messaging application.', 'warning')}</div>`;
}

function renderCompliance() {
  const risk = calculateIndicativeRisk(application);
  const declarations = [
    ['pep', 'Politically exposed person', 'Applicant, owner, controller, family member or close associate.'],
    ['sanctions', 'Sanctions or restrictive measures', 'Current or historical sanctions, asset freezes or restrictive measures.'],
    ['criminalOrRegulatory', 'Financial crime or regulatory matter', 'Fraud, corruption, money laundering, tax crime, market conduct or enforcement matter.'],
    ['adverseMedia', 'Material adverse media', 'Credible public reporting relevant to integrity, financial crime or regulatory risk.'],
    ['taxCompliant', 'Tax affairs are in good standing', 'The applicant is compliant or has disclosed any material dispute or arrangement.'],
    ['usPerson', 'US person or US tax indicator', 'Relevant for FATCA classification and tax documentation.'],
  ];
  const rows = declarations.map(([key, title, description]) => `<div class="grid gap-4 rounded-2xl border border-ink-100 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center"><div><strong class="text-sm text-ink-950">${title}</strong><p class="mt-1 text-xs leading-5 text-ink-500">${description}</p></div><select class="field-input" data-path="compliance.${key}" data-rerender="true"><option value="">Select answer</option><option value="no" ${application.compliance[key] === 'no' ? 'selected' : ''}>No</option><option value="yes" ${application.compliance[key] === 'yes' ? 'selected' : ''}>Yes</option></select></div>`).join('');
  return `<div class="space-y-6"><div class="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-ink-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">Indicative application risk</p><p class="mt-1 text-2xl font-semibold text-ink-950">${risk.score}<span class="text-sm font-medium text-ink-500"> / 100</span></p></div>${statusPill(`${risk.band} risk`, risk.band === 'Low' ? 'success' : risk.band === 'Medium' ? 'warning' : 'danger')}</div><div class="space-y-3">${rows}</div>${textareaField('CRS tax residencies', 'compliance.crsTaxResidencies', { required: true, hint: 'List every country of tax residence and the relevant tax identification number where available.' })}${textareaField('Explanation for any Yes answer', 'compliance.explanation', { placeholder: 'Provide names, dates, jurisdictions, outcomes and supporting context.' })}${callout('A disclosure does not automatically mean rejection', 'PEP status, foreign tax status or a previous regulatory matter may require enhanced due diligence and senior approval. Complete, accurate disclosure allows the compliance team to assess the risk fairly.')}</div>`;
}

function renderDocumentRows() {
  if (!application.documents.length) return '';
  return `<div class="mt-4 space-y-2">${application.documents.map((document) => `<div class="flex items-center justify-between gap-4 rounded-xl border border-ink-100 bg-white px-4 py-3"><div class="min-w-0"><strong class="block truncate text-sm text-ink-950">${escapeHtml(document.fileName)}</strong><span class="mt-0.5 block text-xs text-ink-500">${(document.size / 1024 / 1024).toFixed(2)} MB</span></div><div class="flex items-center gap-2">${statusPill(document.status, document.status === 'uploaded' ? 'success' : document.status === 'failed' ? 'danger' : 'neutral')}<button type="button" data-action="remove-document" data-id="${document.id}" class="rounded-lg px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-red-50 hover:text-red-700">Remove</button></div></div>`).join('')}</div>`;
}

function renderDocuments() {
  const requiredItems = [
    application.applicantType === 'individual' ? 'National ID or passport' : 'Registration or establishing document',
    application.applicantType === 'individual' ? 'Proof of residential address' : 'Constitution, trust deed or partnership agreement',
    'Authority to act or board resolution',
    'Bank or custodian evidence',
    'Source-of-wealth and source-of-funds evidence',
    application.applicantType === 'individual' ? 'Tax identification evidence where applicable' : 'Ownership chart and regulatory licence where applicable',
  ];
  return `<div class="space-y-6"><div><h3 class="text-sm font-semibold text-ink-950">Paperless supporting documents</h3><p class="mt-1 text-xs leading-5 text-ink-500">Upload clear colour scans or photographs. Production should return the final requirement list from the backend based on applicant type, risk and jurisdiction.</p><div class="mt-4 grid gap-2 sm:grid-cols-2">${requiredItems.map((item) => `<div class="flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2 text-xs text-ink-700"><span class="text-matanho-700">✓</span>${escapeHtml(item)}</div>`).join('')}</div></div><input id="document-input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" class="hidden"><button id="upload-zone" type="button" data-action="browse-documents" class="w-full rounded-2xl border-2 border-dashed border-ink-100 bg-ink-50 px-5 py-8 text-center transition hover:border-matanho-100 hover:bg-matanho-50/40 focus:outline-none focus:ring-4 focus:ring-matanho-100"><span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl text-matanho-800 shadow-card">↑</span><strong class="mt-4 block text-sm text-ink-950">Drop documents here or browse</strong><span class="mt-1 block text-xs text-ink-500">PDF, JPG or PNG · maximum ${maxUploadMb} MB per file</span></button>${renderDocumentRows()}<div class="space-y-3 border-t border-ink-100 pt-6">${checkRow('accuracy', 'declarations.informationAccurate', 'The information is true, complete and not misleading', 'I will promptly notify the firm if material information changes.')}${checkRow('verification-consent', 'declarations.verificationConsent', 'I authorise identity, ownership, sanctions, PEP, adverse-media, tax and regulatory verification', 'This includes ongoing monitoring and proportionate requests for further evidence.')}${checkRow('electronic-consent', 'declarations.electronicCommunicationConsent', 'I agree to electronic records, notices and signatures', 'Copies can be downloaded or requested from the onboarding team.')}${checkRow('privacy-consent', 'declarations.privacyNoticeAccepted', 'I have read and accepted the privacy notice', 'The production deployment must link the firm\'s approved Zimbabwe privacy notice and retention schedule.')}</div><div class="grid gap-4 sm:grid-cols-2">${field('Electronic signatory', 'declarations.signerName', { required: true, placeholder: 'Type full legal name' })}${field('Signing capacity', 'declarations.signerCapacity', { required: true, placeholder: 'Applicant, director, trustee, authorised representative' })}</div></div>`;
}

function summaryCard(label, value) {
  return `<div class="summary-card"><span class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">${escapeHtml(label)}</span><strong class="mt-1 block text-sm text-ink-950">${escapeHtml(value || 'Not provided')}</strong></div>`;
}

function renderReview() {
  const risk = calculateIndicativeRisk(application);
  const applicantLabel = applicantTypes.find(([value]) => value === application.applicantType)?.[2] || '';
  const checks = [
    ['Identity and contact', application.identity.legalName && application.identity.email ? 'Complete' : 'Needs attention'],
    ['Liveness and selfie', application.liveness.status === 'captured' ? 'Verified' : application.liveness.status === 'assisted_review' ? 'Assisted review' : 'Needs attention'],
    ['Ownership and control', application.applicantType === 'individual' || application.ownership.persons.length > 0 || application.ownership.noReportableOwners ? 'Complete' : 'Needs attention'],
    ['Investment and funds', application.investment.sourceOfWealth && application.investment.sourceOfFunds ? 'Complete' : 'Needs attention'],
    ['Compliance declarations', application.compliance.pep && application.compliance.sanctions ? 'Complete' : 'Needs attention'],
    ['Paperless documents', `${application.documents.filter((document) => document.status === 'uploaded').length} uploaded`],
    ['Electronic signature', application.declarations.signerName ? `Signed by ${application.declarations.signerName}` : 'Needs attention'],
  ];
  return `<div class="space-y-6">${callout('Final check before submission', 'Submission locks the applicant declaration and sends the application to the compliance queue. The applicant can still respond to secure information requests without restarting the form.', 'success')}<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">${summaryCard('Applicant', application.identity.legalName)}${summaryCard('Applicant type', applicantLabel)}${summaryCard('Product', application.product)}${summaryCard('Contact', application.identity.contactName)}${summaryCard('Investment', `${application.investment.currency} ${Number(application.investment.amount || 0).toLocaleString()}`)}${summaryCard('Indicative risk', `${risk.band} · ${risk.score}/100`)}</div><div class="overflow-hidden rounded-2xl border border-ink-100">${checks.map(([label, value], index) => `<div class="flex items-center justify-between gap-4 bg-white px-4 py-3 ${index ? 'border-t border-ink-100' : ''}"><span class="text-sm font-medium text-ink-700">${escapeHtml(label)}</span>${statusPill(value, value.includes('Needs attention') ? 'warning' : 'success')}</div>`).join('')}</div><div class="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-xs leading-6 text-ink-600">By submitting, the electronic signatory confirms authority to act and adopts the declarations made in this application. A timestamp, application reference, consent version and evidence hashes should be recorded by the backend.</div></div>`;
}

function bindFieldInputs() {
  appRoot.querySelectorAll('[data-path]').forEach((control) => {
    const eventName = control.matches('select, input[type="checkbox"], input[type="date"]') ? 'change' : 'input';
    control.addEventListener(eventName, (event) => {
      const target = event.currentTarget;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      setPath(application, target.dataset.path, value);
      scheduleAutosave();
      if (target.dataset.rerender === 'true') render();
    });
  });

  const fileInput = document.querySelector('#document-input');
  if (fileInput) fileInput.addEventListener('change', (event) => void handleDocumentFiles(event.target.files));
  const uploadZone = document.querySelector('#upload-zone');
  if (uploadZone) {
    ['dragenter', 'dragover'].forEach((eventName) => uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadZone.classList.add('border-matanho-500', 'bg-matanho-50');
    }));
    ['dragleave', 'drop'].forEach((eventName) => uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadZone.classList.remove('border-matanho-500', 'bg-matanho-50');
    }));
    uploadZone.addEventListener('drop', (event) => void handleDocumentFiles(event.dataTransfer.files));
  }
}

appRoot.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;

  if (action === 'select-applicant-type') {
    application.applicantType = button.dataset.value;
    scheduleAutosave();
    render();
  }

  if (action === 'jump-step') {
    const step = Number(button.dataset.step);
    if (step <= currentStep) {
      currentStep = step;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (action === 'back' && currentStep > 0) {
    currentStep -= 1;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (action === 'next') void handleNext();
  if (action === 'save') void saveNow();
  if (action === 'submit') void submitApplication();
  if (action === 'add-ubo') addUboFromForm();
  if (action === 'remove-ubo') {
    application.ownership.persons = application.ownership.persons.filter((person) => person.id !== button.dataset.id);
    scheduleAutosave();
    render();
  }
  if (action === 'browse-documents') document.querySelector('#document-input')?.click();
  if (action === 'remove-document') {
    application.documents = application.documents.filter((document) => document.id !== button.dataset.id);
    scheduleAutosave();
    render();
  }
  if (action === 'start-camera') void startCamera();
  if (action === 'run-liveness') void runLivenessChallenge();
  if (action === 'capture-selfie') void captureSelfie();
  if (action === 'retake-selfie') {
    Object.assign(application.liveness, { status: 'not_started', selfieDataUrl: '', score: null, providerSessionId: '' });
    render();
  }
  if (action === 'request-assisted') {
    application.liveness.status = 'assisted_review';
    scheduleAutosave();
    render();
    showToast('Assisted identity verification has been requested.');
  }
  if (action === 'restart') {
    clearLocalDraft();
    if (typeof window.__FR_KYC_NAV__ === 'function') window.__FR_KYC_NAV__(0); else window.location.href = window.location.pathname;
  }
  if (action === 'toggle-sidebar') {
    sidebarCollapsed = !sidebarCollapsed;
    try {
      localStorage.setItem('fr-kyc-sidebar', sidebarCollapsed ? '1' : '0');
    } catch (_) {}
    render();
  }
}, __frSig);

async function handleNext() {
  const message = validateStep(currentStep, application);
  if (message) {
    showToast(message);
    return;
  }
  setBusy(true);
  try {
    await ensureApplication();
    currentStep = Math.min(currentStep + 1, onboardingSteps.length - 1);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'The application could not be updated.');
  } finally {
    setBusy(false);
  }
}

async function saveNow() {
  setBusy(true);
  try {
    const applicationId = await ensureApplication();
    saveLocalDraft(application);
    await api.saveDraft(applicationId, application);
    showToast('Draft saved securely.');
    setAutosaveStatus('saved');
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Draft could not be saved.');
  } finally {
    setBusy(false);
  }
}

function addUboFromForm() {
  const read = (selector) => document.querySelector(selector)?.value.trim() || '';
  const fullName = read('#ubo-name');
  const controlRole = read('#ubo-role');
  if (!fullName || !controlRole) {
    showToast('Provide the person\'s name and control role.');
    return;
  }
  application.ownership.persons.push({
    id: crypto.randomUUID(),
    fullName,
    nationality: read('#ubo-nationality') || 'Zimbabwean',
    dateOfBirth: read('#ubo-dob'),
    idType: read('#ubo-id-type') || 'national_id',
    idNumber: read('#ubo-id-number'),
    ownershipPercent: read('#ubo-percent'),
    controlRole,
    pep: read('#ubo-pep'),
  });
  scheduleAutosave();
  render();
}

async function handleDocumentFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  const invalid = files.find((file) => !allowed.includes(file.type) || file.size > maxUploadMb * 1024 * 1024);
  if (invalid) {
    showToast(`Use PDF, JPG or PNG files up to ${maxUploadMb} MB each.`);
    return;
  }

  setBusy(true);
  try {
    const applicationId = await ensureApplication();
    const queued = files.map((file) => ({
      file,
      record: {
        id: crypto.randomUUID(),
        category: 'supporting_document',
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
        status: 'uploading',
        documentId: '',
      },
    }));
    application.documents.push(...queued.map((item) => item.record));
    render();

    for (const item of queued) {
      try {
        const upload = await api.requestDocumentUpload(applicationId, {
          fileName: item.file.name,
          mimeType: item.file.type,
          sizeBytes: item.file.size,
          category: item.record.category,
        });
        await api.uploadDocument(upload, item.file);
        await api.registerDocument(applicationId, upload.documentId);
        const record = application.documents.find((document) => document.id === item.record.id);
        if (record) Object.assign(record, { status: 'uploaded', documentId: upload.documentId });
      } catch {
        const record = application.documents.find((document) => document.id === item.record.id);
        if (record) record.status = 'failed';
      }
      render();
    }
    scheduleAutosave();
    showToast('Document upload processing completed.');
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Document upload could not start.');
  } finally {
    setBusy(false);
  }
}

async function submitApplication() {
  for (let step = 0; step < onboardingSteps.length - 1; step += 1) {
    const error = validateStep(step, application);
    if (error) {
      currentStep = step;
      render();
      showToast(error);
      return;
    }
  }

  setBusy(true);
  try {
    const applicationId = await ensureApplication();
    application.declarations.signedAt = new Date().toISOString();
    await api.saveDraft(applicationId, application);
    const response = await api.submit(applicationId);
    clearLocalDraft();
    receipt = {
      reference: response.reference || application.reference || applicationId,
      submittedAt: new Date().toISOString(),
    };
    render();
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Submission failed. Try again or contact support.');
  } finally {
    setBusy(false);
  }
}

function bindLivenessStep() {
  const selfieUpload = document.querySelector('#selfie-upload');
  if (selfieUpload) {
    selfieUpload.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('Select a clear image file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        application.liveness.selfieDataUrl = String(reader.result || '');
        application.liveness.status = 'assisted_review';
        scheduleAutosave();
        render();
        showToast('Mobile selfie received for assisted verification.');
      };
      reader.readAsDataURL(file);
    });
  }
}

function stopCamera() {
  if (!cameraStream) return;
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
}

async function startCamera() {
  if (!application.liveness.consent) {
    showToast('Give biometric consent before activating the camera.');
    return;
  }
  const video = document.querySelector('#camera-video');
  const badge = document.querySelector('#camera-badge');
  const challengeText = document.querySelector('#challenge-text');
  const help = document.querySelector('#camera-help');
  if (!video) return;

  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not supported in this browser.');
    if (badge) badge.textContent = 'Starting camera';
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    video.srcObject = cameraStream;
    await video.play();
    application.liveness.status = 'camera_ready';
    if (badge) {
      badge.textContent = 'Camera live';
      badge.className = 'status-pill status-success';
    }
    if (challengeText) challengeText.textContent = 'Centre your face inside the frame, remove glasses if they create glare, then run the liveness check.';
    help?.classList.add('hidden');
    const runButton = document.querySelector('#run-liveness');
    if (runButton) runButton.disabled = false;
    scheduleAutosave();
  } catch (error) {
    if (badge) {
      badge.textContent = 'Camera blocked';
      badge.className = 'status-pill status-danger';
    }
    showToast(error instanceof Error ? error.message : 'Camera permission was not granted.');
  }
}

async function runLivenessChallenge() {
  if (!cameraStream || livenessRunning) return;
  livenessRunning = true;
  const runButton = document.querySelector('#run-liveness');
  const captureButton = document.querySelector('#capture-selfie');
  const challengeText = document.querySelector('#challenge-text');
  if (runButton) {
    runButton.disabled = true;
    runButton.textContent = 'Checking...';
  }
  const prompts = [
    'Look straight at the camera',
    'Slowly turn your head left',
    'Slowly turn your head right',
    'Blink twice, then look forward',
  ];
  for (const prompt of prompts) {
    if (challengeText) challengeText.textContent = prompt;
    await new Promise((resolve) => window.setTimeout(resolve, 1250));
  }
  application.liveness.status = 'challenge_passed';
  if (challengeText) challengeText.textContent = 'Motion challenge captured. Take a clear selfie to complete verification.';
  if (captureButton) captureButton.disabled = false;
  if (runButton) runButton.textContent = 'Challenge complete';
  scheduleAutosave();
  livenessRunning = false;
}

function captureFrame() {
  const video = document.querySelector('#camera-video');
  const canvas = document.querySelector('#selfie-canvas');
  if (!video || !canvas || !video.videoWidth || !video.videoHeight) return '';
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.88);
}

async function captureSelfie() {
  if (application.liveness.status !== 'challenge_passed') {
    showToast('Complete the motion challenge before taking the selfie.');
    return;
  }
  const selfieDataUrl = captureFrame();
  if (!selfieDataUrl) {
    showToast('The camera frame is not ready. Try again.');
    return;
  }

  setBusy(true);
  try {
    const applicationId = await ensureApplication();
    const session = await api.createLivenessSession(applicationId);
    const result = await api.completeLivenessSession(applicationId, {
      sessionId: session.sessionId,
      selfieDataUrl,
      challengeCompleted: true,
    });
    Object.assign(application.liveness, {
      selfieDataUrl,
      status: result.status === 'passed' ? 'captured' : 'assisted_review',
      providerSessionId: session.sessionId,
      score: result.score || null,
    });
    stopCamera();
    scheduleAutosave();
    render();
    showToast(result.status === 'passed' ? 'Selfie and liveness completed.' : 'Selfie captured for assisted verification.');
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Liveness completion failed.');
  } finally {
    setBusy(false);
  }
}

render();


  // Bridge step changes → Next paths (only when step index changes)
  let __lastNavStep = -1;
  const __baseRender = render;
  render = function () {
    __baseRender();
    if (currentStep !== __lastNavStep && typeof window.__FR_KYC_NAV__ === 'function') {
      __lastNavStep = currentStep;
      window.__FR_KYC_NAV__(currentStep);
    }
  };
  if (typeof window.__FR_KYC_NAV__ === 'function') {
    __lastNavStep = currentStep;
    window.__FR_KYC_NAV__(currentStep);
  }

  apiHandle = {
    setStep(step) {
      const n = Number(step);
      if (!Number.isFinite(n) || n < 0) return;
      currentStep = Math.min(n, onboardingSteps.length - 1);
      render();
    },
    destroy() {
      try { __frAbort.abort(); } catch (_) {}
      try { if (typeof stopCamera === 'function') stopCamera(); } catch (_) {}
      delete window.__FR_KYC_NAV__;
      rootEl.innerHTML = '';
    },
  };
  return apiHandle;
}
