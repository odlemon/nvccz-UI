/* Auto-extracted Matanho Portfolio V25 runtime — adapted for Next.js (/portfolio) */
export function startPortfolioV11Runtime(rootEl, options = {}) {
  const initialPage = options.initialPage || 'dashboard';
  const liveOnly = Boolean(options.liveOnly);
  window.__PORTFOLIO_V11_NAV__ = options.onNavigate || (() => {});

  rootEl.innerHTML = options.shellHtml || '';
  rootEl.dataset.theme = 'light';
  rootEl.classList.add('portfolio-v11-root');

  const __pv11Abort = new AbortController();
  const __pv11Sig = { signal: __pv11Abort.signal };
  let api = { setPage() {}, destroy() {} };

  
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const formatMoney = (value, currency = 'USD') => {
    const abs = Math.abs(value);
    const suffix = abs >= 1_000_000_000 ? 'B' : abs >= 1_000_000 ? 'M' : abs >= 1_000 ? 'K' : '';
    const divisor = suffix === 'B' ? 1_000_000_000 : suffix === 'M' ? 1_000_000 : suffix === 'K' ? 1_000 : 1;
    const symbols = { USD: '$', ZAR: 'R', ZWG: 'ZWG ', EUR: '€', GBP: '£' };
    const number = (abs / divisor).toLocaleString(undefined, { maximumFractionDigits: suffix ? 1 : 0 });
    return `${value < 0 ? '-' : ''}${symbols[currency] || `${currency} `}${number}${suffix}`;
  };
  const pct = value => `${Number(value).toFixed(1)}%`;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  const initials = name => name.split(/\s+/).map(part => part[0]).join('').slice(0,2).toUpperCase();

  const PROFILE_PHOTO_POOL = [
    "/portfolio/assets/employee-1.jpg",
    "/portfolio/assets/employee-2.jpg",
    "/portfolio/assets/employee-3.jpg",
    "/portfolio/assets/employee-4.jpg",
    "/portfolio/assets/employee-5.jpg",
    "/portfolio/assets/employee-6.jpg",
    "/portfolio/assets/employee-7.jpg",
    "/portfolio/assets/employee-8.jpg",
    "/portfolio/assets/employee-9.jpg"
  ];

  const PROFILE_PHOTO_EXACT = {
    "Tendai Moyo": "/portfolio/assets/employee-1.jpg",
    "Rudo Chikore": "/portfolio/assets/employee-2.jpg",
    "Tariro Kasere": "/portfolio/assets/employee-3.jpg",
    "Nyasha Moyo": "/portfolio/assets/employee-4.jpg",
    "Chipo Dube": "/portfolio/assets/employee-5.jpg",
    "Farai Chikore": "/portfolio/assets/employee-6.jpg",
    "Laura Chen": "/portfolio/assets/employee-7.jpg",
    "Tendai Sibanda": "/portfolio/assets/employee-8.jpg",
    "Anita Kapoor": "/portfolio/assets/employee-9.jpg",
    "Tawanda Kasere": "/portfolio/assets/employee-1.jpg",
    "Rudo Maposa": "/portfolio/assets/employee-2.jpg",
    "Farai Dube": "/portfolio/assets/employee-3.jpg",
    "Chipo Ndlovu": "/portfolio/assets/employee-4.jpg",
    "Tinashe Chaka": "/portfolio/assets/employee-5.jpg",
    "Lerato Maseko": "/portfolio/assets/employee-6.jpg",
    "Danai Chirwa": "/portfolio/assets/employee-7.jpg",
    "Tariro Moyo": "/portfolio/assets/employee-8.jpg"
  };
  function profilePhoto(name='') {
    const key=String(name||'').trim();
    if(PROFILE_PHOTO_EXACT[key]) return PROFILE_PHOTO_EXACT[key];
    let hash=0; for(let i=0;i<key.length;i++) hash=((hash<<5)-hash+key.charCodeAt(i))|0;
    return PROFILE_PHOTO_POOL[Math.abs(hash)%PROFILE_PHOTO_POOL.length];
  }
  function personAvatar(name, extra='') {
    const safe=escapeHTML(String(name||'Employee'));
    return `<span class="avatar photo-avatar ${extra}"><img src="${profilePhoto(name)}" alt="${safe}" loading="lazy"></span>`;
  }
  const sum = (items, fn = x => x) => items.reduce((total, item) => total + fn(item), 0);
  const storage = {
    get(key, fallback = null) { try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { window.localStorage.setItem(key, value); } catch { /* file and sandbox previews may disable storage */ } }
  };

  const iconPaths = {
    'dashboard': '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    'briefcase': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M9 12v2h6v-2"/>',
    'layers': '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    'wallet': '<path d="M4 5h13a3 3 0 0 1 3 3v11H5a3 3 0 0 1-3-3V7a2 2 0 0 1 2-2Z"/><path d="M16 11h5v5h-5a2.5 2.5 0 0 1 0-5ZM5 5V3h11"/>',
    'building': '<path d="M3 21h18M6 21V5l6-3 6 3v16M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>',
    'calendar': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    'file-chart': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 17v-3M12 17v-6M16 17v-2"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    'settings': '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.37.36.7.64.98.28.28.62.5.98.62H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    'grid': '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    'moon': '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>',
    'bell': '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevrons-up-down': '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
    'panel-left': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
    'menu': '<path d="M4 6h16M4 12h16M4 18h16"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'filter': '<path d="M4 5h16M7 12h10M10 19h4"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    'refresh': '<path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"/>',
    'more': '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    'x': '<path d="M18 6 6 18M6 6l12 12"/>',
    'check': '<path d="m20 6-11 11-5-5"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/>',
    'alert': '<path d="M10.3 2.8 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    'trend-up': '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    'trend-down': '<path d="m3 7 6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
    'dollar': '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v12"/>',
    'pie-chart': '<path d="M21.2 15.9A10 10 0 1 1 8.1 2.8"/><path d="M22 12A10 10 0 0 0 12 2v10Z"/>',
    'bar-chart': '<path d="M3 3v18h18M7 16v-5M12 16V7M17 16v-8"/>',
    'line-chart': '<path d="M3 3v18h18"/><path d="m7 16 4-5 3 3 5-7"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'file': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
    'folder': '<path d="M3 5a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z"/>',
    'eye': '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    'edit': '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    'send': '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    'lock': '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'unlock': '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.6-2"/>',
    'clipboard': '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4a3 3 0 0 1 6 0v2H9Z"/><path d="M9 12h6M9 16h6"/>',
    'brain': '<path d="M9.5 4A2.5 2.5 0 0 0 7 6.5v.7A3 3 0 0 0 5 10v1a3 3 0 0 0 1 2.2V15a3 3 0 0 0 3 3h1V4ZM14.5 4A2.5 2.5 0 0 1 17 6.5v.7A3 3 0 0 1 19 10v1a3 3 0 0 1-1 2.2V15a3 3 0 0 1-3 3h-1V4Z"/><path d="M9 8H7M15 8h2M9 13H6M15 13h3"/>',
    'gavel': '<path d="m14 13 6-6M9 8l7 7M7 10l7 7M3 21h10M5 19h6"/>',
    'bank': '<path d="m3 9 9-5 9 5M5 10v7M9 10v7M15 10v7M19 10v7M3 20h18"/>',
    'user-check': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 11l2 2 4-4"/>',
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    'phone': '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .35 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.35 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z"/>',
    'external-link': '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    'sparkles': '<path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2L12 3ZM5 14l-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8L5 14ZM19 13l-.7 1.8-1.8.7 1.8.7L19 18l.7-1.8 1.8-.7-1.8-.7L19 13Z"/>',
    'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    'printer': '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6Z"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    'drag': '<circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/>',
    'maximize': '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"/>',
    'bold': '<path d="M6 4h8a4 4 0 0 1 0 8H6Z"/><path d="M6 12h9a4 4 0 0 1 0 8H6Z"/>',
    'italic': '<path d="M19 4h-9M14 20H5M15 4 9 20"/>',
    'list': '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    'link': '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/>'
  };

  const icon = (name, className = '') => `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.file}</svg>`;

  const navGroups = [
    { label: 'INVESTMENTS', items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'deals', label: 'Deal Flow', icon: 'briefcase', badge: '198' },
      { id: 'funds', label: 'Funds', icon: 'layers' },
      { id: 'capital-calls', label: 'Capital Calls', icon: 'wallet', badge: '8' },
      { id: 'companies', label: 'Portfolio Companies', icon: 'building', badge: '42' }
    ]},
    { label: 'FUND OPERATIONS', items: [
      { id: 'cash-accounts', label: 'Client / Fund Accounts', icon: 'bank', badge: '12' },
      { id: 'cash-overview', label: 'Cash Overview', icon: 'dollar' },
      { id: 'cash-ledger', label: 'Cash Ledger', icon: 'list' },
      { id: 'cash-reservations', label: 'Reservations', icon: 'lock', badge: '4' },
      { id: 'statement-imports', label: 'Statement Imports', icon: 'upload', badge: '2' },
      { id: 'reconciliations', label: 'Reconciliations', icon: 'refresh', badge: '7' },
      { id: 'exceptions', label: 'Exceptions', icon: 'alert', badge: '5' },
      { id: 'period-close', label: 'Period Close & GL', icon: 'check-circle' }
    ]},
    { label: 'REPORTING & RECORDS', items: [
      { id: 'reporting', label: 'Reporting Schedules', icon: 'calendar', badge: '5' },
      { id: 'fund-performance', label: 'Fund Performance', icon: 'file-chart' },
      { id: 'lps', label: 'LP Management', icon: 'users' },
      { id: 'documents-vault', label: 'Documents Vault', icon: 'folder', badge: '36' },
      { id: 'reports-vault', label: 'Reports Vault', icon: 'file-chart', badge: '14' },
      { id: 'e-signatures', label: 'E-Signatures', icon: 'edit', badge: '3' },
      { id: 'mailer-lists', label: 'Mailer Lists', icon: 'mail', badge: '6' }
    ]},
    { label: 'WORKSPACE', items: [
      { id: 'settings', label: 'Settings & Integrations', icon: 'settings' }
    ]}
  ];

  const funds = [
    { id:'FUND-001', name:'Matanho Growth Fund II', vintage:2021, strategy:'Growth Equity', currency:'USD', commitment:300000000, called:210600000, nav:155200000, distributed:97100000, grossIrr:21.8, netIrr:18.9, tvpi:2.15, dpi:.46, status:'Investing', geography:'Southern Africa', managementFee:'2.0%', carry:'20% above 8% hurdle' },
    { id:'FUND-002', name:'Matanho Venture Fund I', vintage:2022, strategy:'Early Stage', currency:'USD', commitment:180000000, called:120500000, nav:88300000, distributed:42300000, grossIrr:17.3, netIrr:14.7, tvpi:1.63, dpi:.34, status:'Investing', geography:'Pan-African', managementFee:'2.2%', carry:'20% above 8% hurdle' },
    { id:'FUND-003', name:'Matanho Climate & Infrastructure I', vintage:2023, strategy:'Climate Infrastructure', currency:'USD', commitment:250000000, called:96200000, nav:141000000, distributed:22300000, grossIrr:15.4, netIrr:13.2, tvpi:1.80, dpi:.23, status:'Investing', geography:'SADC', managementFee:'1.8%', carry:'17.5% above 7% hurdle' },
    { id:'FUND-004', name:'Matanho Opportunity Fund', vintage:2020, strategy:'Buyout', currency:'USD', commitment:250000000, called:192600000, nav:141000000, distributed:110300000, grossIrr:18.6, netIrr:15.8, tvpi:1.68, dpi:.57, status:'Realising', geography:'Africa', managementFee:'1.5%', carry:'20% above 8% hurdle' },
    { id:'FUND-005', name:'Matanho SME Growth Fund', vintage:2024, strategy:'SME Growth', currency:'USD', commitment:120000000, called:28400000, nav:18900000, distributed:6200000, grossIrr:11.2, netIrr:9.1, tvpi:.88, dpi:.22, status:'Investing', geography:'Zimbabwe & Zambia', managementFee:'2.5%', carry:'20% above 8% hurdle' }
  ];

  const companies = [
    { id:'CO-001', name:'Nova Analytics', sector:'Enterprise Software', stage:'Growth', entry:'12 Mar 2022', invested:45000000, fairValue:128400000, ownership:18.2, revenueGrowth:32.4, runway:18, health:82, boardDate:'20 Aug 2026', lastReport:'30 Jun 2026', fund:'Matanho Growth Fund II', city:'Harare, Zimbabwe', revenue:[12.8,16.4,22.6,29.0,36.5], ebitda:[2.3,3.4,6.4,8.9,12.5], arr:22.6, margin:74, nrr:135, clients:83, esg:[72,68,78], color:'#4778bc' },
    { id:'CO-002', name:'GreenOrbit Energy', sector:'Climate Tech', stage:'Growth', entry:'05 Aug 2021', invested:32000000, fairValue:96700000, ownership:21.5, revenueGrowth:27.8, runway:24, health:76, boardDate:'12 Aug 2026', lastReport:'28 Jun 2026', fund:'Matanho Climate & Infrastructure I', city:'Lusaka, Zambia', revenue:[9.8,12.6,18.2,24.4,31.1], ebitda:[1.1,2.0,3.8,5.6,7.9], arr:18.2, margin:61, nrr:118, clients:42, esg:[89,74,72], color:'#0a9e73' },
    { id:'CO-003', name:'Mukuru Logistics', sector:'Mobility & Logistics', stage:'Growth', entry:'27 Apr 2022', invested:40000000, fairValue:64300000, ownership:19.3, revenueGrowth:20.3, runway:12, health:69, boardDate:'19 Aug 2026', lastReport:'25 Jun 2026', fund:'Matanho Growth Fund II', city:'Johannesburg, South Africa', revenue:[22,27,31,38,45], ebitda:[1.8,2.9,4.0,5.3,6.7], arr:31.4, margin:48, nrr:109, clients:126, esg:[58,71,76], color:'#2563eb' },
    { id:'CO-004', name:'Nyasha Foods', sector:'Consumer', stage:'Growth', entry:'10 Dec 2021', invested:25000000, fairValue:58100000, ownership:17.5, revenueGrowth:23.6, runway:14, health:74, boardDate:'14 Aug 2026', lastReport:'27 Jun 2026', fund:'Matanho Opportunity Fund', city:'Bulawayo, Zimbabwe', revenue:[18,23,29,37,46], ebitda:[2.4,3.5,5.1,6.8,9.1], arr:0, margin:39, nrr:0, clients:520, esg:[64,77,69], color:'#f29a1f' },
    { id:'CO-005', name:'Vela Health', sector:'HealthTech', stage:'Series A', entry:'03 Nov 2021', invested:18000000, fairValue:42600000, ownership:15.0, revenueGrowth:18.7, runway:10, health:61, boardDate:'09 Sep 2026', lastReport:'20 Jun 2026', fund:'Matanho Venture Fund I', city:'Nairobi, Kenya', revenue:[5.2,8.3,12.7,17.2,22.0], ebitda:[-1.9,-1.2,-.4,.8,2.1], arr:14.8, margin:67, nrr:121, clients:28, esg:[76,82,70], color:'#dc3f72' },
    { id:'CO-006', name:'Zambezi Pay', sector:'FinTech', stage:'Series B', entry:'18 Jan 2022', invested:28000000, fairValue:72300000, ownership:16.7, revenueGrowth:45.1, runway:15, health:88, boardDate:'05 Aug 2026', lastReport:'01 Jul 2026', fund:'Matanho Venture Fund I', city:'Harare, Zimbabwe', revenue:[7.1,11.6,18.9,29.8,43.2], ebitda:[-.8,.4,2.9,6.3,10.8], arr:32.1, margin:79, nrr:141, clients:64, esg:[71,84,81], color:'#0c879f' }
  ];

  const dealStages = ['Sourcing','Screening','Initial Review','Investment Committee','Due Diligence','Term Sheet','Portfolio','Rejected'];
  const deals = [
    { id:'DL-001', name:'NeuraTech', sector:'AI / ML', round:'Seed', amount:4500000, owner:'Sarah Chen', age:9, priority:'Medium', stage:'Sourcing', score:68, fund:'Matanho Venture Fund I' },
    { id:'DL-002', name:'GreenOrbit II', sector:'Climate Tech', round:'Series A', amount:12000000, owner:'Alex Johnson', age:12, priority:'Low', stage:'Sourcing', score:72, fund:'Matanho Climate & Infrastructure I' },
    { id:'DL-003', name:'PayFlow', sector:'FinTech', round:'Pre-Seed', amount:2200000, owner:'Jamie Lee', age:7, priority:'Medium', stage:'Sourcing', score:64, fund:'Matanho Venture Fund I' },
    { id:'DL-004', name:'DataForge', sector:'Enterprise SaaS', round:'Seed', amount:7500000, owner:'Michael Park', age:8, priority:'High', stage:'Screening', score:77, fund:'Matanho Venture Fund I' },
    { id:'DL-005', name:'BioLumina', sector:'HealthTech', round:'Seed', amount:8000000, owner:'Priya Nair', age:10, priority:'Medium', stage:'Screening', score:79, fund:'Matanho Venture Fund I' },
    { id:'DL-006', name:'ClearGrid', sector:'Climate Tech', round:'Seed', amount:5500000, owner:'Alex Johnson', age:6, priority:'Low', stage:'Screening', score:81, fund:'Matanho Climate & Infrastructure I' },
    { id:'DL-007', name:'Fleetio Africa', sector:'Mobility', round:'Series A', amount:15000000, owner:'Sarah Chen', age:14, priority:'Medium', stage:'Initial Review', score:75, fund:'Matanho Growth Fund II' },
    { id:'DL-008', name:'Brightside Retail', sector:'Consumer', round:'Series A', amount:12000000, owner:'Jamie Lee', age:11, priority:'High', stage:'Initial Review', score:72, fund:'Matanho SME Growth Fund' },
    { id:'DL-009', name:'SecureStack', sector:'Cybersecurity', round:'Series A', amount:18000000, owner:'Michael Park', age:13, priority:'High', stage:'Initial Review', score:80, fund:'Matanho Growth Fund II' },
    { id:'DL-010', name:'Synthara', sector:'AI / ML', round:'Series B', amount:40000000, owner:'Priya Nair', age:8, priority:'High', stage:'Investment Committee', score:87, fund:'Matanho Growth Fund II' },
    { id:'DL-011', name:'QuantumLeap', sector:'Deep Tech', round:'Series B', amount:35000000, owner:'Michael Park', age:6, priority:'High', stage:'Investment Committee', score:84, fund:'Matanho Growth Fund II' },
    { id:'DL-012', name:'MedixAI', sector:'HealthTech', round:'Series A', amount:25000000, owner:'Sarah Chen', age:5, priority:'Medium', stage:'Investment Committee', score:82, fund:'Matanho Venture Fund I' },
    { id:'DL-013', name:'Nova Analytics', sector:'Enterprise Software', round:'Series B', amount:18000000, owner:'Nyasha Moyo', age:20, priority:'High', stage:'Due Diligence', score:86, fund:'Matanho Growth Fund II', featured:true },
    { id:'DL-014', name:'BlueWave Water', sector:'Climate Tech', round:'Series B', amount:35000000, owner:'Alex Johnson', age:18, priority:'High', stage:'Due Diligence', score:83, fund:'Matanho Climate & Infrastructure I' },
    { id:'DL-015', name:'Finova', sector:'FinTech', round:'Series B', amount:45000000, owner:'Jamie Lee', age:16, priority:'Medium', stage:'Due Diligence', score:78, fund:'Matanho Growth Fund II' },
    { id:'DL-016', name:'Orbital Systems', sector:'Space Tech', round:'Series B', amount:50000000, owner:'Michael Park', age:10, priority:'High', stage:'Term Sheet', score:90, fund:'Matanho Growth Fund II' },
    { id:'DL-017', name:'AgriNxt', sector:'AgTech', round:'Series A', amount:28500000, owner:'Alex Johnson', age:9, priority:'Medium', stage:'Term Sheet', score:85, fund:'Matanho Climate & Infrastructure I' },
    { id:'DL-018', name:'Vesta Robotics', sector:'Robotics', round:'Series A', amount:50000000, owner:'Priya Nair', age:7, priority:'High', stage:'Term Sheet', score:88, fund:'Matanho Growth Fund II' },
    { id:'DL-019', name:'Lumen Analytics', sector:'AI / ML', round:'Series B', amount:45000000, owner:'Michael Park', age:0, priority:'Low', stage:'Portfolio', score:91, fund:'Matanho Growth Fund II' },
    { id:'DL-020', name:'Block Harbor', sector:'Blockchain', round:'Series A', amount:20000000, owner:'Market Sourced', age:0, priority:'High', stage:'Rejected', score:52, fund:'Matanho Venture Fund I' }
  ];

  const capitalCalls = [
    { id:'CC-2026-0038', fund:'Matanho Growth Fund II', callDate:'10 Jul 2026', dueDate:'10 Aug 2026', purpose:'Follow-on investments', amount:42500000, lpCount:38, collected:19100000, status:'Issued', approval:'Finance review' },
    { id:'CC-2026-0037', fund:'Matanho Opportunity Fund', callDate:'02 Jul 2026', dueDate:'02 Aug 2026', purpose:'New investments', amount:35000000, lpCount:32, collected:28000000, status:'Partially Collected', approval:'Issued' },
    { id:'CC-2026-0036', fund:'Matanho Climate & Infrastructure I', callDate:'25 Jun 2026', dueDate:'25 Jul 2026', purpose:'Follow-on investments', amount:28000000, lpCount:29, collected:28000000, status:'Closed', approval:'Complete' },
    { id:'CC-2026-0035', fund:'Matanho Growth Fund II', callDate:'18 Jun 2026', dueDate:'18 Jul 2026', purpose:'Co-investments', amount:50000000, lpCount:39, collected:32500000, status:'Issued', approval:'Authorisation' },
    { id:'CC-2026-0034', fund:'Matanho Venture Fund I', callDate:'05 Jun 2026', dueDate:'05 Jul 2026', purpose:'New investments', amount:18500000, lpCount:41, collected:5600000, status:'Draft', approval:'Draft' },
    { id:'CC-2026-0033', fund:'Matanho Opportunity Fund', callDate:'28 May 2026', dueDate:'28 Jun 2026', purpose:'Follow-on investments', amount:22500000, lpCount:31, collected:2300000, status:'Approved', approval:'Approved' }
  ];

  const lps = [
    { id:'LP-001', name:'Zambezi Pension Fund', type:'Pension Fund', geography:'Africa', commitment:250000000, called:155000000, distributed:78400000, netIrr:14.2, owner:'Maya Moyo', lastInteraction:'3 Jul 2026', kyc:'Verified', portal:'Active', unfunded:95000000, tvpi:1.84, dpi:.31, color:'#111827' },
    { id:'LP-002', name:'Horizon Family Office', type:'Family Office', geography:'North America', commitment:150000000, called:67500000, distributed:32100000, netIrr:12.8, owner:'Daniel Lunga', lastInteraction:'8 Jul 2026', kyc:'Verified', portal:'Active', unfunded:82500000, tvpi:1.67, dpi:.28, color:'#4778bc' },
    { id:'LP-003', name:'Savannah Insurance', type:'Insurance', geography:'Europe', commitment:200000000, called:110000000, distributed:54700000, netIrr:13.6, owner:'Aisha Chirwa', lastInteraction:'2 Jul 2026', kyc:'Verified', portal:'Active', unfunded:90000000, tvpi:1.74, dpi:.35, color:'#0c879f' },
    { id:'LP-004', name:'Baobab Growth Partners', type:'Fund of Funds', geography:'Africa', commitment:125000000, called:47500000, distributed:18600000, netIrr:11.4, owner:'James Mbewe', lastInteraction:'1 Jul 2026', kyc:'In Review', portal:'Active', unfunded:77500000, tvpi:1.49, dpi:.24, color:'#f29a1f' },
    { id:'LP-005', name:'Evergreen Endowment', type:'Endowment', geography:'North America', commitment:175000000, called:87500000, distributed:41200000, netIrr:10.7, owner:'Maya Moyo', lastInteraction:'26 Jun 2026', kyc:'Verified', portal:'Active', unfunded:87500000, tvpi:1.56, dpi:.29, color:'#0a9e73' }
  ];

  const reports = [
    { id:'REP-001', type:'Quarterly Report', fund:'Matanho Growth Fund II', entity:'Fund II', owner:'Sarah Mitchell', frequency:'Quarterly', due:'15 Jul 2026', status:'Overdue', progress:85, channel:'Email / Portal' },
    { id:'REP-002', type:'Portfolio Company Report', fund:'Matanho Growth Fund II', entity:'Nova Analytics', owner:'James Davidson', frequency:'Quarterly', due:'17 Jul 2026', status:'In Progress', progress:60, channel:'Portal' },
    { id:'REP-003', type:'LP Report', fund:'Matanho Growth Fund II', entity:'Fund II', owner:'Anita Kapoor', frequency:'Quarterly', due:'20 Jul 2026', status:'In Progress', progress:45, channel:'Email / Portal' },
    { id:'REP-004', type:'Board Pack', fund:'Nova Analytics', entity:'Nova Analytics', owner:'James Davidson', frequency:'Monthly', due:'21 Jul 2026', status:'In Progress', progress:70, channel:'Secure Portal' },
    { id:'REP-005', type:'Valuation Memo', fund:'Matanho Growth Fund II', entity:'Nyasha Foods', owner:'Laura Chen', frequency:'Quarterly', due:'23 Jul 2026', status:'Not Started', progress:10, channel:'Email' },
    { id:'REP-006', type:'Compliance Submission', fund:'Matanho Growth Fund II', entity:'Fund II', owner:'Anita Kapoor', frequency:'Quarterly', due:'31 Jul 2026', status:'Not Started', progress:0, channel:'Regulatory Portal' }
  ];

  const documents = [
    { id:'DOC-001', folder:'Application', name:'Full Online Application.pdf', type:'PDF', version:'v1.0', owner:'Nova Analytics', uploaded:'1 Jul 2026', status:'Verified', access:'Internal' },
    { id:'DOC-002', folder:'Corporate & Legal', name:'Certificate of Incorporation.pdf', type:'PDF', version:'v2.1', owner:'Tendai Moyo', uploaded:'10 Jul 2026', status:'Verified', access:'Internal' },
    { id:'DOC-003', folder:'Corporate & Legal', name:'Directors Register (CR6).pdf', type:'PDF', version:'v1.3', owner:'Nyasha Moyo', uploaded:'10 Jul 2026', status:'In review', access:'Internal' },
    { id:'DOC-004', folder:'Corporate & Legal', name:'Shareholders Agreement Draft v4.docx', type:'DOCX', version:'v4.0', owner:'Farai Chikore', uploaded:'9 Jul 2026', status:'In review', access:'Internal / External' },
    { id:'DOC-005', folder:'Financial', name:'FY2025 Audited Financial Statements.pdf', type:'PDF', version:'v1.0', owner:'Nova Analytics', uploaded:'5 Jul 2026', status:'Verified', access:'Internal' },
    { id:'DOC-006', folder:'Financial', name:'Management Accounts Q2 2026.xlsx', type:'XLSX', version:'v1.2', owner:'Tendai Moyo', uploaded:'8 Jul 2026', status:'Verified', access:'Internal' },
    { id:'DOC-007', folder:'Commercial', name:'Customer Cohort Analysis.xlsx', type:'XLSX', version:'v1.1', owner:'Nyasha Moyo', uploaded:'7 Jul 2026', status:'Needs update', access:'Internal / External' },
    { id:'DOC-008', folder:'Due Diligence', name:'Financial DD Report.pdf', type:'PDF', version:'v2.0', owner:'Tendai Moyo', uploaded:'12 Jul 2026', status:'Verified', access:'Internal' },
    { id:'DOC-009', folder:'Term Sheet', name:'Term Sheet - Current.pdf', type:'PDF', version:'v4.0', owner:'Farai Chikore', uploaded:'13 Jul 2026', status:'In review', access:'Internal / External' },
    { id:'DOC-010', folder:'Committee Pack', name:'Investment Committee Pack.pdf', type:'PDF', version:'v1.0', owner:'Nyasha Moyo', uploaded:'14 Jul 2026', status:'Verified', access:'Internal' },
    { id:'DOC-011', folder:'Closing & Disbursement', name:'Closing Conditions Checklist.xlsx', type:'XLSX', version:'v1.0', owner:'Tendai Moyo', uploaded:'16 Jul 2026', status:'In review', access:'Internal' }
  ];


  documents.push(
    { id:'DOC-FUND-001', folder:'Legal', name:'Limited Partnership Agreement.pdf', type:'PDF', version:'v4.2', owner:'Legal & Governance', uploaded:'12 Jun 2026', status:'Verified', access:'Internal / LP' },
    { id:'DOC-FUND-002', folder:'Fundraising', name:'Private Placement Memorandum.pdf', type:'PDF', version:'v3.1', owner:'Investor Relations', uploaded:'4 Apr 2026', status:'Verified', access:'Internal / LP' },
    { id:'DOC-FUND-003', folder:'Legal', name:'Side Letter Register.xlsx', type:'XLSX', version:'v8.0', owner:'Legal & Governance', uploaded:'15 Jul 2026', status:'In review', access:'Restricted' },
    { id:'DOC-FUND-004', folder:'Valuation', name:'Q2 2026 Valuation Pack.pdf', type:'PDF', version:'v1.0', owner:'Investment Team', uploaded:'10 Jul 2026', status:'Verified', access:'Internal' },
    { id:'DOC-FUND-005', folder:'Investor Reporting', name:'Capital Account Statements Q2.zip', type:'ZIP', version:'v1.0', owner:'Fund Accounting', uploaded:'14 Jul 2026', status:'Verified', access:'LP Portal' },
    { id:'DOC-FUND-006', folder:'ESG', name:'ESG & Impact Report 2025.pdf', type:'PDF', version:'v2.0', owner:'Monitoring & Evaluation', uploaded:'28 Jun 2026', status:'Verified', access:'Internal / LP' },
    { id:'DOC-FUND-007', folder:'Audit', name:'Audit Findings and Responses.docx', type:'DOCX', version:'v1.4', owner:'Fund Accounting', uploaded:'11 Jul 2026', status:'Needs update', access:'Internal' },
    { id:'DOC-LP-001', folder:'LP Legal', name:'Limited Partnership Agreement', type:'PDF', version:'v3.0', owner:'Legal & Governance', uploaded:'12 Feb 2021', status:'Executed', access:'Internal / LP' },
    { id:'DOC-LP-002', folder:'LP Legal', name:'Side Letter', type:'PDF', version:'v2.1', owner:'Legal & Governance', uploaded:'18 Feb 2021', status:'Executed', access:'Restricted' },
    { id:'DOC-LP-003', folder:'KYC', name:'KYC Annual Review 2025', type:'PDF', version:'v1.0', owner:'Compliance', uploaded:'25 Jul 2025', status:'Verified', access:'Internal' },
    { id:'DOC-LP-004', folder:'KYC', name:'Beneficial Ownership Declaration', type:'PDF', version:'v1.2', owner:'Compliance', uploaded:'2 Jul 2026', status:'In Review', access:'Internal / LP' },
    { id:'DOC-LP-005', folder:'Financial', name:'Audited Financial Statements 2024', type:'PDF', version:'v1.0', owner:'Fund Accounting', uploaded:'18 Jul 2026', status:'Outstanding', access:'Internal / LP' },
    { id:'DOC-LP-006', folder:'Tax', name:'Tax Residence Certificate', type:'PDF', version:'v1.1', owner:'Fund Accounting', uploaded:'5 Jun 2026', status:'Verified', access:'Internal' },
    { id:'DOC-LP-007', folder:'Reporting', name:'Capital Account Statement Q2 2026', type:'PDF', version:'v1.0', owner:'Fund Accounting', uploaded:'7 Jul 2026', status:'Delivered', access:'LP Portal' },
    { id:'DOC-LP-008', folder:'Reporting', name:'Investor Update Q2 2026', type:'PDF', version:'v1.0', owner:'Investor Relations', uploaded:'7 Jul 2026', status:'Acknowledged', access:'LP Portal' }
  );

  function documentIdForName(name) {
    const normalise = value => String(value || '').replace(/\.(pdf|docx|xlsx|xls|csv|zip)$/i,'').trim().toLowerCase();
    const target = normalise(name);
    return (documents.find(doc => normalise(doc.name) === target) || documents[0]).id;
  }

  documents.forEach((doc,index) => Object.assign(doc, {
    category: doc.folder,
    size: doc.type === 'XLSX' ? `${(1.1 + index * .17).toFixed(1)} MB` : `${(380 + index * 73)} KB`,
    signatureStatus: /Term Sheet|Shareholders Agreement|Committee Pack/.test(doc.name) ? (index % 2 ? 'Awaiting signature' : 'Partially signed') : 'Not required',
    retention: index % 3 === 0 ? 'Fund life + 10 years' : '7 years',
    classification: doc.access.includes('External') ? 'Confidential' : 'Internal confidential',
    pages: doc.type === 'PDF' ? 8 + index : 1
  }));

  const cashAccounts = [
    { id:'FCA-2001', fund:'Matanho Growth Fund II', vehicle:'MGF-II Main', purpose:'SUBSCRIPTION_COLLECTION', provider:'CBZ Bank Zimbabwe', masked:'••••2001', currency:'USD', ownership:'SEGREGATED', status:'ACTIVE', posted:63800000, settled:62700000, reserved:12000000, held:1800000, expectedIn:15000000, expectedOut:8500000, deployable:48900000, distributable:31200000, reconHealth:98.6, lastStatement:'31 Jul 2026', tolerance:100, gl:'USD Subscription Cash Control' },
    { id:'FCA-2038', fund:'Matanho Growth Fund II', vehicle:'MGF-II Main', purpose:'INVESTMENT_DISBURSEMENT', provider:'Stanbic Zimbabwe', masked:'••••2038', currency:'USD', ownership:'SEGREGATED', status:'ACTIVE', posted:27450000, settled:27450000, reserved:6000000, held:0, expectedIn:0, expectedOut:12000000, deployable:19450000, distributable:0, reconHealth:100, lastStatement:'31 Jul 2026', tolerance:100, gl:'USD Investment Bank Cash' },
    { id:'FCA-3372', fund:'Matanho Venture Fund I', vehicle:'MVF-I Main', purpose:'FUND_OPERATING_BANK', provider:'Ecobank Zimbabwe', masked:'••••3372', currency:'USD', ownership:'SEGREGATED', status:'ACTIVE', posted:18300000, settled:17800000, reserved:3200000, held:250000, expectedIn:5000000, expectedOut:2100000, deployable:13850000, distributable:8600000, reconHealth:94.2, lastStatement:'30 Jul 2026', tolerance:75, gl:'USD Operating Cash' },
    { id:'FCA-8840', fund:'Matanho Climate & Infrastructure I', vehicle:'MCIF-I Holding', purpose:'ESCROW_OR_CUSTODY', provider:'FBC Custody', masked:'••••8840', currency:'USD', ownership:'HYBRID', status:'ACTIVE', posted:44200000, settled:44200000, reserved:15000000, held:2500000, expectedIn:22000000, expectedOut:9500000, deployable:26700000, distributable:12200000, reconHealth:91.7, lastStatement:'29 Jul 2026', tolerance:250, gl:'Custody Cash Control' },
    { id:'FCA-7611', fund:'Matanho SME Growth Fund', vehicle:'MSGF Main', purpose:'FUND_OPERATING_BANK', provider:'NMB Bank', masked:'••••7611', currency:'ZWG', ownership:'SEGREGATED', status:'ACTIVE', posted:15400000, settled:14800000, reserved:2100000, held:900000, expectedIn:4800000, expectedOut:2600000, deployable:11800000, distributable:5200000, reconHealth:87.4, lastStatement:'28 Jul 2026', tolerance:5000, gl:'ZWG Operating Cash' },
    { id:'FCA-9925', fund:'Matanho Opportunity Fund', vehicle:'MOF Main', purpose:'PORTFOLIO_PROCEEDS', provider:'Standard Chartered', masked:'••••9925', currency:'USD', ownership:'OMNIBUS', status:'SUSPENDED', posted:35600000, settled:34600000, reserved:0, held:4400000, expectedIn:18000000, expectedOut:0, deployable:30200000, distributable:24700000, reconHealth:76.3, lastStatement:'25 Jul 2026', tolerance:100, gl:'Portfolio Proceeds Control' }
  ];

  const cashJournals = [
    { id:'JRN-2026-07198', source:'CC-2026-0038', event:'Capital-call receipt', account:'FCA-2001', fund:'Matanho Growth Fund II', valueDate:'31 Jul 2026', debit:15000000, credit:15000000, signed:15000000, status:'POSTED', reconciled:15000000, accounting:'Exported', maker:'Nyasha Moyo', checker:'Rudo Ndlovu' },
    { id:'JRN-2026-07197', source:'DISB-NOVA-001', event:'Investment disbursement', account:'FCA-2038', fund:'Matanho Growth Fund II', valueDate:'30 Jul 2026', debit:12000025, credit:12000025, signed:-12000025, status:'POSTED', reconciled:12000025, accounting:'Exported', maker:'Tendai Moyo', checker:'Farai Chikore' },
    { id:'JRN-2026-07196', source:'EXP-7221', event:'Fund expense', account:'FCA-3372', fund:'Matanho Venture Fund I', valueDate:'30 Jul 2026', debit:125000, credit:125000, signed:-125000, status:'POSTED', reconciled:125000, accounting:'Pending export', maker:'Chipo Dube', checker:'Anita Kapoor' },
    { id:'JRN-2026-07195', source:'PROC-EXIT-119', event:'Portfolio proceeds', account:'FCA-9925', fund:'Matanho Opportunity Fund', valueDate:'29 Jul 2026', debit:8500000, credit:8500000, signed:8500000, status:'POSTED', reconciled:7800000, accounting:'Exported', maker:'Nyasha Moyo', checker:'Rudo Ndlovu' },
    { id:'JRN-2026-07194', source:'MAN-ADJ-082', event:'Manual correction', account:'FCA-7611', fund:'Matanho SME Growth Fund', valueDate:'29 Jul 2026', debit:240000, credit:240000, signed:-240000, status:'PENDING_APPROVAL', reconciled:0, accounting:'Not exported', maker:'Tariro Moyo', checker:'—' }
  ];

  const cashReservations = [
    { id:'RSV-00091', source:'DISB-NOVA-002', fund:'Matanho Growth Fund II', vehicle:'MGF-II Main', account:'FCA-2038', beneficiary:'Nova Analytics', amount:12000000, remaining:12000000, required:'08 Aug 2026', expiry:'12 Aug 2026', purpose:'INVESTMENT_DISBURSEMENT', status:'ACTIVE', owner:'Nyasha Moyo', approval:'Approved' },
    { id:'RSV-00090', source:'DIST-Q3-2026', fund:'Matanho Opportunity Fund', vehicle:'MOF Main', account:'FCA-9925', beneficiary:'14 Limited Partners', amount:8500000, remaining:6000000, required:'15 Aug 2026', expiry:'20 Aug 2026', purpose:'INVESTOR_DISTRIBUTION', status:'PARTIALLY_CONSUMED', owner:'Tendai Moyo', approval:'Approved' },
    { id:'RSV-00089', source:'EXP-LEGAL-113', fund:'Matanho Venture Fund I', vehicle:'MVF-I Main', account:'FCA-3372', beneficiary:'Mawere Legal', amount:450000, remaining:450000, required:'05 Aug 2026', expiry:'10 Aug 2026', purpose:'FUND_EXPENSE', status:'APPROVED', owner:'Chipo Dube', approval:'Approved' },
    { id:'RSV-00088', source:'DISB-GREEN-022', fund:'Matanho Climate & Infrastructure I', vehicle:'MCIF-I Holding', account:'FCA-8840', beneficiary:'GreenOrbit Energy', amount:15000000, remaining:15000000, required:'21 Aug 2026', expiry:'28 Aug 2026', purpose:'INVESTMENT_DISBURSEMENT', status:'REQUESTED', owner:'Rudo Ndlovu', approval:'Pending checker' }
  ];

  const statementImports = [
    { id:'IMP-2026-0081', provider:'CBZ Bank Zimbabwe', account:'FCA-2001 · ••••2001', period:'01–31 Jul 2026', filename:'CBZ_USD_2001_JUL2026.csv', lines:348, opening:47700000, movements:15000000, closing:62700000, status:'COMMITTED', errors:0, warnings:1, duplicate:'Clear', received:'31 Jul 2026 · 18:42', parser:'CBZ CSV v4.2' },
    { id:'IMP-2026-0080', provider:'Ecobank Zimbabwe', account:'FCA-3372 · ••••3372', period:'01–31 Jul 2026', filename:'ECOBANK_MVFI_JUL.xlsx', lines:192, opening:15300000, movements:2500000, closing:17800000, status:'PENDING_APPROVAL', errors:0, warnings:3, duplicate:'Clear', received:'31 Jul 2026 · 17:19', parser:'Ecobank XLSX v2.7' },
    { id:'IMP-2026-0079', provider:'FBC Custody', account:'FCA-8840 · ••••8840', period:'15–31 Jul 2026', filename:'FBC_CUSTODY_8840_20260731.xlsx', lines:86, opening:40200000, movements:4000000, closing:44200000, status:'VALIDATION_FAILED', errors:2, warnings:1, duplicate:'Possible overlap', received:'31 Jul 2026 · 16:08', parser:'FBC Custody v1.9' },
    { id:'IMP-2026-0078', provider:'NMB Bank', account:'FCA-7611 · ••••7611', period:'01–28 Jul 2026', filename:'NMB_ZWG_7611.csv', lines:441, opening:12100000, movements:2700000, closing:14800000, status:'STAGED', errors:0, warnings:2, duplicate:'Clear', received:'29 Jul 2026 · 09:25', parser:'NMB CSV v3.1' }
  ];

  const reconciliationBatches = [
    { id:'REC-2026-0731-01', account:'FCA-2001 · ••••2001', fund:'Matanho Growth Fund II', currency:'USD', period:'Jul 2026', opening:47700000, internal:62700000, external:62700000, adjusted:62700000, variance:0, matched:98.6, breaks:2, status:'PENDING_APPROVAL', owner:'Nyasha Moyo', approvals:'1 / 2' },
    { id:'REC-2026-0731-02', account:'FCA-2038 · ••••2038', fund:'Matanho Growth Fund II', currency:'USD', period:'Jul 2026', opening:39450000, internal:27450000, external:27450000, adjusted:27450000, variance:0, matched:100, breaks:0, status:'READY_TO_CLOSE', owner:'Tendai Moyo', approvals:'2 / 2' },
    { id:'REC-2026-0731-03', account:'FCA-3372 · ••••3372', fund:'Matanho Venture Fund I', currency:'USD', period:'Jul 2026', opening:15300000, internal:18300000, external:17800000, adjusted:18175000, variance:-125000, matched:94.2, breaks:4, status:'RECONCILING', owner:'Chipo Dube', approvals:'0 / 2' },
    { id:'REC-2026-0731-04', account:'FCA-8840 · ••••8840', fund:'Matanho Climate & Infrastructure I', currency:'USD', period:'Jul 2026', opening:40200000, internal:44200000, external:44200000, adjusted:44200000, variance:0, matched:91.7, breaks:3, status:'BLOCKED', owner:'Rudo Ndlovu', approvals:'0 / 2' },
    { id:'REC-2026-0728-05', account:'FCA-7611 · ••••7611', fund:'Matanho SME Growth Fund', currency:'ZWG', period:'Jul 2026', opening:12100000, internal:15400000, external:14800000, adjusted:15240000, variance:-160000, matched:87.4, breaks:5, status:'RECONCILING', owner:'Tariro Moyo', approvals:'0 / 2' }
  ];

  const reconciliationExceptions = [
    { id:'EXC-00418', batch:'REC-2026-0731-03', code:'AMOUNT_VARIANCE', account:'FCA-3372', amount:125000, currency:'USD', severity:'High', owner:'Chipo Dube', age:2, due:'02 Aug 2026', status:'INVESTIGATING', evidence:3, resolution:'Review bank charge allocation' },
    { id:'EXC-00417', batch:'REC-2026-0731-04', code:'MISSING_STATEMENT', account:'FCA-8840', amount:0, currency:'USD', severity:'Critical', owner:'Rudo Ndlovu', age:3, due:'01 Aug 2026', status:'ASSIGNED', evidence:1, resolution:'Request complete custody statement' },
    { id:'EXC-00416', batch:'REC-2026-0728-05', code:'UNMATCHED_EXTERNAL', account:'FCA-7611', amount:240000, currency:'ZWG', severity:'Medium', owner:'Tariro Moyo', age:3, due:'03 Aug 2026', status:'OPEN', evidence:2, resolution:'Identify beneficiary and purpose' },
    { id:'EXC-00415', batch:'REC-2026-0731-01', code:'STALE_RESERVATION', account:'FCA-2001', amount:1200000, currency:'USD', severity:'Medium', owner:'Nyasha Moyo', age:5, due:'02 Aug 2026', status:'PROPOSED_RESOLUTION', evidence:4, resolution:'Release unused balance' },
    { id:'EXC-00414', batch:'REC-2026-0731-01', code:'DATE_VARIANCE', account:'FCA-2001', amount:350000, currency:'USD', severity:'Low', owner:'Nyasha Moyo', age:1, due:'05 Aug 2026', status:'PENDING_APPROVAL', evidence:2, resolution:'Approve timing item' }
  ];

  const reportVaultItems = [
    { id:'RVA-001', name:'Q2 2026 Fund Report Pack', fund:'Matanho Growth Fund II', period:'Q2 2026', type:'Quarterly LP Report', version:'v2.3', status:'Published', owner:'Sarah Mitchell', generated:'16 Jul 2026', pages:46, recipients:38, classification:'Confidential' },
    { id:'RVA-002', name:'July 2026 Investment Committee Pack', fund:'Matanho Growth Fund II', period:'Jul 2026', type:'IC Pack', version:'v1.4', status:'Approved', owner:'Nyasha Moyo', generated:'29 Jul 2026', pages:72, recipients:7, classification:'Restricted' },
    { id:'RVA-003', name:'Q2 Portfolio Valuation Report', fund:'All Funds', period:'Q2 2026', type:'Valuation Report', version:'v3.1', status:'Approved', owner:'Laura Chen', generated:'21 Jul 2026', pages:88, recipients:12, classification:'Confidential' },
    { id:'RVA-004', name:'July Cash & Reconciliation Evidence Pack', fund:'All Funds', period:'Jul 2026', type:'Operations Evidence', version:'v0.9', status:'In Review', owner:'Tendai Moyo', generated:'31 Jul 2026', pages:134, recipients:5, classification:'Restricted' },
    { id:'RVA-005', name:'2026 ESG & Impact Portfolio Review', fund:'All Funds', period:'H1 2026', type:'ESG Report', version:'v1.0', status:'Draft', owner:'Anita Kapoor', generated:'28 Jul 2026', pages:54, recipients:0, classification:'Internal' }
  ];

  const signatureEnvelopes = [
    { id:'ENV-0098', documentId:'DOC-009', document:'Term Sheet - Current.pdf', subject:'Nova Analytics Series B Term Sheet', recipients:[['Tariro Kasere','Arcus signatory','Signed'],['Tendai Moyo','Company signatory','Pending']], status:'Waiting for others', sent:'31 Jul 2026 · 11:22', expires:'14 Aug 2026', progress:50 },
    { id:'ENV-0097', documentId:'DOC-004', document:'Shareholders Agreement Draft v4.docx', subject:'Nova Analytics Shareholders Agreement', recipients:[['Farai Chikore','Legal reviewer','Signed'],['Tendai Moyo','Company signatory','Signed'],['Nyasha Moyo','Fund signatory','Pending']], status:'In progress', sent:'30 Jul 2026 · 15:06', expires:'13 Aug 2026', progress:67 },
    { id:'ENV-0096', documentId:'DOC-010', document:'Investment Committee Pack.pdf', subject:'IC Resolution Acknowledgement', recipients:[['Tariro Kasere','Chairperson','Signed'],['Munyaradzi Manyara','Member','Signed'],['Nokuthula Moyo','Member','Signed']], status:'Completed', sent:'15 Jul 2026 · 16:40', expires:'—', progress:100 },
    { id:'ENV-0095', documentId:'DOC-003', document:'Directors Register (CR6).pdf', subject:'Certified Directors Register', recipients:[['Tendai Moyo','Company secretary','Declined']], status:'Action required', sent:'13 Jul 2026 · 09:14', expires:'05 Aug 2026', progress:0 }
  ];

  const mailerLists = [
    { id:'ML-001', name:'Fund II Quarterly LPs', description:'Quarterly reporting audience for Matanho Growth Fund II.', source:'LP master + portal consent', members:38, active:37, pending:1, bounced:0, owner:'Nyasha Moyo', updated:'31 Jul 2026 · 17:22', status:'Active', channels:['Secure email','LP portal'], tags:['MGF-II','Quarterly'], funds:['Matanho Growth Fund II'], consent:'Verified', campaigns:12 },
    { id:'ML-002', name:'Investment Committee & Board', description:'IC members, board observers and approved governance recipients.', source:'Governance register', members:14, active:14, pending:0, bounced:0, owner:'Farai Chikore', updated:'31 Jul 2026 · 12:04', status:'Active', channels:['Secure email'], tags:['IC','Governance'], funds:['All Funds'], consent:'Internal authority', campaigns:18 },
    { id:'ML-003', name:'Climate Fund Capital Calls', description:'LP contacts authorised to receive capital-call notices for MCIF-I.', source:'Commitment register', members:22, active:21, pending:1, bounced:0, owner:'Rudo Ndlovu', updated:'30 Jul 2026 · 15:40', status:'Active', channels:['Secure email','LP portal'], tags:['MCIF-I','Capital calls'], funds:['Matanho Climate & Infrastructure I'], consent:'Verified', campaigns:7 },
    { id:'ML-004', name:'Portfolio CFO Network', description:'Finance leaders at active portfolio companies for data and reporting requests.', source:'Portfolio contacts', members:31, active:28, pending:2, bounced:1, owner:'Tendai Moyo', updated:'29 Jul 2026 · 09:18', status:'Review', channels:['Email'], tags:['Portfolio','Finance'], funds:['All Funds'], consent:'Business relationship', campaigns:9 },
    { id:'ML-005', name:'Annual Meeting Invitees', description:'Approved investors, advisers and portfolio leaders for the annual meeting.', source:'Event audience rules', members:96, active:91, pending:4, bounced:1, owner:'Chipo Dube', updated:'28 Jul 2026 · 14:55', status:'Draft', channels:['Email','Event portal'], tags:['Annual meeting','Events'], funds:['All Funds'], consent:'Mixed · review required', campaigns:2 },
    { id:'ML-006', name:'Zimbabwe Regulatory Reporting', description:'Internal owners and authorised external contacts for Zimbabwe regulatory packs.', source:'Compliance contact register', members:9, active:9, pending:0, bounced:0, owner:'Anita Kapoor', updated:'27 Jul 2026 · 10:31', status:'Active', channels:['Secure email'], tags:['Compliance','Zimbabwe'], funds:['All Funds'], consent:'Regulatory authority', campaigns:16 }
  ];

  const termSheetSections = [
    { name:'Investment Structure', icon:'layers', clauses:[
      {title:'Instrument', reference:'Section 1.1', status:'Agreed', source:'IC mandate · RES-IC-2026-014', owner:'Farai Chikore', updated:'12 Jul 2026 · 09:40', matanho:'Series B redeemable preferred shares issued by Nova Analytics (Pvt) Ltd.', company:'Agreed without amendment.', value:'USD 18.0M'},
      {title:'Tranche Structure', reference:'Section 1.2', status:'Agreed', source:'Disbursement schedule · DISB-NOVA-001', owner:'Tendai Moyo', updated:'12 Jul 2026 · 11:05', matanho:'USD 12.0M at closing and USD 6.0M on agreed ARR and customer milestones.', company:'Agreed, subject to a 30-day cure period.', value:'2 tranches'}
    ]},
    { name:'Valuation & Ownership', icon:'pie-chart', clauses:[
      {title:'Pre-Money Valuation', reference:'Section 2.1', status:'Agreed', source:'Valuation memo · VAL-NOVA-Q2-2026', owner:'Nyasha Moyo', updated:'11 Jul 2026 · 15:18', matanho:'USD 85.0M fully diluted pre-money valuation.', company:'Agreed.', value:'USD 85.0M'},
      {title:'Investor Ownership', reference:'Section 2.2', status:'Agreed', source:'Cap table model · CAP-NOVA-v8', owner:'Nyasha Moyo', updated:'11 Jul 2026 · 15:18', matanho:'17.5% fully diluted ownership at initial closing.', company:'Agreed subject to final option-pool calculation.', value:'17.5%'},
      {title:'Option Pool', reference:'Section 2.3', status:'Agreed', source:'Cap table model · CAP-NOVA-v8', owner:'Farai Chikore', updated:'12 Jul 2026 · 08:48', matanho:'10% post-money employee option pool.', company:'Agreed.', value:'10.0%'}
    ]},
    { name:'Economic Rights', icon:'dollar', clauses:[
      {title:'Liquidation Preference', reference:'Section 3.1', status:'Open', source:'Negotiation redline · TS-NOVA-v4', owner:'Farai Chikore', updated:'13 Jul 2026 · 16:20', matanho:'1.0x non-participating liquidation preference senior to ordinary shares.', company:'1.0x non-participating preference, pari passu with existing Series A.', value:'1.0x'},
      {title:'Anti-Dilution', reference:'Section 3.2', status:'Agreed', source:'Term-sheet policy · PM-LEGAL-2026-04', owner:'Farai Chikore', updated:'12 Jul 2026 · 13:42', matanho:'Broad-based weighted-average anti-dilution protection.', company:'Agreed.', value:'Weighted average'},
      {title:'Dividend Rights', reference:'Section 3.3', status:'Agreed', source:'Fund mandate · MGF-II-LPA', owner:'Tariro Kasere', updated:'12 Jul 2026 · 14:05', matanho:'Non-cumulative dividends when declared by the board.', company:'Agreed.', value:'Non-cumulative'}
    ]},
    { name:'Governance', icon:'users', clauses:[
      {title:'Board Composition', reference:'Section 4.1', status:'Agreed', source:'Governance schedule · GOV-NOVA-v3', owner:'Tariro Kasere', updated:'12 Jul 2026 · 14:32', matanho:'Five directors: two founders, one Matanho nominee and two independent directors.', company:'Agreed subject to independent-director shortlist.', value:'5 directors'},
      {title:'Reserved Matters', reference:'Section 4.2', status:'Agreed', source:'Reserved matters matrix · GOV-NOVA-v3', owner:'Farai Chikore', updated:'12 Jul 2026 · 15:10', matanho:'Investor consent required for material debt, acquisitions, disposals and constitutional changes.', company:'Agreed with materiality thresholds.', value:'18 matters'},
      {title:'Information Rights', reference:'Section 4.3', status:'Agreed', source:'Reporting covenant · INFO-NOVA-v2', owner:'Tendai Moyo', updated:'13 Jul 2026 · 09:15', matanho:'Monthly management accounts, quarterly board reporting and annual audited statements.', company:'Agreed.', value:'Monthly / quarterly'},
      {title:'Board Observer Rights', reference:'Section 4.4', status:'Open', source:'Negotiation redline · TS-NOVA-v4', owner:'Farai Chikore', updated:'13 Jul 2026 · 16:20', matanho:'Matanho may appoint one non-voting observer to all board and committee meetings and receive director materials.', company:'Observer may attend board meetings only and receive board materials solely for those meetings.', value:'1 observer'}
    ]},
    { name:'Investor Protections', icon:'shield', clauses:[
      {title:'Pre-Emption Rights', reference:'Section 5.1', status:'Agreed', source:'Investor rights schedule · TS-NOVA-v4', owner:'Farai Chikore', updated:'12 Jul 2026 · 15:45', matanho:'Pro-rata participation rights in future issuances.', company:'Agreed.', value:'Pro-rata'},
      {title:'Tag & Drag Rights', reference:'Section 5.2', status:'Agreed', source:'Shareholders agreement outline · SHA-NOVA-v2', owner:'Farai Chikore', updated:'12 Jul 2026 · 16:10', matanho:'Customary tag-along and drag-along rights subject to approved thresholds.', company:'Agreed.', value:'Customary'}
    ]},
    { name:'Founder Matters', icon:'user-check', clauses:[
      {title:'Founder Vesting', reference:'Section 6.1', status:'Agreed', source:'Founder schedule · FND-NOVA-v2', owner:'Tendai Moyo', updated:'12 Jul 2026 · 16:55', matanho:'36-month reverse vesting with 12-month cliff for unvested founder shares.', company:'Agreed with credit for time served.', value:'36 months'},
      {title:'Restrictive Covenants', reference:'Section 6.2', status:'Agreed', source:'Legal diligence · DD-LEGAL-022', owner:'Farai Chikore', updated:'13 Jul 2026 · 08:20', matanho:'Confidentiality, non-solicitation and enforceable non-compete protections.', company:'Agreed subject to local-law limitations.', value:'Customary'}
    ]},
    { name:'Conditions Precedent', icon:'check-circle', clauses:[
      {title:'Closing Conditions', reference:'Section 7.1', status:'Open', source:'Closing checklist · CLOSE-NOVA-v6', owner:'Tendai Moyo', updated:'13 Jul 2026 · 15:50', matanho:'Completion of KYC, bank verification, IP title confirmation, customer-concentration covenant and tax clearance.', company:'All complete except final CP satisfaction certificate.', value:'7 / 8 complete'}
    ]},
    { name:'Legal & Closing', icon:'gavel', clauses:[
      {title:'Definitive Documents', reference:'Section 8.1', status:'Agreed', source:'Legal workplan · LEGAL-NOVA-2026', owner:'Farai Chikore', updated:'13 Jul 2026 · 12:42', matanho:'Subscription agreement, shareholders agreement, amended constitution and disclosure letter.', company:'Agreed.', value:'4 documents'},
      {title:'Target Closing', reference:'Section 8.2', status:'Agreed', source:'Closing plan · CLOSE-NOVA-v6', owner:'Tendai Moyo', updated:'13 Jul 2026 · 14:10', matanho:'Target first closing on 25 July 2026.', company:'Agreed subject to completion evidence.', value:'25 Jul 2026'}
    ]}
  ];


  const closeControls = [
    { id:'CLOSE-01', title:'External statements complete', passed:false, category:'External evidence', severity:'Critical', detail:'FBC Custody statement missing for FCA-8840.', owner:'Rudo Ndlovu', due:'01 Aug 2026', amount:44200000, currency:'USD', rule:'Every active bank, custody and escrow account must have a committed, continuous statement through period end.', source:'Statement coverage service · STM-COVER-v4', updated:'01 Aug 2026 · 00:42 CAT', evidence:['Provider request #FBC-7741','Prior statement 30 Jun 2026','Account mapping FCA-8840'], remediation:['Request the complete custody statement','Validate file hash and account mapping','Commit the approved statement batch','Re-run transaction and balance reconciliation'], records:[['FCA-8840','FBC Custody','Missing','31 Jul 2026','Critical'],['FCA-2001','CBZ Bank Zimbabwe','Received','31 Jul 2026','Pass'],['FCA-2038','Stanbic Zimbabwe','Received','31 Jul 2026','Pass']] },
    { id:'CLOSE-02', title:'Opening balance continuity', passed:true, category:'Balance proof', severity:'Info', detail:'All approved prior closing balances agree.', owner:'Laura Chen', due:'Complete', amount:0, currency:'USD', rule:'Current opening balance must equal the prior approved close version for every account and currency.', source:'Close continuity service · CLOSE-CONT-v3', updated:'31 Jul 2026 · 23:18 CAT', evidence:['June 2026 close v2','Opening balance control report'], remediation:['No action required'], records:[['USD accounts','Prior close v2','Continuous','0.00','Pass'],['ZWG accounts','Prior close v1','Continuous','0.00','Pass']] },
    { id:'CLOSE-03', title:'Internal journals balanced', passed:true, category:'Ledger control', severity:'Info', detail:'Five journals checked; total debits equal total credits.', owner:'Laura Chen', due:'Complete', amount:35600000, currency:'USD', rule:'Every posted journal must balance by required currency group and remain immutable.', source:'Cash ledger control · LED-BAL-v5', updated:'31 Jul 2026 · 23:32 CAT', evidence:['Journal control total 9F2A…71C8','Five approval records'], remediation:['No action required'], records:[['JRN-2026-07198','15,000,000.00','15,000,000.00','0.00','Pass'],['JRN-2026-07197','12,000,025.00','12,000,025.00','0.00','Pass'],['JRN-2026-07196','125,000.00','125,000.00','0.00','Pass']] },
    { id:'CLOSE-04', title:'Transaction reconciliation', passed:false, category:'Matching', severity:'High', detail:'Fourteen residual lines remain unmatched or partially matched.', owner:'Chipo Dube', due:'02 Aug 2026', amount:715000, currency:'USD', rule:'Every material internal and external line must be matched, explained or approved as an open item.', source:'Reconciliation engine · REC-MATCH-v7', updated:'01 Aug 2026 · 00:51 CAT', evidence:['REC-2026-0731-03','Candidate score export','Residual ageing report'], remediation:['Review exact and suggested candidates','Resolve competing candidates','Approve valid timing items','Raise exceptions for unresolved residuals'], records:[['EXT-88398','JRN-2026-07196','125,000.00','91%','Suggested'],['EXT-88412','—','350,000.00','—','Unmatched external'],['—','JRN-2026-07195','240,000.00','68%','Weak suggestion']] },
    { id:'CLOSE-05', title:'Balance reconciliation', passed:false, category:'Balance proof', severity:'High', detail:'USD 125,000 variance exceeds the USD 100 tolerance.', owner:'Chipo Dube', due:'02 Aug 2026', amount:125000, currency:'USD', rule:'Absolute adjusted-external versus internal closing variance must be within the effective account and currency tolerance.', source:'Balance reconciliation · REC-BAL-v4', updated:'01 Aug 2026 · 00:56 CAT', evidence:['REC-2026-0731-03 balance proof','Tolerance policy USD-CASH-STD v4'], remediation:['Validate timing items','Review bank charge allocation','Post an approved correction or explain the difference','Re-run balance proof'], records:[['Internal closing','18,300,000.00','Ledger','Approved',''],['Adjusted external','18,175,000.00','Statement + timing items','Calculated',''],['Variance','(125,000.00)','Control','Above tolerance','Blocker']] },
    { id:'CLOSE-06', title:'Omnibus allocation proof', passed:true, category:'Beneficial ownership', severity:'Info', detail:'Internal allocations plus approved suspense agree to the external balance.', owner:'Nyasha Moyo', due:'Complete', amount:35600000, currency:'USD', rule:'External omnibus cash must equal beneficial allocations plus approved suspense.', source:'Omnibus allocation service · OMNI-v2', updated:'31 Jul 2026 · 22:47 CAT', evidence:['MOF allocation schedule','Approved suspense register'], remediation:['No action required'], records:[['MOF Main allocation','24,700,000.00','Approved','Pass',''],['Opportunity co-invest','6,500,000.00','Approved','Pass',''],['Approved suspense','4,400,000.00','Approved','Pass','']] },
    { id:'CLOSE-07', title:'Suspense review', passed:false, category:'Exceptions', severity:'Medium', detail:'One suspense item is 12 days old and exceeds its review SLA.', owner:'Anita Kapoor', due:'02 Aug 2026', amount:4400000, currency:'USD', rule:'Suspense must have an owner, reason, evidence and review date and may block close when aged beyond policy.', source:'Suspense ageing · SUSP-v3', updated:'31 Jul 2026 · 23:59 CAT', evidence:['EXC-00417','Provider correspondence','Beneficial-owner investigation'], remediation:['Confirm beneficial owner and purpose','Approve reclassification or return','Link source evidence','Close or formally carry the exception'], records:[['SUSP-0091','Unknown portfolio proceeds','4,400,000.00','12 days','SLA breached']] },
    { id:'CLOSE-08', title:'Reservations review', passed:true, category:'Availability', severity:'Info', detail:'All active reservations have an owner, source event and expiry.', owner:'Tendai Moyo', due:'Complete', amount:21200000, currency:'USD', rule:'Active reservations must remain source-linked, version controlled and visible in availability.', source:'Reservation control · RSV-v4', updated:'31 Jul 2026 · 22:10 CAT', evidence:['Active reservation register','Expiry schedule'], remediation:['No action required'], records:[['RSV-00091','DISB-NOVA-002','12,000,000.00','12 Aug 2026','Pass'],['RSV-00090','DIST-Q3-2026','6,000,000.00','20 Aug 2026','Pass']] },
    { id:'CLOSE-09', title:'Subledger-to-GL control', passed:true, category:'Accounting export', severity:'Info', detail:'Four exports accepted; one journal remains pending without a control variance.', owner:'Laura Chen', due:'01 Aug 2026', amount:35600000, currency:'USD', rule:'Approved subledger debit and credit totals and returned accounting references must agree.', source:'GL export control · GLX-v5', updated:'01 Aug 2026 · 00:31 CAT', evidence:['GL export batch GLX-071','Accounting acknowledgements'], remediation:['Monitor pending acknowledgement'], records:[['GLX-071-A','4 journals','35,600,000.00','Accepted','Pass'],['GLX-071-B','1 journal','240,000.00','Pending','Non-blocking']] },
    { id:'CLOSE-10', title:'Maker-checker approvals', passed:false, category:'Approval', severity:'High', detail:'Compliance review and CFO certification remain incomplete.', owner:'Tariro Kasere', due:'02 Aug 2026', amount:0, currency:'USD', rule:'No controlled close may be approved by its maker or without the configured independent approval route.', source:'Approval policy · APPROVAL-CLOSE-v6', updated:'01 Aug 2026 · 01:02 CAT', evidence:['Cash Operations certification','Fund Accounting certification'], remediation:['Complete Compliance review','Resolve blocking controls','Obtain CFO certification','Lock close version and evidence pack'], records:[['Cash Operations','Nyasha Moyo','Complete','31 Jul 2026','Pass'],['Fund Accounting','Laura Chen','Complete','31 Jul 2026','Pass'],['Compliance / Risk','Anita Kapoor','In review','—','Open'],['CFO Certification','Tariro Kasere','Pending','—','Blocker']] }
  ];

  const reportingCalendarEvents = [
    { id:'CAL-001', date:'2026-07-03', title:'Fund II Q2 reporting data lock', type:'Data lock', owner:'Sarah Mitchell', status:'Complete', reportId:'REP-001', channel:'Internal workflow' },
    { id:'CAL-002', date:'2026-07-08', title:'Nova Analytics board pack draft', type:'Board Pack', owner:'James Davidson', status:'Complete', reportId:'REP-004', channel:'Secure Portal' },
    { id:'CAL-003', date:'2026-07-15', title:'MGF II quarterly report due', type:'Quarterly Report', owner:'Sarah Mitchell', status:'Overdue', reportId:'REP-001', channel:'Email / Portal' },
    { id:'CAL-004', date:'2026-07-17', title:'Nova portfolio report due', type:'Portfolio Report', owner:'James Davidson', status:'In Progress', reportId:'REP-002', channel:'Portal' },
    { id:'CAL-005', date:'2026-07-20', title:'Fund II LP report due', type:'LP Report', owner:'Anita Kapoor', status:'In Progress', reportId:'REP-003', channel:'Email / Portal' },
    { id:'CAL-006', date:'2026-07-21', title:'Nova board pack publication', type:'Board Pack', owner:'James Davidson', status:'In Progress', reportId:'REP-004', channel:'Secure Portal' },
    { id:'CAL-007', date:'2026-07-23', title:'Nyasha Foods valuation memo', type:'Valuation Memo', owner:'Laura Chen', status:'Not Started', reportId:'REP-005', channel:'Email' },
    { id:'CAL-008', date:'2026-07-31', title:'Zimbabwe compliance submission', type:'Compliance', owner:'Anita Kapoor', status:'Not Started', reportId:'REP-006', channel:'Regulatory Portal' },
    { id:'CAL-009', date:'2026-08-05', title:'Q2 investor letter approval', type:'Investor Letter', owner:'Nyasha Moyo', status:'Scheduled', reportId:'REP-003', channel:'Secure email' }
  ];


  const state = {
    page: 'dashboard',
    previousPage: null,
    sidebarCollapsed: storage.get('matanho-portfolio-sidebar','collapsed') !== 'expanded',
    mobileNavOpen: false,
    theme: storage.get('matanho-portfolio-theme','light'),
    activeFund: 'All Funds',
    asOfDate: '31 Jul 2026',
    selectedDealId: 'DL-013',
    dealTab: 'overview',
    dealView: 'list',
    selectedCompanyId: 'CO-001',
    selectedFundId: 'FUND-001',
    selectedLPId: 'LP-001',
    fundTab: 'overview',
    companyTab: 'overview',
    lpTab: 'overview',
    selectedCapitalCallId: 'CC-2026-0038',
    tableSearch: '',
    searchQuery: '',
    drawer: null,
    modal: null,
    popover: null,
    drilldown: null,
    analyticsPeriod: 'Last 8 quarters',
    analyticsView: 'Actual vs plan',
    dragDealId: null,
    selectedFolder: 'Corporate & Legal',
    selectedDocumentId: 'DOC-002',
    reportBuilderTab: 'data',
    reportSection: 2,
    previewReportSection: 0,
    previewReportId: 'RVA-001',
    reportingMonth: '2026-07',
    selectedCalendarDate: '2026-07-15',
    selectedCashAccountId: 'FCA-2001',
    selectedReconciliationId: 'REC-2026-0731-01',
    cashCurrency: 'USD',
    vaultView: 'table',
    selectedEnvelopeId: 'ENV-0098',
    signatureStep: 'prepare',
    termSection: 3,
    termClause: 3,
    termDecisions: {},
    selectedMailerListId: 'ML-001',
    uploadedStatementName: '',
    uploadedStatementType: '',
    reportFilterFund: 'All Funds',
    reportFilterStatus: 'All Statuses',
    reconciliationPeriod: 'Jul 2026',
    dealVote: {
      'Tariro Kasere':'Approve',
      'Munyaradzi Manyara':'Approve with conditions',
      'Nokuthula Moyo':'Approve',
      'Chipo Lunga':'Approve with conditions',
      'Rudo Tawanda':'Approve',
      'Simbarashe Phiri':'Pending',
      'Blessing Zindi':'Pending'
    },
    dueDiligenceTasks: [
      { id:'T1', title:'Validate revenue recognition', analyst:'Tendai Moyo', due:'09 Jul 2026', priority:'High', status:'Complete', evidence:4, comments:2 },
      { id:'T2', title:'Reconcile management accounts', analyst:'Tendai Moyo', due:'10 Jul 2026', priority:'High', status:'Complete', evidence:5, comments:1 },
      { id:'T3', title:'Review cash-flow forecast', analyst:'Tendai Moyo', due:'10 Jul 2026', priority:'Medium', status:'Complete', evidence:4, comments:2 },
      { id:'T4', title:'Test customer concentration', analyst:'Tendai Moyo', due:'11 Jul 2026', priority:'Medium', status:'Complete', evidence:3, comments:1 },
      { id:'T5', title:'Verify tax position', analyst:'Tendai Moyo', due:'11 Jul 2026', priority:'Low', status:'Complete', evidence:2, comments:0 },
      { id:'T6', title:'Confirm working-capital assumptions', analyst:'Tendai Moyo', due:'11 Jul 2026', priority:'Low', status:'Complete', evidence:2, comments:1 }
    ],
    closingConditions: [
      { id:'C1', title:'KYC verified', owner:'Nyasha Moyo', evidence:'KYC report.pdf', due:'10 Jul 2026', complete:true },
      { id:'C2', title:'Bank details verified', owner:'Nyasha Moyo', evidence:'Bank confirmation.pdf', due:'10 Jul 2026', complete:true },
      { id:'C3', title:'Board resolution signed', owner:'Rudo Ndlovu', evidence:'Board resolution.pdf', due:'11 Jul 2026', complete:true },
      { id:'C4', title:'Subscription agreement signed', owner:'Farai Chikore', evidence:'Subscription agreement.pdf', due:'11 Jul 2026', complete:true },
      { id:'C5', title:'IP title confirmation', owner:'Tendai Moyo', evidence:'IP title report.pdf', due:'12 Jul 2026', complete:true },
      { id:'C6', title:'Customer concentration covenant', owner:'Chipo Dube', evidence:'Covenant certification.pdf', due:'12 Jul 2026', complete:true },
      { id:'C7', title:'Tax clearance', owner:'Tinashe Sibanda', evidence:'Tax clearance.pdf', due:'14 Jul 2026', complete:true },
      { id:'C8', title:'CP satisfaction certificate', owner:'Tendai Moyo', evidence:'CP certificate.pdf', due:'17 Jul 2026', complete:false }
    ]
  };


  function cloneForIntegration(value) {
    try { return structuredClone(value); }
    catch { return JSON.parse(JSON.stringify(value)); }
  }

  function publicSnapshot() {
    return {
      state: cloneForIntegration(state),
      data: {
        funds: cloneForIntegration(funds),
        companies: cloneForIntegration(companies),
        deals: cloneForIntegration(deals),
        capitalCalls: cloneForIntegration(capitalCalls),
        lps: cloneForIntegration(lps),
        reports: cloneForIntegration(reports),
        documents: cloneForIntegration(documents),
        cashAccounts: cloneForIntegration(cashAccounts),
        cashJournals: cloneForIntegration(cashJournals),
        cashReservations: cloneForIntegration(cashReservations),
        statementImports: cloneForIntegration(statementImports),
        reconciliationBatches: cloneForIntegration(reconciliationBatches),
        reconciliationExceptions: cloneForIntegration(reconciliationExceptions),
        reportVaultItems: cloneForIntegration(reportVaultItems),
        signatureEnvelopes: cloneForIntegration(signatureEnvelopes),
        mailerLists: cloneForIntegration(mailerLists)
      }
    };
  }

  function replaceCollection(target, incoming) {
    if (!Array.isArray(incoming)) return;
    target.splice(0, target.length, ...incoming);
  }

  function hydrateFromBackend(payload = {}) {
    const source = payload.data || payload;
    replaceCollection(funds, source.funds);
    replaceCollection(companies, source.companies || source.portfolioCompanies);
    replaceCollection(deals, source.deals);
    replaceCollection(capitalCalls, source.capitalCalls);
    replaceCollection(lps, source.lps || source.limitedPartners);
    replaceCollection(reports, source.reports || source.reportingSchedules);
    replaceCollection(documents, source.documents);
    replaceCollection(cashAccounts, source.cashAccounts);
    replaceCollection(cashJournals, source.cashJournals);
    replaceCollection(cashReservations, source.cashReservations);
    replaceCollection(statementImports, source.statementImports);
    replaceCollection(reconciliationBatches, source.reconciliationBatches);
    replaceCollection(reconciliationExceptions, source.reconciliationExceptions);
    replaceCollection(reportVaultItems, source.reportVaultItems);
    replaceCollection(signatureEnvelopes, source.signatureEnvelopes);
    replaceCollection(mailerLists, source.mailerLists);
    if (payload.state && typeof payload.state === 'object') Object.assign(state, payload.state);
    render();
    window.dispatchEvent(new CustomEvent('matanho:data-hydrated', { detail: publicSnapshot() }));
  }

  function emitIntegrationEvent(name, detail = {}, cancelable = false) {
    return window.dispatchEvent(new CustomEvent(name, { detail, cancelable }));
  }

  const workspace = $('#workspace');
  const sidebar = $('#sidebar');
  const primaryNav = $('#primaryNav');
  const drawer = $('#drawer');
  const modalLayer = $('#modalLayer');
  const popoverLayer = $('#popover');
  const commandPalette = $('#commandPalette');
  const scrim = $('#scrim');
  const toastStack = $('#toastStack');
  let lastRenderedPage = null;

  function renderStaticIcons(root = document) {
    $$('[data-icon]', root).forEach(node => {
      node.innerHTML = icon(node.dataset.icon);
    });
    $$('button:not([type])', root).forEach(buttonNode => { buttonNode.type = 'button'; });
    const collapseButton = $('.sidebar-collapse');
    if (collapseButton) {
      const iconSlot = $('.sidebar-collapse-icon', collapseButton);
      if (iconSlot) iconSlot.innerHTML = icon(state.sidebarCollapsed ? 'chevron-right' : 'panel-left');
      else collapseButton.innerHTML = icon(state.sidebarCollapsed ? 'chevron-right' : 'panel-left');
      const label = $('.collapse-label', collapseButton);
      if (label) label.textContent = state.sidebarCollapsed ? 'Expand menu' : 'Collapse menu';
      collapseButton.setAttribute('aria-label', state.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
    }
    const mobileButton = $('.mobile-menu');
    if (mobileButton) mobileButton.innerHTML = icon('menu');
  }

  function statusClass(status = '') {
    const normalized = status.toLowerCase();
    if (/(complete|closed|active|verified|approved|investing|realising|passed|on track|issued)/.test(normalized)) return 'success';
    if (/(review|progress|draft|pending|partially|conditional)/.test(normalized)) return 'warning';
    if (/(overdue|rejected|failed|at risk|needs update|lost)/.test(normalized)) return 'danger';
    if (/(shortlisted|portfolio|info)/.test(normalized)) return 'info';
    return 'neutral';
  }

  function statusPill(status, type = null) {
    return `<span class="status-pill ${type || statusClass(status)}">${escapeHTML(status)}</span>`;
  }

  function metricCard({ label, value, iconName = 'trend-up', accent = 'brand', foot = '', trend = 'positive', action = '', spark = null }) {
    const palettes = {
      brand: ['var(--brand)', 'var(--brand-soft)', 'rgba(37,99,235,.09)'],
      blue: ['var(--blue)', 'var(--blue-soft)', 'rgba(36,117,245,.08)'],
      emerald: ['var(--emerald)', 'var(--emerald-soft)', 'rgba(7,147,109,.08)'],
      amber: ['var(--amber)', 'var(--amber-soft)', 'rgba(217,130,11,.08)'],
      red: ['var(--red)', 'var(--red-soft)', 'rgba(217,71,92,.08)'],
      cyan: ['var(--cyan)', 'var(--cyan-soft)', 'rgba(15,152,182,.08)'],
      purple: ['var(--purple)', 'var(--purple-soft)', 'rgba(96,165,250,.08)']
    };
    const [color,bg,glow] = palettes[accent] || palettes.brand;
    return `<article class="metric-card ${action ? 'clickable' : ''}" ${action ? `data-action="${action}" data-metric-label="${escapeHTML(label)}" data-metric-value="${escapeHTML(String(value).replace(/<[^>]*>/g,''))}"` : ''} style="--metric-color:${color};--metric-bg:${bg};--metric-glow:${glow}">
      <div class="metric-head"><span class="metric-icon">${icon(iconName)}</span><span>${escapeHTML(label)}</span></div>
      <div class="metric-value">${value}</div>
      <div class="metric-foot ${trend}">${trend === 'positive' ? icon('trend-up') : trend === 'negative' ? icon('trend-down') : ''}<strong>${foot}</strong></div>
      ${spark ? sparkline(spark, color) : ''}
    </article>`;
  }

  function sparkline(values, color = 'var(--brand)') {
    const width = 62, height = 26, padding = 2;
    const min = Math.min(...values), max = Math.max(...values);
    const points = values.map((value,index) => {
      const x = padding + index * ((width - padding * 2) / Math.max(1,values.length - 1));
      const y = height - padding - ((value - min) / Math.max(1,max - min)) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');
    return `<svg class="metric-spark" viewBox="0 0 ${width} ${height}" aria-hidden="true"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function pageHeader(title, subtitle, actions = '', context = '') {
    return `<header class="page-header">
      <div><div class="page-title-row"><h1 class="page-title">${escapeHTML(title)}</h1>${context ? `<span class="page-context">${escapeHTML(context)}</span>` : ''}</div><p class="page-subtitle">${escapeHTML(subtitle)}</p></div>
      <div class="page-actions">${actions}</div>
    </header>`;
  }

  function selectControl(name, options, selected, action) {
    return `<select class="select" aria-label="${escapeHTML(name)}" data-change-action="${action}">${options.map(option => `<option ${option === selected ? 'selected' : ''}>${escapeHTML(option)}</option>`).join('')}</select>`;
  }

  function button(label, action, style = '', iconName = '', attrs = '') {
    return `<button type="button" class="button ${style}" data-action="${action}" ${attrs}>${iconName ? icon(iconName) : ''}<span>${escapeHTML(label)}</span></button>`;
  }

  function workspaceFilterBar(items = []) {
    if (!items.length) return '';
    return `<div class="workspace-filter-bar">${items.map(item => {
      if (item.type === 'button') return button(item.label,item.action,item.style||'compact',item.icon||'filter',item.attrs||'');
      return `<label class="workspace-filter"><span>${escapeHTML(item.label)}</span><select data-change-action="${escapeHTML(item.action)}">${item.options.map(option=>`<option ${option===item.selected?'selected':''}>${escapeHTML(option)}</option>`).join('')}</select></label>`;
    }).join('')}<span class="filter-freshness">${icon('clock')} Data refreshed 31 Jul 2026 · 18:45 CAT</span></div>`;
  }

  function softFocus(target) {
    const surface = target?.closest?.('.card,.metric-card,.report-vault-card,.list-row,.clause-card,.close-check,.recon-line,.mailer-card') || target;
    if (!surface) return;
    surface.classList.remove('interaction-focus');
    void surface.offsetWidth;
    surface.classList.add('interaction-focus');
    setTimeout(()=>surface.classList.remove('interaction-focus'),480);
  }

  function card(title, body, { subtitle = '', tools = '', footer = '', classes = '' } = {}) {
    return `<section class="card ${classes}"><div class="card-head"><div><h3 class="card-title">${escapeHTML(title)}</h3>${subtitle ? `<div class="card-subtitle">${escapeHTML(subtitle)}</div>` : ''}</div><div class="card-tools">${tools}</div></div><div class="card-body">${body}</div>${footer ? `<div class="card-footer">${footer}</div>` : ''}</section>`;
  }

  function donutChart(segments, centreTop, centreBottom, size = 125) {
    const renderedSize = size < 110 ? size : Math.max(size, 145);
    const total = sum(segments, s => s.value) || 1;
    const circumference = 2 * Math.PI * 42;
    let offset = 0;
    const circles = segments.map(segment => {
      const dash = (segment.value / total) * circumference;
      const circle = `<circle cx="50" cy="50" r="42" fill="none" stroke="${segment.color}" stroke-width="13" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" data-action="chart-drilldown" data-chart-label="${escapeHTML(segment.label)}" data-chart-value="${escapeHTML(segment.display || segment.value)}" class="chart-click-target" tabindex="0"/>`;
      offset += dash;
      return circle;
    }).join('');
    return `<div class="donut-wrap"><div class="donut" style="width:${renderedSize}px;height:${renderedSize}px;flex-basis:${renderedSize}px"><svg viewBox="0 0 100 100" role="img"><circle cx="50" cy="50" r="42" fill="none" stroke="var(--line)" stroke-width="13"/>${circles}</svg><div class="donut-centre"><div><strong>${centreTop}</strong><span>${centreBottom}</span></div></div></div><div class="donut-legend">${segments.map(segment => `<div class="donut-legend-row" data-action="chart-drilldown" data-chart-label="${escapeHTML(segment.label)}" data-chart-value="${escapeHTML(segment.display || segment.value)}" tabindex="0"><i style="background:${segment.color}"></i><span>${escapeHTML(segment.label)}</span><strong>${escapeHTML(segment.display || segment.value)}</strong></div>`).join('')}</div></div>`;
  }

  function lineChart({ labels, series, height = 220, yLabel = '', action = 'chart-drilldown', format = value => value }) {
    height = height <= 180 ? height : Math.max(height, 270);
    const width = 720, padding = { left: 56, right: 22, top: 24, bottom: 44 };
    const allValues = series.flatMap(item => item.values);
    let min = Math.min(0, ...allValues), max = Math.max(...allValues);
    if (min === max) max = min + 1;
    const x = index => padding.left + index * ((width - padding.left - padding.right) / Math.max(1, labels.length - 1));
    const y = value => padding.top + (max - value) / (max - min) * (height - padding.top - padding.bottom);
    const ticks = Array.from({length:6},(_,i) => min + (max-min) * i / 5).reverse();
    const grid = ticks.map(value => `<line class="gridline" x1="${padding.left}" x2="${width-padding.right}" y1="${y(value)}" y2="${y(value)}"/><text class="axis-label" x="${padding.left-9}" y="${y(value)+3}" text-anchor="end">${format(Number(Math.abs(value) < 1e-10 ? 0 : value.toFixed(2)))}</text>`).join('');
    const paths = series.map(item => {
      const points = item.values.map((value,index) => `${x(index)},${y(value)}`).join(' ');
      const seriesValue = `${item.name}: ${format(item.values[item.values.length-1])}`;
      const hit = `<polyline points="${points}" fill="none" stroke="transparent" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" class="chart-series-hit chart-click-target" data-action="${action}" data-chart-label="${escapeHTML(item.name)} trend" data-chart-value="${escapeHTML(seriesValue)}"/>`;
      const visible = `<polyline points="${points}" fill="none" stroke="${item.color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="chart-series-visible chart-click-target" data-action="${action}" data-chart-label="${escapeHTML(item.name)} trend" data-chart-value="${escapeHTML(seriesValue)}" tabindex="0"/>`;
      const dots = item.values.map((value,index) => `<circle cx="${x(index)}" cy="${y(value)}" r="4.2" fill="${item.color}" stroke="var(--surface)" stroke-width="2.4" class="chart-click-target" data-action="${action}" data-chart-label="${escapeHTML(labels[index])}" data-chart-value="${escapeHTML(`${item.name}: ${format(value)}`)}" tabindex="0"/>`).join('');
      return `${hit}${visible}${dots}`;
    }).join('');
    const xLabels = labels.map((label,index) => `<text class="axis-label" x="${x(index)}" y="${height-16}" text-anchor="middle">${escapeHTML(label)}</text>`).join('');
    const legend = `<div class="chart-legend">${series.map(item => `<span class="legend-item" style="color:${item.color}"><i class="legend-dot"></i>${escapeHTML(item.name)}</span>`).join('')}<span class="chart-drilldown-hint"></span></div>`;
    return `${legend}<div class="chart-shell" style="height:${height}px;min-height:${height}px"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img">${grid}${paths}${xLabels}${yLabel ? `<text class="axis-label" transform="translate(15 ${height/2}) rotate(-90)" text-anchor="middle">${escapeHTML(yLabel)}</text>` : ''}</svg></div>`;
  }

  function barChart({ labels, series, height = 220, yLabel = '', stacked = false, format = value => value, action = 'chart-drilldown' }) {
    height = height <= 180 ? height : Math.max(height, 270);
    const width = 720, padding = { left: 56, right: 22, top: 24, bottom: 44 };
    const totals = labels.map((_,i) => stacked ? sum(series, s => Math.max(0,s.values[i] || 0)) : Math.max(...series.map(s => s.values[i] || 0)));
    const minRaw = Math.min(0,...series.flatMap(s => s.values));
    const maxRaw = Math.max(...totals,1);
    const min = minRaw < 0 ? minRaw : 0;
    const max = maxRaw * 1.14;
    const plotWidth = width - padding.left - padding.right;
    const groupWidth = plotWidth / labels.length;
    const y = value => padding.top + (max - value)/(max-min)*(height-padding.top-padding.bottom);
    const zeroY = y(0);
    const ticks = Array.from({length:6},(_,i) => min + (max-min)*i/5).reverse();
    const grid = ticks.map(value => `<line class="gridline" x1="${padding.left}" x2="${width-padding.right}" y1="${y(value)}" y2="${y(value)}"/><text class="axis-label" x="${padding.left-9}" y="${y(value)+3}" text-anchor="end">${format(Number(Math.abs(value) < 1e-10 ? 0 : value.toFixed(2)))}</text>`).join('');
    let rects = '';
    labels.forEach((label,labelIndex) => {
      let stackBase = 0;
      series.forEach((item,seriesIndex) => {
        const value = item.values[labelIndex] || 0;
        const barW = stacked ? groupWidth*.58 : (groupWidth*.74)/series.length;
        const barX = padding.left + labelIndex*groupWidth + groupWidth*.13 + (stacked ? groupWidth*.08 : seriesIndex*barW);
        const startValue = stacked ? stackBase : 0;
        const endValue = startValue + value;
        const topY = y(Math.max(startValue,endValue));
        const bottomY = y(Math.min(startValue,endValue));
        const rectH = Math.max(3, bottomY-topY);
        rects += `<rect x="${barX}" y="${topY}" width="${Math.max(5,barW-4)}" height="${rectH}" rx="4" fill="${item.color}" class="chart-click-target" data-action="${action}" data-chart-label="${escapeHTML(label)}" data-chart-value="${escapeHTML(`${item.name}: ${format(value)}`)}" tabindex="0"/>`;
        if (stacked) stackBase = endValue;
      });
    });
    const xLabels = labels.map((label,index) => `<text class="axis-label" x="${padding.left+index*groupWidth+groupWidth/2}" y="${height-16}" text-anchor="middle">${escapeHTML(label)}</text>`).join('');
    const legend = `<div class="chart-legend">${series.map(item => `<span class="legend-item" style="color:${item.color}"><i class="legend-dot"></i>${escapeHTML(item.name)}</span>`).join('')}<span class="chart-drilldown-hint"></span></div>`;
    return `${legend}<div class="chart-shell" style="height:${height}px;min-height:${height}px"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img"><line x1="${padding.left}" x2="${width-padding.right}" y1="${zeroY}" y2="${zeroY}" stroke="var(--line-strong)"/>${grid}${rects}${xLabels}${yLabel ? `<text class="axis-label" transform="translate(15 ${height/2}) rotate(-90)" text-anchor="middle">${escapeHTML(yLabel)}</text>` : ''}</svg></div>`;
  }

  function funnelChart(stages) {
    const max = Math.max(...stages.map(s => s.value));
    return `<div class="chart-shell"><svg viewBox="0 0 500 245">${stages.map((stage,index) => {
      const width = 360*(stage.value/max);
      const next = stages[index+1] ? 360*(stages[index+1].value/max) : width*.45;
      const x1 = 26+(360-width)/2, x2 = 26+(360-next)/2;
      const y1 = 14+index*35, y2 = y1+27;
      return `<path d="M${x1} ${y1}H${x1+width}L${x2+next} ${y2}H${x2}Z" fill="${stage.color}" opacity="${1-index*.08}" class="chart-click-target" data-action="chart-drilldown" data-chart-label="${escapeHTML(stage.label)}" data-chart-value="${stage.value} deals · ${formatMoney(stage.amount)}"/><text x="410" y="${y1+15}" class="axis-label">${escapeHTML(stage.label)} (${stage.value})</text><text x="410" y="${y1+27}" class="axis-label">${formatMoney(stage.amount)}</text>`;
    }).join('')}</svg></div>`;
  }

  function waterfallChart(items) {
    const width = 720, height = 220, left = 45, right = 15, top = 15, bottom = 35;
    const cumulative = [];
    let running = 0;
    items.forEach(item => { if (item.total) running = item.value; else running += item.value; cumulative.push(running); });
    const values = [0,...cumulative];
    const min = Math.min(0,...values), max = Math.max(...values)*1.1;
    const y = value => top + (max-value)/(max-min)*(height-top-bottom);
    const group = (width-left-right)/items.length;
    const bars = items.map((item,index) => {
      const previous = index === 0 ? 0 : cumulative[index-1];
      const start = item.total ? 0 : previous;
      const end = item.total ? item.value : cumulative[index];
      const topY = y(Math.max(start,end)), bottomY = y(Math.min(start,end));
      const color = item.total ? 'var(--brand)' : item.value >= 0 ? 'var(--emerald)' : 'var(--red)';
      return `<rect x="${left+index*group+group*.2}" y="${topY}" width="${group*.6}" height="${Math.max(3,bottomY-topY)}" rx="3" fill="${color}" class="chart-click-target" data-action="chart-drilldown" data-chart-label="${escapeHTML(item.label)}" data-chart-value="${formatMoney(item.value)}"/><text class="axis-label" x="${left+index*group+group/2}" y="${height-14}" text-anchor="middle">${escapeHTML(item.label)}</text><text class="axis-label" x="${left+index*group+group/2}" y="${topY-5}" text-anchor="middle">${formatMoney(item.value)}</text>`;
    }).join('');
    return `<div class="chart-shell"><svg viewBox="0 0 ${width} ${height}"><line class="gridline" x1="${left}" x2="${width-right}" y1="${y(0)}" y2="${y(0)}"/>${bars}</svg></div>`;
  }

  function healthScore(score) {
    return `<span class="risk-score ${score >= 75 ? 'good' : score >= 60 ? 'medium' : 'bad'}">${score}</span>`;
  }

  function progressBar(value, color = '') {
    return `<div class="progress"><span style="width:${clamp(value,0,100)}%;${color ? `background:${color}` : ''}"></span></div>`;
  }

  function companyLogo(company) {
    return `<span class="company-logo" style="background:linear-gradient(145deg,${company.color},color-mix(in srgb,${company.color} 60%,#111827))">${escapeHTML(initials(company.name))}</span>`;
  }

  function avatar(name, index = 0) {
    const safe=escapeHTML(String(name||'Employee'));
    return `<span class="mini-avatar photo-avatar"><img src="${profilePhoto(name)}" alt="${safe}" loading="lazy"></span>`;
  }

  function renderNav() {
    const activePage = state.page === 'analytics-detail' ? (state.drilldown?.sourcePage || 'dashboard') : state.page;
    primaryNav.innerHTML = navGroups.map(group => `<div class="nav-group"><div class="nav-group-label">${group.label}</div>${group.items.map(item => `<button class="nav-item ${activePage === item.id ? 'active' : ''}" data-action="navigate" data-page="${item.id}" title="${escapeHTML(item.label)}">${icon(item.icon)}<span class="nav-label">${escapeHTML(item.label)}</span>${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}</button>`).join('')}</div>`).join('');
  }

  function globalPageActions({ includeFund = true, includeDate = true, extra = '' } = {}) {
    return `${includeFund ? selectControl('Fund filter',['All Funds',...funds.map(f => f.name)],state.activeFund,'fund-filter') : ''}${includeDate ? selectControl('As of date',['31 Jul 2026','30 Jun 2026','31 Mar 2026','31 Dec 2025'],state.asOfDate,'date-filter') : ''}${extra}`;
  }

  function stableHash(value) {
    return String(value || '').split('').reduce((hash,char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 2166136261);
  }

  function analyticsPeriods() {
    const all = ['Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'];
    const count = state.analyticsPeriod === 'Last 4 quarters' ? 4 : state.analyticsPeriod === 'Last 6 quarters' ? 6 : 8;
    return all.slice(-count);
  }

  function analyticsRecords(context) {
    const term = `${context.title} ${context.selection} ${context.value}`.toLowerCase();
    if (/(deal|pipeline|sourcing|screening|committee|term sheet|conversion|shortlist)/.test(term)) {
      return deals.map(item => ({
        kind:'Deal', id:item.id, name:item.name, dimension:item.stage, owner:item.owner, status:item.priority,
        value:item.amount, metric:item.score, metricLabel:'Screening score', action:'open-deal'
      }));
    }
    if (/(capital call|collection|investor|lp|commitment|unfunded|drawdown)/.test(term)) {
      return lps.map(item => ({
        kind:'LP', id:item.id, name:item.name, dimension:item.geography, owner:item.owner, status:item.kyc,
        value:item.commitment, metric:item.netIrr, metricLabel:'Net IRR', action:'open-lp'
      }));
    }
    if (/(fund|irr|tvpi|dpi|j-curve|vintage|dry powder|nav|performance)/.test(term)) {
      return funds.map(item => ({
        kind:'Fund', id:item.id, name:item.name, dimension:item.strategy, owner:item.geography, status:item.status,
        value:item.nav, metric:item.netIrr, metricLabel:'Net IRR', action:'open-fund'
      }));
    }
    if (/(report|submission|workload|completion|schedule)/.test(term)) {
      return companies.map((item,index) => ({
        kind:'Report', id:item.id, name:`${item.name} quarterly report`, dimension:item.fund, owner:['Sarah Mitchell','James Davidson','Anita Kapoor'][index%3], status:index%4===0?'Overdue':index%3===0?'In Review':'Complete',
        value:item.fairValue, metric:Math.max(20,100-index*9), metricLabel:'Completion', action:'open-company'
      }));
    }
    return companies.map(item => ({
      kind:'Company', id:item.id, name:item.name, dimension:item.sector, owner:item.fund, status:item.health >= 75 ? 'Healthy' : item.health >= 65 ? 'Watch' : 'At Risk',
      value:item.fairValue, metric:item.revenueGrowth, metricLabel:'Revenue growth', action:'open-company'
    }));
  }

  function analyticsSeries(context, records) {
    const periods = analyticsPeriods();
    const seed = Math.abs(stableHash(`${context.title}-${context.selection}`));
    const totalMillions = Math.max(24, sum(records, item => item.value) / 1e6);
    const start = Math.max(8, totalMillions / Math.max(7,records.length * 2.3));
    const actual = periods.map((_,index) => Number((start * (.78 + index*.085 + ((seed >> (index%12)) & 7)/70)).toFixed(1)));
    const plan = actual.map((value,index) => Number((value * (.93 + ((index+seed)%5)/100)).toFixed(1)));
    const benchmark = actual.map((value,index) => Number((value * (.84 + ((index+2)%4)/90)).toFixed(1)));
    return { periods, actual, plan, benchmark };
  }

  function analyticsDistribution(records) {
    const grouped = new Map();
    records.forEach(item => grouped.set(item.dimension, (grouped.get(item.dimension) || 0) + item.value));
    const colors = ['#2563eb','#2475f5','#07936d','#f29a1f','#d9475c','#0f98b6','#60a5fa'];
    return [...grouped.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([label,value],index) => ({
      label, value, color:colors[index%colors.length], display:formatMoney(value)
    }));
  }

  function openAnalyticsDetail(trigger) {
    const cardTitle = trigger.closest('.card')?.querySelector('.card-title')?.textContent?.trim();
    const metricLabel = trigger.dataset.metricLabel || trigger.querySelector?.('.metric-head span:last-child')?.textContent?.trim();
    const title = cardTitle || metricLabel || trigger.dataset.chartLabel || 'Portfolio analytics';
    const selection = trigger.dataset.chartLabel || metricLabel || title;
    const value = trigger.dataset.chartValue || trigger.dataset.metricValue || trigger.querySelector?.('.metric-value')?.textContent?.trim() || 'Selected metric';
    const sourcePage = state.page === 'analytics-detail' ? (state.drilldown?.sourcePage || 'dashboard') : state.page;
    state.drilldown = { title, selection, value, sourcePage, openedAt: new Date().toISOString() };
    state.previousPage = state.page;
    state.page = 'analytics-detail';
    closeOverlays();
    render();
  }

  function renderAnalyticsDetail() {
    const context = state.drilldown || { title:'Portfolio performance', selection:'All portfolio data', value:'Current selection', sourcePage:'dashboard' };
    const records = analyticsRecords(context);
    const series = analyticsSeries(context, records);
    const distribution = analyticsDistribution(records);
    const totalValue = sum(records,item=>item.value);
    const weightedMetric = records.length ? sum(records,item=>item.metric)/records.length : 0;
    const ranked = [...records].sort((a,b)=>b.value-a.value);
    const leading = ranked[0];
    const variance = series.actual.map((value,index)=>Number((value-series.plan[index]).toFixed(1)));
    const actualDelta = series.actual.length > 1 ? (series.actual.at(-1)-series.actual.at(-2))/Math.max(.01,series.actual.at(-2))*100 : 0;
    const statuses = new Map();
    records.forEach(item=>statuses.set(item.status,(statuses.get(item.status)||0)+1));
    const exceptionCount = records.filter(item=>/(risk|overdue|watch|pending|high)/i.test(item.status)).length;
    const tableRows = ranked.map((item,index)=>`<tr class="clickable" data-action="${item.action}" data-id="${item.id}"><td class="table-primary">${escapeHTML(item.name)}</td><td>${escapeHTML(item.kind)}</td><td>${escapeHTML(item.dimension)}</td><td>${escapeHTML(item.owner)}</td><td>${statusPill(item.status)}</td><td>${formatMoney(item.value)}</td><td>${item.metricLabel.includes('score') || item.metricLabel.includes('Completion') ? `${Math.round(item.metric)}/100` : `${item.metric.toFixed(1)}%`}</td><td>${index < 2 ? statusPill('Top contributor','success') : index === ranked.length-1 ? statusPill('Review','warning') : statusPill('Within range','info')}</td></tr>`).join('');
    const statusRows = [...statuses.entries()].sort((a,b)=>b[1]-a[1]).map(([status,count])=>`<div class="analytics-source-row"><span>${escapeHTML(status)}</span><strong>${count} record${count===1?'':'s'}</strong></div>`).join('');
    const subtitle = `${context.selection}${context.value ? ` · ${context.value}` : ''}. Detailed portfolio analytics as of ${state.asOfDate}.`;
    return `${pageHeader(context.title,subtitle,`${button('Back','analytics-back','','arrow-left')}${selectControl('Analysis period',['Last 4 quarters','Last 6 quarters','Last 8 quarters'],state.analyticsPeriod,'analytics-period')}${selectControl('View',['Actual vs plan','Actual vs benchmark'],state.analyticsView,'analytics-view')}${button('Export data','analytics-export','primary','download')}`,'Analytics Drill-down')}
      <div class="analytics-breadcrumbs"><button data-action="analytics-back">${escapeHTML((context.sourcePage || 'dashboard').replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase()))}</button>${icon('chevron-right')}<span>${escapeHTML(context.title)}</span>${icon('chevron-right')}<strong>${escapeHTML(context.selection)}</strong></div>
      <div class="analytics-selection">${icon('target')}<span>Current selection:</span><strong>${escapeHTML(context.selection)}</strong><span>·</span><strong>${escapeHTML(context.value)}</strong></div>
      <section class="metric-grid section-gap">
        ${metricCard({label:'Underlying Value',value:formatMoney(totalValue),iconName:'dollar',accent:'brand',foot:`${records.length} underlying records`,action:'metric-underlying'})}
        ${metricCard({label:'Latest Period',value:`${series.actual.at(-1).toFixed(1)}M`,iconName:'trend-up',accent:'blue',foot:`${actualDelta>=0?'Up':'Down'} ${Math.abs(actualDelta).toFixed(1)}% quarter-on-quarter`,trend:actualDelta>=0?'positive':'negative',action:'metric-latest'})}
        ${metricCard({label:'Average Indicator',value:`${weightedMetric.toFixed(1)}%`,iconName:'activity',accent:'emerald',foot:records[0]?.metricLabel || 'Portfolio indicator',action:'metric-average'})}
        ${metricCard({label:'Variance to Plan',value:`${variance.at(-1)>=0?'+':''}${variance.at(-1).toFixed(1)}M`,iconName:'bar-chart',accent:variance.at(-1)>=0?'emerald':'red',foot:'Latest reporting period',trend:variance.at(-1)>=0?'positive':'negative',action:'metric-variance'})}
        ${metricCard({label:'Largest Contributor',value:leading ? formatMoney(leading.value) : '$0',iconName:'layers',accent:'cyan',foot:leading?.name || 'No records',action:'metric-contributor'})}
        ${metricCard({label:'Exceptions',value:String(exceptionCount),iconName:'alert',accent:exceptionCount?'amber':'emerald',foot:'Items needing analyst attention',trend:exceptionCount?'negative':'positive',action:'metric-exceptions'})}
      </section>
      <section class="analytics-primary-grid">
        ${card('Performance Trend',lineChart({labels:series.periods,series:[{name:'Actual',color:'var(--brand)',values:series.actual},{name:state.analyticsView==='Actual vs plan'?'Plan':'Benchmark',color:'var(--emerald)',values:state.analyticsView==='Actual vs plan'?series.plan:series.benchmark}],height:320,yLabel:'USD (millions)',format:v=>`${Number(v).toFixed(0)}M`}),{subtitle:`${state.analyticsPeriod} · click any line or point for a narrower drill-down`,classes:'analytics-chart-card'})}
        ${card('Period Variance',barChart({labels:series.periods,series:[{name:'Variance',color:'var(--blue)',values:variance}],height:320,yLabel:'USD (millions)',format:v=>`${Number(v).toFixed(0)}M`}),{subtitle:'Actual less plan by reporting period',classes:'analytics-chart-card'})}
      </section>
      <section class="analytics-secondary-grid">
        ${card('Dimension Breakdown',donutChart(distribution,formatMoney(totalValue),'Total value',170),{subtitle:'Click a segment or legend row to isolate a dimension'})}
        ${card('Drivers & Exceptions',`<div class="analytics-insight"><strong>${leading ? escapeHTML(leading.name) : 'No leading record'}</strong><p>Largest contributor at ${leading ? formatMoney(leading.value) : '$0'}, representing ${leading ? ((leading.value/Math.max(1,totalValue))*100).toFixed(1) : '0.0'}% of the selected value.</p></div><div class="analytics-insight"><strong>${exceptionCount} exception${exceptionCount===1?'':'s'} detected</strong><p>Items are flagged using status, deadline and performance thresholds in this frontend model.</p></div><div class="analytics-insight"><strong>Quarterly movement</strong><p>The latest period moved ${actualDelta>=0?'up':'down'} ${Math.abs(actualDelta).toFixed(1)}% compared with the preceding quarter.</p></div>`)}
        ${card('Status & Data Lineage',`<div class="analytics-source-list">${statusRows}<div class="analytics-source-row"><span>Reporting date</span><strong>${escapeHTML(state.asOfDate)}</strong></div><div class="analytics-source-row"><span>Base currency</span><strong>USD</strong></div><div class="analytics-source-row"><span>Source mode</span><strong>Interactive prototype data</strong></div></div>`,{footer:'<span class="muted small">All figures shown are frontend demonstration data.</span>'})}
      </section>
      <section class="card table-card analytics-records"><div class="table-toolbar"><div class="table-title-row"><h3>Underlying Records</h3><span class="table-badge">${records.length} records</span></div><div class="table-tools">${button('Export table','analytics-export','','download')}</div></div><div class="table-wrap"><table><thead><tr><th>Record</th><th>Type</th><th>Primary Dimension</th><th>Owner / Fund</th><th>Status</th><th>Value</th><th>Indicator</th><th>Contribution</th></tr></thead><tbody>${tableRows}</tbody></table></div><div class="card-footer"><span class="muted small">Select a row to open the full deal, fund, company or LP record.</span><strong>${formatMoney(totalValue)} total selected value</strong></div></section>`;
  }


  const cashContextBar = (accountId = state.selectedCashAccountId) => {
    const account = cashAccounts.find(item => item.id === accountId) || cashAccounts[0];
    if (!account) {
      return `<div class="cash-context-bar"><div><span>Manager legal entity</span><strong>Matanho Capital Zimbabwe</strong></div><div><span>Fund / Vehicle</span><strong>No cash accounts loaded</strong></div><div><span>External account</span><strong>—</strong></div><div><span>Purpose / Currency</span><strong>—</strong></div><div><span>As of</span><strong>${escapeHTML(state.asOfDate || '—')} · Africa/Harare</strong></div></div>`;
    }
    const purpose = String(account.purpose || 'FUND_OPERATING_BANK').replaceAll('_',' ');
    return `<div class="cash-context-bar"><div><span>Manager legal entity</span><strong>Matanho Capital Zimbabwe</strong></div><div><span>Fund / Vehicle</span><strong>${escapeHTML(account.fund || '—')} · ${escapeHTML(account.vehicle || '—')}</strong></div><div><span>External account</span><strong>${escapeHTML(account.provider || '—')} ${escapeHTML(account.masked || '••••')}</strong></div><div><span>Purpose / Currency</span><strong>${escapeHTML(purpose)} · ${escapeHTML(account.currency || 'USD')}</strong></div><div><span>As of</span><strong>${escapeHTML(state.asOfDate || '—')} · Africa/Harare</strong></div></div>`;
  };

  function renderCashAccounts() {
    const rows = cashAccounts.map(account => `<tr class="clickable" data-action="open-cash-account" data-id="${account.id}"><td class="table-primary"><span class="document-name-cell"><span class="document-row-icon folder">${icon('bank')}</span><span>${escapeHTML(account.id)}<small>${escapeHTML(account.masked)}</small></span></span></td><td>${escapeHTML(account.fund)}<small>${escapeHTML(account.vehicle)}</small></td><td>${escapeHTML(String(account.purpose||'FUND_OPERATING_BANK').replaceAll('_',' '))}</td><td>${escapeHTML(account.provider)}</td><td>${escapeHTML(account.currency)}</td><td>${statusPill(account.status)}</td><td>${formatMoney(account.settled,account.currency)}</td><td>${pct(account.reconHealth)}</td><td>${statusPill(account.reconHealth>=98?'Healthy':account.reconHealth>=90?'Review':'At risk',account.reconHealth>=98?'success':account.reconHealth>=90?'warning':'danger')}</td></tr>`).join('');
    const totalSettled=sum(cashAccounts.filter(a=>a.currency==='USD'),a=>a.settled);
    return `${pageHeader('Client / Fund Accounts','Authorised fund, vehicle and investor-linked cash accounts with lifecycle, provider mapping and reconciliation health.',`${button('Export accounts','export-cash-accounts','','download')}${button('Create account','create-cash-account','primary','plus')}`,'Cash & Reconciliation')}
      ${cashContextBar()}
      <section class="metric-grid section-gap">
        ${metricCard({label:'Active Accounts',value:String(cashAccounts.filter(a=>a.status==='ACTIVE').length),iconName:'bank',accent:'brand',foot:'Across 5 funds and 6 vehicles',action:'cash-accounts-active'})}
        ${metricCard({label:'Settled USD Cash',value:formatMoney(totalSettled),iconName:'dollar',accent:'emerald',foot:'Ledger-derived · not statement balance',action:'cash-settled-explain'})}
        ${metricCard({label:'Reserved Cash',value:formatMoney(sum(cashAccounts.filter(a=>a.currency==='USD'),a=>a.reserved)),iconName:'lock',accent:'amber',foot:'4 active or approved reservations',action:'navigate-cash-reservations'})}
        ${metricCard({label:'Reconciliation Health',value:pct(cashAccounts.length?sum(cashAccounts,a=>a.reconHealth)/cashAccounts.length:0),iconName:'refresh',accent:'blue',foot:'Weighted account health',action:'navigate-reconciliations'})}
        ${metricCard({label:'Accounts Needing Review',value:String(cashAccounts.filter(a=>a.reconHealth<95||a.status!=='ACTIVE').length),iconName:'alert',accent:'red',foot:'Missing evidence, breaks or holds',trend:'negative',action:'navigate-exceptions'})}
        ${metricCard({label:'Available to Deploy',value:formatMoney(sum(cashAccounts.filter(a=>a.currency==='USD'),a=>a.deployable)),iconName:'trend-up',accent:'cyan',foot:'After reservations, holds and buffers',action:'cash-available-explain'})}
      </section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Account Registry</h3><span class="table-badge">${cashAccounts.length} accounts</span></div><div class="table-tools"><label class="table-search">${icon('search')}<input data-input-action="table-search" value="${escapeHTML(state.tableSearch)}" placeholder="Search account, fund or provider"></label>${button('Filters','cash-account-filters','','filter')}</div></div><div class="table-wrap"><table><thead><tr><th>Account</th><th>Fund / Vehicle</th><th>Cash Purpose</th><th>Provider</th><th>Currency</th><th>Status</th><th>Settled Cash</th><th>Reconciled</th><th>Health</th></tr></thead><tbody>${rows}</tbody></table></div><div class="card-footer"><span class="muted small">Account balances are calculated from immutable posted ledger lines.</span><button class="text-link" data-action="open-account-setup">Open account mappings & configuration ${icon('arrow-right')}</button></div></section>`;
  }

  function renderCashOverview() {
    const accounts=cashAccounts.filter(a=>state.cashCurrency==='All'||a.currency===state.cashCurrency);
    const settled=sum(accounts,a=>a.settled), reserved=sum(accounts,a=>a.reserved), held=sum(accounts,a=>a.held), expectedIn=sum(accounts,a=>a.expectedIn), expectedOut=sum(accounts,a=>a.expectedOut), deployable=sum(accounts,a=>a.deployable), distributable=sum(accounts,a=>a.distributable);
    const waterfall=[{label:'Settled',value:settled},{label:'Reusable proceeds',value:8500000},{label:'Reservations',value:-reserved},{label:'Holds',value:-held},{label:'Pending outflows',value:-expectedOut},{label:'Deployable',value:deployable}];
    const rows=accounts.map(a=>`<tr class="clickable" data-action="open-cash-account" data-id="${a.id}"><td class="table-primary">${escapeHTML(a.fund)}<small>${escapeHTML(a.vehicle)} · ${escapeHTML(a.masked)}</small></td><td>${escapeHTML(a.currency)}</td><td>${formatMoney(a.posted,a.currency)}</td><td>${formatMoney(a.settled,a.currency)}</td><td>${formatMoney(a.reserved,a.currency)}</td><td>${formatMoney(a.held,a.currency)}</td><td class="positive">${formatMoney(a.deployable,a.currency)}</td><td>${formatMoney(a.distributable,a.currency)}</td><td>${button('Explain','explain-cash-position','compact','info',`data-id="${a.id}"`)}</td></tr>`).join('');
    return `${pageHeader('Cash Overview','Posted, settled, reserved, held, expected, deployable, distributable and projected cash by authorised ownership scope.',`${selectControl('Currency',['USD','ZWG','All'],state.cashCurrency,'cash-currency')}${button('Export cash view','export-cash-overview','','download')}`,'Cash & Reconciliation')}${cashContextBar()}
      <section class="metric-grid section-gap">
        ${metricCard({label:'Posted Cash',value:formatMoney(sum(accounts,a=>a.posted),state.cashCurrency==='ZWG'?'ZWG':'USD'),iconName:'list',accent:'brand',foot:'Approved internal ledger position',action:'cash-posted-explain'})}
        ${metricCard({label:'Settled Cash',value:formatMoney(settled,state.cashCurrency==='ZWG'?'ZWG':'USD'),iconName:'check-circle',accent:'emerald',foot:'Externally final and internally posted',action:'cash-settled-explain'})}
        ${metricCard({label:'Reserved',value:formatMoney(reserved,state.cashCurrency==='ZWG'?'ZWG':'USD'),iconName:'lock',accent:'amber',foot:'Committed to future obligations',action:'navigate-cash-reservations'})}
        ${metricCard({label:'Blocked / Held',value:formatMoney(held,state.cashCurrency==='ZWG'?'ZWG':'USD'),iconName:'shield',accent:'red',foot:'Compliance, legal and operational holds',action:'cash-holds-explain'})}
        ${metricCard({label:'Deployable',value:formatMoney(deployable,state.cashCurrency==='ZWG'?'ZWG':'USD'),iconName:'trend-up',accent:'cyan',foot:'Eligible settled cash less deductions',action:'cash-available-explain'})}
        ${metricCard({label:'Distributable',value:formatMoney(distributable,state.cashCurrency==='ZWG'?'ZWG':'USD'),iconName:'send',accent:'purple',foot:'After restrictions and reserves',action:'cash-distributable-explain'})}
      </section>
      <section class="cash-overview-grid section-gap">
        ${card('Cash-State Waterfall',barChart({labels:waterfall.map(x=>x.label),series:[{name:'Cash state',color:'var(--brand)',values:waterfall.map(x=>x.value/1e6)}],height:310,yLabel:'USD (millions)',format:v=>`${Number(v).toFixed(1)}M`,action:'cash-waterfall-drill'}),{subtitle:'Every component is clickable and traceable to ledger, reservations, holds and policy.',classes:'cash-chart-card'})}
        ${card('Projected Cash Timeline',lineChart({labels:['31 Jul','07 Aug','14 Aug','21 Aug','31 Aug','15 Sep'],series:[{name:'Projected settled',color:'var(--blue)',values:[settled,settled+expectedIn*.4,settled+expectedIn*.55-expectedOut*.4,settled+expectedIn*.8-expectedOut*.7,settled+expectedIn-expectedOut,settled+expectedIn*1.2-expectedOut*1.1].map(v=>v/1e6)},{name:'Deployable',color:'var(--emerald)',values:[deployable,deployable+2.1e6,deployable-3.4e6,deployable+4.2e6,deployable+5.5e6,deployable+7.1e6].map(v=>v/1e6)}],height:310,yLabel:'USD (millions)',format:v=>`${Number(v).toFixed(1)}M`,action:'cash-projection-drill'}),{subtitle:`Expected inflows ${formatMoney(expectedIn)} · expected outflows ${formatMoney(expectedOut)}`,classes:'cash-chart-card'})}
      </section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Cash Position by Account</h3><span class="table-badge">As of ${escapeHTML(state.asOfDate)}</span></div><div class="table-tools">${button('Reservations','navigate-cash-reservations','','lock')}${button('Ledger','navigate-cash-ledger','','list')}</div></div><div class="table-wrap"><table><thead><tr><th>Fund / Account</th><th>Currency</th><th>Posted</th><th>Settled</th><th>Reserved</th><th>Held</th><th>Deployable</th><th>Distributable</th><th>Trace</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function renderCashLedger() {
    const rows=cashJournals.map(j=>`<tr class="clickable" data-action="open-journal" data-id="${j.id}"><td class="table-primary">${escapeHTML(j.id)}<small>${escapeHTML(j.source)}</small></td><td>${escapeHTML(j.event)}</td><td>${escapeHTML(j.fund)}<small>${escapeHTML(j.account)}</small></td><td>${escapeHTML(j.valueDate)}</td><td>${formatMoney(j.debit)}</td><td>${formatMoney(j.credit)}</td><td class="${j.signed>=0?'positive':'negative'}">${formatMoney(j.signed)}</td><td>${statusPill(j.status)}</td><td>${formatMoney(j.reconciled)}</td><td>${statusPill(j.accounting)}</td></tr>`).join('');
    return `${pageHeader('Cash Ledger','Immutable double-entry journals, source events, cash lines, accounting status and reconciliation evidence.',`${button('Export approved journals','export-ledger','','download')}${button('Create manual journal','create-manual-journal','primary','plus')}`,'Cash & Reconciliation')}${cashContextBar()}
      <section class="summary-strip section-gap"><div class="summary-item"><span>Posted journals</span><strong>${cashJournals.filter(j=>j.status==='POSTED').length}</strong><small>Current visible population</small></div><div class="summary-item"><span>Total debits</span><strong>${formatMoney(sum(cashJournals,j=>j.debit))}</strong><small>Exactly equals credits</small></div><div class="summary-item"><span>Total credits</span><strong>${formatMoney(sum(cashJournals,j=>j.credit))}</strong><small>Balanced by currency</small></div><div class="summary-item"><span>Reconciled amount</span><strong>${formatMoney(sum(cashJournals,j=>j.reconciled))}</strong><small>External proof linked</small></div><div class="summary-item"><span>Pending approvals</span><strong>${cashJournals.filter(j=>j.status!=='POSTED').length}</strong><small>Maker-checker required</small></div><div class="summary-item"><span>GL export status</span><strong>4 / 5</strong><small>One pending export</small></div></section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Journal Register</h3><span class="table-badge">Posted history cannot be edited or deleted</span></div><div class="table-tools">${button('Filters','ledger-filters','','filter')}${button('Trace source','trace-ledger-source','','link')}</div></div><div class="table-wrap"><table><thead><tr><th>Journal / Source</th><th>Economic Event</th><th>Fund / Account</th><th>Value Date</th><th>Debit</th><th>Credit</th><th>Cash Effect</th><th>Status</th><th>Reconciled</th><th>Accounting</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function renderCashReservations() {
    const rows=cashReservations.map(r=>`<tr class="clickable" data-action="open-reservation" data-id="${r.id}"><td class="table-primary">${escapeHTML(r.id)}<small>${escapeHTML(r.source)}</small></td><td>${escapeHTML(r.fund)}<small>${escapeHTML(r.vehicle)} · ${escapeHTML(r.account)}</small></td><td>${escapeHTML(r.beneficiary)}</td><td>${escapeHTML(r.purpose.replaceAll('_',' '))}</td><td>${formatMoney(r.amount)}</td><td>${formatMoney(r.remaining)}</td><td>${escapeHTML(r.required)}</td><td>${escapeHTML(r.expiry)}</td><td>${statusPill(r.status)}</td><td>${escapeHTML(r.owner)}</td></tr>`).join('');
    return `${pageHeader('Cash Reservations','Controlled commitments of eligible settled cash that reduce availability without changing the posted ledger.',`${button('Export reservations','export-reservations','','download')}${button('Request reservation','create-reservation','primary','lock')}`,'Cash & Reconciliation')}${cashContextBar()}
      <section class="reservation-lifecycle section-gap">${['REQUESTED','APPROVED','ACTIVE','PARTIALLY CONSUMED','CONSUMED / RELEASED'].map((s,i)=>`<div class="lifecycle-stage ${i===2?'active':''}"><span>${i+1}</span><strong>${s}</strong><small>${i<2?'Approval workflow':i===2?'Reduces available cash':i===3?'Residual remains visible':'Terminal with audit'}</small></div>`).join('')}</section>
      <section class="metric-grid section-gap">${metricCard({label:'Active Reserved',value:formatMoney(sum(cashReservations.filter(r=>/ACTIVE|PARTIALLY/.test(r.status)),r=>r.remaining)),iconName:'lock',accent:'amber',foot:'Included in available-cash deductions',action:'reservation-active'})}${metricCard({label:'Requested',value:formatMoney(sum(cashReservations.filter(r=>r.status==='REQUESTED'),r=>r.amount)),iconName:'clock',accent:'blue',foot:'Awaiting independent checker',action:'reservation-requested'})}${metricCard({label:'Partially Consumed',value:formatMoney(sum(cashReservations.filter(r=>r.status==='PARTIALLY_CONSUMED'),r=>r.remaining)),iconName:'pie-chart',accent:'purple',foot:'Remaining amount is explainable',action:'reservation-partial'})}${metricCard({label:'Expiring in 14 Days',value:'3',iconName:'alert',accent:'red',foot:'Escalated under configured policy',trend:'negative',action:'reservation-expiring'})}</section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Reservation Register</h3><span class="table-badge">${cashReservations.length} records</span></div><div class="table-tools">${button('Lifecycle policy','reservation-policy','','info')}</div></div><div class="table-wrap"><table><thead><tr><th>Reservation / Source</th><th>Fund / Account</th><th>Beneficiary</th><th>Purpose</th><th>Original</th><th>Remaining</th><th>Required</th><th>Expiry</th><th>Status</th><th>Owner</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function renderStatementImports() {
    const rows=statementImports.map(i=>`<tr class="clickable" data-action="review-statement-import" data-id="${i.id}"><td class="table-primary">${escapeHTML(i.id)}<small>${escapeHTML(i.filename)}</small></td><td>${escapeHTML(i.provider)}<small>${escapeHTML(i.account)}</small></td><td>${escapeHTML(i.period)}</td><td>${i.lines.toLocaleString()}</td><td>${formatMoney(i.opening)}</td><td class="${i.movements>=0?'positive':'negative'}">${formatMoney(i.movements)}</td><td>${formatMoney(i.closing)}</td><td>${statusPill(i.duplicate,i.duplicate==='Clear'?'success':'warning')}</td><td>${i.errors?statusPill(`${i.errors} errors`,'danger'):statusPill(`${i.warnings} warnings`,i.warnings?'warning':'success')}</td><td>${statusPill(i.status)}</td></tr>`).join('');
    return `${pageHeader('External Statement Imports','Immutable source files, account mapping, raw-to-canonical preview, control totals, duplicate checks and maker-checker commit.',`${button('Download error template','download-import-template','','download')}${button('Upload statement','upload-statement','primary','upload')}`,'Cash & Reconciliation')}${cashContextBar()}
      <section class="metric-grid section-gap">${metricCard({label:'Lines Received',value:statementImports.reduce((t,i)=>t+i.lines,0).toLocaleString(),iconName:'list',accent:'brand',foot:'Across 4 provider batches',action:'import-lines'})}${metricCard({label:'Committed Batches',value:String(statementImports.filter(i=>i.status==='COMMITTED').length),iconName:'check-circle',accent:'emerald',foot:'Immutable external evidence',action:'import-committed'})}${metricCard({label:'Pending Approval',value:String(statementImports.filter(i=>i.status==='PENDING_APPROVAL').length),iconName:'user-check',accent:'blue',foot:'Reviewed staging version frozen',action:'import-pending'})}${metricCard({label:'Blocking Errors',value:String(sum(statementImports,i=>i.errors)),iconName:'alert',accent:'red',foot:'Must be resolved before commit',trend:'negative',action:'import-errors'})}</section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Import Batches</h3><span class="table-badge">Validate → review → approve → commit</span></div><div class="table-tools">${button('Provider layouts','provider-layouts','','settings')}</div></div><div class="table-wrap"><table><thead><tr><th>Batch / File</th><th>Provider / Account</th><th>Period</th><th>Lines</th><th>Opening</th><th>Movements</th><th>Closing</th><th>Duplicate</th><th>Validation</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function renderReconciliations() {
    const rows=reconciliationBatches.map(r=>`<tr class="clickable" data-action="open-reconciliation" data-id="${r.id}"><td class="table-primary">${escapeHTML(r.id)}<small>${escapeHTML(r.account)}</small></td><td>${escapeHTML(r.fund)}</td><td>${escapeHTML(r.period)}</td><td>${escapeHTML(r.currency)}</td><td>${formatMoney(r.internal,r.currency)}</td><td>${formatMoney(r.external,r.currency)}</td><td class="${Math.abs(r.variance)<=100?'positive':'negative'}">${formatMoney(r.variance,r.currency)}</td><td><div class="inline-progress">${progressBar(r.matched)}<span>${r.matched.toFixed(1)}%</span></div></td><td>${r.breaks}</td><td>${statusPill(r.status)}</td><td>${escapeHTML(r.owner)}</td></tr>`).join('');
    const matched=sum(reconciliationBatches,r=>r.matched)/reconciliationBatches.length;
    return `${pageHeader('Reconciliation Dashboard','Transaction, event, balance, omnibus and subledger-to-GL reconciliation by account, currency and period.',`${button('Export evidence pack','export-reconciliation-pack','','download')}${button('Start batch','start-reconciliation','primary','refresh')}`,'Cash & Reconciliation')}${cashContextBar()}
      <section class="metric-grid section-gap">${metricCard({label:'Average Matched',value:pct(matched),iconName:'refresh',accent:'emerald',foot:'Transaction population',action:'recon-matched'})}${metricCard({label:'Open Breaks',value:String(sum(reconciliationBatches,r=>r.breaks)),iconName:'alert',accent:'red',foot:'Each has owner, SLA and evidence',trend:'negative',action:'navigate-exceptions'})}${metricCard({label:'Ready to Close',value:String(reconciliationBatches.filter(r=>r.status==='READY_TO_CLOSE').length),iconName:'check-circle',accent:'blue',foot:'All close controls passed',action:'navigate-period-close'})}${metricCard({label:'Total Variance',value:formatMoney(sum(reconciliationBatches.filter(r=>r.currency==='USD'),r=>r.variance)),iconName:'bar-chart',accent:'amber',foot:'Adjusted external less internal',action:'recon-variance'})}${metricCard({label:'Missing Statements',value:'1',iconName:'file',accent:'purple',foot:'FBC Custody · critical blocker',action:'navigate-exceptions'})}${metricCard({label:'Pending Approvals',value:'4',iconName:'user-check',accent:'cyan',foot:'Independent checker or CFO',action:'recon-approvals'})}</section>
      <section class="reconciliation-dashboard-grid section-gap">${card('Reconciliation Health by Account',barChart({labels:reconciliationBatches.map(r=>r.account.split(' · ')[0]),series:[{name:'Matched %',color:'var(--brand)',values:reconciliationBatches.map(r=>r.matched)}],height:300,yLabel:'Percent',format:v=>`${v}%`,action:'recon-health-drill'}),{subtitle:'Click an account to open the reconciliation workspace.'})}${card('Break Ageing',donutChart([{label:'0–2 days',value:5,color:'var(--emerald)'},{label:'3–5 days',value:6,color:'var(--amber)'},{label:'6–10 days',value:2,color:'var(--orange)'},{label:'Over 10 days',value:1,color:'var(--red)'}],'14','Open items',155),{subtitle:'Ageing is measured on the configured business calendar.'})}</section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Account / Period Batches</h3><span class="table-badge">Balanced does not always mean fully reconciled</span></div><div class="table-tools">${button('Filters','reconciliation-filters','','filter')}</div></div><div class="table-wrap"><table><thead><tr><th>Batch / Account</th><th>Fund</th><th>Period</th><th>Currency</th><th>Internal Closing</th><th>External Closing</th><th>Variance</th><th>Matched</th><th>Breaks</th><th>Status</th><th>Owner</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function renderReconciliationWorkspace() {
    const batch=reconciliationBatches.find(r=>r.id===state.selectedReconciliationId)||reconciliationBatches[0];
    const internal=[['JRN-07198','Capital call receipt','31 Jul',15000000,'CC-2026-0038','Matched'],['JRN-07197','Investment disbursement','30 Jul',-12000025,'DISB-NOVA-001','Matched'],['JRN-07196','Bank charge expense','30 Jul',-125000,'EXP-7221','Suggested'],['JRN-07195','Portfolio proceeds','29 Jul',8500000,'PROC-EXIT-119','Partial']];
    const external=[['EXT-88419','CBZ CREDIT','31 Jul',15000000,'CALL 0038 MGFII','Matched'],['EXT-88402','CBZ DEBIT','30 Jul',-12000025,'NOVA SERIES B','Matched'],['EXT-88398','SERVICE FEE','30 Jul',-125000,'CHARGE JUL','Suggested'],['EXT-88377','INWARD TT','29 Jul',7800000,'EXIT PROCEEDS','Partial']];
    const pane=(title,rows,externalSide=false)=>`<section class="recon-pane"><div class="recon-pane-head"><div><strong>${title}</strong><small>${rows.length} visible lines · click a line for metadata</small></div>${button('Filter','reconciliation-filters','ghost compact','filter')}</div><div class="recon-line-list">${rows.map((row,i)=>`<button class="recon-line ${i===2?'selected':''}" data-action="select-recon-line" data-side="${externalSide?'external':'internal'}" data-id="${row[0]}"><span class="recon-line-check">${i<2?icon('check-circle'):i===2?icon('sparkles'):icon('clock')}</span><span><strong>${row[0]} · ${row[1]}</strong><small>${row[2]} · ${row[4]}</small></span><b class="${row[3]>=0?'positive':'negative'}">${formatMoney(row[3])}</b><em>${statusPill(row[5])}</em></button>`).join('')}</div></section>`;
    return `${pageHeader(`Reconciliation Workspace — ${batch.id}`,`${batch.fund} · ${batch.account} · ${batch.period}`,`${button('Back to dashboard','navigate-reconciliations','','arrow-left')}${button('Upload bank statement','upload-bank-statement-modal','','upload')}${button('Export evidence','export-reconciliation-pack','','download')}`,'Cash & Reconciliation')}${cashContextBar(batch.account.split(' · ')[0])}
      ${workspaceFilterBar([{label:'Period',action:'reconciliation-period',selected:state.reconciliationPeriod,options:['Jul 2026','Jun 2026','May 2026']},{label:'Match status',action:'reconciliation-status-filter',selected:'All lines',options:['All lines','Suggested','Partial','Unmatched','Matched']},{label:'Amount range',action:'reconciliation-amount-filter',selected:'All amounts',options:['All amounts','Under $100K','$100K–$1M','Over $1M']},{type:'button',label:'Expand comparison',action:'expand-reconciliation-comparison',icon:'maximize'}])}
      <section class="recon-proof-strip section-gap"><div><span>Internal closing</span><strong>${formatMoney(batch.internal,batch.currency)}</strong></div><div><span>External closing</span><strong>${formatMoney(batch.external,batch.currency)}</strong></div><div><span>Adjusted external</span><strong>${formatMoney(batch.adjusted,batch.currency)}</strong></div><div class="${Math.abs(batch.variance)<=100?'success':'danger'}"><span>Variance</span><strong>${formatMoney(batch.variance,batch.currency)}</strong></div><div><span>Tolerance</span><strong>${formatMoney(100,batch.currency)}</strong></div><div><span>Configuration</span><strong>USD-CASH-STD v4</strong></div></section>
      <section class="reconciliation-workspace-grid section-gap">${pane('Internal Cash Ledger',internal)}<section class="match-workbench"><div class="match-workbench-head"><strong>Source-to-ledger matching</strong>${button('Expand','expand-reconciliation-comparison','ghost compact','maximize')}</div><div class="match-score-ring"><strong>91</strong><span>suggestion score</span></div><div class="score-components"><div><span>Amount</span><b>100%</b></div><div><span>Date</span><b>90%</b></div><div><span>Reference</span><b>78%</b></div><div><span>Counterparty</span><b>95%</b></div></div><div class="reason-item warning">${icon('alert')}<div><strong>Human confirmation required</strong><small>Score is below auto-match threshold and one competing candidate exists.</small></div></div>${button('Confirm suggested match','confirm-recon-match','primary','check')}${button('Split / combine','split-recon-match','','layers')}${button('Raise exception','raise-recon-exception','','alert')}</section>${pane('External Statement Lines',external,true)}</section>
      <section class="card section-gap"><div class="card-head"><div><h3>Balance Proof & Residuals</h3><p>Every difference remains visible until matched, explained or independently approved.</p></div>${statusPill(batch.status)}</div><div class="card-body"><div class="balance-proof-grid"><button data-action="recon-balance-detail"><span>Opening balance</span><strong>${formatMoney(batch.opening,batch.currency)}</strong></button><button data-action="recon-inflows-detail"><span>Posted inflows</span><strong class="positive">${formatMoney(23500000,batch.currency)}</strong></button><button data-action="recon-outflows-detail"><span>Posted outflows</span><strong class="negative">${formatMoney(-8500000,batch.currency)}</strong></button><button data-action="recon-closing-detail"><span>Internal closing</span><strong>${formatMoney(batch.internal,batch.currency)}</strong></button><button data-action="recon-timing-detail"><span>Timing items</span><strong>${formatMoney(batch.adjusted-batch.external,batch.currency)}</strong></button><button data-action="recon-variance-detail"><span>Unexplained variance</span><strong class="${batch.variance?'negative':'positive'}">${formatMoney(batch.variance,batch.currency)}</strong></button></div></div></section>`;
  }

  function renderExceptions() {
    const rows=reconciliationExceptions.map(e=>`<tr class="clickable" data-action="open-recon-exception" data-id="${e.id}"><td class="table-primary">${escapeHTML(e.id)}<small>${escapeHTML(e.batch)}</small></td><td>${statusPill(e.code,'info')}</td><td>${escapeHTML(e.account)}</td><td>${formatMoney(e.amount,e.currency)}</td><td>${statusPill(e.severity,e.severity==='Critical'||e.severity==='High'?'danger':e.severity==='Medium'?'warning':'info')}</td><td>${escapeHTML(e.owner)}</td><td>${e.age} days</td><td>${escapeHTML(e.due)}</td><td>${statusPill(e.status)}</td><td>${e.evidence} files</td></tr>`).join('');
    return `${pageHeader('Reconciliation Exceptions','Owned investigation cases for unmatched, duplicated, stale, suspense, policy and balance differences.',`${button('Export exceptions','export-exceptions','','download')}${button('Create exception','create-exception','primary','plus')}`,'Cash & Reconciliation')}${cashContextBar()}
      <section class="exception-summary section-gap"><div class="exception-tile critical"><span>Critical</span><strong>${reconciliationExceptions.filter(e=>e.severity==='Critical').length}</strong><small>Blocks close immediately</small></div><div class="exception-tile high"><span>High</span><strong>${reconciliationExceptions.filter(e=>e.severity==='High').length}</strong><small>Due within 24 hours</small></div><div class="exception-tile medium"><span>Medium</span><strong>${reconciliationExceptions.filter(e=>e.severity==='Medium').length}</strong><small>Assigned and ageing</small></div><div class="exception-tile"><span>Pending approval</span><strong>${reconciliationExceptions.filter(e=>e.status==='PENDING_APPROVAL').length}</strong><small>Checker decision needed</small></div><div class="exception-tile"><span>Total exposure</span><strong>${formatMoney(sum(reconciliationExceptions.filter(e=>e.currency==='USD'),e=>e.amount))}</strong><small>USD exceptions only</small></div></section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Exception Case Register</h3><span class="table-badge">Immutable activity and evidence trail</span></div><div class="table-tools">${button('SLA view','exception-sla-view','','clock')}${button('Filters','exception-filters','','filter')}</div></div><div class="table-wrap"><table><thead><tr><th>Case / Batch</th><th>Category</th><th>Account</th><th>Amount</th><th>Severity</th><th>Owner</th><th>Age</th><th>Due</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function renderPeriodClose() {
    const passedCount=closeControls.filter(item=>item.passed).length;
    const blockerCount=closeControls.length-passedCount;
    const readiness=Math.round(passedCount/closeControls.length*100);
    return `${pageHeader('Period Close & General-Ledger Control','Itemised pre-check, approvals, immutable close version, reopen/restatement and idempotent accounting export.',`${button('Download evidence pack','export-close-pack','','download')}${button('Run close pre-check','run-close-precheck','primary','refresh')}`,'Cash & Reconciliation')}${cashContextBar()}
      <section class="close-hero section-gap"><div><span>Close period</span><strong>July 2026</strong><small>Matanho Capital Zimbabwe · 5 funds · USD and ZWG</small></div><div class="close-readiness"><div class="radial-progress" style="--value:${readiness}"><strong>${readiness}%</strong><small>ready</small></div><div><strong>${passedCount} controls passed</strong><span>${blockerCount} blocker${blockerCount===1?'':'s'} must be cleared before approval</span></div></div><div class="close-actions">${statusPill('RECONCILING','warning')}${button('Request approval','request-close-approval','','user-check')}</div></section>
      <section class="close-layout section-gap"><section class="card"><div class="card-head"><div><h3>Close Checklist</h3><p>Click any control to inspect calculations, source records, evidence and remediation.</p></div><span class="table-badge">${passedCount} / ${closeControls.length} passed</span></div><div class="card-body close-check-list">${closeControls.map(control=>`<button class="close-check ${control.passed?'passed':'blocked'}" data-action="open-close-control" data-id="${control.id}"><span>${icon(control.passed?'check-circle':'alert')}</span><span><strong>${escapeHTML(control.title)}</strong><small>${escapeHTML(control.detail)}</small></span>${control.passed?statusPill('Passed','success'):statusPill(control.severity==='Critical'?'Critical blocker':'Blocker','danger')}${icon('chevron-right')}</button>`).join('')}</div></section><section class="side-stack">${card('Approval Route',`<div class="approval-route"><div class="done"><span>1</span><div><strong>Cash Operations</strong><small>Nyasha Moyo · complete 31 Jul</small></div></div><div class="done"><span>2</span><div><strong>Fund Accounting</strong><small>Laura Chen · complete 31 Jul</small></div></div><div class="current"><span>3</span><div><strong>Compliance / Risk</strong><small>Anita Kapoor · in review</small></div></div><div><span>4</span><div><strong>CFO Certification</strong><small>Tariro Kasere · pending</small></div></div></div>`)}${card('General-Ledger Export',`<div class="info-list"><div class="info-row"><span>Approved journals</span><strong>4</strong></div><div class="info-row"><span>Debit / Credit control</span><strong>$35.6M / $35.6M</strong></div><div class="info-row"><span>Checksum</span><strong>9F2A…71C8</strong></div><div class="info-row"><span>Accounting status</span><strong>${statusPill('4 accepted · 1 pending','warning')}</strong></div></div><div class="section-gap">${button('Create GL export','create-gl-export','primary','send')}</div>`)}</section></section>`;
  }

  function vaultDocumentTable(items=documents) {
    return `<div class="table-wrap"><table><thead><tr><th>Document</th><th>Folder</th><th>Version</th><th>Owner</th><th>Classification</th><th>Signature</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${items.map(doc=>`<tr><td class="table-primary"><button class="document-name-button" data-action="preview-document" data-id="${doc.id}"><span class="document-row-icon">${icon(doc.type==='XLSX'?'bar-chart':'file')}</span><span>${escapeHTML(doc.name)}<small>${escapeHTML(doc.type)} · ${escapeHTML(doc.size)}</small></span></button></td><td>${escapeHTML(doc.folder)}</td><td>${escapeHTML(doc.version)}</td><td>${escapeHTML(doc.owner)}</td><td>${statusPill(doc.classification,'neutral')}</td><td>${statusPill(doc.signatureStatus,doc.signatureStatus==='Not required'?'neutral':doc.signatureStatus.includes('Awaiting')?'warning':'info')}</td><td>${statusPill(doc.status)}</td><td>${escapeHTML(doc.uploaded)}</td><td><div class="row-actions">${button('Preview','preview-document','compact','eye',`data-id="${doc.id}"`)}${button('Ledger','edit-document-ledger','ghost compact','list',`data-id="${doc.id}"`)}${button('Download','document-download-menu','ghost compact','download',`data-id="${doc.id}"`)}${/Term Sheet|Agreement/.test(doc.name)?button('E-sign','open-signature-studio','ghost compact','edit',`data-id="${doc.id}"`):''}</div></td></tr>`).join('')}</tbody></table></div>`;
  }

  function renderDocumentsVault() {
    const folders=[...new Set(documents.map(d=>d.folder))];
    return `${pageHeader('Documents Vault','Secure, classified and auditable investment-document repository with native previews, versions, access controls and e-signature.',`${button('Request document','request-document','','send')}${button('Upload files','vault-upload','primary','upload')}`,'Reporting & Records')}
      <section class="vault-stats section-gap"><div>${icon('folder')}<span><strong>${folders.length}</strong><small>Controlled folders</small></span></div><div>${icon('file')}<span><strong>${documents.length}</strong><small>Active documents</small></span></div><div>${icon('edit')}<span><strong>${documents.filter(d=>d.signatureStatus!=='Not required').length}</strong><small>Signature-enabled</small></span></div><div>${icon('shield')}<span><strong>100%</strong><small>Encrypted & audit logged</small></span></div><div>${icon('clock')}<span><strong>2</strong><small>Retention reviews due</small></span></div></section>
      <section class="vault-layout section-gap"><aside class="vault-folder-panel"><div class="vault-panel-head"><strong>Folders</strong>${button('','create-folder','ghost compact icon-only','plus')}</div><button class="vault-folder active" data-action="vault-filter-folder" data-folder="all">${icon('layers')}<span>All documents<small>${documents.length} records</small></span><b>${documents.length}</b></button>${folders.map(folder=>`<button class="vault-folder" data-action="vault-filter-folder" data-folder="${escapeHTML(folder)}">${icon('folder')}<span>${escapeHTML(folder)}<small>${documents.filter(d=>d.folder===folder).length} records</small></span><b>${documents.filter(d=>d.folder===folder).length}</b></button>`).join('')}</aside><section class="card table-card vault-records"><div class="table-toolbar"><div class="table-title-row"><h3>Document Register</h3><span class="table-badge">Preview and export every record</span></div><div class="table-tools"><label class="table-search">${icon('search')}<input placeholder="Search documents"></label>${button('Filters','document-vault-filters','','filter')}${button('View','toggle-vault-view','','grid')}</div></div>${vaultDocumentTable()}</section></section>`;
  }

  function renderReportsVault() {
    const cards=reportVaultItems.map(report=>`<article class="report-vault-card"><div class="report-cover professional"><span>${icon(report.type.includes('Valuation')?'trend-up':report.type.includes('IC')?'users':report.type.includes('Operations')?'bank':'file-chart')}</span><div><small>${escapeHTML(report.type)}</small><strong>${escapeHTML(report.period)}</strong></div><em>${escapeHTML(report.classification)}</em></div><div class="report-vault-body"><div class="report-vault-title"><div><h3>${escapeHTML(report.name)}</h3><p>${escapeHTML(report.fund)} · ${escapeHTML(report.version)}</p></div>${statusPill(report.status)}</div><div class="report-meta-grid"><span><small>Generated</small><strong>${escapeHTML(report.generated)}</strong></span><span><small>Pages</small><strong>${report.pages}</strong></span><span><small>Recipients</small><strong>${report.recipients}</strong></span><span><small>Owner</small><strong>${escapeHTML(report.owner)}</strong></span></div><div class="report-vault-actions">${button('Preview','preview-vault-report','','eye',`data-id="${report.id}"`)}${button('Edit ledger','edit-report-ledger','','list',`data-id="${report.id}"`)}${button('Download','report-download-menu','primary','download',`data-id="${report.id}"`)}</div></div></article>`).join('');
    return `${pageHeader('Reports Vault','Institutional fund, portfolio, IC, valuation, cash-control and investor report packs with professional templates and editable publication ledgers.',`${button('Generate report','generate-report','','plus')}${button('Build report pack','open-report-builder','primary','file-chart')}`,'Reporting & Records')}
      ${workspaceFilterBar([{label:'Fund',action:'report-vault-fund',selected:state.reportFilterFund,options:['All Funds',...funds.map(f=>f.name)]},{label:'Report type',action:'report-vault-type',selected:'All report types',options:['All report types','Fund Report','Portfolio Report','IC Pack','Valuation Report','Cash Control']},{label:'Status',action:'report-vault-status',selected:state.reportFilterStatus,options:['All Statuses','Published','In Review','Draft']},{label:'Period',action:'report-vault-period',selected:'Q2 2026',options:['Q2 2026','Q1 2026','FY 2025']}])}
      <section class="metric-grid section-gap">${metricCard({label:'Published Reports',value:String(reportVaultItems.filter(r=>r.status==='Published').length),iconName:'check-circle',accent:'emerald',foot:'Distribution evidence retained',action:'reports-published'})}${metricCard({label:'In Review',value:String(reportVaultItems.filter(r=>r.status==='In Review').length),iconName:'user-check',accent:'blue',foot:'Approval and commentary workflow',action:'reports-review'})}${metricCard({label:'Total Pages',value:sum(reportVaultItems,r=>r.pages).toLocaleString(),iconName:'file',accent:'brand',foot:'Across active report versions',action:'reports-pages'})}${metricCard({label:'Scheduled Distributions',value:'8',iconName:'send',accent:'purple',foot:'LP portal and secure email',action:'reports-distributions'})}</section><section class="report-vault-grid section-gap">${cards}</section>`;
  }

  function renderESignatures() {
    const rows=signatureEnvelopes.map(e=>`<tr class="clickable" data-action="open-envelope" data-id="${e.id}"><td class="table-primary">${escapeHTML(e.id)}<small>${escapeHTML(e.subject)}</small></td><td><button class="text-link" data-action="open-signature-studio" data-id="${e.documentId}">${escapeHTML(e.document)}</button></td><td>${e.recipients.map(r=>`<span class="signer-chip">${initials(r[0])} ${escapeHTML(r[0])}</span>`).join('')}</td><td><div class="inline-progress">${progressBar(e.progress)}<span>${e.progress}%</span></div></td><td>${statusPill(e.status)}</td><td>${escapeHTML(e.sent)}</td><td>${escapeHTML(e.expires)}</td><td><div class="row-actions">${button('Open','open-envelope','compact','eye',`data-id="${e.id}"`)}${button('Activity','activity-menu','ghost compact','clock',`data-context="envelope" data-id="${e.id}"`)}</div></td></tr>`).join('');
    return `${pageHeader('E-Signatures','DocuSign-style preparation, signing order, secure delivery, audit evidence and completion certificates for termsheets and documents.',`${button('Signature templates','signature-templates','','layers')}${button('New envelope','new-signature-envelope','primary','edit')}`,'Reporting & Records')}
      <section class="signature-summary section-gap"><div class="signature-summary-card"><span class="signature-orb">${icon('send')}</span><div><strong>${signatureEnvelopes.filter(e=>e.status!=='Completed').length}</strong><small>Active envelopes</small></div></div><div class="signature-summary-card"><span class="signature-orb success">${icon('check')}</span><div><strong>${signatureEnvelopes.filter(e=>e.status==='Completed').length}</strong><small>Completed this month</small></div></div><div class="signature-summary-card"><span class="signature-orb warning">${icon('clock')}</span><div><strong>2</strong><small>Awaiting recipients</small></div></div><div class="signature-summary-card"><span class="signature-orb danger">${icon('alert')}</span><div><strong>1</strong><small>Action required</small></div></div></section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Signature Envelopes</h3><span class="table-badge">Electronic evidence and signing order</span></div><div class="table-tools">${button('Filters','signature-filters','','filter')}</div></div><div class="table-wrap"><table><thead><tr><th>Envelope / Subject</th><th>Document</th><th>Recipients</th><th>Progress</th><th>Status</th><th>Sent</th><th>Expires</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function renderMailerLists() {
    const totalMembers=sum(mailerLists,list=>list.members);
    const rows=mailerLists.map(list=>`<tr class="clickable" data-action="open-mailer-list" data-id="${list.id}"><td class="table-primary"><span class="document-name-cell"><span class="document-row-icon">${icon('mail')}</span><span>${escapeHTML(list.name)}<small>${escapeHTML(list.description)}</small></span></span></td><td>${escapeHTML(list.source)}</td><td>${list.members}</td><td>${list.active}</td><td>${list.pending}</td><td>${list.bounced}</td><td>${escapeHTML(list.channels.join(' · '))}</td><td>${escapeHTML(list.owner)}</td><td>${statusPill(list.status)}</td><td><div class="row-actions">${button('Open','open-mailer-list','compact','eye',`data-id="${list.id}"`)}${button('Activity','activity-menu','ghost compact','clock',`data-context="mailer-list" data-id="${list.id}"`)}</div></td></tr>`).join('');
    const cards=mailerLists.slice(0,3).map(list=>`<article class="mailer-card" data-action="open-mailer-list" data-id="${list.id}"><div class="mailer-card-head"><span class="mailer-icon">${icon('mail')}</span><div><strong>${escapeHTML(list.name)}</strong><small>${escapeHTML(list.source)}</small></div>${statusPill(list.status)}</div><div class="mailer-card-metrics"><span><small>Members</small><strong>${list.members}</strong></span><span><small>Active</small><strong>${list.active}</strong></span><span><small>Campaigns</small><strong>${list.campaigns}</strong></span></div><div class="tag-row">${list.tags.map(tag=>`<span class="table-badge">${escapeHTML(tag)}</span>`).join('')}</div></article>`).join('');
    return `${pageHeader('Mailer Lists','Create governed audiences for LP reporting, capital calls, portfolio communications, events and regulatory distribution.',`${button('New campaign','mailer-new-campaign','','send')}${button('Create mailer list','create-mailer-list','primary','plus')}`,'Reporting & Records')}
      ${workspaceFilterBar([{label:'Audience type',action:'mailer-type-filter',selected:'All audiences',options:['All audiences','LPs','Governance','Portfolio companies','Regulatory']},{label:'Status',action:'mailer-status-filter',selected:'All Statuses',options:['All Statuses','Active','Review','Draft']},{label:'Channel',action:'mailer-channel-filter',selected:'All channels',options:['All channels','Secure email','LP portal','Email','Event portal']},{type:'button',label:'Export lists',action:'export-mailer-lists',icon:'download'}])}
      <section class="metric-grid section-gap">${metricCard({label:'Mailer Lists',value:String(mailerLists.length),iconName:'mail',accent:'brand',foot:'Governed distribution audiences',action:'mailer-lists-metric'})}${metricCard({label:'Unique Recipients',value:String(totalMembers),iconName:'users',accent:'blue',foot:'Before cross-list deduplication',action:'mailer-recipient-metric'})}${metricCard({label:'Verified Contacts',value:String(sum(mailerLists,list=>list.active)),iconName:'check-circle',accent:'emerald',foot:'Consent or authority evidenced',action:'mailer-verified-metric'})}${metricCard({label:'Needs Review',value:String(sum(mailerLists,list=>list.pending+list.bounced)),iconName:'alert',accent:'amber',foot:'Pending consent or delivery issue',action:'mailer-review-metric'})}</section>
      <section class="mailer-card-grid section-gap">${cards}</section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Audience Register</h3><span class="table-badge">Source rules and consent evidence retained</span></div><div class="table-tools"><label class="table-search">${icon('search')}<input placeholder="Search mailer lists"></label>${button('Columns','mailer-columns','','grid')}</div></div><div class="table-wrap"><table><thead><tr><th>Mailer List</th><th>Source</th><th>Members</th><th>Active</th><th>Pending</th><th>Bounced</th><th>Channels</th><th>Owner</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function render() {
    try {
    const previousScrollTop = workspace ? workspace.scrollTop : 0;
    const preserveScroll = lastRenderedPage === state.page;
    rootEl.dataset.theme = state.theme; document.body.dataset.theme = state.theme;
    document.documentElement.style.colorScheme = state.theme;
    $('#app')?.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
    sidebar?.classList.toggle('mobile-open', state.mobileNavOpen);
    renderNav();
    renderStaticIcons();

    let html = '';
    switch (state.page) {
      case 'dashboard': html = renderDashboard(); break;
      case 'deals': html = renderDealFlow(); break;
      case 'funds': html = renderFunds(); break;
      case 'capital-calls': html = renderCapitalCalls(); break;
      case 'companies': html = renderCompanies(); break;
      case 'reporting': html = renderReporting(); break;
      case 'fund-performance': html = renderFundPerformance(); break;
      case 'lps': html = renderLPManagement(); break;
      case 'cash-accounts': html = renderCashAccounts(); break;
      case 'cash-overview': html = renderCashOverview(); break;
      case 'cash-ledger': html = renderCashLedger(); break;
      case 'cash-reservations': html = renderCashReservations(); break;
      case 'statement-imports': html = renderStatementImports(); break;
      case 'reconciliations': html = renderReconciliations(); break;
      case 'reconciliation-workspace': html = renderReconciliationWorkspace(); break;
      case 'exceptions': html = renderExceptions(); break;
      case 'period-close': html = renderPeriodClose(); break;
      case 'documents-vault': html = renderDocumentsVault(); break;
      case 'reports-vault': html = renderReportsVault(); break;
      case 'e-signatures': html = renderESignatures(); break;
      case 'mailer-lists': html = renderMailerLists(); break;
      case 'deal-detail': html = renderDealDetail(); break;
      case 'company-detail': html = renderCompanyDetail(); break;
      case 'fund-detail': html = renderFundDetail(); break;
      case 'lp-detail': html = renderLPDetail(); break;
      case 'capital-call-detail': html = renderCapitalCallDetail(); break;
      case 'report-builder': html = renderReportBuilder(); break;
      case 'applicant-portal': html = renderApplicantPortal(); break;
      case 'settings': html = renderSettings(); break;
      case 'analytics-detail': html = renderAnalyticsDetail(); break;
      default: html = renderDashboard();
    }
    if (!workspace) return;
    workspace.innerHTML = `<div class="page page-enter">${html}</div><div id="chartTooltip" class="chart-tooltip"></div>`;
    renderStaticIcons(workspace);
    workspace.scrollTop = preserveScroll ? previousScrollTop : 0;
    lastRenderedPage = state.page;
    bindDynamicElements();
    emitIntegrationEvent('matanho:state-change', publicSnapshot());
    } catch (err) {
      console.error('[portfolio-v11] render failed', err);
      try {
        if (workspace) {
          workspace.innerHTML = `<div class="page"><div class="empty-state"><h3>Unable to render this view</h3><p>${escapeHTML(err && err.message ? err.message : 'Unexpected error')}</p></div></div>`;
        }
      } catch (_) {}
    }
  }

  function renderDashboard() {
    const totalInvested = sum(companies,c => c.invested);
    const committed = sum(funds,f => f.commitment);
    const nav = sum(funds,f => f.nav);
    const distributed = sum(funds,f => f.distributed);
    const activeCompanies = companies.length;
    const unrealized = sum(companies,c => c.fairValue);

    const performance = barChart({
      labels:['2022','2023','2024','2025','2026 YTD'],
      series:[
        { name:'Capital invested', color:'var(--emerald)', values:[20,78,66,22,8] },
        { name:'Distributions', color:'var(--blue)', values:[5,-30,28,41,29] },
        { name:'Other expenses', color:'var(--amber)', values:[-2,5,4,-8,2] },
        { name:'Net cash flow', color:'var(--navy)', values:[8,34,82,63,31] }
      ],
      yLabel:'USD (Millions)',
      format:v => `${v}M`
    });
    const jCurve = lineChart({
      labels:['Year 0','Year 1','Year 2','Year 3','Year 4','Year 5','Year 6+'],
      series:[{ name:'Net Cash Flow (USD)', color:'var(--blue)', values:[0,-52,-75,-45,-5,29,51] }],
      yLabel:'USD (Millions)', format:v=>`${v}M`
    });
    const sectorSegments = [
      {label:'Software',value:34.2,color:'#2475f5',display:'34.2%'},
      {label:'Healthcare',value:23.1,color:'#0ba780',display:'23.1%'},
      {label:'Consumer',value:19.8,color:'#f5a623',display:'19.8%'},
      {label:'FinTech',value:12.7,color:'#60a5fa',display:'12.7%'},
      {label:'Industrials',value:6.5,color:'#11a5b7',display:'6.5%'},
      {label:'Other',value:3.7,color:'#adb5c3',display:'3.7%'}
    ];

    const portfolioRows = companies.map(company => `<tr class="clickable" data-action="open-company" data-id="${company.id}"><td><div class="company-cell">${companyLogo(company)}<span class="table-primary">${escapeHTML(company.name)}</span></div></td><td>${escapeHTML(company.sector)}</td><td class="text-right">${formatMoney(company.invested)}</td><td class="text-right">${formatMoney(Math.max(0,company.fairValue-company.invested))}</td><td class="text-right">${formatMoney(company.fairValue)}</td><td class="text-right">${(company.fairValue/company.invested).toFixed(2)}x</td><td class="text-right positive">${pct(company.revenueGrowth)}</td><td>${healthScore(company.health)}</td><td>${statusPill(company.health >= 70 ? 'Active' : 'Watchlist')}</td></tr>`).join('');

    return `${pageHeader('Portfolio Dashboard','Cross-fund performance, allocation and portfolio-company health.',globalPageActions({ extra: button('Add Deal','add-deal','primary','plus') }))}
      ${workspaceFilterBar([{label:'Fund',action:'dashboard-fund-filter',selected:'All Funds',options:['All Funds',...funds.map(f=>f.name)]},{label:'As of',action:'dashboard-period-filter',selected:'31 Jul 2026',options:['31 Jul 2026','30 Jun 2026','31 Mar 2026','31 Dec 2025']},{label:'Currency',action:'dashboard-currency-filter',selected:'USD',options:['USD','ZWG','Reporting currency']},{label:'Geography',action:'dashboard-geography-filter',selected:'All geographies',options:['All geographies','Southern Africa','East Africa','West Africa']},{type:'button',label:'Reset',action:'reset-dashboard-filters',icon:'refresh'}])}
      <section class="metric-grid section-gap">
        ${metricCard({label:'Total Invested',value:formatMoney(totalInvested),iconName:'dollar',accent:'emerald',foot:'12.4% vs 31 Dec 2025',action:'metric-invested'})}
        ${metricCard({label:'Available for Drawdown',value:formatMoney(committed-sum(funds,f=>f.called)),iconName:'wallet',accent:'blue',foot:'39.2% of commitments',action:'metric-drawdown'})}
        ${metricCard({label:'Fund Gross IRR',value:'18.7%',iconName:'trend-up',accent:'purple',foot:'1.6pp vs prior period',action:'metric-irr'})}
        ${metricCard({label:'LP Net IRR',value:'14.9%',iconName:'users',accent:'cyan',foot:'1.3pp vs prior period',action:'metric-net-irr'})}
        ${metricCard({label:'TVPI',value:'2.18x',iconName:'bar-chart',accent:'amber',foot:'DPI 0.62x',action:'metric-tvpi'})}
        ${metricCard({label:'Unrealized Value',value:formatMoney(unrealized),iconName:'pie-chart',accent:'brand',foot:`${activeCompanies} active companies`,action:'metric-unrealized'})}
      </section>
      <section class="chart-grid">
        ${card('Performance Overview',performance,{subtitle:'By activity type (USD)',tools:selectControl('Performance fund',['All Funds','Growth Funds','Venture Funds'],'All Funds','dashboard-chart-fund'),classes:'chart-card'})}
        ${card('J-Curve',jCurve,{subtitle:'Net cash flow since inception',tools:selectControl('J-curve fund',['All Funds','Fund II','Venture I'],'All Funds','dashboard-chart-fund'),classes:'chart-card'})}
      </section>
      <section class="dashboard-lower">
        ${card('Sector Allocation',donutChart(sectorSegments,formatMoney(committed),'Committed',112),{footer:'<button class="card-link" data-action="chart-drilldown" data-chart-label="Sector Allocation" data-chart-value="Committed capital by sector">View full allocation</button>'})}
        ${card('Portfolio Value Trend',lineChart({labels:['Q1 2026','Q2 2026','Q3 2026','Q4 2026','Q1 2027'],series:[{name:'Value growth',color:'var(--brand)',values:[-10,45,92,132,148]}],height:190,format:v=>`${v}%`}),{footer:'<button class="card-link" data-action="chart-drilldown" data-chart-label="Portfolio Value Trend" data-chart-value="Quarterly portfolio mark movements">View detailed analytics</button>'})}
        ${card('Quick Overview',`<ul class="activity-list"><li class="activity-item"><span class="activity-icon" style="color:var(--blue);background:var(--blue-soft)">${icon('building')}</span><span class="activity-copy"><strong>Active Investments</strong><small>Across 5 funds</small></span><span class="activity-amount">18</span></li><li class="activity-item"><span class="activity-icon" style="color:var(--emerald);background:var(--emerald-soft)">${icon('check-circle')}</span><span class="activity-copy"><strong>Realised Investments</strong><small>Since inception</small></span><span class="activity-amount">7</span></li><li class="activity-item"><span class="activity-icon" style="color:var(--orange);background:var(--orange-soft)">${icon('briefcase')}</span><span class="activity-copy"><strong>Total Companies</strong><small>Active and realised</small></span><span class="activity-amount">25</span></li><li class="activity-item"><span class="activity-icon" style="color:var(--purple);background:var(--purple-soft)">${icon('trend-up')}</span><span class="activity-copy"><strong>Unrealized Value</strong><small>Current fair value</small></span><span class="activity-amount">${formatMoney(unrealized)}</span></li></ul>`) }
        ${card('Recent Activity',`<ul class="activity-list"><li class="activity-item"><span class="status-dot online"></span><span class="activity-copy"><strong>Nova Analytics</strong><small>Term sheet signed · 2 days ago</small></span></li><li class="activity-item"><span class="status-dot" style="background:var(--amber)"></span><span class="activity-copy"><strong>GreenOrbit Energy</strong><small>Capital call · 4 days ago</small></span></li><li class="activity-item"><span class="status-dot" style="background:var(--red)"></span><span class="activity-copy"><strong>Mukuru Logistics</strong><small>Board meeting · 5 days ago</small></span></li><li class="activity-item"><span class="status-dot" style="background:var(--blue)"></span><span class="activity-copy"><strong>Nyasha Foods</strong><small>Quarterly report · 1 week ago</small></span></li></ul>`,{tools:'<button class="card-link" data-action="open-activity">View all</button>'})}
      </section>
      <section class="card table-card">
        <div class="table-toolbar"><div class="table-title-row"><h3>Portfolio Summary</h3><span class="table-badge">${companies.length} companies</span></div><div class="table-tools"><div class="table-search">${icon('search')}<input type="text" placeholder="Filter portfolio..." data-input-action="table-search" value="${escapeHTML(state.tableSearch)}"></div>${button('Export summary','export-companies','compact','download')}</div></div>
        <div class="table-wrap"><table><thead><tr><th>Company</th><th>Sector</th><th class="text-right">Investment Cost</th><th class="text-right">Value Created</th><th class="text-right">Fair Market Value</th><th class="text-right">MOIC</th><th class="text-right">Revenue Growth</th><th>Health</th><th>Status</th></tr></thead><tbody>${portfolioRows}</tbody></table></div>
      </section>`;
  }

  function renderDealFlow() {
    const stageColors = {'Sourcing':'#3b82f6','Screening':'#0ea5a8','Initial Review':'#60a5fa','Investment Committee':'#f59e0b','Due Diligence':'#2563eb','Term Sheet':'#0ea5a8','Portfolio':'#10b981','Rejected':'#ef4444'};
    const pipelineValue=sum(deals,d=>d.amount);
    const wonDeals=deals.filter(d=>d.stage==='Portfolio');
    const lostDeals=deals.filter(d=>d.stage==='Rejected');
    const metrics=[
      {label:'Pipeline Value',value:formatMoney(pipelineValue),iconName:'dollar',accent:'emerald',foot:'18.6% vs prior period',action:'metric-pipeline'},
      {label:'Active Deals',value:String(deals.filter(d=>!['Portfolio','Rejected'].includes(d.stage)).length),iconName:'briefcase',accent:'blue',foot:'Across all stages',action:'metric-active-deals'},
      {label:'Due Diligence',value:String(deals.filter(d=>d.stage==='Due Diligence').length),iconName:'search',accent:'purple',foot:formatMoney(sum(deals.filter(d=>d.stage==='Due Diligence'),d=>d.amount)),action:'metric-dd'},
      {label:'IC Pending',value:String(deals.filter(d=>d.stage==='Investment Committee').length),iconName:'users',accent:'amber',foot:formatMoney(sum(deals.filter(d=>d.stage==='Investment Committee'),d=>d.amount)),action:'metric-ic'},
      {label:'Won',value:String(wonDeals.length),iconName:'check-circle',accent:'emerald',foot:formatMoney(sum(wonDeals,d=>d.amount)),action:'metric-won'},
      {label:'Lost',value:String(lostDeals.length),iconName:'x',accent:'red',foot:formatMoney(sum(lostDeals,d=>d.amount)),trend:'negative',action:'metric-lost'}
    ];
    const kanban=`<div class="kanban-shell"><div class="kanban">${dealStages.map(stage=>{const stageDeals=deals.filter(deal=>deal.stage===stage);const value=sum(stageDeals,d=>d.amount);return `<section class="kanban-column" data-stage="${stage}" style="--kanban-tint:${stageColors[stage]}18"><div class="kanban-head"><div class="kanban-title" style="color:${stageColors[stage]}">${escapeHTML(stage)}<span class="kanban-count">${stageDeals.length}</span></div><span class="kanban-value">${formatMoney(value)}</span></div>${stageDeals.map(deal=>`<article class="deal-card" draggable="true" data-deal-id="${deal.id}" data-action="open-deal"><div class="deal-card-head"><div><h4>${escapeHTML(deal.name)}</h4><p>${escapeHTML(deal.sector)}</p></div>${statusPill(deal.round,'neutral')}</div><div class="deal-meta"><span>Round <strong>${escapeHTML(deal.round)}</strong></span><span>Ask <strong>${formatMoney(deal.amount)}</strong></span><span>Age <strong>${deal.age} days</strong></span><span>Score <strong>${deal.score}/100</strong></span></div><div class="deal-card-foot"><span class="owner-mini">${avatar(deal.owner,deal.id.charCodeAt(deal.id.length-1))}${escapeHTML(deal.owner.split(' ')[0])}</span><span class="priority ${deal.priority.toLowerCase()}">${escapeHTML(deal.priority)}</span></div></article>`).join('')}${stageDeals.length<4&&!['Portfolio','Rejected'].includes(stage)?`<button class="button ghost compact" style="width:100%;margin-top:7px" data-action="add-deal" data-stage="${stage}">${icon('plus')} Add deal</button>`:''}</section>`}).join('')}</div></div>`;
    const listView=`<section class="card table-card deal-list-view"><div class="table-toolbar"><div class="table-title-row"><h3>Deal Register</h3><span class="table-badge">${deals.length} opportunities</span></div><div class="table-tools"><label class="table-search">${icon('search')}<input placeholder="Search deals"></label>${button('Columns','deal-list-columns','','grid')}${button('Export','export-deals','','download')}</div></div><div class="table-wrap"><table><thead><tr><th>Deal</th><th>Stage</th><th>Sector</th><th>Round</th><th class="text-right">Ask</th><th>Owner</th><th>Age</th><th>Score</th><th>Priority</th><th>Next action</th><th></th></tr></thead><tbody>${deals.map((deal,index)=>`<tr class="clickable" data-action="open-deal" data-deal-id="${deal.id}"><td class="table-primary">${escapeHTML(deal.name)}<small>${escapeHTML(deal.id)}</small></td><td>${statusPill(deal.stage,deal.stage==='Rejected'?'danger':deal.stage==='Portfolio'?'success':'info')}</td><td>${escapeHTML(deal.sector)}</td><td>${escapeHTML(deal.round)}</td><td class="text-right">${formatMoney(deal.amount)}</td><td><span class="owner-mini">${avatar(deal.owner,index)}${escapeHTML(deal.owner)}</span></td><td>${deal.age} days</td><td><div class="inline-progress">${progressBar(deal.score)}<span>${deal.score}</span></div></td><td><span class="priority ${deal.priority.toLowerCase()}">${escapeHTML(deal.priority)}</span></td><td>${['Review application','Complete screening','Prepare IC memo','Resolve DD findings','Finalise terms'][index%5]}</td><td>${button('Open','open-deal','compact','eye',`data-deal-id="${deal.id}"`)}</td></tr>`).join('')}</tbody></table></div></section>`;
    const calendarDays=Array.from({length:35},(_,i)=>{const day=i-1;const display=day<=0?day+30:day>31?day-31:day;const muted=day<=0||day>31;const dayDeals=deals.filter((_,idx)=>((idx*3+4)%28)+1===display&&!muted);return `<button class="deal-calendar-day ${muted?'muted':''} ${dayDeals.length?'has-deals':''}" data-action="deal-calendar-day" data-day="${display}"><span>${display}</span>${dayDeals.slice(0,2).map(deal=>`<em style="--stage-color:${stageColors[deal.stage]}">${escapeHTML(deal.name)}</em>`).join('')}${dayDeals.length>2?`<small>+${dayDeals.length-2} more</small>`:''}</button>`}).join('');
    const calendarView=`<section class="card deal-calendar-card"><div class="card-head"><div><h3>Deal activity calendar</h3><p>Reviews, IC meetings, diligence deadlines and closing milestones.</p></div>${button('Add milestone','add-deal-milestone','primary compact','plus')}</div><div class="card-body"><div class="deal-calendar-week">${['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day=>`<span>${day}</span>`).join('')}</div><div class="deal-calendar-grid">${calendarDays}</div></div></section>`;
    const view=state.dealView==='board'?kanban:state.dealView==='calendar'?calendarView:listView;
    const viewSwitch=`<div class="segmented-control deal-view-switch"><button class="${state.dealView==='list'?'active':''}" data-action="deal-view" data-view="list">${icon('list')} List</button><button class="${state.dealView==='board'?'active':''}" data-action="deal-view" data-view="board">${icon('grid')} Board</button><button class="${state.dealView==='calendar'?'active':''}" data-action="deal-view" data-view="calendar">${icon('calendar')} Calendar</button></div>`;
    return `${pageHeader('Deal Flow','Track investment opportunities from sourcing through investment, closing or rejection.',globalPageActions({includeDate:false,extra:`${viewSwitch}${button('Filters','deal-filters','','filter')}${button('Launch applicant portal','open-applicant-portal','','external-link')}${button('Add Deal','add-deal','primary','plus')}`}))}
      ${workspaceFilterBar([{label:'Fund',action:'deal-fund-filter',selected:'All Funds',options:['All Funds',...funds.map(f=>f.name)]},{label:'Stage',action:'deal-stage-filter',selected:'All stages',options:['All stages',...dealStages]},{label:'Owner',action:'deal-owner-filter',selected:'All owners',options:['All owners',...Array.from(new Set(deals.map(d=>d.owner)))]},{label:'Age',action:'deal-age-filter',selected:'All ages',options:['All ages','0–30 days','31–60 days','61+ days']}])}
      <section class="metric-grid section-gap">${metrics.map(metricCard).join('')}</section>${view}`;
  }

  function renderFunds() {
    const totalCommitment = sum(funds,f=>f.commitment);
    const called = sum(funds,f=>f.called);
    const distributed = sum(funds,f=>f.distributed);
    const dryPowder = totalCommitment - called;
    const strategies = {};
    funds.forEach(f=>strategies[f.strategy]=(strategies[f.strategy]||0)+f.commitment);
    const strategySegments = Object.entries(strategies).map(([label,value],index)=>({label,value,color:['#2475f5','#0ba780','#60a5fa','#f5a623','#0f98b6'][index],display:`${pct(value/totalCommitment*100)} · ${formatMoney(value)}`}));
    const geographies = [
      {label:'Southern Africa',value:52.7,color:'#2475f5',display:'52.7%'},
      {label:'East Africa',value:19.8,color:'#0ba780',display:'19.8%'},
      {label:'West Africa',value:14.2,color:'#60a5fa',display:'14.2%'},
      {label:'Pan-African / Other',value:13.3,color:'#f5a623',display:'13.3%'}
    ];
    const rows = funds.map(fund=>`<tr class="clickable" data-action="open-fund" data-id="${fund.id}"><td><div class="company-cell"><span class="company-logo" style="background:linear-gradient(145deg,#6094dc,#0a8f76)">${escapeHTML(fund.id.slice(-1))}</span><span class="table-primary">${escapeHTML(fund.name)}</span></div></td><td>${fund.vintage}</td><td>${escapeHTML(fund.strategy)}</td><td>${fund.currency}</td><td class="text-right">${formatMoney(fund.commitment,fund.currency)}</td><td><div class="inline-progress">${progressBar(fund.called/fund.commitment*100)}<span>${pct(fund.called/fund.commitment*100)}</span></div></td><td class="text-right">${formatMoney(fund.nav,fund.currency)}</td><td class="text-right">${formatMoney(fund.distributed,fund.currency)}</td><td class="text-right positive">${pct(fund.grossIrr)}</td><td class="text-right positive">${pct(fund.netIrr)}</td><td class="text-right">${fund.tvpi.toFixed(2)}x</td><td class="text-right">${fund.dpi.toFixed(2)}x</td><td>${statusPill(fund.status)}</td></tr>`).join('');
    return `${pageHeader('Funds','Monitor fund-level performance, capital activity and structure across the portfolio.',globalPageActions({extra:button('Create fund','create-fund','primary','plus')}))}
      ${workspaceFilterBar([{label:'Vintage',action:'fund-vintage-filter',selected:'All vintages',options:['All vintages',...Array.from(new Set(funds.map(f=>String(f.vintage))))]},{label:'Strategy',action:'fund-strategy-filter',selected:'All strategies',options:['All strategies',...Array.from(new Set(funds.map(f=>f.strategy)))]},{label:'Status',action:'fund-status-filter',selected:'All statuses',options:['All statuses','Investing','Realising','Closed']},{label:'Currency',action:'fund-currency-filter',selected:'All currencies',options:['All currencies','USD','ZWG']}])}
      <section class="metric-grid section-gap">
        ${metricCard({label:'Total Commitments',value:formatMoney(totalCommitment),iconName:'dollar',accent:'emerald',foot:'12.4% vs prior period',action:'metric-funds'})}
        ${metricCard({label:'Called Capital',value:formatMoney(called),iconName:'wallet',accent:'blue',foot:`${pct(called/totalCommitment*100)} of commitments`,action:'metric-called'})}
        ${metricCard({label:'Distributed Capital',value:formatMoney(distributed),iconName:'trend-up',accent:'purple',foot:`${pct(distributed/totalCommitment*100)} of commitments`,action:'metric-distributed'})}
        ${metricCard({label:'Remaining Dry Powder',value:formatMoney(dryPowder),iconName:'bar-chart',accent:'amber',foot:`${pct(dryPowder/totalCommitment*100)} of commitments`,action:'metric-dry-powder'})}
        ${metricCard({label:'Gross IRR (Portfolio)',value:'18.7%',iconName:'trend-up',accent:'cyan',foot:'1.6pp vs prior period',action:'metric-irr'})}
        ${metricCard({label:'TVPI (Portfolio)',value:'2.18x',iconName:'pie-chart',accent:'brand',foot:'0.14x vs prior period',action:'metric-tvpi'})}
      </section>
      <section class="grid cols-3">
        ${card('Fund Mix by Strategy',donutChart(strategySegments,formatMoney(totalCommitment),'Total Commitments',120),{footer:'<button class="card-link" data-action="chart-drilldown" data-chart-label="Fund Mix" data-chart-value="Commitments by strategy">View full breakdown</button>'})}
        ${card('Vintage Year Performance',barChart({labels:funds.map(f=>String(f.vintage)),series:[{name:'Gross IRR',color:'var(--blue)',values:funds.map(f=>f.grossIrr)}],height:215,format:v=>`${Math.round(v)}%`}),{subtitle:'Gross IRR by vintage',footer:'<button class="card-link" data-action="chart-drilldown" data-chart-label="Vintage Analysis" data-chart-value="Gross IRR by vintage year">View vintage analysis</button>'})}
        ${card('Geographic Allocation',donutChart(geographies,formatMoney(totalCommitment),'Committed',120),{footer:'<button class="card-link" data-action="chart-drilldown" data-chart-label="Geographic Allocation" data-chart-value="Commitment by operating geography">View full allocation</button>'})}
      </section>
      <section class="card table-card"><div class="table-toolbar"><div class="table-title-row"><h3>Funds Overview</h3><span class="table-badge">${funds.length} funds</span></div><div class="table-tools"><div class="table-search">${icon('search')}<input type="text" placeholder="Search funds..." data-input-action="table-search" value="${escapeHTML(state.tableSearch)}"></div>${button('Filter','fund-filters','compact','filter')}${button('Export','export-funds','compact','download')}</div></div><div class="table-wrap"><table><thead><tr><th>Fund Name</th><th>Vintage</th><th>Strategy</th><th>Currency</th><th class="text-right">Commitment</th><th>Called</th><th class="text-right">NAV</th><th class="text-right">Distributed</th><th class="text-right">Gross IRR</th><th class="text-right">Net IRR</th><th class="text-right">TVPI</th><th class="text-right">DPI</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></section>
      <section class="grid cols-3 section-gap">
        ${card('Upcoming Reporting Deadlines',`<div class="info-list">${reports.slice(0,4).map(report=>`<div class="list-row"><span class="calendar-day" style="width:38px;height:38px;aspect-ratio:auto;background:var(--surface-soft)">${report.due.split(' ')[0]}<small style="font-size:10px">JUL</small></span><span class="list-row-main"><strong>${escapeHTML(report.fund)}</strong><small>${escapeHTML(report.type)}</small></span><span class="warning-text small">${escapeHTML(report.status)}</span></div>`).join('')}</div>`,{tools:'<button class="card-link" data-action="navigate" data-page="reporting">View all</button>'})}
        ${card('Recent Capital Activity',`<div class="info-list">${capitalCalls.slice(0,4).map((call,index)=>`<div class="list-row"><span class="activity-icon" style="color:${index%2?'var(--emerald)':'var(--blue)'};background:${index%2?'var(--emerald-soft)':'var(--blue-soft)'}">${icon(index%2?'trend-up':'wallet')}</span><span class="list-row-main"><strong>${index%2?'Distribution':'Capital Call'}</strong><small>${escapeHTML(call.fund)}</small></span><strong class="${index%2?'positive':'negative'} small">${formatMoney(index%2?call.collected:call.amount)}</strong></div>`).join('')}</div>`,{tools:'<button class="card-link" data-action="navigate" data-page="capital-calls">View all</button>'})}
        ${card('Top Performing Funds',`<div class="info-list">${[...funds].sort((a,b)=>b.grossIrr-a.grossIrr).slice(0,4).map((fund,index)=>`<div class="list-row"><span class="risk-score good">${index+1}</span><span class="list-row-main"><strong>${escapeHTML(fund.name)}</strong><small>${pct(fund.grossIrr)} Gross IRR</small></span><strong class="positive">${fund.tvpi.toFixed(2)}x</strong></div>`).join('')}</div>`,{tools:'<button class="card-link" data-action="chart-drilldown" data-chart-label="Fund Ranking" data-chart-value="Performance ranking by Gross IRR">View all</button>'})}
      </section>`;
  }

  function renderCapitalCalls() {
    const outstanding = sum(capitalCalls,c=>Math.max(0,c.amount-c.collected));
    const collected = sum(capitalCalls,c=>c.collected);
    const upcoming = capitalCalls.filter(c=>!['Closed'].includes(c.status)).length;
    const overdue = capitalCalls.filter(c=>c.status==='Partially Collected').length;
    const rows = capitalCalls.map(call=>`<tr class="clickable" data-action="open-capital-call" data-id="${call.id}"><td class="table-primary brand-text">${escapeHTML(call.id)}</td><td>${escapeHTML(call.fund)}</td><td>${call.callDate}</td><td>${call.dueDate}</td><td>${escapeHTML(call.purpose)}</td><td class="text-right">${formatMoney(call.amount)}</td><td class="text-center">${call.lpCount}</td><td><div class="inline-progress">${progressBar(call.collected/call.amount*100,call.collected===call.amount?'var(--emerald)':'')}<span>${formatMoney(call.collected)} / ${formatMoney(call.amount)}</span></div></td><td>${statusPill(call.status)}</td><td><button class="button ghost compact icon-only" data-action="activity-menu" data-context="capital-call" data-id="${call.id}" aria-label="Capital call activity">${icon('clock')}</button></td></tr>`).join('');
    const collectionSegments = [
      {label:'Collected',value:collected,color:'#07936d',display:formatMoney(collected)},
      {label:'Outstanding',value:outstanding,color:'#f59e0b',display:formatMoney(outstanding)},
      {label:'Overdue',value:12600000,color:'#d9475c',display:formatMoney(12600000)},
      {label:'Draft',value:11000000,color:'#aab3c2',display:formatMoney(11000000)}
    ];
    return `${pageHeader('Capital Calls','Plan, issue and track capital calls and drawdowns across funds.',globalPageActions({extra:button('New Capital Call','new-capital-call','primary','plus')}))}
      <section class="metric-grid">
        ${metricCard({label:'Upcoming Calls',value:String(upcoming),iconName:'calendar',accent:'blue',foot:formatMoney(sum(capitalCalls.filter(c=>c.status!=='Closed'),c=>c.amount)),action:'metric-upcoming-calls'})}
        ${metricCard({label:'Outstanding Amount',value:formatMoney(outstanding),iconName:'dollar',accent:'emerald',foot:'Across active notices',action:'metric-outstanding'})}
        ${metricCard({label:'Collected This Quarter',value:formatMoney(collected),iconName:'check',accent:'emerald',foot:'18.7% vs Q2 2026',action:'metric-collected'})}
        ${metricCard({label:'Overdue LPs',value:String(overdue*7),iconName:'alert',accent:'amber',foot:formatMoney(12600000),trend:'negative',action:'metric-overdue-lps'})}
        ${metricCard({label:'Notice Period Compliance',value:'96.3%',iconName:'shield',accent:'blue',foot:'3.4pp vs last month',action:'metric-compliance'})}
        ${metricCard({label:'Average Collection Time',value:'18.4 days',iconName:'clock',accent:'purple',foot:'2.1 days faster',action:'metric-collection-time'})}
      </section>
      <section class="card"><div class="table-toolbar"><div class="table-title-row"><h3>Capital Call Notices</h3><span class="table-badge">${capitalCalls.length} notices</span></div><div class="table-tools"><div class="table-search">${icon('search')}<input type="text" placeholder="Search notices..." data-input-action="table-search"></div>${selectControl('Status',['All Statuses','Issued','Partially Collected','Closed','Draft'],'All Statuses','capital-call-status')}${button('New Capital Call','new-capital-call','primary compact','plus')}</div></div><div class="table-wrap"><table><thead><tr><th>Notice ID</th><th>Fund</th><th>Call Date</th><th>Due Date</th><th>Purpose</th><th class="text-right">Total Amount</th><th>LP Count</th><th>Collection Progress</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>
      <section class="grid cols-4 section-gap">
        ${card('Call Allocation by LP',`<div class="info-list">${lps.map(lp=>`<div><div class="info-row"><span>${escapeHTML(lp.name)}</span><strong>${formatMoney(lp.commitment*.05)}</strong></div>${progressBar(lp.called/lp.commitment*100)}</div>`).join('')}</div>`,{footer:'<button class="card-link" data-action="navigate" data-page="lps">View full allocation</button>'})}
        ${card('Collection Progress',donutChart(collectionSegments,formatMoney(outstanding),'Outstanding',112),{footer:'<button class="card-link" data-action="chart-drilldown" data-chart-label="Collection Progress" data-chart-value="Capital call collection by status">View detailed analysis</button>'})}
        ${card('Cash Requirement Timeline',barChart({labels:['Jul','Aug','Sep','Oct','Nov','Dec'],series:[{name:'Scheduled Calls',color:'var(--blue)',values:[42.5,76,38.5,55,26,18.5]}],height:205,format:v=>`${Math.round(v)}M`}),{footer:'<button class="card-link" data-action="chart-drilldown" data-chart-label="Cash Forecast" data-chart-value="Six month capital requirement forecast">View cash forecast</button>'})}
        ${card('Recent Payment Confirmations',`<div class="info-list">${lps.map((lp,index)=>`<div class="list-row"><span class="activity-icon" style="color:var(--emerald);background:var(--emerald-soft)">${icon('check-circle')}</span><span class="list-row-main"><strong>${escapeHTML(lp.name)}</strong><small>${escapeHTML(funds[index%funds.length].name)}</small></span><strong class="small">${formatMoney([5,7.5,6.3,4,3][index]*1000000)}</strong></div>`).join('')}</div>`,{footer:'<button class="card-link" data-action="chart-drilldown" data-chart-label="Payments" data-chart-value="Recent confirmed capital call payments">View all payments</button>'})}
      </section>`;
  }

  function renderCompanies() {
    const totalFairValue = sum(companies,c=>c.fairValue);
    const avgGrowth = sum(companies,c=>c.revenueGrowth)/companies.length;
    const avgMargin = sum(companies,c=>c.margin)/companies.length;
    const atRisk = companies.filter(c=>c.health<70).length;
    const rows = companies.filter(company=>!state.tableSearch || company.name.toLowerCase().includes(state.tableSearch.toLowerCase()) || company.sector.toLowerCase().includes(state.tableSearch.toLowerCase())).map(company=>`<tr class="clickable" data-action="open-company" data-id="${company.id}"><td><div class="company-cell">${companyLogo(company)}<span class="table-primary">${escapeHTML(company.name)}</span></div></td><td>${escapeHTML(company.sector)}</td><td>${escapeHTML(company.stage)}</td><td>${company.entry}</td><td class="text-right">${formatMoney(company.invested)}</td><td class="text-right">${formatMoney(company.fairValue)}</td><td class="text-right">${pct(company.ownership)}</td><td class="text-right positive">${pct(company.revenueGrowth)}</td><td>${company.runway} months</td><td>${healthScore(company.health)}</td><td>${company.boardDate}</td><td>${company.lastReport}</td><td><button class="button ghost compact icon-only" data-action="activity-menu" data-context="company" data-id="${company.id}" aria-label="Company activity">${icon('clock')}</button></td></tr>`).join('');
    const healthSegments = [
      {label:'Excellent (80-100)',value:companies.filter(c=>c.health>=80).length,color:'#07936d',display:String(companies.filter(c=>c.health>=80).length)},
      {label:'Good (70-79)',value:companies.filter(c=>c.health>=70&&c.health<80).length,color:'#72be44',display:String(companies.filter(c=>c.health>=70&&c.health<80).length)},
      {label:'Needs Attention (60-69)',value:companies.filter(c=>c.health>=60&&c.health<70).length,color:'#f2b321',display:String(companies.filter(c=>c.health>=60&&c.health<70).length)},
      {label:'At Risk (<60)',value:companies.filter(c=>c.health<60).length,color:'#d9475c',display:String(companies.filter(c=>c.health<60).length)}
    ];
    const sectorValues = {};
    companies.forEach(company=>sectorValues[company.sector]=(sectorValues[company.sector]||0)+company.fairValue);
    const sectorSegments = Object.entries(sectorValues).map(([label,value],index)=>({label,value,color:['#2475f5','#0ba780','#60a5fa','#f5a623','#0f98b6','#d9475c'][index],display:formatMoney(value)}));
    return `${pageHeader('Portfolio Companies','Portfolio health, fair value, growth and value-creation oversight.',globalPageActions({extra:`${button('Filters','company-filters','','filter')}${button('Add company','add-company','primary','plus')}`}))}
      <section class="metric-grid">
        ${metricCard({label:'Active Portfolio Companies',value:String(companies.length),iconName:'building',accent:'emerald',foot:'+4 vs 31 Dec 2025',action:'metric-companies'})}
        ${metricCard({label:'Total Fair Value',value:formatMoney(totalFairValue),iconName:'dollar',accent:'purple',foot:'12.4% vs prior period',action:'metric-fair-value',spark:[120,132,126,141,136,151,155]})}
        ${metricCard({label:'Average Revenue Growth',value:pct(avgGrowth),iconName:'trend-up',accent:'blue',foot:'5.3pp vs prior period',action:'metric-revenue-growth',spark:[18,21,26,23,27,29,31]})}
        ${metricCard({label:'Average Gross Margin',value:pct(avgMargin),iconName:'pie-chart',accent:'amber',foot:'2.1pp vs prior period',action:'metric-ebitda',spark:[54,57,61,59,64,65,67]})}
        ${metricCard({label:'Follow-on Pipeline',value:formatMoney(462500000),iconName:'filter',accent:'cyan',foot:'16 opportunities',action:'metric-follow-on'})}
        ${metricCard({label:'At-Risk Companies',value:String(atRisk),iconName:'shield',accent:'red',foot:`${pct(atRisk/companies.length*100)} of portfolio`,trend:'negative',action:'metric-at-risk'})}
      </section>
      <section class="card"><div class="table-toolbar"><div class="table-title-row"><h3>Portfolio Companies</h3><span class="table-badge">${companies.length}</span></div><div class="table-tools"><div class="table-search">${icon('search')}<input type="text" placeholder="Search companies..." data-input-action="table-search" value="${escapeHTML(state.tableSearch)}"></div>${button('Export','export-companies','compact','download')}</div></div><div class="table-wrap"><table><thead><tr><th>Company</th><th>Sector</th><th>Stage</th><th>Entry Date</th><th class="text-right">Invested Amount</th><th class="text-right">Fair Value</th><th class="text-right">Ownership</th><th class="text-right">Revenue Growth</th><th>Runway</th><th>Health Score</th><th>Next Board Date</th><th>Last Reporting Update</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>
      <section class="grid cols-5 section-gap">
        ${card('Portfolio Health Distribution',donutChart(healthSegments,String(companies.length),'Companies',104),{footer:'<span class="muted small">Weighted score</span><strong>${Math.round(sum(companies,c=>c.health)/companies.length)}</strong>'})}
        ${card('Value by Sector',donutChart(sectorSegments,formatMoney(totalFairValue),'Fair Value',104),{footer:'<button class="card-link" data-action="chart-drilldown" data-chart-label="Sector Value" data-chart-value="Fair value by sector">View sector breakdown</button>'})}
        ${card('Key Milestones Tracker',`<div class="info-list">${companies.slice(0,5).map((company,index)=>`<div class="list-row">${companyLogo(company)}<span class="list-row-main"><strong>${escapeHTML(company.name)}</strong><small>${['$100M ARR','Series C Raise','US Market Launch','Break-even EBITDA','ISO 27001'][index]}</small></span>${statusPill(index===3?'Behind':index===1?'At Risk':'On Track')}</div>`).join('')}</div>`,{footer:'<button class="card-link" data-action="open-milestones">View all milestones</button>'})}
        ${card('Value Creation Initiatives',`<div class="info-list">${[['Go-to-market expansion',68],['Product & Technology',57],['Operational Excellence',63],['Talent & Organisation',50]].map(item=>`<div><div class="info-row"><span>${item[0]}</span><strong>${item[1]}%</strong></div>${progressBar(item[1])}</div>`).join('')}</div>`,{footer:'<button class="card-link" data-action="open-value-creation">View all initiatives</button>'})}
        ${card('Alerts & Actions',`<div class="info-list">${[['3 companies','Missing Q2 Reports','Overdue'],['2 companies','Board materials overdue','Overdue'],['1 company','Runway < 9 months','High'],['4 companies','Health score declined','Medium'],['2 companies','Regulatory filing due','Medium']].map(item=>`<div class="list-row"><span class="activity-icon" style="color:var(--red);background:var(--red-soft)">${icon('alert')}</span><span class="list-row-main"><strong>${item[0]}</strong><small>${item[1]}</small></span>${statusPill(item[2])}</div>`).join('')}</div>`,{footer:'<button class="card-link" data-action="open-alerts">View all alerts</button>'})}
      </section>`;
  }

  function renderReporting() {
    const complete=reports.filter(r=>r.status==='Complete').length+46;
    const overdue=reports.filter(r=>r.status==='Overdue').length+4;
    const [year,month]=state.reportingMonth.split('-').map(Number);
    const monthName=new Intl.DateTimeFormat('en',{month:'long',year:'numeric'}).format(new Date(year,month-1,1));
    const firstDay=(new Date(year,month-1,1).getDay()+6)%7;
    const daysInMonth=new Date(year,month,0).getDate();
    const prevDays=new Date(year,month-1,0).getDate();
    const cells=Array.from({length:42},(_,i)=>{const dayNumber=i-firstDay+1;let dateObj,display,muted=false;if(dayNumber<1){display=prevDays+dayNumber;dateObj=new Date(year,month-2,display);muted=true;}else if(dayNumber>daysInMonth){display=dayNumber-daysInMonth;dateObj=new Date(year,month,display);muted=true;}else{display=dayNumber;dateObj=new Date(year,month-1,display);}const iso=`${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;const events=reportingCalendarEvents.filter(event=>event.date===iso);return `<button class="calendar-day ${muted?'muted':''} ${iso===state.selectedCalendarDate?'active':''} ${events.length?'has-events':''}" data-action="calendar-day" data-date="${iso}"><span>${display}</span>${events.slice(0,2).map(event=>`<i class="calendar-event-dot ${event.type.toLowerCase().replaceAll(' ','-')}"></i>`).join('')}</button>`}).join('');
    const selectedEvents=reportingCalendarEvents.filter(event=>event.date===state.selectedCalendarDate);
    const rows=reports.map(report=>`<tr class="clickable" data-action="preview-scheduled-report" data-id="${report.id}"><td><div class="company-cell"><span class="activity-icon" style="color:var(--blue);background:var(--blue-soft)">${icon('file')}</span><span class="table-primary">${escapeHTML(report.type)}</span></div></td><td>${escapeHTML(report.fund)}</td><td>${escapeHTML(report.entity)}</td><td><span class="owner-mini">${avatar(report.owner,report.id.charCodeAt(report.id.length-1))}${escapeHTML(report.owner)}</span></td><td>${escapeHTML(report.frequency)}</td><td>${report.due}</td><td>${statusPill(report.status)}</td><td><div class="inline-progress">${progressBar(report.progress)}<span>${report.progress}%</span></div></td><td>${escapeHTML(report.channel)}</td><td>${button('Preview','preview-scheduled-report','compact','eye',`data-id="${report.id}"`)}</td></tr>`).join('');
    return `${pageHeader('Reporting Schedules','Coordinate internal and external reporting obligations across PE and VC funds.',globalPageActions({extra:button('Filters','report-filters','','filter')}))}
      <section class="metric-grid">${metricCard({label:'Reports Due This Month',value:'28',iconName:'calendar',accent:'blue',foot:'16% vs Jun 2026',action:'metric-reports-due'})}${metricCard({label:'Completed Reports',value:String(complete),iconName:'check-circle',accent:'emerald',foot:'22% vs Jun 2026',action:'metric-reports-complete'})}${metricCard({label:'Overdue Reports',value:String(overdue),iconName:'alert',accent:'red',foot:'+2 vs Jun 2026',trend:'negative',action:'metric-reports-overdue'})}${metricCard({label:'Upcoming Board Packs',value:'12',iconName:'clipboard',accent:'purple',foot:'8% vs Jun 2026',action:'metric-board-packs'})}${metricCard({label:'Investor Letters Scheduled',value:'8',iconName:'mail',accent:'amber',foot:'14% vs Jun 2026',action:'metric-investor-letters'})}${metricCard({label:'Avg. Turnaround Time',value:'4.2 days',iconName:'clock',accent:'cyan',foot:'0.6 days faster',action:'metric-report-turnaround'})}</section>
      <section class="calendar-layout interactive-reporting-calendar"><section class="card"><div class="calendar"><div class="calendar-head"><div><strong>${monthName}</strong><small>Click a date to view reporting activity</small></div><div class="calendar-controls">${button('','calendar-prev','ghost compact icon-only','chevron-left','aria-label="Previous month"')}${button('Today','calendar-today','compact')}${button('','calendar-next','ghost compact icon-only','chevron-right','aria-label="Next month"')}</div></div><div class="calendar-grid">${['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d=>`<div class="calendar-day-label">${d}</div>`).join('')}${cells}</div><div class="calendar-agenda"><div class="calendar-agenda-head"><div><strong>${new Intl.DateTimeFormat('en',{weekday:'long',day:'numeric',month:'long'}).format(new Date(state.selectedCalendarDate+'T12:00:00'))}</strong><small>${selectedEvents.length} scheduled item${selectedEvents.length===1?'':'s'}</small></div>${button('Add schedule','new-report-schedule','compact','plus')}</div>${selectedEvents.length?selectedEvents.map(event=>`<button class="calendar-agenda-item" data-action="open-calendar-event" data-id="${event.id}"><span>${icon(event.type.includes('Board')?'clipboard':event.type.includes('Valuation')?'trend-up':'file')}</span><span><strong>${escapeHTML(event.title)}</strong><small>${escapeHTML(event.owner)} · ${escapeHTML(event.channel)}</small></span>${statusPill(event.status)}${icon('chevron-right')}</button>`).join(''):'<div class="empty-state compact"><div><div class="empty-state-icon">'+icon('calendar')+'</div><h3>No reporting events</h3><p>Select another date or create a schedule.</p></div></div>'}</div></div></section>
        <section class="card table-card"><div class="table-toolbar"><div class="table-title-row"><h3>Upcoming Due Dates</h3><span class="table-badge">${reports.length}</span></div><div class="table-tools">${button('New schedule','new-report-schedule','compact','plus')}</div></div><div class="table-wrap"><table><thead><tr><th>Report Type</th><th>Fund</th><th>Entity</th><th>Owner</th><th>Frequency</th><th>Due Date</th><th>Status</th><th>Draft Progress</th><th>Delivery Channel</th><th>Preview</th></tr></thead><tbody>${rows}</tbody></table></div></section></section>`;
  }

  function renderFundPerformance() {
    const selectedFund = funds.find(f=>f.name===state.activeFund) || funds[0];
    if (!selectedFund) {
      return `${pageHeader('Fund Performance Reporting','Track performance, cash flows, attribution and benchmarks across reporting periods.','')}<div class="empty-state"><h3>No funds loaded</h3><p>Live fund data is still loading or has not been seeded yet.</p></div>`;
    }
    const metrics = [
      {label:'Gross IRR',value:pct(selectedFund.grossIrr||0),iconName:'trend-up',accent:'emerald',foot:'1.6pp vs Q1 2026',action:'metric-gross-irr'},
      {label:'Net IRR',value:pct(selectedFund.netIrr||0),iconName:'users',accent:'cyan',foot:'1.3pp vs Q1 2026',action:'metric-net-irr'},
      {label:'TVPI',value:`${Number(selectedFund.tvpi||0).toFixed(2)}x`,iconName:'bar-chart',accent:'amber',foot:'0.14x vs Q1 2026',action:'metric-tvpi'},
      {label:'DPI',value:`${Number(selectedFund.dpi||0).toFixed(2)}x`,iconName:'dollar',accent:'purple',foot:'0.08x vs Q1 2026',action:'metric-dpi'},
      {label:'RVPI',value:`${Math.max(0,Number(selectedFund.tvpi||0)-Number(selectedFund.dpi||0)).toFixed(2)}x`,iconName:'trend-up',accent:'blue',foot:'0.06x vs Q1 2026',action:'metric-rvpi'},
      {label:'NAV',value:formatMoney(selectedFund.nav||0),iconName:'dollar',accent:'emerald',foot:'+8.7M vs Q1 2026',action:'metric-nav'}
    ];
    const performanceChart = lineChart({labels:['Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'Net IRR',color:'var(--emerald)',values:[1,6,7,9,10,12,13.8,14.2,14.9]},{name:'Gross IRR',color:'var(--blue)',values:[3,9,10,12,14,16,17.1,18,18.7]}],height:220,format:v=>`${Math.round(v)}%`});
    const pmeChart = lineChart({labels:['Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'Matanho Fund II (Net IRR)',color:'var(--blue)',values:[0,4,7,9.5,12,14,16,17.5,18.7]},{name:'Private Markets PME',color:'var(--emerald)',values:[0,2,4,5.5,7,8.5,10,11.2,12.5]}],height:220,format:v=>`${Math.round(v)}%`});
    const attributionRows = companies.slice(0,5).map(c=>`<tr><td class="table-primary">${escapeHTML(c.name)}</td><td class="text-right">${pct(c.revenueGrowth/6)}</td><td class="text-right">${pct(c.fairValue/sum(companies,x=>x.fairValue)*100)}</td><td class="text-right positive">↑ ${pct(c.health/100)}</td></tr>`).join('');
    return `${pageHeader('Fund Performance Reporting','Track performance, cash flows, attribution and benchmarks across reporting periods.',`${selectControl('Fund',funds.map(f=>f.name),selectedFund.name,'fund-filter')}${selectControl('Period',['Q2 2026 (Apr - Jun 2026)','Q1 2026 (Jan - Mar 2026)','Q4 2025 (Oct - Dec 2025)'],'Q2 2026 (Apr - Jun 2026)','performance-period')}${statusPill('Review in progress','info')}${button('Generate Report','generate-report','primary','file-chart')}${button('Export','export-performance','','download')}${button('Submit for approval','submit-performance','','send')}`)}
      <section class="metric-grid">${metrics.map(metricCard).join('')}</section>
      <div class="tabs"><button class="tab active">Overview</button><button class="tab" data-action="performance-tab">Performance</button><button class="tab" data-action="performance-tab">Cash Flows</button><button class="tab" data-action="performance-tab">Portfolio</button><button class="tab" data-action="performance-tab">Attribution</button><button class="tab" data-action="performance-tab">Benchmarks</button></div>
      <section class="split-layout section-gap">
        <div>
          <section class="grid cols-2">
            ${card('Net and Gross Performance Trend',performanceChart,{subtitle:'Quarterly IRR progression'})}
            ${card('PME Benchmark Comparison',pmeChart,{subtitle:'Public-market equivalent comparison'})}
          </section>
          <section class="grid cols-2 section-gap">
            ${card('Cash Flow Bridge',waterfallChart([{label:'Opening NAV',value:151200000,total:true},{label:'Contributions',value:25600000},{label:'Distributions',value:-19800000},{label:'Fees',value:-6100000},{label:'Value Change',value:17500000},{label:'Closing NAV',value:168400000,total:true}]),{subtitle:'USD'})}
            ${card('Attribution by Company',`<div class="table-wrap"><table class="criteria-table"><thead><tr><th>Company</th><th class="text-right">Contribution to IRR</th><th class="text-right">% of Net IRR</th><th class="text-right">Change</th></tr></thead><tbody>${attributionRows}<tr><td class="table-primary">Total</td><td class="text-right table-primary">14.9%</td><td class="text-right table-primary">100.0%</td><td class="text-right positive">↑ 2.0%</td></tr></tbody></table></div>`,{subtitle:'Q2 2026'})}
          </section>
          <section class="card table-card"><div class="table-toolbar"><div class="table-title-row"><h3>Reporting Periods</h3></div><div class="table-tools">${button('Open report builder','open-report-builder','compact','edit')}</div></div><div class="table-wrap"><table><thead><tr><th>Period</th><th>Version</th><th>Prepared by</th><th>Prepared on</th><th>Reviewed by</th><th>Reviewed on</th><th>Status</th><th>Published on</th><th></th></tr></thead><tbody>${[['Q2 2026 (Apr - Jun 2026)','v1.0','Tendai Makoni','10 Jul 2026','Chipo Muzenhamo','13 Jul 2026','Review in progress','-'],['Q1 2026 (Jan - Mar 2026)','v2.1','Tendai Makoni','15 Apr 2026','Chipo Muzenhamo','17 Apr 2026','Approved','20 Apr 2026'],['Q4 2025 (Oct - Dec 2025)','v2.0','Tendai Makoni','16 Jan 2026','Chipo Muzenhamo','19 Jan 2026','Approved','22 Jan 2026'],['Q3 2025 (Jul - Sep 2025)','v2.0','Tendai Makoni','17 Oct 2025','Chipo Muzenhamo','20 Oct 2025','Approved','23 Oct 2025']].map(row=>`<tr class="clickable" data-action="open-report-builder">${row.map((cell,i)=>`<td class="${i===0?'table-primary':''}">${i===6?statusPill(cell):escapeHTML(cell)}</td>`).join('')}<td><button class="button ghost compact icon-only" data-action="activity-menu" data-context="report" data-id="${escapeHTML(row[0])}" aria-label="Report activity">${icon('clock')}</button></td></tr>`).join('')}</tbody></table></div></section>
        </div>
        <div class="side-stack" style="display:flex">
          ${card('Validation Summary',`<div style="margin-bottom:11px">${statusPill('All validations passed','success')}</div><div class="info-list">${[['Cash flows reconciled','Net cash flow variance: $0.00'],['NAV balanced','NAV per books matches investment data'],['Valuations up to date','All portfolio valuations current'],['Expense allocation','Allocated in accordance with LPA'],['Capital accounts','LP capital accounts in balance']].map(item=>`<div class="reason-item">${icon('check-circle')}<div><strong>${item[0]}</strong><small>${item[1]}</small></div></div>`).join('')}</div>`,{footer:'<button class="card-link" data-action="open-validations">View validation details</button>'})}
          ${card('Reporting Controls',`<div class="info-list"><div class="info-row"><span>Data lock date</span><strong>30 Jun 2026</strong></div><div class="info-row"><span>FX source</span><strong>Reserve Bank / Refinitiv</strong></div><div class="info-row"><span>Valuation policy</span><strong>IPEV 2025</strong></div><div class="info-row"><span>Benchmark</span><strong>Private Markets PME</strong></div><div class="info-row"><span>Last validated</span><strong>13 Jul 2026 · 10:24</strong></div></div>`,{footer:'<button class="card-link" data-action="performance-settings">Configure controls</button>'})}
        </div>
      </section>`;
  }

  function renderLPManagement() {
    const totalCommitments = sum(lps,lp=>lp.commitment);
    const unfunded = sum(lps,lp=>lp.unfunded);
    const distributed = sum(lps,lp=>lp.distributed);
    const rows = lps.map(lp=>`<tr class="clickable" data-action="open-lp" data-id="${lp.id}"><td><div class="company-cell"><span class="company-logo" style="background:${lp.color}">${escapeHTML(initials(lp.name))}</span><span class="table-primary brand-text">${escapeHTML(lp.name)}</span></div></td><td>${escapeHTML(lp.type)}</td><td>${escapeHTML(lp.geography)}</td><td class="text-right">${formatMoney(lp.commitment)}</td><td><div class="inline-progress">${progressBar((lp.commitment?lp.called/lp.commitment:0)*100)}<span>${pct((lp.commitment?lp.called/lp.commitment:0)*100)}</span></div></td><td class="text-right">${formatMoney(lp.distributed)}</td><td class="text-right positive">${pct(lp.netIrr)}</td><td>${escapeHTML(lp.owner)}</td><td>${lp.lastInteraction}</td><td>${statusPill(lp.kyc)}</td><td>${statusPill(lp.portal)}</td><td><button class="button ghost compact icon-only" data-action="activity-menu" data-context="lp" data-id="${lp.id}" aria-label="LP activity">${icon('clock')}</button></td></tr>`).join('');
    const geography = {};
    lps.forEach(lp=>geography[lp.geography]=(geography[lp.geography]||0)+lp.commitment);
    const geosegments = Object.entries(geography).map(([label,value],i)=>({label,value,color:['#2475f5','#0ba780','#60a5fa','#f5a623'][i],display:`${pct(value/totalCommitments*100)} · ${formatMoney(value)}`}));
    return `${pageHeader('LP Management','Manage investors, commitments, communications, KYC and account history.',`${selectControl('LP filter',['All LPs','Pension Funds','Family Offices','Insurance','Funds of Funds'],'All LPs','lp-filter')}${selectControl('Date',['31 Jul 2026','30 Jun 2026'],'31 Jul 2026','date-filter')}${button('Export','export-lps','','download')}${button('Add LP','add-lp','primary','plus')}`)}
      <section class="metric-grid">
        ${metricCard({label:'Active LPs',value:'42',iconName:'users',accent:'emerald',foot:'5.0% vs 31 Dec 2025',action:'metric-active-lps'})}
        ${metricCard({label:'Total Commitments',value:formatMoney(totalCommitments),iconName:'wallet',accent:'blue',foot:'8.7% vs 31 Dec 2025',action:'metric-lp-commitments'})}
        ${metricCard({label:'Unfunded Commitments',value:formatMoney(unfunded),iconName:'pie-chart',accent:'amber',foot:'6.3% vs 31 Dec 2025',action:'metric-unfunded'})}
        ${metricCard({label:'Distributions This Quarter',value:formatMoney(distributed),iconName:'dollar',accent:'purple',foot:'12.5% vs Q1 2026',action:'metric-lp-distributions'})}
        ${metricCard({label:'Investor Satisfaction',value:'4.6 / 5.0',iconName:'sparkles',accent:'emerald',foot:'+0.2 vs prior period',action:'metric-satisfaction'})}
        ${metricCard({label:'Documents Pending',value:'18',iconName:'file',accent:'amber',foot:'3 fewer than prior period',trend:'negative',action:'metric-lp-docs'})}
      </section>
      <section class="card"><div class="table-toolbar"><div class="table-title-row"><h3>LP Directory</h3><span class="table-badge">42 LPs</span></div><div class="table-tools"><div class="table-search">${icon('search')}<input type="text" placeholder="Search LPs..." data-input-action="table-search"></div>${button('Filters','lp-filters','compact','filter')}</div></div><div class="table-wrap"><table><thead><tr><th>LP Name</th><th>Type</th><th>Geography</th><th class="text-right">Committed Amount</th><th>Called</th><th class="text-right">Distributed</th><th class="text-right">Net IRR</th><th>Contact Owner</th><th>Last Interaction</th><th>KYC Status</th><th>Portal Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>
      <section class="grid cols-4 section-gap">
        ${card('Commitment Concentration',donutChart(geosegments,formatMoney(totalCommitments),'Total Commitments',112),{footer:'<button class="card-link" data-action="chart-drilldown" data-chart-label="Commitment Concentration" data-chart-value="LP commitments by geography">View full breakdown</button>'})}
        ${card('Contact Activity',`<div class="timeline">${[['3 Jul 2026','Email with Zambezi Pension Fund','Quarterly update & NAV report shared'],['2 Jul 2026','Call with Savannah Insurance','Discussed re-up and diversification'],['1 Jul 2026','Meeting with Baobab Growth Partners','Onboarding documentation review']].map(item=>`<div class="timeline-item"><strong>${item[1]}</strong><small>${item[0]} · ${item[2]}</small></div>`).join('')}</div>`,{tools:'<button class="card-link" data-action="open-contacts">View all</button>'})}
        ${card('Outstanding Documents',`<div class="info-list">${[['Side Letter Acknowledgement','Horizon Family Office','Overdue'],['LPA Amendment','Savannah Insurance','2 days'],['KYC Annual Review','Baobab Growth Partners','5 days']].map(item=>`<div class="list-row"><span class="activity-icon" style="color:var(--red);background:var(--red-soft)">${icon('file')}</span><span class="list-row-main"><strong>${item[0]}</strong><small>${item[1]}</small></span>${statusPill(item[2])}</div>`).join('')}</div>`,{tools:'<button class="card-link" data-action="open-lp-documents">View all</button>'})}
        ${card('Onboarding & Communications',`<div><div class="info-row"><strong>Onboarding Progress</strong><strong>60%</strong></div>${progressBar(60)}</div><div class="info-list" style="margin-top:13px"><div class="list-row"><span class="activity-icon" style="color:var(--blue);background:var(--blue-soft)">${icon('mail')}</span><span class="list-row-main"><strong>Q2 2026 Investor Update</strong><small>Sent to 42 LPs · 7 Jul 2026</small></span></div><div class="list-row"><span class="activity-icon" style="color:var(--purple);background:var(--purple-soft)">${icon('file')}</span><span class="list-row-main"><strong>Capital Call Notice - Fund II</strong><small>Sent to 38 LPs · 1 Jul 2026</small></span></div></div>`,{footer:'<button class="card-link" data-action="new-communication">Send communication</button>'})}
      </section>`;
  }

  function renderDealDetail() {
    const deal = deals.find(d=>d.id===state.selectedDealId) || deals.find(d=>d.featured) || deals[0];
    const tabs = [
      ['overview','Overview'],['application','Application'],['screening','AI Screening'],['diligence','Due Diligence'],['term','Term Sheet'],['ic','Board & IC Decision'],['disbursement','Disbursement'],['documents','Documents']
    ];
    const currentStep = {overview:5,application:1,screening:2,diligence:3,term:4,ic:5,disbursement:6,documents:5}[state.dealTab] || 5;
    const stepLabels = [['Application Submitted','Complete'],['AI Screening','Shortlisted · 86/100'],['Due Diligence','Complete · 6/6'],['Term Sheet','Conditional · 15/17'],['Board & IC Decision','In review'],['Disbursement','Locked']];
    const actions = `${selectControl('Fund',funds.map(f=>f.name),deal.fund,'deal-fund')}${button('Back to Deal Flow','back-to-deals','','arrow-left')}${button('Activity','activity-menu','','clock',`data-context="deal" data-id="${deal.id}"`)}`;
    return `${pageHeader(`${deal.name} - ${deal.round}`,'Investment application and execution workspace.',actions,'Committee Review')}
      <section class="detail-hero"><div class="detail-hero-top"><div class="entity-title"><span class="entity-logo" style="background:linear-gradient(145deg,#23314d,#5e93dd)">${escapeHTML(initials(deal.name))}</span><div><h1>${escapeHTML(deal.name)}</h1><p>${escapeHTML(deal.sector)} · ${escapeHTML(deal.round)} · ${escapeHTML(deal.fund)}</p></div></div>${statusPill(state.dealTab==='disbursement'?'Approved - Closing':'Committee Review',state.dealTab==='disbursement'?'success':'info')}</div><div class="hero-meta"><div class="hero-meta-item"><span>Requested Investment (USD)</span><strong>${formatMoney(deal.amount)}</strong></div><div class="hero-meta-item"><span>Proposed Ownership</span><strong>17.5%</strong></div><div class="hero-meta-item"><span>Pre-Money Valuation</span><strong>$85.0M</strong></div><div class="hero-meta-item"><span>Lead Investor</span><strong>${escapeHTML(deal.fund)}</strong></div><div class="hero-meta-item"><span>AI Screening Score</span><strong>${deal.score}/100</strong></div></div></section>
      <div class="tabs">${tabs.map(tab=>`<button class="tab ${state.dealTab===tab[0]?'active':''}" data-action="deal-tab" data-tab="${tab[0]}">${tab[1]}</button>`).join('')}</div>
      <div class="stepper">${stepLabels.map((step,index)=>`<div class="step ${index+1<currentStep?'complete':index+1===currentStep?'current':''}"><span class="step-index">${index+1<currentStep?icon('check'):index+1}</span><span class="step-copy"><strong>${step[0]}</strong><small>${step[1]}</small></span></div>`).join('')}</div>
      ${renderDealTab(deal)}`;
  }

  function renderDealTab(deal) {
    switch (state.dealTab) {
      case 'application': return renderDealApplication(deal);
      case 'screening': return renderDealScreening(deal);
      case 'diligence': return renderDealDiligence(deal);
      case 'term': return renderDealTermSheet(deal);
      case 'ic': return renderDealIC(deal);
      case 'disbursement': return renderDealDisbursement(deal);
      case 'documents': return renderDealDocuments(deal);
      default: return renderDealOverview(deal);
    }
  }

  function renderDealOverview(deal) {
    const company = companies[0];
    const workstreams = ['Market Research','Financial Assessment','Competitive Analysis','Management Team Evaluation','Legal Compliance','Risk Assessment'];
    return `<section class="split-layout"><div>
      <section class="grid cols-3">
        ${card('Company Overview',`<div class="info-list"><div class="info-row"><span>Legal name</span><strong>Nova Analytics (Pvt) Ltd</strong></div><div class="info-row"><span>Sector</span><strong>${escapeHTML(deal.sector)}</strong></div><div class="info-row"><span>Location</span><strong>Harare, Zimbabwe</strong></div><div class="info-row"><span>Founded</span><strong>2021</strong></div><div class="info-row"><span>Employees</span><strong>62</strong></div><div class="info-row"><span>Primary Contact</span><strong>Tariro Kasere, CEO</strong></div></div>`) }
        ${card('Application Snapshot',`<div class="grid cols-3"><div><span class="muted small">Requested Investment</span><div class="metric-value" style="font-size:17px">${formatMoney(deal.amount)}</div></div><div><span class="muted small">Funding Round</span><div class="metric-value" style="font-size:17px">${escapeHTML(deal.round)}</div></div><div><span class="muted small">Ownership</span><div class="metric-value" style="font-size:17px">17.5%</div></div></div><div class="grid cols-3 section-gap"><div><span class="muted small">FY2025E Revenue</span><strong style="display:block;margin-top:4px">$13.2M</strong></div><div><span class="muted small">ARR</span><strong style="display:block;margin-top:4px">$14.5M</strong></div><div><span class="muted small">Gross Margin</span><strong style="display:block;margin-top:4px">73%</strong></div></div>`) }
        ${card('AI Screening',`<div class="score-panel"><div><div class="score-big"><strong>${deal.score}</strong><span>/100</span></div><div class="score-confidence">94% confidence</div></div>${statusPill('SHORTLISTED','success')}</div><div class="grid cols-3 section-gap"><div class="text-center"><strong class="positive" style="font-size:18px">8</strong><div class="muted small">Passed</div></div><div class="text-center"><strong class="warning-text" style="font-size:18px">2</strong><div class="muted small">Review</div></div><div class="text-center"><strong class="negative" style="font-size:18px">0</strong><div class="muted small">Failed</div></div></div><button class="button ghost compact" style="width:100%;margin-top:12px" data-action="deal-tab" data-tab="screening">Open screening</button>`) }
      </section>
      <section class="grid cols-2 section-gap">
        ${card('Attached Documents',`<div class="info-list">${documents.slice(0,8).map(doc=>`<button type="button" class="list-row v17-document-list-row" data-action="preview-document" data-id="${doc.id}"><span class="activity-icon" style="color:${doc.type==='XLSX'?'var(--emerald)':'var(--red)'};background:${doc.type==='XLSX'?'var(--emerald-soft)':'var(--red-soft)'}">${icon('file')}</span><span class="list-row-main"><strong>${escapeHTML(doc.name)}</strong><small>${escapeHTML(doc.version)} · ${escapeHTML(doc.status)}</small></span><span class="button ghost compact icon-only" aria-hidden="true">${icon('eye')}</span></button>`).join('')}</div>`,{tools:button('Data room','deal-tab','compact','folder','data-tab="documents"')})}
        ${card('Due Diligence Workstreams',`<div class="table-wrap"><table class="criteria-table"><thead><tr><th>Workstream</th><th>Analyst</th><th>Due Date</th><th>Progress</th><th>Status</th></tr></thead><tbody>${workstreams.map((name,index)=>`<tr><td class="table-primary">${name}</td><td><span class="owner-mini">${avatar(['Nyasha Moyo','Tendai Moyo','Rudo Ndlovu','Chipo Dube','Farai Chikore','Tinashe Sibanda'][index],index)}${['Nyasha Moyo','Tendai Moyo','Rudo Ndlovu','Chipo Dube','Farai Chikore','Tinashe Sibanda'][index]}</span></td><td>${10+index} Jul 2026</td><td><div class="inline-progress">${progressBar(100,'var(--emerald)')}<span>100%</span></div></td><td>${statusPill('Complete')}</td></tr>`).join('')}</tbody></table></div>`,{tools:button('Assign tasks','assign-dd-task','compact','plus')})}
      </section>
    </div><div class="side-stack" style="display:flex">
      ${card('Board & Investment Committee',`<div class="info-list"><div class="info-row"><span>Date & time</span><strong>15 Jul 2026 · 10:00 SAST</strong></div><div class="info-row"><span>Voting members</span><strong>7</strong></div><div class="info-row"><span>Recommendation</span><strong class="positive">Approve with conditions</strong></div></div><div class="grid cols-2 section-gap">${button('Approve','vote-approve','success compact','check')}${button('Approve with conditions','vote-conditions','compact','shield')}${button('Defer','vote-defer','compact','clock')}${button('Reject','vote-reject','danger compact','x')}</div>`) }
      ${card('Term Sheet Status',`<div class="grid cols-3"><div class="text-center"><strong style="font-size:17px">17</strong><div class="muted small">Sections</div></div><div class="text-center"><strong class="positive" style="font-size:17px">15</strong><div class="muted small">Agreed</div></div><div class="text-center"><strong class="warning-text" style="font-size:17px">2</strong><div class="muted small">Open</div></div></div><div class="reason-list section-gap"><div class="reason-item warning">${icon('alert')}<div><strong>Liquidation preference</strong><small>Economic rights</small></div></div><div class="reason-item warning">${icon('alert')}<div><strong>Board observer rights</strong><small>Governance</small></div></div></div>`,{footer:'<button class="card-link" data-action="deal-tab" data-tab="term">Open term sheet</button>'})}
      ${card('Disbursement Readiness',`<div class="info-row"><span>Readiness</span><strong>72%</strong></div>${progressBar(72,'var(--emerald)')}<div class="reason-list section-gap"><div class="reason-item">${icon('check-circle')}<div><strong>KYC verified</strong></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Bank details verified</strong></div></div><div class="reason-item warning">${icon('alert')}<div><strong>Legal conditions</strong><small>3 of 4 complete</small></div></div><div class="reason-item warning">${icon('clock')}<div><strong>Board resolution</strong><small>Pending</small></div></div></div>`,{footer:'<button class="card-link" data-action="deal-tab" data-tab="disbursement">View readiness</button>'})}
      ${card('Audit Trail',`<div class="timeline">${[['10 Jul 2026, 09:08','Nyasha Moyo updated Pitch Deck.pdf'],['9 Jul 2026, 17:45','Nyasha Moyo completed Market Research'],['9 Jul 2026, 14:32','Rudo Ndlovu completed Financial Assessment'],['8 Jul 2026, 14:32','Farai Chikore requested legal documents'],['1 Jul 2026, 10:15','Application submitted by Nova Analytics']].map(item=>`<div class="timeline-item"><strong>${item[1]}</strong><small>${item[0]}</small></div>`).join('')}</div>`,{tools:'<button class="card-link" data-action="open-audit">View all</button>'})}
    </div></section>`;
  }

  function renderDealApplication(deal) {
    const sections = ['Company Information','Ownership & Governance','Business & Market','Financial Information','Funding Request','Impact & ESG','Declarations & Consent'];
    return `<section class="split-layout"><div>
      <section class="summary-strip"><div class="summary-item"><span>Submitted online</span><strong>1 Jul 2026 · 10:15</strong></div><div class="summary-item"><span>Application ID</span><strong>APP-2026-0048</strong></div><div class="summary-item"><span>Completeness</span><strong class="positive">100%</strong></div><div class="summary-item"><span>Applicant</span><strong>Tariro Kasere, CEO</strong></div><div class="summary-item"><span>Last amended</span><strong>30 Jun 2026</strong></div><div class="summary-item"><span>Status</span><strong>${statusPill('Submitted')}</strong></div></section>
      <section class="grid" style="grid-template-columns:230px minmax(0,1fr)"><div class="term-sections" style="display:block">${sections.map((section,index)=>`<button class="term-section ${index===0?'active':''}" data-action="application-section"><span>${icon(index===0?'building':index===1?'users':index===2?'trend-up':index===3?'file-chart':index===4?'dollar':index===5?'sparkles':'shield')} ${escapeHTML(section)}</span>${icon('check-circle')}</button>`).join('')}</div>
        <div>${card('Company Information',`<div class="form-grid"><div class="form-field"><label>Legal name</label><input value="Nova Analytics (Pvt) Ltd" readonly></div><div class="form-field"><label>Website</label><input value="nova-analytics.co.zw" readonly></div><div class="form-field"><label>Registration No.</label><input value="1234567" readonly></div><div class="form-field"><label>Sector</label><input value="Enterprise Software / AI Analytics" readonly></div><div class="form-field"><label>Country</label><input value="Zimbabwe" readonly></div><div class="form-field"><label>Employees</label><input value="62" readonly></div><div class="form-field full"><label>Business description</label><textarea readonly>Nova Analytics provides an AI-powered analytics platform that helps enterprises transform complex data into actionable insights. The platform enables predictive forecasting, operational optimisation and intelligent decision-making.</textarea></div><div class="form-field full"><label>Problem & solution</label><textarea readonly>Enterprises in emerging markets lack affordable, easy-to-use analytics tools, resulting in poor data utilisation and slow decision-making. Nova Analytics delivers an intuitive, scalable platform built for these operating environments.</textarea></div></div>`) }
        ${card('Funding Request Summary',`<div class="grid cols-4"><div><span class="muted small">Funding Round</span><strong style="display:block;margin-top:4px">${escapeHTML(deal.round)}</strong></div><div><span class="muted small">Requested Investment</span><strong style="display:block;margin-top:4px">${formatMoney(deal.amount)}</strong></div><div><span class="muted small">Proposed Ownership</span><strong style="display:block;margin-top:4px">17.5%</strong></div><div><span class="muted small">Pre-Money Valuation</span><strong style="display:block;margin-top:4px">$85.0M</strong></div></div><div class="section-gap"><div class="chart-legend"><span class="legend-item" style="color:var(--blue)"><i class="legend-dot"></i>40% Product</span><span class="legend-item" style="color:var(--emerald)"><i class="legend-dot"></i>35% Regional Expansion</span><span class="legend-item" style="color:var(--orange)"><i class="legend-dot"></i>25% Sales</span></div><div class="progress" style="height:10px;margin-top:8px"><span style="width:40%;background:var(--blue)"></span></div></div>`,{classes:'section-gap'})}</div>
      </section>
    </div><div class="side-stack" style="display:flex">
      ${card('Application Overview',`<div class="info-list"><div><div class="info-row"><span>Section progress</span><strong>7 / 7 complete</strong></div>${progressBar(100,'var(--emerald)')}</div><div><div class="info-row"><span>Required documents</span><strong>8 / 8 received</strong></div>${progressBar(100,'var(--emerald)')}</div><div><div class="info-row"><span>Completeness</span><strong>100%</strong></div>${progressBar(100,'var(--emerald)')}</div></div>`) }
      ${card('Declarations',`<div class="reason-list"><div class="reason-item">${icon('check-circle')}<div><strong>All information is true and accurate</strong></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Consent to data processing and sharing</strong></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Authorised representative confirmed</strong></div></div></div>`) }
      ${card('Applicant Activity',`<div class="timeline">${sections.slice().reverse().map((section,index)=>`<div class="timeline-item"><strong>${escapeHTML(section)} completed</strong><small>30 Jun 2026 · ${9+index}:45</small></div>`).join('')}</div>`) }
      <div class="grid">${button('Request clarification','request-clarification','','mail')}${button('Download application','download-application','primary','download')}</div>
    </div></section>`;
  }

  function renderDealScreening(deal) {
    const criteria = [
      ['Strategic Fit',20,92,'Strong alignment to fund thesis; addresses a real enterprise pain point.','Strong'],
      ['Market Attractiveness',20,84,'Large, growing TAM in enterprise analytics across Africa.','Strong'],
      ['Financial Quality',15,81,'Growth 68% YoY; improving unit economics and margin profile.','Strong'],
      ['Management Team',15,88,'Experienced founders with a strong execution track record.','Strong'],
      ['Scalability',15,90,'Cloud-native platform; scalable GTM and product architecture.','Strong'],
      ['Governance & Compliance',10,76,'Adequate policies; board structure to be strengthened.','Adequate'],
      ['ESG & Impact',5,80,'Positive impact with basic ESG reporting in place.','Strong']
    ];
    const shortlist = deals.filter(d=>d.score>=75).slice(0,6);
    return `<section class="summary-strip"><div class="summary-item"><span>Total applications</span><strong>85</strong></div><div class="summary-item"><span>Meet criteria</span><strong class="positive">24</strong></div><div class="summary-item"><span>Do not meet criteria</span><strong class="negative">61</strong></div><div class="summary-item"><span>Need human review</span><strong class="warning-text">6</strong></div><div class="summary-item"><span>Model version</span><strong>Matanho Screen v3.2</strong></div><div class="summary-item"><span>Last run</span><strong>1 Jul 2026 · 10:18</strong></div></section>
      <section class="split-layout"><div class="grid" style="grid-template-columns:350px minmax(0,1fr)">
        <section class="card"><div class="tabs"><button class="tab active">Meets criteria · 24</button><button class="tab">Does not meet · 61</button></div><div class="card-body" style="padding-top:12px"><div class="table-search" style="margin-bottom:10px">${icon('search')}<input style="width:100%" placeholder="Search applications..."></div><div class="info-list">${shortlist.map(candidate=>`<button class="list-row" style="border:1px solid ${candidate.id===deal.id?'var(--brand)':'var(--line)'};border-radius:10px;background:${candidate.id===deal.id?'var(--brand-soft)':'transparent'};padding:9px;width:100%;text-align:left;cursor:pointer" data-action="select-screened-deal" data-id="${candidate.id}"><span class="activity-icon" style="color:var(--brand);background:var(--brand-soft)">${icon('building')}</span><span class="list-row-main"><strong>${escapeHTML(candidate.name)}</strong><small>${escapeHTML(candidate.sector)} · ${formatMoney(candidate.amount)}</small></span><strong class="positive">${candidate.score}</strong>${statusPill('SHORTLISTED','success')}</button>`).join('')}</div></div></section>
        <div>${card(deal.name,`<div style="display:flex;justify-content:space-between;gap:12px"><div class="score-panel"><div><div class="score-big"><strong>${deal.score}</strong><span>/100</span></div><div class="score-confidence">94% confidence</div></div></div>${statusPill('SHORTLISTED','success')}</div><div class="section-gap"><strong class="small">AI summary</strong><p class="muted" style="font-size:10px;line-height:1.6">${escapeHTML(deal.name)} demonstrates strong strategic alignment and product-market fit with a scalable analytics platform for enterprise clients across Africa. Financials are solid with strong revenue growth and healthy unit economics.</p></div><div class="table-wrap"><table class="criteria-table"><thead><tr><th>Criteria</th><th>Weight</th><th>Score</th><th>Evidence (AI summary)</th><th>Status</th></tr></thead><tbody>${criteria.map(row=>`<tr><td class="table-primary">${row[0]}</td><td>${row[1]}%</td><td class="positive table-primary">${row[2]}</td><td>${row[3]}</td><td>${statusPill(row[4],row[4]==='Adequate'?'warning':'success')}</td></tr>`).join('')}</tbody></table></div>`,{tools:button('Re-run screening','rerun-screening','compact','refresh')})}
        <section class="grid cols-2 section-gap">${card('Reasons for shortlist',`<div class="reason-list"><div class="reason-item">${icon('check-circle')}<div><strong>AI platform with defensible IP and a strong data flywheel</strong><small>Evidence: 68% YoY revenue growth; 90%+ gross retention.</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Large addressable market with accelerating adoption</strong><small>TAM $1.2B; 22% CAGR to 2030.</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Experienced founding team with proven execution</strong><small>150+ enterprise clients; ARR $13.2M.</small></div></div></div>`) }${card('Review flags',`<div class="reason-list"><div class="reason-item warning">${icon('alert')}<div><strong>Customer concentration</strong><small>Top 3 customers represent 46% of revenue.</small></div></div><div class="reason-item warning">${icon('alert')}<div><strong>FY2025 EBITDA loss</strong><small>EBITDA -$2.1M; path to profitability in FY2026.</small></div></div></div>`) }</section></div>
      </div><div class="side-stack" style="display:flex">
        ${card('Decision',`<div class="grid">${button('Confirm shortlist','confirm-shortlist','success','check')}${button('Move to human review','human-review','warning','users')}${button('Does not meet criteria','screen-reject','danger','x')}</div>`) }
        ${card('Screening Rules',`<div class="info-list"><div class="info-row"><span>Shortlist</span><strong class="positive">Score ≥ 75</strong></div><div class="info-row"><span>Human review</span><strong class="warning-text">60 - 74</strong></div><div class="info-row"><span>Does not meet criteria</span><strong class="negative">&lt; 60</strong></div></div>`) }
        ${card('Evidence Sources',`<div class="info-row"><span>Reviewed</span><strong>12 / 12 · 100%</strong></div>${progressBar(100,'var(--emerald)')}<p class="muted small">Scores are generated from application data, submitted evidence and weighted criteria. Manager discretion applies.</p>`) }
        ${card('Audit Trail',`<div class="timeline"><div class="timeline-item"><strong>Screening completed</strong><small>1 Jul 2026 · 10:18</small></div><div class="timeline-item"><strong>Model version Matanho Screen v3.2</strong><small>1 Jul 2026 · 10:18</small></div><div class="timeline-item"><strong>Evidence sources updated</strong><small>1 Jul 2026 · 10:10</small></div></div>`,{footer:'<span class="muted small">AI recommendation requires manager confirmation.</span>'})}
      </div></section>`;
  }

  function renderDealDiligence() {
    const workstreams = [
      ['Market Research','Nyasha Moyo',5,'10 Jul 2026'],['Financial Assessment','Tendai Moyo',5,'11 Jul 2026'],['Competitive Analysis','Rudo Ndlovu',5,'12 Jul 2026'],['Management Team Evaluation','Chipo Dube',5,'13 Jul 2026'],['Legal Compliance','Farai Chikore',4,'14 Jul 2026'],['Risk Assessment','Tinashe Sibanda',4,'14 Jul 2026']
    ];
    const completed = state.dueDiligenceTasks.filter(t=>t.status==='Complete').length;
    return `<section class="metric-grid">
      ${metricCard({label:'Overall Progress',value:'100%',iconName:'pie-chart',accent:'blue',foot:'Complete',action:'dd-progress'})}
      ${metricCard({label:'Workstreams',value:'6 / 6',iconName:'briefcase',accent:'purple',foot:'Complete',action:'dd-workstreams'})}
      ${metricCard({label:'Tasks',value:`${completed} / ${state.dueDiligenceTasks.length}`,iconName:'clipboard',accent:'emerald',foot:'Complete',action:'dd-tasks'})}
      ${metricCard({label:'Critical Findings',value:'0',iconName:'shield',accent:'emerald',foot:'Open',action:'dd-findings'})}
      ${metricCard({label:'Conditions Raised',value:'3',iconName:'alert',accent:'amber',foot:'Open',action:'dd-conditions'})}
      ${metricCard({label:'Data Room',value:String(documents.length),iconName:'file',accent:'blue',foot:'Files',action:'deal-tab'})}
    </section>
    <section class="split-layout"><div>
      ${card('Due Diligence Workstreams',`<div class="table-wrap"><table class="criteria-table"><thead><tr><th>Workstream</th><th>Lead Analyst</th><th>Tasks</th><th>Due Date</th><th>Progress</th><th>Findings</th><th>Status</th></tr></thead><tbody>${workstreams.map((w,index)=>`<tr><td class="table-primary">${w[0]}</td><td><span class="owner-mini">${avatar(w[1],index)}${w[1]}</span></td><td>${w[2]} / ${w[2]}</td><td>${w[3]}</td><td><div class="inline-progress">${progressBar(100,'var(--emerald)')}<span>100%</span></div></td><td>${index===2?1:0}</td><td>${statusPill('Complete')}</td></tr>`).join('')}</tbody></table></div>`,{tools:`${button('Assign tasks','assign-dd-task','compact','users')}${button('Add workstream','add-workstream','compact','plus')}`})}
      <section class="section-gap">${card('Financial Assessment',`<div class="workstream-grid"><div class="task-column"><div class="task-column-head"><span>To Do</span><span class="table-badge">0</span></div><div class="empty-state"><div><div class="empty-state-icon">${icon('check-circle')}</div><h3>All tasks completed</h3></div></div></div><div class="task-column"><div class="task-column-head"><span>In Review</span><span class="table-badge">0</span></div><div class="empty-state"><div><div class="empty-state-icon">${icon('check-circle')}</div><h3>No pending reviews</h3></div></div></div><div class="task-column"><div class="task-column-head"><span>Complete</span><span class="table-badge">${completed}</span></div>${state.dueDiligenceTasks.map((task,index)=>`<article class="task-card" data-action="open-dd-task" data-id="${task.id}"><strong>${escapeHTML(task.title)}</strong><div class="task-meta"><span>${avatar(task.analyst,index)} ${escapeHTML(task.analyst)}</span><span>${task.due}</span></div><div class="task-meta"><span class="priority ${task.priority.toLowerCase()}">${task.priority}</span><span>${task.evidence} files · ${task.comments} comments</span></div></article>`).join('')}</div></div>`,{tools:button('View all tasks','open-all-dd-tasks','compact','external-link')})}</section>
    </div><div class="side-stack" style="display:flex">
      ${card('Analyst Workload',`<div class="info-list">${workstreams.map((w,index)=>`<div><div class="info-row"><span class="owner-mini">${avatar(w[1],index)}${w[1]}</span><strong>${[78,72,69,75,64,68][index]}%</strong></div>${progressBar([78,72,69,75,64,68][index],'var(--emerald)')}</div>`).join('')}</div>`) }
      ${card('Key Findings',`<div class="reason-list"><div class="reason-item">${icon('check-circle')}<div><strong>Revenue growth supported by contracted pipeline</strong><small>Low severity · Tendai Moyo</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Strong unit economics and CAC payback</strong><small>Low severity · Nyasha Moyo</small></div></div><div class="reason-item warning">${icon('alert')}<div><strong>Customer concentration above threshold</strong><small>Medium severity · Rudo Ndlovu</small></div></div></div>`,{footer:'<button class="card-link" data-action="open-findings">View all findings</button>'})}
      ${card('Conditions for Approval',`<div class="info-list">${[['1','Long-term customer contracts for top 5 accounts'],['2','Evidence of EBITDA sustainability'],['3','Legal title confirmation for IP assets']].map(item=>`<div class="list-row"><span class="risk-score medium">${item[0]}</span><span class="list-row-main"><strong>${item[1]}</strong></span>${statusPill('Open','warning')}</div>`).join('')}</div>`,{footer:'<button class="card-link" data-action="open-conditions">View all conditions</button>'})}
      ${card('Recent Activity',`<div class="timeline"><div class="timeline-item"><strong>All Financial Assessment tasks marked complete</strong><small>13 Jul 2026 · 12:20</small></div><div class="timeline-item"><strong>Tax position completed</strong><small>11 Jul 2026 · 11:10</small></div><div class="timeline-item"><strong>New evidence uploaded</strong><small>10 Jul 2026 · 15:45</small></div></div>`) }
    </div></section>`;
  }

  function renderDealTermSheet() {
    const selectedSection=termSheetSections[state.termSection]||termSheetSections[0];
    const decisions=state.termDecisions||{};
    const clauses=selectedSection.clauses.map((clause,index)=>({...clause,status:decisions[`${state.termSection}:${index}`]||clause.status}));
    const agreed=termSheetSections.flatMap((section,sIndex)=>section.clauses.map((clause,cIndex)=>decisions[`${sIndex}:${cIndex}`]||clause.status)).filter(status=>status==='Agreed').length;
    const total=termSheetSections.reduce((count,section)=>count+section.clauses.length,0);
    const open=total-agreed;
    const envelope=signatureEnvelopes.find(item=>item.documentId==='DOC-009');
    return `<section class="summary-strip"><div class="summary-item"><span>Version</span><strong>v4</strong></div><div class="summary-item"><span>Clauses</span><strong>${total}</strong></div><div class="summary-item"><span>Agreed</span><strong class="positive">${agreed}</strong></div><div class="summary-item"><span>Open</span><strong class="warning-text">${open}</strong></div><div class="summary-item"><span>Last updated</span><strong>13 Jul 2026 · 16:20</strong></div><div class="summary-item"><span>Signature status</span><strong>${statusPill(envelope?.status||'Not prepared')}</strong></div></section>
      ${workspaceFilterBar([{label:'Version',action:'term-version-filter',selected:'v4 Current',options:['v4 Current','v3 Company redline','v2 Internal draft']},{label:'Clause status',action:'term-status-filter',selected:'All clauses',options:['All clauses','Open only','Agreed only']},{label:'Owner',action:'term-owner-filter',selected:'All owners',options:['All owners','Farai Chikore','Tendai Moyo','Nyasha Moyo']},{type:'button',label:'Activity',action:'activity-menu',icon:'clock',attrs:'data-context="term-sheet" data-id="DL-013"'}])}
      <section class="term-layout"><div class="term-sections">${termSheetSections.map((section,index)=>{const sectionStatuses=section.clauses.map((clause,cIndex)=>decisions[`${index}:${cIndex}`]||clause.status);const complete=sectionStatuses.filter(status=>status==='Agreed').length;return `<button class="term-section ${state.termSection===index?'active':''}" data-action="term-section" data-section="${index}"><span>${icon(section.icon)} ${escapeHTML(section.name)}</span><span class="${complete<section.clauses.length?'warning-text':'positive'}">${complete} / ${section.clauses.length}</span></button>`}).join('')}</div>
      <div><div class="page-actions term-toolbar">${button('Preview PDF','preview-document','','eye','data-id="DOC-009"')}${button('Generate PDF','generate-term-pdf','','file')}${button(envelope?.status==='Completed'?'View signed term sheet':'Sign term sheet','sign-term-sheet','primary','edit')}${button('Signature Studio','share-term','','send')}${button('Compare versions','open-version-history','','layers')}${button('New version','new-term-version','','plus')}</div>
        <section class="term-signing-status"><div><span class="term-signing-icon">${icon('edit')}</span><div><strong>Electronic signing workflow</strong><small>${envelope?.recipients.map(recipient=>`${recipient[0]} · ${recipient[2]}`).join('  •  ')||'Envelope not prepared'}</small></div></div><div><div class="inline-progress">${progressBar(envelope?.progress||0)}<span>${envelope?.progress||0}%</span></div>${statusPill(envelope?.status||'Draft')}</div></section>
        <div class="term-section-heading"><div><span class="overlay-eyebrow">Clause workspace</span><h3>${escapeHTML(selectedSection.name)}</h3><p>${clauses.filter(c=>c.status==='Agreed').length} agreed · ${clauses.filter(c=>c.status!=='Agreed').length} requiring attention · source-linked redlines</p></div><div class="term-section-health">${statusPill(clauses.every(c=>c.status==='Agreed')?'Complete':'Negotiating',clauses.every(c=>c.status==='Agreed')?'success':'warning')}</div></div>
        <div class="term-clause-grid">${clauses.map((clause,index)=>`<article class="clause-card interactive-clause ${clause.status==='Open'?'open-clause':''}" data-action="open-term-clause" data-section="${state.termSection}" data-clause="${index}"><div class="clause-head"><div><strong>${escapeHTML(clause.title)}</strong><div class="muted small">${escapeHTML(clause.reference)} · ${escapeHTML(clause.source)}</div></div>${statusPill(clause.status,clause.status==='Open'?'warning':'success')}</div><div class="clause-summary"><div><span>Current value</span><strong>${escapeHTML(clause.value)}</strong></div><div><span>Owner</span><strong>${escapeHTML(clause.owner)}</strong></div><div><span>Updated</span><strong>${escapeHTML(clause.updated)}</strong></div></div><div class="clause-preview"><div><small>Matanho position</small><p>${escapeHTML(clause.matanho)}</p></div><div><small>Company position</small><p>${escapeHTML(clause.company)}</p></div></div><div class="clause-actions">${button('Open clause','open-term-clause','compact','eye',`data-section="${state.termSection}" data-clause="${index}"`)}${clause.status==='Open'?`${button('Accept counter','accept-counter','compact','check',`data-section="${state.termSection}" data-clause="${index}"`)}${button('Retain position','retain-position','compact','gavel',`data-section="${state.termSection}" data-clause="${index}"`)}`:button('Activity','activity-menu','ghost compact','clock',`data-context="term-clause" data-id="${state.termSection}:${index}"`)}</div></article>`).join('')}</div>
      </div><div class="side-stack" style="display:flex">${card('Signing Parties',`<div class="signature-party-list">${(envelope?.recipients||[]).map((recipient,index)=>`<div>${personAvatar(recipient[0])}<span><strong>${escapeHTML(recipient[0])}</strong><small>${escapeHTML(recipient[1])}</small></span>${statusPill(recipient[2],recipient[2]==='Signed'?'success':'warning')}</div>`).join('')}</div>`,{footer:`<button class="card-link" data-action="sign-term-sheet">Open signing page</button>`})}${card('Approval Routing',`<div class="approval-route"><div class="done"><span>1</span><div><strong>Legal review</strong><small>Farai Chikore · complete</small></div></div><div class="done"><span>2</span><div><strong>Investment Director</strong><small>Tariro Kasere · complete</small></div></div><div class="current"><span>3</span><div><strong>Company signature</strong><small>${envelope?.progress||0}% complete</small></div></div><div><span>4</span><div><strong>Completion certificate</strong><small>Generated after all parties sign</small></div></div></div>`)}${card('Source Data',`<div class="info-list"><div class="info-row"><span>Investment memo</span><strong>IM-NOVA-v7</strong></div><div class="info-row"><span>Valuation model</span><strong>VAL-NOVA-Q2-2026</strong></div><div class="info-row"><span>Cap table</span><strong>CAP-NOVA-v8</strong></div><div class="info-row"><span>Legal redline</span><strong>TS-NOVA-v4</strong></div><div class="info-row"><span>Last sync</span><strong>13 Jul · 16:20 CAT</strong></div></div>`,{footer:'<button class="card-link" data-action="preview-document" data-id="DOC-009">Preview current term sheet</button>'})}</div></section>`;
  }

  function renderDealIC(deal) {
    const votes = Object.values(state.dealVote);
    const voteCounts = ['Approve','Approve with conditions','Pending','Reject'].map(label=>({label,value:votes.filter(v=>v===label).length,color:label==='Approve'?'#07936d':label==='Approve with conditions'?'#2475f5':label==='Pending'?'#f59e0b':'#d9475c',display:String(votes.filter(v=>v===label).length)}));
    return `<section class="summary-strip"><div class="summary-item"><span>Meeting</span><strong>Board & IC Review</strong></div><div class="summary-item"><span>Date</span><strong>15 Jul 2026</strong></div><div class="summary-item"><span>Time</span><strong>10:00 - 11:30 SAST</strong></div><div class="summary-item"><span>Voting members</span><strong>7 · Quorum 7/7</strong></div><div class="summary-item"><span>Status</span><strong>${statusPill('In progress','success')}</strong></div><div class="summary-item"><span>Meeting tools</span><strong><button class="card-link" data-action="open-meeting-pack">Open pack</button></strong></div></section>
      <section class="grid" style="grid-template-columns:240px minmax(0,1fr) 300px;gap:12px"><div>${card('Agenda',`<div class="info-list">${[['1','Conflict declarations','5 min','Complete'],['2','Deal team presentation','20 min','Complete'],['3','Due diligence findings','20 min','Current'],['4','Terms and conditions','15 min','Upcoming'],['5','Questions & deliberation','20 min','Upcoming'],['6','Vote and resolution','10 min','Upcoming']].map(item=>`<div class="list-row"><span class="step-index ${item[3]==='Complete'?'positive':''}">${item[0]}</span><span class="list-row-main"><strong>${item[1]}</strong><small>${item[2]}</small></span>${statusPill(item[3],item[3]==='Complete'?'success':item[3]==='Current'?'warning':'neutral')}</div>`).join('')}</div>`,{footer:'<strong>Total duration: 90 min</strong>'})}</div>
      <div>${card('Decision Brief',`<div class="grid cols-5"><div><span class="muted small">Recommendation</span><strong class="positive" style="display:block;margin-top:4px">Approve with conditions</strong></div><div><span class="muted small">Requested</span><strong style="display:block;margin-top:4px">${formatMoney(deal.amount)}</strong></div><div><span class="muted small">Ownership</span><strong style="display:block;margin-top:4px">17.5%</strong></div><div><span class="muted small">Valuation</span><strong style="display:block;margin-top:4px">$85.0M</strong></div><div><span class="muted small">AI Score</span><strong style="display:block;margin-top:4px">${deal.score}/100</strong></div></div><section class="grid cols-3 section-gap"><div><h4>Investment Rationale</h4><div class="reason-list"><div class="reason-item">${icon('check-circle')}<div><strong>Strong management team with proven execution.</strong></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Large and growing addressable market.</strong></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Compelling unit economics and path to profitability.</strong></div></div></div></div><div><h4>Key Risks & Mitigants</h4><div class="reason-list"><div class="reason-item warning">${icon('alert')}<div><strong>Customer concentration risk.</strong><small>Mitigant: covenant on concentration limits.</small></div></div><div class="reason-item warning">${icon('alert')}<div><strong>EBITDA sustainability not yet proven.</strong></div></div></div></div><div><h4>Conditions Proposed</h4><div class="reason-list"><div class="reason-item warning">${icon('info')}<div><strong>Customer concentration covenant.</strong></div></div><div class="reason-item warning">${icon('info')}<div><strong>Evidence of EBITDA sustainability.</strong></div></div><div class="reason-item warning">${icon('info')}<div><strong>Legal title confirmation for IP.</strong></div></div></div></div></section>`) }
        <section class="vote-grid section-gap">${card('Voting & Resolution',`<div>${Object.entries(state.dealVote).map(([member,vote],index)=>`<div class="vote-row"><span>${index+1}</span><span class="vote-member">${avatar(member,index)}<strong>${escapeHTML(member)}</strong></span><span>${statusPill('Clear','success')}</span><select class="vote-select" data-change-action="ic-vote" data-member="${escapeHTML(member)}"><option ${vote==='Approve'?'selected':''}>Approve</option><option ${vote==='Approve with conditions'?'selected':''}>Approve with conditions</option><option ${vote==='Defer'?'selected':''}>Defer</option><option ${vote==='Reject'?'selected':''}>Reject</option><option ${vote==='Pending'?'selected':''}>Pending</option></select></div>`).join('')}</div><div class="vote-actions">${button('Approve','final-vote','success','check','data-vote="Approve"')}${button('Approve with conditions','final-vote','','shield','data-vote="Approve with conditions"')}${button('Defer','final-vote','','clock','data-vote="Defer"')}${button('Reject','final-vote','danger','x','data-vote="Reject"')}</div>`) }${card('Vote Summary',donutChart(voteCounts,'7','Members',112),{footer:'<span class="muted small">A decision cannot be finalised while votes are pending.</span>'})}</section>
      </div><div class="side-stack" style="display:flex">
        ${card('Conflict Declarations',`<div style="margin-bottom:8px">${statusPill('7 / 7 clear','success')}</div><p class="muted small">All members have submitted conflict declarations with no conflicts identified.</p>`,{footer:'<button class="card-link" data-action="open-conflicts">View all declarations</button>'})}
        ${card('Resolution Draft',`<div class="info-list"><div class="info-row"><span>Resolution number</span><strong>RES-IC-2026-014</strong></div><div class="info-row"><span>Title</span><strong>Approval of Investment in Nova Analytics Ltd - Series B</strong></div></div>`,{footer:'<button class="card-link" data-action="view-resolution">View full draft</button>'})}
        ${card('Recorded Rationale',`<textarea style="width:100%;min-height:112px">The committee approves the proposed investment in Nova Analytics Ltd (Series B), subject to the conditions set out in this resolution.</textarea><div class="muted small text-right">129 / 1000 characters</div>`) }
        ${card('E-Signature Status',`<div class="info-row"><span>Members signed</span><strong>0 of 7</strong></div>${progressBar(0)}`,{footer:'<button class="card-link" data-action="request-signatures">Request signatures</button>'})}
      </div></section>`;
  }

  function renderDealDisbursement(deal) {
    const completeCount = state.closingConditions.filter(c=>c.complete).length;
    const readiness = Math.round(completeCount/state.closingConditions.length*100);
    const canRelease = completeCount === state.closingConditions.length;
    return `<section class="summary-strip"><div class="summary-item"><span>Resolution</span><strong>RES-IC-2026-014</strong></div><div class="summary-item"><span>Decision</span><strong class="positive">Approved with conditions</strong></div><div class="summary-item"><span>Approved amount</span><strong>${formatMoney(deal.amount)}</strong></div><div class="summary-item"><span>Disbursement plan</span><strong>2 tranches</strong></div><div class="summary-item"><span>Readiness</span><strong class="${canRelease?'positive':'warning-text'}">${readiness}%</strong></div><div class="summary-item"><span>Target close</span><strong>25 Jul 2026</strong></div></section>
      <section class="split-layout"><div>
        <section class="grid cols-2">
          ${card('1. Closing Conditions',`<div class="table-wrap"><table class="criteria-table"><thead><tr><th>#</th><th>Condition</th><th>Owner</th><th>Evidence</th><th>Due Date</th><th>Status</th></tr></thead><tbody>${state.closingConditions.map((condition,index)=>`<tr class="clickable" data-action="toggle-closing-condition" data-id="${condition.id}"><td>${index+1}</td><td class="table-primary">${escapeHTML(condition.title)}</td><td>${escapeHTML(condition.owner)}</td><td class="brand-text">${icon('file')} ${escapeHTML(condition.evidence)}</td><td>${condition.due}</td><td>${statusPill(condition.complete?'Complete':'In review',condition.complete?'success':'warning')}</td></tr>`).join('')}</tbody></table></div>`,{tools:button('Export checklist','export-closing','','download')})}
          ${card('2. Beneficiary & Bank Details',`<div style="margin-bottom:10px">${statusPill('Verified','success')}</div><div class="info-list"><div class="info-row"><span>Beneficiary</span><strong>Nova Analytics (Pvt) Ltd</strong></div><div class="info-row"><span>Bank</span><strong>CBZ Bank Limited</strong></div><div class="info-row"><span>Account number</span><strong>•••• •••• 4821</strong></div><div class="info-row"><span>SWIFT / BIC</span><strong>COBZZWHA</strong></div><div class="info-row"><span>Currency</span><strong>USD</strong></div><div class="info-row"><span>Independently verified by</span><strong>Tendai Moyo · 16 Jul 2026</strong></div></div>`,{tools:button('Edit','edit-bank-details','compact','edit')})}
        </section>
        <section class="grid cols-2 section-gap">
          ${card('3. Tranche Schedule',`<div class="table-wrap"><table class="criteria-table"><thead><tr><th>Tranche</th><th>Amount</th><th>Planned Date</th><th>Purpose</th><th>Milestone / Conditions</th><th>Status</th></tr></thead><tbody><tr><td>1</td><td class="table-primary">$12.0M</td><td>25 Jul 2026</td><td>Product and regional expansion</td><td>-</td><td>${statusPill(canRelease?'Ready for approval':'Pending conditions',canRelease?'success':'warning')}</td></tr><tr><td>2</td><td class="table-primary">$6.0M</td><td>30 Sep 2026</td><td>Sales expansion</td><td>ARR ≥ $17.0M and 70 enterprise clients</td><td>${statusPill('Conditional','warning')}</td></tr></tbody></table></div>`) }
          ${card('4. Approval Chain',`<div class="timeline"><div class="timeline-item"><strong>Deal Lead (Nyasha Moyo)</strong><small class="positive">Complete</small></div><div class="timeline-item"><strong>Legal (Tendai Moyo)</strong><small class="positive">Complete</small></div><div class="timeline-item"><strong>Finance Controller (Rudo Ndlovu)</strong><small class="positive">Complete</small></div><div class="timeline-item"><strong>Investment Director (Farai Chikore)</strong><small class="warning-text">Pending</small></div><div class="timeline-item"><strong>Two Authorised Signatories</strong><small class="warning-text">0 of 2 approvals</small></div></div>`) }
        </section>
        ${card('Payment Audit Trail',`<div class="table-wrap"><table class="criteria-table"><thead><tr><th>Date & Time</th><th>Actor</th><th>Action</th><th>Details</th></tr></thead><tbody><tr><td>15 Jul 2026, 10:30</td><td>Nyasha Moyo</td><td>IC Decision Recorded</td><td>Resolution approved with conditions.</td></tr><tr><td>16 Jul 2026, 14:15</td><td>Tendai Moyo</td><td>Bank Details Verified</td><td>Bank details independently verified by callback.</td></tr><tr><td>16 Jul 2026, 14:50</td><td>System</td><td>Sanctions Screening</td><td>Screening completed - no matches found.</td></tr><tr><td>17 Jul 2026, 09:20</td><td>Tendai Moyo</td><td>Closing Condition Update</td><td>CP satisfaction certificate submitted.</td></tr></tbody></table></div>`,{classes:'section-gap'})}
      </div><div class="side-stack" style="display:flex">
        <div class="grid">${button('Create payment instruction','create-payment','primary','file')}${button('Export closing checklist','export-closing','','download')}</div>
        ${card('Funds Availability',`<div class="info-list"><div class="info-row"><span>Fund</span><strong>${escapeHTML(deal.fund)}</strong></div><div class="info-row"><span>Cash available</span><strong>$62.7M</strong></div><div class="info-row"><span>Post-payment cash</span><strong>$50.7M</strong></div></div>`) }
        ${card('Payment Controls',`<div class="reason-list"><div class="reason-item">${icon('check-circle')}<div><strong>Dual authorisation required</strong><small>Configured</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Sanctions screening</strong><small>Passed</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Bank callback verification</strong><small>Complete</small></div></div></div>`,{footer:`${statusPill('Passed','success')}`})}
        ${card('Disbursement Timeline',`<div class="timeline"><div class="timeline-item"><strong>IC approval with conditions</strong><small>15 Jul 2026</small></div><div class="timeline-item"><strong>Closing conditions in progress</strong><small>10 Jul - 17 Jul 2026</small></div><div class="timeline-item"><strong>Target close</strong><small>25 Jul 2026</small></div><div class="timeline-item"><strong>First tranche payment</strong><small>25 Jul 2026</small></div></div>`) }
        ${card('First Tranche',`<div class="metric-value">$12.0M</div><p class="muted small">Available after final conditions and approvals.</p><button class="button ${canRelease?'success':''}" style="width:100%" data-action="release-tranche" ${canRelease?'':'disabled'}>${icon(canRelease?'unlock':'lock')} Release $12.0M</button>`,{footer:canRelease?statusPill('Ready','success'):`<span class="negative small">Payment not released: complete all required conditions.</span>`})}
      </div></section>`;
  }

  function renderDealDocuments() {
    const folders = [...['Application','Corporate & Legal','Financial','Commercial','Due Diligence','Term Sheet','Committee Pack','Closing & Disbursement'], ...(state.customFolders || [])];
    const filtered = documents.filter(doc=>doc.folder===state.selectedFolder);
    const selected = documents.find(doc=>doc.id===state.selectedDocumentId) || filtered[0] || documents[0];
    return `<section class="document-layout"><div class="folder-list">${folders.map(folder=>`<button class="folder-button ${state.selectedFolder===folder?'active':''}" data-action="select-folder" data-folder="${escapeHTML(folder)}">${icon('folder')}<span>${escapeHTML(folder)}</span><strong>${documents.filter(doc=>doc.folder===folder).length}</strong></button>`).join('')}</div>
      <div><div class="page-actions" style="justify-content:space-between;margin-bottom:10px"><div class="table-search">${icon('search')}<input style="width:280px" placeholder="Search in ${escapeHTML(state.selectedFolder)}..."></div><div class="page-actions"><label class="button primary" style="cursor:pointer">${icon('upload')} Upload files<input type="file" multiple hidden data-file-action="upload-document"></label>${button('Create folder','create-folder','','folder')}${button('Request document','request-document','','file')}</div></div>
        <section class="card"><div class="table-wrap"><table><thead><tr><th><input type="checkbox"></th><th>Name</th><th>Type</th><th>Version</th><th>Owner</th><th>Uploaded</th><th>Review Status</th><th>Access</th><th>Actions</th></tr></thead><tbody>${filtered.map(doc=>`<tr class="clickable" data-action="select-document" data-id="${doc.id}"><td><input type="checkbox"></td><td class="table-primary brand-text"><button type="button" class="v17-document-name" data-action="preview-document" data-id="${doc.id}"><span class="document-row-icon">${icon(doc.type==='XLSX'?'file-chart':'file')}</span><span>${escapeHTML(doc.name)}</span></button></td><td>${doc.type}</td><td>${statusPill(doc.version,'info')}</td><td>${escapeHTML(doc.owner)}</td><td>${doc.uploaded}</td><td>${statusPill(doc.status)}</td><td>${escapeHTML(doc.access)}</td><td><div class="page-actions" style="justify-content:flex-start">${button('','preview-document','ghost compact icon-only','eye',`data-id="${doc.id}"`)}${button('','download-document','ghost compact icon-only','download',`data-id="${doc.id}"`)}</div></td></tr>`).join('')}</tbody></table></div></section>
        <section class="document-preview section-gap"><div class="document-preview-head"><span class="file-icon">${icon('file')}</span><div style="flex:1"><strong>${escapeHTML(selected.name)}</strong><div class="muted small">${escapeHTML(selected.folder)} · ${escapeHTML(selected.version)} · ${escapeHTML(selected.status)}</div></div>${statusPill(selected.status)}</div><div class="grid cols-2 section-gap"><div class="info-list"><div class="info-row"><span>Type</span><strong>${escapeHTML(selected.type)} Document</strong></div><div class="info-row"><span>Version</span><strong>${escapeHTML(selected.version)}</strong></div><div class="info-row"><span>Uploaded by</span><strong>${escapeHTML(selected.owner)}</strong></div><div class="info-row"><span>Uploaded on</span><strong>${escapeHTML(selected.uploaded)}</strong></div><div class="info-row"><span>Access</span><strong>${escapeHTML(selected.access)}</strong></div></div><div><div class="tabs"><button class="tab active">Version history</button><button class="tab">Reviewers</button><button class="tab">Comments (2)</button><button class="tab">E-signatures</button></div><div class="timeline section-gap"><div class="timeline-item"><strong>${selected.version} · Current</strong><small>${selected.uploaded} · Updated registered office address</small></div><div class="timeline-item"><strong>v2.0</strong><small>7 Jul 2026 · Reissued certificate</small></div><div class="timeline-item"><strong>v1.0</strong><small>30 Jun 2026 · Initial upload</small></div></div></div></div></section>
      </div><div class="side-stack" style="display:flex">
        ${card('Data Room Access',`<div class="info-list"><div class="info-row"><span>Internal Team</span><strong>6 users</strong></div><div class="info-row"><span>Nova Analytics</span><strong>5 users</strong></div><div class="info-row"><span>External Counsel</span><strong>3 users</strong></div></div><div class="grid cols-2 section-gap">${button('Change permissions','change-permissions','compact','shield')}${button('Revoke access','revoke-access','danger compact','lock')}</div>`) }
        ${card('Permissions Summary',`<div class="info-list"><div class="info-row"><span>View only</span><strong>10 users</strong></div><div class="info-row"><span>Edit</span><strong>2 users</strong></div><div class="info-row"><span>Download</span><strong>10 users</strong></div><div class="info-row"><span>Upload</span><strong>3 users</strong></div><div class="info-row"><span>Full control</span><strong>2 users</strong></div></div>`,{footer:'<button class="card-link" data-action="permissions-matrix">View permission matrix</button>'})}
        ${card('Document Requests',`<div class="info-list"><div class="list-row"><span class="activity-icon" style="color:var(--amber);background:var(--amber-soft)">${icon('file')}</span><span class="list-row-main"><strong>Audited Financial Statements FY2025</strong><small>Due 15 Jul 2026</small></span></div><div class="list-row"><span class="activity-icon" style="color:var(--amber);background:var(--amber-soft)">${icon('file')}</span><span class="list-row-main"><strong>Beneficial Ownership Declaration</strong><small>Due 16 Jul 2026</small></span></div><div class="list-row"><span class="activity-icon" style="color:var(--amber);background:var(--amber-soft)">${icon('file')}</span><span class="list-row-main"><strong>Board Resolutions</strong><small>Due 17 Jul 2026</small></span></div></div>`,{tools:statusPill('3 outstanding','warning')})}
        ${card('Storage & Security',`<div class="reason-list"><div class="reason-item">${icon('check-circle')}<div><strong>Encryption</strong><small>Enabled</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Watermarking</strong><small>Enabled</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Audit logging</strong><small>Enabled</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>ISO 27001 aligned</strong><small>Certified</small></div></div></div>`) }
      </div></section>`;
  }

  function fundProfileMetrics(fund) {
    const unfunded = Math.max(0, fund.commitment - fund.called);
    return `<section class="metric-grid fund-metric-grid">
      ${metricCard({label:'Commitment',value:formatMoney(fund.commitment),iconName:'wallet',accent:'purple',foot:'Total subscribed capital',action:'fund-commitment'})}
      ${metricCard({label:'Called Capital',value:formatMoney(fund.called),iconName:'download',accent:'blue',foot:`${pct(fund.called/fund.commitment*100)} of commitments`,action:'fund-called'})}
      ${metricCard({label:'NAV',value:formatMoney(fund.nav),iconName:'building',accent:'emerald',foot:'Current reported value',action:'fund-nav'})}
      ${metricCard({label:'Unfunded',value:formatMoney(unfunded),iconName:'clock',accent:'amber',foot:'Available for future calls',action:'fund-unfunded'})}
      ${metricCard({label:'Net IRR',value:pct(fund.netIrr),iconName:'trend-up',accent:'cyan',foot:'Since inception',action:'fund-net-irr'})}
      ${metricCard({label:'TVPI',value:`${fund.tvpi.toFixed(2)}x`,iconName:'pie-chart',accent:'brand',foot:`DPI ${fund.dpi.toFixed(2)}x`,action:'fund-tvpi'})}
    </section>`;
  }

  function renderFundOverviewTab(fund, fundCompanies, allocation) {
    const holdings = fundCompanies.length ? fundCompanies : companies.slice(0,4);
    return `<section class="profile-tab-panel fund-profile-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Fund overview workspace</strong><span>Portfolio value, cash-flow position, concentration, obligations and governing terms.</span></div>${button('Update fund snapshot','edit-fund','primary','edit')}</div>
      <section class="fund-primary-grid section-gap">
        ${card('NAV and Cumulative Cash Flows',barChart({labels:['2021','2022','2023','2024','2025','2026 YTD'],series:[{name:'Cumulative Distributions',color:'var(--emerald)',values:[12,38,52,71,86,97]},{name:'Cumulative Called',color:'var(--navy)',values:[20,58,82,112,143,168]}],height:270,format:v=>`${Math.round(v)}M`}),{subtitle:'USD millions · select a bar for period detail'})}
        ${card('J-Curve',lineChart({labels:['Year 0','Year 1','Year 2','Year 3','Year 4','Year 5+'],series:[{name:'Net Cash Flow',color:'var(--blue)',values:[0,-72,-68,-18,25,43]}],height:270,format:v=>`${Math.round(v)}M`}),{subtitle:'Since inception · click a point for the underlying cash flows'})}
        ${card('Allocation by Sector (NAV %)',donutChart(allocation,formatMoney(fund.nav),'NAV',145),{subtitle:'Current fair-value concentration'})}
      </section>
      <section class="fund-secondary-grid section-gap">
        ${card('Top Holdings by NAV',`<div class="info-list">${holdings.slice(0,5).map(company=>`<button type="button" class="list-row" data-action="open-company" data-id="${company.id}">${companyLogo(company)}<span class="list-row-main"><strong>${escapeHTML(company.name)}</strong><small>${escapeHTML(company.sector)} · ${pct(company.ownership)} ownership</small></span><strong>${formatMoney(company.fairValue)}<br><span class="muted">${pct(company.fairValue/fund.nav*100)}</span></strong></button>`).join('')}</div>`,{footer:'<button type="button" class="card-link" data-action="fund-profile-tab" data-tab="investments">View all investments</button>'})}
        ${card('Recent Capital Activity',`<div class="info-list">${capitalCalls.slice(0,5).map((call,index)=>`<button type="button" class="list-row" data-action="open-capital-call" data-id="${call.id}"><span class="activity-icon" style="color:${index%2?'var(--emerald)':'var(--blue)'};background:${index%2?'var(--emerald-soft)':'var(--blue-soft)'}">${icon(index%2?'trend-up':'wallet')}</span><span class="list-row-main"><strong>${index%2?'Distribution / follow-on':'Capital Call'}</strong><small>${escapeHTML(call.fund)}</small></span><strong class="${index%2?'positive':'negative'}">${formatMoney(index%2?call.collected:call.amount)}</strong></button>`).join('')}</div>`,{footer:'<button type="button" class="card-link" data-action="fund-profile-tab" data-tab="capital">Open capital activity</button>'})}
        ${card('Upcoming Obligations',`<div class="info-list">${[['Capital Call','$18.0M','28 Jul 2026','warning'],['Management Fee Q3 2026','$375,000','15 Aug 2026','warning'],['Carried Interest Provision','$2.6M','30 Sep 2026','warning'],['Capital Call','$20.0M','29 Oct 2026','success'],['Management Fee Q4 2026','$375,000','15 Nov 2026','success']].map(item=>`<div class="list-row"><span class="status-dot" style="background:${item[3]==='success'?'var(--emerald)':'var(--orange)'}"></span><span class="list-row-main"><strong>${item[0]}</strong><small>${item[2]}</small></span><strong>${item[1]}</strong></div>`).join('')}</div>`,{footer:'<button type="button" class="card-link" data-action="fund-profile-tab" data-tab="reporting">View reporting and obligations</button>'})}
        ${card('Fund Terms',`<div class="info-list"><div class="info-row"><span>Fund Entity</span><strong>${escapeHTML(fund.name)}, L.P.</strong></div><div class="info-row"><span>Vintage Year</span><strong>${fund.vintage}</strong></div><div class="info-row"><span>Fund Size</span><strong>${formatMoney(fund.commitment)}</strong></div><div class="info-row"><span>Strategy</span><strong>${escapeHTML(fund.strategy)}</strong></div><div class="info-row"><span>Primary Geography</span><strong>${escapeHTML(fund.geography)}</strong></div><div class="info-row"><span>Management Fee</span><strong>${escapeHTML(fund.managementFee)}</strong></div><div class="info-row"><span>Carried Interest</span><strong>${escapeHTML(fund.carry)}</strong></div><div class="info-row"><span>Status</span><strong>${statusPill(fund.status)}</strong></div></div>`,{footer:'<button type="button" class="card-link" data-action="fund-profile-tab" data-tab="documents">View fund documents</button>'})}
      </section>
    </section>`;
  }

  function renderFundInvestmentsTab(fund, fundCompanies, allocation) {
    const holdings = fundCompanies.length ? fundCompanies : companies;
    const invested = sum(holdings, item=>item.invested);
    const value = sum(holdings, item=>item.fairValue);
    const rows = holdings.map(company=>`<tr class="clickable" data-action="open-company" data-id="${company.id}"><td><span class="company-cell">${companyLogo(company)}<span><strong>${escapeHTML(company.name)}</strong><small>${escapeHTML(company.city)}</small></span></span></td><td>${escapeHTML(company.sector)}</td><td>${escapeHTML(company.stage)}</td><td>${company.entry}</td><td class="text-right">${formatMoney(company.invested)}</td><td class="text-right">${formatMoney(company.fairValue)}</td><td class="text-right">${(company.fairValue/company.invested).toFixed(2)}x</td><td class="text-right">${pct(company.ownership)}</td><td class="text-right ${company.revenueGrowth>=20?'positive':''}">${pct(company.revenueGrowth)}</td><td>${healthScore(company.health)}</td><td>${statusPill(company.runway<12?'Watch':'On track')}</td></tr>`).join('');
    return `<section class="profile-tab-panel fund-profile-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Investment portfolio workspace</strong><span>Holdings, valuations, ownership, operating performance, concentration and follow-on reserves.</span></div>${button('Add investment','add-company','primary','plus')}</div>
      <section class="grid cols-4 section-gap">
        ${metricCard({label:'Active Investments',value:String(holdings.length),iconName:'building',accent:'brand',foot:'Current holdings',action:'fund-investment-count'})}
        ${metricCard({label:'Cost Basis',value:formatMoney(invested),iconName:'wallet',accent:'blue',foot:'Total invested capital',action:'fund-cost-basis'})}
        ${metricCard({label:'Fair Value',value:formatMoney(value),iconName:'trend-up',accent:'emerald',foot:`${(value/Math.max(1,invested)).toFixed(2)}x gross MOIC`,action:'fund-investment-value'})}
        ${metricCard({label:'Follow-on Reserve',value:formatMoney(Math.max(0,fund.commitment-fund.called)*.58),iconName:'clock',accent:'amber',foot:'Estimated available reserve',action:'fund-reserve'})}
      </section>
      <section class="fund-two-column section-gap">
        ${card('Portfolio Value by Company',barChart({labels:holdings.slice(0,7).map(c=>c.name),series:[{name:'Invested',color:'var(--muted)',values:holdings.slice(0,7).map(c=>c.invested/1e6)},{name:'Fair Value',color:'var(--brand)',values:holdings.slice(0,7).map(c=>c.fairValue/1e6)}],height:320,yLabel:'USD millions',format:v=>`${Math.round(v)}M`}),{subtitle:'Select a bar to drill into valuation movements'})}
        ${card('Sector Allocation',donutChart(allocation,formatMoney(value),'Fair value',155),{subtitle:'NAV exposure by sector'})}
      </section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Investment Register</h3><span class="table-badge">${holdings.length} holdings</span></div><div class="table-tools">${button('Filters','company-filters','compact','filter')}${button('Export','export-companies','compact','download')}</div></div><div class="table-wrap"><table><thead><tr><th>Company</th><th>Sector</th><th>Stage</th><th>Entry</th><th class="text-right">Invested</th><th class="text-right">Fair Value</th><th class="text-right">MOIC</th><th class="text-right">Ownership</th><th class="text-right">Revenue Growth</th><th>Health</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></section>
    </section>`;
  }

  function renderFundCapitalTab(fund) {
    const calls = capitalCalls.filter(call=>call.fund===fund.name);
    const visibleCalls = calls.length ? calls : capitalCalls.slice(0,5);
    const totalCalled = sum(visibleCalls, call=>call.amount);
    const totalCollected = sum(visibleCalls, call=>call.collected);
    const cashFlowRows = [['01 Jul 2026','Capital call','CC-2026-0038',42500000,'Pending'],['18 Jun 2026','Distribution','Portfolio realisation',-12400000,'Settled'],['15 Jun 2026','Management fee','Q2 2026 fee',375000,'Settled'],['28 May 2026','Capital call','CC-2026-0033',22500000,'Partially collected'],['17 May 2026','Follow-on investment','Nova Analytics',-8000000,'Settled'],['30 Apr 2026','Fund expense','Audit and administration',-168000,'Settled']];
    return `<section class="profile-tab-panel fund-profile-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Capital activity workspace</strong><span>Capital calls, collections, distributions, fees, investment funding and cash reconciliation.</span></div>${button('New capital activity','new-capital-call','primary','plus')}</div>
      <section class="grid cols-4 section-gap">
        ${metricCard({label:'Issued Calls',value:formatMoney(totalCalled),iconName:'send',accent:'blue',foot:`${visibleCalls.length} call notices`,action:'fund-calls-issued'})}
        ${metricCard({label:'Collected',value:formatMoney(totalCollected),iconName:'check-circle',accent:'emerald',foot:`${pct(totalCollected/Math.max(1,totalCalled)*100)} collection rate`,action:'fund-calls-collected'})}
        ${metricCard({label:'Distributions YTD',value:'$24.8M',iconName:'trend-up',accent:'purple',foot:'Across 3 distributions',action:'fund-distributions'})}
        ${metricCard({label:'Next Cash Need',value:'$18.0M',iconName:'clock',accent:'amber',foot:'Due 28 Jul 2026',action:'fund-cash-need'})}
      </section>
      <section class="fund-two-column section-gap">
        ${card('Quarterly Cash Movement',barChart({labels:['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'Calls',color:'var(--blue)',values:[18,25,14,32,21,42.5]},{name:'Distributions',color:'var(--emerald)',values:[4,7,9,12,11,24.8]}],height:310,yLabel:'USD millions',format:v=>`${Number(v).toFixed(0)}M`}),{subtitle:'Calls versus distributions'})}
        ${card('Collection Status',donutChart([{label:'Collected',value:totalCollected,color:'#07936d',display:formatMoney(totalCollected)},{label:'Outstanding',value:Math.max(0,totalCalled-totalCollected),color:'#f29a1f',display:formatMoney(Math.max(0,totalCalled-totalCollected))}],pct(totalCollected/Math.max(1,totalCalled)*100),'Collected',150),{subtitle:'Current issued notices'})}
      </section>
      <section class="fund-two-column section-gap">
        ${card('Capital Call Register',`<div class="table-wrap"><table><thead><tr><th>Reference</th><th>Call Date</th><th>Due Date</th><th>Purpose</th><th class="text-right">Amount</th><th class="text-right">Collected</th><th>Status</th></tr></thead><tbody>${visibleCalls.map(call=>`<tr class="clickable" data-action="open-capital-call" data-id="${call.id}"><td class="table-primary brand-text">${call.id}</td><td>${call.callDate}</td><td>${call.dueDate}</td><td>${escapeHTML(call.purpose)}</td><td class="text-right">${formatMoney(call.amount)}</td><td class="text-right">${formatMoney(call.collected)}</td><td>${statusPill(call.status)}</td></tr>`).join('')}</tbody></table></div>`,{tools:button('Export','export-capital','compact','download')})}
        ${card('Cash Ledger',`<div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th class="text-right">Amount</th><th>Status</th></tr></thead><tbody>${cashFlowRows.map(row=>`<tr><td>${row[0]}</td><td class="table-primary">${row[1]}</td><td>${row[2]}</td><td class="text-right ${row[3]<0?'negative':'positive'}">${formatMoney(Math.abs(row[3]))}${row[3]<0?' out':''}</td><td>${statusPill(row[4])}</td></tr>`).join('')}</tbody></table></div>`,{tools:button('Reconcile','reconcile-capital','compact','check-circle')})}
      </section>
    </section>`;
  }

  function renderFundLPsTab(fund) {
    const totalCommitment = sum(lps, lp=>lp.commitment);
    const fundShare = fund.commitment / Math.max(1,totalCommitment);
    const allocations = lps.map(lp=>({...lp,fundCommitment:lp.commitment*fundShare,fundCalled:lp.called*fundShare,fundDistributed:lp.distributed*fundShare}));
    const rows = allocations.map(lp=>`<tr class="clickable" data-action="open-lp" data-id="${lp.id}"><td class="table-primary"><span class="company-cell"><span class="company-logo" style="background:${lp.color}">${escapeHTML(initials(lp.name))}</span><span><strong>${escapeHTML(lp.name)}</strong><small>${escapeHTML(lp.type)}</small></span></span></td><td>${escapeHTML(lp.geography)}</td><td class="text-right">${formatMoney(lp.fundCommitment)}</td><td class="text-right">${formatMoney(lp.fundCalled)}</td><td class="text-right">${formatMoney(lp.fundCommitment-lp.fundCalled)}</td><td class="text-right">${formatMoney(lp.fundDistributed)}</td><td>${statusPill(lp.kyc)}</td><td>${statusPill(lp.portal)}</td><td>${escapeHTML(lp.owner)}</td></tr>`).join('');
    return `<section class="profile-tab-panel fund-profile-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Limited partner workspace</strong><span>Commitments, unfunded balances, KYC, portal access, concentration and investor servicing.</span></div>${button('Add Limited Partner','add-lp','primary','plus')}</div>
      <section class="grid cols-4 section-gap">
        ${metricCard({label:'Fund LPs',value:String(lps.length),iconName:'users',accent:'brand',foot:'Active investor records',action:'fund-lp-count'})}
        ${metricCard({label:'Commitments',value:formatMoney(fund.commitment),iconName:'wallet',accent:'blue',foot:'Subscribed to this fund',action:'fund-lp-commitments'})}
        ${metricCard({label:'Unfunded',value:formatMoney(Math.max(0,fund.commitment-fund.called)),iconName:'clock',accent:'amber',foot:'Remaining call capacity',action:'fund-lp-unfunded'})}
        ${metricCard({label:'Verified KYC',value:`${lps.filter(lp=>lp.kyc==='Verified').length}/${lps.length}`,iconName:'shield',accent:'emerald',foot:'Investor records current',action:'fund-lp-kyc'})}
      </section>
      <section class="fund-three-column section-gap">
        ${card('Commitment by Investor Type',donutChart([{label:'Pension Funds',value:250,color:'#2475f5',display:'$250M'},{label:'Insurance',value:200,color:'#07936d',display:'$200M'},{label:'Endowments',value:175,color:'#60a5fa',display:'$175M'},{label:'Family Offices',value:150,color:'#f29a1f',display:'$150M'},{label:'Funds of Funds',value:125,color:'#0f98b6',display:'$125M'}],formatMoney(fund.commitment),'Commitment',150),{subtitle:'Investor mix'})}
        ${card('Geographic Mix',barChart({labels:['Africa','North America','Europe','Middle East','Asia'],series:[{name:'Commitment',color:'var(--brand)',values:[375,325,200,80,55]}],height:280,yLabel:'USD millions',format:v=>`${Math.round(v)}M`}),{subtitle:'LP domicile exposure'})}
        ${card('Investor Servicing',`<div class="info-list"><div class="info-row"><span>Notices acknowledged</span><strong>92%</strong></div><div class="info-row"><span>Portal adoption</span><strong>96%</strong></div><div class="info-row"><span>KYC current</span><strong>80%</strong></div><div class="info-row"><span>Open document requests</span><strong class="warning-text">4</strong></div><div class="info-row"><span>Interactions this quarter</span><strong>18</strong></div><div class="info-row"><span>Average response time</span><strong>1.8 days</strong></div></div>`,{footer:'<button type="button" class="card-link" data-action="new-communication">Send investor update</button>'})}
      </section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Fund LP Register</h3><span class="table-badge">${lps.length} LPs</span></div><div class="table-tools">${button('Send communication','new-communication','compact','mail')}${button('Export','export-lps','compact','download')}</div></div><div class="table-wrap"><table><thead><tr><th>LP</th><th>Geography</th><th class="text-right">Commitment</th><th class="text-right">Called</th><th class="text-right">Unfunded</th><th class="text-right">Distributed</th><th>KYC</th><th>Portal</th><th>Owner</th></tr></thead><tbody>${rows}</tbody></table></div></section>
    </section>`;
  }

  function renderFundPerformanceTab(fund, fundCompanies) {
    const holdings = fundCompanies.length ? fundCompanies : companies.slice(0,5);
    const periods=['Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'];
    const net=[8.1,8.8,9.5,10.2,10.7,11.2,11.7,fund.netIrr];
    const gross=net.map((v,i)=>Number((v+2.7+i*.08).toFixed(1)));
    return `<section class="profile-tab-panel fund-profile-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Fund performance workspace</strong><span>Returns, value bridges, attribution, benchmark comparison and company-level contribution.</span></div>${button('Generate performance report','generate-report','primary','file-chart')}</div>
      <section class="grid cols-4 section-gap">
        ${metricCard({label:'Gross IRR',value:pct(fund.grossIrr),iconName:'trend-up',accent:'emerald',foot:'Since inception',action:'fund-gross-irr'})}
        ${metricCard({label:'Net IRR',value:pct(fund.netIrr),iconName:'trend-up',accent:'blue',foot:'After fees and carry',action:'fund-net-irr'})}
        ${metricCard({label:'TVPI',value:`${fund.tvpi.toFixed(2)}x`,iconName:'pie-chart',accent:'purple',foot:'Total value multiple',action:'fund-tvpi'})}
        ${metricCard({label:'DPI',value:`${fund.dpi.toFixed(2)}x`,iconName:'wallet',accent:'amber',foot:'Distributed multiple',action:'fund-dpi'})}
      </section>
      <section class="fund-two-column section-gap">
        ${card('Gross and Net IRR Trend',lineChart({labels:periods,series:[{name:'Gross IRR',color:'var(--emerald)',values:gross},{name:'Net IRR',color:'var(--blue)',values:net}],height:320,yLabel:'Percent',format:v=>`${Number(v).toFixed(1)}%`}),{subtitle:'Quarter-end performance · select a point to inspect the reporting period'})}
        ${card('Value Bridge',waterfallChart([{label:'Opening NAV',value:131,total:true},{label:'Investment',value:22},{label:'Value creation',value:31},{label:'FX',value:-4},{label:'Realisation',value:-18},{label:'Closing NAV',value:162,total:true}]),{subtitle:'Q2 2026 movement · USD millions'})}
      </section>
      <section class="fund-two-column section-gap">
        ${card('Company Contribution to NAV',barChart({labels:holdings.map(c=>c.name),series:[{name:'Fair value',color:'var(--brand)',values:holdings.map(c=>c.fairValue/1e6)}],height:300,yLabel:'USD millions',format:v=>`${Math.round(v)}M`}),{subtitle:'Current fair value by holding'})}
        ${card('Benchmark Comparison',`<div class="table-wrap"><table><thead><tr><th>Benchmark</th><th class="text-right">Fund</th><th class="text-right">Benchmark</th><th class="text-right">Alpha</th><th>Status</th></tr></thead><tbody>${[['Net IRR',fund.netIrr,9.8,fund.netIrr-9.8],['Gross IRR',fund.grossIrr,12.4,fund.grossIrr-12.4],['TVPI',fund.tvpi,1.48,fund.tvpi-1.48],['DPI',fund.dpi,.52,fund.dpi-.52]].map((row,i)=>`<tr><td class="table-primary">${row[0]}</td><td class="text-right">${i<2?pct(row[1]):`${row[1].toFixed(2)}x`}</td><td class="text-right">${i<2?pct(row[2]):`${row[2].toFixed(2)}x`}</td><td class="text-right positive">+${i<2?pct(row[3]):`${row[3].toFixed(2)}x`}</td><td>${statusPill('Outperforming','success')}</td></tr>`).join('')}</tbody></table></div>`,{subtitle:'Cambridge-style private markets composite'})}
      </section>
    </section>`;
  }

  function renderFundDocumentsTab(fund) {
    const fundDocs = [
      ['Limited Partnership Agreement.pdf','Legal','v4.2','Verified','12 Jun 2026'],
      ['Private Placement Memorandum.pdf','Fundraising','v3.1','Verified','04 Apr 2026'],
      ['Side Letter Register.xlsx','Legal','v8.0','In review','15 Jul 2026'],
      ['Q2 2026 Valuation Pack.pdf','Valuation','v1.0','Verified','10 Jul 2026'],
      ['Capital Account Statements Q2.zip','Investor Reporting','v1.0','Verified','14 Jul 2026'],
      ['ESG & Impact Report 2025.pdf','ESG','v2.0','Verified','28 Jun 2026'],
      ['Audit Findings and Responses.docx','Audit','v1.4','Needs update','11 Jul 2026']
    ];
    return `<section class="profile-tab-panel fund-profile-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Fund document workspace</strong><span>Governing agreements, side letters, valuation evidence, audit records and investor reporting packs.</span></div><div class="page-actions">${button('Create folder','create-folder','','folder')}<label class="button primary compact">${icon('upload')} Upload<input type="file" hidden data-file-action="upload-document"></label></div></div>
      <section class="fund-document-summary section-gap">
        ${card('Document Library',`<div class="document-stat"><span class="document-stat-icon">${icon('folder')}</span><div><strong>286 files</strong><small>Across 14 controlled folders</small></div></div>`,{footer:'<span class="muted small">8.6 GB used · encrypted at rest</span>'})}
        ${card('Review Queue',`<div class="document-stat"><span class="document-stat-icon warning">${icon('clock')}</span><div><strong>7 pending</strong><small>3 require legal review</small></div></div>`,{footer:'<button type="button" class="card-link" data-action="generic-action">Open review queue</button>'})}
        ${card('Access',`<div class="document-stat"><span class="document-stat-icon success">${icon('shield')}</span><div><strong>42 authorised</strong><small>12 internal · 30 LP users</small></div></div>`,{footer:'<button type="button" class="card-link" data-action="change-permissions">Manage permissions</button>'})}
      </section>
      <section class="fund-two-column section-gap fund-document-layout">
        ${card('Folders',`<div class="fund-folder-grid">${[['Legal',38],['Fundraising',26],['Valuation',44],['Investor Reporting',62],['Audit',31],['Tax',24],['ESG',37],['Capital Activity',24]].map(item=>`<button type="button" class="fund-folder" data-action="generic-action"><span class="document-row-icon folder">${icon('folder')}</span><span><strong>${item[0]}</strong><small>${item[1]} documents</small></span>${icon('chevron-right')}</button>`).join('')}</div>`) }
        ${card('Recent Documents',`<div class="table-wrap"><table><thead><tr><th>Document</th><th>Folder</th><th>Version</th><th>Updated</th><th>Status</th><th></th></tr></thead><tbody>${fundDocs.map((doc,index)=>`<tr><td class="table-primary"><button type="button" class="v17-document-name" data-action="preview-document" data-id="${documentIdForName(doc[0])}"><span class="document-row-icon">${icon(doc[0].endsWith('.xlsx')?'file-chart':'file')}</span><span>${escapeHTML(doc[0])}</span></button></td><td>${doc[1]}</td><td>${doc[2]}</td><td>${doc[4]}</td><td>${statusPill(doc[3])}</td><td><div class="document-row-actions"><button type="button" class="button ghost compact icon-only" data-action="preview-document" data-id="${documentIdForName(doc[0])}">${icon('eye')}</button><button type="button" class="button ghost compact icon-only" data-action="download-document" data-id="${documentIdForName(doc[0])}">${icon('download')}</button></div></td></tr>`).join('')}</tbody></table></div>`,{tools:button('Export index','export-drilldown','compact','download')})}
      </section>
    </section>`;
  }

  function renderFundReportingTab(fund) {
    const fundReports = reports.filter(report=>report.fund===fund.name || report.entity===fund.name).concat(reports.slice(0,3)).slice(0,6);
    return `<section class="profile-tab-panel fund-profile-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Fund reporting workspace</strong><span>Reporting calendar, LP deliverables, regulatory submissions, approval workflow and distribution controls.</span></div>${button('Create report','generate-report','primary','file-chart')}</div>
      <section class="grid cols-4 section-gap">
        ${metricCard({label:'Due This Quarter',value:'12',iconName:'calendar',accent:'blue',foot:'5 investor · 4 regulatory · 3 internal',action:'fund-report-due'})}
        ${metricCard({label:'In Progress',value:'5',iconName:'clock',accent:'amber',foot:'Across finance and investment teams',action:'fund-report-progress'})}
        ${metricCard({label:'Completed',value:'18',iconName:'check-circle',accent:'emerald',foot:'Current reporting year',action:'fund-report-complete'})}
        ${metricCard({label:'Overdue',value:'1',iconName:'alert',accent:'red',foot:'Quarterly investor report',action:'fund-report-overdue'})}
      </section>
      <section class="fund-two-column section-gap">
        ${card('Reporting Completion Trend',lineChart({labels:['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'On-time completion',color:'var(--emerald)',values:[82,86,91,93,94,96]},{name:'Target',color:'var(--brand)',values:[90,90,92,92,95,95]}],height:300,yLabel:'Percent',format:v=>`${Math.round(v)}%`}),{subtitle:'Completion within agreed deadline'})}
        ${card('Next 60 Days',`<div class="timeline">${[['15 Aug 2026','Q2 Investor Report','Investment team','In progress'],['20 Aug 2026','Capital Account Statements','Fund administration','In review'],['31 Aug 2026','Regulatory Return','Compliance','Not started'],['15 Sep 2026','Portfolio ESG Data Pack','ESG lead','Not started'],['30 Sep 2026','Quarter-end Valuation Pack','Finance','Scheduled']].map(item=>`<button type="button" class="timeline-item" data-action="generic-action"><strong>${item[1]}</strong><small>${item[0]} · ${item[2]}</small><span>${statusPill(item[3])}</span></button>`).join('')}</div>`,{subtitle:'Critical deliverables and owners'})}
      </section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Reporting Register</h3><span class="table-badge">${fundReports.length} visible</span></div><div class="table-tools">${button('Filters','report-filters','compact','filter')}${button('Export','export-reports','compact','download')}</div></div><div class="table-wrap"><table><thead><tr><th>Report</th><th>Entity</th><th>Owner</th><th>Frequency</th><th>Due</th><th>Progress</th><th>Status</th><th>Delivery</th><th></th></tr></thead><tbody>${fundReports.map(report=>`<tr><td class="table-primary">${escapeHTML(report.type)}</td><td>${escapeHTML(report.entity)}</td><td>${escapeHTML(report.owner)}</td><td>${escapeHTML(report.frequency)}</td><td>${report.due}</td><td><span class="inline-progress"><span class="progress"><span style="width:${report.progress}%"></span></span><strong>${report.progress}%</strong></span></td><td>${statusPill(report.status)}</td><td>${escapeHTML(report.channel)}</td><td><button type="button" class="button ghost compact icon-only" data-action="open-report-builder">${icon('chevron-right')}</button></td></tr>`).join('')}</tbody></table></div></section>
    </section>`;
  }

  function renderFundDetail() {
    const fund = funds.find(f=>f.id===state.selectedFundId) || funds[0];
    const fundCompanies = companies.filter(c=>c.fund===fund.name);
    const allocation = [
      {label:'Financial Services',value:27.3,color:'#2475f5',display:'27.3%'},
      {label:'Technology',value:22.8,color:'#0ba780',display:'22.8%'},
      {label:'Consumer',value:18.6,color:'#f5a623',display:'18.6%'},
      {label:'Industrial',value:14.7,color:'#60a5fa',display:'14.7%'},
      {label:'Healthcare',value:8.2,color:'#f0641c',display:'8.2%'},
      {label:'Other',value:8.4,color:'#aab3c2',display:'8.4%'}
    ];
    const tabs=[['overview','Overview'],['investments','Investments'],['capital','Capital Activity'],['lps','LPs'],['performance','Performance'],['documents','Documents'],['reporting','Reporting']];
    const content = state.fundTab==='investments' ? renderFundInvestmentsTab(fund,fundCompanies,allocation)
      : state.fundTab==='capital' ? renderFundCapitalTab(fund)
      : state.fundTab==='lps' ? renderFundLPsTab(fund)
      : state.fundTab==='performance' ? renderFundPerformanceTab(fund,fundCompanies)
      : state.fundTab==='documents' ? renderFundDocumentsTab(fund)
      : state.fundTab==='reporting' ? renderFundReportingTab(fund)
      : renderFundOverviewTab(fund,fundCompanies,allocation);
    return `${pageHeader(fund.name,`${fund.vintage} vintage · ${fund.strategy} · ${fund.currency} · ${fund.status}`,`${button('Edit fund','edit-fund','','edit')}${button('New capital activity','new-capital-call','primary','plus')}${button('Generate report','generate-report','','file-chart')}`,'Fund Profile')}
      <section class="detail-hero fund-detail-hero"><div class="hero-meta fund-hero-meta"><div class="hero-meta-item"><span>Commitment</span><strong>${formatMoney(fund.commitment)}</strong></div><div class="hero-meta-item"><span>Called Capital</span><strong>${formatMoney(fund.called)}</strong></div><div class="hero-meta-item"><span>NAV</span><strong>${formatMoney(fund.nav)}</strong></div><div class="hero-meta-item"><span>Distributions</span><strong>${formatMoney(fund.distributed)}</strong></div><div class="hero-meta-item"><span>Gross IRR</span><strong class="positive">${pct(fund.grossIrr)}</strong></div><div class="hero-meta-item"><span>Net IRR</span><strong class="positive">${pct(fund.netIrr)}</strong></div><div class="hero-meta-item"><span>TVPI</span><strong>${fund.tvpi.toFixed(2)}x</strong></div><div class="hero-meta-item"><span>DPI</span><strong>${fund.dpi.toFixed(2)}x</strong></div></div></section>
      ${fundProfileMetrics(fund)}
      ${profileTabs(tabs,state.fundTab,'fund-profile-tab')}
      ${content}`;
  }

  function profileTabs(items, active, action) {
    return `<div class="tabs profile-tabs" role="tablist" aria-label="Profile sections">${items.map(([id,label])=>`<button type="button" class="tab ${active===id?'active':''}" role="tab" aria-selected="${active===id}" data-action="${action}" data-tab="${id}">${escapeHTML(label)}</button>`).join('')}</div>`;
  }

  function companyProfileMetrics(company) {
    return `<section class="metric-grid">
      ${metricCard({label:'Fair Value',value:formatMoney(company.fairValue),iconName:'dollar',accent:'purple',foot:'Current valuation',action:'company-valuation'})}
      ${metricCard({label:'Invested',value:formatMoney(company.invested),iconName:'building',accent:'emerald',foot:'Total cost basis',action:'company-invested'})}
      ${metricCard({label:'MOIC',value:`${(company.fairValue/company.invested).toFixed(2)}x`,iconName:'trend-up',accent:'blue',foot:'Gross multiple',action:'company-moic'})}
      ${metricCard({label:'Gross IRR',value:pct(company.revenueGrowth),iconName:'pie-chart',accent:'amber',foot:'Since entry',action:'company-irr'})}
      ${metricCard({label:'Revenue Growth',value:pct(company.revenueGrowth),iconName:'trend-up',accent:'emerald',foot:'vs FY2025',action:'company-growth'})}
      ${metricCard({label:'Runway',value:`${company.runway} months`,iconName:'clock',accent:'cyan',foot:company.runway<12?'Requires attention':'Healthy liquidity',action:'company-runway'})}
    </section>`;
  }

  function renderCompanyOverviewTab(company) {
    const labels = ['FY23 Actual','FY24 Actual','FY25 Actual','FY26 Budget','FY27 Forecast'];
    const performanceRows = ['Revenue','Gross Profit','EBITDA','Net Profit'].map((metric,index)=>{
      const base = [company.revenue,company.revenue.map(v=>v*company.margin/100),company.ebitda,company.ebitda.map(v=>v*.62)][index];
      return `<tr><td class="table-primary">${metric}</td>${base.map(v=>`<td class="text-right">${formatMoney(v*1000000)}</td>`).join('')}<td class="text-right positive">${pct((base.at(-1)-base[0])/Math.max(1,base[0])*100)}</td></tr>`;
    }).join('');
    return `<section class="profile-tab-panel split-layout section-gap"><div>
      <section class="grid cols-2">
        ${card('Revenue & EBITDA Trend',lineChart({labels,series:[{name:'Revenue (USD M)',color:'var(--blue)',values:company.revenue},{name:'EBITDA (USD M)',color:'var(--emerald)',values:company.ebitda}],height:275,yLabel:'USD millions',format:v=>`${Math.round(v)}M`}),{subtitle:'FY23 - FY27E · select any point for detailed performance'})}
        ${card('Operating KPIs',`<div class="grid cols-2"><article class="metric-card clickable" tabindex="0" data-action="company-growth"><span class="muted small">ARR</span><div class="metric-value">${formatMoney(company.arr*1000000)}</div><div class="metric-foot positive">↑ ${pct(company.revenueGrowth)} vs FY2025</div></article><article class="metric-card clickable" tabindex="0" data-action="company-margin"><span class="muted small">Gross Margin</span><div class="metric-value">${company.margin}%</div><div class="metric-foot positive">↑ 2.1pp</div></article><article class="metric-card clickable" tabindex="0" data-action="company-retention"><span class="muted small">Net Revenue Retention</span><div class="metric-value">${company.nrr || 'N/A'}${company.nrr?'%':''}</div><div class="metric-foot positive">↑ 8pp</div></article><article class="metric-card clickable" tabindex="0" data-action="company-clients"><span class="muted small">Active Clients</span><div class="metric-value">${company.clients}</div><div class="metric-foot positive">↑ 12 vs FY2025</div></article></div>`) }
      </section>
      <section class="grid cols-2 section-gap">
        ${card('Milestones',`<div class="table-wrap"><table class="criteria-table"><thead><tr><th>Milestone</th><th>Target</th><th>Owner</th><th>Due Date</th><th>Status</th></tr></thead><tbody>${[['Launch AI Insights Module','Increase product stickiness','Tendai Moyo','30 Jun 2026','On Track'],['Expand into South Africa','First 5 enterprise clients','Rudo Chikomo','31 Aug 2026','On Track'],['ISO 27001 Certification','Information security standard','Tinashe Nyoni','30 Sep 2026','At Risk'],['ARR $30M Run Rate','Scale revenue','Farai Mutasa','31 Dec 2026','On Track']].map(row=>`<tr class="clickable" data-action="open-milestones">${row.map((cell,i)=>`<td class="${i===0?'table-primary':''}">${i===4?statusPill(cell):escapeHTML(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,{footer:'<button type="button" class="card-link" data-action="open-milestones">View all milestones</button>'})}
        ${card('Value Creation Plan',`<div class="info-list">${[['Go-to-market expansion',68],['Product & Technology',57],['Operational Excellence',63],['Talent & Organisation',50]].map(item=>`<button type="button" class="list-row" data-action="open-value-creation"><span class="list-row-main"><strong>${item[0]}</strong><small>Initiative progress and accountable owners</small></span><strong>${item[1]}%</strong></button>${progressBar(item[1])}`).join('')}</div>`,{footer:'<button type="button" class="card-link" data-action="company-profile-tab" data-tab="value-creation">Open value-creation workspace</button>'})}
      </section>
      ${card('Monthly Performance',`<div class="table-wrap"><table><thead><tr><th>Metric</th>${labels.map(l=>`<th class="text-right">${l}</th>`).join('')}<th class="text-right">Growth</th></tr></thead><tbody>${performanceRows}</tbody></table></div>`,{classes:'section-gap'})}
    </div><div class="side-stack" style="display:flex">
      ${card('Next Board Meeting',`<div class="metric-value" style="font-size:18px">${company.boardDate}</div><p class="muted small">Harare, Zimbabwe · 10:00 SAST</p>`,{footer:'<button type="button" class="card-link" data-action="company-profile-tab" data-tab="board">Open governance workspace</button>'})}
      ${card('Leadership Team',`<div class="grid cols-2">${[['Tendai Moyo','Chief Executive Officer'],['Tinashe Nyoni','Chief Technology Officer'],['Rudo Chikomo','Chief Revenue Officer'],['Farai Mutasa','Chief Financial Officer']].map((p,i)=>`<button type="button" class="list-row" data-action="open-team">${avatar(p[0],i)}<span class="list-row-main"><strong>${p[0]}</strong><small>${p[1]}</small></span></button>`).join('')}</div>`,{footer:'<button type="button" class="card-link" data-action="open-team">View all team members</button>'})}
      ${card('Board Composition',donutChart([{label:'Matanho',value:3,color:'#07936d',display:'3'},{label:'Management',value:2,color:'#2475f5',display:'2'},{label:'Independent',value:2,color:'#60a5fa',display:'2'}],'7','Directors',120),{footer:'<button type="button" class="card-link" data-action="company-profile-tab" data-tab="board">View board details</button>'})}
      ${card('Alerts & Actions',`<div class="info-list"><button type="button" class="list-row" data-action="open-alerts"><span class="activity-icon" style="color:var(--red);background:var(--red-soft)">${icon('alert')}</span><span class="list-row-main"><strong>ISO 27001 Certification</strong><small>At Risk</small></span></button><button type="button" class="list-row" data-action="open-alerts"><span class="activity-icon" style="color:var(--amber);background:var(--amber-soft)">${icon('clock')}</span><span class="list-row-main"><strong>1 milestone due in 30 days</strong><small>Due Soon</small></span></button><button type="button" class="list-row" data-action="open-alerts"><span class="activity-icon" style="color:var(--blue);background:var(--blue-soft)">${icon('file')}</span><span class="list-row-main"><strong>2 updates pending review</strong><small>Review</small></span></button></div>`,{footer:'<button type="button" class="card-link" data-action="open-alerts">View all alerts</button>'})}
      ${card('ESG Snapshot',`<div class="info-list"><div class="info-row"><span>Environmental</span>${healthScore(company.esg[0])}</div><div class="info-row"><span>Social</span>${healthScore(company.esg[1])}</div><div class="info-row"><span>Governance</span>${healthScore(company.esg[2])}</div></div>`,{footer:'<button type="button" class="card-link" data-action="open-esg">View full ESG report</button>'})}
    </div></section>`;
  }

  function renderCompanyPerformanceTab(company) {
    const quarters=['Q3 2025','Q4 2025','Q1 2026','Q2 2026','Q3 2026E','Q4 2026E'];
    const revenue=[6.1,6.8,7.4,8.6,9.4,10.2];
    const ebitda=[1.2,1.5,1.7,2.1,2.4,2.8];
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Operating performance workspace</strong><span>Quarterly trends, unit economics, commercial cohorts and management exceptions.</span></div>${button('Add operating update','company-update','primary','plus')}</div>
      <section class="grid cols-3 section-gap">
        ${card('Quarterly Revenue & EBITDA',lineChart({labels:quarters,series:[{name:'Revenue',color:'var(--blue)',values:revenue},{name:'EBITDA',color:'var(--emerald)',values:ebitda}],height:300,yLabel:'USD millions',format:v=>`${Number(v).toFixed(1)}M`}),{subtitle:'Actual and current forecast'})}
        ${card('Growth by Revenue Stream',barChart({labels:['Enterprise licences','Usage fees','Implementation','Data services'],series:[{name:'FY2025',color:'var(--muted)',values:[14.2,5.6,3.1,2.4]},{name:'FY2026E',color:'var(--brand)',values:[18.8,8.2,4.6,4.9]}],height:300,yLabel:'USD millions',format:v=>`${Number(v).toFixed(1)}M`}),{subtitle:'Click a stream to inspect customers and contracts'})}
        ${card('Customer Cohort Health',donutChart([{label:'Expansion',value:46,color:'#0ba780',display:'46%'},{label:'Stable',value:38,color:'#2475f5',display:'38%'},{label:'Contraction',value:11,color:'#f5a623',display:'11%'},{label:'Churned',value:5,color:'#dc4b5b',display:'5%'}],'135%','NRR',150),{subtitle:'Latest trailing-twelve-month cohort'})}
      </section>
      <section class="grid cols-2 section-gap">
        ${card('KPI Scorecard',`<div class="table-wrap"><table><thead><tr><th>Metric</th><th class="text-right">Actual</th><th class="text-right">Budget</th><th class="text-right">Variance</th><th>Trend</th><th>Status</th></tr></thead><tbody>${[['ARR','$22.6M','$21.4M','+$1.2M','↑ 9.4%','Ahead'],['Gross margin','74.0%','72.0%','+2.0pp','↑ 1.2pp','Ahead'],['NRR','135%','128%','+7pp','↑ 8pp','Ahead'],['CAC payback','13.4 mo','12.0 mo','+1.4 mo','↓ 0.8 mo','Watch'],['Logo churn','3.1%','2.8%','+0.3pp','↑ 0.2pp','Watch'],['Runway',`${company.runway} mo`,'15 mo',`${company.runway-15} mo`,'Stable','On Track']].map(row=>`<tr class="clickable" data-action="chart-drilldown" data-chart-label="${escapeHTML(row[0])}" data-chart-value="Actual ${escapeHTML(row[1])} vs budget ${escapeHTML(row[2])}"><td class="table-primary">${row[0]}</td><td class="text-right">${row[1]}</td><td class="text-right">${row[2]}</td><td class="text-right ${row[3].startsWith('+')?'positive':'warning-text'}">${row[3]}</td><td>${row[4]}</td><td>${statusPill(row[5])}</td></tr>`).join('')}</tbody></table></div>`) }
        ${card('Regional Performance',barChart({labels:['Zimbabwe','South Africa','Kenya','Nigeria','Other'],series:[{name:'Revenue',color:'var(--blue)',values:[9.8,7.2,4.1,3.4,2.6]},{name:'Gross profit',color:'var(--emerald)',values:[7.4,5.1,3.0,2.4,1.9]}],height:290,yLabel:'USD millions',format:v=>`${Number(v).toFixed(1)}M`}),{subtitle:'YTD revenue and gross profit'})}
      </section>
      ${card('Account-Level Performance',`<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Region</th><th class="text-right">ARR</th><th class="text-right">Growth</th><th class="text-right">Gross Margin</th><th>Renewal</th><th>Health</th><th>Owner</th></tr></thead><tbody>${[['Atlas Bank','Zimbabwe','$3.6M','28%','78%','Sep 2026','Excellent','Rudo Chikomo'],['Kopano Retail','South Africa','$2.9M','34%','75%','Nov 2026','Good','Munashe Dube'],['Savannah Insurance','Kenya','$2.1M','19%','72%','Aug 2026','Watch','Tariro Ncube'],['Mukuru Logistics','Zimbabwe','$1.7M','42%','76%','Dec 2026','Excellent','Rudo Chikomo'],['Baobab Health','Nigeria','$1.4M','11%','68%','Oct 2026','Watch','Munashe Dube']].map(row=>`<tr class="clickable" data-action="chart-drilldown" data-chart-label="${escapeHTML(row[0])}" data-chart-value="${escapeHTML(row[2])} ARR · ${escapeHTML(row[3])} growth">${row.map((cell,i)=>`<td class="${i===0?'table-primary':''} ${i>1&&i<5?'text-right':''}">${i===6?statusPill(cell):escapeHTML(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,{footer:'<span class="muted small">Select a customer to open contract, renewal and cohort details.</span>'})}
    </section>`;
  }

  function renderCompanyValueCreationTab(company) {
    const initiatives=[['Go-to-market expansion','Rudo Chikomo','Revenue growth','$19.0M ARR','$30.0M ARR',68,'On Track'],['Product & Technology','Tinashe Nyoni','Release velocity','1 major release/qtr','2 major releases/qtr',57,'On Track'],['Operational Excellence','Farai Mutasa','EBITDA margin','18%','26%',63,'On Track'],['Talent & Organisation','Tendai Moyo','Critical-role coverage','72%','95%',50,'Watch'],['Cybersecurity readiness','Tinashe Nyoni','ISO 27001','Gap assessment','Certified',44,'At Risk']];
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Value-creation operating plan</strong><span>Initiatives, owners, target outcomes, milestones and fund-team interventions.</span></div>${button('Add initiative','open-value-creation','primary','plus')}</div>
      <section class="grid cols-3 section-gap">
        ${card('Initiative Completion',barChart({labels:initiatives.map(i=>i[0]),series:[{name:'Completion',color:'var(--brand)',values:initiatives.map(i=>i[5])}],height:310,yLabel:'Percent complete',format:v=>`${Math.round(v)}%`}),{subtitle:'Select an initiative to inspect tasks and evidence'})}
        ${card('Estimated Value Uplift',waterfallChart([{label:'Entry value',value:85,total:true},{label:'Revenue scale',value:22},{label:'Margin expansion',value:17},{label:'Multiple change',value:9},{label:'Execution risk',value:-5},{label:'Target value',value:128,total:true}]),{subtitle:'Illustrative equity value bridge · USD millions'})}
        ${card('Milestone Status',donutChart([{label:'On Track',value:9,color:'#0ba780',display:'9'},{label:'Watch',value:3,color:'#f5a623',display:'3'},{label:'At Risk',value:1,color:'#dc4b5b',display:'1'},{label:'Complete',value:5,color:'#2475f5',display:'5'}],'18','Milestones',150),{subtitle:'Current portfolio-company plan'})}
      </section>
      ${card('Initiative Register',`<div class="table-wrap"><table><thead><tr><th>Initiative</th><th>Executive Owner</th><th>Primary KPI</th><th>Baseline</th><th>Target</th><th style="min-width:170px">Progress</th><th>Status</th><th>Next Review</th></tr></thead><tbody>${initiatives.map((row,index)=>`<tr class="clickable" data-action="open-value-creation"><td class="table-primary">${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td>${progressBar(row[5])}<small class="muted">${row[5]}% complete</small></td><td>${statusPill(row[6])}</td><td>${['8 Aug 2026','12 Aug 2026','15 Aug 2026','19 Aug 2026','5 Aug 2026'][index]}</td></tr>`).join('')}</tbody></table></div>`,{footer:'<span class="muted small">All initiative changes are captured in the company activity and audit trail.</span>'})}
      <section class="grid cols-2 section-gap">
        ${card('Fund Team Interventions',`<div class="info-list">${[['Commercial pricing workshop','Investment Team','Completed','18 Jul 2026'],['CFO recruitment shortlist','Talent Partner','In Progress','7 Aug 2026'],['Enterprise channel introductions','Operating Partner','In Progress','12 Aug 2026'],['ISO remediation sprint','Technology Advisor','At Risk','30 Sep 2026']].map(row=>`<button type="button" class="list-row" data-action="open-value-creation"><span class="list-row-main"><strong>${row[0]}</strong><small>${row[1]} · ${row[3]}</small></span>${statusPill(row[2])}</button>`).join('')}</div>`) }
        ${card('Benefits Realisation',lineChart({labels:['Q3 2025','Q4 2025','Q1 2026','Q2 2026','Q3 2026E','Q4 2026E'],series:[{name:'Realised value',color:'var(--emerald)',values:[2,5,9,15,23,34]},{name:'Plan',color:'var(--blue)',values:[3,6,11,17,25,35]}],height:275,yLabel:'USD millions',format:v=>`${Math.round(v)}M`}),{subtitle:'Cumulative realised operating-plan value'})}
      </section>
    </section>`;
  }

  function renderCompanyBoardTab(company) {
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Board and governance workspace</strong><span>Meetings, committees, resolutions, reserved matters, declarations and governance actions.</span></div>${button('Generate board pack','company-board-pack','primary','clipboard')}</div>
      <section class="grid cols-3 section-gap">
        ${card('Board Composition',donutChart([{label:'Matanho nominees',value:3,color:'#0ba780',display:'3'},{label:'Management',value:2,color:'#2475f5',display:'2'},{label:'Independent',value:2,color:'#60a5fa',display:'2'}],'7','Directors',150),{subtitle:'Full board · quorum 4'})}
        ${card('Attendance Trend',barChart({labels:['Aug 2025','Nov 2025','Feb 2026','May 2026','Aug 2026'],series:[{name:'Attendance',color:'var(--blue)',values:[86,100,86,100,100]}],height:265,yLabel:'Attendance %',format:v=>`${Math.round(v)}%`}),{subtitle:'Board and committee attendance'})}
        ${card('Governance Actions',`<div class="info-list">${[['ISO 27001 remediation oversight','Technology Committee','At Risk'],['Approve South Africa subsidiary','Full Board','Pending'],['CFO succession plan','Remuneration Committee','In Review'],['FY2027 budget assumptions','Audit & Risk Committee','On Track']].map(row=>`<button type="button" class="list-row" data-action="open-board-details"><span class="list-row-main"><strong>${row[0]}</strong><small>${row[1]}</small></span>${statusPill(row[2])}</button>`).join('')}</div>`) }
      </section>
      <section class="grid cols-2 section-gap">
        ${card('Upcoming Meeting Agenda',`<div class="table-wrap"><table><thead><tr><th>#</th><th>Agenda Item</th><th>Owner</th><th>Paper</th><th>Time</th><th>Status</th></tr></thead><tbody>${[['1','Conflict declarations','Company Secretary','Declaration register','5 min','Ready'],['2','CEO operating update','Tendai Moyo','CEO report','20 min','Ready'],['3','Q2 financial review','Farai Mutasa','Management accounts','25 min','Ready'],['4','ISO 27001 programme','Tinashe Nyoni','Remediation plan','20 min','Attention'],['5','South Africa expansion','Rudo Chikomo','Market entry paper','25 min','In Review'],['6','Resolutions and close','Chairperson','Resolution pack','10 min','Draft']].map(row=>`<tr class="clickable" data-action="open-board-calendar">${row.map((cell,i)=>`<td class="${i===1?'table-primary':''}">${i===5?statusPill(cell):cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,{footer:`<span class="muted small">${company.boardDate} · Harare / Secure video</span>`})}
        ${card('Committee Coverage',`<div class="table-wrap"><table class="permission-matrix"><thead><tr><th>Director</th><th>Board</th><th>Audit & Risk</th><th>Technology</th><th>Remuneration</th></tr></thead><tbody>${[['Tariro Kasere','Chair','Member','—','Member'],['Nyasha Moyo','Member','Chair','—','—'],['Rudo Ndlovu','Member','Member','Member','—'],['Tendai Moyo','CEO','Invitee','Member','Invitee'],['Tinashe Nyoni','Member','—','Chair','—'],['Chipo Dube','Independent','Member','Member','Chair'],['Farai Chikore','Independent','Member','—','Member']].map(row=>`<tr>${row.map((cell,i)=>`<td class="${i===0?'table-primary':''}">${cell==='—'?'<span class="muted">—</span>':cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`) }
      </section>
      <section class="grid cols-2 section-gap">
        ${card('Resolution Register',`<div class="table-wrap"><table><thead><tr><th>Resolution</th><th>Date</th><th>Decision</th><th>Conditions</th><th>Execution</th></tr></thead><tbody>${[['Approve FY2026 operating plan','28 May 2026','Approved','2','Complete'],['South Africa market entry','28 May 2026','Approved with conditions','3','In Progress'],['ISO 27001 certification budget','18 Feb 2026','Approved','0','In Progress'],['Senior leadership LTIP','18 Feb 2026','Deferred','—','Pending']].map(row=>`<tr class="clickable" data-action="view-resolution"><td class="table-primary">${row[0]}</td><td>${row[1]}</td><td>${statusPill(row[2])}</td><td>${row[3]}</td><td>${statusPill(row[4])}</td></tr>`).join('')}</tbody></table></div>`) }
        ${card('Reserved Matters & Compliance',`<div class="info-list">${[['Annual budget','Board approval required','Compliant'],['New debt above $2.0M','Investor consent required','Compliant'],['Change of control','Supermajority approval','No Event'],['Related-party transaction','Audit Committee review','Review Due'],['Key-person departure','Investor notification','No Event']].map(row=>`<div class="list-row"><span class="list-row-main"><strong>${row[0]}</strong><small>${row[1]}</small></span>${statusPill(row[2])}</div>`).join('')}</div>`) }
      </section>
    </section>`;
  }

  function renderCompanyFinancialsTab(company) {
    const periods=['FY23A','FY24A','FY25A','FY26B','FY26E','FY27E'];
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Financial monitoring workspace</strong><span>Management accounts, forecasts, liquidity, working capital, variances and covenant monitoring.</span></div>${button('Upload management accounts','profile-company-upload','','upload')}</div>
      <section class="grid cols-3 section-gap">
        ${card('Revenue, EBITDA & Cash',lineChart({labels:periods,series:[{name:'Revenue',color:'var(--blue)',values:[12.8,16.4,22.6,29.0,30.4,36.5]},{name:'EBITDA',color:'var(--emerald)',values:[2.3,3.4,6.4,8.9,9.6,12.5]},{name:'Closing cash',color:'var(--amber)',values:[5.2,7.8,10.4,9.7,11.3,14.8]}],height:310,yLabel:'USD millions',format:v=>`${Number(v).toFixed(1)}M`}),{subtitle:'Actual, budget and forecast'})}
        ${card('Cash Runway',barChart({labels:['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb'],series:[{name:'Base case',color:'var(--blue)',values:[18,17,16,15,14,13,12,11]},{name:'Downside',color:'var(--red)',values:[18,16,14,12,10,8,6,4]}],height:310,yLabel:'Months of runway',format:v=>`${Math.round(v)} mo`}),{subtitle:'Liquidity scenarios'})}
        ${card('Working Capital Cycle',donutChart([{label:'Receivables',value:42,color:'#2475f5',display:'42 days'},{label:'Contract assets',value:18,color:'#60a5fa',display:'18 days'},{label:'Payables offset',value:25,color:'#0ba780',display:'25 days'}],'35','Net days',150),{subtitle:'Latest month-end cycle'})}
      </section>
      ${card('Income Statement',`<div class="table-wrap"><table><thead><tr><th>USD millions</th>${periods.map(p=>`<th class="text-right">${p}</th>`).join('')}<th class="text-right">FY26E vs B</th></tr></thead><tbody>${[['Revenue',[12.8,16.4,22.6,29.0,30.4,36.5],'+4.8%'],['Gross profit',[9.2,12.0,16.7,21.0,22.5,27.1],'+7.1%'],['Operating expenses',[-6.9,-8.6,-10.3,-12.1,-12.9,-14.6],'-6.6%'],['EBITDA',[2.3,3.4,6.4,8.9,9.6,12.5],'+7.9%'],['Depreciation & amortisation',[-0.8,-1.0,-1.4,-1.8,-1.8,-2.1],'0.0%'],['Net finance costs',[-0.3,-0.4,-0.6,-0.7,-0.8,-0.8],'-14.3%'],['Profit before tax',[1.2,2.0,4.4,6.4,7.0,9.6],'+9.4%'],['Net profit',[0.9,1.5,3.3,4.8,5.2,7.1],'+8.3%']].map((row,index)=>`<tr class="${index===0||index===3||index===7?'table-primary':''}"><td>${row[0]}</td>${row[1].map(v=>`<td class="text-right ${v<0?'negative':''}">${v<0?'(' + Math.abs(v).toFixed(1) + ')':v.toFixed(1)}</td>`).join('')}<td class="text-right ${row[2].startsWith('+')?'positive':'negative'}">${row[2]}</td></tr>`).join('')}</tbody></table></div>`,{footer:'<span class="muted small">Click charts above for period and account-level drill-downs.</span>'})}
      <section class="grid cols-2 section-gap">
        ${card('Balance Sheet & Liquidity',`<div class="table-wrap"><table><thead><tr><th>Account</th><th class="text-right">Jun 2026</th><th class="text-right">Mar 2026</th><th class="text-right">Movement</th></tr></thead><tbody>${[['Cash','$11.3M','$10.1M','+$1.2M'],['Trade receivables','$6.8M','$5.9M','+$0.9M'],['Contract assets','$2.2M','$2.0M','+$0.2M'],['Trade payables','$3.9M','$3.7M','+$0.2M'],['Deferred revenue','$4.7M','$4.2M','+$0.5M'],['Interest-bearing debt','$2.5M','$2.7M','-$0.2M']].map(row=>`<tr><td class="table-primary">${row[0]}</td><td class="text-right">${row[1]}</td><td class="text-right">${row[2]}</td><td class="text-right ${row[3].startsWith('+')?'positive':''}">${row[3]}</td></tr>`).join('')}</tbody></table></div>`) }
        ${card('Covenants & Controls',`<div class="info-list">${[['Minimum cash balance','$5.0M','$11.3M','Passed'],['Debt / EBITDA','< 1.5x','0.26x','Passed'],['Annual audited statements','30 Apr 2026','Filed','Passed'],['Tax compliance certificate','Current','Renewal in progress','Watch'],['Budget variance threshold','±10%','Within range','Passed']].map(row=>`<div class="list-row"><span class="list-row-main"><strong>${row[0]}</strong><small>Limit: ${row[1]} · Actual: ${row[2]}</small></span>${statusPill(row[3])}</div>`).join('')}</div>`) }
      </section>
    </section>`;
  }

  function renderCompanyDocumentsTab(company) {
    const companyDocs = documents.filter(doc=>['Corporate & Legal','Financial','Commercial','Committee Pack'].includes(doc.folder));
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Company document workspace</strong><span>Governance papers, management accounts, legal records, board packs and evidence history.</span></div><div class="page-actions">${button('Request document','request-document','','send')}${button('Upload files','profile-company-upload','primary','upload')}</div></div>
      <section class="grid cols-4 section-gap">
        ${metricCard({label:'Total Documents',value:String(companyDocs.length+17),iconName:'file',accent:'blue',foot:'Across 7 folders',action:'company-documents'})}
        ${metricCard({label:'Verified',value:'19',iconName:'check-circle',accent:'emerald',foot:'Latest approved versions',action:'company-documents-verified'})}
        ${metricCard({label:'In Review',value:'4',iconName:'eye',accent:'amber',foot:'Assigned to reviewers',action:'company-documents-review'})}
        ${metricCard({label:'Requests Open',value:'3',iconName:'send',accent:'red',foot:'2 due this week',action:'company-documents-requests'})}
      </section>
      <section class="grid" style="grid-template-columns:230px minmax(0,1fr);gap:12px;margin-top:12px">
        ${card('Folders',`<div class="info-list">${[['Board & Governance',8],['Financials',9],['Legal & Corporate',7],['Commercial',5],['ESG & Impact',4],['Value Creation',6],['Tax & Compliance',3]].map((row,index)=>`<button type="button" class="folder-button ${index===0?'active':''}" data-action="profile-folder"><span>${icon('folder')} ${row[0]}</span><strong>${row[1]}</strong></button>`).join('')}</div>`) }
        ${card('Document Register',`<div class="table-toolbar"><div class="table-search">${icon('search')}<input type="text" placeholder="Search company documents..."></div><div class="table-tools">${button('Filter','company-filters','compact','filter')}${button('Export index','export-companies','compact','download')}</div></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Folder</th><th>Version</th><th>Owner</th><th>Uploaded</th><th>Status</th><th>Access</th><th></th></tr></thead><tbody>${companyDocs.map(doc=>`<tr class="clickable" data-action="preview-document" data-id="${doc.id}"><td class="table-primary">${icon('file')} ${escapeHTML(doc.name)}</td><td>${escapeHTML(doc.folder)}</td><td>${doc.version}</td><td>${escapeHTML(doc.owner)}</td><td>${doc.uploaded}</td><td>${statusPill(doc.status)}</td><td>${escapeHTML(doc.access)}</td><td><div class="document-row-actions"><button type="button" class="button ghost compact icon-only" data-action="preview-document" data-id="${doc.id}">${icon('eye')}</button><button type="button" class="button ghost compact icon-only" data-action="download-document">${icon('download')}</button></div></td></tr>`).join('')}</tbody></table></div>`,{footer:`<span class="muted small">Showing documents linked to ${escapeHTML(company.name)}.</span>`})}
      </section>
    </section>`;
  }

  function renderCompanyActivityTab(company) {
    const events=[['31 Jul 2026 · 14:22','Management update published','Tariro Moyo','Operating performance','Revenue and EBITDA forecast refreshed','Complete'],['30 Jul 2026 · 09:45','Board paper uploaded','Farai Mutasa','Board & Governance','Q2 management accounts added to the August pack','Complete'],['29 Jul 2026 · 16:10','Milestone status changed','Tinashe Nyoni','Value Creation','ISO 27001 certification moved from On Track to At Risk','Attention'],['28 Jul 2026 · 11:08','Valuation reviewed','Nyasha Moyo','Valuation','$128.4M fair value retained after review','Approved'],['25 Jul 2026 · 13:35','Comment added','Rudo Chikomo','Commercial','South Africa pipeline assumptions updated','Complete'],['22 Jul 2026 · 08:50','Document requested','System','Documents','Tax clearance certificate renewal requested','Pending']];
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Company activity and audit trail</strong><span>Chronological operating updates, approvals, document changes and user actions.</span></div><div class="page-actions">${button('Add update','company-update','primary','plus')}${button('Export audit','export-drilldown','','download')}</div></div>
      <section class="grid cols-3 section-gap">
        ${card('Activity by Type',donutChart([{label:'Performance',value:18,color:'#2475f5',display:'18'},{label:'Governance',value:12,color:'#60a5fa',display:'12'},{label:'Documents',value:14,color:'#0ba780',display:'14'},{label:'Value Creation',value:9,color:'#f5a623',display:'9'},{label:'Valuation',value:5,color:'#dc4b5b',display:'5'}],'58','Events',150))}
        ${card('Monthly Activity',barChart({labels:['Feb','Mar','Apr','May','Jun','Jul'],series:[{name:'Events',color:'var(--blue)',values:[24,31,28,37,42,58]}],height:260,yLabel:'Recorded events',format:v=>Math.round(v)}),{subtitle:'Audit and workflow events'})}
        ${card('Open Follow-ups',`<div class="info-list">${[['Renew tax clearance certificate','Farai Mutasa','5 Aug 2026','Watch'],['Complete ISO remediation evidence','Tinashe Nyoni','12 Aug 2026','At Risk'],['Confirm South Africa office lease','Rudo Chikomo','15 Aug 2026','In Review'],['Distribute August board pack','Company Secretary','17 Aug 2026','On Track']].map(row=>`<button type="button" class="list-row" data-action="open-activity"><span class="list-row-main"><strong>${row[0]}</strong><small>${row[1]} · ${row[2]}</small></span>${statusPill(row[3])}</button>`).join('')}</div>`) }
      </section>
      ${card('Complete Activity Log',`<div class="table-wrap"><table><thead><tr><th>Timestamp</th><th>Event</th><th>Actor</th><th>Workspace</th><th>Details</th><th>Status</th><th></th></tr></thead><tbody>${events.map(row=>`<tr class="clickable" data-action="open-activity">${row.map((cell,i)=>`<td class="${i===1?'table-primary':''}">${i===5?statusPill(cell):escapeHTML(cell)}</td>`).join('')}<td><button type="button" class="button ghost compact icon-only" data-action="open-activity">${icon('chevron-right')}</button></td></tr>`).join('')}</tbody></table></div>`,{footer:'<span class="muted small">Frontend prototype audit events are retained in browser memory for this session.</span>'})}
    </section>`;
  }

  function renderCompanyDetail() {
    const company = companies.find(c=>c.id===state.selectedCompanyId) || companies[0];
    const tabs=[['overview','Overview'],['performance','Performance'],['value-creation','Value Creation'],['board','Board & Governance'],['financials','Financials'],['documents','Documents'],['activity','Activity']];
    const content = state.companyTab==='performance' ? renderCompanyPerformanceTab(company)
      : state.companyTab==='value-creation' ? renderCompanyValueCreationTab(company)
      : state.companyTab==='board' ? renderCompanyBoardTab(company)
      : state.companyTab==='financials' ? renderCompanyFinancialsTab(company)
      : state.companyTab==='documents' ? renderCompanyDocumentsTab(company)
      : state.companyTab==='activity' ? renderCompanyActivityTab(company)
      : renderCompanyOverviewTab(company);
    return `${pageHeader(company.name,`${company.sector} · ${company.city} · ${company.fund}`,`${button('Add update','company-update','primary','plus')}${button('Board pack','company-board-pack','','clipboard')}${button('Activity','activity-menu','','clock',`data-context="company" data-id="${company.id}"`)}`,'Portfolio Company')}
      <section class="detail-hero"><div class="detail-hero-top"><div class="entity-title"><span class="entity-logo" style="background:linear-gradient(145deg,${company.color},color-mix(in srgb,${company.color} 55%,#101827))">${escapeHTML(initials(company.name))}</span><div><h1>${escapeHTML(company.name)}</h1><p>${escapeHTML(company.sector)} · ${escapeHTML(company.city)}</p></div></div>${statusPill('Active','success')}</div><div class="hero-meta"><div class="hero-meta-item"><span>Fund</span><strong>${escapeHTML(company.fund)}</strong></div><div class="hero-meta-item"><span>Entry date</span><strong>${company.entry}</strong></div><div class="hero-meta-item"><span>Ownership</span><strong>${pct(company.ownership)}</strong></div><div class="hero-meta-item"><span>Next board meeting</span><strong>${company.boardDate}</strong></div><div class="hero-meta-item"><span>Last reporting update</span><strong>${company.lastReport}</strong></div></div></section>
      ${companyProfileMetrics(company)}
      ${profileTabs(tabs,state.companyTab,'company-profile-tab')}
      ${content}`;
  }

  function lpAllocations() {
    return [
      {label:'Matanho Growth Fund II',value:150,color:'#2475f5',display:'$150.0M (60%)'},
      {label:'Matanho Venture Fund I',value:70,color:'#0ba780',display:'$70.0M (28%)'},
      {label:'Matanho Opportunity Fund',value:30,color:'#f5a623',display:'$30.0M (12%)'}
    ];
  }

  function lpProfileMetrics(lp) {
    return `<section class="metric-grid">
      ${metricCard({label:'Commitment',value:formatMoney(lp.commitment),iconName:'wallet',accent:'blue',foot:'Total commitment',action:'lp-commitment'})}
      ${metricCard({label:'Called',value:`${formatMoney(lp.called)} / ${pct(lp.called/lp.commitment*100)}`,iconName:'dollar',accent:'amber',foot:'Called capital',action:'lp-called'})}
      ${metricCard({label:'Unfunded',value:formatMoney(lp.unfunded),iconName:'pie-chart',accent:'purple',foot:'Remaining commitment',action:'lp-unfunded'})}
      ${metricCard({label:'Distributed',value:formatMoney(lp.distributed),iconName:'trend-up',accent:'emerald',foot:'Since inception',action:'lp-distributed'})}
      ${metricCard({label:'Net IRR',value:pct(lp.netIrr),iconName:'trend-up',accent:'cyan',foot:'Weighted across funds',action:'lp-irr'})}
      ${metricCard({label:'TVPI / DPI',value:`${lp.tvpi.toFixed(2)}x / ${lp.dpi.toFixed(2)}x`,iconName:'bar-chart',accent:'brand',foot:'Capital account multiples',action:'lp-multiples'})}
    </section>`;
  }

  function renderLPOverviewTab(lp) {
    const allocations=lpAllocations();
    return `<section class="profile-tab-panel split-layout section-gap"><div>
      <section class="grid cols-3">
        ${card('Commitment Allocation',donutChart(allocations,formatMoney(lp.commitment),'Total Commitment',145),{footer:'<button type="button" class="card-link" data-action="lp-profile-tab" data-tab="commitments">View commitments</button>'})}
        ${card('Capital Account Trend',lineChart({labels:['Jul 2023','Oct 2023','Jan 2024','Apr 2024','Jul 2024','Oct 2024','Jan 2025','Apr 2025','Jul 2025'],series:[{name:'Called',color:'var(--blue)',values:[0,35,62,83,100,112,125,148,155]},{name:'Distributed',color:'var(--emerald)',values:[0,15,30,42,50,63,72,78,90]},{name:'Net Invested',color:'var(--amber)',values:[0,20,32,41,50,49,53,70,95]}],height:260,yLabel:'USD millions',format:v=>`${Math.round(v)}M`}),{subtitle:'Click a period to inspect transactions'})}
        ${card('Recent Capital Calls & Distributions',`<div class="table-wrap"><table class="criteria-table"><thead><tr><th>Date</th><th>Type</th><th>Fund</th><th class="text-right">Amount</th></tr></thead><tbody>${capitalCalls.slice(0,5).map((call,index)=>`<tr class="clickable" data-action="open-capital-call" data-id="${call.id}"><td>${call.callDate}</td><td>${index%3===2?'Distribution':'Capital Call'}</td><td>${escapeHTML(call.fund)}</td><td class="text-right">${formatMoney(index%3===2?8000000:call.amount*.25)}</td></tr>`).join('')}</tbody></table></div>`,{footer:'<button type="button" class="card-link" data-action="lp-profile-tab" data-tab="capital">View all activity</button>'})}
      </section>
      <section class="grid cols-2 section-gap">
        ${card('Performance by Fund',`<div class="table-wrap"><table class="criteria-table"><thead><tr><th>Fund</th><th class="text-right">Commitment</th><th class="text-right">Called</th><th class="text-right">Distributed</th><th class="text-right">TVPI</th><th class="text-right">DPI</th><th class="text-right">Net IRR</th></tr></thead><tbody>${allocations.map((a,index)=>`<tr class="clickable" data-action="chart-drilldown" data-chart-label="${a.label}" data-chart-value="LP performance by fund"><td class="table-primary brand-text">${a.label}</td><td class="text-right">${formatMoney(a.value*1000000)}</td><td class="text-right">${formatMoney(a.value*620000)}</td><td class="text-right">${formatMoney(a.value*370000)}</td><td class="text-right">${[1.85,1.61,1.21][index]}x</td><td class="text-right">${[.60,.43,.21][index]}x</td><td class="text-right positive">${[16.4,11.6,8.4][index]}%</td></tr>`).join('')}<tr><td class="table-primary">Total / Weighted</td><td class="text-right table-primary">${formatMoney(lp.commitment)}</td><td class="text-right table-primary">${formatMoney(lp.called)}</td><td class="text-right table-primary">${formatMoney(lp.distributed)}</td><td class="text-right table-primary">${lp.tvpi}x</td><td class="text-right table-primary">${lp.dpi}x</td><td class="text-right positive table-primary">${pct(lp.netIrr)}</td></tr></tbody></table></div>`) }
        ${card('Contact Directory',`<div class="table-wrap"><table class="criteria-table"><thead><tr><th>Name</th><th>Title</th><th>Email</th><th>Phone</th></tr></thead><tbody>${[['Tendai Moyo','Chief Investment Officer','tendai.moyo@zpf.co.zw','+263 24 2 303 650'],['Chipo Nyoni','Head of Private Markets','chipo.nyoni@zpf.co.zw','+263 24 2 303 651'],['Farai Dube','Investment Manager','farai.dube@zpf.co.zw','+263 24 2 303 652']].map(row=>`<tr class="clickable" data-action="open-contacts">${row.map((cell,i)=>`<td class="${i===0?'table-primary':''}">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,{footer:'<button type="button" class="card-link" data-action="lp-profile-tab" data-tab="communications">Open communications</button>'})}
      </section>
      ${card('Interaction Timeline',`<div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Owner</th><th>Summary</th><th>Notes & Follow-up</th><th>Follow-up</th><th></th></tr></thead><tbody>${[['3 Jul 2026','Call','Maya M.','Quarterly call to discuss Q2 performance and recent capital call.','Discussed exit update and Fund V pipeline.','18 Jul 2026'],['1 Jul 2026','Email','Maya M.','Sent Q2 2026 Investor Update with NAV and market commentary.','Investor Update acknowledged.','No follow-up'],['26 Jun 2026','Meeting','Maya M.','Annual strategy meeting in Harare with CIO and team.','Reviewed 2026 market outlook and ESG reporting.','15 Jul 2026'],['12 Jun 2026','Email','James M.','Reminder: KYC Annual Review due 25 Jul 2026.','KYC documents in progress.','Completed']].map(row=>`<tr class="clickable" data-action="open-interaction">${row.map((cell,i)=>`<td class="${i===3?'table-primary':''}">${escapeHTML(cell)}</td>`).join('')}<td><button type="button" class="button ghost compact icon-only" data-action="activity-menu" data-context="lp" data-id="${lp.id}" aria-label="Interaction activity">${icon('clock')}</button></td></tr>`).join('')}</tbody></table></div>`,{classes:'section-gap'})}
    </div><div class="side-stack" style="display:flex">
      ${card('Primary Contacts',`<div class="info-list"><button type="button" class="list-row" data-action="open-contacts">${avatar('Tendai Moyo',0)}<span class="list-row-main"><strong>Tendai Moyo</strong><small>Chief Investment Officer<br>tendai.moyo@zpf.co.zw<br>+263 24 2 303 650</small></span></button><button type="button" class="list-row" data-action="open-contacts">${avatar('Chipo Nyoni',1)}<span class="list-row-main"><strong>Chipo Nyoni</strong><small>Head of Private Markets<br>chipo.nyoni@zpf.co.zw</small></span></button></div>`,{footer:'<button type="button" class="card-link" data-action="lp-profile-tab" data-tab="communications">View all contacts</button>'})}
      ${card('KYC Annual Review',`<div class="info-row"><span>Due 25 Jul 2026</span>${statusPill('Due in 7 days','warning')}</div>`,{footer:'<button type="button" class="card-link" data-action="lp-profile-tab" data-tab="documents">View KYC details</button>'})}
      ${card('Outstanding Documents',`<div class="info-list"><div class="list-row"><span class="list-row-main"><strong>Audited Financial Statements 2024</strong><small>Due 18 Jul 2026</small></span>${statusPill('5 days','warning')}</div><div class="list-row"><span class="list-row-main"><strong>Beneficial Ownership Declaration</strong><small>Due 25 Jul 2026</small></span>${statusPill('12 days','warning')}</div></div>`,{footer:'<button type="button" class="card-link" data-action="lp-profile-tab" data-tab="documents">View all documents</button>'})}
      ${card('Portal Access & Permissions',`<div class="info-list"><div class="info-row"><span>Portal Status</span><strong class="positive">Active</strong></div><div class="info-row"><span>Last Login</span><strong>3 Jul 2026</strong></div><div class="info-row"><span>Users</span><strong>4</strong></div><div class="info-row"><span>Roles</span><strong>Viewer (2), Editor (2)</strong></div></div>`,{footer:'<button type="button" class="card-link" data-action="lp-profile-tab" data-tab="portal">Manage access</button>'})}
      ${card('Next Scheduled Touchpoint',`<div class="metric-value" style="font-size:17px">Quarterly Performance Call</div><p class="muted small">31 Jul 2026 · 10:00 CAT</p>`,{footer:'<button type="button" class="card-link" data-action="open-calendar">View calendar</button>'})}
    </div></section>`;
  }

  function renderLPCommitmentsTab(lp) {
    const allocations=lpAllocations();
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Commitment workspace</strong><span>Fund allocations, legal terms, unfunded schedules, co-investments and concentration analysis.</span></div>${button('Add commitment','profile-lp-commitment','primary','plus')}</div>
      <section class="grid cols-3 section-gap">
        ${card('Commitment Allocation',donutChart(allocations,formatMoney(lp.commitment),'Committed',155),{subtitle:'Current legal commitments by fund'})}
        ${card('Called vs Unfunded',barChart({labels:allocations.map(a=>a.label.replace('Matanho ','')),series:[{name:'Called',color:'var(--blue)',values:[93,42,20]},{name:'Unfunded',color:'var(--amber)',values:[57,28,10]}],height:295,yLabel:'USD millions',stacked:true,format:v=>`${Math.round(v)}M`}),{subtitle:'Select a fund for commitment detail'})}
        ${card('Commitment Concentration',donutChart([{label:'Growth equity',value:60,color:'#2475f5',display:'60%'},{label:'Venture',value:28,color:'#0ba780',display:'28%'},{label:'Opportunity',value:12,color:'#f5a623',display:'12%'}],'3','Funds',150),{subtitle:'Strategy exposure'})}
      </section>
      ${card('Commitment Register',`<div class="table-wrap"><table><thead><tr><th>Fund</th><th>Vintage</th><th>Commitment Date</th><th class="text-right">Commitment</th><th class="text-right">Called</th><th class="text-right">Unfunded</th><th>Investment Period</th><th>Side Letter</th><th>Status</th></tr></thead><tbody>${[['Matanho Growth Fund II','2021','12 Feb 2021','$150.0M','$93.0M','$57.0M','Ends Dec 2026','Yes','Active'],['Matanho Venture Fund I','2023','18 Apr 2023','$70.0M','$42.0M','$28.0M','Ends Mar 2028','Yes','Active'],['Matanho Opportunity Fund','2024','7 Jun 2024','$30.0M','$20.0M','$10.0M','Ends Jun 2027','No','Active']].map(row=>`<tr class="clickable" data-action="chart-drilldown" data-chart-label="${row[0]}" data-chart-value="${row[3]} commitment"><td class="table-primary brand-text">${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td class="text-right">${row[3]}</td><td class="text-right">${row[4]}</td><td class="text-right">${row[5]}</td><td>${row[6]}</td><td>${row[7]}</td><td>${statusPill(row[8])}</td></tr>`).join('')}</tbody></table></div>`) }
      <section class="grid cols-2 section-gap">
        ${card('Unfunded Forecast',lineChart({labels:['Q3 2026','Q4 2026','Q1 2027','Q2 2027','Q3 2027','Q4 2027'],series:[{name:'Base case',color:'var(--blue)',values:[95,82,73,63,51,43]},{name:'High deployment',color:'var(--red)',values:[95,76,61,48,34,23]}],height:280,yLabel:'USD millions',format:v=>`${Math.round(v)}M`}),{subtitle:'Projected remaining commitment'})}
        ${card('Side Letter & Special Terms',`<div class="info-list">${[['Advisory Committee seat','Growth Fund II','Active'],['Most-favoured-nation rights','Growth Fund II / Venture Fund I','Active'],['ESG reporting appendix','All funds','Active'],['Excuse rights: tobacco and weapons','All funds','Active'],['Co-investment priority allocation','Opportunity Fund','In Review']].map(row=>`<button type="button" class="list-row" data-action="open-lp-documents"><span class="list-row-main"><strong>${row[0]}</strong><small>${row[1]}</small></span>${statusPill(row[2])}</button>`).join('')}</div>`) }
      </section>
    </section>`;
  }

  function renderLPCapitalTab(lp) {
    const activity=[['10 Jul 2026','Capital Call','Matanho Growth Fund II','$15.0M','Due 10 Aug 2026','Pending'],['3 Jul 2026','Distribution','Matanho Growth Fund II','$8.0M','Paid','Complete'],['26 Jun 2026','Capital Call','Matanho Venture Fund I','$5.0M','Paid 30 Jun','Complete'],['18 Jun 2026','Distribution','Matanho Opportunity Fund','$3.2M','Paid','Complete'],['5 Jun 2026','Capital Call','Matanho Growth Fund II','$10.0M','Paid 9 Jun','Complete'],['12 May 2026','Equalisation','Matanho Opportunity Fund','$1.1M','Processed','Complete']];
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Capital activity workspace</strong><span>Calls, distributions, payments, balances, reconciliations and upcoming liquidity requirements.</span></div>${button('Export statement','export-drilldown','primary','download')}</div>
      <section class="grid cols-3 section-gap">
        ${card('Capital Account Movement',lineChart({labels:['Jul 2025','Sep 2025','Nov 2025','Jan 2026','Mar 2026','May 2026','Jul 2026'],series:[{name:'Cumulative called',color:'var(--blue)',values:[102,112,120,130,140,150,155]},{name:'Cumulative distributed',color:'var(--emerald)',values:[44,48,53,60,66,70,78.4]}],height:300,yLabel:'USD millions',format:v=>`${Number(v).toFixed(0)}M`}),{subtitle:'Click any period for transaction detail'})}
        ${card('Activity Mix',donutChart([{label:'Capital calls',value:155,color:'#2475f5',display:'$155.0M'},{label:'Distributions',value:78.4,color:'#0ba780',display:'$78.4M'},{label:'Fees & expenses',value:12.7,color:'#f5a623',display:'$12.7M'}],formatMoney(246100000),'Total flows',155))}
        ${card('Upcoming Liquidity',barChart({labels:['Aug 2026','Sep 2026','Oct 2026','Nov 2026','Dec 2026'],series:[{name:'Expected calls',color:'var(--blue)',values:[15,0,12,6,8]},{name:'Expected distributions',color:'var(--emerald)',values:[0,4,0,7,3]}],height:300,yLabel:'USD millions',format:v=>`${Math.round(v)}M`}),{subtitle:'Forecast by month'})}
      </section>
      ${card('Transaction Ledger',`<div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Fund</th><th class="text-right">Amount</th><th>Settlement</th><th>Status</th><th>Reference</th><th></th></tr></thead><tbody>${activity.map((row,index)=>`<tr class="clickable" data-action="${row[1]==='Capital Call'?'open-capital-call':'open-interaction'}" ${row[1]==='Capital Call'?`data-id="${capitalCalls[index%capitalCalls.length].id}"`:''}><td>${row[0]}</td><td class="table-primary">${row[1]}</td><td>${row[2]}</td><td class="text-right">${row[3]}</td><td>${row[4]}</td><td>${statusPill(row[5])}</td><td>TXN-2026-${String(442-index).padStart(4,'0')}</td><td><button type="button" class="button ghost compact icon-only" data-action="open-interaction">${icon('chevron-right')}</button></td></tr>`).join('')}</tbody></table></div>`) }
      <section class="grid cols-2 section-gap">
        ${card('Payment & Reconciliation',`<div class="info-list">${[['Last payment received','30 Jun 2026','$5.0M'],['Bank account','CBZ Bank · **** 4821','Verified'],['Unreconciled receipts','0','$0'],['Withholding tax documents','Current','Complete'],['Capital account balance','31 Jul 2026','$171.2M']].map(row=>`<div class="info-row"><span>${row[0]}</span><strong>${row[1]} · ${row[2]}</strong></div>`).join('')}</div>`) }
        ${card('Collection Timeliness',barChart({labels:['Call 01','Call 02','Call 03','Call 04','Call 05','Call 06'],series:[{name:'Days before due date',color:'var(--emerald)',values:[8,5,12,3,7,10]}],height:260,yLabel:'Days',format:v=>`${Math.round(v)} days`}),{subtitle:'Historic payment timing'})}
      </section>
    </section>`;
  }

  function renderLPPerformanceTab(lp) {
    const allocations=lpAllocations();
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>LP performance workspace</strong><span>Fund returns, cash-flow performance, attribution and public-market-equivalent comparisons.</span></div>${button('Generate performance report','generate-report','primary','file-chart')}</div>
      <section class="grid cols-3 section-gap">
        ${card('Net IRR Trend',lineChart({labels:['Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'LP Net IRR',color:'var(--blue)',values:[7.1,8.4,9.3,10.1,11.0,11.9,12.8,13.6,14.2]},{name:'Private markets benchmark',color:'var(--emerald)',values:[6.2,7.1,7.8,8.5,9.2,9.8,10.5,11.1,11.8]}],height:300,yLabel:'Net IRR %',format:v=>`${Number(v).toFixed(1)}%`}),{subtitle:'Weighted LP portfolio return'})}
        ${card('TVPI & DPI Progression',lineChart({labels:['Q2 2024','Q4 2024','Q2 2025','Q4 2025','Q2 2026'],series:[{name:'TVPI',color:'var(--brand)',values:[1.18,1.29,1.43,1.62,1.84]},{name:'DPI',color:'var(--emerald)',values:[.08,.13,.19,.25,.31]}],height:300,yLabel:'Multiple (x)',format:v=>`${Number(v).toFixed(2)}x`}),{subtitle:'Value and realised multiple'})}
        ${card('Return Attribution',donutChart([{label:'Growth Fund II',value:57,color:'#2475f5',display:'57%'},{label:'Venture Fund I',value:29,color:'#0ba780',display:'29%'},{label:'Opportunity Fund',value:14,color:'#f5a623',display:'14%'}],pct(lp.netIrr),'Net IRR',155),{subtitle:'Contribution to weighted return'})}
      </section>
      ${card('Performance by Fund',`<div class="table-wrap"><table><thead><tr><th>Fund</th><th>Vintage</th><th class="text-right">Commitment</th><th class="text-right">NAV</th><th class="text-right">Distributed</th><th class="text-right">Net IRR</th><th class="text-right">TVPI</th><th class="text-right">DPI</th><th class="text-right">PME</th><th>Quartile</th></tr></thead><tbody>${allocations.map((a,index)=>`<tr class="clickable" data-action="chart-drilldown" data-chart-label="${a.label}" data-chart-value="LP fund performance"><td class="table-primary brand-text">${a.label}</td><td>${[2021,2023,2024][index]}</td><td class="text-right">${formatMoney(a.value*1000000)}</td><td class="text-right">${['$129.5M','$58.4M','$22.6M'][index]}</td><td class="text-right">${['$56.0M','$18.2M','$4.2M'][index]}</td><td class="text-right positive">${[16.4,11.6,8.4][index]}%</td><td class="text-right">${[1.85,1.61,1.21][index]}x</td><td class="text-right">${[.60,.43,.21][index]}x</td><td class="text-right">${[1.24,1.08,.91][index]}x</td><td>${statusPill(['Top','Second','Third'][index]+' Quartile')}</td></tr>`).join('')}</tbody></table></div>`) }
      <section class="grid cols-2 section-gap">
        ${card('Net Cash Flow',barChart({labels:['Q3 2025','Q4 2025','Q1 2026','Q2 2026','Q3 2026E','Q4 2026E'],series:[{name:'Contributions',color:'var(--blue)',values:[18,12,20,30,15,20]},{name:'Distributions',color:'var(--emerald)',values:[7,14,8,16,4,10]}],height:285,yLabel:'USD millions',format:v=>`${Math.round(v)}M`}),{subtitle:'Calls and distributions by quarter'})}
        ${card('Benchmark Comparison',barChart({labels:['Net IRR','TVPI','DPI','PME'],series:[{name:'LP Portfolio',color:'var(--brand)',values:[14.2,1.84,.31,1.16]},{name:'Peer Median',color:'var(--emerald)',values:[11.8,1.55,.27,1.00]}],height:285,format:v=>Number(v).toFixed(2)}),{subtitle:'Performance relative to peer median'})}
      </section>
    </section>`;
  }

  function renderLPDocumentsTab(lp) {
    const rows=[['Limited Partnership Agreement','Legal','v3.0','12 Feb 2021','Executed','Internal / LP'],['Side Letter','Legal','v2.1','18 Feb 2021','Executed','Restricted'],['KYC Annual Review 2025','KYC','v1.0','25 Jul 2025','Verified','Internal'],['Beneficial Ownership Declaration','KYC','v1.2','2 Jul 2026','In Review','Internal / LP'],['Audited Financial Statements 2024','Financial','v1.0','18 Jul 2026','Outstanding','Internal / LP'],['Tax Residence Certificate','Tax','v1.1','5 Jun 2026','Verified','Internal'],['Capital Account Statement Q2 2026','Reporting','v1.0','7 Jul 2026','Delivered','LP Portal'],['Investor Update Q2 2026','Reporting','v1.0','7 Jul 2026','Acknowledged','LP Portal']];
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>LP document and KYC workspace</strong><span>Legal agreements, KYC evidence, acknowledgements, statements and document requests.</span></div><div class="page-actions">${button('Request document','profile-lp-request','','send')}${button('Upload document','profile-lp-upload','primary','upload')}</div></div>
      <section class="grid cols-4 section-gap">
        ${metricCard({label:'Documents',value:'28',iconName:'file',accent:'blue',foot:'All legal and investor files',action:'lp-documents'})}
        ${metricCard({label:'KYC Status',value:'Verified',iconName:'user-check',accent:'emerald',foot:'Annual review due 25 Jul',action:'lp-kyc'})}
        ${metricCard({label:'Outstanding',value:'2',iconName:'alert',accent:'amber',foot:'Both due this month',action:'lp-documents-outstanding'})}
        ${metricCard({label:'Acknowledgements',value:'96%',iconName:'check-circle',accent:'purple',foot:'Portal delivery acceptance',action:'lp-acknowledgements'})}
      </section>
      ${card('Document Register',`<div class="table-toolbar"><div class="table-search">${icon('search')}<input type="text" placeholder="Search LP documents..."></div><div class="table-tools">${button('Filter','lp-filters','compact','filter')}${button('Export index','export-lps','compact','download')}</div></div><div class="table-wrap"><table><thead><tr><th>Document</th><th>Category</th><th>Version</th><th>Date</th><th>Status</th><th>Access</th><th>Acknowledgement</th><th></th></tr></thead><tbody>${rows.map((row,index)=>`<tr class="clickable" data-action="preview-document" data-id="${documentIdForName(row[0])}"><td class="table-primary"><button type="button" class="v17-document-name" data-action="preview-document" data-id="${documentIdForName(row[0])}">${icon('file')}<span>${row[0]}</span></button></td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${statusPill(row[4])}</td><td>${row[5]}</td><td>${index<3?'Executed':index===4?'Pending':'Recorded'}</td><td><div class="document-row-actions"><button type="button" class="button ghost compact icon-only" data-action="preview-document" data-id="${documentIdForName(row[0])}">${icon('eye')}</button><button type="button" class="button ghost compact icon-only" data-action="download-document" data-id="${documentIdForName(row[0])}">${icon('download')}</button></div></td></tr>`).join('')}</tbody></table></div>`) }
      <section class="grid cols-2 section-gap">
        ${card('KYC Review Checklist',`<div class="reason-list">${[['Identity and legal form','Complete'],['Beneficial ownership','In Review'],['Source of funds','Complete'],['Sanctions and PEP screening','Complete'],['Tax residence','Complete'],['Investment authority','Complete'],['Annual financial statements','Outstanding']].map(row=>`<button type="button" class="reason-item" data-action="open-kyc">${icon(row[1]==='Complete'?'check-circle':'clock')}<div><strong>${row[0]}</strong><small>${row[1]}</small></div></button>`).join('')}</div>`) }
        ${card('Open Requests',`<div class="info-list">${[['Audited Financial Statements 2024','18 Jul 2026','5 days'],['Beneficial Ownership Declaration','25 Jul 2026','12 days']].map(row=>`<button type="button" class="list-row" data-action="open-lp-documents"><span class="list-row-main"><strong>${row[0]}</strong><small>Due ${row[1]}</small></span>${statusPill(row[2],'warning')}</button>`).join('')}</div>`) }
      </section>
    </section>`;
  }

  function renderLPCommunicationsTab(lp) {
    const communications=[['7 Jul 2026','Investor Update','Q2 2026 Portfolio Update','Secure email + portal','Opened','Maya Moyo'],['1 Jul 2026','Capital Call Notice','CC-2026-0038 · Growth Fund II','LP Portal','Acknowledged','Fund Administration'],['25 Jun 2026','Email','AGF II valuation update','Secure email','Opened','Maya Moyo'],['12 Jun 2026','Report','ESG & Impact Report 2025','LP Portal','Downloaded','James Mbewe'],['5 Jun 2026','Call','Upcoming capital activity and liquidity planning','Telephone','Complete','Maya Moyo']];
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>Investor communications workspace</strong><span>Contacts, interactions, secure communications, acknowledgements and follow-up scheduling.</span></div><div class="page-actions">${button('Add interaction','add-interaction','','plus')}${button('Send communication','new-communication','primary','mail')}</div></div>
      <section class="grid cols-3 section-gap">
        ${card('Engagement Trend',barChart({labels:['Feb','Mar','Apr','May','Jun','Jul'],series:[{name:'Emails & portal',color:'var(--blue)',values:[4,6,5,8,7,10]},{name:'Calls & meetings',color:'var(--emerald)',values:[2,2,3,2,4,3]}],height:290,yLabel:'Interactions',stacked:true,format:v=>Math.round(v)}),{subtitle:'Recorded investor touchpoints'})}
        ${card('Communication Outcomes',donutChart([{label:'Opened',value:17,color:'#2475f5',display:'17'},{label:'Acknowledged',value:8,color:'#0ba780',display:'8'},{label:'Downloaded',value:6,color:'#60a5fa',display:'6'},{label:'Pending',value:2,color:'#f5a623',display:'2'}],'33','Messages',150))}
        ${card('Relationship Coverage',`<div class="info-list">${[['Primary owner',lp.owner,'Active'],['Executive sponsor','Tariro Kasere','Active'],['Investor relations','James Mbewe','Active'],['Fund administration','Sarah Mitchell','Active'],['Next touchpoint','31 Jul 2026','Scheduled']].map(row=>`<div class="info-row"><span>${row[0]}</span><strong>${row[1]} · ${row[2]}</strong></div>`).join('')}</div>`) }
      </section>
      ${card('Communication & Interaction Log',`<div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Subject / Summary</th><th>Channel</th><th>Outcome</th><th>Owner</th><th>Follow-up</th><th></th></tr></thead><tbody>${communications.map((row,index)=>`<tr class="clickable" data-action="open-interaction"><td>${row[0]}</td><td>${row[1]}</td><td class="table-primary">${row[2]}</td><td>${row[3]}</td><td>${statusPill(row[4])}</td><td>${row[5]}</td><td>${index===0?'31 Jul 2026':index===4?'Complete':'None'}</td><td><button type="button" class="button ghost compact icon-only" data-action="open-interaction">${icon('chevron-right')}</button></td></tr>`).join('')}</tbody></table></div>`) }
      <section class="grid cols-2 section-gap">
        ${card('Contact Directory',`<div class="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Preference</th><th></th></tr></thead><tbody>${[['Tendai Moyo','Chief Investment Officer','tendai.moyo@zpf.co.zw','+263 24 2 303 650','Email + phone'],['Chipo Nyoni','Head of Private Markets','chipo.nyoni@zpf.co.zw','+263 24 2 303 651','Secure portal'],['Farai Dube','Investment Manager','farai.dube@zpf.co.zw','+263 24 2 303 652','Email']].map(row=>`<tr><td class="table-primary">${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td><div class="document-row-actions"><button type="button" class="button ghost compact icon-only" data-action="email-contact">${icon('mail')}</button><button type="button" class="button ghost compact icon-only" data-action="call-contact">${icon('phone')}</button></div></td></tr>`).join('')}</tbody></table></div>`) }
        ${card('Scheduled Touchpoints',`<div class="info-list">${[['Quarterly performance call','31 Jul 2026 · 10:00 CAT','Scheduled'],['Annual strategy meeting','18 Sep 2026 · Harare','Scheduled'],['AGM and investor conference','12 Nov 2026 · Victoria Falls','Draft']].map(row=>`<button type="button" class="list-row" data-action="open-calendar"><span class="list-row-main"><strong>${row[0]}</strong><small>${row[1]}</small></span>${statusPill(row[2])}</button>`).join('')}</div>`) }
      </section>
    </section>`;
  }

  function renderLPPortalTab(lp) {
    return `<section class="profile-tab-panel section-gap">
      <div class="profile-tab-summary"><div><strong>LP portal access workspace</strong><span>Users, permissions, sessions, authentication, document entitlements and access audit.</span></div>${button('Invite user','manage-lp-access','primary','plus')}</div>
      <section class="grid cols-4 section-gap">
        ${metricCard({label:'Portal Status',value:'Active',iconName:'shield',accent:'emerald',foot:'No service restrictions',action:'lp-portal-status'})}
        ${metricCard({label:'Active Users',value:'4',iconName:'users',accent:'blue',foot:'2 viewers · 2 editors',action:'lp-portal-users'})}
        ${metricCard({label:'MFA Coverage',value:'100%',iconName:'lock',accent:'purple',foot:'All active accounts',action:'lp-portal-mfa'})}
        ${metricCard({label:'Last Login',value:'3 Jul',iconName:'clock',accent:'amber',foot:'Tendai Moyo · Harare',action:'lp-portal-login'})}
      </section>
      ${card('Portal Users',`<div class="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Email</th><th>Funds</th><th>MFA</th><th>Last Login</th><th>Status</th><th></th></tr></thead><tbody>${[['Tendai Moyo','Administrator','tendai.moyo@zpf.co.zw','All committed funds','Enabled','3 Jul 2026 · 08:42','Active'],['Chipo Nyoni','Editor','chipo.nyoni@zpf.co.zw','All committed funds','Enabled','2 Jul 2026 · 16:18','Active'],['Farai Dube','Viewer','farai.dube@zpf.co.zw','Growth Fund II','Enabled','28 Jun 2026 · 11:06','Active'],['Rutendo Ndlovu','Viewer','rutendo.ndlovu@zpf.co.zw','Venture Fund I','Enabled','17 Jun 2026 · 14:35','Active']].map(row=>`<tr class="clickable" data-action="manage-lp-access"><td class="table-primary">${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${statusPill(row[4])}</td><td>${row[5]}</td><td>${statusPill(row[6])}</td><td><button type="button" class="button ghost compact icon-only" data-action="activity-menu" data-context="lp" data-id="${lp.id}" aria-label="Portal user activity">${icon('clock')}</button></td></tr>`).join('')}</tbody></table></div>`) }
      <section class="grid cols-2 section-gap">
        ${card('Permission Matrix',`<div class="table-wrap"><table class="permission-matrix"><thead><tr><th>Capability</th><th>Administrator</th><th>Editor</th><th>Viewer</th></tr></thead><tbody>${[['View fund performance','✓','✓','✓'],['Download reports','✓','✓','✓'],['Acknowledge notices','✓','✓','—'],['Manage users','✓','—','—'],['Update contact details','✓','✓','—'],['View KYC records','✓','✓','—'],['Upload documents','✓','✓','—']].map(row=>`<tr>${row.map((cell,i)=>`<td class="${i===0?'table-primary':''}">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,{footer:'<button type="button" class="card-link" data-action="manage-lp-access">Edit permission policy</button>'})}
        ${card('Security & Session Controls',`<div class="info-list">${[['Multi-factor authentication','Required','Enabled'],['Session timeout','30 minutes','Configured'],['IP anomaly detection','Enabled','Passed'],['Download watermarking','Enabled','Active'],['Audit logging','Immutable','Active'],['Last access review','30 Jun 2026','Complete']].map(row=>`<div class="list-row"><span class="list-row-main"><strong>${row[0]}</strong><small>${row[1]}</small></span>${statusPill(row[2])}</div>`).join('')}</div>`,{footer:'<button type="button" class="card-link" data-action="security-settings">Open security settings</button>'})}
      </section>
      ${card('Access Audit',`<div class="table-wrap"><table><thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>Device / Location</th><th>Result</th></tr></thead><tbody>${[['3 Jul 2026 · 08:42','Tendai Moyo','Signed in','LP Portal','Chrome · Harare','Success'],['3 Jul 2026 · 08:47','Tendai Moyo','Downloaded','Q2 Investor Update','Chrome · Harare','Success'],['2 Jul 2026 · 16:18','Chipo Nyoni','Acknowledged','Capital Call CC-2026-0038','Safari · Harare','Success'],['28 Jun 2026 · 11:06','Farai Dube','Viewed','Growth Fund II performance','Edge · Bulawayo','Success']].map(row=>`<tr><td>${row[0]}</td><td class="table-primary">${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td>${statusPill(row[5])}</td></tr>`).join('')}</tbody></table></div>`) }
    </section>`;
  }

  function renderLPDetail() {
    const lp = lps.find(item=>item.id===state.selectedLPId) || lps[0];
    const tabs=[['overview','Overview'],['commitments','Commitments'],['capital','Capital Activity'],['performance','Performance'],['documents','Documents'],['communications','Communications'],['portal','Portal Access']];
    const content = state.lpTab==='commitments' ? renderLPCommitmentsTab(lp)
      : state.lpTab==='capital' ? renderLPCapitalTab(lp)
      : state.lpTab==='performance' ? renderLPPerformanceTab(lp)
      : state.lpTab==='documents' ? renderLPDocumentsTab(lp)
      : state.lpTab==='communications' ? renderLPCommunicationsTab(lp)
      : state.lpTab==='portal' ? renderLPPortalTab(lp)
      : renderLPOverviewTab(lp);
    return `${pageHeader(lp.name,`${lp.type} · ${lp.geography} · Verified KYC · Active portal`,`${button('Send communication','new-communication','','mail')}${button('Add interaction','add-interaction','','plus')}${button('Activity','activity-menu','','clock',`data-context="lp" data-id="${lp.id}"`)}`,'Limited Partner')}
      <section class="detail-hero"><div class="detail-hero-top"><div class="entity-title"><span class="entity-logo" style="background:${lp.color}">${escapeHTML(initials(lp.name))}</span><div><h1>${escapeHTML(lp.name)}</h1><p>${escapeHTML(lp.type)} · ${escapeHTML(lp.geography)} · Relationship owner: ${escapeHTML(lp.owner)}</p></div></div>${statusPill('Active portal','success')}</div></section>
      ${lpProfileMetrics(lp)}
      ${profileTabs(tabs,state.lpTab,'lp-profile-tab')}
      ${content}`;
  }

  function renderCapitalCallDetail() {
    const call = capitalCalls.find(item=>item.id===state.selectedCapitalCallId) || capitalCalls[0];
    const lpAllocation = lps.map(lp=>({lp,amount:call.amount*(lp.commitment/sum(lps,x=>x.commitment))}));
    return `${pageHeader(`Capital Call ${call.id}`,`${call.fund} · Draft · Call date ${call.callDate} · Due ${call.dueDate} · ${call.lpCount} LPs`,`${button('Preview notice','preview-capital-call','','eye')}${button('Submit for approval','submit-capital-call-approval','primary','send')}${button('Activity','activity-menu','','clock',`data-context="capital-call" data-id="${call.id}"`)}`,'Capital Call Notice')}
      <div class="stepper">${[['Draft','Complete'],['Allocation','Complete'],['Legal review','Complete'],['Finance review','In progress'],['Authorisation','Pending'],['Issuance','Locked']].map((s,i)=>`<div class="step ${i<3?'complete':i===3?'current':''}"><span class="step-index">${i<3?icon('check'):i+1}</span><span class="step-copy"><strong>${s[0]}</strong><small>${s[1]}</small></span></div>`).join('')}</div>
      <section class="grid" style="grid-template-columns:240px minmax(0,1fr) 300px;gap:12px"><div class="side-stack" style="display:flex">
        ${card('Call Purpose Allocation',`<div class="info-list"><div class="info-row"><span>Follow-on Investments</span><strong>$30.0M · 70.6%</strong></div><div class="info-row"><span>Management Fees</span><strong>$7.5M · 17.6%</strong></div><div class="info-row"><span>Fund Expenses</span><strong>$5.0M · 11.8%</strong></div><div class="info-row"><span>Total</span><strong>${formatMoney(call.amount)} · 100%</strong></div></div><div class="reason-item warning section-gap">${icon('info')}<div><small>Cash is required by ${call.dueDate} to ensure investments are funded on time.</small></div></div>`) }
        ${card('Notice Terms',`<div class="info-list"><div class="info-row"><span>Notice Period</span><strong>30 days</strong></div><div class="info-row"><span>Call Date</span><strong>${call.callDate}</strong></div><div class="info-row"><span>Due Date</span><strong>${call.dueDate}</strong></div><div class="info-row"><span>Reference</span><strong>${call.id}</strong></div></div>`) }
        ${card('Bank Instructions',`<div class="info-list"><div class="info-row"><span>Bank Name</span><strong>CBZ Bank</strong></div><div class="info-row"><span>Account Name</span><strong>${escapeHTML(call.fund)}</strong></div><div class="info-row"><span>Account Number</span><strong>••••••••5678</strong></div><div class="info-row"><span>SWIFT / BIC</span><strong>CIBIUS33</strong></div></div>`,{footer:'<button class="card-link" data-action="view-bank-details">View full bank details</button>'})}
        ${card('Supporting Documents',`<div class="info-list"><div class="list-row"><span class="activity-icon" style="color:var(--emerald);background:var(--emerald-soft)">${icon('file')}</span><span class="list-row-main"><strong>Call Allocation Summary.xlsx</strong></span></div><div class="list-row"><span class="activity-icon" style="color:var(--red);background:var(--red-soft)">${icon('file')}</span><span class="list-row-main"><strong>Investment Plan Update.pdf</strong></span></div><div class="list-row"><span class="activity-icon" style="color:var(--red);background:var(--red-soft)">${icon('file')}</span><span class="list-row-main"><strong>Capital Call Memorandum.pdf</strong></span></div></div>`,{footer:'<button class="card-link" data-action="deal-tab" data-tab="documents">View all documents</button>'})}
      </div><div>
        ${card('LP Allocation',`<div class="table-wrap"><table><thead><tr><th>LP Name</th><th class="text-right">Commitment</th><th class="text-right">Unfunded</th><th>Allocation Basis</th><th class="text-right">Call Amount</th><th class="text-right">% of Call</th><th>Delivery Channel</th><th>Validation</th></tr></thead><tbody>${lpAllocation.map(({lp,amount})=>`<tr><td class="table-primary">${escapeHTML(lp.name)}</td><td class="text-right">${formatMoney(lp.commitment)}</td><td class="text-right">${formatMoney(lp.unfunded)}</td><td>Commitment</td><td class="text-right">${formatMoney(amount)}</td><td class="text-right">${pct(amount/call.amount*100)}</td><td>${lp.portal==='Active'?'Portal':'Email'}</td><td>${statusPill('Passed','success')}</td></tr>`).join('')}<tr><td class="table-primary">Total</td><td class="text-right table-primary">${formatMoney(sum(lps,l=>l.commitment))}</td><td class="text-right table-primary">${formatMoney(sum(lps,l=>l.unfunded))}</td><td></td><td class="text-right table-primary">${formatMoney(call.amount)}</td><td class="text-right table-primary">100.0%</td><td></td><td></td></tr></tbody></table></div>`,{tools:button('Export','export-call-allocation','compact','download')})}
        <section class="grid cols-2 section-gap">
          ${card('Generated Documents',`<div class="info-list">${[['Capital Call Notice','Notice to Limited Partners'],['Allocation Schedule','LP allocation details'],['Payment Instructions','Banking details and instructions'],['Cover Letter','Transmittal cover letter']].map(item=>`<div class="list-row"><span class="list-row-main"><strong>${item[0]}</strong><small>${item[1]}</small></span>${statusPill('Generated','success')}<button class="button ghost compact icon-only" data-action="download-document">${icon('download')}</button></div>`).join('')}</div>`,{footer:'<button class="card-link" data-action="download-call-pack">Download all documents (.zip)</button>'})}
          ${card('Notification Preview',`<div class="info-list"><div class="info-row"><span>Recipients</span><strong>${call.lpCount} LP recipients</strong></div><div class="info-row"><span>Subject</span><strong>Capital Call ${call.id} - ${escapeHTML(call.fund)}</strong></div></div><p class="muted small" style="line-height:1.65">Dear Limited Partner,<br><br>Please find attached the capital call notice ${call.id} for ${escapeHTML(call.fund)}, with a due date of ${call.dueDate}. Please contact the fund administrator with questions.<br><br>Kind regards,<br>Matanho Fund Administration</p>`,{footer:'<button class="card-link" data-action="preview-capital-call">Preview full notice</button>'})}
        </section>
      </div><div class="side-stack" style="display:flex">
        ${card('Approval Routing',`<div class="timeline"><div class="timeline-item"><strong>Jason Patel · Finance</strong><small class="brand-text">In progress</small></div><div class="timeline-item"><strong>Priya Shah · Controller</strong><small>Pending</small></div><div class="timeline-item"><strong>Michael Roberts · CFO</strong><small>Pending</small></div><div class="timeline-item"><strong>Kevin White · Managing Partner</strong><small>Pending</small></div></div>`) }
        ${card('Validation Checks',`<div style="margin-bottom:9px">${statusPill('12 / 12 Passed','success')}</div><div class="reason-list"><div class="reason-item">${icon('check-circle')}<div><strong>Allocation totals</strong></div></div><div class="reason-item">${icon('check-circle')}<div><strong>LP eligibility</strong></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Committed amount limits</strong></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Bank details</strong></div></div></div>`,{footer:'<button class="card-link" data-action="open-validations">View all checks</button>'})}
        ${card('Notice Period Compliance',`<div class="metric-value" style="font-size:17px">30 days</div><div class="info-list"><div class="info-row"><span>Call Date</span><strong>${call.callDate}</strong></div><div class="info-row"><span>Due Date</span><strong>${call.dueDate}</strong></div></div>`,{footer:statusPill('Compliant','success')})}
        ${card('Authorised Signatories',`<div class="info-list"><div class="info-row"><span>Michael Roberts<br><small>CFO</small></span><strong style="font-family:cursive;color:var(--blue);font-size:18px">M Roberts</strong></div><div class="info-row"><span>Kevin White<br><small>Managing Partner</small></span><strong style="font-family:cursive;color:var(--blue);font-size:18px">K White</strong></div></div>`) }
        ${card('Delivery Summary',`<div class="info-list"><div class="info-row"><span>Portal</span><strong>26 LPs (68.4%)</strong></div><div class="info-row"><span>Email</span><strong>12 LPs (31.6%)</strong></div><div class="info-row"><span>Total Recipients</span><strong>${call.lpCount}</strong></div></div>`) }
      </div></section>`;
  }

  function renderReportBuilder() {
    const outline = [
      ['Executive Summary','Complete'],['Fund Performance','Complete'],['Portfolio Review','Complete'],['Capital Activity','Complete'],['Valuation','Attention'],['ESG & Impact','Complete'],['Financial Statements','Complete'],['LP Appendix','Attention']
    ];
    return `${pageHeader('Q2 2026 Fund Report Pack','Build, review and publish a comprehensive quarterly report for LPs.',`${statusPill('Auto-linked data as of 30 Jun 2026','success')}${statusPill('2 issues','danger')}${button('Preview','preview-report','','eye')}${button('Request review','request-report-review','','users')}${button('Schedule','schedule-report','','calendar')}${button('Publish','publish-report','primary','upload')}`,'Report Builder')}
      <section class="report-builder">
        <div class="report-outline"><div class="card-head"><div><h3 class="card-title">Report Outline</h3><div class="card-subtitle">Drag to reorder sections</div></div>${button('Add section','add-report-section','compact','plus')}</div><div>${outline.map((item,index)=>`<div class="outline-item ${state.reportSection===index+1?'brand-text':''}" data-action="select-report-section" data-section="${index+1}"><span class="drag">${icon('drag')}</span><span class="risk-score ${item[1]==='Complete'?'good':'medium'}">${index+1}</span><strong>${item[0]}</strong>${item[1]==='Complete'?icon('check-circle'):icon('alert')}<button class="button ghost compact icon-only" data-action="activity-menu" data-context="report" data-id="section-${index+1}" aria-label="Report section activity">${icon('clock')}</button></div>`).join('')}</div><div class="card-footer">${button('Add page','add-report-page','compact','plus')}${button('Refresh data','refresh-report-data','compact','refresh')}</div><div class="inspector-section"><h4>Report Details</h4><div class="info-list"><div class="info-row"><span>Fund</span><strong>Matanho Growth Fund II</strong></div><div class="info-row"><span>Report period</span><strong>1 Apr - 30 Jun 2026</strong></div><div class="info-row"><span>Currency</span><strong>USD</strong></div><div class="info-row"><span>LPs</span><strong>12</strong></div><div class="info-row"><span>Status</span><strong>${statusPill('In progress','info')}</strong></div></div></div></div>
        <div class="editor-shell"><div class="editor-toolbar"><button class="editor-tool" data-action="editor-heading">H2</button><button class="editor-tool" data-action="editor-heading">H3</button><button class="editor-tool" data-action="editor-bold">${icon('bold')}</button><button class="editor-tool" data-action="editor-italic">${icon('italic')}</button><button class="editor-tool" data-action="editor-list">${icon('list')}</button><button class="editor-tool" data-action="editor-link">${icon('link')}</button><button class="editor-tool" data-action="editor-image">${icon('upload')}</button><button class="editor-tool" data-action="editor-maximize">${icon('maximize')}</button><span style="margin-left:auto" class="muted small">Page 2 of 8 · Word count: 812</span></div><article class="editor-content" contenteditable="true" spellcheck="true"><h2>2. Fund Performance</h2><section class="grid cols-3"><div><span class="muted small">Net IRR</span><div class="metric-value">18.7%</div><div class="positive small">↑ 1.6% vs 31 Mar 2026</div></div><div><span class="muted small">TVPI</span><div class="metric-value">2.18x</div><div class="positive small">↑ 0.14x vs 31 Mar 2026</div></div><div>${lineChart({labels:['Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'Net Cash Flow',color:'var(--blue)',values:[0,-48,-68,-8,42]}],height:160,format:v=>`${Math.round(v)}M`})}</div></section><section class="grid cols-2 section-gap"><div>${barChart({labels:['Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'Contributions',color:'var(--blue)',values:[62,79,88,94,105]},{name:'Distributions',color:'var(--emerald)',values:[18,52,24,68,37]},{name:'Net Cash Flow',color:'var(--navy)',values:[44,27,64,26,68]}],height:180,format:v=>`${Math.round(v)}M`})}</div><div><h3>Performance commentary</h3><p>Matanho Growth Fund II delivered a Net IRR of 18.7% and a TVPI of 2.18x as at 30 June 2026. Strong realisations from GreenOrbit Energy and Mukuru Logistics drove positive net cash flows of USD 42.1M this quarter.</p><p>Market conditions remain supportive, with continued operational improvement across the portfolio. The team remains focused on executing value-creation plans and maintaining disciplined capital deployment.</p></div></section><div class="table-wrap section-gap"><table class="criteria-table"><thead><tr><th>Metric</th><th>Q2 2026</th><th>Q1 2026</th><th>Q4 2025</th><th>Q3 2025</th><th>Q2 2025</th><th>Since Inception</th></tr></thead><tbody><tr><td class="table-primary">Net IRR</td><td>18.7%</td><td>17.1%</td><td>15.2%</td><td>12.8%</td><td>9.6%</td><td>18.7%</td></tr><tr><td class="table-primary">TVPI</td><td>2.18x</td><td>2.02x</td><td>1.84x</td><td>1.63x</td><td>1.42x</td><td>2.18x</td></tr><tr><td class="table-primary">DPI</td><td>0.62x</td><td>0.56x</td><td>0.48x</td><td>0.37x</td><td>0.28x</td><td>0.62x</td></tr><tr><td class="table-primary">Net Cash Flow</td><td>$42.1M</td><td>$18.3M</td><td>-$15.8M</td><td>-$46.4M</td><td>-$10.2M</td><td>$42.1M</td></tr></tbody></table></div></article></div>
        <div class="report-inspector"><div class="inspector-tabs">${['data','commentary','review','distribution'].map(tab=>`<button class="inspector-tab ${state.reportBuilderTab===tab?'active':''}" data-action="report-inspector-tab" data-tab="${tab}">${tab[0].toUpperCase()+tab.slice(1)}</button>`).join('')}</div>${renderReportInspector()}</div>
      </section>`;
  }

  function renderReportInspector() {
    if (state.reportBuilderTab === 'commentary') return `<div class="inspector-section"><h4>Commentary Guidance</h4><div class="reason-list"><div class="reason-item warning">${icon('sparkles')}<div><strong>AI draft suggestion</strong><small>Explain the 1.6pp Net IRR increase and the two primary value drivers.</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Tone</strong><small>Institutional, concise and evidence-based.</small></div></div></div></div><div class="inspector-section"><h4>Draft Notes</h4><textarea style="width:100%">Highlight GreenOrbit realisation and Mukuru Logistics operational improvements.</textarea>${button('Apply suggestion','apply-commentary','primary compact','sparkles')}</div>`;
    if (state.reportBuilderTab === 'review') return `<div class="inspector-section"><h4>Comments</h4><div class="list-row">${avatar('Tendai Sibanda',1)}<span class="list-row-main"><strong>Tendai Sibanda · 2 hours ago</strong><small>Please update the Nyasha Foods valuation before sending this for review.</small></span></div><textarea style="width:100%;margin-top:10px" placeholder="Add a comment..."></textarea>${button('Comment','add-report-comment','compact','send')}</div><div class="inspector-section"><h4>Approval Path</h4><div class="timeline"><div class="timeline-item"><strong>Prepared by Tariro Ncube</strong><small>8 Jul 2026 · 09:15</small></div><div class="timeline-item"><strong>Reviewed by Rudo Moyo</strong><small>Pending</small></div><div class="timeline-item"><strong>Approved by Investment Committee</strong><small>Pending</small></div></div></div>`;
    if (state.reportBuilderTab === 'distribution') return `<div class="inspector-section"><h4>Distribution</h4><div class="form-field"><label>Recipients</label><select><option>All 12 LPs</option><option>Selected LPs</option></select></div><div class="form-field section-gap"><label>Channels</label><label class="checkbox-row"><input type="checkbox" checked> LP Portal</label><label class="checkbox-row"><input type="checkbox" checked> Secure Email</label></div><div class="form-field section-gap"><label>Publish date</label><input type="date" value="2026-07-16"></div>${button('Schedule distribution','schedule-distribution','primary','calendar')}</div>`;
    return `<div class="inspector-section"><h4>Data status</h4><div class="info-row"><span>All figures auto-linked</span>${statusPill('Up to date','success')}</div><div class="info-row section-gap"><span>As of</span><strong>30 Jun 2026</strong></div>${button('Refresh data','refresh-report-data','compact','refresh')}</div><div class="inspector-section"><h4>Validation</h4><div style="margin-bottom:9px">${statusPill('2 unresolved','danger')}</div><div class="reason-list"><div class="reason-item warning">${icon('alert')}<div><strong>Valuation</strong><small>Nyasha Foods valuation older than 90 days.</small></div></div><div class="reason-item warning">${icon('alert')}<div><strong>ESG</strong><small>Missing impact metrics for Mukuru Logistics.</small></div></div></div></div><div class="inspector-section"><h4>Approval Path</h4><div class="timeline"><div class="timeline-item"><strong>Prepared by Tariro Ncube</strong><small>8 Jul 2026 · 09:15</small></div><div class="timeline-item"><strong>Reviewed by Rudo Moyo</strong><small>Pending</small></div><div class="timeline-item"><strong>Approved by Investment Committee</strong><small>Pending</small></div></div></div>`;
  }

  function renderApplicantPortal() {
    const steps = ['Company Information','Ownership & Governance','Business & Market','Financial Information','Funding Request','Impact & ESG','Declarations & Consent'];
    return `${pageHeader('Series B Funding Application','Secure applicant-facing portfolio company application.',`${button('Exit portal','back-to-deals','','x')}${button('Save draft','save-application','','save')}`,'External Portal')}
      <section class="grid" style="grid-template-columns:230px minmax(0,1fr) 300px;gap:13px">
        <div class="card"><div class="card-body" style="padding-top:15px"><div><span class="muted small">Application progress</span><div class="metric-value">71%</div>${progressBar(71)}</div><div class="timeline section-gap">${steps.map((step,index)=>`<div class="timeline-item"><strong>${escapeHTML(step)}</strong><small>${index<4?'Complete':index===4?'In progress':'Not started'}</small></div>`).join('')}</div></div></div>
        <div class="card"><div class="card-head"><div><h3 class="card-title" style="font-size:17px">Funding Request</h3><div class="card-subtitle">Please provide details of your funding requirements and plans.</div></div>${statusPill('Autosaved 2 minutes ago','success')}</div><div class="card-body"><div class="form-grid"><div class="form-field"><label class="required">Funding round</label><select><option>Series B</option><option>Series A</option><option>Growth Equity</option></select></div><div class="form-field"><label class="required">Requested investment (USD)</label><input type="number" value="18000000"></div><div class="form-field"><label class="required">Proposed ownership (%)</label><input type="number" value="17.5"></div><div class="form-field"><label class="required">Pre-money valuation (USD)</label><input type="number" value="85000000"></div><div class="form-field"><label class="required">Target close date</label><input type="date" value="2026-09-30"></div><div class="form-field full"><label class="required">Use of funds</label><div class="table-wrap"><table class="criteria-table"><thead><tr><th>Category</th><th>Description</th><th>Allocation (%)</th><th></th></tr></thead><tbody><tr><td><input value="Product & Engineering"></td><td><input value="Product development, platform enhancements and technology"></td><td><input type="number" value="40"></td><td>${button('','remove-use-funds','ghost compact icon-only','x')}</td></tr><tr><td><input value="Regional Expansion"></td><td><input value="Market entry and scaling across target regions"></td><td><input type="number" value="35"></td><td>${button('','remove-use-funds','ghost compact icon-only','x')}</td></tr><tr><td><input value="Sales & Marketing"></td><td><input value="Customer acquisition and brand growth"></td><td><input type="number" value="25"></td><td>${button('','remove-use-funds','ghost compact icon-only','x')}</td></tr></tbody></table></div>${button('Add category','add-use-funds','compact','plus')}</div><div class="form-field full"><label class="required">Funding rationale</label><textarea>This investment will allow us to accelerate product development, expand into priority markets and scale our go-to-market engine to capture significant market opportunity.</textarea></div><div class="form-field"><label class="required">24-month milestones</label><textarea>Launch analytics platform v2.0\nExpand into two regional markets\nAchieve $25M ARR\nBuild strategic partner ecosystem</textarea></div><div class="form-field"><label>Existing investors</label><textarea>Alpha Ventures, Future Capital Partners, Delta Angels</textarea></div><div class="form-field"><label>Financial model</label><label class="button" style="justify-content:flex-start">${icon('upload')} Nova_Analytics_Financial_Model_v3.xlsx</label></div><div class="form-field"><label>Cap table</label><label class="button" style="justify-content:flex-start">${icon('upload')} Nova_Analytics_Cap_Table_2026-07.xlsx</label></div></div></div><div class="modal-foot"><button class="button" data-action="app-previous">${icon('arrow-left')} Previous</button><button class="button" data-action="save-application">${icon('save')} Save draft</button><button class="button primary" data-action="app-continue">Continue ${icon('arrow-right')}</button></div></div>
        <div class="side-stack" style="display:flex">${card('Application Checklist',`<div class="reason-list">${steps.map((step,index)=>`<div class="reason-item ${index>4?'warning':''}">${icon(index<5?'check-circle':'clock')}<div><strong>${escapeHTML(step)}</strong></div></div>`).join('')}</div>`) }${card('Validation Summary',`<div class="reason-item">${icon('check-circle')}<div><strong>No issues found</strong><small>All required fields in this section are completed.</small></div></div>`) }${card('Required Documents',`<div class="info-row"><span>6 of 8 uploaded</span><strong>75%</strong></div>${progressBar(75)}`,{footer:'<button class="card-link" data-action="deal-tab" data-tab="documents">View required documents</button>'})}${card('Need Help?',`<p class="muted small">Our team is here to help with your application.</p><div class="info-list"><div class="info-row"><span>${icon('mail')} investor-relations@matanho.com</span></div><div class="info-row"><span>${icon('phone')} +263 77 245 8890</span></div></div>`) }</div>
      </section>`;
  }

  function renderSettings() {
    return `${pageHeader('Settings & Integrations','Configure portfolio workflows, permissions, reporting policies and external systems.',button('Save changes','save-settings','primary','save'))}
      <section class="grid cols-3">
        ${card('Workspace Preferences',`<div class="form-grid"><div class="form-field full"><label>Default fund</label><select><option>All Funds</option>${funds.map(f=>`<option>${escapeHTML(f.name)}</option>`).join('')}</select></div><div class="form-field"><label>Base currency</label><select><option>USD</option><option>ZAR</option><option>ZWG</option></select></div><div class="form-field"><label>Timezone</label><select><option>Africa/Harare (CAT)</option><option>Africa/Johannesburg (SAST)</option></select></div><div class="form-field full"><label>Theme</label><select data-change-action="theme-setting"><option ${state.theme==='light'?'selected':''}>Light</option><option ${state.theme==='dark'?'selected':''}>Dark</option></select></div></div>`) }
        ${card('Investment Workflow',`<div class="info-list"><label class="checkbox-row"><input type="checkbox" checked> Require manager confirmation for AI screening</label><label class="checkbox-row"><input type="checkbox" checked> Enforce conflict declarations before IC vote</label><label class="checkbox-row"><input type="checkbox" checked> Require dual authorisation for payments</label><label class="checkbox-row"><input type="checkbox" checked> Lock disbursement until all conditions are complete</label><label class="checkbox-row"><input type="checkbox"> Allow applicants to amend after submission</label></div>`) }
        ${card('Reporting Policies',`<div class="form-grid"><div class="form-field full"><label>Valuation framework</label><select><option>IPEV 2025</option><option>IFRS 13</option></select></div><div class="form-field full"><label>Benchmark source</label><select><option>Private Markets PME</option><option>Cambridge Associates</option></select></div><div class="form-field"><label>Data lock day</label><input type="number" value="5"></div><div class="form-field"><label>Reminder lead time</label><input type="number" value="10"></div></div>`) }
      </section>
      <section class="grid cols-3 section-gap">
        ${card('Connected Systems',`<div class="info-list">${[['Fund Accounting','Connected','emerald'],['Microsoft 365','Connected','emerald'],['DocuSign','Connected','emerald'],['Refinitiv FX Rates','Connected','emerald'],['Banking API','Sandbox','amber'],['CRM','Not configured','red']].map(item=>`<div class="list-row"><span class="activity-icon" style="color:var(--${item[2]});background:var(--${item[2]}-soft)">${icon('grid')}</span><span class="list-row-main"><strong>${item[0]}</strong><small>${item[1]}</small></span>${button('Configure','configure-integration','compact')}</div>`).join('')}</div>`) }
        ${card('Roles & Permissions',`<div class="info-list">${[['Investment Partner','Full investment and approval access','7 users'],['Investment Team','Deal, diligence and portfolio access','18 users'],['Finance & Fund Admin','Capital, payments and reporting','9 users'],['LP Relations','LP management and communications','5 users'],['Read-only / Audit','View and export only','12 users']].map(item=>`<div class="list-row"><span class="activity-icon" style="color:var(--brand);background:var(--brand-soft)">${icon('users')}</span><span class="list-row-main"><strong>${item[0]}</strong><small>${item[1]}</small></span><strong class="small">${item[2]}</strong></div>`).join('')}</div>`,{footer:'<button class="card-link" data-action="manage-roles">Manage roles</button>'})}
        ${card('Audit & Security',`<div class="reason-list"><div class="reason-item">${icon('check-circle')}<div><strong>Encryption at rest and in transit</strong><small>Enabled</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Immutable audit log</strong><small>Enabled</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Multi-factor authentication</strong><small>Required</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Session timeout</strong><small>30 minutes</small></div></div><div class="reason-item warning">${icon('alert')}<div><strong>SSO</strong><small>Not configured in prototype</small></div></div></div>`,{footer:'<button class="card-link" data-action="security-settings">Open security settings</button>'})}
      </section>`;
  }

  function bindDynamicElements() {
    $$('.deal-card').forEach(cardNode => {
      cardNode.addEventListener('dragstart', event => {
        state.dragDealId = cardNode.dataset.dealId;
        cardNode.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', state.dragDealId);
      });
      cardNode.addEventListener('dragend', () => {
        cardNode.classList.remove('dragging');
        $$('.kanban-column').forEach(column => column.classList.remove('drag-over'));
        state.dragDealId = null;
      });
    });
    $$('.kanban-column').forEach(column => {
      column.addEventListener('dragover', event => { event.preventDefault(); column.classList.add('drag-over'); });
      column.addEventListener('dragleave', () => column.classList.remove('drag-over'));
      column.addEventListener('drop', event => {
        event.preventDefault();
        column.classList.remove('drag-over');
        const dealId = event.dataTransfer.getData('text/plain');
        const deal = deals.find(item => item.id === dealId);
        if (deal && deal.stage !== column.dataset.stage) {
          const from = deal.stage;
          deal.stage = column.dataset.stage;
          toast('Deal moved', `${deal.name} moved from ${from} to ${deal.stage}.`);
          render();
        }
      });
    });

    const tooltip = $('#chartTooltip', workspace);
    $$('[data-chart-label]', workspace).forEach(target => {
      target.addEventListener('mouseenter', event => {
        if (!tooltip) return;
        tooltip.innerHTML = `<strong>${escapeHTML(target.dataset.chartLabel)}</strong><span>${escapeHTML(target.dataset.chartValue || '')}</span>`;
        tooltip.classList.add('visible');
        moveTooltip(event, tooltip);
      });
      target.addEventListener('mousemove', event => moveTooltip(event, tooltip));
      target.addEventListener('mouseleave', () => tooltip?.classList.remove('visible'));
    });
  }

  function moveTooltip(event, tooltip) {
    const left = Math.min(window.innerWidth - 170, event.clientX + 12);
    const top = Math.min(window.innerHeight - 80, event.clientY + 12);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function navigate(page) {
    state.previousPage = state.page;
    state.page = page;
    state.mobileNavOpen = false;
    state.tableSearch = '';
    closeOverlays();
    if (typeof window.__PORTFOLIO_V11_NAV__ === 'function') window.__PORTFOLIO_V11_NAV__(page);
    render();
    requestAnimationFrame(() => { try { workspace?.focus?.({preventScroll:true}); } catch (_) {} });
  }

  function openDeal(id) {
    state.selectedDealId = id || 'DL-013';
    state.dealTab = 'overview';
    navigate('deal-detail');
  }

  function openCompany(id) { state.selectedCompanyId = id; state.companyTab = 'overview'; navigate('company-detail'); }
  function openFund(id) { state.selectedFundId = id; state.fundTab = 'overview'; navigate('fund-detail'); }
  function openLP(id) { state.selectedLPId = id; state.lpTab = 'overview'; navigate('lp-detail'); }
  function openCapitalCall(id) { state.selectedCapitalCallId = id; navigate('capital-call-detail'); }

  function overlayVariant(title = '', kind = 'drawer') {
    const value=title.toLowerCase();
    if (/document|report preview|application pack|evidence/.test(value)) return 'document';
    if (/approve|release|payment|close|decision|vote|signature/.test(value)) return 'approval';
    if (/import|statement|reconciliation|ledger|journal|cash/.test(value)) return 'operations';
    if (/filter|refine/.test(value)) return 'filter';
    if (/communication|clarification|comment|request/.test(value)) return 'compose';
    if (/create|add|assign|schedule|new/.test(value)) return 'wizard';
    if (/edit|settings|configuration|mapping/.test(value)) return 'inspector';
    return kind === 'drawer' ? 'record' : 'default';
  }

  function showDrawer(title, subtitle, body, actions = '', options = {}) {
    const variant=options.variant||overlayVariant(title,'drawer');
    state.drawer = { title, subtitle, variant };
    drawer.className=`drawer drawer-${variant} open`;
    drawer.innerHTML = `<div class="drawer-accent">${icon(options.icon||({document:'file',approval:'shield',operations:'refresh',filter:'filter',compose:'send',wizard:'plus',inspector:'settings'}[variant]||'info'))}</div><div class="drawer-head"><div><span class="overlay-eyebrow">${escapeHTML(options.eyebrow||variant.replaceAll('-',' '))}</span><h2>${escapeHTML(title)}</h2>${subtitle ? `<p>${escapeHTML(subtitle)}</p>` : ''}</div><button class="icon-button" data-action="close-drawer">${icon('x')}</button></div><div class="drawer-body">${body}</div>${actions ? `<div class="drawer-actions">${actions}</div>` : ''}`;
    scrim.classList.add('visible');
    renderStaticIcons(drawer);
  }

  function showModal(title, subtitle, body, footer = '', options = {}) {
    const variant=options.variant||overlayVariant(title,'modal');
    const size=options.size||(/document|signature|reconciliation|import/.test(variant)?'xl':/wizard|approval|operations/.test(variant)?'lg':'md');
    const railItems=options.rail||({wizard:['Details','Ownership','Review'],approval:['Impact','Evidence','Approval'],operations:['Context','Controls','Action'],compose:['Message','Recipients','Delivery'],inspector:['Properties','Permissions','Audit']}[variant]||[]);
    state.modal = { title, variant };
    modalLayer.innerHTML = `<section class="modal modal-${variant} modal-${size}" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">${railItems.length?`<aside class="modal-rail"><span class="modal-rail-icon">${icon(options.icon||({wizard:'plus',approval:'shield',operations:'refresh',compose:'send',inspector:'settings'}[variant]||'file'))}</span><strong>${escapeHTML(options.eyebrow||variant.replaceAll('-',' '))}</strong>${railItems.map((item,index)=>`<span class="modal-rail-step ${index===0?'active':''}"><b>${index+1}</b>${escapeHTML(item)}</span>`).join('')}</aside>`:''}<div class="modal-main"><div class="modal-head"><div><span class="overlay-eyebrow">${escapeHTML(options.eyebrow||variant.replaceAll('-',' '))}</span><h2>${escapeHTML(title)}</h2>${subtitle ? `<p>${escapeHTML(subtitle)}</p>` : ''}</div><button class="icon-button" data-action="close-modal">${icon('x')}</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-foot">${footer}</div>` : ''}</div></section>`;
    modalLayer.classList.add('visible');
    scrim.classList.add('visible');
    renderStaticIcons(modalLayer);
    requestAnimationFrame(() => $('input,select,textarea,button', modalLayer)?.focus());
  }

  function showPopover(anchor, html, width = 310) {
    const rect = anchor.getBoundingClientRect();
    const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.right - width));
    const top = Math.min(window.innerHeight - 420, rect.bottom + 8);
    const popoverKind=(anchor.dataset.action||'menu').replace(/[^a-z0-9-]/gi,'');
    popoverLayer.innerHTML = `<div class="popover popover-${popoverKind}" style="left:${left}px;top:${Math.max(8,top)}px;width:${width}px">${html}</div>`;
    popoverLayer.style.pointerEvents = 'auto';
    state.popover = true;
    renderStaticIcons(popoverLayer);
  }

  function activitySubject(context,id) {
    if(context==='company') return companies.find(item=>item.id===id) || companies[0];
    if(context==='lp') return lps.find(item=>item.id===id) || lps[0];
    if(context==='capital-call') return capitalCalls.find(item=>item.id===id) || capitalCalls[0];
    if(context==='deal'||context==='term-sheet') return deals.find(item=>item.id===id) || deals.find(item=>item.featured) || deals[0];
    if(context==='envelope') return signatureEnvelopes.find(item=>item.id===id) || signatureEnvelopes[0];
    if(context==='mailer-list') return mailerLists.find(item=>item.id===id) || mailerLists[0];
    return {name:id||'Portfolio record'};
  }

  function showActivityMenu(anchor,context='portfolio',id='') {
    const subject=activitySubject(context,id);
    const name=subject.name||subject.subject||subject.document||subject.id||'Portfolio record';
    showPopover(anchor,`<div class="popover-title">Activity · ${escapeHTML(name)}</div>
      <button class="popover-item" data-action="activity-open-timeline" data-context="${escapeHTML(context)}" data-id="${escapeHTML(id)}"><span class="activity-icon" style="color:var(--blue);background:var(--blue-soft)">${icon('clock')}</span><span class="popover-item-copy"><strong>View activity timeline</strong><small>Actions, actors, source records and timestamps</small></span></button>
      <button class="popover-item" data-action="activity-add-note" data-context="${escapeHTML(context)}" data-id="${escapeHTML(id)}"><span class="activity-icon" style="color:var(--emerald);background:var(--emerald-soft)">${icon('plus')}</span><span class="popover-item-copy"><strong>Add activity note</strong><small>Record a timestamped internal note</small></span></button>
      <button class="popover-item" data-action="activity-open-metadata" data-context="${escapeHTML(context)}" data-id="${escapeHTML(id)}"><span class="activity-icon" style="color:var(--purple);background:var(--purple-soft)">${icon('info')}</span><span class="popover-item-copy"><strong>View record metadata</strong><small>Ownership, versions, sources and permissions</small></span></button>
      <button class="popover-item" data-action="activity-export" data-context="${escapeHTML(context)}" data-id="${escapeHTML(id)}"><span class="activity-icon" style="color:var(--amber);background:var(--amber-soft)">${icon('download')}</span><span class="popover-item-copy"><strong>Export activity</strong><small>Download an audit-ready CSV extract</small></span></button>
      <div class="popover-divider"></div><button class="popover-item" data-action="activity-communication" data-context="${escapeHTML(context)}" data-id="${escapeHTML(id)}">${icon('mail')}<span class="popover-item-copy"><strong>Start communication</strong><small>Open a context-aware message workflow</small></span></button>`,390);
  }

  function showActivityTimeline(context,id) {
    const subject=activitySubject(context,id);
    const name=subject.name||subject.subject||subject.document||subject.id||'Portfolio record';
    const contextRows={
      company:[['31 Jul 2026 · 16:42','Quarterly KPI pack linked','Tendai Moyo','Portfolio reporting'],['30 Jul 2026 · 11:15','Board agenda approved','Nyasha Moyo','Governance'],['28 Jul 2026 · 09:26','Revenue forecast updated','System','Management accounts']],
      lp:[['31 Jul 2026 · 15:08','Quarterly report delivered','Investor Relations','Secure email + portal'],['29 Jul 2026 · 12:40','KYC evidence verified','Anita Kapoor','Compliance'],['24 Jul 2026 · 10:05','Capital-call contact confirmed','Rudo Ndlovu','Commitment register']],
      'capital-call':[['31 Jul 2026 · 17:02','Finance review requested','Tariro Moyo','Approval workflow'],['31 Jul 2026 · 13:24','Allocation schedule regenerated','System','Commitment ledger'],['30 Jul 2026 · 09:30','Notice draft created','Nyasha Moyo','Capital call']],
      deal:[['31 Jul 2026 · 16:20','Term-sheet v4 uploaded','Farai Chikore','Legal redline'],['31 Jul 2026 · 13:05','IC pack refreshed','System','Investment committee'],['30 Jul 2026 · 15:45','Diligence finding closed','Tendai Moyo','Due diligence']],
      'term-sheet':[['13 Jul 2026 · 16:20','Company redline received','Farai Chikore','TS-NOVA-v4'],['13 Jul 2026 · 16:05','Investment Director comment','Tariro Kasere','Governance clause'],['13 Jul 2026 · 15:28','Legal recommendation recorded','Farai Chikore','Internal note']],
      envelope:[['31 Jul 2026 · 11:22','Envelope sent','Tendai Moyo','Email + OTP'],['31 Jul 2026 · 11:24','First recipient authenticated','Tariro Kasere','OTP verified'],['31 Jul 2026 · 11:31','Signature applied','Tariro Kasere','Electronic consent']],
      'mailer-list':[['31 Jul 2026 · 17:22','Audience rules refreshed','System','LP master'],['31 Jul 2026 · 17:24','One duplicate removed','System','Email deduplication'],['30 Jul 2026 · 14:10','Owner reviewed consent exceptions','Nyasha Moyo','Consent register']]
    };
    const rows=contextRows[context]||contextRows.deal;
    showDrawer(`Activity · ${name}`,`${rows.length} recent events · append-only demonstration log`,`<section class="drawer-section activity-hero"><div><span class="activity-hero-icon">${icon('clock')}</span><div><strong>${escapeHTML(name)}</strong><small>${escapeHTML(context.replaceAll('-',' '))} activity stream</small></div></div><span class="table-badge">Live context</span></section><section class="drawer-section"><h3>Timeline</h3><div class="case-timeline">${rows.map(row=>`<div><span></span><strong>${escapeHTML(row[1])}</strong><small>${escapeHTML(row[0])} · ${escapeHTML(row[2])}</small><p>${escapeHTML(row[3])}</p></div>`).join('')}</div></section><section class="drawer-section"><h3>Source distribution</h3>${barChart({labels:['User','System','Integration','Approval'],series:[{name:'Events',color:'var(--brand)',values:[7,5,3,2]}],height:230,format:v=>Math.round(v),action:'activity-chart-detail'})}</section><section class="drawer-section"><h3>Metadata</h3><div class="info-list"><div class="info-row"><span>Record ID</span><strong>${escapeHTML(id||'PORTFOLIO')}</strong></div><div class="info-row"><span>Retention</span><strong>7 years · audit controlled</strong></div><div class="info-row"><span>Timezone</span><strong>Africa/Harare</strong></div><div class="info-row"><span>Export scope</span><strong>Authorised record only</strong></div></div></section>`,`${button('Export CSV','activity-export','','download',`data-context="${escapeHTML(context)}" data-id="${escapeHTML(id)}"`)}${button('Add note','activity-add-note','primary','plus',`data-context="${escapeHTML(context)}" data-id="${escapeHTML(id)}"`)}`,{variant:'record',icon:'clock',eyebrow:'Activity and audit'});
  }

  function showRecordMetadata(context,id) {
    const subject=activitySubject(context,id);
    const name=subject.name||subject.subject||subject.document||subject.id||'Portfolio record';
    const fields=Object.entries(subject).filter(([key,value])=>['string','number'].includes(typeof value)).slice(0,12);
    showDrawer(`Metadata · ${name}`,'Source identifiers, ownership, timestamps and access context',`<section class="drawer-section"><div class="metadata-grid">${fields.map(([key,value])=>`<div><span>${escapeHTML(key.replace(/([A-Z])/g,' $1').replaceAll('_',' '))}</span><strong>${escapeHTML(String(value))}</strong></div>`).join('')}</div></section><section class="drawer-section"><h3>Data lineage</h3><div class="source-lineage-mini"><div>${icon('layers')}<span><strong>Master record</strong><small>${escapeHTML(context)} service</small></span></div><div>${icon('refresh')}<span><strong>Read model</strong><small>Version 18 · 31 Jul 2026</small></span></div><div>${icon('shield')}<span><strong>Access policy</strong><small>Tenant + fund + role scoped</small></span></div></div></section>`,button('Close','close-drawer','primary'),{variant:'inspector',icon:'info',eyebrow:'Record metadata'});
  }

  function showDecisionConfirmation(kind,title,summary,details={},confirmLabel='Confirm decision') {
    const rows=Object.entries(details).map(([key,value])=>`<div class="info-row"><span>${escapeHTML(key)}</span><strong>${escapeHTML(String(value))}</strong></div>`).join('');
    showModal(title,summary,`<div class="decision-confirmation"><section class="decision-banner ${kind==='reject'?'danger':kind==='defer'?'warning':'success'}">${icon(kind==='reject'?'alert':kind==='defer'?'clock':'shield')}<div><strong>${escapeHTML(confirmLabel)}</strong><small>This controlled action will be written to the activity and audit trail.</small></div></section><section class="decision-grid"><div><h3>Economic and workflow impact</h3><div class="info-list">${rows}</div></div><div><h3>Evidence checked</h3><div class="reason-list"><div class="reason-item">${icon('check-circle')}<div><strong>Current record version</strong><small>Version and source identifiers are frozen at confirmation.</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Maker-checker conflict</strong><small>No self-approval conflict detected in this frontend demonstration.</small></div></div><div class="reason-item">${icon('shield')}<div><strong>Permissions</strong><small>Action requires an authorised investment or operations role.</small></div></div></div></div></section><div class="form-field section-gap"><label>Decision rationale</label><textarea id="decisionRationale" placeholder="Record the rationale, conditions or follow-up required..."></textarea></div><label class="checkbox-row section-gap"><input id="decisionAcknowledge" type="checkbox"> I confirm the displayed record, impact and evidence are correct.</label></div>`,`${button('Cancel','close-modal')}${button(confirmLabel,'confirm-decision',kind==='reject'?'danger':'primary',kind==='reject'?'x':'check',`data-decision-kind="${escapeHTML(kind)}"`)}`,{variant:'approval',size:'lg',rail:['Decision','Impact','Evidence','Confirmation'],eyebrow:'Controlled decision'});
    state.pendingDecision={kind,title,details,confirmLabel};
  }

  function showTermClauseDrawer(sectionIndex,clauseIndex) {
    state.termSection=Number(sectionIndex); state.termClause=Number(clauseIndex);
    const section=termSheetSections[state.termSection]||termSheetSections[0];
    const clause=section.clauses[state.termClause]||section.clauses[0];
    const status=state.termDecisions[`${state.termSection}:${state.termClause}`]||clause.status;
    showDrawer(clause.title,`${section.name} · ${clause.reference} · ${status}`,`<section class="drawer-section term-clause-hero"><div><span>${icon(section.icon)}</span><div><strong>${escapeHTML(clause.value)}</strong><small>Current negotiated value</small></div></div>${statusPill(status,status==='Open'?'warning':'success')}</section><section class="drawer-section"><h3>Side-by-side positions</h3><div class="term-drawer-comparison"><div><span>Matanho position · v4</span><p>${escapeHTML(clause.matanho)}</p></div><div><span>Company counter · v3</span><p>${escapeHTML(clause.company)}</p></div></div></section><section class="drawer-section"><h3>Source and metadata</h3><div class="info-list"><div class="info-row"><span>Source</span><strong>${escapeHTML(clause.source)}</strong></div><div class="info-row"><span>Clause reference</span><strong>${escapeHTML(clause.reference)}</strong></div><div class="info-row"><span>Owner</span><strong>${escapeHTML(clause.owner)}</strong></div><div class="info-row"><span>Last updated</span><strong>${escapeHTML(clause.updated)}</strong></div><div class="info-row"><span>Current version</span><strong>TS-NOVA-v4</strong></div></div></section><section class="drawer-section"><h3>Version movement</h3>${lineChart({labels:['v1','v2','v3','v4'],series:[{name:'Agreement confidence',color:'var(--brand)',values:[45,58,72,status==='Agreed'?100:82]}],height:230,format:v=>`${v}%`,action:'term-version-chart'})}</section><section class="drawer-section"><h3>Comments</h3><div class="case-timeline"><div><span></span><strong>Legal review</strong><small>Farai Chikore · 13 Jul 2026 · 15:28</small><p>Retain investor visibility while narrowing disclosure exceptions.</p></div><div><span></span><strong>Investment Director</strong><small>Tariro Kasere · 13 Jul 2026 · 16:05</small><p>Economic and governance impact is material to the IC decision.</p></div></div></section>`,`${status!=='Agreed'?button('Accept counter','accept-counter','','check',`data-section="${state.termSection}" data-clause="${state.termClause}"`):''}${status!=='Agreed'?button('Retain position','retain-position','','gavel',`data-section="${state.termSection}" data-clause="${state.termClause}"`):''}${button('Add comment','add-term-comment','primary','mail')}`,{variant:'record',icon:section.icon,eyebrow:'Term-sheet clause'});
  }

  function showExpandedReconciliationComparison() {
    const batch=reconciliationBatches.find(r=>r.id===state.selectedReconciliationId)||reconciliationBatches[0];
    const uploadLabel=state.uploadedStatementName?`${escapeHTML(state.uploadedStatementName)} staged`:'Upload CSV, Excel or Word statement';
    showModal('Expanded Source-to-Ledger Comparison',`${batch.id} · ${batch.account} · ${batch.period}`,`<div class="recon-expanded-shell"><header class="recon-expanded-toolbar"><div>${workspaceFilterBar([{label:'Date window',action:'expanded-recon-date',selected:'±3 business days',options:['Same day','±3 business days','±5 business days']},{label:'Candidate status',action:'expanded-recon-status',selected:'Suggested + partial',options:['Suggested + partial','All candidates','Hard-rule failures']},{label:'Amount tolerance',action:'expanded-recon-tolerance',selected:'USD 100',options:['Exact','USD 100','USD 1,000']}])}</div><label class="button primary upload-inline">${icon('upload')}<span>${uploadLabel}</span><input type="file" hidden accept=".csv,.xlsx,.xls,.doc,.docx" data-file-action="upload-bank-statement"></label></header><section class="recon-document-comparison"><article class="recon-source-document internal-source"><div class="source-document-head"><div><span class="source-badge">INTERNAL</span><strong>Cash journal JRN-2026-07196</strong><small>Source EXP-7221 · posted 30 Jul 2026 · audit hash 8F4A…91C2</small></div>${statusPill('POSTED','success')}</div><div class="source-paper"><div class="source-paper-title"><span>Matanho cash subledger</span><strong>Bank charge classification</strong></div><table class="source-table"><thead><tr><th>Ledger account</th><th>Debit</th><th>Credit</th><th>Cash sign</th></tr></thead><tbody><tr><td>Approved fund expense control</td><td>125,000.00</td><td>0.00</td><td>—</td></tr><tr class="selected-source-row"><td>FCA-3372 · Fund bank cash</td><td>0.00</td><td>125,000.00</td><td class="negative">-125,000.00</td></tr><tr class="source-total"><td>Totals</td><td>125,000.00</td><td>125,000.00</td><td>Balanced</td></tr></tbody></table><div class="source-meta-strip"><span><small>Fund</small><strong>Matanho Venture Fund I</strong></span><span><small>Vehicle</small><strong>MVF-I Main</strong></span><span><small>Value date</small><strong>30 Jul 2026</strong></span><span><small>Maker / checker</small><strong>Chipo Dube / Anita Kapoor</strong></span></div></div></article><aside class="recon-match-centre"><div class="match-score-ring large"><strong>91</strong><span>match score</span></div><div class="expanded-score-bars"><div><span>Amount compatibility</span>${progressBar(100,'var(--emerald)')}<b>100%</b></div><div><span>Date proximity</span>${progressBar(90,'var(--blue)')}<b>90%</b></div><div><span>Reference similarity</span>${progressBar(78,'var(--amber)')}<b>78%</b></div><div><span>Counterparty</span>${progressBar(95,'var(--purple)')}<b>95%</b></div></div><div class="match-link-card"><span>Proposed link</span><strong>USD 125,000.00</strong><small>One-to-one · residual USD 0.00</small></div><div class="reason-item warning">${icon('alert')}<div><strong>Competing candidate detected</strong><small>EXT-88396 differs by one business day. Manual confirmation is required.</small></div></div>${button('Confirm match','confirm-recon-match','primary','check')}${button('Split or combine','split-recon-match','','layers')}${button('Raise exception','raise-recon-exception','','alert')}</aside><article class="recon-source-document external-source"><div class="source-document-head"><div><span class="source-badge external">EXTERNAL</span><strong>CBZ statement line EXT-88398</strong><small>${state.uploadedStatementName?escapeHTML(state.uploadedStatementName):'CBZ_USD_3372_JUL2026.csv'} · parser CBZ CSV v4.2 · checksum B1D9…88F0</small></div>${statusPill('STAGED','info')}</div><div class="source-paper bank-statement-paper"><div class="bank-statement-brand"><strong>CBZ BANK ZIMBABWE</strong><span>Statement of account · USD · ••••3372</span></div><table class="source-table"><thead><tr><th>Raw date</th><th>Raw description</th><th>Raw debit</th><th>Canonical amount</th></tr></thead><tbody><tr><td>30/07/2026</td><td>SERVICE FEE JUL 2026</td><td>125,000.00 DR</td><td class="negative">-125,000.00</td></tr></tbody></table><div class="raw-canonical-grid"><div><span>Raw sign</span><strong>Debit</strong><small>Provider viewpoint</small></div><div><span>Canonical sign</span><strong class="negative">Cash decrease</strong><small>Arcus viewpoint</small></div><div><span>Raw reference</span><strong>CHARGE JUL</strong><small>Original retained</small></div><div><span>Normalised reference</span><strong>CHARGE JUL</strong><small>Mapping v4.2</small></div></div><div class="source-meta-strip"><span><small>Opening balance</small><strong>USD 15.30M</strong></span><span><small>Movement total</small><strong>USD 2.50M</strong></span><span><small>Closing balance</small><strong>USD 17.80M</strong></span><span><small>Control total</small><strong class="positive">Passed</strong></span></div></div></article></section><section class="source-lineage-wide"><div>${icon('briefcase')}<span><small>Source event</small><strong>EXP-7221 · Approved fund expense</strong></span></div><i>${icon('arrow-right')}</i><div>${icon('list')}<span><small>Internal journal</small><strong>JRN-2026-07196 · Posted</strong></span></div><i>${icon('arrow-right')}</i><div>${icon('bank')}<span><small>Provider evidence</small><strong>EXT-88398 · Staged</strong></span></div><i>${icon('arrow-right')}</i><div>${icon('link')}<span><small>Match link</small><strong>Suggested · 91%</strong></span></div></section></div>`,`${button('Export comparison','export-reconciliation-pack','','download')}${button('Close','close-modal')}${button('Confirm suggested match','confirm-recon-match','primary','check')}`,{variant:'reconciliation',size:'fullscreen',eyebrow:'Source-to-ledger proof'});
  }

  function showUploadBankStatementModal() {
    showModal('Upload Bank Statement','Import CSV, Excel or Word statement evidence into staging without changing the internal ledger.',`<div class="statement-upload-layout"><label class="upload-dropzone interactive-upload">${icon('upload')}<strong>Choose or drop a bank statement</strong><small>Accepted: CSV, XLSX, XLS, DOC and DOCX · original file and checksum retained</small><input type="file" hidden accept=".csv,.xlsx,.xls,.doc,.docx" data-file-action="upload-bank-statement"></label><section class="statement-upload-controls"><div class="form-field"><label>Provider</label><select><option>CBZ Bank Zimbabwe</option><option>Ecobank Zimbabwe</option><option>Stanbic Zimbabwe</option><option>FBC Custody</option></select></div><div class="form-field"><label>Cash account</label><select>${cashAccounts.map(account=>`<option>${account.id} · ${escapeHTML(account.masked)} · ${account.currency}</option>`).join('')}</select></div><div class="form-field"><label>Statement period</label><input type="month" value="2026-07"></div><div class="form-field"><label>Layout version</label><select><option>Auto-detect approved layout</option><option>CBZ CSV v4.2</option><option>Ecobank XLSX v2.7</option></select></div></section><section class="statement-import-proof"><div>${icon('shield')}<span><strong>Validate and stage only</strong><small>Uploading does not post journals or change cash.</small></span></div><div>${icon('refresh')}<span><strong>Duplicate checks</strong><small>File, period and line fingerprints will be checked.</small></span></div><div>${icon('user-check')}<span><strong>Maker-checker</strong><small>A different authorised checker must commit the batch.</small></span></div></section></div>`,`${button('Cancel','close-modal')}${button('Validate selected file','stage-uploaded-statement','primary','check')}`,{variant:'import',size:'lg',rail:['File','Account mapping','Controls','Staging review'],eyebrow:'External statement ingestion'});
  }

  function uploadBankStatement(files) {
    const file=Array.from(files||[])[0]; if(!file) return;
    state.uploadedStatementName=file.name; state.uploadedStatementType=(file.name.split('.').pop()||'FILE').toUpperCase();
    toast('Statement selected',`${file.name} is ready for validation and staging.`);
    if(state.modal?.title?.includes('Expanded Source-to-Ledger')) showExpandedReconciliationComparison();
  }

  function showMailerListDrawer(id) {
    const list=mailerLists.find(item=>item.id===id)||mailerLists[0]; state.selectedMailerListId=list.id;
    const members=[['Tendai Moyo','tendai@example.com','LP primary contact','Verified','Secure email + portal'],['Chipo Ndlovu','chipo@example.com','Finance contact','Verified','Secure email'],['Rudo Sibanda','rudo@example.com','Authorised signatory','Pending review','LP portal'],['Nyasha Dube','nyasha@example.com','Reporting contact','Verified','Secure email']];
    showDrawer(list.name,`${list.id} · ${list.members} members · ${list.status}`,`<section class="drawer-section mailer-hero"><div><span>${icon('mail')}</span><div><strong>${list.members} recipients</strong><small>${escapeHTML(list.description)}</small></div></div>${statusPill(list.status)}</section><section class="drawer-section"><h3>Audience rules</h3><div class="info-list"><div class="info-row"><span>Source</span><strong>${escapeHTML(list.source)}</strong></div><div class="info-row"><span>Funds</span><strong>${escapeHTML(list.funds.join(', '))}</strong></div><div class="info-row"><span>Channels</span><strong>${escapeHTML(list.channels.join(', '))}</strong></div><div class="info-row"><span>Consent / authority</span><strong>${escapeHTML(list.consent)}</strong></div><div class="info-row"><span>Owner</span><strong>${escapeHTML(list.owner)}</strong></div><div class="info-row"><span>Last refreshed</span><strong>${escapeHTML(list.updated)}</strong></div></div></section><section class="drawer-section"><h3>Recipient health</h3>${donutChart([{label:'Active',value:list.active,color:'var(--emerald)',display:String(list.active)},{label:'Pending',value:list.pending,color:'var(--amber)',display:String(list.pending)},{label:'Bounced',value:list.bounced,color:'var(--red)',display:String(list.bounced)}],String(list.members),'Recipients',145)}</section><section class="drawer-section"><h3>Sample recipients</h3><div class="table-wrap"><table class="criteria-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Delivery</th></tr></thead><tbody>${members.map(row=>`<tr>${row.map((value,index)=>`<td>${index===3?statusPill(value,value==='Verified'?'success':'warning'):escapeHTML(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section><section class="drawer-section"><h3>Recent campaigns</h3><div class="case-timeline"><div><span></span><strong>Q2 2026 Investor Report</strong><small>31 Jul 2026 · 97.4% delivered</small><p>38 recipients · secure email and LP portal.</p></div><div><span></span><strong>Annual Meeting Save the Date</strong><small>12 Jul 2026 · 94.7% opened</small><p>Audience snapshot retained with campaign evidence.</p></div></div></section>`,`${button('Export audience','export-mailer-list','','download',`data-id="${list.id}"`)}${button('Edit rules','edit-mailer-list','','settings',`data-id="${list.id}"`)}${button('Create campaign','mailer-new-campaign','primary','send',`data-id="${list.id}"`)}`,{variant:'record',icon:'mail',eyebrow:'Mailer list'});
  }

  function showCreateMailerListModal() {
    showModal('Create Mailer List','Build a governed, reusable audience from approved contact sources and delivery permissions.',`<form id="mailerListForm"><div class="form-grid"><div class="form-field full"><label class="required">List name</label><input name="name" required placeholder="e.g. Fund II Quarterly LPs"></div><div class="form-field full"><label>Description</label><textarea name="description" placeholder="Purpose and permitted communications"></textarea></div><div class="form-field"><label>Audience source</label><select name="source"><option>LP master + portal consent</option><option>Commitment register</option><option>Portfolio contacts</option><option>Governance register</option><option>Compliance contact register</option></select></div><div class="form-field"><label>Fund scope</label><select name="fund"><option>All Funds</option>${funds.map(f=>`<option>${escapeHTML(f.name)}</option>`).join('')}</select></div><div class="form-field"><label>Primary channel</label><select name="channel"><option>Secure email</option><option>Secure email + LP portal</option><option>Email</option><option>Event portal</option></select></div><div class="form-field"><label>Owner</label><select name="owner"><option>Nyasha Moyo</option><option>Rudo Ndlovu</option><option>Tendai Moyo</option><option>Anita Kapoor</option></select></div><div class="form-field full"><label>Inclusion rules</label><div class="rule-builder"><span>Contact status</span><select><option>Active</option></select><span>AND</span><span>Communication authority</span><select><option>Verified</option></select><button type="button" class="button compact" data-action="mailer-add-rule">${icon('plus')}<span>Add rule</span></button></div></div><div class="form-field full"><label class="checkbox-row"><input name="dedupe" type="checkbox" checked> Deduplicate email addresses and retain the highest-authority contact.</label><label class="checkbox-row"><input name="consent" type="checkbox" checked> Require consent or documented communication authority before activation.</label></div></div></form>`,`${button('Cancel','close-modal')}${button('Preview audience','preview-mailer-audience','','eye')}${button('Create list','submit-mailer-list','primary','plus')}`,{variant:'wizard',size:'lg',rail:['Purpose','Source rules','Delivery controls','Review'],eyebrow:'Audience builder'});
  }

  function submitMailerList() {
    const form=$('#mailerListForm'); if(!form?.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form));
    const list={id:`ML-${String(mailerLists.length+1).padStart(3,'0')}`,name:data.name,description:data.description||'Governed portfolio communication audience.',source:data.source,members:24,active:22,pending:2,bounced:0,owner:data.owner,updated:'01 Aug 2026 · just now',status:'Draft',channels:[data.channel],tags:[data.fund==='All Funds'?'Cross-fund':data.fund,'New'],funds:[data.fund],consent:'Review required',campaigns:0};
    mailerLists.unshift(list); state.selectedMailerListId=list.id; closeOverlays(); toast('Mailer list created',`${list.name} was created in Draft with 24 preview recipients.`); render();
  }

  function showMailerCampaignModal(id=state.selectedMailerListId) {
    const list=mailerLists.find(item=>item.id===id)||mailerLists[0];
    showModal('Create Mailer Campaign',`${list.name} · ${list.active} active recipients`,`<form id="mailerCampaignForm"><div class="compose-layout"><aside><strong>Audience summary</strong><div class="info-list"><div class="info-row"><span>List</span><strong>${escapeHTML(list.name)}</strong></div><div class="info-row"><span>Active recipients</span><strong>${list.active}</strong></div><div class="info-row"><span>Channels</span><strong>${escapeHTML(list.channels.join(', '))}</strong></div><div class="info-row"><span>Consent</span><strong>${escapeHTML(list.consent)}</strong></div></div></aside><main><div class="form-field"><label>Campaign type</label><select><option>Investor report distribution</option><option>Capital call notice</option><option>Portfolio update</option><option>Meeting invitation</option></select></div><div class="form-field"><label class="required">Subject</label><input required value="Matanho Portfolio Update · Q2 2026"></div><div class="form-field"><label>Message</label><textarea style="min-height:180px">Dear Investor,\n\nThe latest approved report pack is available in your secure portal. Please use the link below to access the published version.</textarea></div><div class="form-field"><label>Attach report</label><select><option>MGF II Quarterly Report · Q2 2026 · Published</option><option>Portfolio Valuation Report · Q2 2026</option></select></div></main></div></form>`,`${button('Cancel','close-modal')}${button('Save draft','save-mailer-campaign','','save')}${button('Schedule campaign','schedule-mailer-campaign','primary','send')}`,{variant:'compose',size:'lg',rail:['Audience','Message','Attachments','Delivery'],eyebrow:'Controlled communication'});
  }

  function showScheduledReportPreview(id) {
    const scheduled=reports.find(item=>item.id===id)||reports[0];
    const matchingType=reportVaultItems.find(item=>scheduled.type.includes('Valuation')?item.type.includes('Valuation'):scheduled.type.includes('Board')?item.type.includes('IC'):scheduled.type.includes('Portfolio')?item.type.includes('Valuation'):item.fund===scheduled.fund);
    const vault=matchingType||reportVaultItems[0];
    showReportPreview(vault.id,scheduled);
  }

  function closeOverlays() {
    drawer.classList.remove('open');
    drawer.innerHTML = '';
    modalLayer.classList.remove('visible');
    modalLayer.innerHTML = '';
    popoverLayer.innerHTML = '';
    popoverLayer.style.pointerEvents = 'none';
    commandPalette.classList.remove('open');
    commandPalette.innerHTML = '';
    scrim.classList.remove('visible');
    state.drawer = state.modal = state.popover = null;
  }

  function toast(title, message, type = 'success') {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const iconName = type === 'error' ? 'alert' : type === 'warning' ? 'info' : 'check-circle';
    toastStack.insertAdjacentHTML('beforeend', `<div class="toast" id="${id}"><span class="toast-icon" style="color:${type==='error'?'var(--red)':type==='warning'?'var(--amber)':'var(--emerald)'};background:${type==='error'?'var(--red-soft)':type==='warning'?'var(--amber-soft)':'var(--emerald-soft)'}">${icon(iconName)}</span><span class="toast-copy"><strong>${escapeHTML(title)}</strong><small>${escapeHTML(message)}</small></span><button class="toast-close" data-action="close-toast" data-id="${id}">${icon('x')}</button></div>`);
    setTimeout(() => $(`#${id}`)?.remove(), 5000);
  }

  function openCommandPalette(query = '') {
    state.searchQuery = query;
    const normalized = query.toLowerCase().trim();
    const results = [
      ...navGroups.flatMap(group => group.items.map(item => ({ type:'Page', label:item.label, detail:group.label, icon:item.icon, page:item.id }))),
      ...deals.map(item => ({ type:'Deal', label:item.name, detail:`${item.stage} · ${item.sector}`, icon:'briefcase', id:item.id, action:'open-deal' })),
      ...companies.map(item => ({ type:'Company', label:item.name, detail:`${item.sector} · ${item.fund}`, icon:'building', id:item.id, action:'open-company' })),
      ...funds.map(item => ({ type:'Fund', label:item.name, detail:`${item.vintage} · ${item.strategy}`, icon:'layers', id:item.id, action:'open-fund' })),
      ...lps.map(item => ({ type:'LP', label:item.name, detail:`${item.type} · ${formatMoney(item.commitment)}`, icon:'users', id:item.id, action:'open-lp' }))
    ].filter(item => !normalized || `${item.label} ${item.detail} ${item.type}`.toLowerCase().includes(normalized)).slice(0,18);
    commandPalette.innerHTML = `<div class="command-box"><div class="command-input-wrap">${icon('search')}<input class="command-input" data-input-action="command-search" placeholder="Search Matanho Portfolio Management..." value="${escapeHTML(query)}"><kbd>ESC</kbd></div><div class="command-results">${results.length ? results.map(item=>`<button class="command-result" data-action="command-result" ${item.page?`data-page="${item.page}"`:''} ${item.id?`data-id="${item.id}"`:''} ${item.action?`data-result-action="${item.action}"`:''}><span class="command-result-icon">${icon(item.icon)}</span><span class="command-result-copy"><strong>${escapeHTML(item.label)}</strong><small>${escapeHTML(item.type)} · ${escapeHTML(item.detail)}</small></span><kbd>↵</kbd></button>`).join('') : `<div class="empty-state"><div><div class="empty-state-icon">${icon('search')}</div><h3>No results</h3><p>Try a company, fund, LP, deal stage or page name.</p></div></div>`}</div></div>`;
    commandPalette.classList.add('open');
    renderStaticIcons(commandPalette);
    requestAnimationFrame(() => $('.command-input', commandPalette)?.focus());
  }

  function downloadBlob(filename, blob) {
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a'); link.href=url; link.download=filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  function exportCSV(filename, rows) {
    const csv=rows.map(row=>row.map(value=>`"${String(value??'').replaceAll('"','""')}"`).join(',')).join('\n');
    downloadBlob(filename,new Blob([csv],{type:'text/csv;charset=utf-8'}));
    toast('CSV exported',`${filename} was generated from the current view.`);
  }

  function createSimplePdf(title, lines = []) {
    const safe=value=>String(value).replace(/[()\\]/g,char=>`\\${char}`).replace(/[^\x20-\x7E]/g,'?');
    const content=[`BT /F1 19 Tf 54 790 Td (${safe(title)}) Tj`,`0 -30 Td /F1 9 Tf (${safe('Matanho Portfolio Management · Generated '+new Date().toLocaleString())}) Tj`];
    lines.slice(0,44).forEach((line,index)=>content.push(`0 -${index===0?30:15} Td (${safe(line)}) Tj`)); content.push('ET');
    const stream=content.join('\n');
    const objects=[null,'<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
    let pdf='%PDF-1.4\n', offsets=[0];
    for(let i=1;i<objects.length;i++){ offsets[i]=pdf.length; pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`; }
    const xref=pdf.length; pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
    pdf+=`trailer << /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Blob([pdf],{type:'application/pdf'});
  }

  function documentRows(doc) {
    return [['Field','Value'],['Document ID',doc.id],['Document',doc.name],['Folder',doc.folder],['Version',doc.version],['Owner',doc.owner],['Status',doc.status],['Classification',doc.classification],['Signature status',doc.signatureStatus],['Uploaded',doc.uploaded],['Retention',doc.retention],['Access',doc.access]];
  }

  function downloadDocumentFormat(id, format='pdf') {
    const doc=documents.find(item=>item.id===id)||documents[0]; const base=doc.name.replace(/\.[^.]+$/,'').replace(/[^a-z0-9-_ ]/gi,'').trim().replaceAll(' ','_');
    const rows=documentRows(doc);
    if(format==='pdf') downloadBlob(`${base}.pdf`,createSimplePdf(doc.name,rows.map(r=>r.join(': '))));
    else if(format==='csv') exportCSV(`${base}.csv`,rows);
    else {
      const html=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${rows.map(r=>`<tr>${r.map(c=>`<td>${escapeHTML(c)}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
      downloadBlob(`${base}.xls`,new Blob([html],{type:'application/vnd.ms-excel'})); toast('Excel export created',`${base}.xls is ready.`);
    }
  }

  function genericDetailDrawer(label, value = '') {
    showDrawer(label, 'Interactive drill-down', `<section class="drawer-section"><h3>Current selection</h3><div class="metric-value" style="font-size:24px">${escapeHTML(value || label)}</div><p class="muted small">This panel demonstrates the detailed drill-down behaviour. In production, the data would be loaded from Matanho APIs, fund accounting, document storage and portfolio-company reporting feeds.</p></section><section class="drawer-section"><h3>Period comparison</h3>${lineChart({labels:['Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'Selected metric',color:'var(--brand)',values:[32,41,48,56,68]}],height:190,format:v=>`${v}`})}</section><section class="drawer-section"><h3>Dimensions</h3><div class="info-list"><div class="info-row"><span>Fund</span><strong>${escapeHTML(state.activeFund)}</strong></div><div class="info-row"><span>As of</span><strong>${escapeHTML(state.asOfDate)}</strong></div><div class="info-row"><span>Currency</span><strong>USD</strong></div><div class="info-row"><span>Source</span><strong>Prototype data</strong></div></div></section>`, `${button('Export detail','export-drilldown','','download')}${button('Close','close-drawer','primary')}`);
  }

  function showAddDealModal(defaultStage = 'Sourcing') {
    showModal('Add investment opportunity','Create a frontend-only pipeline record.',`<form id="addDealForm"><div class="form-grid"><div class="form-field"><label class="required">Company name</label><input name="name" required placeholder="e.g. AfriCloud"></div><div class="form-field"><label class="required">Sector</label><select name="sector"><option>Enterprise Software</option><option>FinTech</option><option>Climate Tech</option><option>HealthTech</option><option>Consumer</option><option>Mobility & Logistics</option></select></div><div class="form-field"><label class="required">Funding round</label><select name="round"><option>Seed</option><option>Series A</option><option>Series B</option><option>Growth</option><option>Buyout</option></select></div><div class="form-field"><label class="required">Requested amount (USD)</label><input name="amount" type="number" min="100000" value="10000000" required></div><div class="form-field"><label class="required">Stage</label><select name="stage">${dealStages.map(stage=>`<option ${stage===defaultStage?'selected':''}>${stage}</option>`).join('')}</select></div><div class="form-field"><label>Owner</label><select name="owner"><option>Nyasha Moyo</option><option>Sarah Chen</option><option>Michael Park</option><option>Priya Nair</option><option>Alex Johnson</option></select></div><div class="form-field"><label>Priority</label><select name="priority"><option>Medium</option><option>High</option><option>Low</option></select></div><div class="form-field"><label>Target fund</label><select name="fund">${funds.map(f=>`<option>${escapeHTML(f.name)}</option>`).join('')}</select></div><div class="form-field full"><label>Investment note</label><textarea name="note" placeholder="Add sourcing context, thesis fit and next action..."></textarea></div></div></form>`,`${button('Cancel','close-modal')}${button('Add to pipeline','submit-add-deal','primary','plus')}`);
  }

  function submitAddDeal() {
    const form = $('#addDealForm');
    if (!form?.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const deal = { id:`DL-${String(deals.length+1).padStart(3,'0')}`, name:data.name, sector:data.sector, round:data.round, amount:Number(data.amount), owner:data.owner, age:0, priority:data.priority, stage:data.stage, score:0, fund:data.fund };
    deals.push(deal);
    closeOverlays();
    toast('Deal added', `${deal.name} was added to ${deal.stage}.`);
    state.page = 'deals';
    render();
  }

  function showCapitalCallModal() {
    showModal('New Capital Call','Create a draft capital call notice.',`<form id="capitalCallForm"><div class="form-grid"><div class="form-field full"><label class="required">Fund</label><select name="fund">${funds.map(f=>`<option>${escapeHTML(f.name)}</option>`).join('')}</select></div><div class="form-field"><label class="required">Call date</label><input name="callDate" type="date" value="2026-08-01"></div><div class="form-field"><label class="required">Due date</label><input name="dueDate" type="date" value="2026-08-31"></div><div class="form-field"><label class="required">Total amount (USD)</label><input name="amount" type="number" value="25000000"></div><div class="form-field"><label class="required">Purpose</label><select name="purpose"><option>New investments</option><option>Follow-on investments</option><option>Management fees</option><option>Fund expenses</option><option>Co-investments</option></select></div><div class="form-field full"><label>Notes</label><textarea name="notes">Capital required to fund the approved investment programme and related fund expenses.</textarea></div></div></form>`,`${button('Cancel','close-modal')}${button('Create draft','submit-capital-call','primary','plus')}`);
  }

  function submitCapitalCall() {
    const form = $('#capitalCallForm');
    if (!form?.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const id = `CC-2026-${String(39 + capitalCalls.length).padStart(4,'0')}`;
    const call = { id, fund:data.fund, callDate:new Date(data.callDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}), dueDate:new Date(data.dueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}), purpose:data.purpose, amount:Number(data.amount), lpCount:38, collected:0, status:'Draft', approval:'Draft' };
    capitalCalls.unshift(call);
    state.selectedCapitalCallId = id;
    closeOverlays();
    toast('Capital call created', `${id} is ready for allocation and validation.`);
    state.page = 'capital-call-detail';
    render();
  }

  function showCompanyModal() {
    showModal('Add portfolio company','Add an existing investment to the monitoring workspace.',`<form id="companyForm"><div class="form-grid"><div class="form-field"><label class="required">Company name</label><input name="name" required></div><div class="form-field"><label class="required">Sector</label><input name="sector" required value="Enterprise Software"></div><div class="form-field"><label class="required">Fund</label><select name="fund">${funds.map(f=>`<option>${escapeHTML(f.name)}</option>`).join('')}</select></div><div class="form-field"><label>Stage</label><select name="stage"><option>Growth</option><option>Series B</option><option>Series A</option><option>Buyout</option></select></div><div class="form-field"><label class="required">Invested amount</label><input name="invested" type="number" value="15000000"></div><div class="form-field"><label>Fair value</label><input name="fairValue" type="number" value="15000000"></div><div class="form-field"><label>Ownership %</label><input name="ownership" type="number" value="15"></div><div class="form-field"><label>Location</label><input name="city" value="Harare, Zimbabwe"></div></div></form>`,`${button('Cancel','close-modal')}${button('Add company','submit-company','primary','plus')}`);
  }

  function submitCompany() {
    const form = $('#companyForm');
    if (!form?.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const colors = ['#1d4ed8','#0d9488','#ea580c','#0284c7','#0284c7'];
    const company = { id:`CO-${String(companies.length+1).padStart(3,'0')}`, name:data.name, sector:data.sector, stage:data.stage, entry:'31 Jul 2026', invested:Number(data.invested), fairValue:Number(data.fairValue), ownership:Number(data.ownership), revenueGrowth:0, runway:18, health:75, boardDate:'TBC', lastReport:'Not submitted', fund:data.fund, city:data.city, revenue:[0,0,0,0,0], ebitda:[0,0,0,0,0], arr:0, margin:0, nrr:0, clients:0, esg:[0,0,0], color:colors[companies.length%colors.length] };
    companies.push(company);
    closeOverlays();
    toast('Company added', `${company.name} is now in portfolio monitoring.`);
    state.page = 'companies'; render();
  }

  function showLPModal() {
    showModal('Add Limited Partner','Create an investor directory record and begin onboarding.',`<form id="lpForm"><div class="form-grid"><div class="form-field"><label class="required">LP name</label><input name="name" required></div><div class="form-field"><label>Investor type</label><select name="type"><option>Pension Fund</option><option>Family Office</option><option>Insurance</option><option>Fund of Funds</option><option>Development Finance Institution</option></select></div><div class="form-field"><label>Geography</label><input name="geography" value="Africa"></div><div class="form-field"><label>Commitment (USD)</label><input name="commitment" type="number" value="50000000"></div><div class="form-field"><label>Relationship owner</label><select name="owner"><option>Maya Moyo</option><option>Daniel Lunga</option><option>Aisha Chirwa</option><option>James Mbewe</option></select></div><div class="form-field"><label>Primary contact email</label><input name="email" type="email"></div></div></form>`,`${button('Cancel','close-modal')}${button('Start onboarding','submit-lp','primary','users')}`);
  }

  function submitLP() {
    const form = $('#lpForm');
    if (!form?.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const commitment = Number(data.commitment);
    const lp = { id:`LP-${String(lps.length+1).padStart(3,'0')}`, name:data.name, type:data.type, geography:data.geography, commitment, called:0, distributed:0, netIrr:0, owner:data.owner, lastInteraction:'Not contacted', kyc:'Not Started', portal:'Invited', unfunded:commitment, tvpi:0, dpi:0, color:'#2563eb' };
    lps.push(lp);
    closeOverlays(); toast('LP onboarding started', `${lp.name} was added to the directory.`); state.page='lps'; render();
  }

  function showCommunicationModal() {
    showModal('Send investor communication','Draft and schedule a secure LP communication.',`<form id="communicationForm"><div class="form-grid"><div class="form-field full"><label>Recipients</label><select><option>All active LPs (42)</option><option>Fund II LPs (12)</option><option>Selected LPs</option></select></div><div class="form-field full"><label>Subject</label><input value="Q2 2026 Portfolio Update"></div><div class="form-field full"><label>Message</label><textarea style="min-height:180px">Dear Limited Partner,\n\nPlease find attached the Q2 2026 portfolio update, including fund performance, portfolio-company developments and upcoming capital activity.\n\nKind regards,\nMatanho Investor Relations</textarea></div><div class="form-field"><label class="checkbox-row"><input type="checkbox" checked> Secure email</label></div><div class="form-field"><label class="checkbox-row"><input type="checkbox" checked> LP portal</label></div></div></form>`,`${button('Save draft','save-communication','','save')}${button('Send now','send-communication','primary','send')}`);
  }

  function revealActiveProfileTab() {
    requestAnimationFrame(() => {
      const strip = $('.profile-tabs');
      const active = strip ? $('.tab.active', strip) : null;
      if (!strip || !active) return;
      const target = Math.max(0, active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2);
      strip.scrollTo({ left: target, behavior: 'smooth' });
    });
  }


  function showDownloadMenu(anchor,id,kind='document') {
    const label=kind==='report'?'report':'document';
    showPopover(anchor,`<div class="popover-title">Download ${label}</div><button class="popover-item" data-action="download-format" data-id="${id}" data-format="pdf"><span class="download-format-icon pdf">${icon('file')}</span><span class="popover-item-copy"><strong>PDF document</strong><small>Portable, print-ready preview</small></span></button><button class="popover-item" data-action="download-format" data-id="${id}" data-format="xls"><span class="download-format-icon xls">${icon('bar-chart')}</span><span class="popover-item-copy"><strong>Excel workbook</strong><small>Structured data for analysis</small></span></button><button class="popover-item" data-action="download-format" data-id="${id}" data-format="csv"><span class="download-format-icon csv">${icon('list')}</span><span class="popover-item-copy"><strong>CSV data</strong><small>Open format for integrations</small></span></button>`,340);
  }

  function documentPreviewBody(doc) {
    if(doc.type==='XLSX'||doc.type==='CSV') return `<div class="spreadsheet-preview professional-sheet"><div class="spreadsheet-formula"><span>fx</span><strong>=SUM(B4:B11)</strong><em>Editable demonstration ledger</em></div><div class="spreadsheet-grid editable-sheet">${['','A','B','C','D','E'].map(x=>`<b>${x}</b>`).join('')}${Array.from({length:8},(_,r)=>`<b>${r+1}</b><span contenteditable="true">${['Metric','Revenue','EBITDA','Cash','Variance'][r%5]}</span><span contenteditable="true">${(12.4+r*3.2).toFixed(1)}</span><span contenteditable="true">${(10.1+r*2.7).toFixed(1)}</span><span class="positive" contenteditable="true">+${(2.3+r*.5).toFixed(1)}</span><span contenteditable="true">${r%2?'Reviewed':'Linked'}</span>`).join('')}</div><div class="sheet-tabs"><button class="active">Summary</button><button>Source data</button><button>Checks</button><button>Change log</button></div></div>`;
    if(doc.type==='DOCX') return `<div class="word-preview professional-document"><div class="word-toolbar">${icon('bold')}${icon('italic')}${icon('list')}${icon('link')}<span>Editable preview · changes remain local until saved</span></div><article contenteditable="true"><div class="document-letterhead"><div class="pdf-brand">MATANHO</div><small>Investment Management ERP</small></div><p class="document-classification">PRIVATE & CONFIDENTIAL · ${escapeHTML(doc.version)}</p><h1>${escapeHTML(doc.name.replace('.docx',''))}</h1><p class="document-lead">Controlled investment document prepared for authorised recipients.</p><h2>1. Purpose and scope</h2><p>This document records the agreed commercial, governance and closing terms for the proposed investment. Defined terms, conditions precedent and signature blocks remain version controlled.</p><h2>2. Principal terms</h2><table><tr><th>Investment</th><td>USD 18,000,000</td></tr><tr><th>Instrument</th><td>Preferred equity</td></tr><tr><th>Proposed ownership</th><td>17.5%</td></tr><tr><th>Status</th><td>Subject to final approvals</td></tr></table><h2>3. Governance and approvals</h2><p>All amendments are recorded in the document audit history and must be approved under the configured maker-checker route.</p></article></div>`;
    return `<div class="pdf-preview professional-document"><aside>${Array.from({length:Math.min(doc.pages||6,6)},(_,i)=>`<button class="pdf-thumbnail ${i===0?'active':''}" data-action="document-page" data-page="${i+1}"><span>${i+1}</span><div></div></button>`).join('')}</aside><div class="pdf-canvas"><article contenteditable="true"><div class="document-letterhead"><div class="pdf-brand">MATANHO</div><small>Investment Management ERP</small></div><p class="document-classification">${escapeHTML(doc.classification).toUpperCase()} · ${escapeHTML(doc.folder)} · ${escapeHTML(doc.version)}</p><h1>${escapeHTML(doc.name.replace('.pdf',''))}</h1><p class="document-lead">Controlled investment record · editable preview workspace</p><div class="pdf-summary-grid"><div><span>Fund</span><strong>Matanho Growth Fund II</strong></div><div><span>Prepared by</span><strong>${escapeHTML(doc.owner)}</strong></div><div><span>Document status</span><strong>${escapeHTML(doc.status)}</strong></div><div><span>Last updated</span><strong>${escapeHTML(doc.uploaded)}</strong></div></div><h2>Executive summary</h2><p>The current version consolidates approved investment, operational and governance information. Source references, review actions and publication controls are retained in the editable document ledger.</p><div class="pdf-chart-mock"><span style="height:42%"></span><span style="height:68%"></span><span style="height:54%"></span><span style="height:82%"></span><span style="height:74%"></span></div><h2>Review controls</h2><table class="professional-doc-table"><thead><tr><th>Control</th><th>Owner</th><th>Status</th><th>Evidence</th></tr></thead><tbody><tr><td>Source-data validation</td><td>${escapeHTML(doc.owner)}</td><td>Complete</td><td>4 linked records</td></tr><tr><td>Independent review</td><td>Fund Operations</td><td>In review</td><td>2 comments</td></tr><tr><td>Publication approval</td><td>Authorised approver</td><td>Pending</td><td>—</td></tr></tbody></table></article></div></div>`;
  }

  function showSignatureStudio(documentId='DOC-009',envelopeId=null) {
    const doc=documents.find(d=>d.id===documentId)||documents.find(d=>/Term Sheet/.test(d.name))||documents[0];
    const envelope=signatureEnvelopes.find(e=>e.id===envelopeId)||signatureEnvelopes.find(e=>e.documentId===doc.id)||signatureEnvelopes[0];
    state.selectedDocumentId=doc.id; state.selectedEnvelopeId=envelope.id;
    const recipients=envelope.recipients.map((r,i)=>`<button class="signature-recipient ${r[2]==='Signed'?'signed':r[2]==='Declined'?'declined':''}" data-action="select-signature-recipient" data-index="${i}">${personAvatar(r[0])}<span><strong>${escapeHTML(r[0])}</strong><small>${escapeHTML(r[1])}</small></span>${statusPill(r[2])}</button>`).join('');
    showModal('Signature Studio',`${doc.name} · ${envelope.id}`,`<div class="signature-studio"><aside class="signature-toolbox"><strong>Fields</strong><button class="signature-tool" data-action="add-signature-field">${icon('edit')} Signature</button><button class="signature-tool" data-action="add-initial-field">${icon('user-check')} Initials</button><button class="signature-tool" data-action="add-date-field">${icon('calendar')} Date signed</button><button class="signature-tool" data-action="add-text-field">${icon('file')} Text field</button><div class="signature-divider"></div><strong>Recipients</strong>${recipients}</aside><main class="signature-document"><div class="signature-document-toolbar"><span>Page 1 of ${doc.pages||8}</span><span>${icon('lock')} Encrypted · audit logged</span><button data-action="signature-zoom">100%</button></div><article class="signature-page"><div class="document-letterhead"><div class="pdf-brand">MATANHO</div><small>Investment Management ERP</small></div><p class="document-classification">TERM SHEET · SERIES B INVESTMENT · ${escapeHTML(doc.version)}</p><h1>Nova Analytics (Pvt) Ltd</h1><p class="document-lead">Non-binding summary of principal investment terms</p><div class="term-summary"><div><span>Investment</span><strong>USD 18,000,000</strong></div><div><span>Pre-money valuation</span><strong>USD 85,000,000</strong></div><div><span>Proposed ownership</span><strong>17.5%</strong></div></div><h2>Governance and investor protections</h2><p>The investor shall have the right to appoint one director and one non-voting observer, subject to the definitive agreements and agreed reserved matters.</p><h2>Electronic signatures</h2>${envelope.recipients.map((recipient,index)=>recipient[2]==='Signed'?`<div class="signature-field signed"><span>${escapeHTML(recipient[0])}</span><small>${escapeHTML(recipient[1])} · Signed with OTP authentication</small></div>`:`<button class="signature-field pending" data-action="sign-term-sheet" data-signer="${index}"><span>Click to sign for ${escapeHTML(recipient[0])}</span><small>${escapeHTML(recipient[1])}</small></button>`).join('')}</article></main><aside class="signature-inspector"><div class="signature-inspector-tabs"><button class="active">Prepare</button><button>Message</button><button>Review</button></div><div class="signature-inspector-body"><h3>Envelope settings</h3><div class="info-list"><div class="info-row"><span>Signing order</span><strong>Enabled</strong></div><div class="info-row"><span>Authentication</span><strong>Email + OTP</strong></div><div class="info-row"><span>Expiry</span><strong>${escapeHTML(envelope.expires)}</strong></div><div class="info-row"><span>Reminders</span><strong>Every 2 days</strong></div></div><h3 class="section-gap">Message</h3><div class="form-field"><label>Email subject</label><input value="Please sign: ${escapeHTML(envelope.subject)}"></div><div class="form-field section-gap"><label>Private message</label><textarea>Please review and electronically sign the attached investment document.</textarea></div><div class="reason-item section-gap">${icon('shield')}<div><strong>Electronic signature evidence</strong><small>Recipient, timestamp, consent, authentication and completion certificate are recorded.</small></div></div></div></aside></div>`,`${button('Save draft','save-signature-draft')}${button('Download certificate','download-signature-certificate','','download')}${button(envelope.status==='Completed'?'View completion':'Send envelope','send-signature-envelope','primary','send')}`,{variant:'signature',size:'fullscreen',eyebrow:'Secure e-signature'});
  }

  function showAccountDetail(id) {
    const a=cashAccounts.find(item=>item.id===id)||cashAccounts[0]; if(!a){toast('No cash accounts','Seed cash accounts to open this view.','warning');return;} state.selectedCashAccountId=a.id;
    showDrawer(`${a.id} · ${a.masked}`,`${a.fund} · ${a.vehicle}`,`<section class="drawer-account-hero"><div><span>${icon('bank')}</span><div><strong>${escapeHTML(a.provider)}</strong><small>${escapeHTML(String(a.purpose||'FUND_OPERATING_BANK').replaceAll('_',' '))} · ${escapeHTML(a.currency)}</small></div></div>${statusPill(a.status)}</section><section class="drawer-section"><div class="account-cash-grid"><div><span>Posted</span><strong>${formatMoney(a.posted,a.currency)}</strong></div><div><span>Settled</span><strong>${formatMoney(a.settled,a.currency)}</strong></div><div><span>Reserved</span><strong>${formatMoney(a.reserved,a.currency)}</strong></div><div><span>Held</span><strong>${formatMoney(a.held,a.currency)}</strong></div><div class="highlight"><span>Deployable</span><strong>${formatMoney(a.deployable,a.currency)}</strong></div><div><span>Distributable</span><strong>${formatMoney(a.distributable,a.currency)}</strong></div></div></section><section class="drawer-section"><h3>Ownership & Configuration</h3><div class="info-list"><div class="info-row"><span>Manager legal entity</span><strong>Matanho Capital Zimbabwe</strong></div><div class="info-row"><span>Fund / Vehicle</span><strong>${escapeHTML(a.fund)} / ${escapeHTML(a.vehicle)}</strong></div><div class="info-row"><span>Ownership model</span><strong>${escapeHTML(a.ownership)}</strong></div><div class="info-row"><span>Tolerance policy</span><strong>${escapeHTML(a.currency)}-CASH-STD · ${formatMoney(a.tolerance,a.currency)}</strong></div><div class="info-row"><span>GL mapping</span><strong>${escapeHTML(a.gl)}</strong></div><div class="info-row"><span>Last statement</span><strong>${escapeHTML(a.lastStatement)}</strong></div></div></section><section class="drawer-section"><h3>Reconciliation health</h3><div class="inline-progress">${progressBar(a.reconHealth)}<span>${a.reconHealth.toFixed(1)}%</span></div><div class="section-gap">${button('Open reconciliation','open-reconciliation-for-account','primary','refresh',`data-id="${a.id}"`)}</div></section>`,`${button('Explain balance','explain-cash-position','','info',`data-id="${a.id}"`)}${button('View ledger','navigate-cash-ledger','primary','list')}`,{variant:'operations',icon:'bank',eyebrow:'Fund cash account'});
  }

  function showCashExplanation(id=state.selectedCashAccountId) {
    const a=cashAccounts.find(item=>item.id===id)||cashAccounts[0]; if(!a){toast('No cash accounts','Seed cash accounts to open this view.','warning');return;}
    const components=[['Eligible settled cash',a.settled,'ledger lines'],['Reusable proceeds / credit',a.purpose==='PORTFOLIO_PROCEEDS'?8500000:0,'approved policy'],['Active reservations',-a.reserved,'reservation register'],['Compliance and operating holds',-a.held,'holds register'],['Pending payments / distributions',-Math.min(a.expectedOut,2400000),'expected movements'],['Minimum cash buffer',-Math.max(0,a.settled+a.reserved-a.deployable-a.held-Math.min(a.expectedOut,2400000)),'effective fund policy']];
    showModal('Explain Available Cash',`${a.fund} · ${a.masked} · ${a.currency} · as of ${state.asOfDate}`,`<div class="cash-explanation"><div class="formula-banner"><strong>Eligible settled cash + approved additions − reservations − holds − pending outflows − buffers</strong><span>Calculation version AVAIL-${a.currency}-v4</span></div><div class="cash-component-list">${components.map(([label,value,source],i)=>`<button data-action="cash-component-drill" data-component="${i}"><span>${label}<small>${source}</small></span><strong class="${value>=0?'positive':'negative'}">${formatMoney(value,a.currency)}</strong>${icon('chevron-right')}</button>`).join('')}</div><div class="cash-explanation-total"><span>Diagnostic available cash</span><strong>${formatMoney(a.deployable,a.currency)}</strong><small>Deployment-eligible amount is floored at zero; the diagnostic value remains available for controls.</small></div><div class="data-freshness">${icon('clock')} Ledger current · external statement last received ${escapeHTML(a.lastStatement)} · Africa/Harare</div></div>`,`${button('Export explanation','download-cash-explanation','','download',`data-id="${a.id}"`)}${button('Open underlying ledger','navigate-cash-ledger','primary','list')}`,{variant:'operations',size:'lg',eyebrow:'Reproducible cash calculation'});
  }

  function showJournalDetail(id) {
    const j=cashJournals.find(item=>item.id===id)||cashJournals[0];
    showDrawer(j.id,`${j.event} · ${j.source}`,`<section class="drawer-section"><div class="journal-status-banner">${icon('lock')}<div><strong>Posted journal is immutable</strong><small>Corrections use an authorised reversal and new corrected journal.</small></div>${statusPill(j.status)}</div></section><section class="drawer-section"><h3>Journal Header</h3><div class="info-list"><div class="info-row"><span>Fund / Account</span><strong>${escapeHTML(j.fund)} · ${escapeHTML(j.account)}</strong></div><div class="info-row"><span>Value date</span><strong>${escapeHTML(j.valueDate)}</strong></div><div class="info-row"><span>Maker / Checker</span><strong>${escapeHTML(j.maker)} / ${escapeHTML(j.checker)}</strong></div><div class="info-row"><span>Accounting</span><strong>${escapeHTML(j.accounting)}</strong></div></div></section><section class="drawer-section"><h3>Double-Entry Lines</h3><div class="journal-lines"><div><span>Investment / contribution control</span><b>${formatMoney(j.debit)}</b><b>—</b></div><div><span>Fund bank cash ${j.account}</span><b>—</b><b>${formatMoney(j.credit)}</b></div><div class="total"><span>Totals</span><b>${formatMoney(j.debit)}</b><b>${formatMoney(j.credit)}</b></div></div></section><section class="drawer-section"><h3>Evidence chain</h3><div class="trace-chain"><span>Source event<br><b>${escapeHTML(j.source)}</b></span>${icon('arrow-right')}<span>Journal<br><b>${escapeHTML(j.id)}</b></span>${icon('arrow-right')}<span>External match<br><b>${formatMoney(j.reconciled)}</b></span></div></section>`,`${button('Download evidence','download-journal-evidence','','download',`data-id="${j.id}"`)}${button('Create reversal request','request-journal-reversal','primary','refresh',`data-id="${j.id}"`)}`,{variant:'operations',icon:'list',eyebrow:'Immutable cash journal'});
  }

  function showImportReview(id) {
    const item=statementImports.find(i=>i.id===id)||statementImports[0];
    const preview=Array.from({length:10},(_,i)=>({line:i+2,rawDate:`${String(i+1).padStart(2,'0')}/07/26`,canonical:`2026-07-${String(i+1).padStart(2,'0')}`,rawSign:i%3?'CR':'DR',signed:i%3?1250000+i*50000:-(125000+i*2500),reference:i%3?`CALL MGF ${380+i}`:`FEE ${210+i}`}));
    showModal('Statement Import Review',`${item.id} · ${item.filename}`,`<div class="import-review"><header class="import-control-strip"><div><span>Provider / Parser</span><strong>${escapeHTML(item.provider)} · ${escapeHTML(item.parser)}</strong></div><div><span>Account / Period</span><strong>${escapeHTML(item.account)} · ${escapeHTML(item.period)}</strong></div><div><span>File hash</span><strong>71dc…b98f</strong></div><div><span>Duplicate control</span><strong>${statusPill(item.duplicate,item.duplicate==='Clear'?'success':'warning')}</strong></div></header><section class="import-balance-proof"><div><span>Opening balance</span><strong>${formatMoney(item.opening)}</strong></div><span>+</span><div><span>Signed movements</span><strong>${formatMoney(item.movements)}</strong></div><span>=</span><div><span>Closing balance</span><strong>${formatMoney(item.closing)}</strong></div><div class="proof-result">${icon(item.opening+item.movements===item.closing?'check-circle':'alert')}<strong>${item.opening+item.movements===item.closing?'Control total passes':'Control total fails'}</strong></div></section><section class="import-preview-table"><div class="table-toolbar"><div><h3>Raw-to-Canonical Mapping Preview</h3><p>Original provider values remain visible beside normalised Arcus values.</p></div>${statusPill(`${item.lines} staged lines`,'info')}</div><div class="table-wrap"><table><thead><tr><th>Line</th><th>Raw Date</th><th>Canonical Date</th><th>Raw Sign</th><th>Canonical Cash</th><th>Reference</th><th>Mapping</th></tr></thead><tbody>${preview.map(p=>`<tr><td>${p.line}</td><td>${p.rawDate}</td><td>${p.canonical}</td><td>${p.rawSign}</td><td class="${p.signed>=0?'positive':'negative'}">${formatMoney(p.signed)}</td><td>${p.reference}</td><td>${statusPill('Mapped','success')}</td></tr>`).join('')}</tbody></table></div></section><section class="import-errors"><div class="reason-item ${item.errors?'danger':''}">${icon(item.errors?'alert':'check-circle')}<div><strong>${item.errors?`${item.errors} blocking errors remain`:'No blocking line errors'}</strong><small>${item.errors?'Resolve account, sign or malformed-line errors before submission.':`${item.warnings} warning${item.warnings===1?'':'s'} require acknowledgement.`}</small></div></div><div class="info-list"><div class="info-row"><span>Staging version</span><strong>v3 · frozen after approval</strong></div><div class="info-row"><span>Maker</span><strong>Tendai Moyo</strong></div><div class="info-row"><span>Checker</span><strong>${item.status==='PENDING_APPROVAL'?'Rudo Ndlovu':'—'}</strong></div><div class="info-row"><span>Commit action</span><strong>Atomic and idempotent</strong></div></div></section></div>`,`${button('Download errors','download-import-errors','','download',`data-id="${item.id}"`)}${button('Reject batch','reject-import','','x',`data-id="${item.id}"`)}${button(item.status==='PENDING_APPROVAL'?'Approve & commit':'Submit for approval','submit-import-approval','primary','check',`data-id="${item.id}" ${item.errors?'disabled':''}`)}`,{variant:'import',size:'fullscreen',eyebrow:'External statement evidence'});
  }

  function showExceptionDetail(id) {
    const e=reconciliationExceptions.find(x=>x.id===id)||reconciliationExceptions[0];
    showDrawer(e.id,`${e.code.replaceAll('_',' ')} · ${e.batch}`,`<section class="exception-hero ${e.severity.toLowerCase()}"><div><span>Exposure</span><strong>${formatMoney(e.amount,e.currency)}</strong><small>${escapeHTML(e.account)} · ${e.age} days old</small></div>${statusPill(e.severity,e.severity==='Critical'||e.severity==='High'?'danger':e.severity==='Medium'?'warning':'info')}</section><section class="drawer-section"><h3>Investigation</h3><div class="info-list"><div class="info-row"><span>Status</span><strong>${statusPill(e.status)}</strong></div><div class="info-row"><span>Owner</span><strong>${escapeHTML(e.owner)}</strong></div><div class="info-row"><span>SLA due</span><strong>${escapeHTML(e.due)}</strong></div><div class="info-row"><span>Evidence</span><strong>${e.evidence} linked files</strong></div><div class="info-row"><span>Proposed resolution</span><strong>${escapeHTML(e.resolution)}</strong></div></div></section><section class="drawer-section"><h3>Activity</h3><div class="case-timeline"><div><span></span><strong>Exception created</strong><small>System · account/period controls recalculated</small></div><div><span></span><strong>Assigned to ${escapeHTML(e.owner)}</strong><small>Cash Operations · 31 Jul 2026</small></div><div><span></span><strong>Evidence requested</strong><small>Provider confirmation and source-event evidence</small></div></div></section><section class="drawer-section"><h3>Downstream impact</h3><div class="reason-item warning">${icon('alert')}<div><strong>July period close is blocked</strong><small>Resolution must be approved before this account can close.</small></div></div></section>`,`${button('Request evidence','exception-request-evidence','','send',`data-id="${e.id}"`)}${button('Propose resolution','exception-propose-resolution','primary','check',`data-id="${e.id}"`)}`,{variant:'approval',icon:'alert',eyebrow:'Reconciliation investigation'});
  }

  function showReportPreview(id,scheduled=null) {
    const base=reportVaultItems.find(r=>r.id===id)||reportVaultItems[0];
    const report=scheduled?{...base,name:`${scheduled.type} — ${scheduled.entity}`,fund:scheduled.fund,owner:scheduled.owner,status:scheduled.status,period:scheduled.due,generated:'Draft workspace',type:scheduled.type,recipients:scheduled.channel.includes('Portal')?38:12}:base;
    state.previewReportId=base.id;
    const sections=['Executive Summary','Fund Performance','Portfolio Review','Capital Activity','Valuation & NAV','Risk & Governance','ESG & Impact','Financial Statements','Source Data & Appendices'];
    const active=Math.min(state.previewReportSection,sections.length-1);
    const section=sections[active];
    const sectionBody={
      'Executive Summary':`<div class="report-executive-grid"><section><h2>Executive summary</h2><p>The portfolio continued to create value during the reporting period, supported by revenue growth, operational milestones and disciplined capital deployment. All reported metrics are linked to approved source records and the publication ledger.</p><div class="report-callout"><strong>Quarter highlights</strong><ul><li>Portfolio fair value increased 12.4% during the period.</li><li>Two investments progressed to signed term sheet.</li><li>Cash and reconciliation controls were 94.8% complete at period end.</li></ul></div></section><aside><h3>Key movements</h3><div class="info-list"><div class="info-row"><span>NAV movement</span><strong class="positive">+$18.7M</strong></div><div class="info-row"><span>Capital deployed</span><strong>$24.0M</strong></div><div class="info-row"><span>Distributions</span><strong>$8.5M</strong></div><div class="info-row"><span>FX impact</span><strong>($0.4M)</strong></div></div></aside></div>`,
      'Fund Performance':`<h2>Fund performance</h2><div class="report-preview-metrics"><div><span>Net IRR</span><strong>18.7%</strong></div><div><span>TVPI</span><strong>2.18x</strong></div><div><span>DPI</span><strong>0.62x</strong></div><div><span>NAV</span><strong>$168.4M</strong></div></div><div class="professional-report-chart"><div class="chart-axis-y"><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div><div class="chart-bars">${[92,108,124,139,151,168].map((value,index)=>`<span style="height:${value/2}px"><b>${value}</b><small>${['Q1 25','Q2 25','Q3 25','Q4 25','Q1 26','Q2 26'][index]}</small></span>`).join('')}</div></div>`,
      'Portfolio Review':`<h2>Portfolio company review</h2><table class="professional-report-table"><thead><tr><th>Company</th><th>Sector</th><th>Fair value</th><th>MOIC</th><th>Revenue growth</th><th>Health</th></tr></thead><tbody>${companies.slice(0,7).map(company=>`<tr><td>${escapeHTML(company.name)}</td><td>${escapeHTML(company.sector)}</td><td>${formatMoney(company.fairValue)}</td><td>${(company.fairValue/company.invested).toFixed(2)}x</td><td>${pct(company.revenueGrowth)}</td><td>${company.health}/100</td></tr>`).join('')}</tbody></table>`,
      'Capital Activity':`<h2>Capital activity</h2><table class="professional-report-table"><thead><tr><th>Date</th><th>Activity</th><th>Entity</th><th>Amount</th><th>Status</th></tr></thead><tbody><tr><td>03 Apr 2026</td><td>Capital call receipt</td><td>MGF II</td><td>$15.0M</td><td>Reconciled</td></tr><tr><td>18 May 2026</td><td>Investment disbursement</td><td>Nova Analytics</td><td>($12.0M)</td><td>Completed</td></tr><tr><td>28 Jun 2026</td><td>Portfolio proceeds</td><td>Opportunity Fund</td><td>$8.5M</td><td>Received</td></tr></tbody></table>`,
      'Valuation & NAV':`<h2>Valuation and NAV bridge</h2><div class="nav-bridge">${[['Opening NAV','$149.7M'],['Investments','+$24.0M'],['Fair-value movement','+$11.2M'],['Distributions','−$8.5M'],['Expenses & FX','−$8.0M'],['Closing NAV','$168.4M']].map((item,index)=>`<div class="${index===5?'total':''}"><span>${item[0]}</span><strong>${item[1]}</strong></div>`).join('')}</div>`,
      'Risk & Governance':`<h2>Risk and governance</h2><div class="report-risk-grid"><div><strong>Portfolio concentration</strong><span>Medium</span><p>Largest single-company exposure represents 17.8% of fair value.</p></div><div><strong>Liquidity</strong><span>Low</span><p>Available deployable cash covers approved twelve-month commitments.</p></div><div><strong>Reporting quality</strong><span>Medium</span><p>Two company reports remain overdue and are under active remediation.</p></div></div>`,
      'ESG & Impact':`<h2>ESG and impact</h2><div class="report-preview-metrics"><div><span>Jobs supported</span><strong>3,842</strong></div><div><span>Women in leadership</span><strong>41%</strong></div><div><span>Renewable capacity</span><strong>62 MW</strong></div><div><span>SMEs served</span><strong>18,240</strong></div></div><p>Impact indicators are reported under the approved measurement framework and remain source-linked to portfolio submissions.</p>`,
      'Financial Statements':`<h2>Condensed financial statements</h2><table class="professional-report-table"><thead><tr><th>USD millions</th><th>Q2 2026</th><th>Q1 2026</th><th>Variance</th></tr></thead><tbody><tr><td>Investments at fair value</td><td>168.4</td><td>151.2</td><td class="positive">+17.2</td></tr><tr><td>Cash and equivalents</td><td>94.8</td><td>86.3</td><td class="positive">+8.5</td></tr><tr><td>Other assets</td><td>4.7</td><td>5.1</td><td>(0.4)</td></tr><tr><td>Liabilities</td><td>(12.2)</td><td>(10.8)</td><td>(1.4)</td></tr><tr class="total"><td>Net assets</td><td>255.7</td><td>231.8</td><td class="positive">+23.9</td></tr></tbody></table>`,
      'Source Data & Appendices':`<h2>Source data and appendices</h2><table class="professional-report-table"><thead><tr><th>Dataset</th><th>Version</th><th>Owner</th><th>Freshness</th><th>Control</th></tr></thead><tbody><tr><td>Portfolio valuation model</td><td>VAL-Q2-v3.1</td><td>Laura Chen</td><td>21 Jul 2026</td><td>Approved</td></tr><tr><td>Cash subledger snapshot</td><td>CASH-0731-v4</td><td>Tendai Moyo</td><td>31 Jul 2026</td><td>Reconciled</td></tr><tr><td>Company KPI submissions</td><td>KPI-Q2-v7</td><td>Portfolio Team</td><td>18 Jul 2026</td><td>2 exceptions</td></tr></tbody></table>`
    }[section];
    showModal('Report Preview',`${report.name} · ${report.version}`,`<div class="report-preview-shell professional-report"><aside><strong>Report outline</strong>${sections.map((name,index)=>`<button class="${index===active?'active':''}" data-action="report-preview-section" data-section="${index}" data-id="${base.id}"><span>${index+1}</span>${name}${index<=5?icon('check-circle'):icon('clock')}</button>`).join('')}</aside><main><article contenteditable="true"><div class="report-cover-header"><div class="document-letterhead"><div class="pdf-brand">MATANHO</div><small>Investment Management ERP</small></div><span>${escapeHTML(report.classification).toUpperCase()}</span></div><small>${escapeHTML(report.type)} · ${escapeHTML(report.period)}</small><h1>${escapeHTML(report.name)}</h1><p class="document-lead">Prepared for authorised recipients · editable publication workspace</p><div class="report-section-header"><span>${String(active+1).padStart(2,'0')}</span><div><small>Current section</small><strong>${section}</strong></div></div>${sectionBody}<footer class="report-page-footer"><span>${escapeHTML(report.version)} · ${escapeHTML(report.generated)}</span><span>Page ${active+1} of ${sections.length}</span></footer></article></main><aside class="report-preview-inspector"><strong>Publication ledger</strong><div class="info-list"><div class="info-row"><span>Status</span><strong>${statusPill(report.status)}</strong></div><div class="info-row"><span>Owner</span><strong>${escapeHTML(report.owner)}</strong></div><div class="info-row"><span>Generated</span><strong>${escapeHTML(report.generated)}</strong></div><div class="info-row"><span>Recipients</span><strong>${report.recipients}</strong></div><div class="info-row"><span>Pages</span><strong>${report.pages}</strong></div><div class="info-row"><span>Template</span><strong>Institutional v8</strong></div></div><div class="section-gap">${button('Edit publication ledger','edit-report-ledger','primary','list',`data-id="${base.id}"`)}</div><div class="reason-item section-gap">${icon('shield')}<div><strong>Controlled draft</strong><small>Edits are local until saved as a new version. Distribution and downloads remain audit logged.</small></div></div></aside></div>`,`${button('Download PDF','download-report-format','','download',`data-id="${base.id}" data-format="pdf"`)}${button('Export Excel','download-report-format','','bar-chart',`data-id="${base.id}" data-format="xls"`)}${button('Save edited draft','save-report-preview','','save',`data-id="${base.id}"`)}${button('Open report builder','open-report-builder','primary','edit')}`,{variant:'document',size:'fullscreen',eyebrow:'Professional report template'});
  }


  function showCloseControlDetail(id) {
    const control=closeControls.find(item=>item.id===id)||closeControls[0];
    const trend=[8,6,7,4,5,control.passed?0:Math.max(1,control.records.length)];
    const rows=control.records.map(row=>`<tr>${row.map((cell,index)=>`<td class="${String(cell).includes('Blocker')||String(cell).includes('breached')?'negative':String(cell).includes('Pass')?'positive':''}">${escapeHTML(String(cell))}</td>`).join('')}</tr>`).join('');
    showModal(control.title,`${control.id} · ${control.category} · updated ${control.updated}`,`<div class="close-control-detail"><header class="close-control-detail-hero ${control.passed?'passed':'blocked'}"><div><span>${icon(control.passed?'check-circle':'alert')}</span><div><small>Control result</small><strong>${control.passed?'Passed':'Close blocker'}</strong><p>${escapeHTML(control.detail)}</p></div></div><div><span>Exposure</span><strong>${control.amount?formatMoney(control.amount,control.currency):'Non-monetary'}</strong>${statusPill(control.severity,control.passed?'success':control.severity==='Critical'||control.severity==='High'?'danger':'warning')}</div></header><section class="close-control-grid"><article class="card"><div class="card-head"><div><h3>Control logic & ownership</h3><p>The exact rule and effective source used by the close service.</p></div></div><div class="card-body info-list"><div class="info-row"><span>Rule</span><strong>${escapeHTML(control.rule)}</strong></div><div class="info-row"><span>Rule source</span><strong>${escapeHTML(control.source)}</strong></div><div class="info-row"><span>Owner</span><strong>${escapeHTML(control.owner)}</strong></div><div class="info-row"><span>Due</span><strong>${escapeHTML(control.due)}</strong></div></div></article><article class="card"><div class="card-head"><div><h3>Six-period exception trend</h3><p>Open records contributing to this control.</p></div></div><div class="card-body"><div class="close-trend-chart">${trend.map((value,index)=>`<button data-action="close-trend-period" data-value="${value}"><span style="height:${Math.max(8,value*12)}px"></span><b>${value}</b><small>${['Feb','Mar','Apr','May','Jun','Jul'][index]}</small></button>`).join('')}</div></div></article></section><section class="card table-card section-gap"><div class="table-toolbar"><div><h3>Source records and calculation detail</h3><p>Click related evidence to trace the blocker to its originating record.</p></div>${button('Export control data','download-close-control','','download',`data-id="${control.id}"`)}</div><div class="table-wrap"><table><thead><tr><th>Record / Measure</th><th>Source / Value</th><th>Status / Basis</th><th>Timing / Result</th><th>Control outcome</th></tr></thead><tbody>${rows}</tbody></table></div></section><section class="close-control-bottom section-gap"><article class="card"><div class="card-head"><div><h3>Evidence lineage</h3><p>Immutable records supporting the control outcome.</p></div></div><div class="card-body evidence-link-list">${control.evidence.map((item,index)=>`<button data-action="close-evidence" data-control="${control.id}" data-index="${index}">${icon(index%2?'file':'link')}<span><strong>${escapeHTML(item)}</strong><small>Checksum and access activity retained</small></span>${icon('chevron-right')}</button>`).join('')}</div></article><article class="card"><div class="card-head"><div><h3>Remediation checklist</h3><p>Required steps before the control can pass.</p></div></div><div class="card-body remediation-list">${control.remediation.map((item,index)=>`<label><input type="checkbox" ${control.passed||index===0&&control.severity==='Info'?'checked':''}><span>${escapeHTML(item)}</span></label>`).join('')}</div></article></section></div>`,`${button('Open related workspace',control.category==='Matching'?'navigate-reconciliation-workspace':control.category==='Exceptions'?'navigate-exceptions':'close-control-related','','external-link',`data-id="${control.id}"`)}${button('Download evidence','download-close-control','','download',`data-id="${control.id}"`)}${button('Close','close-modal','primary')}`,{variant:'operations',size:'fullscreen',eyebrow:'Period-close control drill-down'});
  }

  function showDocumentLedgerEditor(id) {
    const doc=documents.find(item=>item.id===id)||documents[0];
    showModal('Edit Document Ledger',`${doc.id} · ${doc.name}`,`<form id="documentLedgerForm"><input type="hidden" name="id" value="${doc.id}"><div class="ledger-editor-grid"><section><h3>Identity & classification</h3><div class="form-grid"><div class="form-field full"><label>Document title</label><input name="name" value="${escapeHTML(doc.name)}"></div><div class="form-field"><label>Folder</label><input name="folder" value="${escapeHTML(doc.folder)}"></div><div class="form-field"><label>Version</label><input name="version" value="${escapeHTML(doc.version)}"></div><div class="form-field"><label>Classification</label><select name="classification"><option ${doc.classification==='Internal confidential'?'selected':''}>Internal confidential</option><option ${doc.classification==='Confidential'?'selected':''}>Confidential</option><option>Restricted</option></select></div><div class="form-field"><label>Access</label><select name="access"><option ${doc.access==='Internal'?'selected':''}>Internal</option><option ${doc.access.includes('External')?'selected':''}>Internal / External</option><option>Restricted</option></select></div></div></section><section><h3>Control & publication</h3><div class="form-grid"><div class="form-field"><label>Owner</label><input name="owner" value="${escapeHTML(doc.owner)}"></div><div class="form-field"><label>Status</label><select name="status"><option ${doc.status==='Verified'?'selected':''}>Verified</option><option ${doc.status==='In review'?'selected':''}>In review</option><option ${doc.status==='Needs update'?'selected':''}>Needs update</option><option>Draft</option></select></div><div class="form-field"><label>Signature status</label><select name="signatureStatus"><option ${doc.signatureStatus==='Not required'?'selected':''}>Not required</option><option ${doc.signatureStatus==='Awaiting signature'?'selected':''}>Awaiting signature</option><option ${doc.signatureStatus==='Partially signed'?'selected':''}>Partially signed</option><option>Completed</option></select></div><div class="form-field"><label>Retention</label><input name="retention" value="${escapeHTML(doc.retention)}"></div><div class="form-field full"><label>Source reference</label><input name="sourceReference" value="${doc.id}-SRC-${doc.version.replace('.','')}"></div></div></section></div><section class="ledger-audit-table section-gap"><h3>Editable document ledger</h3><div class="table-wrap"><table><thead><tr><th>Version</th><th>Effective date</th><th>Prepared by</th><th>Reviewed by</th><th>Change reason</th><th>Checksum</th></tr></thead><tbody><tr><td contenteditable="true">${doc.version}</td><td contenteditable="true">${doc.uploaded}</td><td contenteditable="true">${doc.owner}</td><td contenteditable="true">Fund Operations</td><td contenteditable="true">Current approved working version</td><td>71dc…b98f</td></tr><tr><td contenteditable="true">v${Math.max(1,parseFloat(doc.version.slice(1))-.1).toFixed(1)}</td><td contenteditable="true">08 Jul 2026</td><td contenteditable="true">Legal Team</td><td contenteditable="true">Investment Director</td><td contenteditable="true">Updated commercial terms</td><td>4d02…891a</td></tr></tbody></table></div></section></form>`,`${button('Cancel','close-modal')}${button('Preview document','preview-document','','eye',`data-id="${doc.id}"`)}${button('Save ledger','save-document-ledger','primary','save')}`,{variant:'document',size:'lg',eyebrow:'Editable document register'});
  }

  function saveDocumentLedger() {
    const form=$('#documentLedgerForm'); if(!form?.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form));
    const doc=documents.find(item=>item.id===data.id); if(doc) Object.assign(doc,data,{uploaded:'01 Aug 2026 · just now'});
    closeOverlays(); toast('Document ledger updated',`${doc?.name||'Document'} metadata and version ledger were saved.`); render();
  }

  function showReportLedgerEditor(id) {
    const report=reportVaultItems.find(item=>item.id===id)||reportVaultItems[0];
    showModal('Edit Report Publication Ledger',`${report.id} · ${report.name}`,`<form id="reportLedgerForm"><input type="hidden" name="id" value="${report.id}"><div class="ledger-editor-grid"><section><h3>Report identity</h3><div class="form-grid"><div class="form-field full"><label>Report title</label><input name="name" value="${escapeHTML(report.name)}"></div><div class="form-field"><label>Fund</label><input name="fund" value="${escapeHTML(report.fund)}"></div><div class="form-field"><label>Period</label><input name="period" value="${escapeHTML(report.period)}"></div><div class="form-field"><label>Type</label><input name="type" value="${escapeHTML(report.type)}"></div><div class="form-field"><label>Version</label><input name="version" value="${escapeHTML(report.version)}"></div></div></section><section><h3>Publication control</h3><div class="form-grid"><div class="form-field"><label>Owner</label><input name="owner" value="${escapeHTML(report.owner)}"></div><div class="form-field"><label>Status</label><select name="status"><option ${report.status==='Published'?'selected':''}>Published</option><option ${report.status==='Approved'?'selected':''}>Approved</option><option ${report.status==='In Review'?'selected':''}>In Review</option><option ${report.status==='Draft'?'selected':''}>Draft</option></select></div><div class="form-field"><label>Classification</label><select name="classification"><option ${report.classification==='Confidential'?'selected':''}>Confidential</option><option ${report.classification==='Restricted'?'selected':''}>Restricted</option><option ${report.classification==='Internal'?'selected':''}>Internal</option></select></div><div class="form-field"><label>Recipients</label><input name="recipients" type="number" value="${report.recipients}"></div><div class="form-field full"><label>Distribution channel</label><input value="Secure email · LP portal · controlled download"></div></div></section></div><section class="ledger-audit-table section-gap"><h3>Publication and source-data ledger</h3><div class="table-wrap"><table><thead><tr><th>Dataset / Section</th><th>Source version</th><th>Owner</th><th>Validation</th><th>Last refreshed</th><th>Included</th></tr></thead><tbody><tr><td contenteditable="true">Portfolio valuations</td><td contenteditable="true">VAL-Q2-v3.1</td><td contenteditable="true">Laura Chen</td><td>Approved</td><td>21 Jul 2026</td><td><input type="checkbox" checked></td></tr><tr><td contenteditable="true">Fund cash position</td><td contenteditable="true">CASH-0731-v4</td><td contenteditable="true">Tendai Moyo</td><td>Reconciled</td><td>31 Jul 2026</td><td><input type="checkbox" checked></td></tr><tr><td contenteditable="true">Portfolio KPIs</td><td contenteditable="true">KPI-Q2-v7</td><td contenteditable="true">Portfolio Team</td><td>2 exceptions</td><td>18 Jul 2026</td><td><input type="checkbox" checked></td></tr></tbody></table></div></section></form>`,`${button('Cancel','close-modal')}${button('Preview report','preview-vault-report','','eye',`data-id="${report.id}"`)}${button('Save publication ledger','save-report-ledger','primary','save')}`,{variant:'document',size:'lg',eyebrow:'Editable report ledger'});
  }

  function saveReportLedger() {
    const form=$('#reportLedgerForm'); if(!form?.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form));
    const report=reportVaultItems.find(item=>item.id===data.id); if(report) Object.assign(report,data,{recipients:Number(data.recipients),generated:'01 Aug 2026 · just now'});
    closeOverlays(); toast('Publication ledger updated',`${report?.name||'Report'} was saved as an editable working version.`); render();
  }

  function showCalendarEvent(id) {
    const event=reportingCalendarEvents.find(item=>item.id===id)||reportingCalendarEvents[0];
    const report=reports.find(item=>item.id===event.reportId)||reports[0];
    showDrawer(event.title,`${event.type} · ${event.date}`,`<section class="calendar-event-hero"><span>${icon('calendar')}</span><div><strong>${escapeHTML(event.title)}</strong><small>${escapeHTML(event.owner)} · ${escapeHTML(event.channel)}</small></div>${statusPill(event.status)}</section><section class="drawer-section"><h3>Reporting obligation</h3><div class="info-list"><div class="info-row"><span>Fund</span><strong>${escapeHTML(report.fund)}</strong></div><div class="info-row"><span>Entity</span><strong>${escapeHTML(report.entity)}</strong></div><div class="info-row"><span>Frequency</span><strong>${escapeHTML(report.frequency)}</strong></div><div class="info-row"><span>Draft progress</span><strong>${report.progress}%</strong></div><div class="info-row"><span>Delivery</span><strong>${escapeHTML(report.channel)}</strong></div></div></section><section class="drawer-section"><h3>Milestones</h3><div class="case-timeline"><div><span></span><strong>Data collection</strong><small>Complete</small></div><div><span></span><strong>Draft review</strong><small>${report.progress>=60?'In progress':'Not started'}</small></div><div><span></span><strong>Approval and publication</strong><small>Pending</small></div></div></section>`,`${button('Preview report','preview-scheduled-report','','eye',`data-id="${report.id}"`)}${button('Edit schedule','new-report-schedule','primary','edit')}`,{variant:'operations',icon:'calendar',eyebrow:'Interactive reporting calendar'});
  }

  function showTermSigningConfirmation() {
    const envelope=signatureEnvelopes.find(item=>item.documentId==='DOC-009')||signatureEnvelopes[0];
    const pendingIndex=envelope.recipients.findIndex(recipient=>recipient[2]!=='Signed');
    const signer=envelope.recipients[pendingIndex]||envelope.recipients[0];
    showModal('Sign Term Sheet',`${envelope.subject} · ${envelope.id}`,`<div class="term-sign-confirmation"><section class="sign-document-summary"><div class="document-letterhead"><div class="pdf-brand">MATANHO</div><small>Investment Management ERP</small></div><span class="document-classification">TERM SHEET · VERSION 4.0</span><h2>Nova Analytics Series B</h2><div class="term-summary"><div><span>Investment</span><strong>USD 18.0M</strong></div><div><span>Pre-money</span><strong>USD 85.0M</strong></div><div><span>Ownership</span><strong>17.5%</strong></div></div><p>By signing, the signatory confirms that they have reviewed the current controlled version and consent to use an electronic signature.</p></section><form id="termSignatureForm"><input type="hidden" name="signerIndex" value="${pendingIndex}"><div class="form-field"><label>Signatory</label><input value="${escapeHTML(signer[0])}" readonly></div><div class="form-field"><label>Role</label><input value="${escapeHTML(signer[1])}" readonly></div><div class="form-field"><label class="required">Type full legal name</label><input name="legalName" required placeholder="${escapeHTML(signer[0])}"></div><div class="signature-draw-pad"><span>Electronic signature preview</span><strong>${escapeHTML(signer[0])}</strong><small>Authenticated by secure email + OTP · 01 Aug 2026 CAT</small></div><label class="checkbox-row section-gap"><input id="termSignConsent" type="checkbox"> I have reviewed the current term sheet and consent to apply my electronic signature.</label><div class="reason-item section-gap">${icon('shield')}<div><strong>Completion evidence</strong><small>Document hash, signer identity, consent, timestamp, authentication and IP metadata will be included in the certificate.</small></div></div></form></div>`,`${button('Cancel','close-modal')}${button('Open full Signature Studio','open-signature-studio','','external-link','data-id="DOC-009"')}${button('Apply signature','confirm-term-signature','primary','edit')}`,{variant:'signature',size:'lg',eyebrow:'Electronic consent and signature'});
  }

  function handleAction(action, trigger, event) {
    switch (action) {
      case 'go-home': navigate('dashboard'); break;
      case 'toggle-sidebar': state.sidebarCollapsed = !state.sidebarCollapsed; storage.set('matanho-portfolio-sidebar',state.sidebarCollapsed?'collapsed':'expanded'); render(); break;
      case 'toggle-mobile-nav': state.mobileNavOpen = !state.mobileNavOpen; sidebar.classList.toggle('mobile-open',state.mobileNavOpen); scrim.classList.toggle('visible',state.mobileNavOpen); break;
      case 'navigate': navigate(trigger.dataset.page); break;
      case 'open-deal': if (event.type === 'click') openDeal(trigger.dataset.dealId || trigger.dataset.id); break;
      case 'open-company': openCompany(trigger.dataset.id); break;
      case 'open-fund': openFund(trigger.dataset.id); break;
      case 'open-lp': openLP(trigger.dataset.id); break;
      case 'open-capital-call': openCapitalCall(trigger.dataset.id); break;
      case 'open-cash-account': showAccountDetail(trigger.dataset.id); break;
      case 'explain-cash-position': showCashExplanation(trigger.dataset.id); break;
      case 'open-journal': showJournalDetail(trigger.dataset.id); break;
      case 'open-reservation': showDrawer(trigger.dataset.id,'Reservation detail and lifecycle',`<section class="drawer-section"><div class="reason-item">${icon('lock')}<div><strong>Availability commitment</strong><small>Reservation reduces deployable cash without changing the posted ledger.</small></div></div></section><section class="drawer-section"><h3>Controlled actions</h3><div class="action-grid">${button('Extend','reservation-extend','','calendar')}${button('Release','reservation-release','','unlock')}${button('Trace source','reservation-trace','primary','link')}</div></section>`,button('Close','close-drawer','primary'),{variant:'operations',icon:'lock'}); break;
      case 'review-statement-import': showImportReview(trigger.dataset.id); break;
      case 'open-reconciliation': state.selectedReconciliationId=trigger.dataset.id; navigate('reconciliation-workspace'); break;
      case 'expand-reconciliation-comparison': showExpandedReconciliationComparison(); break;
      case 'upload-bank-statement-modal': showUploadBankStatementModal(); break;
      case 'stage-uploaded-statement': if(!state.uploadedStatementName){toast('Choose a file first','Select a CSV, Excel or Word bank statement before validation.','warning');}else{closeOverlays();toast('Statement staged',`${state.uploadedStatementName} passed the demonstration file, account and duplicate checks.`);render();} break;
      case 'select-recon-line': showRecordMetadata(trigger.dataset.side==='external'?'statement-line':'journal-line',trigger.dataset.id); break;
      case 'open-reconciliation-for-account': { const batch=reconciliationBatches.find(r=>r.account.startsWith(trigger.dataset.id)); state.selectedReconciliationId=batch?.id||reconciliationBatches[0].id; closeOverlays(); navigate('reconciliation-workspace'); break; }
      case 'open-recon-exception': showExceptionDetail(trigger.dataset.id); break;
      case 'open-close-control': showCloseControlDetail(trigger.dataset.id); break;
      case 'download-close-control': { const control=closeControls.find(item=>item.id===trigger.dataset.id)||closeControls[0]; exportCSV(`${control.id}-${control.title.replaceAll(' ','-')}.csv`,[['Control','Status','Owner','Due','Rule','Source'],[control.title,control.passed?'Passed':'Blocker',control.owner,control.due,control.rule,control.source],[],['Record 1','Record 2','Record 3','Record 4','Record 5'],...control.records]); break; }
      case 'close-evidence': showRecordMetadata('close-evidence',`${trigger.dataset.control}:${trigger.dataset.index}`); break;
      case 'close-control-related': showRecordMetadata('close-control',trigger.dataset.id); break;
      case 'close-trend-period': softFocus(trigger); break;
      case 'open-envelope': { const env=signatureEnvelopes.find(e=>e.id===trigger.dataset.id)||signatureEnvelopes[0]; showSignatureStudio(env.documentId,env.id); break; }
      case 'open-signature-studio': showSignatureStudio(trigger.dataset.id); break;
      case 'preview-vault-report': showReportPreview(trigger.dataset.id); break;
      case 'edit-document-ledger': showDocumentLedgerEditor(trigger.dataset.id); break;
      case 'save-document-ledger': saveDocumentLedger(); break;
      case 'edit-report-ledger': showReportLedgerEditor(trigger.dataset.id); break;
      case 'save-report-ledger': saveReportLedger(); break;
      case 'save-report-preview': toast('Report draft saved','Editable report content was saved as a new controlled working version.'); break;
      case 'report-preview-section': state.previewReportSection=Number(trigger.dataset.section||0); showReportPreview(trigger.dataset.id||state.previewReportId); break;
      case 'preview-scheduled-report': showScheduledReportPreview(trigger.dataset.id); break;
      case 'calendar-day': state.selectedCalendarDate=trigger.dataset.date||state.selectedCalendarDate; render(); break;
      case 'calendar-prev': { const d=new Date(state.reportingMonth+'-01T12:00:00'); d.setMonth(d.getMonth()-1); state.reportingMonth=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; state.selectedCalendarDate=`${state.reportingMonth}-01`; render(); break; }
      case 'calendar-next': { const d=new Date(state.reportingMonth+'-01T12:00:00'); d.setMonth(d.getMonth()+1); state.reportingMonth=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; state.selectedCalendarDate=`${state.reportingMonth}-01`; render(); break; }
      case 'calendar-today': state.reportingMonth='2026-08'; state.selectedCalendarDate='2026-08-01'; render(); break;
      case 'open-calendar-event': showCalendarEvent(trigger.dataset.id); break;
      case 'deal-view': state.dealView=trigger.dataset.view||'list'; render(); break;
      case 'deal-calendar-day': showRecordMetadata('deal-calendar',`Day ${trigger.dataset.day}`); break;
      case 'deal-tab': state.dealTab = trigger.dataset.tab || trigger.dataset.dataTab || 'overview'; render(); break;
      case 'term-section': state.termSection=Number(trigger.dataset.section||0); render(); break;
      case 'sign-term-sheet': showTermSigningConfirmation(); break;
      case 'confirm-term-signature': { const form=$('#termSignatureForm'); if(!form?.reportValidity()) break; if(!$('#termSignConsent')?.checked){toast('Consent required','Confirm that the signatory reviewed the current term sheet.','warning');break;} const envelope=signatureEnvelopes.find(item=>item.documentId==='DOC-009'); const index=Number(new FormData(form).get('signerIndex')); if(envelope&&envelope.recipients[index]) envelope.recipients[index][2]='Signed'; if(envelope){envelope.progress=Math.round(envelope.recipients.filter(r=>r[2]==='Signed').length/envelope.recipients.length*100);envelope.status=envelope.progress===100?'Completed':'Waiting for others';} const doc=documents.find(item=>item.id==='DOC-009'); if(doc) doc.signatureStatus=envelope?.status==='Completed'?'Completed':'Partially signed'; closeOverlays();toast('Term sheet signed','Electronic consent, signature evidence and the controlled document hash were recorded.');render();break;}
      case 'open-term-clause': showTermClauseDrawer(trigger.dataset.section,trigger.dataset.clause); break;
      case 'company-profile-tab': state.companyTab = trigger.dataset.tab || 'overview'; render(); revealActiveProfileTab(); break;
      case 'fund-profile-tab': state.fundTab = trigger.dataset.tab || 'overview'; render(); revealActiveProfileTab(); break;
      case 'lp-profile-tab': state.lpTab = trigger.dataset.tab || 'overview'; render(); revealActiveProfileTab(); break;
      case 'back-to-deals': navigate('deals'); break;
      case 'open-applicant-portal': navigate('applicant-portal'); break;
      case 'open-report-builder': navigate('report-builder'); break;
      case 'open-report-review': navigate('report-builder'); break;
      case 'add-deal': showAddDealModal(trigger.dataset.stage || 'Sourcing'); break;
      case 'submit-add-deal': submitAddDeal(); break;
      case 'new-capital-call': showCapitalCallModal(); break;
      case 'submit-capital-call': submitCapitalCall(); break;
      case 'add-company': showCompanyModal(); break;
      case 'submit-company': submitCompany(); break;
      case 'add-lp': showLPModal(); break;
      case 'submit-lp': submitLP(); break;
      case 'new-communication': showCommunicationModal(); break;
      case 'open-mailer-list': showMailerListDrawer(trigger.dataset.id); break;
      case 'create-mailer-list': showCreateMailerListModal(); break;
      case 'submit-mailer-list': submitMailerList(); break;
      case 'mailer-new-campaign': showMailerCampaignModal(trigger.dataset.id); break;
      case 'preview-mailer-audience': toast('Audience preview ready','24 deduplicated recipients meet the current source and consent rules.'); break;
      case 'mailer-add-rule': softFocus(trigger.closest('.rule-builder')); break;
      case 'schedule-mailer-campaign': closeOverlays(); toast('Campaign scheduled','The message will be delivered after approval to the selected governed audience.'); break;
      case 'save-mailer-campaign': closeOverlays(); toast('Campaign saved','The mailer campaign remains in Draft.'); break;
      case 'edit-mailer-list': closeOverlays(); showCreateMailerListModal(); break;
      case 'export-mailer-list': { const list=mailerLists.find(item=>item.id===trigger.dataset.id)||mailerLists[0]; exportCSV(`${list.id}-${list.name.replaceAll(' ','-')}.csv`,[['Name','Email','Role','Status'],['Tendai Moyo','tendai@example.com','Primary contact','Verified'],['Chipo Ndlovu','chipo@example.com','Finance contact','Verified'],['Rudo Sibanda','rudo@example.com','Authorised signatory','Pending review']]); break; }
      case 'export-mailer-lists': exportCSV('matanho-mailer-lists.csv',[['ID','Name','Source','Members','Active','Pending','Bounced','Owner','Status'],...mailerLists.map(list=>[list.id,list.name,list.source,list.members,list.active,list.pending,list.bounced,list.owner,list.status])]); break;
      case 'send-communication': closeOverlays(); toast('Communication queued','The investor update was queued for secure email and the LP portal.'); break;
      case 'save-communication': closeOverlays(); toast('Draft saved','The communication remains in Draft status.'); break;
      case 'close-overlays': closeOverlays(); state.mobileNavOpen=false; sidebar.classList.remove('mobile-open'); break;
      case 'close-drawer': drawer.classList.remove('open'); drawer.innerHTML=''; scrim.classList.remove('visible'); state.drawer=null; break;
      case 'close-modal': modalLayer.classList.remove('visible'); modalLayer.innerHTML=''; scrim.classList.remove('visible'); state.modal=null; break;
      case 'close-toast': $(`#${trigger.dataset.id}`)?.remove(); break;
      case 'toggle-theme': state.theme = state.theme === 'light' ? 'dark' : 'light'; storage.set('matanho-portfolio-theme',state.theme); render(); toast('Theme changed',`${state.theme[0].toUpperCase()+state.theme.slice(1)} mode is now active.`); break;
      case 'open-search': openCommandPalette(); break;
      case 'command-result': {
        const resultAction = trigger.dataset.resultAction;
        if (trigger.dataset.page) navigate(trigger.dataset.page);
        else if (resultAction === 'open-deal') openDeal(trigger.dataset.id);
        else if (resultAction === 'open-company') openCompany(trigger.dataset.id);
        else if (resultAction === 'open-fund') openFund(trigger.dataset.id);
        else if (resultAction === 'open-lp') openLP(trigger.dataset.id);
        break;
      }
      case 'notifications': showNotifications(trigger); break;
      case 'activity-menu': showActivityMenu(trigger,trigger.dataset.context,trigger.dataset.id); break;
      case 'activity-open-timeline': closeOverlays(); showActivityTimeline(trigger.dataset.context,trigger.dataset.id); break;
      case 'activity-open-metadata': closeOverlays(); showRecordMetadata(trigger.dataset.context,trigger.dataset.id); break;
      case 'activity-add-note': closeOverlays(); showSimpleCommentModal('Add activity note'); break;
      case 'activity-export': { const subject=activitySubject(trigger.dataset.context,trigger.dataset.id); exportCSV(`matanho-${trigger.dataset.context||'portfolio'}-activity.csv`,[['Timestamp','Actor','Action','Source'],['31 Jul 2026 · 16:42','Tendai Moyo','Record updated',subject.name||subject.subject||subject.id],['31 Jul 2026 · 15:18','System','Source data refreshed','Approved read model'],['30 Jul 2026 · 11:04','Nyasha Moyo','Review completed','Audit trail']]); closeOverlays(); break; }
      case 'activity-communication': closeOverlays(); showCommunicationModal(); break;
      case 'user-menu': showUserMenu(trigger); break;
      case 'module-switcher': showModuleSwitcher(trigger); break;
      case 'tenant-switch': showTenantSwitcher(trigger); break;
      case 'platform-status': genericDetailDrawer('Workspace Status','All prototype services are operating normally.'); break;
      case 'chart-drilldown': openAnalyticsDetail(trigger); break;
      case 'analytics-back': navigate(state.drilldown?.sourcePage || 'dashboard'); break;
      case 'analytics-export': {
        const context=state.drilldown || {title:'Portfolio analytics',selection:'All data'};
        const records=analyticsRecords(context);
        exportCSV('matanho-portfolio-analytics.csv',[['Record','Type','Dimension','Owner','Status','Value','Indicator'],...records.map(item=>[item.name,item.kind,item.dimension,item.owner,item.status,item.value,item.metric])]);
        break;
      }
      case 'export-drilldown': exportCSV('matanho-drilldown.csv',[['Metric','Value'],['Selection','Prototype drill-down'],['Fund',state.activeFund],['As of',state.asOfDate]]); break;
      case 'deal-filters': showDealFilters(); break;
      case 'company-filters': showCompanyFilters(); break;
      case 'fund-filters': genericFilterDrawer('Fund filters',['Strategy','Vintage year','Status','Currency','Geography']); break;
      case 'report-filters': genericFilterDrawer('Reporting filters',['Report type','Fund','Owner','Status','Due date']); break;
      case 'lp-filters': genericFilterDrawer('LP filters',['Investor type','Geography','KYC status','Portal status','Commitment size']); break;
      case 'create-fund': showCreateFundModal(); break;
      case 'new-report-schedule': showReportScheduleModal(); break;
      case 'company-update': showCompanyUpdateModal(); break;
      case 'assign-dd-task': showDDTaskModal(); break;
      case 'add-workstream': genericDetailDrawer('Add Due Diligence Workstream','Configure a new workstream, owner, due date and task template.'); break;
      case 'open-dd-task': showDDTaskDrawer(trigger.dataset.id); break;
      case 'toggle-closing-condition': {
        const condition = state.closingConditions.find(item=>item.id===trigger.dataset.id);
        if (condition) { condition.complete = !condition.complete; toast('Condition updated',`${condition.title} marked ${condition.complete?'complete':'in review'}.`); render(); }
        break;
      }
      case 'release-tranche': showReleaseTrancheModal(); break;
      case 'create-payment': {
        const ready = state.closingConditions.every(c=>c.complete);
        if (!ready) toast('Payment locked','Complete all closing conditions before creating the payment instruction.','warning');
        else genericDetailDrawer('Payment Instruction','$12.0M first tranche · dual authorisation required');
        break;
      }
      case 'select-folder': state.selectedFolder = trigger.dataset.folder; state.selectedDocumentId = documents.find(d=>d.folder===state.selectedFolder)?.id || documents[0].id; render(); break;
      case 'select-document': state.selectedDocumentId = trigger.dataset.id; render(); break;
      case 'preview-document': showDocumentPreview(trigger.dataset.id); break;
      case 'download-document': downloadDocumentFormat(trigger.dataset.id||state.selectedDocumentId,'pdf'); break;
      case 'document-download-menu': showDownloadMenu(trigger,trigger.dataset.id,'document'); break;
      case 'report-download-menu': showDownloadMenu(trigger,trigger.dataset.id,'report'); break;
      case 'download-format': { const doc=documents.find(d=>d.id===trigger.dataset.id); if(doc) downloadDocumentFormat(doc.id,trigger.dataset.format); else { const report=reportVaultItems.find(r=>r.id===trigger.dataset.id)||reportVaultItems[0]; const rows=[['Report',report.name],['Fund',report.fund],['Period',report.period],['Version',report.version],['Status',report.status],['Owner',report.owner],['Generated',report.generated],['Pages',report.pages],['Recipients',report.recipients]]; if(trigger.dataset.format==='pdf') downloadBlob(report.name.replaceAll(' ','_')+'.pdf',createSimplePdf(report.name,rows.map(r=>r.join(': ')))); else if(trigger.dataset.format==='csv') exportCSV(report.name.replaceAll(' ','_')+'.csv',rows); else downloadBlob(report.name.replaceAll(' ','_')+'.xls',new Blob([`<table>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>`],{type:'application/vnd.ms-excel'})); } closeOverlays(); break; }
      case 'create-folder': showCreateFolderModal(); break;
      case 'request-document': showRequestDocumentModal(); break;
      case 'select-report-section': state.reportSection=Number(trigger.dataset.section); render(); break;
      case 'report-inspector-tab': state.reportBuilderTab=trigger.dataset.tab; render(); break;
      case 'preview-report': showReportPreview('RVA-001'); break;
      case 'publish-report': toast('Publish blocked','Resolve the two outstanding validation issues before publishing.','warning'); break;
      case 'request-report-review': toast('Review requested','Rudo Moyo and the Investment Committee were notified.'); break;
      case 'refresh-report-data': toast('Data refreshed','Linked figures were refreshed from the prototype data model.'); break;
      case 'generate-report': navigate('report-builder'); break;
      case 'save-settings': toast('Settings saved','Workspace preferences were saved in browser memory.'); break;
      case 'configure-integration': genericDetailDrawer('Integration Configuration','Frontend prototype connector settings'); break;
      case 'ic-vote': break;
      case 'final-vote': showDecisionConfirmation(trigger.dataset.vote==='Reject'?'reject':trigger.dataset.vote==='Defer'?'defer':'approve',`${trigger.dataset.vote} investment decision`,`Nova Analytics · Series B · Investment Committee`,{'Decision':trigger.dataset.vote,'Investment':'USD 18.0M','Proposed ownership':'17.5%','Resolution':'RES-IC-2026-014','Open conditions':'3'},'Confirm vote'); state.pendingDecision.vote=trigger.dataset.vote; break;
      case 'rerun-screening': toast('Screening completed','Matanho Screen v3.2 returned a score of 86/100 with 94% confidence.'); break;
      case 'confirm-shortlist': toast('Shortlist confirmed','Nova Analytics is confirmed for due diligence.'); break;
      case 'human-review': toast('Human review requested','The application was assigned to the screening manager.','warning'); break;
      case 'screen-reject': showDecisionConfirmation('reject','Reject screening application','Nova Analytics · AI screening and human review',{'Application':'DL-013','Screening score':'86 / 100','Requested investment':'USD 18.0M','Current stage':'AI Screening'},'Confirm rejection'); break;
      case 'request-clarification': showClarificationModal(); break;
      case 'download-application': toast('Application downloaded','The application pack was prepared as a sample PDF.'); break;
      case 'accept-counter': { const s=Number(trigger.dataset.section??state.termSection), c=Number(trigger.dataset.clause??state.termClause); const clause=termSheetSections[s]?.clauses[c]||termSheetSections[3].clauses[3]; showDecisionConfirmation('approve','Accept company counterproposal',`${clause.title} · ${clause.reference}`,{'Clause':clause.title,'Matanho position':clause.matanho,'Company counter':clause.company,'Source':clause.source},'Accept counter'); state.pendingDecision.term={section:s,clause:c,decision:'Agreed'}; break; }
      case 'retain-position': { const s=Number(trigger.dataset.section??state.termSection), c=Number(trigger.dataset.clause??state.termClause); const clause=termSheetSections[s]?.clauses[c]||termSheetSections[3].clauses[3]; showDecisionConfirmation('defer','Retain Matanho negotiating position',`${clause.title} · ${clause.reference}`,{'Clause':clause.title,'Current position':clause.matanho,'Company counter':clause.company,'Next action':'Return redline to company'},'Retain position'); state.pendingDecision.term={section:s,clause:c,decision:'Open'}; break; }
      case 'add-term-comment': showSimpleCommentModal('Add term sheet comment'); break;
      case 'new-term-version': showModal('Create New Term-Sheet Version','Create a controlled version from the current approved redline.',`<form id="termVersionForm"><div class="form-grid"><div class="form-field"><label>Base version</label><select><option>v4 · Current</option><option>v3 · Company redline</option></select></div><div class="form-field"><label>Version owner</label><select><option>Farai Chikore</option><option>Tendai Moyo</option></select></div><div class="form-field full"><label>Change reason</label><textarea>Resolve remaining governance and conditions-precedent clauses.</textarea></div><div class="form-field full"><label class="checkbox-row"><input type="checkbox" checked> Preserve comparison links and all prior comments.</label></div></div></form>`,`${button('Cancel','close-modal')}${button('Create v5','confirm-new-term-version','primary','plus')}`,{variant:'wizard',rail:['Base version','Ownership','Change reason','Review']}); break;
      case 'share-term': showSignatureStudio('DOC-009'); break;
      case 'generate-term-pdf': downloadBlob('Nova_Analytics_Term_Sheet_v4.pdf',createSimplePdf('Nova Analytics Series B Term Sheet v4',termSheetSections.flatMap(section=>[section.name,...section.clauses.map(clause=>`${clause.reference} ${clause.title}: ${state.termDecisions[`${termSheetSections.indexOf(section)}:${section.clauses.indexOf(clause)}`]||clause.status}`)]))); break;
      case 'save-application': toast('Application saved','All changes were saved locally in the prototype.'); break;
      case 'app-continue': toast('Section completed','Funding Request is complete. Impact & ESG is now available.'); break;
      case 'app-previous': toast('Previous section','Financial Information opened.'); break;
      case 'company-board-pack': navigate('report-builder'); break;
      case 'profile-company-upload': toast('Upload ready','Choose company documents to add in the connected production workspace.'); break;
      case 'profile-lp-upload': toast('Upload ready','Choose investor documents to add to the LP record.'); break;
      case 'profile-lp-request': genericDetailDrawer('Investor Document Request','Create a secure LP document request with owner, due date and reminders.'); break;
      case 'profile-lp-commitment': genericDetailDrawer('New LP Commitment','Create an additional fund commitment and legal approval workflow.'); break;
      case 'profile-folder': toast('Folder selected','The document register was filtered without leaving the profile.'); break;
      case 'edit-fund': showFundEditModal(); break;
      case 'submit-performance': toast('Submitted for approval','The Q2 performance report entered the review workflow.'); break;
      case 'submit-capital-call-approval': { const call=capitalCalls.find(item=>item.id===state.selectedCapitalCallId)||capitalCalls[0]; showDecisionConfirmation('approve','Submit capital call for approval',`${call.id} · ${call.fund}`,{'Total amount':formatMoney(call.total),'LP count':call.lpCount,'Due date':call.dueDate,'Purpose':call.purpose,'Next approver':'Finance Review'},'Submit for approval'); state.pendingDecision.capitalCall=call.id; break; }
      case 'save-report': toast('Report saved','All editor changes were saved locally.'); break;
      case 'open-audit': genericDetailDrawer('Audit Trail','Complete immutable activity history'); break;
      case 'open-activity': genericDetailDrawer('Recent Activity','Portfolio-wide activity feed'); break;
      case 'open-alerts': genericDetailDrawer('Alerts & Actions','Portfolio exceptions requiring attention'); break;
      case 'open-validations': genericDetailDrawer('Validation Details','All automated data and policy validation checks'); break;
      case 'open-findings': genericDetailDrawer('Due Diligence Findings','Findings, severity, owners and evidence'); break;
      case 'open-conditions': genericDetailDrawer('Conditions for Approval','Open conditions and evidence requirements'); break;
      case 'open-milestones': genericDetailDrawer('Portfolio Milestones','Company-level milestones and target dates'); break;
      case 'open-value-creation': genericDetailDrawer('Value Creation Initiatives','Initiatives, owners, KPIs and progress'); break;
      case 'open-contacts': genericDetailDrawer('Contact Directory','Relationship contacts and communication preferences'); break;
      case 'open-lp-documents': genericDetailDrawer('Outstanding Documents','KYC, side letters and investor documentation'); break;
      case 'open-kyc': genericDetailDrawer('KYC Annual Review','Investor KYC review and supporting evidence'); break;
      case 'open-board-details': genericDetailDrawer('Board Composition','Directors, committees and governance rights'); break;
      case 'open-esg': genericDetailDrawer('ESG Report','Environmental, Social and Governance metrics'); break;
      case 'open-calendar': genericDetailDrawer('Calendar','Scheduled portfolio and investor touchpoints'); break;
      case 'navigate-cash-reservations': closeOverlays(); navigate('cash-reservations'); break;
      case 'navigate-cash-ledger': closeOverlays(); navigate('cash-ledger'); break;
      case 'navigate-reconciliations': closeOverlays(); navigate('reconciliations'); break;
      case 'navigate-exceptions': closeOverlays(); navigate('exceptions'); break;
      case 'navigate-period-close': closeOverlays(); navigate('period-close'); break;
      case 'cash-currency': state.cashCurrency=trigger.value||trigger.dataset.value||'USD'; render(); break;
      case 'cash-available-explain': case 'cash-settled-explain': case 'cash-posted-explain': case 'cash-holds-explain': case 'cash-distributable-explain': showCashExplanation(); break;
      case 'create-cash-account': showModal('Create Client / Fund Account','Register an authorised account under the complete ownership hierarchy.',`<form id="cashAccountForm"><div class="form-grid"><div class="form-field"><label>Manager legal entity</label><select><option>Matanho Capital Zimbabwe</option></select></div><div class="form-field"><label>Fund</label><select>${funds.map(f=>`<option>${escapeHTML(f.name)}</option>`).join('')}</select></div><div class="form-field"><label>Vehicle</label><input value="Main Fund Vehicle"></div><div class="form-field"><label>Cash purpose</label><select><option>SUBSCRIPTION_COLLECTION</option><option>INVESTMENT_DISBURSEMENT</option><option>FUND_OPERATING_BANK</option><option>DISTRIBUTION_ACCOUNT</option><option>ESCROW_OR_CUSTODY</option></select></div><div class="form-field"><label>Provider</label><input value="CBZ Bank Zimbabwe"></div><div class="form-field"><label>Currency</label><select><option>USD</option><option>ZWG</option></select></div><div class="form-field"><label>Ownership model</label><select><option>SEGREGATED</option><option>OMNIBUS</option><option>HYBRID</option></select></div><div class="form-field"><label>Effective from</label><input type="date" value="2026-08-01"></div><div class="form-field full"><label>Provider account identifier</label><input type="password" value="000000002001"></div></div></form>`,`${button('Save draft','close-modal')}${button('Submit for approval','submit-cash-account','primary','send')}`,{variant:'wizard',size:'lg',rail:['Ownership','Provider & Currency','Mappings & Controls','Review']}); break;
      case 'create-manual-journal': showModal('Create Controlled Manual Journal','Balanced draft with source evidence, value date and independent checker.',`<div class="journal-builder"><div class="form-grid"><div class="form-field"><label>Source event</label><input value="MANUAL-ADJ-2026-001"></div><div class="form-field"><label>Value date</label><input type="date" value="2026-08-01"></div><div class="form-field full"><label>Reason</label><textarea>Correct bank fee classification supported by provider evidence.</textarea></div></div><div class="journal-line-editor"><div><strong>Ledger account</strong><strong>Debit</strong><strong>Credit</strong></div><div><select><option>Approved fund expense control</option></select><input value="25000.00"><input value="0.00"></div><div><select><option>Fund bank cash · FCA-2001</option></select><input value="0.00"><input value="25000.00"></div><div class="total"><strong>Totals</strong><b>25,000.00</b><b>25,000.00</b></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Journal is balanced</strong><small>Maker Tariro Moyo cannot approve this draft.</small></div></div></div>`,`${button('Save draft','close-modal')}${button('Submit to checker','submit-manual-journal','primary','send')}`,{variant:'operations',size:'lg',rail:['Header','Double-entry lines','Evidence','Approval']}); break;
      case 'upload-statement': showModal('Upload External Statement','Receive and stage a bank, custodian, escrow or payment-provider file without changing ledger cash.',`<div class="upload-dropzone">${icon('upload')}<strong>Drop CSV, Excel or MT940 file here</strong><small>Maximum 100,000 lines · original file and hash retained</small>${button('Choose file','close-modal','primary','folder')}</div><div class="import-upload-settings"><div><span>Provider layout</span><strong>Auto-detect from approved registry</strong></div><div><span>Commit mode</span><strong>Validate and stage only</strong></div><div><span>Maker-checker</span><strong>Required before commit</strong></div></div>`,button('Cancel','close-modal'),{variant:'import',size:'lg',rail:['File identity','Account mapping','Control totals','Review']}); break;
      case 'start-reconciliation': showModal('Start Reconciliation Batch','Select one account, currency and period; no cross-scope records may enter the candidate population.',`<form><div class="form-grid"><div class="form-field full"><label>Cash account</label><select>${cashAccounts.map(a=>`<option>${a.id} · ${escapeHTML(a.fund)} · ${a.masked}</option>`).join('')}</select></div><div class="form-field"><label>Currency</label><select><option>USD</option><option>ZWG</option></select></div><div class="form-field"><label>Period</label><input type="month" value="2026-07"></div><div class="form-field"><label>Date tolerance</label><select><option>3 business days</option><option>5 business days</option></select></div><div class="form-field"><label>Matching policy</label><select><option>Exact + suggested</option><option>Exact only</option></select></div></div></form>`,`${button('Cancel','close-modal')}${button('Create batch','submit-reconciliation','primary','refresh')}`,{variant:'operations',rail:['Scope','Policy','Candidate population','Review']}); break;
      case 'new-signature-envelope': showSignatureStudio('DOC-009'); break;
      case 'send-signature-envelope': closeOverlays(); toast('Envelope sent','Recipients were notified in signing order with OTP authentication.'); render(); break;
      case 'apply-signature': trigger.classList.remove('pending'); trigger.classList.add('signed'); trigger.innerHTML='<span>Tendai Moyo</span><small>Signed just now · CAT</small>'; toast('Signature applied','The electronic consent and audit evidence were recorded.'); break;
      case 'save-signature-draft': toast('Envelope draft saved','Field positions, recipients and message were saved.'); break;
      case 'download-signature-certificate': downloadBlob('Matanho_Signature_Certificate.pdf',createSimplePdf('Electronic Signature Completion Certificate',['Envelope: '+state.selectedEnvelopeId,'Document: '+state.selectedDocumentId,'Authentication: Email + OTP','Audit evidence: retained','Status: Frontend demonstration'])); break;
      case 'download-report-format': { const report=reportVaultItems.find(r=>r.id===trigger.dataset.id)||reportVaultItems[0]; const rows=[['Report',report.name],['Fund',report.fund],['Period',report.period],['Version',report.version],['Status',report.status]]; if(trigger.dataset.format==='pdf') downloadBlob(report.name.replaceAll(' ','_')+'.pdf',createSimplePdf(report.name,rows.map(r=>r.join(': ')))); else downloadBlob(report.name.replaceAll(' ','_')+'.xls',new Blob([`<table>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>`],{type:'application/vnd.ms-excel'})); break; }
      case 'export-cash-accounts': exportCSV('matanho-client-fund-accounts.csv',[['ID','Fund','Vehicle','Purpose','Provider','Masked account','Currency','Status','Settled','Deployable','Reconciliation %'],...cashAccounts.map(a=>[a.id,a.fund,a.vehicle,a.purpose,a.provider,a.masked,a.currency,a.status,a.settled,a.deployable,a.reconHealth])]); break;
      case 'export-cash-overview': exportCSV('matanho-cash-overview.csv',[['Account','Fund','Currency','Posted','Settled','Reserved','Held','Deployable','Distributable'],...cashAccounts.map(a=>[a.id,a.fund,a.currency,a.posted,a.settled,a.reserved,a.held,a.deployable,a.distributable])]); break;
      case 'export-ledger': exportCSV('matanho-cash-ledger.csv',[['Journal','Source','Event','Fund','Account','Value date','Debit','Credit','Signed cash','Status','Reconciled'],...cashJournals.map(j=>[j.id,j.source,j.event,j.fund,j.account,j.valueDate,j.debit,j.credit,j.signed,j.status,j.reconciled])]); break;
      case 'export-reservations': exportCSV('matanho-cash-reservations.csv',[['Reservation','Source','Fund','Account','Beneficiary','Purpose','Amount','Remaining','Required','Expiry','Status'],...cashReservations.map(r=>[r.id,r.source,r.fund,r.account,r.beneficiary,r.purpose,r.amount,r.remaining,r.required,r.expiry,r.status])]); break;
      case 'export-exceptions': exportCSV('matanho-reconciliation-exceptions.csv',[['Exception','Batch','Code','Account','Amount','Currency','Severity','Owner','Age','Due','Status'],...reconciliationExceptions.map(e=>[e.id,e.batch,e.code,e.account,e.amount,e.currency,e.severity,e.owner,e.age,e.due,e.status])]); break;
      case 'export-reconciliation-pack': downloadBlob('Matanho_Reconciliation_Evidence_Pack.pdf',createSimplePdf('Reconciliation Evidence Pack',reconciliationBatches.map(r=>`${r.id}: ${r.account}, ${r.matched}% matched, variance ${r.variance} ${r.currency}, ${r.status}`))); break;
      case 'export-close-pack': downloadBlob('Matanho_July_2026_Close_Evidence_Pack.pdf',createSimplePdf('July 2026 Period Close Evidence Pack',['Status: RECONCILING','Controls passed: 6 of 10','Blocking items: 4','GL control: 4 accepted, 1 pending','Maker-checker approvals: incomplete'])); break;
      case 'download-cash-explanation': { const a=cashAccounts.find(x=>x.id===trigger.dataset.id)||cashAccounts[0]; downloadBlob(`${a.id}_cash_explanation.pdf`,createSimplePdf(`Cash Explanation ${a.id}`,[`Fund: ${a.fund}`,`Settled: ${a.settled} ${a.currency}`,`Reserved: ${a.reserved} ${a.currency}`,`Held: ${a.held} ${a.currency}`,`Deployable: ${a.deployable} ${a.currency}`,`Rule: AVAIL-${a.currency}-v4`])); break; }
      case 'download-journal-evidence': { const j=cashJournals.find(x=>x.id===trigger.dataset.id)||cashJournals[0]; downloadBlob(`${j.id}_evidence.pdf`,createSimplePdf(`Journal Evidence ${j.id}`,[`Source: ${j.source}`,`Event: ${j.event}`,`Debit: ${j.debit}`,`Credit: ${j.credit}`,`Maker: ${j.maker}`,`Checker: ${j.checker}`])); break; }
      case 'run-close-precheck': toast('Pre-check completed','Six controls passed and four blockers were returned with owner, value and remediation path.','warning'); break;
      case 'create-gl-export': toast('GL export created','Control totals and checksum were prepared with an idempotent retry key.'); break;
      case 'confirm-recon-match': showDecisionConfirmation('approve','Confirm Source-to-Ledger Match','JRN-2026-07196 ↔ EXT-88398',{'Matched amount':'USD 125,000.00','Topology':'One-to-one','Score':'91%','Residual':'USD 0.00','Approval route':'Cash Operations Checker'},'Confirm match'); state.pendingDecision.reconciliation=true; break;
      case 'raise-recon-exception': navigate('exceptions'); break;
      case 'confirm-decision': { if(!$('#decisionAcknowledge')?.checked){toast('Confirmation required','Review and acknowledge the displayed decision impact before continuing.','warning');break;} const pending=state.pendingDecision||{}; if(pending.vote){const member=Object.keys(state.dealVote).find(name=>state.dealVote[name]==='Pending');if(member)state.dealVote[member]=pending.vote;toast('Vote recorded',`${member||'Your vote'}: ${pending.vote}.`);} else if(pending.term){state.termDecisions[`${pending.term.section}:${pending.term.clause}`]=pending.term.decision;toast('Term-sheet decision recorded',pending.term.decision==='Agreed'?'Company counterproposal accepted.':'Matanho position retained for the next redline.');} else if(pending.capitalCall){const call=capitalCalls.find(item=>item.id===pending.capitalCall);if(call){call.approval='Finance Review';call.status='In Review';}toast('Submitted for approval','Capital call entered Finance Review.');} else if(pending.reconciliation){toast('Match confirmed','Link amounts, score components, approver and evidence were recorded.');} else if(pending.kind==='reject'){toast('Decision recorded','The rejection and rationale were saved to the activity trail.','warning');} closeOverlays();state.pendingDecision=null;render();break;}
      case 'confirm-new-term-version': closeOverlays();toast('Version 5 created','A controlled editable version was created with comparison links preserved.');break;
      case 'recon-balance-detail': case 'recon-inflows-detail': case 'recon-outflows-detail': case 'recon-closing-detail': case 'recon-timing-detail': case 'recon-variance-detail': showRecordMetadata('reconciliation-control',action); break;
      case 'split-recon-match': showModal('Split or Combine Match','Allocate one or more internal and external residuals while preserving exact matched amounts.',`<div class="split-match-grid"><section><h3>Internal residuals</h3><div class="list-row"><span class="activity-icon">${icon('list')}</span><span class="list-row-main"><strong>JRN-2026-07196</strong><small>USD 125,000.00 remaining</small></span></div></section><section><h3>External residuals</h3><div class="list-row"><span class="activity-icon">${icon('bank')}</span><span class="list-row-main"><strong>EXT-88398</strong><small>USD 125,000.00 remaining</small></span></div><div class="list-row"><span class="activity-icon">${icon('bank')}</span><span class="list-row-main"><strong>EXT-88396</strong><small>USD 2,500.00 remaining</small></span></div></section></div><div class="form-field section-gap"><label>Matched amount</label><input value="125000.00"></div>`,`${button('Cancel','close-modal')}${button('Create allocation links','confirm-split-match','primary','link')}`,{variant:'operations',size:'lg',rail:['Residuals','Allocations','Evidence','Approval']}); break;
      case 'confirm-split-match': closeOverlays();toast('Allocation links created','The split/combine links and residual amounts were saved in the demonstration workspace.');break;
      default:
        if (action.startsWith('metric-') || action.startsWith('company-') || action.startsWith('fund-') || action.startsWith('lp-') || action.startsWith('dd-') || action.endsWith('-metric')) openAnalyticsDetail(trigger);
        else if (['open-analyst-workload','open-ic-calendar','open-owner-completion','performance-settings','permissions-matrix','manage-lp-access','manage-roles','security-settings','fund-documents','open-version-history','open-conflicts','view-resolution','request-signatures','view-bank-details','download-call-pack','preview-capital-call','open-meeting-pack','open-team','open-board-calendar','open-interaction','email-contact','call-contact','add-interaction','open-all-dd-tasks','view-bank-details','export-closing','activity-chart-detail','term-version-chart'].includes(action)) showRecordMetadata('workspace-control',action);
        else softFocus(trigger);
    }
  }


  function showNotifications(anchor) {
    showPopover(anchor, `<div class="popover-title">Notifications</div>
      <button class="popover-item" data-action="open-alerts"><span class="activity-icon" style="color:var(--red);background:var(--red-soft)">${icon('alert')}</span><span class="popover-item-copy"><strong>Three portfolio alerts require review</strong><small>Runway, governance and reporting exceptions</small></span>${statusPill('3','danger')}</button>
      <button class="popover-item" data-action="open-report-review"><span class="activity-icon" style="color:var(--blue);background:var(--blue-soft)">${icon('file-chart')}</span><span class="popover-item-copy"><strong>Q2 report pack ready for review</strong><small>Matanho Growth Fund II · 18 minutes ago</small></span></button>
      <button class="popover-item" data-action="open-capital-call" data-id="CC-2026-0038"><span class="activity-icon" style="color:var(--amber);background:var(--amber-soft)">${icon('wallet')}</span><span class="popover-item-copy"><strong>Capital call awaiting finance approval</strong><small>CC-2026-0038 · $42.5M</small></span></button>
      <button class="popover-item" data-action="open-deal" data-id="DL-013"><span class="activity-icon" style="color:var(--emerald);background:var(--emerald-soft)">${icon('gavel')}</span><span class="popover-item-copy"><strong>IC meeting starts tomorrow</strong><small>Nova Analytics · 10:00 CAT</small></span></button>
      <div class="popover-divider"></div><button class="popover-item" data-action="open-activity">${icon('bell')}<span class="popover-item-copy"><strong>View all activity</strong><small>Open the portfolio-wide activity log</small></span></button>`, 380);
  }

  function showUserMenu(anchor) {
    showPopover(anchor, `<div class="popover-title">Signed in as</div>
      <div class="popover-item" style="cursor:default">${personAvatar("Tariro Moyo","avatar-gradient")}<span class="popover-item-copy"><strong>Tariro Moyo</strong><small>Investment Director · Matanho Capital</small></span></div>
      <div class="popover-divider"></div>
      <button class="popover-item" data-action="navigate" data-page="settings">${icon('settings')}<span class="popover-item-copy"><strong>Workspace settings</strong><small>Preferences, permissions and integrations</small></span></button>
      <button class="popover-item" data-action="toggle-theme">${icon(state.theme==='light'?'moon':'sun')}<span class="popover-item-copy"><strong>${state.theme==='light'?'Use dark theme':'Use light theme'}</strong><small>Change appearance on this browser</small></span></button>
      <div class="popover-divider"></div><button class="popover-item" data-action="sign-out-demo">${icon('external-link')}<span class="popover-item-copy"><strong>Sign out</strong><small>Demo action only</small></span></button>`, 330);
  }

  function showModuleSwitcher(anchor) {
    const modules = [
      ['Portfolio Management','Active','layers','var(--brand)'],['Loan Operations','Available','wallet','var(--blue)'],['Workshop OS','Available','settings','var(--emerald)'],['Procurement','Preview','clipboard','var(--amber)'],['Employee Hub','Available','users','var(--purple)'],['Board Management','Preview','gavel','var(--cyan)']
    ];
    showPopover(anchor, `<div class="popover-title">Matanho modules</div>${modules.map(([name,status,ic,color],index)=>`<button class="popover-item" data-action="${index===0?'close-overlays':'switch-module-demo'}" data-module="${escapeHTML(name)}"><span class="activity-icon" style="color:${color};background:color-mix(in srgb,${color} 12%,transparent)">${icon(ic)}</span><span class="popover-item-copy"><strong>${escapeHTML(name)}</strong><small>${escapeHTML(status)}</small></span>${index===0?statusPill('Current','success'):icon('chevron-right')}</button>`).join('')}`, 360);
  }

  function showTenantSwitcher(anchor) {
    showPopover(anchor, `<div class="popover-title">Workspace</div>
      <button class="popover-item" data-action="close-overlays"><span class="tenant-avatar">MC</span><span class="popover-item-copy"><strong>Matanho Capital</strong><small>Private Markets Workspace · Current</small></span>${statusPill('Active','success')}</button>
      <button class="popover-item" data-action="tenant-demo"><span class="tenant-avatar" style="background:linear-gradient(145deg,#1d5e9c,#38a2da)">AF</span><span class="popover-item-copy"><strong>Africa Fund Services</strong><small>Fund Administration Sandbox</small></span>${icon('chevron-right')}</button>
      <div class="popover-divider"></div><button class="popover-item" data-action="workspace-admin">${icon('settings')}<span class="popover-item-copy"><strong>Manage workspaces</strong><small>Tenants, data regions and access</small></span></button>`, 360);
  }

  function genericFilterDrawer(title, filterNames) {
    showDrawer(title, 'Refine the current workspace view', `<form id="genericFilterForm"><div class="form-grid">${filterNames.map((name,index)=>`<div class="form-field ${index===filterNames.length-1&&filterNames.length%2?'full':''}"><label>${escapeHTML(name)}</label>${/date|period/i.test(name)?'<input type="date" value="2026-07-31">':/amount|size|score|vintage/i.test(name)?'<input type="number" placeholder="Any">':`<select><option>All ${escapeHTML(name.toLowerCase())}</option><option>Active</option><option>In review</option><option>Attention required</option></select>`}</div>`).join('')}</div><div class="form-field section-gap"><label>Saved view</label><select><option>Current team view</option><option>Executive exceptions</option><option>Quarter-end review</option></select></div></form>`, `${button('Reset','reset-filters')}${button('Apply filters','apply-filters','primary','filter')}`);
  }

  function showDealFilters() {
    genericFilterDrawer('Deal Flow Filters',['Stage','Strategy','Sector','Investment size','Owner','Priority','AI score','Date sourced']);
  }

  function showCompanyFilters() {
    genericFilterDrawer('Portfolio Company Filters',['Fund','Sector','Investment stage','Health score','Runway','Reporting status','Board date']);
  }

  function showCreateFundModal() {
    showModal('Create fund','Set up a new private-markets fund workspace.', `<form id="createFundForm"><div class="form-grid"><div class="form-field full"><label class="required">Fund name</label><input name="name" required placeholder="Matanho Africa Growth Fund III"></div><div class="form-field"><label>Strategy</label><select name="strategy"><option>Growth Equity</option><option>Early Stage</option><option>Buyout</option><option>Climate Infrastructure</option><option>SME Growth</option></select></div><div class="form-field"><label>Vintage</label><input name="vintage" type="number" value="2026"></div><div class="form-field"><label>Currency</label><select name="currency"><option>USD</option><option>ZAR</option><option>ZWG</option><option>EUR</option></select></div><div class="form-field"><label>Target commitment</label><input name="commitment" type="number" value="200000000"></div><div class="form-field"><label>Primary geography</label><input name="geography" value="Pan-African"></div><div class="form-field"><label>Management fee</label><input name="managementFee" value="2.0%"></div><div class="form-field full"><label>Carry terms</label><input name="carry" value="20% above 8% hurdle"></div></div></form>`, `${button('Cancel','close-modal')}${button('Create fund','submit-create-fund','primary','plus')}`);
  }

  function submitCreateFund() {
    const form = $('#createFundForm');
    if (!form?.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const fund = { id:`FUND-${String(funds.length+1).padStart(3,'0')}`, name:data.name, vintage:Number(data.vintage), strategy:data.strategy, currency:data.currency, commitment:Number(data.commitment), called:0, nav:0, distributed:0, grossIrr:0, netIrr:0, tvpi:0, dpi:0, status:'Fundraising', geography:data.geography, managementFee:data.managementFee, carry:data.carry };
    funds.push(fund); state.selectedFundId=fund.id; closeOverlays(); toast('Fund created',`${fund.name} is ready for setup.`); state.page='fund-detail'; render();
  }

  function showReportScheduleModal() {
    showModal('Schedule reporting obligation','Add a recurring or one-time portfolio reporting requirement.', `<form id="reportScheduleForm"><div class="form-grid"><div class="form-field"><label class="required">Report type</label><select name="type"><option>Quarterly Fund Report</option><option>Portfolio Company Report</option><option>LP Report</option><option>Board Pack</option><option>Valuation Memo</option><option>Compliance Submission</option></select></div><div class="form-field"><label>Fund</label><select name="fund">${funds.map(f=>`<option>${escapeHTML(f.name)}</option>`).join('')}</select></div><div class="form-field"><label>Entity</label><input name="entity" value="Matanho Growth Fund II"></div><div class="form-field"><label>Owner</label><select name="owner"><option>Sarah Mitchell</option><option>James Davidson</option><option>Anita Kapoor</option><option>Laura Chen</option></select></div><div class="form-field"><label>Frequency</label><select name="frequency"><option>Quarterly</option><option>Monthly</option><option>Annual</option><option>One-time</option></select></div><div class="form-field"><label>Due date</label><input name="due" type="date" value="2026-08-31"></div><div class="form-field full"><label>Delivery channel</label><select name="channel"><option>LP Portal + Secure Email</option><option>Secure Portal</option><option>Regulatory Portal</option><option>Internal Only</option></select></div></div></form>`, `${button('Cancel','close-modal')}${button('Schedule report','submit-report-schedule','primary','calendar')}`);
  }

  function submitReportSchedule() {
    const form=$('#reportScheduleForm'); if(!form?.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form));
    reports.unshift({id:`RPT-${String(reports.length+1).padStart(3,'0')}`,type:data.type,fund:data.fund,entity:data.entity,owner:data.owner,frequency:data.frequency,due:new Date(data.due).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),status:'Not Started',progress:0,channel:data.channel});
    closeOverlays(); toast('Reporting schedule added',`${data.type} is now on the team calendar.`); render();
  }

  function showCompanyUpdateModal() {
    const company=companies.find(c=>c.id===state.selectedCompanyId)||companies[0];
    showModal('Add company update',`Record the latest operating update for ${company.name}.`, `<form id="companyUpdateForm"><div class="form-grid"><div class="form-field"><label>Reporting period</label><select><option>July 2026</option><option>Q2 2026</option><option>June 2026</option></select></div><div class="form-field"><label>Update type</label><select><option>Business Update</option><option>Board Update</option><option>Financial Update</option><option>Milestone Update</option></select></div><div class="form-field"><label>Revenue (USD M)</label><input type="number" step="0.1" value="36.5"></div><div class="form-field"><label>EBITDA (USD M)</label><input type="number" step="0.1" value="12.5"></div><div class="form-field full"><label>Management commentary</label><textarea style="min-height:150px">Revenue continued to grow through enterprise expansion and improved retention. Key product milestones remain on track, while ISO 27001 certification requires focused management attention.</textarea></div><div class="form-field full"><label>Supporting files</label><label class="button" style="justify-content:flex-start">${icon('upload')} Attach board pack or management accounts<input type="file" hidden></label></div></div></form>`, `${button('Save draft','save-company-update')}${button('Publish update','publish-company-update','primary','send')}`);
  }

  function showDDTaskModal() {
    showModal('Assign due diligence task','Create a task in the selected diligence workstream.', `<form id="ddTaskForm"><div class="form-grid"><div class="form-field full"><label class="required">Task</label><input name="title" required placeholder="e.g. Verify regulatory licences"></div><div class="form-field"><label>Workstream</label><select name="workstream"><option>Financial Assessment</option><option>Market Research</option><option>Legal Compliance</option><option>Risk Assessment</option><option>Management Team Evaluation</option></select></div><div class="form-field"><label>Analyst</label><select name="analyst"><option>Tendai Moyo</option><option>Nyasha Moyo</option><option>Rudo Ndlovu</option><option>Chipo Dube</option><option>Farai Chikore</option></select></div><div class="form-field"><label>Due date</label><input name="due" type="date" value="2026-08-07"></div><div class="form-field"><label>Priority</label><select name="priority"><option>Medium</option><option>High</option><option>Low</option></select></div><div class="form-field full"><label>Evidence required</label><textarea name="evidence" placeholder="Describe the evidence needed to close this task..."></textarea></div></div></form>`, `${button('Cancel','close-modal')}${button('Assign task','submit-dd-task','primary','clipboard')}`);
  }

  function submitDDTask() {
    const form=$('#ddTaskForm'); if(!form?.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form));
    state.dueDiligenceTasks.push({id:`T${state.dueDiligenceTasks.length+1}`,title:data.title,analyst:data.analyst,due:new Date(data.due).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),priority:data.priority,status:'To Do',evidence:0,comments:0});
    closeOverlays(); toast('Task assigned',`${data.title} was assigned to ${data.analyst}.`); render();
  }

  function showDDTaskDrawer(id) {
    const task=state.dueDiligenceTasks.find(t=>t.id===id)||state.dueDiligenceTasks[0];
    showDrawer(task.title,`${task.analyst} · Due ${task.due}`, `<section class="drawer-section"><div class="grid cols-2"><div class="info-list"><div class="info-row"><span>Status</span><strong>${statusPill(task.status)}</strong></div><div class="info-row"><span>Priority</span><strong>${statusPill(task.priority,task.priority==='High'?'danger':task.priority==='Medium'?'warning':'success')}</strong></div><div class="info-row"><span>Evidence</span><strong>${task.evidence} files</strong></div><div class="info-row"><span>Comments</span><strong>${task.comments}</strong></div></div><div class="score-card"><strong>Finding</strong><span class="metric-value" style="font-size:24px">Low</span><small>Controls appear adequate</small></div></div></section><section class="drawer-section"><h3>Analyst conclusion</h3><p class="muted">Testing performed against management accounts, supporting contracts and the current diligence request list. No material exceptions were identified in the prototype record.</p></section><section class="drawer-section"><h3>Evidence</h3><div class="info-list">${Array.from({length:Math.max(task.evidence,1)},(_,i)=>`<div class="list-row"><span class="activity-icon" style="color:var(--red);background:var(--red-soft)">${icon('file')}</span><span class="list-row-main"><strong>Evidence document ${i+1}.pdf</strong><small>Verified · 10 Jul 2026</small></span>${button('','download-document','ghost compact icon-only','download')}</div>`).join('')}</div></section>`, `${button('Add comment','add-dd-comment')}${button(task.status==='Complete'?'Reopen task':'Mark complete','toggle-dd-task','primary','check',`data-id="${task.id}"`)}`);
  }

  function showReleaseTrancheModal() {
    const ready=state.closingConditions.every(c=>c.complete);
    showModal('Release first tranche','Confirm the controlled release of USD 12.0M.', `<div class="reason-item ${ready?'':'warning'}">${icon(ready?'check-circle':'alert')}<div><strong>${ready?'All conditions are complete':'Payment remains locked'}</strong><small>${ready?'Dual authorisation will still be required.':'Complete all closing conditions before release.'}</small></div></div><div class="info-list section-gap"><div class="info-row"><span>Beneficiary</span><strong>Nova Analytics (Pvt) Ltd</strong></div><div class="info-row"><span>Bank</span><strong>CBZ Bank Limited</strong></div><div class="info-row"><span>Amount</span><strong>USD 12,000,000</strong></div><div class="info-row"><span>Purpose</span><strong>Product and regional expansion</strong></div><div class="info-row"><span>Authorisation</span><strong>Two signatories required</strong></div></div>`, `${button('Cancel','close-modal')}${button('Create release request','confirm-release-tranche',ready?'primary':'','send',ready?'':'disabled')}`);
  }

  function showDocumentPreview(id) {
    const doc=documents.find(d=>d.id===id)||documents[0]; state.selectedDocumentId=doc.id;
    showModal('Document Preview',`${doc.folder} · ${doc.version} · ${doc.status}`,`<div class="document-viewer"><header class="document-viewer-toolbar"><div class="document-preview-head"><span class="file-icon">${icon(doc.type==='XLSX'?'bar-chart':'file')}</span><div><strong>${escapeHTML(doc.name)}</strong><small>${escapeHTML(doc.type)} · ${escapeHTML(doc.size)} · uploaded ${escapeHTML(doc.uploaded)}</small></div></div><div class="viewer-controls">${button('Edit ledger','edit-document-ledger','ghost compact','list',`data-id="${doc.id}"`)}${button('100%','document-zoom','ghost compact')}${button('Download','document-download-menu','ghost compact','download',`data-id="${doc.id}"`)}</div></header><div class="document-viewer-main"><main>${documentPreviewBody(doc)}</main><aside class="document-inspector"><div class="inspector-tabs"><button class="active">Details</button><button>Versions</button><button>Activity</button></div><div class="info-list"><div class="info-row"><span>Owner</span><strong>${escapeHTML(doc.owner)}</strong></div><div class="info-row"><span>Access</span><strong>${escapeHTML(doc.access)}</strong></div><div class="info-row"><span>Classification</span><strong>${escapeHTML(doc.classification)}</strong></div><div class="info-row"><span>Retention</span><strong>${escapeHTML(doc.retention)}</strong></div><div class="info-row"><span>Signature</span><strong>${statusPill(doc.signatureStatus)}</strong></div><div class="info-row"><span>Source reference</span><strong>${doc.id}-SRC-${doc.version.replace('.','')}</strong></div><div class="info-row"><span>Checksum</span><strong>71dc…b98f</strong></div></div><div class="reason-item section-gap">${icon('shield')}<div><strong>Editable controlled preview</strong><small>Content edits remain local until saved as a new version. Preview, export, signature and permission activity is logged.</small></div></div>${doc.signatureStatus!=='Not required'?`<div class="section-gap">${button(doc.id==='DOC-009'?'Sign term sheet':'Open Signature Studio',doc.id==='DOC-009'?'sign-term-sheet':'open-signature-studio','primary','edit',`data-id="${doc.id}"`)}</div>`:''}</aside></div></div>`,`${button('Edit ledger','edit-document-ledger','','list',`data-id="${doc.id}"`)}${button('Download PDF','download-format','','file',`data-id="${doc.id}" data-format="pdf"`)}${button('Excel','download-format','','bar-chart',`data-id="${doc.id}" data-format="xls"`)}${button('CSV','download-format','','list',`data-id="${doc.id}" data-format="csv"`)}${button('Close','close-modal','primary')}`,{variant:'document',size:'fullscreen',eyebrow:'Secure document vault'});
  }

  function showCreateFolderModal() {
    showModal('Create data-room folder','Add a folder to the current deal data room.', `<form id="folderForm"><div class="form-field"><label class="required">Folder name</label><input name="name" required placeholder="e.g. Regulatory Approvals"></div><div class="form-field section-gap"><label>Default access</label><select name="access"><option>Internal</option><option>Internal / External</option><option>Restricted</option></select></div></form>`, `${button('Cancel','close-modal')}${button('Create folder','submit-create-folder','primary','folder')}`);
  }

  function submitCreateFolder() {
    const form=$('#folderForm'); if(!form?.reportValidity()) return;
    const name=new FormData(form).get('name').trim();
    state.customFolders=state.customFolders||[];
    if(!state.customFolders.includes(name)) state.customFolders.push(name);
    state.selectedFolder=name; closeOverlays(); toast('Folder created',`${name} was added to the secure data room.`); render();
  }

  function showRequestDocumentModal() {
    showModal('Request document','Send a secure document request to the applicant.', `<form id="requestDocumentForm"><div class="form-grid"><div class="form-field full"><label class="required">Document requested</label><input name="document" required placeholder="e.g. Audited Financial Statements FY2025"></div><div class="form-field"><label>Request owner</label><select name="owner"><option>Nyasha Moyo</option><option>Tendai Moyo</option><option>Farai Chikore</option></select></div><div class="form-field"><label>Due date</label><input name="due" type="date" value="2026-08-07"></div><div class="form-field full"><label>Instructions</label><textarea name="instructions">Please upload the latest signed version through the secure application portal.</textarea></div></div></form>`, `${button('Cancel','close-modal')}${button('Send request','submit-document-request','primary','send')}`);
  }

  function showClarificationModal() {
    showModal('Request clarification','Ask the applicant to clarify information in the submitted application.', `<form id="clarificationForm"><div class="form-field"><label>Application section</label><select><option>Financial Information</option><option>Business & Market</option><option>Ownership & Governance</option><option>Funding Request</option><option>Impact & ESG</option></select></div><div class="form-field section-gap"><label class="required">Question</label><textarea required style="min-height:150px">Please provide additional detail supporting the customer-concentration assumptions and upload the latest top-ten customer schedule.</textarea></div><label class="checkbox-row section-gap"><input type="checkbox" checked> Notify applicant by secure email</label></form>`, `${button('Cancel','close-modal')}${button('Send clarification','submit-clarification','primary','send')}`);
  }

  function showSimpleCommentModal(title) {
    showModal(title,'Add a timestamped note to the current record.', `<form id="commentForm"><div class="form-field"><label class="required">Comment</label><textarea required style="min-height:150px" placeholder="Write a concise decision, review or negotiation note..."></textarea></div><label class="checkbox-row section-gap"><input type="checkbox" checked> Notify assigned team members</label></form>`, `${button('Cancel','close-modal')}${button('Add comment','submit-comment','primary','send')}`);
  }

  function showFundEditModal() {
    const fund=funds.find(f=>f.id===state.selectedFundId)||funds[0];
    showModal('Edit fund',fund.name, `<form id="fundEditForm"><div class="form-grid"><div class="form-field full"><label>Fund name</label><input name="name" value="${escapeHTML(fund.name)}"></div><div class="form-field"><label>Status</label><select name="status"><option ${fund.status==='Investing'?'selected':''}>Investing</option><option ${fund.status==='Fundraising'?'selected':''}>Fundraising</option><option ${fund.status==='Realising'?'selected':''}>Realising</option><option>Closed</option></select></div><div class="form-field"><label>Strategy</label><input name="strategy" value="${escapeHTML(fund.strategy)}"></div><div class="form-field"><label>Primary geography</label><input name="geography" value="${escapeHTML(fund.geography)}"></div><div class="form-field"><label>Management fee</label><input name="managementFee" value="${escapeHTML(fund.managementFee)}"></div><div class="form-field full"><label>Carry terms</label><input name="carry" value="${escapeHTML(fund.carry)}"></div></div></form>`, `${button('Cancel','close-modal')}${button('Save changes','submit-fund-edit','primary','save')}`);
  }

  function submitFundEdit() {
    const form=$('#fundEditForm'); if(!form?.reportValidity()) return;
    const fund=funds.find(f=>f.id===state.selectedFundId)||funds[0];
    const data=Object.fromEntries(new FormData(form)); Object.assign(fund,data);
    closeOverlays(); toast('Fund updated',`${fund.name} was updated.`); render();
  }

  function handleChangeAction(action, target) {
    switch(action) {
      case 'fund-filter': state.activeFund=target.value; toast('Fund filter updated',target.value); render(); break;
      case 'date-filter': state.asOfDate=target.value; toast('Reporting date updated',target.value); render(); break;
      case 'theme-setting': state.theme=target.value.toLowerCase(); storage.set('matanho-portfolio-theme',state.theme); render(); break;
      case 'analytics-period': state.analyticsPeriod=target.value; render(); break;
      case 'analytics-view': state.analyticsView=target.value; render(); break;
      case 'cash-currency': state.cashCurrency=target.value; render(); break;
      case 'reconciliation-period': state.reconciliationPeriod=target.value; render(); break;
      case 'report-vault-fund': state.reportFilterFund=target.value; render(); break;
      case 'report-vault-status': state.reportFilterStatus=target.value; render(); break;
      case 'term-version-filter': case 'term-status-filter': case 'term-owner-filter': case 'reconciliation-status-filter': case 'reconciliation-amount-filter': case 'expanded-recon-date': case 'expanded-recon-status': case 'expanded-recon-tolerance': case 'report-vault-type': case 'report-vault-period': case 'mailer-type-filter': case 'mailer-status-filter': case 'mailer-channel-filter': case 'dashboard-fund-filter': case 'dashboard-period-filter': case 'dashboard-currency-filter': case 'dashboard-geography-filter': case 'deal-fund-filter': case 'deal-stage-filter': case 'deal-owner-filter': case 'deal-age-filter': case 'fund-vintage-filter': case 'fund-strategy-filter': case 'fund-status-filter': case 'fund-currency-filter': toast('Filter updated',target.value); softFocus(target.closest('.workspace-filter-bar')||target); break;
      case 'ic-vote': state.dealVote[target.dataset.member]=target.value; toast('Vote updated',`${target.dataset.member}: ${target.value}`); render(); break;
      default: toast('Selection updated',target.value || 'Value changed');
    }
  }

  function uploadDocuments(fileList) {
    const files=Array.from(fileList||[]); if(!files.length) return;
    files.forEach((file,index)=>documents.push({id:`DOC-${String(documents.length+1).padStart(3,'0')}`,name:file.name,type:(file.name.split('.').pop()||'FILE').toUpperCase(),version:'v1.0',owner:'Tariro Moyo',uploaded:'31 Jul 2026',status:'In review',access:'Internal',folder:state.selectedFolder}));
    state.selectedDocumentId=documents[documents.length-files.length].id;
    toast('Files uploaded',`${files.length} file${files.length===1?'':'s'} added to ${state.selectedFolder}.`); render();
  }

  let searchTimer;
  document.addEventListener('submit', event => { event.preventDefault(); }, __pv11Sig);

  document.addEventListener('click', event => {
    const trigger=event.target.closest('[data-action]');
    if (!trigger) {
      if (state.popover && !event.target.closest('.popover')) { popoverLayer.innerHTML=''; popoverLayer.style.pointerEvents='none'; state.popover=null; }
      return;
    }
    if (trigger.disabled) return;
    event.preventDefault();
    const action = trigger.dataset.action;
    const detail = { action, dataset: { ...trigger.dataset }, state: publicSnapshot().state };
    const proceed = emitIntegrationEvent('matanho:before-action', detail, true);
    if (!proceed) return;
    handleAction(action,trigger,event);
    queueMicrotask(() => emitIntegrationEvent('matanho:after-action', { ...detail, state: publicSnapshot().state }));
  }, __pv11Sig);

  document.addEventListener('change', event => {
    const target=event.target;
    if(target.dataset.changeAction) handleChangeAction(target.dataset.changeAction,target);
    if(target.dataset.fileAction==='upload-document') uploadDocuments(target.files);
    if(target.dataset.fileAction==='upload-bank-statement') uploadBankStatement(target.files);
  }, __pv11Sig);

  document.addEventListener('input', event => {
    const target=event.target;
    if(target.dataset.inputAction==='command-search') openCommandPalette(target.value);
    if(target.dataset.inputAction==='table-search') {
      clearTimeout(searchTimer);
      searchTimer=setTimeout(()=>{ state.tableSearch=target.value; render(); requestAnimationFrame(()=>{ const input=$('[data-input-action="table-search"]'); if(input){input.focus(); input.setSelectionRange(input.value.length,input.value.length);} }); },180);
    }
  }, __pv11Sig);

  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-action="chart-drilldown"], .metric-card.clickable')) { event.preventDefault(); event.target.click(); return; }
    if ((event.metaKey||event.ctrlKey) && event.key.toLowerCase()==='k') { event.preventDefault(); openCommandPalette(); }
    if (event.key==='Escape') { closeOverlays(); state.mobileNavOpen=false; sidebar.classList.remove('mobile-open'); }
    if (commandPalette.classList.contains('open') && event.key==='Enter') {
      const first=$('.command-result',commandPalette); if(first){ event.preventDefault(); first.click(); }
    }
  }, __pv11Sig);

  window.addEventListener('resize',()=>{ if(state.popover){ popoverLayer.innerHTML=''; popoverLayer.style.pointerEvents='none'; state.popover=null; } });


  // ---------------------------------------------------------------------------
  // V9 INTERACTIVE REPORTING, MAILER PEOPLE AND LETTERHEAD ENHANCEMENTS
  // ---------------------------------------------------------------------------
  const v9Letterhead = {
    organisation: 'Matanho Capital',
    product: 'Investment Management ERP',
    address: '4th Floor, Matanho House · Harare, Zimbabwe',
    email: 'investor-relations@matanho.com',
    phone: '+263 77 245 8890',
    website: 'www.matanho.com',
    footer: 'Private and confidential · Prepared for authorised recipients only',
    accent: '#2563eb',
    logoScale: 'medium',
    alignment: 'left',
    showLogo: true,
    showAddress: true,
    showFooter: true,
    logoDataUrl: ''
  };

  const v9MailerPeople = {};
  const v9SeedPeople = [
    ['Tendai Moyo','tendai.moyo@example.com','LP primary contact','Verified','Secure email + portal','Matanho Growth Fund II'],
    ['Chipo Ndlovu','chipo.ndlovu@example.com','Finance contact','Verified','Secure email','Matanho Growth Fund II'],
    ['Rudo Sibanda','rudo.sibanda@example.com','Authorised signatory','Pending review','LP portal','All Funds'],
    ['Nyasha Dube','nyasha.dube@example.com','Reporting contact','Verified','Secure email','All Funds'],
    ['Tariro Kasere','tariro.kasere@example.com','Board observer','Verified','Secure email','All Funds'],
    ['Anita Kapoor','anita.kapoor@example.com','Compliance contact','Verified','Secure email','All Funds']
  ];
  mailerLists.forEach((list,listIndex)=>{
    v9MailerPeople[list.id]=v9SeedPeople.slice(0,4+(listIndex%3)).map((row,index)=>({
      id:`${list.id}-P${index+1}`,
      name:row[0], email:row[1], role:row[2], status:row[3], delivery:row[4], fund:row[5],
      source:index<2?list.source:'Manually managed', consent:index===2?'Review required':list.consent,
      added:'31 Jul 2026', manual:index>=2
    }));
  });

  const v9ReportSections = [
    { id:'executive-summary', title:'Executive Summary', status:'Complete', body:`<h2>1. Executive Summary</h2><p class="report-lead">Matanho Growth Fund II delivered resilient performance during the quarter, supported by operating improvements, disciplined deployment and two liquidity events.</p><div class="report-kpi-row"><div><span>Net IRR</span><strong>18.7%</strong><small>+1.6pp quarter-on-quarter</small></div><div><span>TVPI</span><strong>2.18x</strong><small>+0.14x quarter-on-quarter</small></div><div><span>DPI</span><strong>0.62x</strong><small>Distributions of USD 37.0M</small></div></div><h3>Quarter highlights</h3><ul><li>GreenOrbit Energy realisation completed above the March valuation.</li><li>Nova Analytics Series B term sheet advanced to electronic signature.</li><li>Portfolio reporting compliance improved to 94% by the quarter-end cut-off.</li></ul><div class="report-callout"><strong>Investment team outlook</strong><p>The team remains selective on new deployment while prioritising value creation, liquidity and risk controls across the existing portfolio.</p></div>` },
    { id:'fund-performance', title:'Fund Performance', status:'Complete', body:`<h2>2. Fund Performance</h2><section class="grid cols-3"><div><span class="muted small">Net IRR</span><div class="metric-value">18.7%</div><div class="positive small">↑ 1.6% vs 31 Mar 2026</div></div><div><span class="muted small">TVPI</span><div class="metric-value">2.18x</div><div class="positive small">↑ 0.14x vs 31 Mar 2026</div></div><div>${lineChart({labels:['Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'Net Cash Flow',color:'var(--blue)',values:[0,-48,-68,-8,42]}],height:160,format:v=>`${Math.round(v)}M`})}</div></section><section class="grid cols-2 section-gap"><div>${barChart({labels:['Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'Contributions',color:'var(--blue)',values:[62,79,88,94,105]},{name:'Distributions',color:'var(--emerald)',values:[18,52,24,68,37]}],height:190,format:v=>`${Math.round(v)}M`})}</div><div><h3>Performance commentary</h3><p>Matanho Growth Fund II delivered a Net IRR of 18.7% and a TVPI of 2.18x as at 30 June 2026. Strong realisations from GreenOrbit Energy and Mukuru Logistics drove positive net cash flows this quarter.</p><p>Market conditions remain supportive, with continued operational improvement across the portfolio. The team remains focused on disciplined capital deployment.</p></div></section><div class="table-wrap section-gap"><table class="criteria-table"><thead><tr><th>Metric</th><th>Q2 2026</th><th>Q1 2026</th><th>Q4 2025</th><th>Since inception</th></tr></thead><tbody><tr><td class="table-primary">Net IRR</td><td>18.7%</td><td>17.1%</td><td>15.2%</td><td>18.7%</td></tr><tr><td class="table-primary">TVPI</td><td>2.18x</td><td>2.02x</td><td>1.84x</td><td>2.18x</td></tr><tr><td class="table-primary">DPI</td><td>0.62x</td><td>0.56x</td><td>0.48x</td><td>0.62x</td></tr></tbody></table></div>` },
    { id:'portfolio-review', title:'Portfolio Review', status:'Complete', body:`<h2>3. Portfolio Review</h2><p>The portfolio remains diversified across technology, financial services, food production, logistics and climate infrastructure.</p><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Company</th><th>Revenue growth</th><th>EBITDA margin</th><th>Runway</th><th>Health</th></tr></thead><tbody><tr><td>Nova Analytics</td><td>42%</td><td>18%</td><td>21 months</td><td>On track</td></tr><tr><td>Mukuru Logistics</td><td>27%</td><td>14%</td><td>18 months</td><td>On track</td></tr><tr><td>Nyasha Foods</td><td>11%</td><td>9%</td><td>13 months</td><td>Watch</td></tr></tbody></table></div><h3>Priority interventions</h3><ol><li>Complete Nova Analytics cybersecurity certification.</li><li>Support Nyasha Foods working-capital optimisation.</li><li>Accelerate Mukuru Logistics regional route density programme.</li></ol>` },
    { id:'capital-activity', title:'Capital Activity', status:'Complete', body:`<h2>4. Capital Activity</h2><div class="report-kpi-row"><div><span>Capital called</span><strong>USD 42.5M</strong><small>96% collected</small></div><div><span>Invested</span><strong>USD 31.0M</strong><small>Three transactions</small></div><div><span>Distributed</span><strong>USD 37.0M</strong><small>Two realisations</small></div></div><h3>Movement ledger</h3><div class="table-wrap"><table class="criteria-table"><thead><tr><th>Date</th><th>Event</th><th>Fund / vehicle</th><th>Amount</th><th>Status</th></tr></thead><tbody><tr><td>04 Apr 2026</td><td>Capital call receipt</td><td>MGF II Main</td><td>USD 25.0M</td><td>Reconciled</td></tr><tr><td>29 Apr 2026</td><td>Follow-on investment</td><td>Nova Analytics</td><td>(USD 12.0M)</td><td>Posted</td></tr><tr><td>16 Jun 2026</td><td>Exit distribution</td><td>GreenOrbit Energy</td><td>USD 37.0M</td><td>Distributed</td></tr></tbody></table></div>` },
    { id:'valuation', title:'Valuation', status:'Attention', body:`<h2>5. Valuation</h2><div class="report-callout warning"><strong>Review required</strong><p>Nyasha Foods valuation evidence is older than 90 days. Refresh the source model before publication.</p></div><p>The quarter-end valuation was prepared using the approved IPEV framework, current operating performance and market calibration.</p><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Company</th><th>Method</th><th>Prior fair value</th><th>Current fair value</th><th>Movement</th></tr></thead><tbody><tr><td>Nova Analytics</td><td>Revenue multiple</td><td>USD 82.0M</td><td>USD 96.0M</td><td>+17.1%</td></tr><tr><td>Mukuru Logistics</td><td>EBITDA multiple</td><td>USD 58.0M</td><td>USD 64.0M</td><td>+10.3%</td></tr><tr><td>Nyasha Foods</td><td>DCF / market calibration</td><td>USD 41.0M</td><td>USD 40.5M</td><td>-1.2%</td></tr></tbody></table></div>` },
    { id:'esg-impact', title:'ESG & Impact', status:'Complete', body:`<h2>6. ESG & Impact</h2><p>Portfolio companies supported 2,840 direct jobs during the quarter, including 1,460 roles held by women and young professionals.</p><div class="report-kpi-row"><div><span>Direct jobs</span><strong>2,840</strong><small>+8.2% year-on-year</small></div><div><span>Women in leadership</span><strong>41%</strong><small>Across portfolio executives</small></div><div><span>Renewable capacity</span><strong>48 MW</strong><small>Operating or under construction</small></div></div>` },
    { id:'financial-statements', title:'Financial Statements', status:'Complete', body:`<h2>7. Financial Statements</h2><p>The following condensed schedules are sourced from the approved fund-accounting close for the quarter.</p><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Statement</th><th>Current quarter</th><th>Prior quarter</th><th>Variance</th></tr></thead><tbody><tr><td>Net asset value</td><td>USD 412.6M</td><td>USD 389.4M</td><td>+6.0%</td></tr><tr><td>Investment income</td><td>USD 18.4M</td><td>USD 15.1M</td><td>+21.9%</td></tr><tr><td>Operating expenses</td><td>USD 3.8M</td><td>USD 3.5M</td><td>+8.6%</td></tr></tbody></table></div>` },
    { id:'lp-appendix', title:'LP Appendix', status:'Attention', body:`<h2>8. LP Appendix</h2><p>This appendix contains commitment, capital-account and distribution schedules for authorised limited partners.</p><div class="report-callout"><strong>Distribution control</strong><p>Recipient-specific schedules are generated at publication and remain permission-scoped in the LP portal.</p></div><h3>Included schedules</h3><ul><li>Commitment and unfunded commitment summary</li><li>Capital calls and receipts ledger</li><li>Distribution waterfall summary</li><li>Quarterly capital-account statement</li></ul>` }
  ];

  Object.assign(state, {
    reportZoom: 100,
    reportAutosave: 'Saved just now',
    reportFocusMode: false,
    reportTemplate: 'Institutional',
    reportSection: Math.min(state.reportSection || 1, v9ReportSections.length),
    pendingMailerRemoval: null,
    editingMailerPerson: null
  });

  function v9RenderLetterhead(settings=v9Letterhead,{compact=false,editable=false}={}) {
    const sizeClass=`logo-${settings.logoScale||'medium'}`;
    const alignClass=`align-${settings.alignment||'left'}`;
    const logo=settings.logoDataUrl
      ? `<img src="${settings.logoDataUrl}" alt="${escapeHTML(settings.organisation)} logo">`
      : `<span class="letterhead-wordmark">MATANHO</span>`;
    return `<header class="document-letterhead v9-letterhead ${sizeClass} ${alignClass} ${editable?'letterhead-editable':''}" style="--letterhead-accent:${escapeHTML(settings.accent)}" ${editable?'data-action="edit-letterhead" title="Edit letterhead"':''}><div class="letterhead-brand">${settings.showLogo?logo:''}<div><strong>${escapeHTML(settings.organisation)}</strong><small>${escapeHTML(settings.product)}</small></div></div>${settings.showAddress?`<div class="letterhead-contact"><span>${escapeHTML(settings.address)}</span><span>${escapeHTML(settings.email)} · ${escapeHTML(settings.phone)}</span><span>${escapeHTML(settings.website)}</span></div>`:''}</header>`;
  }

  function v9LetterheadFooter() {
    return v9Letterhead.showFooter?`<footer class="report-letterhead-footer" style="--letterhead-accent:${escapeHTML(v9Letterhead.accent)}"><span>${escapeHTML(v9Letterhead.footer)}</span><span>${escapeHTML(v9Letterhead.organisation)}</span></footer>`:'';
  }

  function v9GetMailerPeople(listId) {
    if(!v9MailerPeople[listId]) v9MailerPeople[listId]=[];
    return v9MailerPeople[listId];
  }

  function v9UpdateMailerCounts(list,person,delta) {
    list.members=Math.max(0,Number(list.members||0)+delta);
    if(person.status==='Verified') list.active=Math.max(0,Number(list.active||0)+delta);
    else if(person.status==='Bounced') list.bounced=Math.max(0,Number(list.bounced||0)+delta);
    else list.pending=Math.max(0,Number(list.pending||0)+delta);
    list.updated='01 Aug 2026 · just now';
  }

  function v9RenderMailerPeopleRows(listId,query='') {
    const normalized=String(query||'').trim().toLowerCase();
    return v9GetMailerPeople(listId).filter(person=>!normalized||[person.name,person.email,person.role,person.status,person.fund].join(' ').toLowerCase().includes(normalized)).map(person=>`<tr data-person-row="${person.id}"><td class="table-primary"><div class="recipient-cell">${avatar(person.name,1)}<span><strong>${escapeHTML(person.name)}</strong><small>${escapeHTML(person.email)}</small></span></div></td><td>${escapeHTML(person.role)}</td><td>${escapeHTML(person.fund)}</td><td>${statusPill(person.status,person.status==='Verified'?'success':person.status==='Bounced'?'danger':'warning')}</td><td>${escapeHTML(person.delivery)}</td><td>${escapeHTML(person.source)}</td><td><div class="row-actions">${button('View','mailer-member-detail','ghost compact','eye',`data-list-id="${listId}" data-person-id="${person.id}"`)}${button('Edit','edit-mailer-person','ghost compact','edit',`data-list-id="${listId}" data-person-id="${person.id}"`)}${button('Remove','remove-mailer-person','ghost compact','x',`data-list-id="${listId}" data-person-id="${person.id}"`)}</div></td></tr>`).join('') || `<tr><td colspan="7"><div class="empty-state compact">No people match the current search.</div></td></tr>`;
  }

  function v9ShowMailerPeopleManager(listId) {
    const list=mailerLists.find(item=>item.id===listId)||mailerLists[0];
    state.selectedMailerListId=list.id;
    showModal('Manage Mailer List People',`${list.name} · add, edit or remove individually managed recipients`,`<div class="mailer-people-layout"><aside class="mailer-add-person"><div class="modal-section-heading"><div><span class="overlay-eyebrow">Direct membership</span><h3>Add a person</h3></div>${statusPill(`${list.members} total`,'info')}</div><form id="mailerPersonForm"><input type="hidden" name="listId" value="${list.id}"><div class="form-field"><label class="required">Full name</label><input name="name" required placeholder="e.g. Tafadzwa Moyo"></div><div class="form-field"><label class="required">Email address</label><input name="email" type="email" required placeholder="name@organisation.com"></div><div class="form-field"><label>Role</label><input name="role" value="Reporting contact"></div><div class="form-field"><label>Fund scope</label><select name="fund"><option>All Funds</option>${funds.map(f=>`<option>${escapeHTML(f.name)}</option>`).join('')}</select></div><div class="form-field"><label>Delivery</label><select name="delivery"><option>Secure email + portal</option><option>Secure email</option><option>LP portal</option><option>Email</option></select></div><div class="form-field"><label>Authority status</label><select name="status"><option>Verified</option><option>Pending review</option><option>Suppressed</option><option>Bounced</option></select></div><div class="form-field"><label>Consent / authority evidence</label><textarea name="consent">Business relationship and approved reporting authority.</textarea></div>${button('Add person','submit-mailer-person','primary','plus')}</form><div class="reason-item section-gap">${icon('shield')}<div><strong>Governed audience</strong><small>Direct additions remain visible separately from rule-derived membership and require documented authority.</small></div></div></aside><main class="mailer-people-register"><div class="table-toolbar"><div><h3>People register</h3><span class="table-badge">${v9GetMailerPeople(list.id).length} locally managed records</span></div><label class="table-search">${icon('search')}<input data-input-action="mailer-people-search" data-list-id="${list.id}" placeholder="Search name, email, role or fund"></label></div><div class="table-wrap"><table><thead><tr><th>Person</th><th>Role</th><th>Fund</th><th>Status</th><th>Delivery</th><th>Source</th><th>Actions</th></tr></thead><tbody id="mailerPeopleRows">${v9RenderMailerPeopleRows(list.id)}</tbody></table></div></main></div>`,`${button('Export people','export-mailer-list','','download',`data-id="${list.id}"`)}${button('Close','close-modal','primary')}`,{variant:'inspector',size:'xl',rail:['People','Permissions','Suppression','Audit'],eyebrow:'Mailer list membership'});
  }

  function v9SubmitMailerPerson() {
    const form=$('#mailerPersonForm'); if(!form?.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form));
    const list=mailerLists.find(item=>item.id===data.listId)||mailerLists[0];
    const person={id:`${list.id}-P${Date.now().toString(36)}`,name:data.name,email:data.email,role:data.role,fund:data.fund,delivery:data.delivery,status:data.status,consent:data.consent,source:'Manually managed',added:'01 Aug 2026',manual:true};
    v9GetMailerPeople(list.id).unshift(person); v9UpdateMailerCounts(list,person,1);
    toast('Person added',`${person.name} was added to ${list.name}.`);
    v9ShowMailerPeopleManager(list.id);
  }

  function v9ShowMailerPersonEditor(listId,personId) {
    const person=v9GetMailerPeople(listId).find(item=>item.id===personId); if(!person) return;
    state.editingMailerPerson={listId,personId};
    showModal('Edit Mailer Recipient',`${person.name} · ${person.email}`,`<form id="editMailerPersonForm"><input type="hidden" name="listId" value="${listId}"><input type="hidden" name="personId" value="${personId}"><div class="form-grid"><div class="form-field"><label>Full name</label><input name="name" value="${escapeHTML(person.name)}"></div><div class="form-field"><label>Email</label><input name="email" type="email" value="${escapeHTML(person.email)}"></div><div class="form-field"><label>Role</label><input name="role" value="${escapeHTML(person.role)}"></div><div class="form-field"><label>Fund</label><input name="fund" value="${escapeHTML(person.fund)}"></div><div class="form-field"><label>Status</label><select name="status">${['Verified','Pending review','Suppressed','Bounced'].map(status=>`<option ${person.status===status?'selected':''}>${status}</option>`).join('')}</select></div><div class="form-field"><label>Delivery</label><select name="delivery">${['Secure email + portal','Secure email','LP portal','Email'].map(value=>`<option ${person.delivery===value?'selected':''}>${value}</option>`).join('')}</select></div><div class="form-field full"><label>Authority evidence</label><textarea name="consent">${escapeHTML(person.consent||'')}</textarea></div></div></form>`,`${button('Cancel','manage-mailer-people','','arrow-left',`data-id="${listId}"`)}${button('Save changes','save-mailer-person','primary','save')}`,{variant:'inspector',size:'md',eyebrow:'Recipient profile'});
  }

  function v9SaveMailerPerson() {
    const form=$('#editMailerPersonForm'); if(!form?.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form)); const person=v9GetMailerPeople(data.listId).find(item=>item.id===data.personId); if(!person) return;
    const list=mailerLists.find(item=>item.id===data.listId)||mailerLists[0];
    if(person.status!==data.status){v9UpdateMailerCounts(list,person,-1);Object.assign(person,data);v9UpdateMailerCounts(list,person,1);} else Object.assign(person,data);
    toast('Recipient updated',`${person.name}'s delivery and authority profile was saved.`); v9ShowMailerPeopleManager(data.listId);
  }

  function v9ShowMailerMemberDetail(listId,personId) {
    const person=v9GetMailerPeople(listId).find(item=>item.id===personId); if(!person) return;
    showDrawer(person.name,`${person.role} · ${person.status}`,`<section class="drawer-section mailer-hero"><div>${avatar(person.name,2)}<div><strong>${escapeHTML(person.email)}</strong><small>${escapeHTML(person.delivery)}</small></div></div>${statusPill(person.status,person.status==='Verified'?'success':'warning')}</section><section class="drawer-section"><h3>Membership metadata</h3><div class="info-list"><div class="info-row"><span>Fund scope</span><strong>${escapeHTML(person.fund)}</strong></div><div class="info-row"><span>Source</span><strong>${escapeHTML(person.source)}</strong></div><div class="info-row"><span>Consent / authority</span><strong>${escapeHTML(person.consent)}</strong></div><div class="info-row"><span>Added</span><strong>${escapeHTML(person.added)}</strong></div><div class="info-row"><span>List</span><strong>${escapeHTML((mailerLists.find(item=>item.id===listId)||mailerLists[0]).name)}</strong></div></div></section><section class="drawer-section"><h3>Delivery activity</h3><div class="case-timeline"><div><span></span><strong>Quarterly report delivered</strong><small>31 Jul 2026 · Secure email</small></div><div><span></span><strong>Portal notification opened</strong><small>31 Jul 2026 · 17:46</small></div></div></section>`,`${button('Edit person','edit-mailer-person','','edit',`data-list-id="${listId}" data-person-id="${personId}"`)}${button('Close','close-drawer','primary')}`,{variant:'record',icon:'users',eyebrow:'Mailer recipient'});
  }

  function v9ShowRemoveMailerPerson(listId,personId) {
    const person=v9GetMailerPeople(listId).find(item=>item.id===personId); if(!person) return;
    state.pendingMailerRemoval={listId,personId};
    showModal('Remove Person from Mailer List',`${person.name} · ${person.email}`,`<div class="decision-confirmation"><div class="decision-icon reject">${icon('alert')}</div><div><h3>Remove this recipient?</h3><p>This removes the person from this governed list only. It does not delete their LP, company or contact profile.</p></div></div><div class="info-list section-gap"><div class="info-row"><span>Role</span><strong>${escapeHTML(person.role)}</strong></div><div class="info-row"><span>Fund scope</span><strong>${escapeHTML(person.fund)}</strong></div><div class="info-row"><span>Current delivery</span><strong>${escapeHTML(person.delivery)}</strong></div><div class="info-row"><span>Authority</span><strong>${escapeHTML(person.status)}</strong></div></div><div class="form-field section-gap"><label>Removal reason</label><textarea id="mailerRemovalReason">Role changed or communication authority removed.</textarea></div>`,`${button('Cancel','manage-mailer-people','','arrow-left',`data-id="${listId}"`)}${button('Remove person','confirm-remove-mailer-person','danger','x')}`,{variant:'approval',size:'md',rail:['Impact','Authority','Reason','Confirm'],eyebrow:'Controlled audience change'});
  }

  function v9ConfirmRemoveMailerPerson() {
    const pending=state.pendingMailerRemoval; if(!pending) return;
    const people=v9GetMailerPeople(pending.listId); const index=people.findIndex(item=>item.id===pending.personId); if(index<0) return;
    const [person]=people.splice(index,1); const list=mailerLists.find(item=>item.id===pending.listId)||mailerLists[0]; v9UpdateMailerCounts(list,person,-1);
    state.pendingMailerRemoval=null; toast('Person removed',`${person.name} was removed from ${list.name}.`); v9ShowMailerPeopleManager(list.id);
  }

  function v9SaveCurrentReportSection(silent=true) {
    const editor=$('#reportEditor'); const section=v9ReportSections[state.reportSection-1];
    if(editor&&section){section.body=editor.innerHTML;state.reportAutosave='Saved just now'; const count=editor.innerText.trim()?editor.innerText.trim().split(/\s+/).length:0; const badge=$('[data-report-word-count]'); if(badge) badge.textContent=`${count.toLocaleString()} words`; if(!silent) toast('Report section saved',`${section.title} was saved to the current working version.`);}
  }

  function v9ReportToolbarButton(label,action,iconName='',attrs='') {
    return `<button class="editor-tool labeled-tool" data-action="${action}" ${attrs} title="${escapeHTML(label)}">${iconName?icon(iconName):`<span>${escapeHTML(label)}</span>`}</button>`;
  }

  function v9RenderReportInspector() {
    if(state.reportBuilderTab==='design') return `<div class="inspector-section"><h4>Document design</h4><div class="info-list"><div class="info-row"><span>Template</span><strong>${escapeHTML(state.reportTemplate)}</strong></div><div class="info-row"><span>Letterhead</span><strong>${escapeHTML(v9Letterhead.organisation)}</strong></div><div class="info-row"><span>Accent</span><strong><span class="colour-swatch" style="background:${escapeHTML(v9Letterhead.accent)}"></span>${escapeHTML(v9Letterhead.accent)}</strong></div></div><div class="section-gap">${button('Edit letterhead','edit-letterhead','primary','edit')}</div><div class="form-field section-gap"><label>Report template</label><select data-change-action="report-template"><option ${state.reportTemplate==='Institutional'?'selected':''}>Institutional</option><option ${state.reportTemplate==='Board pack'?'selected':''}>Board pack</option><option ${state.reportTemplate==='Investor letter'?'selected':''}>Investor letter</option><option ${state.reportTemplate==='Data-led'?'selected':''}>Data-led</option></select></div></div><div class="inspector-section"><h4>Page controls</h4><div class="action-grid">${button('Add KPI block','editor-add-block','compact','plus','data-kind="kpi"')}${button('Add table','editor-add-block','compact','grid','data-kind="table"')}${button('Add callout','editor-add-block','compact','info','data-kind="callout"')}</div></div>`;
    if(state.reportBuilderTab==='commentary') return `<div class="inspector-section"><h4>Commentary guidance</h4><div class="reason-list"><div class="reason-item warning">${icon('sparkles')}<div><strong>Draft suggestion</strong><small>Explain the principal valuation and cash-flow drivers using linked evidence.</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>Tone</strong><small>Institutional, concise and evidence-based.</small></div></div></div></div><div class="inspector-section"><h4>Draft notes</h4><textarea id="reportCommentaryDraft" style="width:100%;min-height:150px">Highlight GreenOrbit realisation, Nova Analytics growth and the Nyasha Foods valuation review.</textarea>${button('Insert into document','apply-commentary','primary compact','sparkles')}</div>`;
    if(state.reportBuilderTab==='review') return `<div class="inspector-section"><h4>Review comments</h4><div class="list-row">${avatar('Tendai Sibanda',1)}<span class="list-row-main"><strong>Tendai Sibanda · 2 hours ago</strong><small>Please update the Nyasha Foods valuation before publication.</small></span></div><textarea id="reportReviewComment" style="width:100%;margin-top:10px" placeholder="Add a review comment..."></textarea>${button('Add comment','add-report-comment','compact','send')}</div><div class="inspector-section"><h4>Approval path</h4><div class="timeline"><div class="timeline-item"><strong>Prepared by Tariro Ncube</strong><small>8 Jul 2026 · 09:15</small></div><div class="timeline-item"><strong>Reviewed by Rudo Moyo</strong><small>Pending</small></div><div class="timeline-item"><strong>Approved by Investment Committee</strong><small>Pending</small></div></div></div>`;
    if(state.reportBuilderTab==='distribution') return `<div class="inspector-section"><h4>Distribution</h4><div class="form-field"><label>Mailer list</label><select>${mailerLists.map(list=>`<option>${escapeHTML(list.name)} · ${list.active} active</option>`).join('')}</select></div><div class="section-gap">${button('Manage mailer people','manage-mailer-people','compact','users',`data-id="${state.selectedMailerListId}"`)}</div><div class="form-field section-gap"><label>Channels</label><label class="checkbox-row"><input type="checkbox" checked> LP Portal</label><label class="checkbox-row"><input type="checkbox" checked> Secure Email</label></div><div class="form-field section-gap"><label>Publish date</label><input type="date" value="2026-08-05"></div>${button('Schedule distribution','schedule-distribution','primary','calendar')}</div>`;
    return `<div class="inspector-section"><h4>Linked source data</h4><div class="source-data-list"><button data-action="activity-open-metadata" data-context="report-source" data-id="portfolio-valuations"><span>${icon('bar-chart')}</span><div><strong>Portfolio valuations</strong><small>VAL-Q2-v3.1 · Approved</small></div>${statusPill('Current','success')}</button><button data-action="activity-open-metadata" data-context="report-source" data-id="cash-position"><span>${icon('wallet')}</span><div><strong>Fund cash position</strong><small>CASH-0731-v4 · Reconciled</small></div>${statusPill('Current','success')}</button><button data-action="activity-open-metadata" data-context="report-source" data-id="portfolio-kpis"><span>${icon('line-chart')}</span><div><strong>Portfolio KPI submissions</strong><small>KPI-Q2-v7 · 2 exceptions</small></div>${statusPill('Review','warning')}</button></div>${button('Refresh linked data','refresh-report-data','primary compact','refresh')}</div><div class="inspector-section"><h4>Validation</h4><div class="reason-list"><div class="reason-item warning">${icon('alert')}<div><strong>Valuation</strong><small>Nyasha Foods evidence is older than 90 days.</small></div></div><div class="reason-item warning">${icon('alert')}<div><strong>ESG</strong><small>One impact data point requires review.</small></div></div></div></div>`;
  }

  renderReportInspector = v9RenderReportInspector;

  renderReportBuilder = function() {
    const selectedIndex=clamp((state.reportSection||1)-1,0,v9ReportSections.length-1); const selected=v9ReportSections[selectedIndex];
    const outline=v9ReportSections.map((section,index)=>`<div class="outline-item ${selectedIndex===index?'active brand-text':''}" data-action="select-report-section" data-section="${index+1}"><span class="drag">${icon('drag')}</span><span class="risk-score ${section.status==='Complete'?'good':'medium'}">${index+1}</span><strong>${escapeHTML(section.title)}</strong>${section.status==='Complete'?icon('check-circle'):icon('alert')}<span class="outline-actions">${button('','move-report-section','ghost compact icon-only','chevron-left',`data-index="${index}" data-direction="-1" aria-label="Move section up"`)}${button('','move-report-section','ghost compact icon-only','chevron-right',`data-index="${index}" data-direction="1" aria-label="Move section down"`)}${index?button('','remove-report-section','ghost compact icon-only','x',`data-index="${index}" aria-label="Remove section"`):''}</span></div>`).join('');
    return `${pageHeader('Q2 2026 Fund Report Pack','Edit report content directly, manage source data and control publication.',`${statusPill('Autosave active','success')}${statusPill('2 issues','danger')}${button('Edit letterhead','edit-letterhead','','edit')}${button('Preview','preview-report','','eye')}${button('Save draft','save-report','','save')}${button('Request review','request-report-review','','users')}${button('Publish','publish-report','primary','upload')}`,'Report Builder')}
      <section class="report-builder ${state.reportFocusMode?'focus-mode':''}">
        <div class="report-outline"><div class="card-head"><div><h3 class="card-title">Report Outline</h3><div class="card-subtitle">Select, reorder, add or remove sections</div></div>${button('Add section','add-report-section','compact','plus')}</div><div class="report-outline-list">${outline}</div><div class="card-footer">${button('Add section','add-report-section','compact','plus')}${button('Duplicate section','duplicate-report-section','compact','layers')}${button('Refresh data','refresh-report-data','compact','refresh')}</div><div class="inspector-section"><h4>Report details</h4><div class="info-list"><div class="info-row"><span>Fund</span><strong>Matanho Growth Fund II</strong></div><div class="info-row"><span>Period</span><strong>1 Apr – 30 Jun 2026</strong></div><div class="info-row"><span>Currency</span><strong>USD</strong></div><div class="info-row"><span>Working version</span><strong>v2.4 Draft</strong></div></div></div></div>
        <div class="editor-shell"><div class="editor-toolbar report-editor-toolbar"><div class="toolbar-group">${v9ReportToolbarButton('Undo','editor-format','refresh','data-command="undo"')}${v9ReportToolbarButton('Redo','editor-format','refresh','data-command="redo"')}${v9ReportToolbarButton('H2','editor-heading','','data-level="h2"')}${v9ReportToolbarButton('H3','editor-heading','','data-level="h3"')}${v9ReportToolbarButton('Bold','editor-format','bold','data-command="bold"')}${v9ReportToolbarButton('Italic','editor-format','italic','data-command="italic"')}${v9ReportToolbarButton('Bullet list','editor-format','list','data-command="insertUnorderedList"')}${v9ReportToolbarButton('Link','editor-link','link')}</div><div class="toolbar-divider"></div><div class="toolbar-group insert-tools">${v9ReportToolbarButton('Text block','editor-add-block','file','data-kind="text"')}${v9ReportToolbarButton('KPI block','editor-add-block','dashboard','data-kind="kpi"')}${v9ReportToolbarButton('Table','editor-add-block','grid','data-kind="table"')}${v9ReportToolbarButton('Callout','editor-add-block','info','data-kind="callout"')}<label class="editor-tool labeled-tool" title="Insert image">${icon('upload')}<input type="file" hidden accept="image/*" data-file-action="report-image"></label></div><div class="toolbar-spacer"></div><div class="toolbar-group">${v9ReportToolbarButton('Zoom out','report-zoom-out','x')}${v9ReportToolbarButton(`${state.reportZoom}%`,'report-zoom-reset','')}${v9ReportToolbarButton('Zoom in','report-zoom-in','plus')}${v9ReportToolbarButton('Focus mode','editor-maximize','maximize')}</div></div><div class="report-editor-status"><span>${icon('save')} ${escapeHTML(state.reportAutosave)}</span><span>${escapeHTML(selected.title)}</span><span data-report-word-count>— words</span></div><div class="report-editor-scroll"><article class="report-page report-page-editable" style="zoom:${state.reportZoom/100}">${v9RenderLetterhead(v9Letterhead,{editable:true})}<div class="report-page-rule"></div><main id="reportEditor" class="editor-content report-document-content" contenteditable="true" spellcheck="true" data-input-action="report-editor">${selected.body}</main>${v9LetterheadFooter()}<div class="report-page-number">Section ${selectedIndex+1} of ${v9ReportSections.length}</div></article></div></div>
        <div class="report-inspector"><div class="inspector-tabs">${['data','commentary','review','distribution','design'].map(tab=>`<button class="inspector-tab ${state.reportBuilderTab===tab?'active':''}" data-action="report-inspector-tab" data-tab="${tab}">${tab[0].toUpperCase()+tab.slice(1)}</button>`).join('')}</div>${v9RenderReportInspector()}</div>
      </section>`;
  };

  function v9ApplyEditorCommand(command,value=null) {
    const editor=$('#reportEditor'); if(!editor) return; editor.focus();
    try{document.execCommand(command,false,value);}catch{/* browser may restrict a legacy command */}
    v9SaveCurrentReportSection();
  }

  function v9InsertReportHTML(html) {
    const editor=$('#reportEditor'); if(!editor) return; editor.focus();
    try{document.execCommand('insertHTML',false,html);}catch{editor.insertAdjacentHTML('beforeend',html);}
    v9SaveCurrentReportSection();
  }

  function v9InsertReportBlock(kind) {
    const blocks={
      text:`<section class="report-editable-block"><h3>New section heading</h3><p>Replace this placeholder with concise, evidence-based commentary.</p></section>`,
      kpi:`<div class="report-kpi-row report-editable-block"><div><span>Metric one</span><strong>0.0%</strong><small>Add context</small></div><div><span>Metric two</span><strong>0.00x</strong><small>Add context</small></div><div><span>Metric three</span><strong>USD 0.0M</strong><small>Add context</small></div></div>`,
      table:`<div class="table-wrap report-editable-block"><table class="professional-doc-table"><thead><tr><th>Item</th><th>Current period</th><th>Prior period</th><th>Comment</th></tr></thead><tbody><tr><td>Editable row</td><td>0.0</td><td>0.0</td><td>Add narrative</td></tr><tr><td>Editable row</td><td>0.0</td><td>0.0</td><td>Add narrative</td></tr></tbody></table></div>`,
      callout:`<div class="report-callout report-editable-block"><strong>Key message</strong><p>Add the decision-relevant conclusion and cite the source record.</p></div>`,
      pagebreak:`<div class="report-page-break" contenteditable="false"><span>Page break</span></div>`
    };
    v9InsertReportHTML(blocks[kind]||blocks.text);
  }

  function v9ShowReportLinkModal() {
    showModal('Insert Link','Add a labelled source, evidence or external reference to the current report section.',`<form id="reportLinkForm"><div class="form-field"><label>Display text</label><input name="label" value="View supporting evidence"></div><div class="form-field section-gap"><label class="required">URL or source reference</label><input name="url" required value="https://data-room.matanho.local/evidence"></div><label class="checkbox-row section-gap"><input name="newTab" type="checkbox" checked> Open in a new tab</label></form>`,`${button('Cancel','close-modal')}${button('Insert link','insert-report-link','primary','link')}`,{variant:'compose',size:'md',rail:['Label','Destination','Access','Insert'],eyebrow:'In-document link'});
  }

  function v9ShowAddReportSection() {
    showModal('Add Report Section','Create a new editable section in the current report pack.',`<form id="addReportSectionForm"><div class="form-grid"><div class="form-field full"><label class="required">Section title</label><input name="title" required placeholder="e.g. Market Outlook"></div><div class="form-field"><label>Starting template</label><select name="template"><option>Narrative</option><option>KPI summary</option><option>Financial table</option><option>Portfolio review</option><option>Blank</option></select></div><div class="form-field"><label>Review status</label><select name="status"><option>Attention</option><option>Complete</option></select></div><div class="form-field full"><label>Purpose</label><textarea name="purpose">Add decision-relevant commentary, source data and supporting analysis.</textarea></div></div></form>`,`${button('Cancel','close-modal')}${button('Add section','submit-report-section','primary','plus')}`,{variant:'wizard',size:'md',rail:['Title','Template','Review','Create'],eyebrow:'Report structure'});
  }

  function v9SubmitReportSection() {
    const form=$('#addReportSectionForm'); if(!form?.reportValidity()) return; const data=Object.fromEntries(new FormData(form));
    const body=data.template==='KPI summary'?`<h2>${escapeHTML(data.title)}</h2><div class="report-kpi-row"><div><span>Metric one</span><strong>0.0%</strong><small>Add context</small></div><div><span>Metric two</span><strong>0.00x</strong><small>Add context</small></div><div><span>Metric three</span><strong>USD 0.0M</strong><small>Add context</small></div></div>`:data.template==='Financial table'?`<h2>${escapeHTML(data.title)}</h2><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Line item</th><th>Current</th><th>Prior</th><th>Variance</th></tr></thead><tbody><tr><td>Editable line</td><td>0.0</td><td>0.0</td><td>0.0%</td></tr></tbody></table></div>`:`<h2>${escapeHTML(data.title)}</h2><p>${escapeHTML(data.purpose)}</p>`;
    v9ReportSections.push({id:`section-${Date.now().toString(36)}`,title:data.title,status:data.status,body}); state.reportSection=v9ReportSections.length; closeOverlays(); toast('Section added',`${data.title} was added to the report outline.`); render();
  }

  function v9ShowRemoveReportSection(index) {
    const section=v9ReportSections[index]; if(!section||index===0) return;
    showModal('Remove Report Section',section.title,`<div class="decision-confirmation"><div class="decision-icon reject">${icon('alert')}</div><div><h3>Remove this section from the working draft?</h3><p>The published report and prior controlled versions remain unchanged.</p></div></div><div class="info-list section-gap"><div class="info-row"><span>Section</span><strong>${escapeHTML(section.title)}</strong></div><div class="info-row"><span>Status</span><strong>${statusPill(section.status)}</strong></div><div class="info-row"><span>Current version</span><strong>v2.4 Draft</strong></div></div>`,`${button('Cancel','close-modal')}${button('Remove section','confirm-remove-report-section','danger','x',`data-index="${index}"`)}`,{variant:'approval',size:'md',eyebrow:'Report structure change'});
  }

  function v9ShowLetterheadEditor() {
    showModal('Edit Letterhead','Customise the report and document header, contact block and controlled footer.',`<form id="letterheadForm"><div class="letterhead-editor-grid"><section><h3>Brand and identity</h3><div class="form-grid"><div class="form-field full"><label>Organisation</label><input name="organisation" data-input-action="letterhead-live" value="${escapeHTML(v9Letterhead.organisation)}"></div><div class="form-field full"><label>Product / division</label><input name="product" data-input-action="letterhead-live" value="${escapeHTML(v9Letterhead.product)}"></div><div class="form-field"><label>Accent colour</label><input name="accent" data-input-action="letterhead-live" type="color" value="${escapeHTML(v9Letterhead.accent)}"></div><div class="form-field"><label>Logo size</label><select name="logoScale" data-change-action="letterhead-live"><option ${v9Letterhead.logoScale==='small'?'selected':''}>small</option><option ${v9Letterhead.logoScale==='medium'?'selected':''}>medium</option><option ${v9Letterhead.logoScale==='large'?'selected':''}>large</option></select></div><div class="form-field"><label>Alignment</label><select name="alignment" data-change-action="letterhead-live"><option ${v9Letterhead.alignment==='left'?'selected':''}>left</option><option ${v9Letterhead.alignment==='center'?'selected':''}>center</option><option ${v9Letterhead.alignment==='right'?'selected':''}>right</option></select></div><div class="form-field"><label>Custom logo</label><label class="button compact">${icon('upload')} Upload image<input type="file" hidden accept="image/*" data-file-action="letterhead-logo"></label></div></div></section><section><h3>Contact and footer</h3><div class="form-grid"><div class="form-field full"><label>Address</label><input name="address" data-input-action="letterhead-live" value="${escapeHTML(v9Letterhead.address)}"></div><div class="form-field"><label>Email</label><input name="email" data-input-action="letterhead-live" value="${escapeHTML(v9Letterhead.email)}"></div><div class="form-field"><label>Phone</label><input name="phone" data-input-action="letterhead-live" value="${escapeHTML(v9Letterhead.phone)}"></div><div class="form-field full"><label>Website</label><input name="website" data-input-action="letterhead-live" value="${escapeHTML(v9Letterhead.website)}"></div><div class="form-field full"><label>Footer text</label><textarea name="footer" data-input-action="letterhead-live">${escapeHTML(v9Letterhead.footer)}</textarea></div><div class="form-field full"><label class="checkbox-row"><input name="showLogo" type="checkbox" ${v9Letterhead.showLogo?'checked':''} data-change-action="letterhead-live"> Show logo / wordmark</label><label class="checkbox-row"><input name="showAddress" type="checkbox" ${v9Letterhead.showAddress?'checked':''} data-change-action="letterhead-live"> Show contact block</label><label class="checkbox-row"><input name="showFooter" type="checkbox" ${v9Letterhead.showFooter?'checked':''} data-change-action="letterhead-live"> Show controlled footer</label></div></div></section></div><section class="letterhead-live-preview"><div class="modal-section-heading"><div><span class="overlay-eyebrow">Live preview</span><h3>Report letterhead</h3></div><span class="table-badge">A4 / responsive</span></div><div id="letterheadPreview" class="letterhead-preview-paper">${v9RenderLetterhead()}<div class="letterhead-preview-body"><small>QUARTERLY FUND REPORT · Q2 2026</small><h2>Matanho Growth Fund II</h2><p>Prepared for authorised limited partners.</p></div>${v9LetterheadFooter()}</div></section></form>`,`${button('Reset','reset-letterhead','','refresh')}${button('Cancel','close-modal')}${button('Save letterhead','save-letterhead','primary','save')}`,{variant:'document',size:'xl',eyebrow:'Letterhead designer'});
  }

  function v9LetterheadFromForm() {
    const form=$('#letterheadForm'); if(!form) return {...v9Letterhead}; const data=Object.fromEntries(new FormData(form));
    return {...v9Letterhead,...data,showLogo:Boolean(form.elements.showLogo?.checked),showAddress:Boolean(form.elements.showAddress?.checked),showFooter:Boolean(form.elements.showFooter?.checked)};
  }

  function v9RefreshLetterheadPreview() {
    const preview=$('#letterheadPreview'); if(!preview) return; const settings=v9LetterheadFromForm(); preview.innerHTML=`${v9RenderLetterhead(settings)}<div class="letterhead-preview-body"><small>QUARTERLY FUND REPORT · Q2 2026</small><h2>Matanho Growth Fund II</h2><p>Prepared for authorised limited partners.</p></div>${settings.showFooter?`<footer class="report-letterhead-footer" style="--letterhead-accent:${escapeHTML(settings.accent)}"><span>${escapeHTML(settings.footer)}</span><span>${escapeHTML(settings.organisation)}</span></footer>`:''}`;
  }

  function v9SaveLetterhead() {
    Object.assign(v9Letterhead,v9LetterheadFromForm()); closeOverlays(); toast('Letterhead updated','The new letterhead is applied to report previews, document previews and signature documents.'); render();
  }

  const v8ShowModal=showModal;
  showModal=function(title,subtitle,body,footer='',options={}){
    const variant=options.variant||overlayVariant(title,'modal'); const size=options.size||(/document|signature|reconciliation|import/.test(variant)?'xl':/wizard|approval|operations/.test(variant)?'lg':'md'); const railItems=options.rail||({wizard:['Details','Ownership','Review'],approval:['Impact','Evidence','Approval'],operations:['Context','Controls','Action'],compose:['Message','Recipients','Delivery'],inspector:['Properties','Permissions','Audit']}[variant]||[]);
    state.modal={title,variant};
    modalLayer.innerHTML=`<section class="modal modal-${variant} modal-${size}" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">${railItems.length?`<aside class="modal-rail"><span class="modal-rail-icon">${icon(options.icon||({wizard:'plus',approval:'shield',operations:'refresh',compose:'send',inspector:'settings'}[variant]||'file'))}</span><strong>${escapeHTML(options.eyebrow||variant.replaceAll('-',' '))}</strong>${railItems.map((item,index)=>`<button class="modal-rail-step ${index===0?'active':''}" data-action="modal-rail-step" data-step="${index}"><b>${index+1}</b>${escapeHTML(item)}</button>`).join('')}</aside>`:''}<div class="modal-main"><div class="modal-head"><div><span class="overlay-eyebrow">${escapeHTML(options.eyebrow||variant.replaceAll('-',' '))}</span><h2>${escapeHTML(title)}</h2>${subtitle?`<p>${escapeHTML(subtitle)}</p>`:''}</div><div class="modal-window-controls"><button class="icon-button" data-action="modal-toggle-size" aria-label="Toggle popup size" title="Toggle popup size">${icon('maximize')}</button><button class="icon-button" data-action="close-modal" aria-label="Close popup">${icon('x')}</button></div></div><div class="modal-body">${body}</div>${footer?`<div class="modal-foot">${footer}</div>`:''}</div></section>`;
    modalLayer.classList.add('visible'); scrim.classList.add('visible'); renderStaticIcons(modalLayer); requestAnimationFrame(()=>$('input,select,textarea,button',modalLayer)?.focus());
  };

  showMailerListDrawer=function(id){
    const list=mailerLists.find(item=>item.id===id)||mailerLists[0]; state.selectedMailerListId=list.id; const people=v9GetMailerPeople(list.id);
    showDrawer(list.name,`${list.id} · ${list.members} members · ${list.status}`,`<section class="drawer-section mailer-hero"><div><span>${icon('mail')}</span><div><strong>${list.members} recipients</strong><small>${escapeHTML(list.description)}</small></div></div>${statusPill(list.status)}</section><section class="drawer-section"><div class="section-heading-with-action"><h3>Audience rules</h3>${button('Manage people','manage-mailer-people','compact','users',`data-id="${list.id}"`)}</div><div class="info-list"><div class="info-row"><span>Source</span><strong>${escapeHTML(list.source)}</strong></div><div class="info-row"><span>Funds</span><strong>${escapeHTML(list.funds.join(', '))}</strong></div><div class="info-row"><span>Channels</span><strong>${escapeHTML(list.channels.join(', '))}</strong></div><div class="info-row"><span>Consent / authority</span><strong>${escapeHTML(list.consent)}</strong></div><div class="info-row"><span>Owner</span><strong>${escapeHTML(list.owner)}</strong></div><div class="info-row"><span>Last refreshed</span><strong>${escapeHTML(list.updated)}</strong></div></div></section><section class="drawer-section"><h3>Recipient health</h3>${donutChart([{label:'Active',value:list.active,color:'var(--emerald)',display:String(list.active)},{label:'Pending',value:list.pending,color:'var(--amber)',display:String(list.pending)},{label:'Bounced',value:list.bounced,color:'var(--red)',display:String(list.bounced)}],String(list.members),'Recipients',145)}</section><section class="drawer-section"><div class="section-heading-with-action"><h3>Managed people</h3><span class="table-badge">${people.length} shown</span></div><div class="recipient-mini-list">${people.slice(0,5).map(person=>`<button data-action="mailer-member-detail" data-list-id="${list.id}" data-person-id="${person.id}">${avatar(person.name,1)}<span><strong>${escapeHTML(person.name)}</strong><small>${escapeHTML(person.role)} · ${escapeHTML(person.email)}</small></span>${statusPill(person.status,person.status==='Verified'?'success':'warning')}</button>`).join('')}</div>${button('Open full people register','manage-mailer-people','primary compact','users',`data-id="${list.id}"`)}</section><section class="drawer-section"><h3>Recent campaigns</h3><div class="case-timeline"><div><span></span><strong>Q2 2026 Investor Report</strong><small>31 Jul 2026 · 97.4% delivered</small><p>Audience snapshot retained with campaign evidence.</p></div><div><span></span><strong>Annual Meeting Save the Date</strong><small>12 Jul 2026 · 94.7% opened</small><p>Approved communication authority applied.</p></div></div></section>`,`${button('Export audience','export-mailer-list','','download',`data-id="${list.id}"`)}${button('Manage people','manage-mailer-people','','users',`data-id="${list.id}"`)}${button('Create campaign','mailer-new-campaign','primary','send',`data-id="${list.id}"`)}`,{variant:'record',icon:'mail',eyebrow:'Mailer list'});
  };

  const v8ShowReportPreview=showReportPreview;
  showReportPreview=function(id,scheduled=null){v9SaveCurrentReportSection();v8ShowReportPreview(id,scheduled);requestAnimationFrame(()=>{const current=$('.document-letterhead',modalLayer);if(current)current.outerHTML=v9RenderLetterhead(v9Letterhead,{editable:true});const inspector=$('.report-preview-inspector',modalLayer);if(inspector&&!$('[data-v9-letterhead-button]',inspector))inspector.insertAdjacentHTML('beforeend',`<div class="section-gap" data-v9-letterhead-button>${button('Edit letterhead','edit-letterhead','','edit')}</div>`);});};
  const v8ShowDocumentPreview=showDocumentPreview;
  showDocumentPreview=function(id){v8ShowDocumentPreview(id);requestAnimationFrame(()=>{const current=$('.document-letterhead',modalLayer);if(current)current.outerHTML=v9RenderLetterhead(v9Letterhead,{editable:true});});};
  const v8ShowSignatureStudio=showSignatureStudio;
  showSignatureStudio=function(documentId,envelopeId=null){v8ShowSignatureStudio(documentId,envelopeId);requestAnimationFrame(()=>{const current=$('.document-letterhead',modalLayer);if(current)current.outerHTML=v9RenderLetterhead(v9Letterhead);});};

  let v9ReportAutosaveTimer;
  document.addEventListener('input',event=>{
    const target=event.target;
    if(target.dataset.inputAction==='report-editor'){
      clearTimeout(v9ReportAutosaveTimer); state.reportAutosave='Saving…'; const status=$('.report-editor-status span:first-child'); if(status)status.innerHTML=`${icon('save')} Saving…`;
      v9ReportAutosaveTimer=setTimeout(()=>{v9SaveCurrentReportSection();const next=$('.report-editor-status span:first-child');if(next)next.innerHTML=`${icon('check-circle')} Saved just now`;},500);
    }
    if(target.dataset.inputAction==='letterhead-live') v9RefreshLetterheadPreview();
    if(target.dataset.inputAction==='mailer-people-search'){const rows=$('#mailerPeopleRows');if(rows)rows.innerHTML=v9RenderMailerPeopleRows(target.dataset.listId,target.value);renderStaticIcons(rows);}
  });
  document.addEventListener('change',event=>{
    const target=event.target;
    if(target.dataset.changeAction==='letterhead-live') v9RefreshLetterheadPreview();
    if(target.dataset.changeAction==='report-template'){state.reportTemplate=target.value;toast('Template changed',`${target.value} styling is applied to the working draft.`);}
    if(target.dataset.fileAction==='letterhead-logo'&&target.files?.[0]){const reader=new FileReader();reader.onload=()=>{v9Letterhead.logoDataUrl=String(reader.result||'');v9RefreshLetterheadPreview();};reader.readAsDataURL(target.files[0]);}
    if(target.dataset.fileAction==='report-image'&&target.files?.[0]){const reader=new FileReader();reader.onload=()=>v9InsertReportHTML(`<figure class="report-image-block"><img src="${String(reader.result||'')}" alt="Inserted report image"><figcaption contenteditable="true">Add image caption and source.</figcaption></figure>`);reader.readAsDataURL(target.files[0]);}
  });
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'&&state.page==='report-builder'){event.preventDefault();v9SaveCurrentReportSection(false);}});

  const originalHandleAction=handleAction;
  handleAction=function(action,trigger,event){
    switch(action){
      case 'submit-create-fund': submitCreateFund(); return;
      case 'submit-report-schedule': submitReportSchedule(); return;
      case 'reset-dashboard-filters': toast('Dashboard filters reset','All funds, USD and the latest as-of date are selected.'); softFocus(trigger.closest('.workspace-filter-bar')); return;
      case 'save-company-update': closeOverlays(); toast('Update saved','The company update remains in draft.'); return;
      case 'publish-company-update': closeOverlays(); toast('Company update published','Portfolio monitoring and activity feeds were refreshed.'); render(); return;
      case 'submit-dd-task': submitDDTask(); return;
      case 'toggle-dd-task': { const task=state.dueDiligenceTasks.find(t=>t.id===trigger.dataset.id); if(task){task.status=task.status==='Complete'?'In Review':'Complete'; closeOverlays(); toast('Task updated',`${task.title}: ${task.status}`); render();} return; }
      case 'add-dd-comment': showSimpleCommentModal('Add diligence comment'); return;
      case 'confirm-release-tranche': closeOverlays(); toast('Release request created','USD 12.0M is awaiting two authorised signatories.'); return;
      case 'submit-create-folder': submitCreateFolder(); return;
      case 'submit-document-request': { const form=$('#requestDocumentForm'); if(!form?.reportValidity())return; const doc=new FormData(form).get('document'); closeOverlays(); toast('Document requested',`${doc} was requested through the secure portal.`); return; }
      case 'submit-clarification': closeOverlays(); toast('Clarification sent','The applicant was notified through the secure portal.'); return;
      case 'submit-comment': closeOverlays(); toast('Comment added','The note was saved to the record and audit trail.'); return;
      case 'submit-fund-edit': submitFundEdit(); return;
      case 'apply-filters': closeOverlays(); toast('Filters applied','The workspace view was refreshed.'); return;
      case 'reset-filters': closeOverlays(); toast('Filters reset','Showing all available records.'); return;
      case 'switch-module-demo': toast('Module switcher',`${trigger.dataset.module} would open in the full Matanho platform.`); closeOverlays(); return;
      case 'tenant-demo': toast('Workspace switcher','Tenant switching is simulated in this frontend prototype.'); closeOverlays(); return;
      case 'workspace-admin': closeOverlays(); navigate('settings'); return;
      case 'sign-out-demo': closeOverlays(); toast('Demo session','Sign-out is disabled in this frontend-only preview.','warning'); return;
      default: return originalHandleAction(action,trigger,event);
    }
  };


  const v9HandleAction=handleAction;
  handleAction=function(action,trigger,event){
    switch(action){
      case 'modal-toggle-size': { const modal=$('.modal',modalLayer); if(modal){modal.classList.toggle('modal-user-expanded'); const buttonNode=trigger; buttonNode.innerHTML=icon(modal.classList.contains('modal-user-expanded')?'x':'maximize');} return; }
      case 'modal-rail-step': { $$('.modal-rail-step',modalLayer).forEach(node=>node.classList.toggle('active',node===trigger)); const sections=$$('.modal-body > section,.modal-body > form > section',modalLayer); const target=sections[Number(trigger.dataset.step)]; target?.scrollIntoView({behavior:'smooth',block:'start'}); return; }
      case 'edit-letterhead': v9SaveCurrentReportSection(); v9ShowLetterheadEditor(); return;
      case 'save-letterhead': v9SaveLetterhead(); return;
      case 'reset-letterhead': Object.assign(v9Letterhead,{organisation:'Matanho Capital',product:'Investment Management ERP',address:'4th Floor, Matanho House · Harare, Zimbabwe',email:'investor-relations@matanho.com',phone:'+263 77 245 8890',website:'www.matanho.com',footer:'Private and confidential · Prepared for authorised recipients only',accent:'#2563eb',logoScale:'medium',alignment:'left',showLogo:true,showAddress:true,showFooter:true,logoDataUrl:''}); v9ShowLetterheadEditor(); return;
      case 'manage-mailer-people': closeOverlays(); v9ShowMailerPeopleManager(trigger.dataset.id||state.selectedMailerListId); return;
      case 'submit-mailer-person': v9SubmitMailerPerson(); return;
      case 'mailer-member-detail': closeOverlays(); v9ShowMailerMemberDetail(trigger.dataset.listId,trigger.dataset.personId); return;
      case 'edit-mailer-person': closeOverlays(); v9ShowMailerPersonEditor(trigger.dataset.listId,trigger.dataset.personId); return;
      case 'save-mailer-person': v9SaveMailerPerson(); return;
      case 'remove-mailer-person': v9ShowRemoveMailerPerson(trigger.dataset.listId,trigger.dataset.personId); return;
      case 'confirm-remove-mailer-person': v9ConfirmRemoveMailerPerson(); return;
      case 'select-report-section': v9SaveCurrentReportSection(); state.reportSection=Number(trigger.dataset.section); render(); return;
      case 'add-report-section': v9SaveCurrentReportSection(); v9ShowAddReportSection(); return;
      case 'submit-report-section': v9SubmitReportSection(); return;
      case 'remove-report-section': v9SaveCurrentReportSection(); v9ShowRemoveReportSection(Number(trigger.dataset.index)); return;
      case 'confirm-remove-report-section': { const index=Number(trigger.dataset.index); if(index>0&&v9ReportSections[index]){const removed=v9ReportSections.splice(index,1)[0];state.reportSection=clamp(state.reportSection,1,v9ReportSections.length);closeOverlays();toast('Section removed',`${removed.title} was removed from the working draft.`);render();} return; }
      case 'move-report-section': { v9SaveCurrentReportSection(); const index=Number(trigger.dataset.index),direction=Number(trigger.dataset.direction),next=clamp(index+direction,0,v9ReportSections.length-1); if(next!==index){const [section]=v9ReportSections.splice(index,1);v9ReportSections.splice(next,0,section);state.reportSection=next+1;render();} return; }
      case 'duplicate-report-section': { v9SaveCurrentReportSection(); const current=v9ReportSections[state.reportSection-1]; const copy={...current,id:`${current.id}-copy-${Date.now().toString(36)}`,title:`${current.title} Copy`,status:'Attention'};v9ReportSections.splice(state.reportSection,0,copy);state.reportSection+=1;toast('Section duplicated',copy.title);render();return; }
      case 'editor-format': v9ApplyEditorCommand(trigger.dataset.command); return;
      case 'editor-heading': v9ApplyEditorCommand('formatBlock',trigger.dataset.level||'h2'); return;
      case 'editor-add-block': v9InsertReportBlock(trigger.dataset.kind); return;
      case 'editor-link': v9ShowReportLinkModal(); return;
      case 'insert-report-link': { const form=$('#reportLinkForm'); if(!form?.reportValidity())return; const data=Object.fromEntries(new FormData(form)); closeOverlays(); render(); requestAnimationFrame(()=>v9InsertReportHTML(`<a href="${escapeHTML(data.url)}" ${data.newTab?'target="_blank" rel="noreferrer"':''}>${escapeHTML(data.label||data.url)}</a>`)); return; }
      case 'report-zoom-in': state.reportZoom=clamp(state.reportZoom+10,70,150); render(); return;
      case 'report-zoom-out': state.reportZoom=clamp(state.reportZoom-10,70,150); render(); return;
      case 'report-zoom-reset': state.reportZoom=100; render(); return;
      case 'editor-maximize': state.reportFocusMode=!state.reportFocusMode; render(); return;
      case 'save-report': v9SaveCurrentReportSection(false); return;
      case 'apply-commentary': { const note=$('#reportCommentaryDraft')?.value||'Add evidence-based commentary.'; state.reportBuilderTab='commentary'; v9InsertReportHTML(`<div class="report-callout"><strong>Investment team commentary</strong><p>${escapeHTML(note)}</p></div>`); return; }
      case 'add-report-comment': { const note=$('#reportReviewComment')?.value?.trim(); if(!note){toast('Comment required','Write a review comment before adding it.','warning');return;} toast('Review comment added',note); return; }
      default: return v9HandleAction(action,trigger,event);
    }
  };


  // ---------------------------------------------------------------------------
  // V10: responsive document previews, dynamic fund reporting and standards-led
  // report templates. All report content remains editable in the browser demo.
  // ---------------------------------------------------------------------------
  state.fundReportingView = state.fundReportingView || 'Performance';
  state.fundReportingCurrency = state.fundReportingCurrency || 'USD';
  state.fundReportingBasis = state.fundReportingBasis || 'Net';
  state.fundReportingBenchmark = state.fundReportingBenchmark || 'Private Markets PME';
  state.reportDataAsOf = state.reportDataAsOf || '31 Jul 2026 · 18:45 CAT';
  if (['Institutional','Board pack','Investor letter','Data-led'].includes(state.reportTemplate)) {
    state.reportTemplate = 'ILPA Quarterly Reporting 2.0';
  }

  const v10IndustryTemplateMeta = {
    'ILPA Quarterly Reporting 2.0': {
      short: 'Quarterly fund economics, fees, expenses and carried-interest transparency.',
      basis: 'ILPA Reporting Template v2.0',
      icon: 'file-chart',
      tone: 'brand'
    },
    'ILPA Performance Template': {
      short: 'Standardised fund and portfolio performance with detailed cash-flow schedules.',
      basis: 'ILPA Performance Template',
      icon: 'trend-up',
      tone: 'emerald'
    },
    'IPEV 2025 Valuation Pack': {
      short: 'Fair-value methodology, movement, calibration, sensitivity and approvals.',
      basis: 'IPEV Valuation Guidelines 2025',
      icon: 'bar-chart',
      tone: 'blue'
    },
    'VC / PE Quarterly Investor Report': {
      short: 'LP-facing narrative report with performance, portfolio, risk and capital activity.',
      basis: 'Institutional quarterly reporting pack',
      icon: 'users',
      tone: 'amber'
    }
  };

  function v10ReportSection(id,title,status,body){ return {id,title,status,body}; }

  function v10BuildTemplateSections(templateName) {
    const fund = funds.find(item=>item.name===state.activeFund) || funds[0];
    const fundCompanies = companies.filter(item=>item.fund===fund.name);
    const portfolioRows = (fundCompanies.length ? fundCompanies : companies.slice(0,5)).map(company=>`<tr><td>${escapeHTML(company.name)}</td><td>${escapeHTML(company.sector)}</td><td class="text-right">${formatMoney(company.invested)}</td><td class="text-right">${formatMoney(company.fairValue)}</td><td class="text-right">${(company.fairValue/Math.max(1,company.invested)).toFixed(2)}x</td><td class="text-right">${pct(company.revenueGrowth)}</td><td>${statusPill(company.health>=75?'On track':company.health>=65?'Watch':'Attention')}</td></tr>`).join('');
    const performanceTable = `<div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Metric</th><th class="text-right">Current period</th><th class="text-right">Prior period</th><th class="text-right">Since inception</th><th>Methodology</th></tr></thead><tbody><tr><td>Gross IRR</td><td class="text-right">${pct(fund.grossIrr)}</td><td class="text-right">${pct(fund.grossIrr-1.6)}</td><td class="text-right">${pct(fund.grossIrr)}</td><td>Daily cash-flow XIRR</td></tr><tr><td>Net IRR</td><td class="text-right">${pct(fund.netIrr)}</td><td class="text-right">${pct(fund.netIrr-1.3)}</td><td class="text-right">${pct(fund.netIrr)}</td><td>Investor cash-flow XIRR</td></tr><tr><td>TVPI</td><td class="text-right">${fund.tvpi.toFixed(2)}x</td><td class="text-right">${Math.max(0,fund.tvpi-.14).toFixed(2)}x</td><td class="text-right">${fund.tvpi.toFixed(2)}x</td><td>(NAV + distributions) / paid-in</td></tr><tr><td>DPI</td><td class="text-right">${fund.dpi.toFixed(2)}x</td><td class="text-right">${Math.max(0,fund.dpi-.08).toFixed(2)}x</td><td class="text-right">${fund.dpi.toFixed(2)}x</td><td>Distributions / paid-in</td></tr><tr><td>RVPI</td><td class="text-right">${Math.max(0,fund.tvpi-fund.dpi).toFixed(2)}x</td><td class="text-right">${Math.max(0,fund.tvpi-fund.dpi-.06).toFixed(2)}x</td><td class="text-right">${Math.max(0,fund.tvpi-fund.dpi).toFixed(2)}x</td><td>Residual value / paid-in</td></tr></tbody></table></div>`;
    const cashFlowTable = `<div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Date</th><th>Transaction type</th><th>Entity / counterparty</th><th class="text-right">Contribution</th><th class="text-right">Distribution</th><th class="text-right">Fees & expenses</th><th>Status</th></tr></thead><tbody><tr><td>04 Apr 2026</td><td>Capital call receipt</td><td>LP collection account</td><td class="text-right">USD 25.0M</td><td class="text-right">—</td><td class="text-right">—</td><td>Reconciled</td></tr><tr><td>29 Apr 2026</td><td>Follow-on investment</td><td>Nova Analytics</td><td class="text-right">—</td><td class="text-right">—</td><td class="text-right">USD 12.0M</td><td>Posted</td></tr><tr><td>16 Jun 2026</td><td>Realisation proceeds</td><td>GreenOrbit Energy</td><td class="text-right">—</td><td class="text-right">USD 37.0M</td><td class="text-right">—</td><td>Distributed</td></tr><tr><td>30 Jun 2026</td><td>Management fee</td><td>Matanho Capital</td><td class="text-right">—</td><td class="text-right">—</td><td class="text-right">USD 1.5M</td><td>Approved</td></tr></tbody></table></div>`;
    const sourceFooter = `<div class="report-source-note"><strong>Prefill basis</strong><span>Fund master, approved capital activity, portfolio valuation, cash subledger, LP capital accounts and reporting calendar as at ${escapeHTML(state.reportDataAsOf)}.</span></div>`;

    if (templateName === 'ILPA Performance Template') return [
      v10ReportSection('methodology','Methodology & Scope','Complete',`<h2>1. Methodology & Scope</h2><p class="report-lead">This working schedule standardises fund-level and portfolio-level performance and the underlying contribution and distribution cash flows.</p><div class="report-callout"><strong>Calculation basis</strong><p>Performance is presented gross and net, by period and since inception. Cash-flow dates, transaction classifications and methodology notes remain editable and source linked.</p></div>${sourceFooter}`),
      v10ReportSection('fund-performance','Fund-Level Performance','Complete',`<h2>2. Fund-Level Performance</h2><div class="report-kpi-row"><div><span>Gross IRR</span><strong>${pct(fund.grossIrr)}</strong><small>Since inception</small></div><div><span>Net IRR</span><strong>${pct(fund.netIrr)}</strong><small>Since inception</small></div><div><span>TVPI</span><strong>${fund.tvpi.toFixed(2)}x</strong><small>DPI ${fund.dpi.toFixed(2)}x</small></div></div>${performanceTable}`),
      v10ReportSection('fund-cash-flows','Fund Cash-Flow Schedule','Complete',`<h2>3. Fund Cash-Flow Schedule</h2><p>Contribution, distribution, fee and investment cash flows are prefilled from approved source events and may be amended in this draft before review.</p>${cashFlowTable}`),
      v10ReportSection('portfolio-performance','Portfolio-Level Performance','Complete',`<h2>4. Portfolio-Level Performance</h2><p>Investment-level gross performance, current fair value and operating indicators.</p><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Investment</th><th>Sector</th><th class="text-right">Cost</th><th class="text-right">Fair value</th><th class="text-right">Gross MOIC</th><th class="text-right">Revenue growth</th><th>Status</th></tr></thead><tbody>${portfolioRows}</tbody></table></div>`),
      v10ReportSection('transactions','Investment Transaction Detail','Attention',`<h2>5. Investment Transaction Detail</h2><p>Review transaction type, date, amount, security and realised or unrealised classification before publication.</p>${cashFlowTable}`),
      v10ReportSection('benchmark','Benchmark & PME','Complete',`<h2>6. Benchmark & PME</h2><div class="report-kpi-row"><div><span>Fund net IRR</span><strong>${pct(fund.netIrr)}</strong><small>Current period</small></div><div><span>PME comparator</span><strong>12.5%</strong><small>Selected benchmark</small></div><div><span>Excess return</span><strong>+${(fund.netIrr-12.5).toFixed(1)}pp</strong><small>Net basis</small></div></div><p>The selected public-market-equivalent methodology, index source and cash-flow convention should be confirmed by the reviewer.</p>`),
      v10ReportSection('reconciliation','Reconciliation & Approval','Attention',`<h2>7. Reconciliation & Approval</h2><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Control</th><th>Result</th><th>Owner</th><th>Evidence</th></tr></thead><tbody><tr><td>Fund cash flows to cash subledger</td><td>Passed</td><td>Fund Operations</td><td>CASH-Q2-v4</td></tr><tr><td>NAV to approved valuation</td><td>Passed</td><td>Valuation Committee</td><td>VAL-Q2-v3.1</td></tr><tr><td>Investor cash flows to capital accounts</td><td>Review</td><td>Fund Administration</td><td>CAP-Q2-v2</td></tr></tbody></table></div>`)
    ];

    if (templateName === 'IPEV 2025 Valuation Pack') return [
      v10ReportSection('valuation-cover','Valuation Committee Memorandum','Complete',`<h2>1. Valuation Committee Memorandum</h2><p class="report-lead">Quarter-end fair-value pack for ${escapeHTML(fund.name)} as at 30 June 2026.</p><div class="report-kpi-row"><div><span>Portfolio fair value</span><strong>${formatMoney(fund.nav)}</strong><small>Reporting currency</small></div><div><span>Quarter movement</span><strong>+USD 17.2M</strong><small>Before distributions</small></div><div><span>Investments reviewed</span><strong>${Math.max(5,fundCompanies.length)}</strong><small>100% coverage</small></div></div>${sourceFooter}`),
      v10ReportSection('valuation-policy','Valuation Policy & Governance','Complete',`<h2>2. Valuation Policy & Governance</h2><p>The pack documents the policy version, valuation date, committee membership, independence checks and approval route used for the reporting period.</p><div class="table-wrap"><table class="professional-doc-table"><tbody><tr><th>Valuation date</th><td>30 June 2026</td></tr><tr><th>Policy version</th><td>VAL-POL-v5.2</td></tr><tr><th>Committee</th><td>Valuation Committee and authorised approver</td></tr><tr><th>Reporting basis</th><td>Fair value</td></tr><tr><th>Next review</th><td>30 September 2026</td></tr></tbody></table></div>`),
      v10ReportSection('fair-value-summary','Fair-Value Summary','Complete',`<h2>3. Fair-Value Summary</h2><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Investment</th><th>Method</th><th class="text-right">Cost</th><th class="text-right">Prior fair value</th><th class="text-right">Current fair value</th><th class="text-right">Movement</th></tr></thead><tbody>${(fundCompanies.length?fundCompanies:companies.slice(0,5)).map(c=>`<tr><td>${escapeHTML(c.name)}</td><td>${c.margin>65?'Revenue multiple':'EBITDA multiple / calibration'}</td><td class="text-right">${formatMoney(c.invested)}</td><td class="text-right">${formatMoney(c.fairValue*.92)}</td><td class="text-right">${formatMoney(c.fairValue)}</td><td class="text-right positive">+${pct(8.7)}</td></tr>`).join('')}</tbody></table></div>`),
      v10ReportSection('method-calibration','Methodology & Calibration','Attention',`<h2>4. Methodology & Calibration</h2><p>Document the selected valuation technique, calibration to transaction price, comparable set, maintainable earnings or revenue, discounts and any judgement applied.</p><div class="report-callout warning"><strong>Reviewer attention</strong><p>Refresh the Nyasha Foods market-comparable evidence before final approval.</p></div>`),
      v10ReportSection('value-movement','Fair-Value Movement','Complete',`<h2>5. Fair-Value Movement</h2><div class="nav-bridge"><div><span>Opening fair value</span><strong>USD 151.2M</strong></div><div><span>New investment</span><strong>+USD 24.0M</strong></div><div><span>Operating performance</span><strong>+USD 11.4M</strong></div><div><span>Multiple movement</span><strong>+USD 7.1M</strong></div><div><span>FX and other</span><strong>-USD 1.3M</strong></div><div class="total"><span>Closing fair value</span><strong>USD 192.4M</strong></div></div>`),
      v10ReportSection('sensitivity','Sensitivity Analysis','Complete',`<h2>6. Sensitivity Analysis</h2><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Scenario</th><th class="text-right">Multiple change</th><th class="text-right">Earnings change</th><th class="text-right">Portfolio fair value</th><th class="text-right">Movement</th></tr></thead><tbody><tr><td>Downside</td><td class="text-right">-1.0x</td><td class="text-right">-10%</td><td class="text-right">USD 168.1M</td><td class="text-right negative">-12.6%</td></tr><tr><td>Base</td><td class="text-right">—</td><td class="text-right">—</td><td class="text-right">USD 192.4M</td><td class="text-right">—</td></tr><tr><td>Upside</td><td class="text-right">+1.0x</td><td class="text-right">+10%</td><td class="text-right">USD 218.7M</td><td class="text-right positive">+13.7%</td></tr></tbody></table></div>`),
      v10ReportSection('judgements','Significant Judgements & Risks','Attention',`<h2>7. Significant Judgements & Risks</h2><ul><li>Revenue normalisation for one high-growth software investment.</li><li>Country-risk adjustment for Zimbabwe and Zambia exposures.</li><li>Liquidity and marketability discount calibration.</li><li>Foreign-exchange translation and post-period events.</li></ul>`),
      v10ReportSection('approval','Committee Approval & Audit Trail','Attention',`<h2>8. Committee Approval & Audit Trail</h2><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Role</th><th>Name</th><th>Decision</th><th>Date</th><th>Evidence</th></tr></thead><tbody><tr><td>Preparer</td><td>Laura Chen</td><td>Submitted</td><td>21 Jul 2026</td><td>VAL-Q2-v3.1</td></tr><tr><td>Reviewer</td><td>Fund Accounting</td><td>In review</td><td>—</td><td>2 comments</td></tr><tr><td>Valuation Committee</td><td>Committee</td><td>Pending</td><td>—</td><td>Agenda item 4</td></tr></tbody></table></div>`)
    ];

    if (templateName === 'VC / PE Quarterly Investor Report') return [
      v10ReportSection('executive','Executive Letter','Complete',`<h2>1. Executive Letter</h2><p class="report-lead">${escapeHTML(fund.name)} continued to create value during the quarter through operating growth, disciplined deployment and selective liquidity.</p><div class="report-callout"><strong>Quarter in one sentence</strong><p>NAV increased while the portfolio maintained healthy liquidity and improved reporting compliance.</p></div>${sourceFooter}`),
      v10ReportSection('performance','Fund Performance','Complete',`<h2>2. Fund Performance</h2><div class="report-kpi-row"><div><span>Net IRR</span><strong>${pct(fund.netIrr)}</strong><small>Since inception</small></div><div><span>TVPI</span><strong>${fund.tvpi.toFixed(2)}x</strong><small>DPI ${fund.dpi.toFixed(2)}x</small></div><div><span>NAV</span><strong>${formatMoney(fund.nav)}</strong><small>Quarter end</small></div></div>${performanceTable}`),
      v10ReportSection('cash-flows','Capital Activity & Cash Flows','Complete',`<h2>3. Capital Activity & Cash Flows</h2>${cashFlowTable}`),
      v10ReportSection('portfolio','Portfolio Review','Complete',`<h2>4. Portfolio Review</h2><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Company</th><th>Sector</th><th class="text-right">Invested</th><th class="text-right">Fair value</th><th class="text-right">MOIC</th><th class="text-right">Revenue growth</th><th>Health</th></tr></thead><tbody>${portfolioRows}</tbody></table></div>`),
      v10ReportSection('value-creation','Value Creation','Complete',`<h2>5. Value Creation</h2><ul><li>Commercial acceleration and customer retention.</li><li>Margin expansion through procurement and operating discipline.</li><li>Governance, cybersecurity and leadership strengthening.</li><li>Regional expansion and strategic partnerships.</li></ul>`),
      v10ReportSection('risk-esg','Risk, Governance & ESG','Attention',`<h2>6. Risk, Governance & ESG</h2><div class="report-risk-grid"><div><strong>Liquidity</strong><span>Low</span><p>Available cash covers approved twelve-month commitments.</p></div><div><strong>Concentration</strong><span>Medium</span><p>Largest investment represents less than 20% of fair value.</p></div><div><strong>Reporting quality</strong><span>Medium</span><p>Two portfolio submissions require remediation.</p></div></div>`),
      v10ReportSection('financials','Condensed Financial Statements','Complete',`<h2>7. Condensed Financial Statements</h2><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>USD millions</th><th class="text-right">Current quarter</th><th class="text-right">Prior quarter</th><th class="text-right">Variance</th></tr></thead><tbody><tr><td>Investments at fair value</td><td class="text-right">168.4</td><td class="text-right">151.2</td><td class="text-right positive">+17.2</td></tr><tr><td>Cash and equivalents</td><td class="text-right">94.8</td><td class="text-right">86.3</td><td class="text-right positive">+8.5</td></tr><tr><td>Liabilities</td><td class="text-right">(12.2)</td><td class="text-right">(10.8)</td><td class="text-right negative">(1.4)</td></tr><tr><td>Net assets</td><td class="text-right">251.0</td><td class="text-right">226.7</td><td class="text-right positive">+24.3</td></tr></tbody></table></div>`),
      v10ReportSection('appendix','LP Appendix & Disclosures','Attention',`<h2>8. LP Appendix & Disclosures</h2><ul><li>Commitment and unfunded commitment schedule.</li><li>Capital calls and distributions ledger.</li><li>Fee, expense and carried-interest disclosures.</li><li>Portfolio valuation and KPI definitions.</li><li>Source data, approvals and publication controls.</li></ul>`)
    ];

    return [
      v10ReportSection('certification','Cover, Scope & Certification','Complete',`<h2>1. Cover, Scope & Certification</h2><p class="report-lead">Quarterly reporting package for ${escapeHTML(fund.name)} for the period ended 30 June 2026.</p><div class="report-kpi-row"><div><span>Committed capital</span><strong>${formatMoney(fund.commitment)}</strong><small>${fund.currency}</small></div><div><span>Paid-in capital</span><strong>${formatMoney(fund.called)}</strong><small>${pct(fund.called/fund.commitment*100)} called</small></div><div><span>Net asset value</span><strong>${formatMoney(fund.nav)}</strong><small>Approved close</small></div></div><div class="report-callout"><strong>Certification</strong><p>The preparer confirms that the report is generated from the approved reporting data set and remains subject to independent review and governing-document requirements.</p></div>${sourceFooter}`),
      v10ReportSection('executive-summary','Executive Summary','Complete',`<h2>2. Executive Summary</h2><p class="report-lead">The fund delivered resilient performance during the period, supported by portfolio operating improvements, disciplined investment activity and realised proceeds.</p><h3>Quarter highlights</h3><ul><li>Net IRR increased to ${pct(fund.netIrr)}.</li><li>TVPI improved to ${fund.tvpi.toFixed(2)}x and DPI to ${fund.dpi.toFixed(2)}x.</li><li>Portfolio reporting compliance reached 94%.</li></ul>`),
      v10ReportSection('fund-overview','Fund Overview & Capital Activity','Complete',`<h2>3. Fund Overview & Capital Activity</h2><div class="table-wrap"><table class="professional-doc-table"><tbody><tr><th>Strategy</th><td>${escapeHTML(fund.strategy)}</td><th>Vintage</th><td>${fund.vintage}</td></tr><tr><th>Geography</th><td>${escapeHTML(fund.geography)}</td><th>Status</th><td>${escapeHTML(fund.status)}</td></tr><tr><th>Management fee</th><td>${escapeHTML(fund.managementFee)}</td><th>Carry</th><td>${escapeHTML(fund.carry)}</td></tr></tbody></table></div><h3>Capital activity</h3>${cashFlowTable}`),
      v10ReportSection('fees-expenses','Fees, Expenses & Carried Interest','Attention',`<h2>4. Fees, Expenses & Carried Interest</h2><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Category</th><th class="text-right">Current quarter</th><th class="text-right">Year to date</th><th class="text-right">Since inception</th><th>Allocation basis</th></tr></thead><tbody><tr><td>Management fee</td><td class="text-right">USD 1.5M</td><td class="text-right">USD 3.0M</td><td class="text-right">USD 18.4M</td><td>Committed / invested capital per LPA</td></tr><tr><td>Partnership expenses</td><td class="text-right">USD 0.4M</td><td class="text-right">USD 0.8M</td><td class="text-right">USD 4.7M</td><td>Fund-level allocation</td></tr><tr><td>Portfolio-company fees offset</td><td class="text-right">USD (0.1M)</td><td class="text-right">USD (0.2M)</td><td class="text-right">USD (1.1M)</td><td>Offset policy</td></tr><tr><td>Accrued carried interest</td><td class="text-right">USD 2.8M</td><td class="text-right">USD 5.1M</td><td class="text-right">USD 14.6M</td><td>Waterfall estimate</td></tr></tbody></table></div>`),
      v10ReportSection('performance-cash','Performance & Cash Flows','Complete',`<h2>5. Performance & Cash Flows</h2><div class="report-kpi-row"><div><span>Net IRR</span><strong>${pct(fund.netIrr)}</strong><small>Since inception</small></div><div><span>TVPI</span><strong>${fund.tvpi.toFixed(2)}x</strong><small>DPI ${fund.dpi.toFixed(2)}x</small></div><div><span>RVPI</span><strong>${Math.max(0,fund.tvpi-fund.dpi).toFixed(2)}x</strong><small>Residual value</small></div></div>${performanceTable}<h3>Cash-flow detail</h3>${cashFlowTable}`),
      v10ReportSection('portfolio-summary','Portfolio Summary','Complete',`<h2>6. Portfolio Summary</h2><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Company</th><th>Sector</th><th class="text-right">Cost</th><th class="text-right">Fair value</th><th class="text-right">MOIC</th><th class="text-right">Revenue growth</th><th>Status</th></tr></thead><tbody>${portfolioRows}</tbody></table></div>`),
      v10ReportSection('financial-nav','Financial Statements & NAV','Complete',`<h2>7. Financial Statements & NAV</h2><div class="nav-bridge"><div><span>Opening NAV</span><strong>USD 149.7M</strong></div><div><span>Investments</span><strong>+USD 24.0M</strong></div><div><span>Fair-value movement</span><strong>+USD 11.2M</strong></div><div><span>Distributions</span><strong>-USD 8.5M</strong></div><div><span>Expenses & FX</span><strong>-USD 8.0M</strong></div><div class="total"><span>Closing NAV</span><strong>USD 168.4M</strong></div></div>`),
      v10ReportSection('capital-accounts','LP Capital Accounts','Attention',`<h2>8. LP Capital Accounts</h2><p>Recipient-level capital-account statements are generated from the approved commitment, contribution, distribution and allocation ledgers.</p><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Measure</th><th class="text-right">Opening</th><th class="text-right">Activity</th><th class="text-right">Closing</th></tr></thead><tbody><tr><td>Paid-in capital</td><td class="text-right">USD 185.0M</td><td class="text-right">USD 25.6M</td><td class="text-right">USD 210.6M</td></tr><tr><td>Distributions</td><td class="text-right">USD 77.3M</td><td class="text-right">USD 19.8M</td><td class="text-right">USD 97.1M</td></tr><tr><td>Net asset value</td><td class="text-right">USD 151.2M</td><td class="text-right">USD 4.0M</td><td class="text-right">USD 155.2M</td></tr></tbody></table></div>`),
      v10ReportSection('notes-sources','Notes, Definitions & Source Data','Attention',`<h2>9. Notes, Definitions & Source Data</h2><div class="table-wrap"><table class="professional-doc-table"><thead><tr><th>Dataset</th><th>Version</th><th>Owner</th><th>As of</th><th>Control status</th></tr></thead><tbody><tr><td>Fund accounting close</td><td>FA-Q2-v5</td><td>Fund Administration</td><td>30 Jun 2026</td><td>Approved</td></tr><tr><td>Portfolio valuation</td><td>VAL-Q2-v3.1</td><td>Valuation Committee</td><td>30 Jun 2026</td><td>Approved with one review item</td></tr><tr><td>Cash subledger</td><td>CASH-0731-v4</td><td>Fund Operations</td><td>31 Jul 2026</td><td>Reconciled</td></tr><tr><td>Portfolio KPI submissions</td><td>KPI-Q2-v7</td><td>Portfolio Team</td><td>18 Jul 2026</td><td>Two exceptions</td></tr></tbody></table></div>`)
    ];
  }

  function v10ApplyIndustryTemplate(templateName, quiet=false) {
    const name = v10IndustryTemplateMeta[templateName] ? templateName : 'ILPA Quarterly Reporting 2.0';
    v9SaveCurrentReportSection?.(false);
    const sections = v10BuildTemplateSections(name);
    v9ReportSections.splice(0,v9ReportSections.length,...sections.map(section=>({...section})));
    state.reportTemplate = name;
    state.reportSection = 1;
    state.reportAutosave = `Auto-generated ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
    if(!quiet) toast('Report template generated',`${name} was prefilled from the current approved demonstration data. Every section remains editable.`);
    render();
  }

  v10ApplyIndustryTemplate(v10IndustryTemplateMeta[state.reportTemplate] ? state.reportTemplate : 'ILPA Quarterly Reporting 2.0', true);

  function v10TemplateBar() {
    const meta = v10IndustryTemplateMeta[state.reportTemplate] || v10IndustryTemplateMeta['ILPA Quarterly Reporting 2.0'];
    return `<section class="industry-template-bar"><div class="industry-template-copy"><span class="industry-template-icon ${meta.tone}">${icon(meta.icon)}</span><div><small>Industry template</small><strong>${escapeHTML(state.reportTemplate)}</strong><p>${escapeHTML(meta.short)}</p></div></div><div class="industry-template-controls"><label><span>Template</span><select data-change-action="industry-report-template">${Object.keys(v10IndustryTemplateMeta).map(name=>`<option ${name===state.reportTemplate?'selected':''}>${escapeHTML(name)}</option>`).join('')}</select></label><span class="industry-basis-pill">${escapeHTML(meta.basis)}</span>${button('Template library','open-report-template-library','','layers')}${button('Auto-generate & prefill','autogenerate-report-template','primary','sparkles')}</div><div class="industry-template-status"><span>${icon('layers')} Source data: ${escapeHTML(state.reportDataAsOf)}</span><span>${icon('edit')} All generated content is editable</span><span>${icon('shield')} Confirm LPA, accounting basis and jurisdiction before publication</span></div></section>`;
  }

  function v10ShowTemplateLibrary() {
    const cards = Object.entries(v10IndustryTemplateMeta).map(([name,meta])=>`<article class="template-library-card ${name===state.reportTemplate?'selected':''}"><span class="template-library-icon ${meta.tone}">${icon(meta.icon)}</span><div><small>${escapeHTML(meta.basis)}</small><h3>${escapeHTML(name)}</h3><p>${escapeHTML(meta.short)}</p><ul>${name.includes('Performance')?'<li>Fund and portfolio returns</li><li>Contribution and distribution schedules</li><li>Methodology and reconciliation</li>':name.includes('Valuation')?'<li>Fair-value methodology</li><li>Movement and sensitivity</li><li>Committee approvals</li>':name.includes('Quarterly Reporting')?'<li>Fees, expenses and carried interest</li><li>Fund economics and capital accounts</li><li>Portfolio and source-data schedules</li>':'<li>LP-facing executive narrative</li><li>Performance and capital activity</li><li>Portfolio, risk and appendices</li>'}</ul></div>${button(name===state.reportTemplate?'Regenerate':'Use template','apply-report-template',name===state.reportTemplate?'':'primary','sparkles',`data-template="${escapeHTML(name)}"`)}</article>`).join('');
    showModal('Industry Report Template Library','Select a structured reporting pack, auto-generate it from current data and edit every section before review.',`<div class="template-library-grid">${cards}</div><div class="reason-item section-gap">${icon('info')}<div><strong>Standards-led, not automatic legal compliance</strong><small>The layouts are structured around recognised private-markets reporting and valuation frameworks. The fund LPA, accounting basis, client requirements and local rules remain authoritative.</small></div></div>`,`${button('Close','close-modal','primary')}`,{variant:'document',size:'xl',eyebrow:'Auto-generated report templates'});
  }

  function v10RenderFundReportingContent(fund,view) {
    const fundCompanies = companies.filter(company=>company.fund===fund.name);
    const visibleCompanies = fundCompanies.length ? fundCompanies : companies.slice(0,5);
    const totalFV = sum(visibleCompanies,company=>company.fairValue) || 1;
    if (view === 'Cash Flows') {
      const rows = [
        ['04 Apr 2026','Capital call receipt','LP collection account','Contribution',25000000,'Reconciled'],
        ['29 Apr 2026','Follow-on investment','Nova Analytics','Investment',-12000000,'Posted'],
        ['18 May 2026','Fund expense','Legal and advisory','Expense',-6100000,'Approved'],
        ['16 Jun 2026','Realisation proceeds','GreenOrbit Energy','Distribution',37000000,'Distributed'],
        ['30 Jun 2026','Management fee','Matanho Capital','Fee',-1500000,'Approved']
      ];
      return `<section class="grid cols-2">${card('Contributions and Distributions',barChart({labels:['Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'Contributions',color:'var(--blue)',values:[62,79,88,94,105]},{name:'Distributions',color:'var(--emerald)',values:[18,52,24,68,37]}],height:310,yLabel:'USD millions',format:value=>`${Math.round(value)}M`}),{subtitle:'Quarterly investor cash flows'})}${card('Net Cash-Flow and NAV Bridge',waterfallChart([{label:'Opening NAV',value:151200000,total:true},{label:'Contributions',value:25600000},{label:'Distributions',value:-19800000},{label:'Fees & expenses',value:-6100000},{label:'Value movement',value:17500000},{label:'Closing NAV',value:168400000,total:true}]),{subtitle:'Click any bridge component for source detail'})}</section><section class="card table-card section-gap"><div class="table-toolbar"><div><h3>Fund Cash-Flow Ledger</h3><p>Prefilled from approved source events, with type and reconciliation status.</p></div><div class="table-tools">${button('Filters','report-filters','compact','filter')}${button('Export cash flows','export-performance','compact','download')}</div></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Event</th><th>Entity / counterparty</th><th>Classification</th><th class="text-right">Amount</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(row=>`<tr class="clickable" data-action="activity-open-metadata" data-context="cash-flow" data-id="${escapeHTML(row[1])}"><td>${row[0]}</td><td class="table-primary">${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td class="text-right ${row[4]<0?'negative':'positive'}">${formatMoney(row[4])}</td><td>${statusPill(row[5])}</td><td>${icon('chevron-right')}</td></tr>`).join('')}</tbody></table></div></section>`;
    }
    if (view === 'Portfolio') {
      const sectorMap = {};
      visibleCompanies.forEach(company=>sectorMap[company.sector]=(sectorMap[company.sector]||0)+company.fairValue);
      const sectorSegments = Object.entries(sectorMap).map(([label,value],index)=>({label,value,color:['#2475f5','#0ba780','#60a5fa','#f29a1f','#dc3f72','#0c879f'][index%6],display:pct(value/totalFV*100)}));
      return `<section class="grid cols-2">${card('Fair Value by Sector',donutChart(sectorSegments,formatMoney(totalFV),'Portfolio fair value',158),{subtitle:'Current approved valuation'})}${card('Portfolio Operating Trend',lineChart({labels:['Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'Revenue growth',color:'var(--blue)',values:[18,21,24,26,29]},{name:'EBITDA growth',color:'var(--emerald)',values:[11,14,16,19,23]}],height:310,yLabel:'Percent',format:value=>`${Math.round(value)}%`}),{subtitle:'Weighted portfolio indicators'})}</section><section class="card table-card section-gap"><div class="table-toolbar"><div><h3>Investment-Level Performance</h3><p>Cost, fair value, MOIC, operating momentum and monitoring status.</p></div>${button('Portfolio filters','company-filters','compact','filter')}</div><div class="table-wrap"><table><thead><tr><th>Company</th><th>Sector</th><th class="text-right">Invested</th><th class="text-right">Fair value</th><th class="text-right">MOIC</th><th class="text-right">Ownership</th><th class="text-right">Revenue growth</th><th>Health</th></tr></thead><tbody>${visibleCompanies.map(company=>`<tr class="clickable" data-action="open-company" data-id="${company.id}"><td class="table-primary">${escapeHTML(company.name)}</td><td>${escapeHTML(company.sector)}</td><td class="text-right">${formatMoney(company.invested)}</td><td class="text-right">${formatMoney(company.fairValue)}</td><td class="text-right">${(company.fairValue/company.invested).toFixed(2)}x</td><td class="text-right">${pct(company.ownership)}</td><td class="text-right positive">${pct(company.revenueGrowth)}</td><td>${statusPill(company.health>=75?'On track':company.health>=65?'Watch':'Attention')}</td></tr>`).join('')}</tbody></table></div></section>`;
    }
    if (view === 'Attribution') {
      const attributionRows = visibleCompanies.map((company,index)=>{const contribution=[4.3,3.1,2.4,1.9,1.2,.8][index]||.6;return `<tr class="clickable" data-action="chart-drilldown" data-chart-label="${escapeHTML(company.name)} attribution" data-chart-value="${contribution.toFixed(1)} percentage points"><td class="table-primary">${escapeHTML(company.name)}</td><td class="text-right">${contribution.toFixed(1)}pp</td><td class="text-right">${pct(contribution/fund.netIrr*100)}</td><td>${index<2?'Operating performance':index===2?'Multiple expansion':'Revenue and margin'}</td><td class="text-right positive">+${pct(company.revenueGrowth/10)}</td></tr>`}).join('');
      return `<section class="grid cols-2">${card('Net IRR Attribution',waterfallChart([{label:'Opening return',value:10.2,total:true},{label:'Revenue growth',value:3.8},{label:'Margin expansion',value:2.1},{label:'Multiple movement',value:1.6},{label:'Leverage / cash',value:1.0},{label:'FX & fees',value:-.9},{label:'Net IRR',value:17.8,total:true}]),{subtitle:'Percentage-point contribution'})}${card('Value-Creation Drivers',barChart({labels:['Revenue growth','Margin expansion','Pricing','Working capital','Strategic initiatives','FX / macro'],series:[{name:'Contribution',color:'var(--brand)',values:[38,24,15,11,9,-3]}],height:310,yLabel:'Percent of value creation',format:value=>`${Math.round(value)}%`}),{subtitle:'Current period attribution'})}</section><section class="card table-card section-gap"><div class="table-toolbar"><div><h3>Company Attribution Schedule</h3><p>Contribution to fund return and the underlying value-creation driver.</p></div>${button('Methodology','performance-settings','compact','settings')}</div><div class="table-wrap"><table><thead><tr><th>Company</th><th class="text-right">Contribution to net IRR</th><th class="text-right">Share of net IRR</th><th>Primary driver</th><th class="text-right">Quarter movement</th></tr></thead><tbody>${attributionRows}<tr class="table-primary"><td>Total</td><td class="text-right">${pct(fund.netIrr)}</td><td class="text-right">100.0%</td><td>Fund total</td><td class="text-right positive">+1.3pp</td></tr></tbody></table></div></section>`;
    }
    if (view === 'Benchmarks') {
      return `<section class="grid cols-2">${card('PME and Peer Comparison',lineChart({labels:['Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:`${fund.name} net IRR`,color:'var(--blue)',values:[0,4,7,9.5,12,14,16,17.5,fund.netIrr]},{name:state.fundReportingBenchmark,color:'var(--emerald)',values:[0,2,4,5.5,7,8.5,10,11.2,12.5]},{name:'Peer median',color:'var(--amber)',values:[0,2.8,4.9,6.8,8.2,9.7,11.3,12.1,13.4]}],height:310,yLabel:'Percent',format:value=>`${Math.round(value)}%`}),{subtitle:`${state.fundReportingBasis} basis · ${state.fundReportingBenchmark}`})}${card('Quartile Position',barChart({labels:['Net IRR','TVPI','DPI','Revenue growth','Loss ratio'],series:[{name:'Fund percentile',color:'var(--brand)',values:[78,74,69,82,66]}],height:310,yLabel:'Percentile',format:value=>`${Math.round(value)}th`}),{subtitle:'Illustrative peer cohort percentile'})}</section><section class="grid cols-2 section-gap">${card('Benchmark Summary',`<div class="table-wrap"><table><thead><tr><th>Measure</th><th class="text-right">Fund</th><th class="text-right">Peer median</th><th class="text-right">Top quartile</th><th>Position</th></tr></thead><tbody><tr><td>Net IRR</td><td class="text-right">${pct(fund.netIrr)}</td><td class="text-right">13.4%</td><td class="text-right">17.2%</td><td>${statusPill('Top quartile','success')}</td></tr><tr><td>TVPI</td><td class="text-right">${fund.tvpi.toFixed(2)}x</td><td class="text-right">1.67x</td><td class="text-right">2.02x</td><td>${statusPill('Top quartile','success')}</td></tr><tr><td>DPI</td><td class="text-right">${fund.dpi.toFixed(2)}x</td><td class="text-right">0.41x</td><td class="text-right">0.58x</td><td>${statusPill('Top quartile','success')}</td></tr></tbody></table></div>`,{subtitle:'Selected peer cohort'})}${card('Methodology & Controls',`<div class="info-list"><div class="info-row"><span>Benchmark</span><strong>${escapeHTML(state.fundReportingBenchmark)}</strong></div><div class="info-row"><span>Return basis</span><strong>${escapeHTML(state.fundReportingBasis)}</strong></div><div class="info-row"><span>Currency</span><strong>${escapeHTML(state.fundReportingCurrency)}</strong></div><div class="info-row"><span>Cash-flow convention</span><strong>Daily dated cash flows</strong></div><div class="info-row"><span>Peer cohort</span><strong>2020-2023 Africa growth / buyout</strong></div><div class="info-row"><span>Last validated</span><strong>31 Jul 2026 · 17:10 CAT</strong></div></div>`,{footer:'<button class="card-link" data-action="performance-settings">Configure methodology</button>'})}</section>`;
    }
    return `<section class="grid cols-2">${card('Gross and Net Performance Trend',lineChart({labels:['Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'Net IRR',color:'var(--emerald)',values:[1,6,7,9,10,12,13.8,14.2,fund.netIrr]},{name:'Gross IRR',color:'var(--blue)',values:[3,9,10,12,14,16,17.1,18,fund.grossIrr]}],height:310,yLabel:'Percent',format:value=>`${Math.round(value)}%`}),{subtitle:'Quarterly progression'})}${card('Investment Multiple Progression',lineChart({labels:['Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'TVPI',color:'var(--brand)',values:[1.02,1.11,1.22,1.36,1.48,1.63,1.82,2.01,fund.tvpi]},{name:'DPI',color:'var(--amber)',values:[0,.03,.08,.14,.21,.28,.38,.47,fund.dpi]}],height:310,yLabel:'Multiple',format:value=>`${Number(value).toFixed(2)}x`}),{subtitle:'Since inception'})}</section><section class="grid cols-2 section-gap">${card('NAV and Paid-In Capital',barChart({labels:['Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],series:[{name:'NAV',color:'var(--blue)',values:[112,126,139,151,168]},{name:'Paid-in capital',color:'var(--emerald)',values:[156,171,187,196,211]}],height:310,yLabel:'USD millions',format:value=>`${Math.round(value)}M`}),{subtitle:'Quarter-end balances'})}${card('Performance Schedule',`<div class="table-wrap"><table><thead><tr><th>Metric</th><th class="text-right">Current</th><th class="text-right">Prior quarter</th><th class="text-right">Since inception</th><th>Validation</th></tr></thead><tbody><tr><td>Gross IRR</td><td class="text-right">${pct(fund.grossIrr)}</td><td class="text-right">${pct(fund.grossIrr-1.6)}</td><td class="text-right">${pct(fund.grossIrr)}</td><td>${statusPill('Passed','success')}</td></tr><tr><td>Net IRR</td><td class="text-right">${pct(fund.netIrr)}</td><td class="text-right">${pct(fund.netIrr-1.3)}</td><td class="text-right">${pct(fund.netIrr)}</td><td>${statusPill('Passed','success')}</td></tr><tr><td>TVPI</td><td class="text-right">${fund.tvpi.toFixed(2)}x</td><td class="text-right">${Math.max(0,fund.tvpi-.14).toFixed(2)}x</td><td class="text-right">${fund.tvpi.toFixed(2)}x</td><td>${statusPill('Passed','success')}</td></tr><tr><td>DPI</td><td class="text-right">${fund.dpi.toFixed(2)}x</td><td class="text-right">${Math.max(0,fund.dpi-.08).toFixed(2)}x</td><td class="text-right">${fund.dpi.toFixed(2)}x</td><td>${statusPill('Passed','success')}</td></tr></tbody></table></div>`,{subtitle:'Current reporting period'})}</section>`;
  }

  renderFundPerformance = function() {
    const selectedFund = funds.find(fund=>fund.name===state.activeFund) || funds[0];
    if (!selectedFund) {
      return `${pageHeader('Fund Reporting','Interactive performance, cash-flow, portfolio, attribution and benchmark reporting.',`${button('Refresh','reset-fund-reporting-filters','','refresh')}`,'Fund Reporting')}<div class="empty-state"><div class="empty-state-icon">${icon('file-chart')}</div><h3>No funds loaded</h3><p>Live fund data is still loading or has not been seeded yet.</p></div>`;
    }
    const views = ['Performance','Cash Flows','Portfolio','Attribution','Benchmarks'];
    const metricSets = {
      Performance:[['Gross IRR',pct(selectedFund.grossIrr||0),'trend-up','emerald','+1.6pp vs prior quarter'],['Net IRR',pct(selectedFund.netIrr||0),'users','cyan','+1.3pp vs prior quarter'],['TVPI',`${Number(selectedFund.tvpi||0).toFixed(2)}x`,'bar-chart','amber','+0.14x vs prior quarter'],['DPI',`${Number(selectedFund.dpi||0).toFixed(2)}x`,'dollar','purple','+0.08x vs prior quarter'],['RVPI',`${Math.max(0,Number(selectedFund.tvpi||0)-Number(selectedFund.dpi||0)).toFixed(2)}x`,'trend-up','blue','Residual value multiple'],['NAV',formatMoney(selectedFund.nav||0),'dollar','emerald','Approved period close']],
      'Cash Flows':[['Contributions','USD 25.6M','trend-down','blue','Current quarter'],['Distributions','USD 19.8M','trend-up','emerald','Current quarter'],['Net cash flow','USD 5.8M','refresh','cyan','Before fees and expenses'],['Fees & expenses','USD 6.1M','file','amber','Current quarter'],['Unfunded',formatMoney(Math.max(0,(selectedFund.commitment||0)-(selectedFund.called||0))),'wallet','purple','Remaining commitment'],['Available cash','USD 94.8M','bank','emerald','Reconciled cash position']],
      Portfolio:[['Portfolio companies',String(Math.max(0,companies.filter(c=>c.fund===selectedFund.name).length)),'building','blue','Active investments'],['Fair value',formatMoney(selectedFund.nav||0),'dollar','emerald','Approved valuation'],['Weighted revenue growth','28.9%','trend-up','cyan','Current quarter'],['Weighted EBITDA growth','22.7%','bar-chart','purple','Current quarter'],['On-track companies','82%','check-circle','emerald','Weighted by fair value'],['Watch items','3','alert','amber','Require intervention']],
      Attribution:[['Operating performance','+5.9pp','trend-up','emerald','Net IRR contribution'],['Multiple movement','+1.6pp','bar-chart','blue','Net IRR contribution'],['Leverage / cash','+1.0pp','wallet','purple','Net IRR contribution'],['FX & macro','-0.9pp','refresh','red','Net IRR drag'],['Top contributor','Nova Analytics','building','cyan','4.3pp contribution'],['Attribution coverage','100%','check-circle','emerald','All investments mapped']],
      Benchmarks:[['Fund net IRR',pct(selectedFund.netIrr||0),'trend-up','emerald','Selected basis'],['Peer median','13.4%','users','blue','Illustrative cohort'],['Top quartile','17.2%','sparkles','purple','Illustrative cohort'],['Excess return',`+${(Number(selectedFund.netIrr||0)-12.5).toFixed(1)}pp`,'bar-chart','cyan','Versus PME'],['TVPI percentile','74th','trend-up','amber','Peer cohort'],['Benchmark coverage','100%','check-circle','emerald','Cash flows mapped']]
    };
    const metrics = metricSets[state.fundReportingView] || metricSets.Performance;
    const filters = workspaceFilterBar([
      {label:'Currency',action:'fund-reporting-currency',selected:state.fundReportingCurrency,options:['USD','ZWG','Reporting currency']},
      {label:'Return basis',action:'fund-reporting-basis',selected:state.fundReportingBasis,options:['Net','Gross','Both']},
      {label:'Benchmark',action:'fund-reporting-benchmark',selected:state.fundReportingBenchmark,options:['Private Markets PME','MSCI Emerging Markets','S&P 500 PME','Peer cohort median']},
      {type:'button',label:'Reset',action:'reset-fund-reporting-filters',icon:'refresh'}
    ]);
    return `${pageHeader('Fund Reporting','Interactive performance, cash-flow, portfolio, attribution and benchmark reporting.',`${selectControl('Fund',funds.map(f=>f.name),selectedFund.name,'fund-filter')}${selectControl('Period',['Q2 2026 (Apr - Jun 2026)','Q1 2026 (Jan - Mar 2026)','Q4 2025 (Oct - Dec 2025)'],'Q2 2026 (Apr - Jun 2026)','performance-period')}${button('Generate industry report','open-report-template-library','primary','file-chart')}${button('Export','export-performance','','download')}${button('Submit for approval','submit-performance','','send')}`,'Fund Reporting')}${filters}<section class="metric-grid">${metrics.map(item=>metricCard({label:item[0],value:item[1],iconName:item[2],accent:item[3],foot:item[4],action:`fund-reporting-metric-${item[0].toLowerCase().replace(/[^a-z0-9]+/g,'-')}`})).join('')}</section><nav class="tabs fund-reporting-tabs" aria-label="Fund reporting views">${views.map(view=>`<button class="tab ${state.fundReportingView===view?'active':''}" data-action="fund-reporting-tab" data-tab="${escapeHTML(view)}">${escapeHTML(view)}<span>${view==='Performance'?'Returns':view==='Cash Flows'?'Ledger':view==='Portfolio'?'Investments':view==='Attribution'?'Drivers':'Comparators'}</span></button>`).join('')}</nav><section class="fund-reporting-view section-gap"><header class="fund-reporting-view-head"><div><small>${escapeHTML(selectedFund.name)} · Q2 2026</small><h2>${escapeHTML(state.fundReportingView)}</h2><p>${state.fundReportingView==='Performance'?'Fund-level return metrics and progression.':state.fundReportingView==='Cash Flows'?'Contribution, distribution, fee and investment cash-flow detail.':state.fundReportingView==='Portfolio'?'Investment-level operating and valuation performance.':state.fundReportingView==='Attribution'?'Company and value-creation contribution to fund return.':'PME, peer cohort and methodology comparison.'}</p></div><div>${statusPill('Data validated','success')}${button('Open report builder','open-report-builder','compact','edit')}</div></header>${v10RenderFundReportingContent(selectedFund,state.fundReportingView)}</section>`;
  };

  const v10BaseReportInspector = v9RenderReportInspector;
  v9RenderReportInspector = function() {
    if (state.reportBuilderTab !== 'design') return v10BaseReportInspector();
    const meta = v10IndustryTemplateMeta[state.reportTemplate] || v10IndustryTemplateMeta['ILPA Quarterly Reporting 2.0'];
    return `<div class="inspector-section"><h4>Industry template</h4><div class="info-list"><div class="info-row"><span>Template</span><strong>${escapeHTML(state.reportTemplate)}</strong></div><div class="info-row"><span>Framework basis</span><strong>${escapeHTML(meta.basis)}</strong></div><div class="info-row"><span>Generation status</span><strong>${escapeHTML(state.reportAutosave)}</strong></div><div class="info-row"><span>Source-data as of</span><strong>${escapeHTML(state.reportDataAsOf)}</strong></div></div><div class="form-field section-gap"><label>Template</label><select data-change-action="industry-report-template">${Object.keys(v10IndustryTemplateMeta).map(name=>`<option ${state.reportTemplate===name?'selected':''}>${escapeHTML(name)}</option>`).join('')}</select></div><div class="action-grid section-gap">${button('Regenerate pack','autogenerate-report-template','primary','sparkles')}${button('Template library','open-report-template-library','compact','layers')}</div></div><div class="inspector-section"><h4>Brand & page design</h4><div class="info-list"><div class="info-row"><span>Letterhead</span><strong>${escapeHTML(v9Letterhead.organisation)}</strong></div><div class="info-row"><span>Accent</span><strong><span class="colour-swatch" style="background:${escapeHTML(v9Letterhead.accent)}"></span>${escapeHTML(v9Letterhead.accent)}</strong></div></div><div class="section-gap">${button('Edit letterhead','edit-letterhead','primary','edit')}</div><div class="action-grid section-gap">${button('Add KPI block','editor-add-block','compact','plus','data-kind="kpi"')}${button('Add table','editor-add-block','compact','grid','data-kind="table"')}${button('Add callout','editor-add-block','compact','info','data-kind="callout"')}</div></div>`;
  };
  renderReportInspector = v9RenderReportInspector;

  const v10BaseRenderReportBuilder = renderReportBuilder;
  renderReportBuilder = function() {
    const html = v10BaseRenderReportBuilder();
    return html.replace('</header>',`</header>${v10TemplateBar()}`);
  };

  function v10ShowCurrentReportPreview() {
    v9SaveCurrentReportSection?.(false);
    const active = clamp((state.previewReportSection||0),0,v9ReportSections.length-1);
    const section = v9ReportSections[active];
    const meta = v10IndustryTemplateMeta[state.reportTemplate] || v10IndustryTemplateMeta['ILPA Quarterly Reporting 2.0'];
    showModal('Report Preview',`${state.reportTemplate} · working draft · ${v9ReportSections.length} sections`,`<div class="report-preview-shell professional-report v10-current-report-preview"><aside><div class="report-preview-standard"><small>Template basis</small><strong>${escapeHTML(meta.basis)}</strong></div><strong>Report outline</strong>${v9ReportSections.map((item,index)=>`<button class="${index===active?'active':''}" data-action="v10-preview-report-section" data-section="${index}"><span>${index+1}</span>${escapeHTML(item.title)}${item.status==='Complete'?icon('check-circle'):icon('alert')}</button>`).join('')}</aside><main><article>${v9RenderLetterhead(v9Letterhead)}<div class="report-page-rule"></div><div class="report-section-header"><span>${String(active+1).padStart(2,'0')}</span><div><small>Current section</small><strong>${escapeHTML(section.title)}</strong></div></div><main class="report-document-content">${section.body}</main>${v9LetterheadFooter()}<footer class="report-page-footer"><span>Working draft · ${escapeHTML(state.reportAutosave)}</span><span>Section ${active+1} of ${v9ReportSections.length}</span></footer></article></main><aside class="report-preview-inspector"><strong>Publication controls</strong><div class="info-list"><div class="info-row"><span>Status</span><strong>${statusPill(section.status)}</strong></div><div class="info-row"><span>Template</span><strong>${escapeHTML(state.reportTemplate)}</strong></div><div class="info-row"><span>Framework</span><strong>${escapeHTML(meta.basis)}</strong></div><div class="info-row"><span>Data as of</span><strong>${escapeHTML(state.reportDataAsOf)}</strong></div><div class="info-row"><span>Sections</span><strong>${v9ReportSections.length}</strong></div></div><div class="reason-item section-gap">${icon('edit')}<div><strong>Fully editable source document</strong><small>Return to the report builder to edit text, tables, metrics, images, source links, order and letterhead.</small></div></div>${button('Edit this section','close-and-edit-report','primary','edit',`data-section="${active+1}"`)}</aside></div>`,`${button('Download PDF','download-report-format','','download','data-id="RVA-001" data-format="pdf"')}${button('Export Excel','download-report-format','','bar-chart','data-id="RVA-001" data-format="xls"')}${button('Edit document','close-and-edit-report','primary','edit',`data-section="${active+1}"`)}`,{variant:'document',size:'fullscreen',eyebrow:'Industry-standard editable report preview'});
  }

  const v10PreviousShowReportPreview = showReportPreview;
  showReportPreview = function(id,scheduled=null) {
    if (id === 'RVA-001' && !scheduled) return v10ShowCurrentReportPreview();
    return v10PreviousShowReportPreview(id,scheduled);
  };

  const v10PreviousHandleAction = handleAction;
  handleAction = function(action,trigger,event) {
    switch(action) {
      case 'fund-reporting-tab': state.fundReportingView=trigger.dataset.tab||'Performance'; render(); requestAnimationFrame(()=>$('.fund-reporting-view')?.scrollIntoView({behavior:'smooth',block:'start'})); return;
      case 'reset-fund-reporting-filters': state.fundReportingCurrency='USD'; state.fundReportingBasis='Net'; state.fundReportingBenchmark='Private Markets PME'; toast('Fund reporting filters reset','USD, Net and Private Markets PME are selected.'); render(); return;
      case 'open-report-template-library': v9SaveCurrentReportSection?.(false); v10ShowTemplateLibrary(); return;
      case 'apply-report-template': closeOverlays(); v10ApplyIndustryTemplate(trigger.dataset.template); return;
      case 'autogenerate-report-template': v10ApplyIndustryTemplate(state.reportTemplate); return;
      case 'v10-preview-report-section': state.previewReportSection=Number(trigger.dataset.section||0); v10ShowCurrentReportPreview(); return;
      case 'close-and-edit-report': state.reportSection=Number(trigger.dataset.section||1); closeOverlays(); navigate('report-builder'); return;
      default: return v10PreviousHandleAction(action,trigger,event);
    }
  };

  document.addEventListener('change',event=>{
    const target=event.target;
    if(target.dataset.changeAction==='industry-report-template') {
      state.reportTemplate=target.value;
      toast('Template selected',`${target.value} is ready to auto-generate. Existing draft content is unchanged until you click Auto-generate & prefill.`);
      render();
    }
    if(target.dataset.changeAction==='fund-reporting-currency') { state.fundReportingCurrency=target.value; toast('Currency updated',target.value); render(); }
    if(target.dataset.changeAction==='fund-reporting-basis') { state.fundReportingBasis=target.value; toast('Return basis updated',target.value); render(); }
    if(target.dataset.changeAction==='fund-reporting-benchmark') { state.fundReportingBenchmark=target.value; toast('Benchmark updated',target.value); render(); }
  });


  // ---------------------------------------------------------------------------
  // V11: dynamic RBAC, detailed responsive settings, responsive e-signatures
  // and broad interaction affordances for static information surfaces.
  // ---------------------------------------------------------------------------
  Object.assign(iconPaths, {
    crown:'<path d="M3 7l4 4 5-7 5 7 4-4-2 10H5L3 7Z"/><path d="M5 20h14"/>',
    calculator:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/>',
    database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    code:'<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
    activity:'<path d="M3 12h4l2-7 4 14 2-7h6"/>',
    'user-plus':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
    'user-minus':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 11h6"/>'
  });
  const v11PermissionPages = navGroups.flatMap(group => group.items.map(item => item.id));
  const v11PageLabels = Object.fromEntries(navGroups.flatMap(group => group.items.map(item => [item.id, item.label])));
  const v11PageGroups = Object.fromEntries(navGroups.flatMap(group => group.items.map(item => [item.id, group.label])));
  const v11FullPermissions = () => Object.fromEntries(v11PermissionPages.map(page => [page, { read:true, write:true }]));
  const v11Permissions = entries => {
    const output = Object.fromEntries(v11PermissionPages.map(page => [page, { read:false, write:false }]));
    Object.entries(entries).forEach(([page, access]) => {
      if (!output[page]) return;
      output[page] = { read: access.includes('r'), write: access.includes('w') };
      if (output[page].write) output[page].read = true;
    });
    return output;
  };

  const v11RoleDefinitions = {
    ceo: {
      id:'ceo', name:'Chief Executive Officer', short:'CEO', colour:'var(--brand)', icon:'crown', description:'Enterprise-wide executive authority across investments, operations, reporting and configuration.', approvalLimit:'Unlimited', scope:'All funds, vehicles and legal entities', permissions:v11FullPermissions()
    },
    admin: {
      id:'admin', name:'Administrator', short:'Admin', colour:'var(--cyan)', icon:'settings', description:'Full platform administration, access control, integrations and operational configuration.', approvalLimit:'System configuration; no economic limit', scope:'All workspaces and tenants', permissions:v11FullPermissions()
    },
    cio: {
      id:'cio', name:'Chief Investment Officer', short:'CIO', colour:'var(--purple)', icon:'briefcase', description:'Full investment, portfolio, fund-operation, approval and reporting authority.', approvalLimit:'Unlimited investment authority', scope:'All funds and portfolio companies', permissions:v11FullPermissions()
    },
    analyst: {
      id:'analyst', name:'Investment Analyst', short:'Analyst', colour:'var(--blue)', icon:'bar-chart', description:'Deal execution, diligence, portfolio monitoring and report preparation without final approval authority.', approvalLimit:'Draft and recommend only', scope:'Assigned funds and deals', permissions:v11Permissions({dashboard:'r',deals:'rw',funds:'r','capital-calls':'r',companies:'rw',reporting:'rw','fund-performance':'r',lps:'r','documents-vault':'rw','reports-vault':'rw','e-signatures':'r','mailer-lists':'r'})
    },
    monitoring: {
      id:'monitoring', name:'Monitoring & Evaluation', short:'M&E', colour:'var(--emerald)', icon:'activity', description:'Portfolio monitoring, impact evidence, KPI validation and reporting access only.', approvalLimit:'Monitoring data certification', scope:'Assigned portfolio companies and impact programmes', permissions:v11Permissions({dashboard:'r',funds:'r',companies:'rw',reporting:'rw','fund-performance':'r','documents-vault':'rw','reports-vault':'rw','mailer-lists':'r'})
    },
    legal: {
      id:'legal', name:'Legal', short:'Legal', colour:'var(--amber)', icon:'gavel', description:'Legal diligence, controlled documents, term sheets, agreements and electronic signatures.', approvalLimit:'Legal-document approval only', scope:'Authorised deals and legal folders', permissions:v11Permissions({dashboard:'r',deals:'rw',funds:'r',companies:'r','documents-vault':'rw','reports-vault':'r','e-signatures':'rw'})
    },
    accounting: {
      id:'accounting', name:'Accounting', short:'Accounting', colour:'var(--red)', icon:'calculator', description:'Capital activity, cash, ledgers, reconciliations, period close and financial reporting.', approvalLimit:'Configured maker-checker thresholds', scope:'Authorised funds, accounts and currencies', permissions:v11Permissions({dashboard:'r',funds:'r','capital-calls':'rw',companies:'r',reporting:'rw','fund-performance':'rw',lps:'r','cash-accounts':'rw','cash-overview':'rw','cash-ledger':'rw','cash-reservations':'rw','statement-imports':'rw',reconciliations:'rw',exceptions:'rw','period-close':'rw','documents-vault':'rw','reports-vault':'rw','e-signatures':'r'})
    }
  };

  const v11RoleMembers = [
    { id:'USR-001', name:'Tendai Moyo', initials:'TM', role:'ceo', title:'Chief Executive Officer', email:'tendai.moyo@matanho.com', status:'Active', scope:'All entities', lastActive:'Now' },
    { id:'USR-002', name:'Rudo Chikore', initials:'RC', role:'admin', title:'Platform Administrator', email:'rudo.chikore@matanho.com', status:'Active', scope:'All workspaces', lastActive:'4 min ago' },
    { id:'USR-003', name:'Tariro Kasere', initials:'TK', role:'cio', title:'Chief Investment Officer', email:'tariro.kasere@matanho.com', status:'Active', scope:'All funds', lastActive:'8 min ago' },
    { id:'USR-004', name:'Nyasha Moyo', initials:'NM', role:'analyst', title:'Senior Investment Analyst', email:'nyasha.moyo@matanho.com', status:'Active', scope:'Growth Fund II + Venture Fund I', lastActive:'12 min ago' },
    { id:'USR-005', name:'Chipo Dube', initials:'CD', role:'monitoring', title:'Monitoring & Evaluation Lead', email:'chipo.dube@matanho.com', status:'Active', scope:'Portfolio companies', lastActive:'22 min ago' },
    { id:'USR-006', name:'Farai Chikore', initials:'FC', role:'legal', title:'Legal Counsel', email:'farai.chikore@matanho.com', status:'Active', scope:'Authorised legal matters', lastActive:'31 min ago' },
    { id:'USR-007', name:'Laura Chen', initials:'LC', role:'accounting', title:'Fund Accounting Lead', email:'laura.chen@matanho.com', status:'Active', scope:'All active fund accounts', lastActive:'46 min ago' },
    { id:'USR-008', name:'Tendai Sibanda', initials:'TS', role:'analyst', title:'Investment Analyst', email:'tendai.sibanda@matanho.com', status:'Active', scope:'Assigned deals', lastActive:'1 hour ago' },
    { id:'USR-009', name:'Anita Kapoor', initials:'AK', role:'legal', title:'Compliance & Legal Reviewer', email:'anita.kapoor@matanho.com', status:'Invited', scope:'Legal and compliance records', lastActive:'Invitation pending' }
  ];

  state.currentRole = state.currentRole || storage.get('matanho-portfolio-role','ceo');
  if (!v11RoleDefinitions[state.currentRole]) state.currentRole = 'ceo';
  state.settingsTab = state.settingsTab || 'roles';
  state.rbacSelectedRole = state.rbacSelectedRole || state.currentRole;
  state.signatureView = state.signatureView || 'Envelopes';
  state.signatureInspectorTab = state.signatureInspectorTab || 'Prepare';
  state.signatureSelectedRecipient = Number.isInteger(state.signatureSelectedRecipient) ? state.signatureSelectedRecipient : 0;
  state.signatureFields = Array.isArray(state.signatureFields) && state.signatureFields.length ? state.signatureFields : [
    { id:'SIG-FLD-001', type:'Signature', recipient:0, page:1, status:'Required' },
    { id:'SIG-FLD-002', type:'Date signed', recipient:0, page:1, status:'Required' },
    { id:'SIG-FLD-003', type:'Initials', recipient:1, page:1, status:'Required' }
  ];
  state.selectedSignatureField = state.selectedSignatureField || 'SIG-FLD-001';

  const v11PageResource = page => ({
    'deal-detail':'deals','applicant-portal':'deals','company-detail':'companies','fund-detail':'funds','lp-detail':'lps','capital-call-detail':'capital-calls','report-builder':'reports-vault','analytics-detail':'dashboard','reconciliation-workspace':'reconciliations'
  }[page] || page);

  function v11CurrentRole() { return v11RoleDefinitions[state.currentRole] || v11RoleDefinitions.ceo; }
  function v11CanRead(page, roleId=state.currentRole) {
    const role=v11RoleDefinitions[roleId] || v11RoleDefinitions.ceo;
    return Boolean(role.permissions[v11PageResource(page)]?.read);
  }
  function v11CanWrite(page, roleId=state.currentRole) {
    const role=v11RoleDefinitions[roleId] || v11RoleDefinitions.ceo;
    return Boolean(role.permissions[v11PageResource(page)]?.write);
  }
  function v11FirstReadablePage(roleId=state.currentRole) {
    return v11PermissionPages.find(page=>v11CanRead(page,roleId)) || 'dashboard';
  }
  function v11RoleMember(roleId=state.currentRole) {
    return v11RoleMembers.find(member=>member.role===roleId) || v11RoleMembers[0];
  }
  function v11RoleMemberCount(roleId) { return v11RoleMembers.filter(member=>member.role===roleId).length; }
  function v11IsFullAuthority(roleId=state.currentRole) { return ['ceo','admin','cio'].includes(roleId); }

  const v11BasePublicSnapshot = publicSnapshot;
  publicSnapshot = function() {
    const snapshot=v11BasePublicSnapshot();
    snapshot.data.rbac={
      activeRole:state.currentRole,
      roles:cloneForIntegration(Object.values(v11RoleDefinitions)),
      users:cloneForIntegration(v11RoleMembers)
    };
    return snapshot;
  };

  const v11BaseHydrate = hydrateFromBackend;
  hydrateFromBackend = function(payload={}) {
    const source=payload.data || payload;
    const incoming=source.rbac;
    if (incoming?.roles) incoming.roles.forEach(role=>{
      if (!role?.id) return;
      if (v11RoleDefinitions[role.id]) Object.assign(v11RoleDefinitions[role.id],role);
      else v11RoleDefinitions[role.id]=role;
    });
    if (Array.isArray(incoming?.users)) v11RoleMembers.splice(0,v11RoleMembers.length,...incoming.users);
    if (incoming?.activeRole && v11RoleDefinitions[incoming.activeRole]) state.currentRole=incoming.activeRole;
    return v11BaseHydrate(payload);
  };

  const v11BaseRenderNav = renderNav;
  renderNav = function() {
    const activePage=v11PageResource(state.page);
    const visibleGroups=navGroups.map(group=>({ ...group, items:group.items.filter(item=>v11CanRead(item.id)) })).filter(group=>group.items.length);
    primaryNav.innerHTML=visibleGroups.map(group=>`<div class="nav-group"><div class="nav-group-label">${group.label}</div>${group.items.map(item=>`<button class="nav-item ${activePage===item.id?'active':''}" data-action="navigate" data-page="${item.id}" title="${escapeHTML(item.label)}">${icon(item.icon)}<span class="nav-label">${escapeHTML(item.label)}</span>${item.badge?`<span class="nav-badge">${item.badge}</span>`:''}</button>`).join('')}</div>`).join('');
  };

  const v11SettingsTabs = [
    ['workspace','Workspace','settings'],['roles','Roles & Access','users'],['security','Security','shield'],['integrations','Integrations','grid'],['notifications','Notifications','bell'],['data','Data & Retention','database'],['api','API & Webhooks','code']
  ];

  function v11SettingsNav() {
    return `<nav class="v11-settings-nav" aria-label="Settings sections">${v11SettingsTabs.map(([id,label,ic])=>`<button class="${state.settingsTab===id?'active':''}" data-action="settings-tab" data-tab="${id}">${icon(ic)}<span>${escapeHTML(label)}</span>${id==='roles'?`<small>${Object.keys(v11RoleDefinitions).length} roles</small>`:''}</button>`).join('')}</nav>`;
  }

  function v11SettingToggle(label,description,checked=true,changeAction='v11-setting-toggle') {
    return `<label class="v11-setting-toggle"><span><strong>${escapeHTML(label)}</strong><small>${escapeHTML(description)}</small></span><input type="checkbox" ${checked?'checked':''} data-change-action="${changeAction}"><i></i></label>`;
  }

  function v11RenderWorkspaceSettings() {
    return `<div class="v11-settings-content"><section class="v11-settings-hero"><div><small>WORKSPACE PROFILE</small><h2>Matanho Capital</h2><p>Default operating context for private-market investment, reporting and fund operations.</p></div><span class="v11-settings-badge">Production workspace</span></section><section class="grid cols-2"><div class="card v11-settings-card"><div class="card-head"><div><h3>Organisation & locale</h3><p>Identity, timezone, currency and date conventions.</p></div>${icon('building')}</div><div class="form-grid"><div class="form-field full"><label>Workspace name</label><input value="Matanho Capital"></div><div class="form-field"><label>Base currency</label><select><option>USD</option><option>ZWG</option><option>ZAR</option></select></div><div class="form-field"><label>Timezone</label><select><option>Africa/Harare (CAT)</option><option>Africa/Johannesburg (SAST)</option></select></div><div class="form-field"><label>Date format</label><select><option>DD MMM YYYY</option><option>YYYY-MM-DD</option></select></div><div class="form-field"><label>Number format</label><select><option>1,234,567.89</option><option>1 234 567,89</option></select></div></div></div><div class="card v11-settings-card"><div class="card-head"><div><h3>Default experience</h3><p>Starting page, navigation and dashboard behaviour.</p></div>${icon('dashboard')}</div><div class="form-grid"><div class="form-field full"><label>Default landing page</label><select>${v11PermissionPages.filter(page=>v11CanRead(page)).map(page=>`<option ${page==='dashboard'?'selected':''}>${escapeHTML(v11PageLabels[page])}</option>`).join('')}</select></div><div class="form-field"><label>Sidebar default</label><select><option>Collapsed</option><option>Expanded</option></select></div><div class="form-field"><label>Theme</label><select data-change-action="theme-setting"><option ${state.theme==='light'?'selected':''}>Light</option><option ${state.theme==='dark'?'selected':''}>Dark</option></select></div></div><div class="v11-setting-list">${v11SettingToggle('Remember filters','Retain personal filters between sessions.',true)}${v11SettingToggle('Dense tables','Use the institutional high-density table layout.',true)}${v11SettingToggle('Keyboard shortcuts','Enable command palette and navigation shortcuts.',true)}</div></div></section><section class="card v11-settings-card section-gap"><div class="card-head"><div><h3>Investment and reporting controls</h3><p>Workspace-level defaults. Role and approval controls remain separately enforced.</p></div>${button('Open policy versions','settings-policy-versions','compact','clock')}</div><div class="v11-settings-columns"><div class="v11-setting-list">${v11SettingToggle('Manager confirmation for AI screening','A person must confirm every AI shortlist decision.',true)}${v11SettingToggle('Conflict declaration before IC voting','Committee members must declare conflicts before voting.',true)}${v11SettingToggle('Dual authorisation for payments','All controlled payments require maker-checker approval.',true)}</div><div class="v11-setting-list">${v11SettingToggle('Lock disbursement until conditions complete','No tranche release before all required closing conditions pass.',true)}${v11SettingToggle('Auto-generate reporting drafts','Create prefilled report drafts at the configured data lock.',true)}${v11SettingToggle('Allow applicant amendments','Permit controlled post-submission amendments.',false)}</div></div></section></div>`;
  }

  function v11PermissionToggle(roleId,page,access,value) {
    const disabled=!v11IsFullAuthority();
    return `<button class="v11-permission-toggle ${value?'on':''}" data-action="toggle-role-permission" data-role="${roleId}" data-page="${page}" data-access="${access}" ${disabled?'disabled':''} aria-pressed="${value}" title="${disabled?'Only CEO, Administrator or CIO may change access':'Toggle '+access+' access'}"><span>${value?icon('check'):''}</span>${access==='read'?'Read':'Write'}</button>`;
  }

  function v11RenderRolesSettings() {
    const selected=v11RoleDefinitions[state.rbacSelectedRole] || v11CurrentRole();
    const selectedMembers=v11RoleMembers.filter(member=>member.role===selected.id);
    const matrixRows=navGroups.map(group=>`<tr class="v11-permission-group"><th colspan="3">${escapeHTML(group.label)}</th></tr>${group.items.map(item=>{const p=selected.permissions[item.id]||{read:false,write:false};return `<tr><td><span class="v11-permission-module">${icon(item.icon)}<span><strong>${escapeHTML(item.label)}</strong><small>${escapeHTML(group.label)}</small></span></span></td><td>${v11PermissionToggle(selected.id,item.id,'read',p.read)}</td><td>${v11PermissionToggle(selected.id,item.id,'write',p.write)}</td></tr>`}).join('')}`).join('');
    return `<div class="v11-settings-content"><section class="v11-rbac-summary"><div><small>ACTIVE SECURITY CONTEXT</small><h2>${escapeHTML(v11CurrentRole().name)}</h2><p>${escapeHTML(v11CurrentRole().scope)}</p></div><div class="v11-rbac-summary-metrics"><span><strong>${Object.keys(v11RoleDefinitions).length}</strong><small>Roles</small></span><span><strong>${v11RoleMembers.length}</strong><small>Users</small></span><span><strong>100%</strong><small>MFA coverage</small></span><span><strong>0</strong><small>Orphan access</small></span></div></section><div class="v11-rbac-layout"><aside class="v11-role-directory"><div class="section-heading-with-action"><h3>Roles</h3>${v11IsFullAuthority()?button('New role','create-custom-role','compact','plus'):''}</div>${Object.values(v11RoleDefinitions).map(role=>`<button class="v11-role-card ${selected.id===role.id?'active':''}" data-action="select-rbac-role" data-role="${role.id}" style="--role-colour:${role.colour}"><span class="v11-role-icon">${icon(role.icon)}</span><span><strong>${escapeHTML(role.name)}</strong><small>${escapeHTML(role.description)}</small></span><b>${v11RoleMemberCount(role.id)}</b></button>`).join('')}</aside><main class="v11-rbac-main"><section class="card v11-role-profile"><div class="v11-role-profile-head"><span class="v11-role-icon large" style="--role-colour:${selected.colour}">${icon(selected.icon)}</span><div><small>ROLE PROFILE</small><h2>${escapeHTML(selected.name)}</h2><p>${escapeHTML(selected.description)}</p></div><div class="v11-role-profile-actions">${statusPill(v11IsFullAuthority(selected.id)?'Full authority':'Scoped access',v11IsFullAuthority(selected.id)?'success':'info')}${button('Preview access','preview-role-access','compact','eye',`data-role="${selected.id}"`)}</div></div><div class="v11-role-facts"><span><small>Data scope</small><strong>${escapeHTML(selected.scope)}</strong></span><span><small>Approval authority</small><strong>${escapeHTML(selected.approvalLimit)}</strong></span><span><small>Members</small><strong>${selectedMembers.length}</strong></span><span><small>Last reviewed</small><strong>01 Aug 2026</strong></span></div></section><section class="card table-card section-gap"><div class="table-toolbar"><div><h3>Read and write permissions</h3><p>Read controls visibility. Write controls create, edit, approve and decision actions.</p></div><div>${statusPill(v11IsFullAuthority()?'Editing enabled':'Read-only configuration',v11IsFullAuthority()?'success':'neutral')}</div></div><div class="table-wrap v11-permission-table"><table><thead><tr><th>Workspace</th><th>Read</th><th>Write</th></tr></thead><tbody>${matrixRows}</tbody></table></div></section><section class="card table-card section-gap"><div class="table-toolbar"><div><h3>Role members</h3><p>People, scope, status and last activity for this role.</p></div>${v11IsFullAuthority()?button('Add person','add-role-member','primary compact','user-plus',`data-role="${selected.id}"`):''}</div><div class="table-wrap"><table><thead><tr><th>Person</th><th>Title</th><th>Scope</th><th>Status</th><th>Last active</th><th></th></tr></thead><tbody>${selectedMembers.length?selectedMembers.map(member=>`<tr data-action="v11-role-member-detail" data-id="${member.id}"><td class="table-primary"><span class="v11-person-cell">${personAvatar(member.name,"avatar-gradient")}<span>${escapeHTML(member.name)}<small>${escapeHTML(member.email)}</small></span></span></td><td>${escapeHTML(member.title)}</td><td>${escapeHTML(member.scope)}</td><td>${statusPill(member.status)}</td><td>${escapeHTML(member.lastActive)}</td><td>${v11IsFullAuthority()?button('Remove','remove-role-member','ghost compact','x',`data-id="${member.id}"`):''}</td></tr>`).join(''):`<tr><td colspan="6"><div class="empty-state"><strong>No members assigned</strong><p>Add an authorised person to this role.</p></div></td></tr>`}</tbody></table></div></section></main></div></div>`;
  }

  function v11RenderSecuritySettings() {
    return `<div class="v11-settings-content"><section class="metric-grid">${metricCard({label:'MFA Coverage',value:'100%',iconName:'shield',accent:'emerald',foot:'9 of 9 active users',action:'security-mfa-detail'})}${metricCard({label:'Active Sessions',value:'14',iconName:'activity',accent:'blue',foot:'Across 7 users',action:'security-session-detail'})}${metricCard({label:'Privileged Roles',value:'3',iconName:'user-check',accent:'purple',foot:'CEO, Admin and CIO',action:'security-privileged-detail'})}${metricCard({label:'Security Findings',value:'1',iconName:'alert',accent:'amber',foot:'Low-severity review item',action:'security-findings-detail'})}</section><section class="grid cols-2 section-gap"><div class="card v11-settings-card"><div class="card-head"><div><h3>Authentication</h3><p>Identity and session policy.</p></div>${icon('lock')}</div><div class="v11-setting-list">${v11SettingToggle('Require multi-factor authentication','MFA is mandatory for every interactive account.',true)}${v11SettingToggle('Require phishing-resistant MFA for privileged roles','Use a passkey or hardware-backed factor.',true)}${v11SettingToggle('Block shared accounts','Every action must resolve to an individual identity.',true)}${v11SettingToggle('Allow password-only emergency access','Disabled; use governed break-glass access.',false)}</div><div class="form-grid section-gap"><div class="form-field"><label>Session timeout</label><select><option>30 minutes</option><option>60 minutes</option></select></div><div class="form-field"><label>Maximum concurrent sessions</label><input type="number" value="3"></div></div></div><div class="card v11-settings-card"><div class="card-head"><div><h3>Approval controls</h3><p>Maker-checker, thresholds and break-glass governance.</p></div>${icon('user-check')}</div><div class="v11-setting-list">${v11SettingToggle('Enforce maker-checker','A maker can never approve their own controlled record.',true)}${v11SettingToggle('Re-authenticate material approvals','Require a fresh factor for high-value decisions.',true)}${v11SettingToggle('Compliance holds override workflow access','Holds are evaluated before posting, signing and closing.',true)}${v11SettingToggle('Allow broad financial super-admin','Disabled by policy.',false)}</div><div class="form-field section-gap"><label>Material approval threshold</label><div class="input-with-prefix"><span>USD</span><input value="1000000"></div></div></div></section><section class="card table-card section-gap"><div class="table-toolbar"><div><h3>Recent access events</h3><p>Append-only security and permission activity.</p></div>${button('Export audit log','export-security-audit','compact','download')}</div><div class="table-wrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Event</th><th>Object</th><th>Result</th><th>Correlation ID</th></tr></thead><tbody><tr><td>04:01 CAT</td><td>Rudo Chikore</td><td>Role permission reviewed</td><td>Accounting</td><td>${statusPill('Allowed','success')}</td><td>cor_81c9…aa2</td></tr><tr><td>03:42 CAT</td><td>Farai Chikore</td><td>Attempted IC approval</td><td>DL-013</td><td>${statusPill('Denied','danger')}</td><td>cor_71ac…f44</td></tr><tr><td>03:18 CAT</td><td>Laura Chen</td><td>GL export approved</td><td>GLX-071-A</td><td>${statusPill('Allowed','success')}</td><td>cor_62ee…011</td></tr></tbody></table></div></section></div>`;
  }

  function v11RenderIntegrationsSettings() {
    const integrations=[['Fund Accounting','Connected','Two-way journal and posting-reference exchange','emerald'],['Microsoft 365','Connected','Calendar, email and secure document collaboration','emerald'],['DocuSign','Connected','Envelope, signer and certificate callbacks','emerald'],['Refinitiv FX Rates','Connected','Approved daily and period-end FX rates','emerald'],['Banking API','Sandbox','Statement feeds and payment evidence','amber'],['CRM','Not configured','Deal sourcing and relationship synchronisation','red']];
    return `<div class="v11-settings-content"><section class="v11-integration-grid">${integrations.map(item=>`<article class="card v11-integration-card"><header><span class="activity-icon" style="color:var(--${item[3]});background:var(--${item[3]}-soft)">${icon('grid')}</span><div><strong>${item[0]}</strong><small>${item[2]}</small></div>${statusPill(item[1],item[1]==='Connected'?'success':item[1]==='Sandbox'?'warning':'danger')}</header><div class="v11-integration-meta"><span><small>Last sync</small><strong>${item[1]==='Not configured'?'—':'01 Aug 2026 · 03:55 CAT'}</strong></span><span><small>Environment</small><strong>${item[1]==='Sandbox'?'Sandbox':'Production'}</strong></span></div><footer>${button(item[1]==='Not configured'?'Connect':'Configure','configure-integration','compact','settings',`data-integration="${item[0]}"`)}${item[1]!=='Not configured'?button('Test connection','test-integration','ghost compact','activity',`data-integration="${item[0]}"`):''}</footer></article>`).join('')}</section><section class="card v11-settings-card section-gap"><div class="card-head"><div><h3>Integration health</h3><p>Recent sync volume, errors and retry status.</p></div>${button('Open integration log','integration-log','compact','list')}</div>${lineChart({labels:['00:00','01:00','02:00','03:00','04:00'],series:[{name:'Successful calls',color:'var(--emerald)',values:[82,96,91,108,103]},{name:'Retries',color:'var(--amber)',values:[3,2,4,1,2]},{name:'Failed',color:'var(--red)',values:[0,1,0,0,0]}],height:260,yLabel:'Requests',format:value=>String(Math.round(value))})}</section></div>`;
  }

  function v11RenderNotificationsSettings() {
    return `<div class="v11-settings-content"><section class="grid cols-2"><div class="card v11-settings-card"><div class="card-head"><div><h3>Personal notifications</h3><p>Choose events and delivery channels for the signed-in role.</p></div>${icon('bell')}</div><div class="v11-notification-table"><div><strong>Event</strong><strong>In app</strong><strong>Email</strong><strong>Digest</strong></div>${[['Deal or diligence assignment',true,true,false],['Approval waiting',true,true,true],['Portfolio KPI exception',true,true,true],['Statement or reconciliation break',true,false,true],['Report review comment',true,true,false],['Signature completed or declined',true,true,false]].map(row=>`<label><span>${row[0]}</span><input type="checkbox" ${row[1]?'checked':''}><input type="checkbox" ${row[2]?'checked':''}><input type="checkbox" ${row[3]?'checked':''}></label>`).join('')}</div></div><div class="card v11-settings-card"><div class="card-head"><div><h3>Escalation & quiet hours</h3><p>Control SLA alerts and non-critical delivery times.</p></div>${icon('clock')}</div><div class="form-grid"><div class="form-field full"><label>Digest frequency</label><select><option>Daily at 07:30 CAT</option><option>Twice daily</option><option>Weekly</option></select></div><div class="form-field"><label>Quiet hours start</label><input type="time" value="20:00"></div><div class="form-field"><label>Quiet hours end</label><input type="time" value="06:00"></div><div class="form-field full"><label>Escalate overdue approvals after</label><select><option>4 business hours</option><option>8 business hours</option><option>1 business day</option></select></div></div><div class="v11-setting-list section-gap">${v11SettingToggle('Bypass quiet hours for critical events','Security, compliance and material cash events deliver immediately.',true)}${v11SettingToggle('Notify delegated approver','Send the same approval pack to the active delegate.',true)}</div></div></section></div>`;
  }

  function v11RenderDataSettings() {
    return `<div class="v11-settings-content"><section class="grid cols-2"><div class="card v11-settings-card"><div class="card-head"><div><h3>Retention classes</h3><p>Versioned retention and legal-hold rules.</p></div>${icon('database')}</div><div class="table-wrap"><table><thead><tr><th>Record class</th><th>Retention</th><th>Legal hold</th></tr></thead><tbody><tr><td>Fund and investor documents</td><td>10 years after fund close</td><td>${statusPill('Supported','success')}</td></tr><tr><td>Cash ledger and reconciliation evidence</td><td>Permanent / policy controlled</td><td>${statusPill('Required','info')}</td></tr><tr><td>Signature evidence</td><td>10 years after completion</td><td>${statusPill('Supported','success')}</td></tr><tr><td>Working drafts</td><td>3 years after superseded</td><td>${statusPill('Optional','neutral')}</td></tr></tbody></table></div>${button('Edit retention policy','edit-retention-policy','primary compact','edit')}</div><div class="card v11-settings-card"><div class="card-head"><div><h3>Data residency & backup</h3><p>Storage, continuity and restore-test controls.</p></div>${icon('shield')}</div><div class="info-list"><div class="info-row"><span>Primary region</span><strong>Southern Africa</strong></div><div class="info-row"><span>Encryption</span><strong>AES-256 at rest · TLS 1.3 in transit</strong></div><div class="info-row"><span>Recovery point objective</span><strong>15 minutes</strong></div><div class="info-row"><span>Recovery time objective</span><strong>4 hours</strong></div><div class="info-row"><span>Last restore test</span><strong>17 Jul 2026 · Passed</strong></div></div><div class="v11-setting-list section-gap">${v11SettingToggle('Immutable evidence storage','Committed statements, signatures and audit evidence are write-once.',true)}${v11SettingToggle('Cross-region backup','Encrypted secondary copy and restore verification.',true)}</div></div></section><section class="card v11-settings-card section-gap"><div class="card-head"><div><h3>Export and sensitive-data controls</h3><p>Apply the same policy to UI, API and background exports.</p></div>${button('Review export audit','export-audit','compact','eye')}</div><div class="v11-settings-columns"><div class="v11-setting-list">${v11SettingToggle('Mask bank account identifiers','Show only the approved display identifier by default.',true)}${v11SettingToggle('Watermark confidential exports','Apply user, time and classification metadata.',true)}</div><div class="v11-setting-list">${v11SettingToggle('Require reason for bulk export','Capture purpose, scope and requester.',true)}${v11SettingToggle('Permit unrestricted CSV exports','Disabled; exports are permission and scope controlled.',false)}</div></div></section></div>`;
  }

  function v11RenderApiSettings() {
    return `<div class="v11-settings-content"><section class="grid cols-2"><div class="card v11-settings-card"><div class="card-head"><div><h3>API access</h3><p>Service identities, scopes and key rotation.</p></div>${button('Create service account','create-service-account','primary compact','plus')}</div><div class="table-wrap"><table><thead><tr><th>Service</th><th>Scopes</th><th>Last used</th><th>Status</th></tr></thead><tbody><tr><td class="table-primary">Fund Accounting Bridge</td><td>ledger:read · gl-export:write</td><td>2 min ago</td><td>${statusPill('Active','success')}</td></tr><tr><td class="table-primary">Investor Portal</td><td>reports:read · documents:read</td><td>11 min ago</td><td>${statusPill('Active','success')}</td></tr><tr><td class="table-primary">Data Warehouse</td><td>analytics:read</td><td>4 hours ago</td><td>${statusPill('Active','success')}</td></tr></tbody></table></div></div><div class="card v11-settings-card"><div class="card-head"><div><h3>Webhook subscriptions</h3><p>Signed, replay-safe domain-event delivery.</p></div>${button('New webhook','create-webhook','primary compact','plus')}</div><div class="info-list"><div class="info-row"><span>cash.journal.posted</span><strong>${statusPill('Healthy','success')}</strong></div><div class="info-row"><span>cash.match.confirmed</span><strong>${statusPill('Healthy','success')}</strong></div><div class="info-row"><span>signature.envelope.completed</span><strong>${statusPill('Healthy','success')}</strong></div><div class="info-row"><span>report.published</span><strong>${statusPill('1 retry','warning')}</strong></div></div><div class="v11-setting-list section-gap">${v11SettingToggle('Verify webhook signatures','Reject payloads with invalid signatures or expired timestamps.',true)}${v11SettingToggle('Automatic retry','Exponential retry with an idempotent event identifier.',true)}</div></div></section><section class="card v11-settings-card section-gap"><div class="card-head"><div><h3>Runtime configuration</h3><p>Values consumed by the frontend API client without a rebuild.</p></div>${button('Download config','download-runtime-config','compact','download')}</div><div class="code-block"><code>API_BASE_URL=/api/v1<br>AUTH_MODE=oidc<br>TENANT_HEADER=X-Matanho-Tenant<br>CORRELATION_HEADER=X-Correlation-ID<br>RBAC_ENFORCEMENT=server_and_client<br>FEATURE_E_SIGNATURES=true</code></div></section></div>`;
  }

  const v11BaseRenderSettings = renderSettings;
  renderSettings = function() {
    const body=state.settingsTab==='workspace'?v11RenderWorkspaceSettings():state.settingsTab==='roles'?v11RenderRolesSettings():state.settingsTab==='security'?v11RenderSecuritySettings():state.settingsTab==='integrations'?v11RenderIntegrationsSettings():state.settingsTab==='notifications'?v11RenderNotificationsSettings():state.settingsTab==='data'?v11RenderDataSettings():v11RenderApiSettings();
    return `${pageHeader('Settings & Access Control','Configure workspace behaviour, role-based read/write access, security, integrations and data governance.',`${statusPill(v11CurrentRole().name,v11IsFullAuthority()?'success':'info')}${button('Export configuration','export-settings','','download')}${button('Save changes','save-settings','primary','save')}`,'Workspace Administration')}<section class="v11-settings-shell">${v11SettingsNav()}<main>${body}</main></section>`;
  };

  function v11EnvelopeRows() {
    return signatureEnvelopes.map(e=>`<tr class="clickable" data-action="open-envelope" data-id="${e.id}"><td class="table-primary">${escapeHTML(e.id)}<small>${escapeHTML(e.subject)}</small></td><td><button class="text-link" data-action="open-signature-studio" data-id="${e.documentId}">${escapeHTML(e.document)}</button></td><td><div class="v11-signer-stack">${e.recipients.map(r=>`<span class="signer-chip" title="${escapeHTML(r[0])} · ${escapeHTML(r[2])}">${initials(r[0])}</span>`).join('')}</div></td><td><div class="inline-progress">${progressBar(e.progress)}<span>${e.progress}%</span></div></td><td>${statusPill(e.status)}</td><td>${escapeHTML(e.sent)}</td><td>${escapeHTML(e.expires)}</td><td><div class="row-actions">${button('Open','open-envelope','compact','eye',`data-id="${e.id}"`)}${button('Activity','activity-menu','ghost compact','clock',`data-context="envelope" data-id="${e.id}"`)}</div></td></tr>`).join('');
  }

  function v11RenderSignatureContent() {
    if (state.signatureView==='Overview') return `<section class="grid cols-2"><div class="card">${lineChart({labels:['Apr','May','Jun','Jul','Aug'],series:[{name:'Sent',color:'var(--blue)',values:[8,12,18,21,17]},{name:'Completed',color:'var(--emerald)',values:[6,10,15,19,13]}],height:300,yLabel:'Envelopes',format:value=>String(Math.round(value))})}</div><div class="card"><div class="card-head"><div><h3>Completion health</h3><p>Current signer and envelope status.</p></div>${button('Open audit','signature-view-tab','compact','activity','data-tab="Audit Trail"')}</div>${donutChart([{label:'Completed',value:19,color:'var(--emerald)',display:'19'},{label:'Awaiting',value:6,color:'var(--amber)',display:'6'},{label:'Declined',value:1,color:'var(--red)',display:'1'}],'73%','Completion',150)}</div></section><section class="card table-card section-gap"><div class="table-toolbar"><div><h3>Action required</h3><p>Envelopes that are expiring, declined or waiting beyond policy.</p></div>${button('Send reminders','send-signature-reminders','primary compact','send')}</div><div class="table-wrap"><table><thead><tr><th>Envelope</th><th>Issue</th><th>Owner</th><th>Age</th><th>Action</th></tr></thead><tbody><tr data-action="open-envelope" data-id="ENV-0098"><td class="table-primary">ENV-0098</td><td>One recipient still pending</td><td>Farai Chikore</td><td>3 days</td><td>${button('Open','open-envelope','compact','eye','data-id="ENV-0098"')}</td></tr><tr><td class="table-primary">ENV-0095</td><td>Expires in 24 hours</td><td>Anita Kapoor</td><td>6 days</td><td>${button('Remind','send-signature-reminder','compact','send','data-id="ENV-0095"')}</td></tr></tbody></table></div></section>`;
    if (state.signatureView==='Templates') return `<section class="v11-signature-template-grid">${[['Term Sheet','Investment terms, parties and controlled version','gavel'],['Subscription Agreement','Investor subscription and declarations','file'],['Board Resolution','Board authority and execution blocks','users'],['NDA','Mutual confidentiality and permitted disclosure','lock']].map((item,index)=>`<article class="card v11-signature-template"><span>${icon(item[2])}</span><div><small>TEMPLATE ${String(index+1).padStart(2,'0')}</small><h3>${item[0]}</h3><p>${item[1]}</p></div><div class="v11-template-facts"><span>Fields <strong>${[7,12,5,6][index]}</strong></span><span>Used <strong>${[18,9,12,24][index]}</strong></span></div><footer>${button('Preview','preview-signature-template','compact','eye',`data-template="${item[0]}"`)}${button('Use template','use-signature-template','primary compact','plus',`data-template="${item[0]}"`)}</footer></article>`).join('')}</section>`;
    if (state.signatureView==='Signers') {
      const signers=signatureEnvelopes.flatMap(envelope=>envelope.recipients.map(recipient=>({name:recipient[0],role:recipient[1],status:recipient[2],envelope:envelope.id,document:envelope.document}))).slice(0,12);
      return `<section class="card table-card"><div class="table-toolbar"><div><h3>Signer register</h3><p>Identity, role, status and associated controlled document.</p></div>${button('Export signers','export-signers','compact','download')}</div><div class="table-wrap"><table><thead><tr><th>Signer</th><th>Role</th><th>Envelope</th><th>Document</th><th>Status</th><th>Authentication</th><th></th></tr></thead><tbody>${signers.map(s=>`<tr data-action="open-envelope" data-id="${s.envelope}"><td class="table-primary"><span class="v11-person-cell">${personAvatar(s.name)}<span>${escapeHTML(s.name)}<small>Verified recipient</small></span></span></td><td>${escapeHTML(s.role)}</td><td>${escapeHTML(s.envelope)}</td><td>${escapeHTML(s.document)}</td><td>${statusPill(s.status)}</td><td>Email + OTP</td><td>${icon('chevron-right')}</td></tr>`).join('')}</tbody></table></div></section>`;
    }
    if (state.signatureView==='Audit Trail') return `<section class="card table-card"><div class="table-toolbar"><div><h3>Signature audit trail</h3><p>Append-only envelope, recipient and evidence events.</p></div>${button('Export audit','export-signature-audit','compact','download')}</div><div class="table-wrap"><table><thead><tr><th>Timestamp</th><th>Envelope</th><th>Event</th><th>Actor / recipient</th><th>Authentication</th><th>Evidence</th></tr></thead><tbody><tr><td>01 Aug 2026 · 03:51 CAT</td><td>ENV-0098</td><td>Document viewed</td><td>Rudo Ndlovu</td><td>Email + OTP</td><td>evt_09f…a81</td></tr><tr><td>01 Aug 2026 · 03:42 CAT</td><td>ENV-0098</td><td>Signature applied</td><td>Farai Chikore</td><td>Passkey</td><td>sig_82c…ae1</td></tr><tr><td>31 Jul 2026 · 17:08 CAT</td><td>ENV-0097</td><td>Completion certificate issued</td><td>System</td><td>Document hash verified</td><td>cert_91b…442</td></tr></tbody></table></div></section>`;
    return `<section class="card table-card"><div class="table-toolbar"><div class="table-title-row"><h3>Signature Envelopes</h3><span class="table-badge">Electronic evidence and signing order</span></div><div class="table-tools"><label class="table-search">${icon('search')}<input placeholder="Search envelopes or signers"></label>${button('Filters','signature-filters','','filter')}</div></div><div class="table-wrap"><table><thead><tr><th>Envelope / Subject</th><th>Document</th><th>Recipients</th><th>Progress</th><th>Status</th><th>Sent</th><th>Expires</th><th>Actions</th></tr></thead><tbody>${v11EnvelopeRows()}</tbody></table></div></section>`;
  }

  const v11BaseRenderESignatures=renderESignatures;
  renderESignatures=function() {
    return `${pageHeader('E-Signatures','Prepare, route, sign and evidence controlled investment documents with dynamic recipients, fields and signing order.',`${button('Signature templates','signature-view-tab','','layers','data-tab="Templates"')}${button('New envelope','new-signature-envelope','primary','edit')}`,'Reporting & Records')}<section class="signature-summary section-gap"><div class="signature-summary-card v11-focusable"><span class="signature-orb">${icon('send')}</span><div><strong>${signatureEnvelopes.filter(e=>e.status!=='Completed').length}</strong><small>Active envelopes</small></div></div><div class="signature-summary-card v11-focusable"><span class="signature-orb success">${icon('check')}</span><div><strong>${signatureEnvelopes.filter(e=>e.status==='Completed').length}</strong><small>Completed this month</small></div></div><div class="signature-summary-card v11-focusable"><span class="signature-orb warning">${icon('clock')}</span><div><strong>2</strong><small>Awaiting recipients</small></div></div><div class="signature-summary-card v11-focusable"><span class="signature-orb danger">${icon('alert')}</span><div><strong>1</strong><small>Action required</small></div></div></section><nav class="tabs v11-signature-tabs" aria-label="Electronic signature views">${['Overview','Envelopes','Templates','Signers','Audit Trail'].map(tab=>`<button class="tab ${state.signatureView===tab?'active':''}" data-action="signature-view-tab" data-tab="${tab}">${escapeHTML(tab)}</button>`).join('')}</nav><section class="section-gap">${v11RenderSignatureContent()}</section>`;
  };

  function v11SignatureInspector(envelope) {
    if (state.signatureInspectorTab==='Message') return `<div class="signature-inspector-body"><h3>Delivery message</h3><div class="form-field"><label>Email subject</label><input id="v11SignatureSubject" value="Please sign: ${escapeHTML(envelope.subject)}"></div><div class="form-field section-gap"><label>Private message</label><textarea id="v11SignatureMessage">Please review and electronically sign the attached investment document. Contact the legal team if any information is incorrect.</textarea></div><div class="form-grid section-gap"><div class="form-field"><label>Reminder cadence</label><select><option>Every 2 days</option><option>Daily</option><option>Every 3 days</option></select></div><div class="form-field"><label>Expiry</label><input type="date" value="2026-08-15"></div></div><div class="v11-setting-list section-gap">${v11SettingToggle('Respect signing order','Notify each recipient only after the previous signer completes.',true)}${v11SettingToggle('Send completion copy','Send the final signed document and certificate to every party.',true)}</div></div>`;
    if (state.signatureInspectorTab==='Review') return `<div class="signature-inspector-body"><h3>Readiness review</h3><div class="reason-list"><div class="reason-item">${icon('check-circle')}<div><strong>Controlled document version</strong><small>Document hash and version are locked for this envelope.</small></div></div><div class="reason-item">${icon('check-circle')}<div><strong>${envelope.recipients.length} recipients verified</strong><small>Email, role and signing order are complete.</small></div></div><div class="reason-item ${state.signatureFields.length<3?'warning':''}">${icon(state.signatureFields.length<3?'alert':'check-circle')}<div><strong>${state.signatureFields.length} fields placed</strong><small>${state.signatureFields.length<3?'Add all required signature and date fields.':'Every required recipient has an assigned field.'}</small></div></div></div><h3 class="section-gap">Security</h3><div class="info-list"><div class="info-row"><span>Authentication</span><strong>Email + OTP</strong></div><div class="info-row"><span>Signing order</span><strong>Enabled</strong></div><div class="info-row"><span>Audit evidence</span><strong>Timestamp, consent, IP and document hash</strong></div><div class="info-row"><span>Certificate</span><strong>Issued after all signatures</strong></div></div></div>`;
    const field=state.signatureFields.find(item=>item.id===state.selectedSignatureField) || state.signatureFields[0];
    return `<div class="signature-inspector-body"><h3>Selected field</h3>${field?`<div class="v11-selected-field"><span>${icon(field.type==='Signature'?'edit':field.type==='Initials'?'user-check':field.type==='Date signed'?'calendar':'file')}</span><div><strong>${escapeHTML(field.type)}</strong><small>${escapeHTML(field.id)} · Page ${field.page}</small></div>${statusPill(field.status,'info')}</div><div class="form-grid section-gap"><div class="form-field full"><label>Assigned recipient</label><select data-change-action="signature-field-recipient" data-field="${field.id}">${envelope.recipients.map((recipient,index)=>`<option value="${index}" ${field.recipient===index?'selected':''}>${escapeHTML(recipient[0])}</option>`).join('')}</select></div><div class="form-field"><label>Required</label><select><option>Required</option><option>Optional</option></select></div><div class="form-field"><label>Page</label><input type="number" value="${field.page}" min="1"></div></div>${button('Remove field','remove-signature-field','danger compact','x',`data-id="${field.id}"`)}`:'<div class="empty-state"><strong>No field selected</strong><p>Add a signature, initials, date or text field.</p></div>'}<h3 class="section-gap">Envelope settings</h3><div class="info-list"><div class="info-row"><span>Signing order</span><strong>Enabled</strong></div><div class="info-row"><span>Authentication</span><strong>Email + OTP</strong></div><div class="info-row"><span>Expiry</span><strong>${escapeHTML(envelope.expires)}</strong></div><div class="info-row"><span>Reminders</span><strong>Every 2 days</strong></div></div></div>`;
  }

  const v11BaseShowSignatureStudio=showSignatureStudio;
  showSignatureStudio=function(documentId='DOC-009',envelopeId=null) {
    const doc=documents.find(item=>item.id===documentId)||documents.find(item=>/Term Sheet/.test(item.name))||documents[0];
    const envelope=signatureEnvelopes.find(item=>item.id===envelopeId)||signatureEnvelopes.find(item=>item.documentId===doc.id)||signatureEnvelopes[0];
    state.selectedEnvelopeId=envelope.id;
    state.signatureSelectedRecipient=Math.min(state.signatureSelectedRecipient,envelope.recipients.length-1);
    const recipients=envelope.recipients.map((recipient,index)=>`<button class="signature-recipient ${recipient[2]==='Signed'?'signed':recipient[2]==='Declined'?'declined':''} ${state.signatureSelectedRecipient===index?'selected':''}" data-action="select-signature-recipient" data-index="${index}">${personAvatar(recipient[0])}<span><strong>${escapeHTML(recipient[0])}</strong><small>${escapeHTML(recipient[1])}</small></span>${statusPill(recipient[2],recipient[2]==='Signed'?'success':recipient[2]==='Declined'?'danger':'warning')}</button>`).join('');
    const fields=state.signatureFields.map(field=>{const recipient=envelope.recipients[field.recipient]||envelope.recipients[0];return `<button class="v11-document-field ${state.selectedSignatureField===field.id?'selected':''}" data-action="select-signature-field" data-id="${field.id}"><span>${icon(field.type==='Signature'?'edit':field.type==='Initials'?'user-check':field.type==='Date signed'?'calendar':'file')}</span><strong>${escapeHTML(field.type)}</strong><small>${escapeHTML(recipient?.[0]||'Unassigned')} · ${escapeHTML(field.status)}</small></button>`}).join('');
    showModal('Signature Studio',`${doc.name} · ${envelope.id}`,`<div class="signature-studio v11-signature-studio"><aside class="signature-toolbox"><div class="v11-signature-tool-scroll"><div><strong>Fields</strong><button class="signature-tool" data-action="add-signature-field" data-type="Signature">${icon('edit')} Signature</button><button class="signature-tool" data-action="add-signature-field" data-type="Initials">${icon('user-check')} Initials</button><button class="signature-tool" data-action="add-signature-field" data-type="Date signed">${icon('calendar')} Date signed</button><button class="signature-tool" data-action="add-signature-field" data-type="Text field">${icon('file')} Text field</button></div><div><div class="section-heading-with-action"><strong>Recipients</strong>${button('Add','add-signature-recipient','ghost compact','plus')}</div>${recipients}</div></div></aside><main class="signature-document"><div class="signature-document-toolbar"><span>Page 1 of ${doc.pages||8}</span><span>${icon('lock')} Encrypted · audit logged</span><button data-action="signature-zoom">100%</button></div><article class="signature-page"><div class="document-letterhead"><div class="pdf-brand">MATANHO</div><small>Investment Management ERP</small></div><p class="document-classification">TERM SHEET · SERIES B INVESTMENT · ${escapeHTML(doc.version)}</p><h1>Nova Analytics (Pvt) Ltd</h1><p class="document-lead">Non-binding summary of principal investment terms</p><div class="term-summary"><div><span>Investment</span><strong>USD 18,000,000</strong></div><div><span>Pre-money valuation</span><strong>USD 85,000,000</strong></div><div><span>Proposed ownership</span><strong>17.5%</strong></div></div><h2>Governance and investor protections</h2><p>The investor shall have the right to appoint one director and one non-voting observer, subject to the definitive agreements and agreed reserved matters.</p><h2>Electronic signature fields</h2><div class="v11-document-fields">${fields}</div><h2>Signing parties</h2>${envelope.recipients.map((recipient,index)=>recipient[2]==='Signed'?`<div class="signature-field signed"><span>${escapeHTML(recipient[0])}</span><small>${escapeHTML(recipient[1])} · Signed with OTP authentication</small></div>`:`<button class="signature-field pending" data-action="sign-term-sheet" data-signer="${index}"><span>Click to sign for ${escapeHTML(recipient[0])}</span><small>${escapeHTML(recipient[1])}</small></button>`).join('')}</article></main><aside class="signature-inspector"><div class="signature-inspector-tabs">${['Prepare','Message','Review'].map(tab=>`<button class="${state.signatureInspectorTab===tab?'active':''}" data-action="signature-inspector-tab" data-tab="${tab}">${tab}</button>`).join('')}</div>${v11SignatureInspector(envelope)}</aside></div>`,`${button('Save draft','save-signature-draft')}${button('Download certificate','download-signature-certificate','','download')}${button(envelope.status==='Completed'?'View completion':'Send envelope','send-signature-envelope','primary','send')}`,{variant:'signature',size:'fullscreen',eyebrow:'Secure responsive e-signature'});
  };

  function v11UpdateUserChrome() {
    const role=v11CurrentRole();
    const member=v11RoleMember();
    $$('.top-avatar').forEach(node=>{node.innerHTML=`<img src="${profilePhoto(member.name)}" alt="${escapeHTML(member.name)}">`;node.title=`${member.name} · ${role.name}`;});
    $$('.user-switcher .avatar').forEach(node=>{node.innerHTML=`<img src="${profilePhoto(member.name)}" alt="${escapeHTML(member.name)}">`;node.classList.add('photo-avatar');});
    const copy=$('.user-switcher-copy'); if(copy) copy.innerHTML=`<strong>${escapeHTML(member.name)}</strong><small>${escapeHTML(role.name)}</small>`;
    const topRight=$('.topbar-right');
    if(topRight) {
      let rolePill=$('.v11-role-context-pill',topRight);
      if(!rolePill){rolePill=document.createElement('button');rolePill.className='v11-role-context-pill';rolePill.dataset.action='user-menu';const modulePill=$('.module-pill',topRight);modulePill?.after(rolePill);}
      rolePill.style.setProperty('--role-colour',role.colour);
      rolePill.innerHTML=`<span>${icon(role.icon)}</span><span><small>Viewing as</small><strong>${escapeHTML(role.short)}</strong></span>`;
    }
  }

  function v11IsMutationAction(action='') {
    if (['apply-filters','reset-filters','toggle-theme','toggle-sidebar','toggle-mobile-nav','close-overlays','close-modal','settings-tab','select-rbac-role','signature-view-tab','signature-inspector-tab','select-signature-recipient','select-signature-field','switch-demo-role'].includes(action)) return false;
    if (/^(navigate|open-search|user-menu|notifications|module-switcher|tenant-switch|activity-menu|activity-open|preview|view|open-(?!report-builder)|chart-|metric-|v11-row-inspector|v11-role-member-detail|download|export|document-download|report-download|signature-filters|.*-filter$|fund-reporting-tab|report-inspector-tab|select-report-section|performance-period|reset-)/.test(action)) return false;
    return /^(create|new|add|edit|save|submit|approve|reject|confirm|remove|delete|publish|send|schedule|upload|reverse|release|consume|sign|apply|assign|reopen|restate|void|manage|configure|update|duplicate|move|insert|request|commit|retry|lock|unlock|toggle-role-permission|use-signature-template)/.test(action) || /decision|vote|disbursement|journal|reservation/.test(action);
  }

  function v11ActionResource(action='') {
    if (/role|settings|integration|security|retention|service-account|webhook|runtime-config/.test(action)) return 'settings';
    if (/signature|envelope|term-sign/.test(action)) return 'e-signatures';
    if (/mailer|campaign/.test(action)) return 'mailer-lists';
    if (/report|letterhead|commentary/.test(action)) return state.page==='fund-performance'?'fund-performance':'reports-vault';
    if (/recon|match|exception/.test(action)) return 'reconciliations';
    if (/period|close|gl-/.test(action)) return 'period-close';
    if (/statement|bank-statement|import/.test(action)) return 'statement-imports';
    if (/cash-account/.test(action)) return 'cash-accounts';
    if (/cash|ledger|journal/.test(action)) return 'cash-ledger';
    if (/reservation/.test(action)) return 'cash-reservations';
    if (/document|vault|folder/.test(action)) return 'documents-vault';
    if (/capital-call/.test(action)) return 'capital-calls';
    if (/company/.test(action)) return 'companies';
    if (/\blp\b|lp-/.test(action)) return 'lps';
    if (/deal|term|diligence|dd-|ic-|vote|decision/.test(action)) return 'deals';
    if (/fund/.test(action)) return 'funds';
    return v11PageResource(state.page);
  }

  function v11RoleAllowsMutation(action,resource) {
    if (!v11CanWrite(resource)) return false;
    const role=state.currentRole;
    if (v11IsFullAuthority(role)) return true;
    if (role==='legal' && resource==='deals') return /(term|document|signature|comment|activity|upload|request|version|legal)/.test(action);
    if (role==='analyst' && /(approve|release|close|reopen|restate|send-signature|confirm-term-signature|ic-vote|confirm-decision)/.test(action)) return false;
    if (role==='monitoring' && !['companies','reporting','reports-vault','documents-vault'].includes(resource)) return false;
    if (role==='accounting' && ['deals','companies','e-signatures'].includes(resource)) return false;
    return true;
  }

  function v11AccessDenied(action,resource) {
    const role=v11CurrentRole();
    showModal('Read-only access',`${role.name} cannot perform this action.`,`<div class="v11-access-denied"><span>${icon('lock')}</span><div><small>RBAC CONTROL</small><h3>${escapeHTML(v11PageLabels[resource]||resource)}</h3><p>Your role has read access but not the write or approval permission required for <strong>${escapeHTML(action.replaceAll('-',' '))}</strong>.</p></div></div><div class="info-list section-gap"><div class="info-row"><span>Current role</span><strong>${escapeHTML(role.name)}</strong></div><div class="info-row"><span>Data scope</span><strong>${escapeHTML(role.scope)}</strong></div><div class="info-row"><span>Required access</span><strong>Write / controlled decision</strong></div><div class="info-row"><span>Audit treatment</span><strong>Denied attempt recorded</strong></div></div>`,`${button('Close','close-modal','primary')}${button('View role access','open-current-role-access','','shield')}`,{variant:'approval',size:'md',eyebrow:'Role-based access control'});
  }

  function v11PostRender() {
    v11UpdateUserChrome();
    const resource=v11PageResource(state.page);
    if(v11CanRead(resource) && !v11CanWrite(resource)) {
      const page=$('.page',workspace);
      if(page && !$('.v11-readonly-banner',page)) page.insertAdjacentHTML('afterbegin',`<div class="v11-readonly-banner">${icon('eye')}<span><strong>Read-only workspace</strong><small>${escapeHTML(v11CurrentRole().name)} can view and export this area but cannot change controlled records.</small></span>${button('View permissions','open-current-role-access','ghost compact','shield')}</div>`);
    }
    $$('[data-action]',workspace).forEach(node=>{
      const action=node.dataset.action;
      if(v11IsMutationAction(action)) {
        const target=v11ActionResource(action);
        const allowed=v11RoleAllowsMutation(action,target);
        node.classList.toggle('rbac-disabled',!allowed);
        if(!allowed) node.setAttribute('aria-disabled','true'); else node.removeAttribute('aria-disabled');
      }
    });
    $$('.card:not(.table-card),.signature-summary-card,.reason-item,.info-row',workspace).forEach(node=>{
      if(!node.matches('[data-action]') && !node.closest('[contenteditable="true"]')) node.classList.add('v11-focusable');
    });
    $$('tbody tr',workspace).forEach(row=>{
      if(!row.dataset.action && !row.classList.contains('v11-permission-group')) {
        row.dataset.action='v11-row-inspector';
        row.dataset.rowLabel=(row.cells?.[0]?.innerText||'Record').trim().slice(0,90);
        row.classList.add('v11-inspectable-row');
      }
    });
  }

  const v11BaseRender=render;
  render=function() {
    if(!v11CanRead(state.page)) state.page=v11FirstReadablePage();
    v11BaseRender();
    v11PostRender();
  };

  const v11BaseShowUserMenu=showUserMenu;
  showUserMenu=function(anchor) {
    const role=v11CurrentRole();
    const member=v11RoleMember();
    showPopover(anchor,`<div class="popover-title">Signed in as</div><div class="popover-item v11-current-user" style="cursor:default">${personAvatar(member.name,"avatar-gradient")}<span class="popover-item-copy"><strong>${escapeHTML(member.name)}</strong><small>${escapeHTML(member.title)} · Matanho Capital</small></span>${statusPill(role.short,'info')}</div><div class="popover-divider"></div><div class="popover-title">Preview role access</div><div class="v11-role-switch-list">${Object.values(v11RoleDefinitions).map(item=>`<button class="popover-item ${item.id===state.currentRole?'active':''}" data-action="switch-demo-role" data-role="${item.id}"><span class="activity-icon" style="color:${item.colour};background:color-mix(in srgb,${item.colour} 12%,transparent)">${icon(item.icon)}</span><span class="popover-item-copy"><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.scope)}</small></span>${item.id===state.currentRole?icon('check-circle'):icon('chevron-right')}</button>`).join('')}</div><div class="popover-divider"></div>${v11CanRead('settings')?`<button class="popover-item" data-action="navigate" data-page="settings">${icon('settings')}<span class="popover-item-copy"><strong>Workspace settings</strong><small>RBAC, security, integrations and data controls</small></span></button>`:''}<button class="popover-item" data-action="toggle-theme">${icon(state.theme==='light'?'moon':'sun')}<span class="popover-item-copy"><strong>${state.theme==='light'?'Use dark theme':'Use light theme'}</strong><small>Change appearance on this browser</small></span></button><div class="popover-divider"></div><button class="popover-item" data-action="sign-out-demo">${icon('external-link')}<span class="popover-item-copy"><strong>Sign out</strong><small>Demo action only</small></span></button>`,390);
  };

  function v11ShowRoleAccess(roleId=state.currentRole) {
    const role=v11RoleDefinitions[roleId]||v11CurrentRole();
    const readable=v11PermissionPages.filter(page=>role.permissions[page]?.read);
    const writable=v11PermissionPages.filter(page=>role.permissions[page]?.write);
    showModal(`${role.name} Access`,`${readable.length} readable workspaces · ${writable.length} writable workspaces`,`<div class="v11-role-access-preview"><header style="--role-colour:${role.colour}"><span>${icon(role.icon)}</span><div><small>ROLE ACCESS PREVIEW</small><h2>${escapeHTML(role.name)}</h2><p>${escapeHTML(role.description)}</p></div></header><section><h3>Read and write</h3><div class="v11-access-chip-grid">${writable.map(page=>`<span>${icon('edit')}<strong>${escapeHTML(v11PageLabels[page])}</strong><small>Read + write</small></span>`).join('')}</div></section><section><h3>Read only</h3><div class="v11-access-chip-grid">${readable.filter(page=>!role.permissions[page].write).map(page=>`<span>${icon('eye')}<strong>${escapeHTML(v11PageLabels[page])}</strong><small>Read only</small></span>`).join('')||'<p class="muted">No read-only workspaces.</p>'}</div></section><section class="info-list"><div class="info-row"><span>Scope</span><strong>${escapeHTML(role.scope)}</strong></div><div class="info-row"><span>Approval authority</span><strong>${escapeHTML(role.approvalLimit)}</strong></div><div class="info-row"><span>Members</span><strong>${v11RoleMemberCount(role.id)}</strong></div></section></div>`,`${button('Close','close-modal','primary')}`,{variant:'inspector',size:'lg',eyebrow:'Effective permissions'});
  }

  function v11ShowNewEnvelope() {
    showModal('Create Signature Envelope','Select a controlled document, recipients, authentication and signing order.',`<form id="v11EnvelopeForm"><section class="modal-section"><div class="modal-section-heading"><h3>Document</h3><span class="table-badge">Controlled version required</span></div><div class="form-grid"><div class="form-field full"><label class="required">Document</label><select name="documentId" required>${documents.filter(doc=>/Term Sheet|Agreement|Resolution|NDA/.test(doc.name)).map(doc=>`<option value="${doc.id}">${escapeHTML(doc.name)} · ${escapeHTML(doc.version)}</option>`).join('')}</select></div><div class="form-field full"><label class="required">Envelope subject</label><input name="subject" required value="Please sign: Nova Analytics Series B Term Sheet"></div></div></section><section class="modal-section"><div class="modal-section-heading"><h3>Recipients</h3>${button('Add recipient row','v11-add-recipient-row','compact','plus')}</div><div id="v11RecipientRows"><div class="form-grid"><div class="form-field"><label>Name</label><input name="recipientName" value="Tariro Kasere" required></div><div class="form-field"><label>Email</label><input type="email" name="recipientEmail" value="tariro.kasere@matanho.com" required></div><div class="form-field"><label>Role</label><input name="recipientRole" value="Chief Investment Officer"></div><div class="form-field"><label>Order</label><input type="number" value="1" min="1"></div></div></div></section><section class="modal-section"><div class="form-grid"><div class="form-field"><label>Authentication</label><select name="authentication"><option>Email + OTP</option><option>Passkey</option><option>Email link</option></select></div><div class="form-field"><label>Expires</label><input type="date" name="expires" value="2026-08-15"></div></div><div class="v11-setting-list section-gap">${v11SettingToggle('Enable signing order','Recipients are notified in the configured order.',true)}${v11SettingToggle('Automatic reminders','Send a reminder every two days.',true)}</div></section></form>`,`${button('Cancel','close-modal')}${button('Create draft envelope','submit-new-envelope','primary','edit')}`,{variant:'wizard',size:'lg',rail:['Document','Recipients','Security','Review'],eyebrow:'Electronic signature workflow'});
  }

  function v11ShowAddRoleMember(roleId) {
    const role=v11RoleDefinitions[roleId]||v11CurrentRole();
    showModal('Add Person to Role',role.name,`<form id="v11RoleMemberForm"><input type="hidden" name="role" value="${role.id}"><div class="form-grid"><div class="form-field"><label class="required">Full name</label><input name="name" required placeholder="Full name"></div><div class="form-field"><label class="required">Work email</label><input name="email" type="email" required placeholder="name@matanho.com"></div><div class="form-field"><label class="required">Job title</label><input name="title" required value="${escapeHTML(role.name)}"></div><div class="form-field"><label>Access scope</label><select name="scope"><option>${escapeHTML(role.scope)}</option><option>Selected funds only</option><option>Selected portfolio companies only</option></select></div></div><div class="reason-item section-gap">${icon('shield')}<div><strong>Effective access</strong><small>The person receives the role's current read/write permissions and scoped data restrictions. MFA enrolment is required before activation.</small></div></div></form>`,`${button('Cancel','close-modal')}${button('Send invitation','submit-role-member','primary','send')}`,{variant:'wizard',size:'md',rail:['Identity','Role','Scope','Invite'],eyebrow:'RBAC user assignment'});
  }

  function v11GenericRowInspector(trigger) {
    const row=trigger.closest('tr')||trigger;
    const headers=Array.from(row.closest('table')?.querySelectorAll('thead th')||[]).map(th=>th.innerText.trim());
    const values=Array.from(row.cells||[]).map(cell=>cell.innerText.trim());
    const title=trigger.dataset.rowLabel||values[0]||'Record detail';
    showDrawer(title,'Contextual record metadata and source values',`<section class="drawer-section"><h3>Row detail</h3><div class="info-list">${values.map((value,index)=>`<div class="info-row"><span>${escapeHTML(headers[index]||`Field ${index+1}`)}</span><strong>${escapeHTML(value||'—')}</strong></div>`).join('')}</div></section><section class="drawer-section"><h3>Source and activity</h3><div class="reason-item">${icon('database')}<div><strong>Frontend demonstration data</strong><small>Connect the row identifier to the backend detail endpoint to return version, source lineage, permissions and audit activity.</small></div></div></section>`,`${button('Export row','export-row','','download')}${button('Close','close-drawer','primary')}`,{variant:'record',icon:'list',eyebrow:'Record inspector'});
  }

  const v11BaseHandleAction=handleAction;
  handleAction=function(action,trigger,event) {
    if (action==='navigate') {
      const target=trigger.dataset.page;
      if(target && !v11CanRead(target)) { v11AccessDenied(action,target); return; }
    }
    if (v11IsMutationAction(action) && !['switch-demo-role','toggle-role-permission','submit-role-member','confirm-remove-role-member'].includes(action)) {
      const resource=v11ActionResource(action);
      if(!v11RoleAllowsMutation(action,resource)) { v11AccessDenied(action,resource); return; }
    }
    switch(action) {
      case 'switch-demo-role': {
        const next=trigger.dataset.role;
        if(v11RoleDefinitions[next]) { state.currentRole=next;storage.set('matanho-portfolio-role',next);if(!v11CanRead(state.page,next))state.page=v11FirstReadablePage(next);closeOverlays();toast('Role context changed',`Viewing the workspace as ${v11RoleDefinitions[next].name}.`);render(); }
        return;
      }
      case 'settings-tab': state.settingsTab=trigger.dataset.tab||'workspace';render();return;
      case 'select-rbac-role': state.rbacSelectedRole=trigger.dataset.role||state.currentRole;render();return;
      case 'toggle-role-permission': {
        if(!v11IsFullAuthority()) { v11AccessDenied(action,'settings');return; }
        const role=v11RoleDefinitions[trigger.dataset.role],page=trigger.dataset.page,access=trigger.dataset.access;
        if(!role?.permissions?.[page]) return;
        const next=!role.permissions[page][access];
        role.permissions[page][access]=next;
        if(access==='write'&&next) role.permissions[page].read=true;
        if(access==='read'&&!next) role.permissions[page].write=false;
        toast('Permission updated',`${role.name}: ${v11PageLabels[page]} ${access} ${next?'enabled':'disabled'}.`);render();return;
      }
      case 'preview-role-access': v11ShowRoleAccess(trigger.dataset.role);return;
      case 'open-current-role-access': v11ShowRoleAccess(state.currentRole);return;
      case 'add-role-member': v11ShowAddRoleMember(trigger.dataset.role||state.rbacSelectedRole);return;
      case 'submit-role-member': {
        const form=$('#v11RoleMemberForm');if(!form?.reportValidity())return;const data=Object.fromEntries(new FormData(form));const initialsValue=data.name.split(/\s+/).map(part=>part[0]).join('').slice(0,2).toUpperCase();v11RoleMembers.push({id:`USR-${String(v11RoleMembers.length+1).padStart(3,'0')}`,name:data.name,initials:initialsValue,role:data.role,title:data.title,email:data.email,status:'Invited',scope:data.scope,lastActive:'Invitation pending'});closeOverlays();toast('Invitation sent',`${data.name} was assigned to ${v11RoleDefinitions[data.role].name}.`);render();return;
      }
      case 'remove-role-member': {
        const member=v11RoleMembers.find(item=>item.id===trigger.dataset.id);if(!member)return;showModal('Remove Role Assignment',`${member.name} · ${v11RoleDefinitions[member.role]?.name||member.role}`,`<div class="v11-access-denied"><span>${icon('user-minus')}</span><div><small>ACCESS CHANGE</small><h3>Remove ${escapeHTML(member.name)}?</h3><p>The user's role permissions will be revoked after confirmation. Existing audit records remain immutable.</p></div></div><div class="form-field section-gap"><label class="required">Reason</label><textarea id="v11RemoveRoleReason" placeholder="State the reason for removing access"></textarea></div>`,`${button('Cancel','close-modal')}${button('Remove access','confirm-remove-role-member','danger','x',`data-id="${member.id}"`)}`,{variant:'approval',size:'md',eyebrow:'Controlled access removal'});return;
      }
      case 'confirm-remove-role-member': { const reason=$('#v11RemoveRoleReason')?.value.trim();if(!reason){toast('Reason required','Provide a reason before removing access.','warning');return;}const index=v11RoleMembers.findIndex(item=>item.id===trigger.dataset.id);const member=v11RoleMembers[index];if(index>=0)v11RoleMembers.splice(index,1);closeOverlays();toast('Access removed',`${member.name} was removed from the role.`);render();return; }
      case 'v11-role-member-detail': { const member=v11RoleMembers.find(item=>item.id===trigger.dataset.id);if(member)showDrawer(member.name,`${member.title} · ${v11RoleDefinitions[member.role]?.name}`,`<section class="drawer-section"><div class="info-list"><div class="info-row"><span>Email</span><strong>${escapeHTML(member.email)}</strong></div><div class="info-row"><span>Role</span><strong>${escapeHTML(v11RoleDefinitions[member.role]?.name||member.role)}</strong></div><div class="info-row"><span>Scope</span><strong>${escapeHTML(member.scope)}</strong></div><div class="info-row"><span>Status</span><strong>${statusPill(member.status)}</strong></div><div class="info-row"><span>Last active</span><strong>${escapeHTML(member.lastActive)}</strong></div></div></section>`,`${button('Preview access','preview-role-access','','eye',`data-role="${member.role}"`)}${button('Close','close-drawer','primary')}`,{variant:'record',icon:'users',eyebrow:'User access'});return; }
      case 'manage-roles': state.settingsTab='roles';closeOverlays();navigate('settings');return;
      case 'signature-view-tab': state.signatureView=trigger.dataset.tab||'Envelopes';render();return;
      case 'signature-inspector-tab': state.signatureInspectorTab=trigger.dataset.tab||'Prepare';showSignatureStudio(documents.find(d=>d.id==='DOC-009')?.id||'DOC-009',state.selectedEnvelopeId);return;
      case 'select-signature-recipient': state.signatureSelectedRecipient=Number(trigger.dataset.index||0);showSignatureStudio('DOC-009',state.selectedEnvelopeId);return;
      case 'select-signature-field': state.selectedSignatureField=trigger.dataset.id;showSignatureStudio('DOC-009',state.selectedEnvelopeId);return;
      case 'add-signature-field': { const type=trigger.dataset.type||'Signature';const id=`SIG-FLD-${String(state.signatureFields.length+1).padStart(3,'0')}`;state.signatureFields.push({id,type,recipient:state.signatureSelectedRecipient,page:1,status:'Required'});state.selectedSignatureField=id;toast('Field added',`${type} assigned to the selected recipient.`);showSignatureStudio('DOC-009',state.selectedEnvelopeId);return; }
      case 'remove-signature-field': { state.signatureFields=state.signatureFields.filter(field=>field.id!==trigger.dataset.id);state.selectedSignatureField=state.signatureFields[0]?.id||'';toast('Field removed','The field was removed from the working envelope.');showSignatureStudio('DOC-009',state.selectedEnvelopeId);return; }
      case 'add-signature-recipient': { showModal('Add Signature Recipient','Add a person, role, authentication method and signing order.',`<form id="v11SignatureRecipientForm"><div class="form-grid"><div class="form-field"><label class="required">Full name</label><input name="name" required></div><div class="form-field"><label class="required">Email</label><input name="email" type="email" required></div><div class="form-field"><label class="required">Signing role</label><input name="role" required></div><div class="form-field"><label>Authentication</label><select name="auth"><option>Email + OTP</option><option>Passkey</option></select></div></div></form>`,`${button('Cancel','open-envelope','','arrow-left',`data-id="${state.selectedEnvelopeId}"`)}${button('Add recipient','submit-signature-recipient','primary','plus')}`,{variant:'wizard',size:'md',rail:['Identity','Role','Security','Order'],eyebrow:'Envelope recipient'});return; }
      case 'submit-signature-recipient': { const form=$('#v11SignatureRecipientForm');if(!form?.reportValidity())return;const data=Object.fromEntries(new FormData(form));const env=signatureEnvelopes.find(item=>item.id===state.selectedEnvelopeId)||signatureEnvelopes[0];env.recipients.push([data.name,data.role,'Pending']);closeOverlays();toast('Recipient added',`${data.name} was added to ${env.id}.`);showSignatureStudio(env.documentId,env.id);return; }
      case 'new-signature-envelope': v11ShowNewEnvelope();return;
      case 'submit-new-envelope': { const form=$('#v11EnvelopeForm');if(!form?.reportValidity())return;const data=Object.fromEntries(new FormData(form));const doc=documents.find(item=>item.id===data.documentId)||documents[0];const env={id:`ENV-${String(100+signatureEnvelopes.length)}`,documentId:doc.id,document:doc.name,subject:data.subject,recipients:[[data.recipientName,data.recipientRole,'Pending']],progress:0,status:'Draft',sent:'Not sent',expires:data.expires||'15 Aug 2026'};signatureEnvelopes.unshift(env);state.selectedEnvelopeId=env.id;closeOverlays();toast('Envelope created',`${env.id} is ready for field placement.`);showSignatureStudio(env.documentId,env.id);return; }
      case 'send-signature-envelope': { const env=signatureEnvelopes.find(item=>item.id===state.selectedEnvelopeId)||signatureEnvelopes[0];env.status='Sent';env.sent='01 Aug 2026';closeOverlays();toast('Envelope sent',`${env.id} was securely routed to ${env.recipients.length} recipient${env.recipients.length===1?'':'s'}.`);render();return; }
      case 'save-signature-draft': toast('Signature draft saved',`${state.signatureFields.length} fields and the current recipient order were saved.`);return;
      case 'send-signature-reminder': case 'send-signature-reminders': toast('Reminder sent','Pending recipients were notified using the configured delivery policy.');return;
      case 'preview-signature-template': showRecordMetadata('signature-template',trigger.dataset.template);return;
      case 'use-signature-template': v11ShowNewEnvelope();return;
      case 'v11-row-inspector': v11GenericRowInspector(trigger);return;
      case 'configure-integration': showDrawer(`${trigger.dataset.integration||'Integration'} Configuration`,'Connection, authentication, scope and sync behaviour',`<section class="drawer-section"><div class="form-grid"><div class="form-field full"><label>Environment</label><select><option>Production</option><option>Sandbox</option></select></div><div class="form-field full"><label>Endpoint</label><input value="https://api.example.com/v1"></div><div class="form-field full"><label>Authentication</label><select><option>OAuth 2.0</option><option>API key</option><option>Mutual TLS</option></select></div></div></section><section class="drawer-section"><h3>Data scopes</h3><div class="v11-setting-list">${v11SettingToggle('Read approved records','Allow authorised pull operations.',true)}${v11SettingToggle('Write controlled records','Require idempotency and maker-checker policy.',true)}${v11SettingToggle('Receive status callbacks','Process signed and replay-safe webhooks.',true)}</div></section>`,`${button('Test connection','test-integration','','activity',`data-integration="${trigger.dataset.integration||''}"`)}${button('Save','save-integration','primary','save')}`,{variant:'settings',icon:'grid',eyebrow:'Integration settings'});return;
      case 'test-integration': toast('Connection healthy',`${trigger.dataset.integration||'Integration'} responded successfully in 184 ms.`);return;
      case 'save-integration': closeOverlays();toast('Integration saved','Connection and scope settings were updated.');return;
      default: return v11BaseHandleAction(action,trigger,event);
    }
  };

  document.addEventListener('change',event=>{
    const target=event.target;
    if(target.dataset.changeAction==='signature-field-recipient') {
      const field=state.signatureFields.find(item=>item.id===target.dataset.field);if(field){field.recipient=Number(target.value);toast('Field reassigned','The signature field was assigned to the selected recipient.');showSignatureStudio('DOC-009',state.selectedEnvelopeId);}
    }
    if(target.dataset.changeAction==='v11-setting-toggle') toast('Setting updated','The working configuration was updated. Save changes to persist it.');
  });

  document.addEventListener('click',event=>{
    const focusable=event.target.closest('.v11-focusable');
    if(focusable && !event.target.closest('button,a,input,select,textarea,[data-action]')) {
      focusable.classList.toggle('element-focused');
    }
  });


  // ---------------------------------------------------------------------------
  // V15: drawn signatures, premium template previews, subtle buttons and a
  // single page-level back/return convention.
  // ---------------------------------------------------------------------------
  state.v15SignatureCaptureMode = state.v15SignatureCaptureMode || 'draw';
  state.v15SignatureInk = state.v15SignatureInk || '';
  state.v15HasDrawnSignature = Boolean(state.v15HasDrawnSignature);
  state.v15UploadedSignature = state.v15UploadedSignature || '';
  state.v15SignatureEvidence = state.v15SignatureEvidence || {};

  const v15BackRoutes = {
    'analytics-detail': ['dashboard','Dashboard'],
    'deal-detail': ['deals','Deal Flow'],
    'applicant-portal': ['deals','Deal Flow'],
    'company-detail': ['companies','Portfolio Companies'],
    'fund-detail': ['funds','Funds'],
    'lp-detail': ['lps','Limited Partners'],
    'capital-call-detail': ['capital-calls','Capital Calls'],
    'report-builder': ['reports-vault','Reports Vault'],
    'reconciliation-workspace': ['reconciliations','Reconciliation']
  };

  const v15BasePageHeader = pageHeader;
  pageHeader = function(title, subtitle, actions = '', context = '') {
    const route = v15BackRoutes[state.page];
    if (!route) return v15BasePageHeader(title, subtitle, actions, context);
    const cleaned = String(actions || '')
      .replace(/<button[^>]*data-action="(?:analytics-back|navigate-reconciliations|back-to-deals)"[\s\S]*?<\/button>/g,'');
    return `<header class="page-header v15-page-header"><div class="v15-page-heading"><div class="v15-page-heading-top"><button type="button" class="v15-back-button" data-action="v15-standard-back" data-target="${route[0]}">${icon('arrow-left')}<span>Back</span></button><span class="v15-back-context">Return to ${escapeHTML(route[1])}</span></div><div class="page-title-row"><h1 class="page-title">${escapeHTML(title)}</h1>${context ? `<span class="page-context">${escapeHTML(context)}</span>` : ''}</div><p class="page-subtitle">${escapeHTML(subtitle)}</p></div><div class="page-actions">${cleaned}</div></header>`;
  };

  function v15SignatureKey(envelopeId, signerIndex) { return `${envelopeId}:${signerIndex}`; }

  function v15RenderSignatureMark(envelopeId, signerIndex, name) {
    const evidence = state.v15SignatureEvidence[v15SignatureKey(envelopeId, signerIndex)];
    if (!evidence) return `<span class="typed">${escapeHTML(name)}</span>`;
    if ((evidence.mode === 'draw' || evidence.mode === 'upload') && evidence.dataUrl) return `<img src="${evidence.dataUrl}" alt="Captured signature for ${escapeHTML(name)}">`;
    return `<span class="typed">${escapeHTML(evidence.legalName || name)}</span>`;
  }

  function v15SetSignatureCaptureMode(mode) {
    state.v15SignatureCaptureMode = mode;
    $$('.v15-sign-tab', modalLayer).forEach(node => node.classList.toggle('active', node.dataset.mode === mode));
    $$('.v15-sign-panel', modalLayer).forEach(node => node.classList.toggle('active', node.dataset.mode === mode));
  }

  function v15InitSignaturePad() {
    const canvas = $('#v15SignatureCanvas');
    if (!canvas || canvas.dataset.ready === '1') return;
    canvas.dataset.ready = '1';
    canvas.style.touchAction = 'none';
    const wrapper = canvas.closest('.v15-signature-pad-wrap');
    let ctx = null;
    let drawing = false;
    let activePointer = null;
    let lastPoint = null;

    const configureContext = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 24 || rect.height < 24) return false;
      const previousInk = state.v15SignatureInk;
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx = canvas.getContext('2d');
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.25;
      ctx.strokeStyle = '#172033';
      if (previousInk) {
        const image = new Image();
        image.onload = () => {
          const bounds = canvas.getBoundingClientRect();
          ctx.drawImage(image,0,0,bounds.width,bounds.height);
        };
        image.src = previousInk;
      }
      return true;
    };

    const pointFromClient = (clientX, clientY) => {
      const bounds = canvas.getBoundingClientRect();
      return [Math.max(0,Math.min(bounds.width,clientX-bounds.left)),Math.max(0,Math.min(bounds.height,clientY-bounds.top))];
    };
    const saveInk = () => {
      if (!ctx || !state.v15HasDrawnSignature) return;
      try { state.v15SignatureInk = canvas.toDataURL('image/png'); } catch (_) {}
      const status = $('#v15SignatureDrawStatus');
      if (status) status.textContent = 'Signature captured — ready to apply';
      wrapper?.classList.add('has-ink');
    };
    const begin = (x,y,pointerId=null) => {
      if (!ctx && !configureContext()) return;
      drawing = true;
      activePointer = pointerId;
      lastPoint = [x,y];
      ctx.beginPath();
      ctx.moveTo(x,y);
      // Register a small first mark so a tap/dot is a valid signature gesture.
      ctx.lineTo(x+.01,y+.01);
      ctx.stroke();
      state.v15HasDrawnSignature = true;
      const status = $('#v15SignatureDrawStatus');
      if (status) status.textContent = 'Drawing signature…';
    };
    const move = (x,y) => {
      if (!drawing || !ctx) return;
      if (!lastPoint) lastPoint=[x,y];
      const midX=(lastPoint[0]+x)/2, midY=(lastPoint[1]+y)/2;
      ctx.quadraticCurveTo(lastPoint[0],lastPoint[1],midX,midY);
      ctx.stroke();
      lastPoint=[x,y];
      state.v15HasDrawnSignature = true;
    };
    const finish = () => {
      if (!drawing) return;
      drawing = false;
      activePointer = null;
      lastPoint = null;
      ctx?.closePath();
      saveInk();
    };

    // Pointer Events path (mouse, pen, and modern touch browsers).
    if (window.PointerEvent) {
      canvas.addEventListener('pointerdown', event => {
        const [x,y]=pointFromClient(event.clientX,event.clientY);
        try { canvas.setPointerCapture?.(event.pointerId); } catch (_) {}
        begin(x,y,event.pointerId);
        event.preventDefault();
      }, {passive:false});
      canvas.addEventListener('pointermove', event => {
        if (!drawing || (activePointer !== null && event.pointerId !== activePointer)) return;
        const [x,y]=pointFromClient(event.clientX,event.clientY);
        move(x,y);
        event.preventDefault();
      }, {passive:false});
      ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,event=>{ finish(); event.preventDefault?.(); }, {passive:false}));
    } else {
      // Fallback for older WebViews/Safari shells.
      canvas.addEventListener('mousedown', event => { const [x,y]=pointFromClient(event.clientX,event.clientY); begin(x,y); event.preventDefault(); });
      window.addEventListener('mousemove', event => { if(!drawing)return; const [x,y]=pointFromClient(event.clientX,event.clientY); move(x,y); event.preventDefault(); }, {passive:false});
      window.addEventListener('mouseup', finish);
      canvas.addEventListener('touchstart', event => { const touch=event.touches[0]; if(!touch)return; const [x,y]=pointFromClient(touch.clientX,touch.clientY); begin(x,y); event.preventDefault(); }, {passive:false});
      canvas.addEventListener('touchmove', event => { const touch=event.touches[0]; if(!drawing||!touch)return; const [x,y]=pointFromClient(touch.clientX,touch.clientY); move(x,y); event.preventDefault(); }, {passive:false});
      canvas.addEventListener('touchend', event => { finish(); event.preventDefault(); }, {passive:false});
      canvas.addEventListener('touchcancel', finish, {passive:false});
    }

    const observer = window.ResizeObserver ? new ResizeObserver(() => {
      if (drawing) return;
      const before = canvas.getBoundingClientRect();
      if (before.width > 24) configureContext();
    }) : null;
    if (observer && wrapper) observer.observe(wrapper);

    if (!configureContext()) {
      requestAnimationFrame(() => configureContext());
      setTimeout(configureContext,120);
    }
  }

  function v15ClearSignaturePad() {
    const canvas = $('#v15SignatureCanvas');
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
    state.v15SignatureInk = '';
    state.v15HasDrawnSignature = false;
    const status = $('#v15SignatureDrawStatus');
    if (status) status.textContent = 'Draw above using a mouse, stylus or finger';
  }

  function v15ShowSignatureCapture(documentId='DOC-009', envelopeId=null, signerIndex=null) {
    const doc = documents.find(item => item.id === documentId) || documents.find(item => /Term Sheet/.test(item.name)) || documents[0];
    const envelope = signatureEnvelopes.find(item => item.id === envelopeId) || signatureEnvelopes.find(item => item.documentId === doc.id) || signatureEnvelopes[0];
    const pending = envelope.recipients.findIndex(item => item[2] !== 'Signed');
    const index = Number.isFinite(Number(signerIndex)) ? Number(signerIndex) : Math.max(0,pending);
    const signer = envelope.recipients[index] || envelope.recipients[0];
    state.selectedDocumentId = doc.id;
    state.selectedEnvelopeId = envelope.id;
    state.v15SignatureCaptureMode = 'draw';
    state.v15SignatureInk = '';
    state.v15HasDrawnSignature = false;
    state.v15UploadedSignature = '';
    const body = `<div class="v15-sign-capture"><section class="v15-sign-summary"><div class="document-letterhead"><div class="pdf-brand">MATANHO</div><small>Investment Management ERP</small></div><p class="document-classification">CONTROLLED SIGNING COPY · ${escapeHTML(doc.version)}</p><h3>${escapeHTML(doc.name.replace(/\.(pdf|docx)$/i,''))}</h3><p>Review the controlled version before applying the signature. The completed evidence record includes signer identity, consent, authentication, timestamp and document hash.</p><div class="info-list"><div class="info-row"><span>Envelope</span><strong>${escapeHTML(envelope.id)}</strong></div><div class="info-row"><span>Signer</span><strong>${escapeHTML(signer[0])}</strong></div><div class="info-row"><span>Role</span><strong>${escapeHTML(signer[1])}</strong></div><div class="info-row"><span>Document version</span><strong>${escapeHTML(doc.version)}</strong></div></div><div class="v15-sign-evidence"><span><small>Authentication</small><strong>Email + OTP</strong></span><span><small>Signing order</small><strong>${index+1} of ${envelope.recipients.length}</strong></span><span><small>Evidence</small><strong>Audit certificate</strong></span></div></section><section class="v15-sign-card"><div class="v15-sign-tabs"><button type="button" class="v15-sign-tab active" data-action="v15-signature-mode" data-mode="draw">Draw</button><button type="button" class="v15-sign-tab" data-action="v15-signature-mode" data-mode="type">Type</button><button type="button" class="v15-sign-tab" data-action="v15-signature-mode" data-mode="upload">Upload</button></div><div class="v15-sign-panel active" data-mode="draw"><p>Draw your signature in the box. Works with a mouse, touch screen or stylus.</p><div class="v15-signature-pad-wrap"><canvas id="v15SignatureCanvas"></canvas><span class="v15-sign-pad-caption">SIGN ABOVE THIS LINE</span></div><div class="v15-sign-pad-actions"><small id="v15SignatureDrawStatus">Draw above using a mouse, stylus or finger</small>${button('Clear','v15-clear-signature','ghost compact','refresh')}</div></div><div class="v15-sign-panel" data-mode="type"><div class="form-field"><label class="required">Full legal name</label><input id="v15TypedSignatureName" value="${escapeHTML(signer[0])}" autocomplete="name"></div><div class="v15-typed-signature"><strong id="v15TypedSignaturePreview">${escapeHTML(signer[0])}</strong></div></div><div class="v15-sign-panel" data-mode="upload"><label class="v15-signature-upload" for="v15SignatureUpload">${icon('upload')}<span><strong>Upload signature image</strong><small>PNG or JPG with a transparent or white background</small></span><input id="v15SignatureUpload" type="file" accept="image/png,image/jpeg" hidden></label><img id="v15SignatureUploadPreview" class="v15-upload-preview" alt="Uploaded signature preview"></div><div class="v15-sign-compliance"><label class="checkbox-row"><input id="v15SignatureConsent" type="checkbox"> I have reviewed the controlled document and consent to apply this electronic signature.</label></div></section></div>`;
    showModal('Apply Electronic Signature',`${signer[0]} · ${signer[1]} · ${envelope.id}`,body,`${button('Cancel','close-modal')}${button('Apply signature','v15-apply-signature','primary','edit',`data-signer="${index}" data-document="${doc.id}"`)}`,{variant:'signature',size:'xl',eyebrow:'Draw, type or upload signature'});
    requestAnimationFrame(()=>requestAnimationFrame(v15InitSignaturePad));
    setTimeout(v15InitSignaturePad,140);
  }

  function v15ApplySignature(trigger) {
    const envelope = signatureEnvelopes.find(item => item.id === state.selectedEnvelopeId) || signatureEnvelopes[0];
    const index = Number(trigger.dataset.signer || 0);
    const signer = envelope.recipients[index];
    if (!signer) return;
    if (!$('#v15SignatureConsent')?.checked) { toast('Consent required','Confirm that the signer reviewed the controlled document.','warning'); return; }
    const mode = state.v15SignatureCaptureMode || 'draw';
    let dataUrl = '';
    let legalName = signer[0];
    if (mode === 'draw') {
      if (!state.v15HasDrawnSignature || !state.v15SignatureInk) { toast('Signature required','Draw a signature before applying it.','warning'); return; }
      dataUrl = state.v15SignatureInk;
    } else if (mode === 'type') {
      legalName = $('#v15TypedSignatureName')?.value.trim() || '';
      if (!legalName) { toast('Name required','Enter the signer legal name.','warning'); return; }
    } else {
      if (!state.v15UploadedSignature) { toast('Signature image required','Upload a PNG or JPG signature image.','warning'); return; }
      dataUrl = state.v15UploadedSignature;
    }
    state.v15SignatureEvidence[v15SignatureKey(envelope.id,index)] = { mode, dataUrl, legalName, signedAt:new Date().toISOString(), auth:'Email + OTP' };
    signer[2] = 'Signed';
    envelope.progress = Math.round(envelope.recipients.filter(item => item[2] === 'Signed').length / envelope.recipients.length * 100);
    envelope.status = envelope.progress === 100 ? 'Completed' : 'Waiting for others';
    const doc = documents.find(item => item.id === trigger.dataset.document) || documents.find(item => item.id === envelope.documentId);
    if (doc) doc.signatureStatus = envelope.status === 'Completed' ? 'Completed' : 'Partially signed';
    closeOverlays();
    toast('Signature applied',`${signer[0]} signed using the ${mode} method. The evidence record was updated.`);
    render();
  }

  const v15BaseShowSignatureStudio = showSignatureStudio;
  showSignatureStudio = function(documentId='DOC-009',envelopeId=null) {
    const doc=documents.find(d=>d.id===documentId)||documents.find(d=>/Term Sheet/.test(d.name))||documents[0];
    const envelope=signatureEnvelopes.find(e=>e.id===envelopeId)||signatureEnvelopes.find(e=>e.documentId===doc.id)||signatureEnvelopes[0];
    state.selectedDocumentId=doc.id; state.selectedEnvelopeId=envelope.id;
    state.signatureSelectedRecipient = Math.min(state.signatureSelectedRecipient || 0, Math.max(0,envelope.recipients.length-1));
    const recipients=envelope.recipients.map((r,i)=>`<button class="signature-recipient ${i===state.signatureSelectedRecipient?'selected':''} ${r[2]==='Signed'?'signed':r[2]==='Declined'?'declined':''}" data-action="select-signature-recipient" data-index="${i}">${personAvatar(r[0])}<span><strong>${escapeHTML(r[0])}</strong><small>${escapeHTML(r[1])}</small></span>${statusPill(r[2])}</button>`).join('');
    const fields=(state.signatureFields||[]).map(field=>`<button class="v11-document-field ${state.selectedSignatureField===field.id?'selected':''}" data-action="select-signature-field" data-id="${field.id}"><span>${icon(field.type==='Signature'?'edit':field.type==='Initials'?'user-check':field.type==='Date signed'?'calendar':'file')}</span><strong>${escapeHTML(field.type)}</strong><small>${escapeHTML(envelope.recipients[field.recipient]?.[0]||'Unassigned')} · Page ${field.page}</small></button>`).join('');
    const signingParties=envelope.recipients.map((recipient,index)=>recipient[2]==='Signed'?`<div class="signature-field signed"><div class="v15-signed-mark">${v15RenderSignatureMark(envelope.id,index,recipient[0])}<span><strong>${escapeHTML(recipient[0])}</strong><small>${escapeHTML(recipient[1])} · Signed · Email + OTP</small></span></div></div>`:`<button class="signature-field pending" data-action="sign-term-sheet" data-signer="${index}" data-id="${doc.id}"><span>Sign as ${escapeHTML(recipient[0])}</span><small>${escapeHTML(recipient[1])} · Draw, type or upload</small></button>`).join('');
    showModal('Signature Studio',`${doc.name} · ${envelope.id}`,`<div class="signature-studio v11-signature-studio"><aside class="signature-toolbox"><div class="v11-signature-tool-scroll"><div><strong>Fields</strong><button class="signature-tool" data-action="add-signature-field" data-type="Signature">${icon('edit')} Signature</button><button class="signature-tool" data-action="add-signature-field" data-type="Initials">${icon('user-check')} Initials</button><button class="signature-tool" data-action="add-signature-field" data-type="Date signed">${icon('calendar')} Date signed</button><button class="signature-tool" data-action="add-signature-field" data-type="Text field">${icon('file')} Text field</button></div><div><div class="section-heading-with-action"><strong>Recipients</strong>${button('Add','add-signature-recipient','ghost compact','plus')}</div>${recipients}</div></div></aside><main class="signature-document"><div class="signature-document-toolbar"><span>Page 1 of ${doc.pages||8}</span><span>${icon('lock')} Encrypted · audit logged</span><button data-action="signature-zoom">100%</button></div><article class="signature-page"><div class="document-letterhead"><div class="pdf-brand">MATANHO</div><small>Investment Management ERP</small></div><p class="document-classification">TERM SHEET · SERIES B INVESTMENT · ${escapeHTML(doc.version)}</p><h1>Nova Analytics (Pvt) Ltd</h1><p class="document-lead">Non-binding summary of principal investment terms</p><div class="term-summary"><div><span>Investment</span><strong>USD 18,000,000</strong></div><div><span>Pre-money valuation</span><strong>USD 85,000,000</strong></div><div><span>Proposed ownership</span><strong>17.5%</strong></div></div><h2>Governance and investor protections</h2><p>The investor shall have the right to appoint one director and one non-voting observer, subject to the definitive agreements and agreed reserved matters.</p><h2>Electronic signature fields</h2><div class="v11-document-fields">${fields}</div><h2>Signing parties</h2>${signingParties}</article></main><aside class="signature-inspector"><div class="signature-inspector-tabs">${['Prepare','Message','Review'].map(tab=>`<button class="${state.signatureInspectorTab===tab?'active':''}" data-action="signature-inspector-tab" data-tab="${tab}">${tab}</button>`).join('')}</div>${v11SignatureInspector(envelope)}</aside></div>`,`${button('Save draft','save-signature-draft')}${button('Download certificate','download-signature-certificate','','download')}${button(envelope.status==='Completed'?'View completion':'Send envelope','send-signature-envelope','primary','send')}`,{variant:'signature',size:'fullscreen',eyebrow:'Responsive e-signature workspace'});
  };

  const v15SignatureTemplateMeta = {
    'Term Sheet': {title:'Series B Investment Term Sheet',kicker:'Indicative investment terms',status:'Non-binding except specified provisions',sections:['Transaction overview','Investment economics','Governance and reserved matters','Conditions precedent','Exclusivity and confidentiality','Execution']},
    'Subscription Agreement': {title:'Subscription Agreement',kicker:'Private capital subscription documentation',status:'Execution copy',sections:['Investor particulars','Subscription and commitment','Representations and warranties','AML / KYC declarations','Notices','Execution']},
    'Board Resolution': {title:'Written Resolution of the Board',kicker:'Corporate authorisation',status:'For approval and execution',sections:['Background','Resolutions','Delegated authority','Conflict declarations','Effective date','Execution']},
    'NDA': {title:'Mutual Non-Disclosure Agreement',kicker:'Confidential information framework',status:'Execution copy',sections:['Purpose','Confidential information','Permitted use and disclosure','Exclusions','Term and return of information','Execution']}
  };

  function v15LegalTemplatePaper(template) {
    const meta=v15SignatureTemplateMeta[template]||v15SignatureTemplateMeta['Term Sheet'];
    const termRows=template==='Term Sheet' ? [['Investment amount','USD 18,000,000'],['Instrument','Series B Preferred Equity'],['Pre-money valuation','USD 85,000,000'],['Proposed ownership','17.5%'],['Board rights','1 director + 1 observer'],['Closing','Subject to CP satisfaction']] : template==='Subscription Agreement' ? [['Subscriber','Institutional Limited Partner'],['Fund','Matanho Growth Fund II'],['Commitment','USD 25,000,000'],['Funding currency','USD'],['Admission','Subject to GP acceptance'],['KYC status','Verified before closing']] : template==='Board Resolution' ? [['Company','Nova Analytics (Pvt) Ltd'],['Meeting type','Written resolution'],['Decision','Approve Series B financing'],['Authority','CEO and Company Secretary'],['Conflict review','Completed'],['Effective date','Upon final signature']] : [['Disclosing parties','Matanho Capital / Counterparty'],['Purpose','Investment evaluation'],['Term','24 months'],['Permitted recipients','Authorised representatives'],['Governing law','As agreed in final execution copy'],['Return / destruction','On request or termination']];
    return `<article class="v15-paper"><div class="v15-paper-head"><div class="v15-paper-brand">matanho<small>Investment Management ERP</small></div><div class="v15-paper-docmeta">PRIVATE & CONFIDENTIAL<br>Controlled template<br>Version 1.0</div></div><div class="v15-paper-kicker">${escapeHTML(meta.kicker)}</div><h1>${escapeHTML(meta.title)}</h1><p class="lead">Institutional execution template with clear parties, version status, principal terms, controlled clauses and complete signing blocks.</p><div class="v15-paper-summary"><div><small>Status</small><strong>${escapeHTML(meta.status)}</strong></div><div><small>Prepared for</small><strong>Authorised parties</strong></div><div><small>Owner</small><strong>Legal & Investments</strong></div><div><small>Execution</small><strong>E-sign enabled</strong></div></div><section class="v15-paper-section"><header><span>01</span><h2>Document particulars</h2></header><table class="v15-paper-table"><tbody>${termRows.map(row=>`<tr><td style="width:34%;color:#69758b">${escapeHTML(row[0])}</td><td><strong>${escapeHTML(row[1])}</strong></td></tr>`).join('')}</tbody></table></section><section class="v15-paper-section"><header><span>02</span><h2>${escapeHTML(meta.sections[2])}</h2></header><p>The parties acknowledge that rights, approvals and obligations are subject to the definitive documents, applicable authority matrices and the current controlled version maintained in the document vault.</p><div class="v15-paper-callout"><strong>CONTROL NOTE</strong><br>Material amendments require a new version, retained redline and the configured maker-checker approval route before execution.</div></section><section class="v15-paper-section"><header><span>03</span><h2>${escapeHTML(meta.sections[4])}</h2></header><p>Confidential information may only be used for the documented transaction purpose and disclosed to authorised representatives subject to equivalent confidentiality obligations.</p></section><div class="v15-paper-signatures"><div class="v15-paper-signature"><strong>For Matanho Capital</strong>Name / title / electronic signature</div><div class="v15-paper-signature"><strong>For Counterparty</strong>Name / title / electronic signature</div></div><div class="v15-paper-footer"><span>Controlled template · Internal legal review required</span><span>Page 1 of 6</span></div></article>`;
  }

  function v15ShowSignatureTemplatePreview(template) {
    const meta=v15SignatureTemplateMeta[template]||v15SignatureTemplateMeta['Term Sheet'];
    const nav=meta.sections.map((section,index)=>`<button class="${index===0?'active':''}"><span>${index+1}</span>${escapeHTML(section)}</button>`).join('');
    showModal('Template Preview',`${template} · controlled legal template`,`<div class="v15-template-preview"><aside class="v15-template-preview-nav"><small>Document outline</small>${nav}</aside><main class="v15-template-preview-canvas">${v15LegalTemplatePaper(template)}</main><aside class="v15-template-preview-meta"><small>Template controls</small><div class="v15-template-standard"><small>Document type</small><strong>${escapeHTML(template)}</strong></div><div class="v15-template-meta-list"><div><span>Status</span><strong>${escapeHTML(meta.status)}</strong></div><div><span>Signature fields</span><strong>Role-based + signing order</strong></div><div><span>Authentication</span><strong>Email + OTP / configured method</strong></div><div><span>Versioning</span><strong>Controlled draft and execution copy</strong></div><div><span>Audit evidence</span><strong>Signer, consent, time, hash</strong></div></div></aside></div>`,`${button('Close','close-modal')}${button('Use template','use-signature-template','primary','plus',`data-template="${escapeHTML(template)}"`)}`,{variant:'document',size:'fullscreen',eyebrow:'Premium execution template'});
  }

  function v15ReportTemplatePaper(name) {
    const meta=v10IndustryTemplateMeta[name]||v10IndustryTemplateMeta['ILPA Quarterly Reporting 2.0'];
    const isValuation=name.includes('Valuation');
    const isPerformance=name.includes('Performance');
    const tableRows=isValuation ? [['Opening fair value','USD 151.2M','Approved'],['Investment / follow-on','USD 12.0M','Posted'],['Realisation / proceeds','(USD 19.8M)','Reconciled'],['Fair-value movement','USD 25.0M','IC reviewed'],['Closing fair value','USD 168.4M','Approved']] : isPerformance ? [['Gross IRR','20.4%','+1.6pp'],['Net IRR','17.8%','+1.3pp'],['TVPI','2.18x','+0.14x'],['DPI','0.62x','+0.08x'],['RVPI','1.56x','+0.06x']] : [['Commitment','USD 450.0M','Fund terms'],['Called capital','USD 211.0M','47%'],['Distributions','USD 63.4M','Since inception'],['NAV','USD 168.4M','30 Jun 2026'],['Unfunded','USD 239.0M','53%']];
    return `<article class="v15-paper"><div class="v15-report-cover-band"></div><div class="v15-paper-head"><div class="v15-paper-brand">matanho<small>Investment Management ERP</small></div><div class="v15-paper-docmeta">LIMITED PARTNER REPORTING<br>Q2 2026<br>Private & confidential</div></div><div class="v15-report-hero"><div><div class="v15-paper-kicker">${escapeHTML(meta.basis)}</div><h1>${escapeHTML(name)}</h1><p class="lead">Matanho Growth Fund II · Institutional quarterly reporting pack · Reporting currency USD.</p></div><div class="v15-report-period"><small>Reporting period</small><strong>1 Apr - 30 Jun 2026</strong><small style="margin-top:10px">Data as of</small><strong>30 Jun 2026</strong></div></div><div class="v15-paper-summary"><div><small>Net IRR</small><strong>17.8%</strong></div><div><small>TVPI</small><strong>2.18x</strong></div><div><small>DPI</small><strong>0.62x</strong></div><div><small>NAV</small><strong>USD 168.4M</strong></div></div><section class="v15-paper-section"><header><span>01</span><h2>${isValuation?'Fair-value summary':isPerformance?'Performance summary':'Fund overview and capital account'}</h2></header><table class="v15-paper-table"><thead><tr><th>Measure</th><th>Current period</th><th>Context / control</th></tr></thead><tbody>${tableRows.map(row=>`<tr><td><strong>${escapeHTML(row[0])}</strong></td><td>${escapeHTML(row[1])}</td><td>${escapeHTML(row[2])}</td></tr>`).join('')}</tbody></table></section><section class="v15-paper-section"><header><span>02</span><h2>${isValuation?'Valuation movement and sensitivity':isPerformance?'Contributions, distributions and return progression':'Capital activity and portfolio overview'}</h2></header><div class="v15-report-mini-chart"><span style="height:42%"></span><span style="height:58%"></span><span style="height:51%"></span><span style="height:72%"></span><span style="height:84%"></span><span style="height:79%"></span></div><p>Current period movements are presented alongside prior-period comparatives, source-data references and review status so that material changes can be traced to the underlying approved records.</p></section><section class="v15-paper-section"><header><span>03</span><h2>${isValuation?'Methodology and governance':'Fees, expenses, carried interest and disclosures'}</h2></header><p>${isValuation?'Fair value is supported by documented methodology, calibration, observable inputs where available, sensitivity analysis and approval evidence.':'The reporting pack separates performance, investor cash flows, fund economics and portfolio schedules with clear period, currency, methodology and source-data labels.'}</p><div class="v15-paper-callout"><strong>SOURCE & METHODOLOGY NOTE</strong><br>Generated values remain linked to approved source data. Review the LPA, accounting basis, valuation policy and jurisdiction-specific disclosure requirements before publication.</div></section><div class="v15-paper-footer"><span>${escapeHTML(meta.basis)} · Working template</span><span>Page 1 of 12</span></div></article>`;
  }

  function v15ShowIndustryReportTemplatePreview(name) {
    const meta=v10IndustryTemplateMeta[name]||v10IndustryTemplateMeta['ILPA Quarterly Reporting 2.0'];
    const sections=name.includes('Valuation')?['Executive valuation summary','Portfolio fair-value schedule','Movement bridge','Methodology','Sensitivity','Approval record']:name.includes('Performance')?['Performance overview','Fund-level returns','Portfolio-level returns','Contributions / distributions','Methodology','Reconciliation']:['Executive summary','Fund overview','Performance','Capital activity','Fees / expenses / carry','Portfolio schedule','Valuation','Financial statements','Disclosures'];
    showModal('Report Template Preview',`${name} · editable auto-generated reporting pack`,`<div class="v15-template-preview"><aside class="v15-template-preview-nav"><small>Report structure</small>${sections.map((section,index)=>`<button class="${index===0?'active':''}"><span>${index+1}</span>${escapeHTML(section)}</button>`).join('')}</aside><main class="v15-template-preview-canvas">${v15ReportTemplatePaper(name)}</main><aside class="v15-template-preview-meta"><small>Standards profile</small><div class="v15-template-standard"><small>Framework basis</small><strong>${escapeHTML(meta.basis)}</strong></div><div class="v15-template-meta-list"><div><span>Generation</span><strong>Auto-prefilled from approved data</strong></div><div><span>Editing</span><strong>Every section remains editable</strong></div><div><span>Currency</span><strong>Explicit reporting currency</strong></div><div><span>Comparatives</span><strong>Current + prior period</strong></div><div><span>Source lineage</span><strong>Visible source references</strong></div><div><span>Publication</span><strong>Review and approval controlled</strong></div></div></aside></div>`,`${button('Close','close-modal')}${button('Use & prefill','apply-report-template','primary','sparkles',`data-template="${escapeHTML(name)}"`)}`,{variant:'document',size:'fullscreen',eyebrow:'Institutional reporting template'});
  }

  v10ShowTemplateLibrary = function() {
    const cards = Object.entries(v10IndustryTemplateMeta).map(([name,meta])=>`<article class="template-library-card ${name===state.reportTemplate?'selected':''}"><span class="template-library-icon ${meta.tone}">${icon(meta.icon)}</span><div><small>${escapeHTML(meta.basis)}</small><h3>${escapeHTML(name)}</h3><p>${escapeHTML(meta.short)}</p><ul>${name.includes('Performance')?'<li>Fund and portfolio returns</li><li>Contribution and distribution schedules</li><li>Methodology and reconciliation</li>':name.includes('Valuation')?'<li>Fair-value methodology</li><li>Movement and sensitivity</li><li>Committee approvals</li>':name.includes('Quarterly Reporting')?'<li>Fees, expenses and carried interest</li><li>Fund economics and capital accounts</li><li>Portfolio and source-data schedules</li>':'<li>LP-facing executive narrative</li><li>Performance and capital activity</li><li>Portfolio, risk and appendices</li>'}</ul></div><footer>${button('Preview','preview-industry-report-template','compact','eye',`data-template="${escapeHTML(name)}"`)}${button(name===state.reportTemplate?'Regenerate':'Use template','apply-report-template',name===state.reportTemplate?'':'primary','sparkles',`data-template="${escapeHTML(name)}"`)}</footer></article>`).join('');
    showModal('Industry Report Template Library','Preview an institutional reporting layout, then auto-generate it from current approved data and edit every section before review.',`<div class="template-library-grid">${cards}</div><div class="reason-item section-gap">${icon('info')}<div><strong>Standards-led, not automatic legal compliance</strong><small>Layouts follow recognised private-markets reporting and valuation conventions. Fund governing documents, accounting basis, client requirements and local rules remain authoritative.</small></div></div>`,`${button('Close','close-modal','primary')}`,{variant:'document',size:'xl',eyebrow:'Premium auto-generated report templates'});
  };

  const v15BaseDocumentPreviewBody = documentPreviewBody;
  documentPreviewBody = function(doc) {
    if (doc.type === 'XLSX' || doc.type === 'CSV') return v15BaseDocumentPreviewBody(doc);
    const isTerm=/Term Sheet/i.test(doc.name);
    const isReport=/Report|Pack|Memo|Financial Statements/i.test(doc.name);
    const metaRows=isTerm ? [['Investment','USD 18,000,000'],['Instrument','Preferred equity'],['Pre-money valuation','USD 85,000,000'],['Ownership','17.5%'],['Board rights','1 director + 1 observer']] : isReport ? [['Reporting entity','Matanho Growth Fund II'],['Reporting period','Q2 2026'],['Reporting currency','USD'],['Prepared by',doc.owner],['Review status',doc.status]] : [['Document owner',doc.owner],['Classification',doc.classification],['Version',doc.version],['Access',doc.access],['Retention',doc.retention]];
    return `<div class="pdf-preview professional-document v15-premium-document"><aside>${Array.from({length:Math.min(doc.pages||6,6)},(_,i)=>`<button class="pdf-thumbnail ${i===0?'active':''}" data-action="document-page" data-page="${i+1}"><span>${i+1}</span><div></div></button>`).join('')}</aside><div class="pdf-canvas"><article class="v15-paper"><div class="v15-paper-head"><div class="v15-paper-brand">matanho<small>Investment Management ERP</small></div><div class="v15-paper-docmeta">${escapeHTML(doc.classification).toUpperCase()}<br>${escapeHTML(doc.version)}<br>${escapeHTML(doc.folder)}</div></div><span class="v15-doc-watermark">CONTROLLED COPY</span><div class="v15-paper-kicker">${isTerm?'Investment documentation':isReport?'Institutional reporting':'Controlled document'}</div><h1>${escapeHTML(doc.name.replace(/\.(pdf|docx)$/i,''))}</h1><p class="lead">${isTerm?'Principal investment terms prepared for controlled review, negotiation and electronic execution.':isReport?'Professional investment-management report with clear reporting period, methodology, source data and approval status.':'Version-controlled investment record with source lineage, review history and permission-aware access.'}</p><div class="v15-doc-status-row"><span class="v15-doc-status-chip">${escapeHTML(doc.status)}</span><span class="v15-doc-status-chip">${escapeHTML(doc.version)}</span><span class="v15-doc-status-chip">${escapeHTML(doc.signatureStatus)}</span></div><section class="v15-paper-section"><header><span>01</span><h2>${isTerm?'Principal terms':isReport?'Report particulars':'Document particulars'}</h2></header><table class="v15-paper-table"><tbody>${metaRows.map(row=>`<tr><td style="width:35%;color:#69758b">${escapeHTML(row[0])}</td><td><strong>${escapeHTML(String(row[1]))}</strong></td></tr>`).join('')}</tbody></table></section><section class="v15-paper-section"><header><span>02</span><h2>${isTerm?'Governance, protections and conditions':'Executive summary'}</h2></header><p>${isTerm?'The transaction remains subject to definitive agreements, conditions precedent, approved governance rights and the documented authority matrix. Any material change creates a new controlled version.':'This controlled record presents the approved information for the current reporting period. Material values are supported by source-data references, review evidence and a visible publication status.'}</p>${isReport?'<div class="v15-report-mini-chart"><span style="height:35%"></span><span style="height:54%"></span><span style="height:48%"></span><span style="height:70%"></span><span style="height:83%"></span><span style="height:76%"></span></div>':''}</section><section class="v15-paper-section"><header><span>03</span><h2>Review and evidence</h2></header><table class="v15-paper-table"><thead><tr><th>Control</th><th>Owner</th><th>Status</th></tr></thead><tbody><tr><td>Source-data validation</td><td>${escapeHTML(doc.owner)}</td><td>Complete</td></tr><tr><td>Independent review</td><td>Fund Operations</td><td>${escapeHTML(doc.status)}</td></tr><tr><td>${isTerm?'Execution readiness':'Publication approval'}</td><td>Authorised approver</td><td>${doc.signatureStatus==='Completed'?'Complete':'Pending'}</td></tr></tbody></table><div class="v15-paper-callout"><strong>CONTROLLED DOCUMENT</strong><br>Edits are retained as a new version. The published or signed copy is not overwritten.</div></section>${isTerm?'<div class="v15-paper-signatures"><div class="v15-paper-signature"><strong>Matanho Capital</strong>Authorised signatory</div><div class="v15-paper-signature"><strong>Nova Analytics (Pvt) Ltd</strong>Authorised signatory</div></div>':''}<div class="v15-paper-footer"><span>${escapeHTML(doc.id)} · ${escapeHTML(doc.version)}</span><span>Page 1 of ${doc.pages||1}</span></div></article></div></div>`;
  };

  const v15BaseHandleAction = handleAction;
  handleAction = function(action,trigger,event) {
    switch(action) {
      case 'v15-standard-back': navigate(trigger.dataset.target || state.previousPage || 'dashboard'); return;
      case 'sign-term-sheet': v15ShowSignatureCapture(trigger.dataset.id || state.selectedDocumentId || 'DOC-009', state.selectedEnvelopeId, trigger.dataset.signer); return;
      case 'v15-signature-mode': v15SetSignatureCaptureMode(trigger.dataset.mode || 'draw'); return;
      case 'v15-clear-signature': v15ClearSignaturePad(); return;
      case 'v15-apply-signature': v15ApplySignature(trigger); return;
      case 'preview-signature-template': v15ShowSignatureTemplatePreview(trigger.dataset.template || 'Term Sheet'); return;
      case 'preview-industry-report-template': v15ShowIndustryReportTemplatePreview(trigger.dataset.template || state.reportTemplate); return;
      default: return v15BaseHandleAction(action,trigger,event);
    }
  };

  document.addEventListener('input',event=>{
    if (event.target.id === 'v15TypedSignatureName') {
      const preview=$('#v15TypedSignaturePreview'); if(preview) preview.textContent=event.target.value || 'Signature';
    }
  });
  document.addEventListener('change',event=>{
    if (event.target.id !== 'v15SignatureUpload') return;
    const file=event.target.files?.[0];
    if (!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      state.v15UploadedSignature=String(reader.result||'');
      const img=$('#v15SignatureUploadPreview');
      if(img){img.src=state.v15UploadedSignature;img.style.display='block';}
      toast('Signature image loaded',file.name);
    };
    reader.readAsDataURL(file);
  });


  // V21 simplified signing experience: review -> sign -> complete.
  function v21SignerEmail(name='') {
    const key=String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'');
    return `${key||'signer'}@matanho.com`;
  }

  function v21SignatureEvidence(envelope,index) {
    return state.v15SignatureEvidence?.[v15SignatureKey(envelope.id,index)] || null;
  }

  function v21SignaturePaper(doc,envelope,currentIndex) {
    const current=envelope.recipients[currentIndex] || envelope.recipients[0];
    const rows=[
      ['Investment amount','USD 18,000,000'],
      ['Instrument','Preferred equity'],
      ['Pre-money valuation','USD 85,000,000'],
      ['Proposed ownership','17.5%'],
      ['Board rights','1 director + 1 observer'],
      ['Target close','31 Aug 2026']
    ];
    const blocks=envelope.recipients.slice(0,2).map((recipient,index)=>{
      const evidence=v21SignatureEvidence(envelope,index);
      if(recipient[2]==='Signed') return `<div class="v21-signature-block"><small>${escapeHTML(recipient[1])}</small><div class="v21-paper-signed"><strong class="drawn">${escapeHTML(evidence?.legalName||recipient[0])}</strong><span>Signed electronically · ${evidence?.auth||'Email + OTP'}</span></div></div>`;
      return `<div class="v21-signature-block"><small>${escapeHTML(recipient[1])}</small><button class="v21-paper-sign-button" data-action="v21-focus-signature" data-signer="${index}">${icon('edit')}<strong>${index===currentIndex?'Sign here':'Awaiting signature'}</strong><span>${escapeHTML(recipient[0])}</span></button></div>`;
    }).join('');
    return `<article class="v21-esign-paper"><div class="v21-esign-paper-head"><div class="v21-esign-paper-brand">matanho<small>Investment Management ERP</small></div><div class="v21-esign-paper-meta">CONTROLLED COPY<br>${escapeHTML(doc.id)} · ${escapeHTML(doc.version)}<br>Electronic execution enabled</div></div><h1>${escapeHTML(doc.name.replace(/\.(pdf|docx)$/i,''))}</h1><p class="lead">Non-binding summary of principal investment terms prepared for controlled review and electronic execution.</p><h2>Investment overview</h2><table class="v21-term-table"><tbody>${rows.map(row=>`<tr><td>${escapeHTML(row[0])}</td><td>${escapeHTML(row[1])}</td></tr>`).join('')}</tbody></table><h2>Governance and investor protections</h2><p>The investor may appoint one director and one non-voting observer, subject to the definitive agreements, agreed reserved matters and final legal review.</p><h2>Execution</h2><p>Each signatory confirms authority to execute the controlled document. Completion evidence records the document hash, consent, signer identity, timestamp and authentication method.</p><div class="v21-signature-blocks">${blocks}</div><div class="v21-paper-footer"><span>${escapeHTML(doc.id)} · ${escapeHTML(doc.version)}</span><span>Page 1 of ${doc.pages||1}</span></div></article>`;
  }

  function v21ShowESign(documentId='DOC-009',envelopeId=null,signerIndex=null) {
    const doc=documents.find(item=>item.id===documentId) || documents.find(item=>/Term Sheet|Agreement/.test(item.name)) || documents[0];
    const envelope=signatureEnvelopes.find(item=>item.id===envelopeId) || signatureEnvelopes.find(item=>item.documentId===doc.id) || signatureEnvelopes[0];
    const pending=envelope.recipients.findIndex(item=>item[2]!=='Signed');
    const requested=(signerIndex===null||signerIndex===undefined||signerIndex==='')?NaN:Number(signerIndex);
    const index=Number.isFinite(requested) && requested>=0 ? requested : (pending>=0?pending:0);
    const signer=envelope.recipients[index] || envelope.recipients[0];
    const completed=envelope.status==='Completed' || envelope.progress>=100;
    const alreadySigned=signer?.[2]==='Signed';
    state.selectedDocumentId=doc.id;
    state.selectedEnvelopeId=envelope.id;
    state.signatureSelectedRecipient=index;
    state.v15SignatureCaptureMode='draw';
    state.v15SignatureInk='';
    state.v15HasDrawnSignature=false;
    state.v15UploadedSignature='';

    const otherSigners=envelope.recipients.map((r,i)=>`<div class="v21-other-signer">${personAvatar(r[0])}<span><strong>${escapeHTML(r[0])}</strong><small>${escapeHTML(r[1])}</small></span>${statusPill(r[2],r[2]==='Signed'?'success':r[2]==='Declined'?'danger':'warning')}</div>`).join('');
    const step2=completed?'done':'active';
    const step3=completed?'active':'';
    const signingControls=alreadySigned || completed ? `<div class="v21-complete-card"><strong>${completed?'Document completed':'Your signature is recorded'}</strong><p>${completed?'All required signers have completed the document. The completion certificate is available for download.':'The envelope remains open while other signers complete their steps.'}</p></div>${completed?`<button class="v21-sign-primary" data-action="download-signature-certificate">${icon('download')} Download completion certificate</button>`:`<button class="v21-sign-secondary" data-action="close-modal">Finish later</button>`}` : `<div class="v21-sign-methods"><button type="button" class="v15-sign-tab active" data-action="v15-signature-mode" data-mode="draw">Draw</button><button type="button" class="v15-sign-tab" data-action="v15-signature-mode" data-mode="type">Type</button><button type="button" class="v15-sign-tab" data-action="v15-signature-mode" data-mode="upload">Upload</button></div><div class="v15-sign-panel active" data-mode="draw"><p>Draw inside the box using a mouse, finger or stylus.</p><div class="v15-signature-pad-wrap"><canvas id="v15SignatureCanvas"></canvas><span class="v15-sign-pad-caption">SIGN ABOVE THIS LINE</span></div><div class="v15-sign-pad-actions"><small id="v15SignatureDrawStatus">Draw your signature</small>${button('Clear','v15-clear-signature','ghost compact','refresh')}</div></div><div class="v15-sign-panel" data-mode="type"><div class="form-field"><label class="required">Full legal name</label><input id="v15TypedSignatureName" value="${escapeHTML(signer[0])}" autocomplete="name"></div><div class="v15-typed-signature"><strong id="v15TypedSignaturePreview">${escapeHTML(signer[0])}</strong></div></div><div class="v15-sign-panel" data-mode="upload"><label class="v15-signature-upload" for="v15SignatureUpload">${icon('upload')}<span><strong>Upload signature image</strong><small>PNG or JPG</small></span><input id="v15SignatureUpload" type="file" accept="image/png,image/jpeg" hidden></label><img id="v15SignatureUploadPreview" class="v15-upload-preview" alt="Uploaded signature preview"></div><label class="v21-consent"><input id="v15SignatureConsent" type="checkbox"><span>I have reviewed this controlled document and consent to apply my electronic signature.</span></label><button class="v21-sign-primary" data-action="v21-apply-signature" data-signer="${index}" data-document="${doc.id}">${icon('edit')} Sign and continue</button><button class="v21-sign-secondary" data-action="close-modal">Save and finish later</button>`;

    const body=`<div class="v21-esign-shell"><section class="v21-esign-document"><header class="v21-esign-toolbar"><div class="v21-esign-toolbar-left"><button class="v21-doc-tool" data-action="close-modal">${icon('chevron-left')} Back</button><div><strong>${escapeHTML(doc.name)}</strong><small>${escapeHTML(doc.version)} · ${escapeHTML(envelope.id)}</small></div></div><div class="v21-esign-toolbar-right"><button class="v21-doc-tool" data-action="document-zoom">100%</button><button class="v21-doc-tool" data-action="download-format" data-id="${doc.id}" data-format="pdf">${icon('download')} PDF</button></div></header><div class="v21-esign-scroll">${v21SignaturePaper(doc,envelope,index)}</div></section><aside class="v21-esign-panel"><div class="v21-sign-panel-head"><div class="v21-sign-panel-title"><span>${icon('edit')}</span><div><h3>E-sign document</h3><p>${escapeHTML(doc.name)} · secure execution</p></div></div><div class="v21-sign-steps"><div class="v21-sign-step done"><span>${icon('check')}</span>Review</div><div class="v21-sign-step ${step2}"><span>${completed?icon('check'):'2'}</span>Sign</div><div class="v21-sign-step ${step3}"><span>${completed?icon('check'):'3'}</span>Complete</div></div></div><div class="v21-sign-panel-body"><div class="v21-signer-card">${personAvatar(signer[0])}<span><strong>${escapeHTML(signer[0])}</strong><small>${escapeHTML(signer[1])}<br>${escapeHTML(v21SignerEmail(signer[0]))}</small></span>${statusPill(signer[2],signer[2]==='Signed'?'success':'warning')}</div>${signingControls}<section class="v21-other-signers"><header><h4>Signing order</h4><small>${envelope.recipients.filter(r=>r[2]==='Signed').length} of ${envelope.recipients.length} signed</small></header>${otherSigners}</section><div class="v21-security-line">${icon('shield')} Encrypted · consent and audit evidence recorded</div></div></aside></div>`;
    showModal('Electronic Signature',`${doc.name} · ${envelope.id}`,body,'',{variant:'signature',size:'fullscreen',eyebrow:'Simple secure signing'});
    if(!alreadySigned && !completed){requestAnimationFrame(()=>requestAnimationFrame(v15InitSignaturePad));setTimeout(v15InitSignaturePad,120);}
  }

  function v21ApplySignature(trigger){
    const envelope=signatureEnvelopes.find(item=>item.id===state.selectedEnvelopeId) || signatureEnvelopes[0];
    const index=Number(trigger.dataset.signer||0);
    const signer=envelope.recipients[index];
    if(!signer)return;
    if(!$('#v15SignatureConsent')?.checked){toast('Consent required','Confirm that you reviewed the controlled document.','warning');return;}
    const mode=state.v15SignatureCaptureMode||'draw';
    let dataUrl=''; let legalName=signer[0];
    if(mode==='draw'){
      if(!state.v15HasDrawnSignature||!state.v15SignatureInk){toast('Signature required','Draw your signature before continuing.','warning');return;}
      dataUrl=state.v15SignatureInk;
    }else if(mode==='type'){
      legalName=$('#v15TypedSignatureName')?.value.trim()||'';
      if(!legalName){toast('Name required','Enter the signer legal name.','warning');return;}
    }else{
      if(!state.v15UploadedSignature){toast('Signature image required','Upload a PNG or JPG signature image.','warning');return;}
      dataUrl=state.v15UploadedSignature;
    }
    state.v15SignatureEvidence[v15SignatureKey(envelope.id,index)]={mode,dataUrl,legalName,signedAt:new Date().toISOString(),auth:'Email + OTP'};
    signer[2]='Signed';
    envelope.progress=Math.round(envelope.recipients.filter(item=>item[2]==='Signed').length/envelope.recipients.length*100);
    envelope.status=envelope.progress===100?'Completed':'Waiting for others';
    const doc=documents.find(item=>item.id===trigger.dataset.document)||documents.find(item=>item.id===envelope.documentId);
    if(doc)doc.signatureStatus=envelope.status==='Completed'?'Completed':'Partially signed';
    toast('Signature applied',`${signer[0]} signed the controlled document.`);
    closeOverlays();render();
    setTimeout(()=>v21ShowESign(doc?.id||envelope.documentId,envelope.id,index),0);
  }

  const v21BaseShowSignatureStudio=showSignatureStudio;
  showSignatureStudio=function(documentId='DOC-009',envelopeId=null){v21ShowESign(documentId,envelopeId,null);};
  v15ShowSignatureCapture=function(documentId='DOC-009',envelopeId=null,signerIndex=null){v21ShowESign(documentId,envelopeId,signerIndex);};

  const v21BaseHandleAction=handleAction;
  handleAction=function(action,trigger,event){
    switch(action){
      case 'open-signature-studio': v21ShowESign(trigger.dataset.id||state.selectedDocumentId||'DOC-009',trigger.dataset.envelope||null,null); return;
      case 'sign-term-sheet': v21ShowESign(trigger.dataset.id||state.selectedDocumentId||'DOC-009',state.selectedEnvelopeId,trigger.dataset.signer); return;
      case 'v21-focus-signature': state.signatureSelectedRecipient=Number(trigger.dataset.signer||0); v21ShowESign(state.selectedDocumentId||'DOC-009',state.selectedEnvelopeId,state.signatureSelectedRecipient); return;
      case 'v21-apply-signature': v21ApplySignature(trigger); return;
      default: return v21BaseHandleAction(action,trigger,event);
    }
  };


  /* V22 — interaction reliability, document/report vault upgrades and responsive overlay polish */
  state.v22VaultFolder = state.v22VaultFolder || 'all';
  state.v22VaultSearch = state.v22VaultSearch || '';
  state.v22VaultClassification = state.v22VaultClassification || 'All classifications';
  state.v22VaultStatus = state.v22VaultStatus || 'All statuses';
  state.v22VaultView = state.v22VaultView || 'list';
  state.v22DocumentZoom = state.v22DocumentZoom || 100;
  state.v22DocumentPage = state.v22DocumentPage || 1;
  state.v22ReportSearch = state.v22ReportSearch || '';
  state.v22ReportType = state.v22ReportType || 'All report types';
  state.v22ReportPeriod = state.v22ReportPeriod || 'All periods';
  state.v22SignatureSearch = state.v22SignatureSearch || '';
  state.v22SignatureStatus = state.v22SignatureStatus || 'All statuses';

  function v22Option(value, selected){
    return `<option ${value===selected?'selected':''}>${escapeHTML(value)}</option>`;
  }

  function v22FilteredDocuments(){
    const q=(state.v22VaultSearch||'').trim().toLowerCase();
    return documents.filter(doc=>{
      const folderOk=state.v22VaultFolder==='all'||doc.folder===state.v22VaultFolder;
      const classOk=state.v22VaultClassification==='All classifications'||doc.classification===state.v22VaultClassification;
      const statusOk=state.v22VaultStatus==='All statuses'||doc.status===state.v22VaultStatus;
      const searchOk=!q||[doc.name,doc.folder,doc.owner,doc.classification,doc.status,doc.type,doc.version].some(value=>String(value||'').toLowerCase().includes(q));
      return folderOk&&classOk&&statusOk&&searchOk;
    });
  }

  function v22DocumentCards(items){
    if(!items.length) return `<div class="v22-empty-state">${icon('search')}<strong>No documents match these filters</strong><p>Clear a filter or search for a different title, owner, folder or status.</p>${button('Clear filters','v22-clear-vault-filters','','refresh')}</div>`;
    return `<div class="v22-document-grid">${items.map(doc=>`<article class="v22-document-card" data-action="preview-document" data-id="${doc.id}" tabindex="0"><div class="v22-document-card-icon">${icon(doc.type==='XLSX'?'bar-chart':'file')}</div><div class="v22-document-card-copy"><div class="v22-document-card-top"><span>${escapeHTML(doc.folder)}</span>${statusPill(doc.status)}</div><h3>${escapeHTML(doc.name)}</h3><p>${escapeHTML(doc.type)} · ${escapeHTML(doc.size)} · ${escapeHTML(doc.version)}</p><div class="v22-document-card-meta"><span><small>Owner</small><strong>${escapeHTML(doc.owner)}</strong></span><span><small>Class</small><strong>${escapeHTML(doc.classification)}</strong></span><span><small>Updated</small><strong>${escapeHTML(doc.uploaded)}</strong></span></div></div><div class="v22-document-card-actions">${button('Preview','preview-document','compact','eye',`data-id="${doc.id}"`)}${button('Download','document-download-menu','ghost compact','download',`data-id="${doc.id}"`)}${/Term Sheet|Agreement/.test(doc.name)?button('E-sign','open-signature-studio','ghost compact','edit',`data-id="${doc.id}"`):''}</div></article>`).join('')}</div>`;
  }

  vaultDocumentTable=function(items=documents){
    if(state.v22VaultView==='grid') return v22DocumentCards(items);
    if(!items.length) return `<div class="v22-empty-state">${icon('search')}<strong>No documents match these filters</strong><p>Clear a filter or search for a different title, owner, folder or status.</p>${button('Clear filters','v22-clear-vault-filters','','refresh')}</div>`;
    return `<div class="table-wrap"><table><thead><tr><th>Document</th><th>Folder</th><th>Version</th><th>Owner</th><th>Classification</th><th>Signature</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${items.map(doc=>`<tr class="clickable v22-document-row" data-action="preview-document" data-id="${doc.id}" tabindex="0"><td class="table-primary"><span class="document-name-cell"><span class="document-row-icon">${icon(doc.type==='XLSX'?'bar-chart':'file')}</span><span>${escapeHTML(doc.name)}<small>${escapeHTML(doc.type)} · ${escapeHTML(doc.size)}</small></span></span></td><td>${escapeHTML(doc.folder)}</td><td>${escapeHTML(doc.version)}</td><td>${escapeHTML(doc.owner)}</td><td>${statusPill(doc.classification,'neutral')}</td><td>${statusPill(doc.signatureStatus,doc.signatureStatus==='Not required'?'neutral':doc.signatureStatus.includes('Awaiting')?'warning':'info')}</td><td>${statusPill(doc.status)}</td><td>${escapeHTML(doc.uploaded)}</td><td><div class="row-actions">${button('Preview','preview-document','compact','eye',`data-id="${doc.id}"`)}${button('Ledger','edit-document-ledger','ghost compact','list',`data-id="${doc.id}"`)}${button('Download','document-download-menu','ghost compact','download',`data-id="${doc.id}"`)}${/Term Sheet|Agreement/.test(doc.name)?button('E-sign','open-signature-studio','ghost compact','edit',`data-id="${doc.id}"`):''}</div></td></tr>`).join('')}</tbody></table></div>`;
  };

  renderDocumentsVault=function(){
    const folders=[...new Set(documents.map(d=>d.folder))];
    const filtered=v22FilteredDocuments();
    const filterCount=(state.v22VaultClassification!=='All classifications'?1:0)+(state.v22VaultStatus!=='All statuses'?1:0);
    return `${pageHeader('Documents Vault','Secure, classified and auditable investment-document repository with native previews, versions, access controls and e-signature.',`${button('Request document','request-document','','send')}${button('Upload files','vault-upload','primary','upload')}`,'Reporting & Records')}
      <section class="vault-stats section-gap"><div>${icon('folder')}<span><strong>${folders.length}</strong><small>Controlled folders</small></span></div><div>${icon('file')}<span><strong>${documents.length}</strong><small>Active documents</small></span></div><div>${icon('edit')}<span><strong>${documents.filter(d=>d.signatureStatus!=='Not required').length}</strong><small>Signature-enabled</small></span></div><div>${icon('shield')}<span><strong>100%</strong><small>Encrypted & audit logged</small></span></div><div>${icon('clock')}<span><strong>2</strong><small>Retention reviews due</small></span></div></section>
      <section class="vault-layout section-gap"><aside class="vault-folder-panel"><div class="vault-panel-head"><strong>Folders</strong>${button('','create-folder','ghost compact icon-only','plus')}</div><button class="vault-folder ${state.v22VaultFolder==='all'?'active':''}" data-action="vault-filter-folder" data-folder="all">${icon('layers')}<span>All documents<small>${documents.length} records</small></span><b>${documents.length}</b></button>${folders.map(folder=>`<button class="vault-folder ${state.v22VaultFolder===folder?'active':''}" data-action="vault-filter-folder" data-folder="${escapeHTML(folder)}">${icon('folder')}<span>${escapeHTML(folder)}<small>${documents.filter(d=>d.folder===folder).length} records</small></span><b>${documents.filter(d=>d.folder===folder).length}</b></button>`).join('')}</aside><section class="card table-card vault-records"><div class="table-toolbar"><div class="table-title-row"><h3>Document Register</h3><span class="table-badge">${filtered.length} visible · click a row to preview</span></div><div class="table-tools"><label class="table-search">${icon('search')}<input data-input-action="v22-document-search" value="${escapeHTML(state.v22VaultSearch)}" placeholder="Search documents"></label>${button(`Filters${filterCount?` · ${filterCount}`:''}`,'document-vault-filters','','filter')}${button(state.v22VaultView==='list'?'Cards':'List','toggle-vault-view','','grid')}</div></div>${vaultDocumentTable(filtered)}</section></section>`;
  };

  function v22ShowDocumentFilters(trigger){
    const classifications=['All classifications',...new Set(documents.map(item=>item.classification))];
    const statuses=['All statuses',...new Set(documents.map(item=>item.status))];
    showPopover(trigger,`<div class="v22-filter-popover"><div class="popover-title">Document filters</div><label><span>Classification</span><select data-change-action="v22-vault-classification">${classifications.map(value=>v22Option(value,state.v22VaultClassification)).join('')}</select></label><label><span>Status</span><select data-change-action="v22-vault-status">${statuses.map(value=>v22Option(value,state.v22VaultStatus)).join('')}</select></label><div class="v22-popover-actions">${button('Clear','v22-clear-vault-filters','','refresh')}${button('Done','close-popover','primary','check')}</div></div>`,320);
  }

  function v22UploadDocuments(){
    const input=document.createElement('input');
    input.type='file'; input.multiple=true; input.accept='.pdf,.doc,.docx,.xls,.xlsx,.csv,image/*'; input.hidden=true;
    document.body.appendChild(input);
    input.addEventListener('change',()=>{ if(input.files?.length) uploadDocuments(input.files); input.remove(); },{once:true});
    input.addEventListener('cancel',()=>input.remove(),{once:true});
    input.click();
  }

  function v22DocumentInspector(tab='details'){
    const doc=documents.find(item=>item.id===state.selectedDocumentId)||documents[0];
    const inspector=modalLayer.querySelector('.document-inspector'); if(!inspector)return;
    const tabs=['details','versions','activity'];
    const tabButtons=tabs.map(value=>`<button class="${tab===value?'active':''}" data-action="v22-document-inspector-tab" data-tab="${value}">${value[0].toUpperCase()+value.slice(1)}</button>`).join('');
    let body='';
    if(tab==='versions') body=`<div class="v22-inspector-section"><strong>Version history</strong><div class="v22-version-list"><button data-action="preview-document" data-id="${doc.id}"><span><b>${escapeHTML(doc.version)}</b><small>Current working version · ${escapeHTML(doc.uploaded)}</small></span>${statusPill(doc.status)}</button><button data-action="generic-action"><span><b>v${Math.max(1,parseFloat(doc.version.replace('v',''))-.1).toFixed(1)}</b><small>Previous approved version · 08 Jul 2026</small></span>${statusPill('Archived','neutral')}</button><button data-action="generic-action"><span><b>v1.0</b><small>Original controlled upload</small></span>${statusPill('Archived','neutral')}</button></div>${button('Open full version ledger','edit-document-ledger','primary','list',`data-id="${doc.id}"`)}</div>`;
    else if(tab==='activity') body=`<div class="v22-inspector-section"><strong>Recent activity</strong><div class="case-timeline"><div><span></span><strong>Preview opened</strong><small>Current session · ${escapeHTML(v11CurrentRole().name)}</small></div><div><span></span><strong>${escapeHTML(doc.status)} review</strong><small>${escapeHTML(doc.owner)} · ${escapeHTML(doc.uploaded)}</small></div><div><span></span><strong>Source evidence linked</strong><small>${doc.id}-SRC-${doc.version.replace('.','')}</small></div></div>${button('Open activity metadata','activity-menu','primary','clock',`data-context="document" data-id="${doc.id}"`)}</div>`;
    else body=`<div class="info-list"><div class="info-row"><span>Owner</span><strong>${escapeHTML(doc.owner)}</strong></div><div class="info-row"><span>Access</span><strong>${escapeHTML(doc.access)}</strong></div><div class="info-row"><span>Classification</span><strong>${escapeHTML(doc.classification)}</strong></div><div class="info-row"><span>Retention</span><strong>${escapeHTML(doc.retention)}</strong></div><div class="info-row"><span>Signature</span><strong>${statusPill(doc.signatureStatus)}</strong></div><div class="info-row"><span>Source reference</span><strong>${doc.id}-SRC-${doc.version.replace('.','')}</strong></div><div class="info-row"><span>Checksum</span><strong>71dc…b98f</strong></div></div><div class="reason-item section-gap">${icon('shield')}<div><strong>Controlled preview</strong><small>Preview, export, edit and signature activity remains traceable to this version.</small></div></div>${doc.signatureStatus!=='Not required'?`<div class="section-gap">${button(doc.id==='DOC-009'?'Sign term sheet':'Open Signature Studio',doc.id==='DOC-009'?'sign-term-sheet':'open-signature-studio','primary','edit',`data-id="${doc.id}"`)}</div>`:''}`;
    inspector.innerHTML=`<div class="inspector-tabs">${tabButtons}</div>${body}`; renderStaticIcons(inspector);
  }

  function v22SyncDocumentPreview(){
    state.v22DocumentZoom=100; state.v22DocumentPage=1;
    const zoom=modalLayer.querySelector('[data-action="document-zoom"]'); if(zoom)zoom.textContent='100%';
    const tabs=modalLayer.querySelectorAll('.document-inspector .inspector-tabs button');
    tabs.forEach((node,index)=>{node.dataset.action='v22-document-inspector-tab';node.dataset.tab=['details','versions','activity'][index]||'details';});
    const paper=modalLayer.querySelector('.v15-paper,.professional-document article,.spreadsheet-sheet'); if(paper)paper.classList.add('v22-zoom-target');
    renderStaticIcons(modalLayer);
  }

  const v22BaseShowDocumentPreview=showDocumentPreview;
  showDocumentPreview=function(id){
    v22BaseShowDocumentPreview(id);
    requestAnimationFrame(v22SyncDocumentPreview);
  };

  function v22SetDocumentPage(page){
    const n=Math.max(1,Number(page)||1); state.v22DocumentPage=n;
    modalLayer.querySelectorAll('.pdf-thumbnail').forEach(node=>node.classList.toggle('active',Number(node.dataset.page)===n));
    const footer=modalLayer.querySelector('.v15-paper-footer,.report-page-footer');
    if(footer){const spans=footer.querySelectorAll('span'); if(spans.length>1){const total=(documents.find(item=>item.id===state.selectedDocumentId)||{}).pages||n;spans[spans.length-1].textContent=`Page ${n} of ${total}`;}}
    const paper=modalLayer.querySelector('.v15-paper');
    if(paper){let badge=paper.querySelector('.v22-page-badge'); if(!badge){badge=document.createElement('span');badge.className='v22-page-badge';paper.appendChild(badge);}badge.textContent=`Preview page ${n}`;paper.classList.remove('v22-page-pulse');void paper.offsetWidth;paper.classList.add('v22-page-pulse');}
  }

  function v22ZoomDocument(trigger,delta=10){
    const values=[80,90,100,110,125,140];
    let current=Number(state.v22DocumentZoom)||100;
    if(delta===0)current=100; else {const i=values.indexOf(current); current=values[Math.max(0,Math.min(values.length-1,(i<0?2:i)+(delta>0?1:-1)))];}
    state.v22DocumentZoom=current;
    const target=modalLayer.querySelector('.v22-zoom-target,.v15-paper,.v21-esign-paper,.signature-page');
    if(target){target.style.transform=`scale(${current/100})`;target.style.transformOrigin='top center';target.style.marginBottom=`${Math.max(0,(current-100)*7)}px`;}
    if(trigger)trigger.textContent=`${current}%`;
  }

  function v22FilteredReports(){
    const q=(state.v22ReportSearch||'').trim().toLowerCase();
    return reportVaultItems.filter(report=>{
      const fundOk=state.reportFilterFund==='All Funds'||report.fund===state.reportFilterFund;
      const typeOk=state.v22ReportType==='All report types'||report.type===state.v22ReportType;
      const statusOk=state.reportFilterStatus==='All Statuses'||report.status===state.reportFilterStatus;
      const periodOk=state.v22ReportPeriod==='All periods'||report.period===state.v22ReportPeriod;
      const searchOk=!q||[report.name,report.type,report.fund,report.owner,report.period,report.status].some(value=>String(value||'').toLowerCase().includes(q));
      return fundOk&&typeOk&&statusOk&&periodOk&&searchOk;
    });
  }

  renderReportsVault=function(){
    const filtered=v22FilteredReports();
    const types=['All report types',...new Set(reportVaultItems.map(r=>r.type))];
    const periods=['All periods',...new Set(reportVaultItems.map(r=>r.period))];
    const cards=filtered.length?filtered.map(report=>`<article class="report-vault-card v22-report-card" data-action="preview-vault-report" data-id="${report.id}" tabindex="0"><div class="report-cover professional"><span>${icon(report.type.includes('Valuation')?'trend-up':report.type.includes('IC')?'users':report.type.includes('Operations')?'bank':'file-chart')}</span><div><small>${escapeHTML(report.type)}</small><strong>${escapeHTML(report.period)}</strong></div><em>${escapeHTML(report.classification)}</em></div><div class="report-vault-body"><div class="report-vault-title"><div><h3>${escapeHTML(report.name)}</h3><p>${escapeHTML(report.fund)} · ${escapeHTML(report.version)}</p></div>${statusPill(report.status)}</div><div class="report-meta-grid"><span><small>Generated</small><strong>${escapeHTML(report.generated)}</strong></span><span><small>Pages</small><strong>${report.pages}</strong></span><span><small>Recipients</small><strong>${report.recipients}</strong></span><span><small>Owner</small><strong>${escapeHTML(report.owner)}</strong></span></div><div class="report-vault-actions">${button('Preview','preview-vault-report','','eye',`data-id="${report.id}"`)}${button('Edit ledger','edit-report-ledger','','list',`data-id="${report.id}"`)}${button('Download','report-download-menu','primary','download',`data-id="${report.id}"`)}</div></div></article>`).join(''):`<div class="v22-empty-state v22-report-empty">${icon('file-chart')}<strong>No report packs match these filters</strong><p>Adjust the fund, type, status, period or search text.</p>${button('Clear filters','v22-clear-report-filters','','refresh')}</div>`;
    return `${pageHeader('Reports Vault','Institutional fund, portfolio, IC, valuation, cash-control and investor report packs with professional templates and editable publication ledgers.',`${button('Generate report','generate-report','','plus')}${button('Build report pack','open-report-builder','primary','file-chart')}`,'Reporting & Records')}
      ${workspaceFilterBar([{label:'Fund',action:'report-vault-fund',selected:state.reportFilterFund,options:['All Funds',...funds.map(f=>f.name)]},{label:'Report type',action:'report-vault-type',selected:state.v22ReportType,options:types},{label:'Status',action:'report-vault-status',selected:state.reportFilterStatus,options:['All Statuses',...new Set(reportVaultItems.map(r=>r.status))]},{label:'Period',action:'report-vault-period',selected:state.v22ReportPeriod,options:periods}])}
      <section class="metric-grid section-gap">${metricCard({label:'Published Reports',value:String(reportVaultItems.filter(r=>r.status==='Published').length),iconName:'check-circle',accent:'emerald',foot:'Distribution evidence retained',action:'reports-published'})}${metricCard({label:'In Review',value:String(reportVaultItems.filter(r=>r.status==='In Review').length),iconName:'user-check',accent:'blue',foot:'Approval and commentary workflow',action:'reports-review'})}${metricCard({label:'Total Pages',value:sum(reportVaultItems,r=>r.pages).toLocaleString(),iconName:'file',accent:'brand',foot:'Across active report versions',action:'reports-pages'})}${metricCard({label:'Scheduled Distributions',value:'8',iconName:'send',accent:'purple',foot:'LP portal and secure email',action:'reports-distributions'})}</section><section class="card v22-report-tools section-gap"><label class="table-search">${icon('search')}<input data-input-action="v22-report-search" value="${escapeHTML(state.v22ReportSearch)}" placeholder="Search reports, owners or periods"></label><span class="table-badge">${filtered.length} of ${reportVaultItems.length} packs</span></section><section class="report-vault-grid section-gap">${cards}</section>`;
  };

  function v22FilteredEnvelopes(){
    const q=(state.v22SignatureSearch||'').trim().toLowerCase();
    return signatureEnvelopes.filter(envelope=>{
      const statusOk=state.v22SignatureStatus==='All statuses'||envelope.status===state.v22SignatureStatus;
      const searchOk=!q||[envelope.id,envelope.document,envelope.subject,envelope.status,...envelope.recipients.flat()].some(value=>String(value||'').toLowerCase().includes(q));
      return statusOk&&searchOk;
    });
  }

  renderESignatures=function(){
    const filtered=v22FilteredEnvelopes();
    const rows=filtered.length?filtered.map(e=>`<tr class="clickable" data-action="open-envelope" data-id="${e.id}" tabindex="0"><td class="table-primary">${escapeHTML(e.id)}<small>${escapeHTML(e.subject)}</small></td><td><button class="text-link" data-action="open-signature-studio" data-id="${e.documentId}" data-envelope="${e.id}">${escapeHTML(e.document)}</button></td><td><div class="v22-signer-summary"><span class="v22-signer-stack">${e.recipients.slice(0,4).map(r=>personAvatar(r[0])).join('')}</span><span><strong>${e.recipients.length} signer${e.recipients.length===1?'':'s'}</strong><small>${escapeHTML(e.recipients.map(r=>r[0]).join(', '))}</small></span></div></td><td><div class="inline-progress">${progressBar(e.progress)}<span>${e.progress}%</span></div></td><td>${statusPill(e.status)}</td><td>${escapeHTML(e.sent)}</td><td>${escapeHTML(e.expires)}</td><td><div class="row-actions">${button('Open','open-envelope','compact','eye',`data-id="${e.id}"`)}${button('Activity','activity-menu','ghost compact','clock',`data-context="envelope" data-id="${e.id}"`)}</div></td></tr>`).join(''):`<tr><td colspan="8"><div class="v22-empty-state compact">${icon('edit')}<strong>No envelopes match these filters</strong><p>Try another signer, document or status.</p></div></td></tr>`;
    return `${pageHeader('E-Signatures','Simple, controlled electronic execution with signing order, consent evidence and completion certificates.',`${button('Signature templates','signature-templates','','layers')}${button('New envelope','new-signature-envelope','primary','edit')}`,'Reporting & Records')}
      <section class="signature-summary section-gap"><div class="signature-summary-card"><span class="signature-orb">${icon('send')}</span><div><strong>${signatureEnvelopes.filter(e=>e.status!=='Completed').length}</strong><small>Active envelopes</small></div></div><div class="signature-summary-card"><span class="signature-orb success">${icon('check')}</span><div><strong>${signatureEnvelopes.filter(e=>e.status==='Completed').length}</strong><small>Completed this month</small></div></div><div class="signature-summary-card"><span class="signature-orb warning">${icon('clock')}</span><div><strong>${signatureEnvelopes.filter(e=>e.status==='Waiting for others'||e.status==='In progress').length}</strong><small>Awaiting recipients</small></div></div><div class="signature-summary-card"><span class="signature-orb danger">${icon('alert')}</span><div><strong>${signatureEnvelopes.filter(e=>e.status==='Action required').length}</strong><small>Action required</small></div></div></section>
      <section class="card table-card section-gap"><div class="table-toolbar"><div class="table-title-row"><h3>Signature Envelopes</h3><span class="table-badge">${filtered.length} visible · signer photos shown</span></div><div class="table-tools"><label class="table-search">${icon('search')}<input data-input-action="v22-signature-search" value="${escapeHTML(state.v22SignatureSearch)}" placeholder="Search envelope, document or signer"></label>${button(state.v22SignatureStatus==='All statuses'?'Status':state.v22SignatureStatus,'signature-filters','','filter')}</div></div><div class="table-wrap"><table><thead><tr><th>Envelope / Subject</th><th>Document</th><th>Recipients</th><th>Progress</th><th>Status</th><th>Sent</th><th>Expires</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  };

  function v22ShowSignatureFilters(trigger){
    const statuses=['All statuses',...new Set(signatureEnvelopes.map(e=>e.status))];
    showPopover(trigger,`<div class="v22-filter-popover"><div class="popover-title">Signature filters</div><label><span>Status</span><select data-change-action="v22-signature-status">${statuses.map(value=>v22Option(value,state.v22SignatureStatus)).join('')}</select></label><div class="v22-popover-actions">${button('Clear','v22-clear-signature-filters','','refresh')}${button('Done','close-popover','primary','check')}</div></div>`,300);
  }

  const v22BaseShowPopover=showPopover;
  showPopover=function(anchor,html,width=310){
    if(!anchor?.getBoundingClientRect)return v22BaseShowPopover(anchor,html,width);
    const viewportPad=10; const safeWidth=Math.min(width,window.innerWidth-viewportPad*2);
    const rect=anchor.getBoundingClientRect();
    const left=Math.min(window.innerWidth-safeWidth-viewportPad,Math.max(viewportPad,rect.right-safeWidth));
    const below=window.innerHeight-rect.bottom-viewportPad; const above=rect.top-viewportPad;
    const maxHeight=Math.max(180,Math.min(520,Math.max(below,above)));
    let top=below>=Math.min(360,maxHeight)?rect.bottom+7:Math.max(viewportPad,rect.top-maxHeight-7);
    top=Math.min(window.innerHeight-90,Math.max(viewportPad,top));
    const popoverKind=(anchor.dataset.action||'menu').replace(/[^a-z0-9-]/gi,'');
    popoverLayer.innerHTML=`<div class="popover popover-${popoverKind} v22-responsive-popover" style="left:${left}px;top:${top}px;width:${safeWidth}px;max-height:${maxHeight}px">${html}</div>`;
    popoverLayer.style.pointerEvents='auto'; state.popover=true; renderStaticIcons(popoverLayer);
  };

  function v22ShowBankDetails(){
    showModal('Bank Instructions','Controlled payment details · masked by default',`<div class="v22-bank-detail"><div class="reason-item">${icon('shield')}<div><strong>Restricted financial information</strong><small>Full account identifiers should only be returned by the backend after permission and purpose checks.</small></div></div><div class="info-list section-gap"><div class="info-row"><span>Bank</span><strong>CBZ Bank</strong></div><div class="info-row"><span>Account name</span><strong>Matanho Growth Fund II</strong></div><div class="info-row"><span>Account identifier</span><strong>•••• •••• 5678</strong></div><div class="info-row"><span>SWIFT / BIC</span><strong>COBZZWHA</strong></div><div class="info-row"><span>Currency</span><strong>USD</strong></div><div class="info-row"><span>Evidence status</span><strong>${statusPill('Verified','success')}</strong></div></div></div>`,`${button('Close','close-modal')}${button('Copy masked details','v22-copy-bank-details','primary','copy')}`,{variant:'operations',size:'md',eyebrow:'Payment instructions'});
  }

  function v22ShowResolution(){
    showModal('Board / IC Resolution','Controlled decision record',`<div class="v22-resolution"><div class="v22-resolution-head"><span>RES-IC-2026-014</span>${statusPill('Approved with conditions','success')}</div><h2>Approval of Investment in Nova Analytics Ltd — Series B</h2><p>The committee approves the proposed investment subject to completion of the documented conditions precedent and final legal execution.</p><div class="grid cols-2 section-gap"><div class="card"><div class="card-body info-list"><div class="info-row"><span>Meeting</span><strong>28 May 2026</strong></div><div class="info-row"><span>Quorum</span><strong>6 / 7 members</strong></div><div class="info-row"><span>Decision</span><strong>Approved with conditions</strong></div><div class="info-row"><span>Execution</span><strong>In progress</strong></div></div></div><div class="card"><div class="card-body"><strong>Conditions</strong><ol class="v22-resolution-list"><li>Complete regulatory confirmation.</li><li>Finalise shareholders agreement.</li><li>Confirm first-tranche disbursement readiness.</li></ol></div></div></div></div>`,`${button('Download PDF','generic-action','','download')}${button('Close','close-modal','primary')}`,{variant:'document',size:'lg',eyebrow:'Governance decision'});
  }

  function v22PreviewCapitalCall(id){
    const call=capitalCalls.find(item=>item.id===id)||capitalCalls[0];
    showModal('Capital Call Preview',`${call.id} · ${call.fund}`,`<article class="v22-premium-call"><div class="v15-paper-head"><div class="v15-paper-brand">matanho<small>Investment Management ERP</small></div><div class="v15-paper-docmeta">CAPITAL CALL NOTICE<br>${escapeHTML(call.id)}<br>Controlled copy</div></div><div class="v15-paper-kicker">Investor notice</div><h1>${escapeHTML(call.fund)}</h1><p class="lead">Capital call notice prepared for authorised limited partners.</p><div class="v15-paper-summary"><div><small>Call amount</small><strong>${formatMoney(call.amount)}</strong></div><div><small>Due date</small><strong>${escapeHTML(call.dueDate||call.due||'Configured due date')}</strong></div><div><small>Status</small><strong>${escapeHTML(call.status)}</strong></div><div><small>Approval</small><strong>${escapeHTML(call.approval||'Approved')}</strong></div></div><section class="v15-paper-section"><header><span>01</span><h2>Funding instructions</h2></header><p>Please remit the called capital in accordance with the approved fund documents and the verified bank instructions available in the secure portal.</p></section><section class="v15-paper-section"><header><span>02</span><h2>Control evidence</h2></header><table class="v15-paper-table"><tbody><tr><td>Source record</td><td><strong>${escapeHTML(call.id)}</strong></td></tr><tr><td>Prepared by</td><td><strong>${escapeHTML(call.owner||'Investor Relations')}</strong></td></tr><tr><td>Distribution</td><td><strong>Secure email · LP portal</strong></td></tr></tbody></table></section></article>`,`${button('Download PDF','download-call-pack','','download',`data-id="${call.id}"`)}${button('Close','close-modal','primary')}`,{variant:'document',size:'lg',eyebrow:'Capital activity'});
  }

  const v22BaseHandleChangeAction=handleChangeAction;
  handleChangeAction=function(action,target){
    switch(action){
      case 'v22-vault-classification': state.v22VaultClassification=target.value; render(); return;
      case 'v22-vault-status': state.v22VaultStatus=target.value; render(); return;
      case 'report-vault-fund': state.reportFilterFund=target.value; render(); return;
      case 'report-vault-type': state.v22ReportType=target.value; render(); return;
      case 'report-vault-status': state.reportFilterStatus=target.value; render(); return;
      case 'report-vault-period': state.v22ReportPeriod=target.value; render(); return;
      case 'v22-signature-status': state.v22SignatureStatus=target.value; render(); return;
      default: return v22BaseHandleChangeAction(action,target);
    }
  };

  const v22BaseHandleAction=handleAction;
  handleAction=function(action,trigger,event){
    switch(action){
      case 'vault-upload': v22UploadDocuments(); return;
      case 'vault-filter-folder': state.v22VaultFolder=trigger.dataset.folder||'all'; render(); return;
      case 'document-vault-filters': v22ShowDocumentFilters(trigger); return;
      case 'toggle-vault-view': state.v22VaultView=state.v22VaultView==='list'?'grid':'list'; render(); return;
      case 'v22-clear-vault-filters': state.v22VaultFolder='all';state.v22VaultSearch='';state.v22VaultClassification='All classifications';state.v22VaultStatus='All statuses';closeOverlays();render();return;
      case 'document-page': v22SetDocumentPage(trigger.dataset.page); return;
      case 'document-zoom': v22ZoomDocument(trigger,10); return;
      case 'signature-zoom': v22ZoomDocument(trigger,10); return;
      case 'v22-document-inspector-tab': v22DocumentInspector(trigger.dataset.tab||'details'); return;
      case 'close-popover': closeOverlays(); return;
      case 'signature-filters': v22ShowSignatureFilters(trigger); return;
      case 'v22-clear-signature-filters': state.v22SignatureStatus='All statuses';state.v22SignatureSearch='';closeOverlays();render();return;
      case 'v22-clear-report-filters': state.reportFilterFund='All Funds';state.reportFilterStatus='All Statuses';state.v22ReportType='All report types';state.v22ReportPeriod='All periods';state.v22ReportSearch='';render();return;
      case 'view-bank-details': v22ShowBankDetails(); return;
      case 'v22-copy-bank-details': navigator.clipboard?.writeText('CBZ Bank · Matanho Growth Fund II · ••••5678 · COBZZWHA'); toast('Copied','Masked bank instructions copied to the clipboard.'); return;
      case 'view-resolution': v22ShowResolution(); return;
      case 'preview-capital-call': v22PreviewCapitalCall(trigger.dataset.id); return;
      case 'download-call-pack': { const call=capitalCalls.find(item=>item.id===trigger.dataset.id)||capitalCalls[0]; downloadBlob(`${call.id}_capital_call_pack.pdf`,createSimplePdf(`Capital Call ${call.id}`,[`Fund: ${call.fund}`,`Amount: ${formatMoney(call.amount)}`,`Status: ${call.status}`,`Approval: ${call.approval||'Approved'}`])); return; }
      case 'request-signatures': v21ShowESign(state.selectedDocumentId||'DOC-009',state.selectedEnvelopeId,null); return;
      case 'performance-tab': state.fundReportingView=(trigger.textContent||'Performance').trim(); navigate('fund-performance'); return;
      case 'permissions-matrix': state.settingsTab='roles'; navigate('settings'); return;
      case 'select-screened-deal': { const deal=deals.find(item=>item.id===trigger.dataset.id); if(deal)openDeal(deal.id); else softFocus(trigger); return; }
      default: return v22BaseHandleAction(action,trigger,event);
    }
  };

  let v22InputTimer=null;
  document.addEventListener('input',event=>{
    const target=event.target; const action=target?.dataset?.inputAction;
    if(!['v22-document-search','v22-report-search','v22-signature-search'].includes(action))return;
    if(action==='v22-document-search')state.v22VaultSearch=target.value;
    if(action==='v22-report-search')state.v22ReportSearch=target.value;
    if(action==='v22-signature-search')state.v22SignatureSearch=target.value;
    clearTimeout(v22InputTimer);
    const caret=target.selectionStart; const value=target.value;
    v22InputTimer=setTimeout(()=>{render();requestAnimationFrame(()=>{const next=document.querySelector(`[data-input-action="${action}"]`);if(next){next.focus();next.value=value;try{next.setSelectionRange(caret,caret);}catch(e){}}});},90);
  });

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&(state.modal||state.drawer||state.popover||state.commandPalette)){event.preventDefault();closeOverlays();}
    if((event.key==='Enter'||event.key===' ')&&event.target?.matches?.('[data-action][tabindex="0"]')){event.preventDefault();event.target.click();}
  });


  /* V22.1 — core cash-operation buttons that previously fell back to generic focus */
  function v22ShowReservationForm(){
    showModal('Request Cash Reservation','Reserve eligible settled cash without changing the posted ledger.',`<form id="v22ReservationForm"><div class="form-grid"><div class="form-field"><label class="required">Fund</label><select name="fund" required>${funds.map(f=>`<option>${escapeHTML(f.name)}</option>`).join('')}</select></div><div class="form-field"><label class="required">Cash account</label><select name="account" required>${cashAccounts.map(a=>`<option value="${a.id}">${a.id} · ${escapeHTML(a.masked)} · ${a.currency}</option>`).join('')}</select></div><div class="form-field full"><label class="required">Beneficiary / counterparty</label><input name="beneficiary" required placeholder="Company, investor or service provider"></div><div class="form-field"><label class="required">Purpose</label><select name="purpose" required><option>INVESTMENT_DISBURSEMENT</option><option>INVESTOR_DISTRIBUTION</option><option>FUND_EXPENSE</option><option>TRANSFER</option></select></div><div class="form-field"><label class="required">Amount</label><input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00"></div><div class="form-field"><label class="required">Required date</label><input name="required" type="date" required value="2026-08-15"></div><div class="form-field"><label class="required">Expiry</label><input name="expiry" type="date" required value="2026-08-20"></div><div class="form-field full"><label>Source event / reason</label><input name="source" value="MANUAL-RESERVATION-REQUEST"></div></div><div class="reason-item section-gap">${icon('shield')}<div><strong>Maker-checker control</strong><small>The request is created as REQUESTED and does not reduce availability until approved under the configured authority matrix.</small></div></div></form>`,`${button('Cancel','close-modal')}${button('Submit request','v22-submit-reservation','primary','lock')}`,{variant:'wizard',size:'lg',rail:['Ownership','Purpose','Availability','Approval'],eyebrow:'Cash reservation'});
  }

  function v22SubmitReservation(){
    const form=$('#v22ReservationForm'); if(!form?.reportValidity())return;
    const data=Object.fromEntries(new FormData(form));
    const account=cashAccounts.find(a=>a.id===data.account)||cashAccounts[0];
    const amount=Number(data.amount);
    if(amount>account.deployable){toast('Insufficient deployable cash',`Requested ${formatMoney(amount,account.currency)} exceeds ${formatMoney(account.deployable,account.currency)} available under the current rule.`, 'warning');return;}
    const id=`RSV-${String(100+cashReservations.length).padStart(5,'0')}`;
    cashReservations.unshift({id,source:data.source||`RES-${id}`,fund:data.fund,vehicle:account.vehicle,account:account.id,beneficiary:data.beneficiary,amount,remaining:amount,required:data.required,expiry:data.expiry,purpose:data.purpose,status:'REQUESTED',owner:v11RoleMember().name,approval:'Pending checker'});
    closeOverlays();toast('Reservation requested',`${id} was created and routed to an independent checker.`);render();
  }

  function v22ShowExceptionForm(){
    showModal('Create Reconciliation Exception','Create an owned, evidence-linked investigation without altering the source records.',`<form id="v22ExceptionForm"><div class="form-grid"><div class="form-field"><label class="required">Batch</label><select name="batch" required>${reconciliationBatches.map(b=>`<option value="${b.id}">${b.id} · ${escapeHTML(b.account)}</option>`).join('')}</select></div><div class="form-field"><label class="required">Category</label><select name="code" required><option>UNMATCHED_EXTERNAL</option><option>UNMATCHED_INTERNAL</option><option>AMOUNT_VARIANCE</option><option>DATE_VARIANCE</option><option>DUPLICATE_SOURCE</option><option>MISSING_STATEMENT</option><option>SUSPENSE_ITEM</option></select></div><div class="form-field"><label>Amount</label><input name="amount" type="number" step="0.01" value="0"></div><div class="form-field"><label>Severity</label><select name="severity"><option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option></select></div><div class="form-field"><label>Owner</label><input name="owner" value="${escapeHTML(v11RoleMember().name)}"></div><div class="form-field"><label>Due date</label><input name="due" type="date" value="2026-08-16"></div><div class="form-field full"><label class="required">Investigation / remediation</label><textarea name="resolution" required placeholder="Describe what needs to be investigated or resolved"></textarea></div></div><div class="reason-item section-gap">${icon('link')}<div><strong>Source records remain immutable</strong><small>The exception links to the affected batch and evidence; resolution does not edit the underlying bank statement or posted journal.</small></div></div></form>`,`${button('Cancel','close-modal')}${button('Create exception','v22-submit-exception','primary','plus')}`,{variant:'operations',size:'lg',eyebrow:'Reconciliation investigation'});
  }

  function v22SubmitException(){
    const form=$('#v22ExceptionForm'); if(!form?.reportValidity())return;
    const data=Object.fromEntries(new FormData(form)); const batch=reconciliationBatches.find(b=>b.id===data.batch)||reconciliationBatches[0];
    const id=`EXC-${String(500+reconciliationExceptions.length).padStart(5,'0')}`;
    reconciliationExceptions.unshift({id,batch:batch.id,code:data.code,account:batch.account.split(' ')[0],amount:Number(data.amount||0),currency:batch.currency,severity:data.severity,owner:data.owner,age:0,due:data.due,status:'OPEN',evidence:0,resolution:data.resolution});
    closeOverlays();toast('Exception created',`${id} is open and assigned to ${data.owner}.`);render();
  }

  function v22ShowAccountSetup(){
    showModal('Account Mappings & Configuration','Effective-dated provider, currency, tolerance and GL-control mappings.',`<div class="v22-config-grid"><section class="card table-card"><div class="table-toolbar"><div><h3>Approved account mappings</h3><p>External accounts map to one authorised fund / vehicle / purpose / currency context.</p></div>${statusPill('Effective dated','info')}</div><div class="table-wrap"><table><thead><tr><th>Account</th><th>Provider</th><th>Purpose</th><th>Currency</th><th>Tolerance</th><th>GL mapping</th><th>Status</th></tr></thead><tbody>${cashAccounts.map(a=>`<tr data-action="open-cash-account" data-id="${a.id}"><td class="table-primary">${a.id}<small>${escapeHTML(a.masked)}</small></td><td>${escapeHTML(a.provider)}</td><td>${escapeHTML(a.purpose)}</td><td>${a.currency}</td><td>${formatMoney(a.tolerance,a.currency)}</td><td>${escapeHTML(a.gl)}</td><td>${statusPill(a.status)}</td></tr>`).join('')}</tbody></table></div></section><section class="grid cols-3 section-gap"><div class="card"><div class="card-body info-list"><div class="info-row"><span>Maker-checker</span><strong>Required</strong></div><div class="info-row"><span>Duplicate mapping</span><strong>Blocked</strong></div></div></div><div class="card"><div class="card-body info-list"><div class="info-row"><span>Default timezone</span><strong>Africa/Harare</strong></div><div class="info-row"><span>Currency netting</span><strong>Disabled</strong></div></div></div><div class="card"><div class="card-body info-list"><div class="info-row"><span>Configuration history</span><strong>Retained</strong></div><div class="info-row"><span>Audit status</span><strong>Current</strong></div></div></div></section></div>`,`${button('Close','close-modal')}${button('Open settings','navigate','primary','settings','data-page="settings"')}`,{variant:'operations',size:'xl',eyebrow:'Cash account setup'});
  }

  function v22ShowLedgerTrace(){
    const journal=cashJournals[0];
    showModal('Source-to-Ledger Trace',`${journal.id} · ${journal.event}`,`<div class="source-lineage-wide"><div>${icon('briefcase')}<span><small>Source event</small><strong>${escapeHTML(journal.source)} · ${escapeHTML(journal.event)}</strong></span></div><i>${icon('arrow-right')}</i><div>${icon('list')}<span><small>Journal</small><strong>${escapeHTML(journal.id)} · ${escapeHTML(journal.status)}</strong></span></div><i>${icon('arrow-right')}</i><div>${icon('bank')}<span><small>Cash account</small><strong>${escapeHTML(journal.account)} · ${escapeHTML(journal.valueDate)}</strong></span></div><i>${icon('arrow-right')}</i><div>${icon('link')}<span><small>Reconciliation</small><strong>${journal.reconciled?formatMoney(journal.reconciled):'Open residual'}</strong></span></div></div><section class="grid cols-2 section-gap"><div class="card"><div class="card-body info-list"><div class="info-row"><span>Debit</span><strong>${formatMoney(journal.debit)}</strong></div><div class="info-row"><span>Credit</span><strong>${formatMoney(journal.credit)}</strong></div><div class="info-row"><span>Cash effect</span><strong>${formatMoney(journal.signed)}</strong></div></div></div><div class="card"><div class="card-body info-list"><div class="info-row"><span>Maker</span><strong>${escapeHTML(journal.maker)}</strong></div><div class="info-row"><span>Checker</span><strong>${escapeHTML(journal.checker)}</strong></div><div class="info-row"><span>Accounting</span><strong>${escapeHTML(journal.accounting)}</strong></div></div></div></section>`,`${button('Download evidence','download-journal-evidence','','download',`data-id="${journal.id}"`)}${button('Close','close-modal','primary')}`,{variant:'operations',size:'lg',eyebrow:'Immutable transaction lineage'});
  }

  function v22ShowSlaView(){
    const buckets=[['0–1 day',reconciliationExceptions.filter(e=>e.age<=1).length],['2–3 days',reconciliationExceptions.filter(e=>e.age>=2&&e.age<=3).length],['4–5 days',reconciliationExceptions.filter(e=>e.age>=4&&e.age<=5).length],['6+ days',reconciliationExceptions.filter(e=>e.age>=6).length]];
    showModal('Exception SLA & Ageing','Operational ageing by open reconciliation case.',`<div class="grid cols-2"><section class="card"><div class="card-head"><div><h3>Ageing distribution</h3><p>Open cases by elapsed age.</p></div></div><div class="card-body"><div class="close-trend-chart v22-sla-chart">${buckets.map(([label,value])=>`<button data-action="generic-action"><span style="height:${Math.max(20,value*38)}px"></span><b>${value}</b><small>${label}</small></button>`).join('')}</div></div></section><section class="card"><div class="card-head"><div><h3>Service levels</h3><p>Configured operating thresholds.</p></div></div><div class="card-body info-list"><div class="info-row"><span>Critical</span><strong>1 business day</strong></div><div class="info-row"><span>High</span><strong>2 business days</strong></div><div class="info-row"><span>Medium</span><strong>5 business days</strong></div><div class="info-row"><span>Low</span><strong>10 business days</strong></div></div></section></div><section class="card table-card section-gap"><div class="table-toolbar"><h3>Cases at risk</h3><span class="table-badge">${reconciliationExceptions.filter(e=>e.age>=3).length} aged 3+ days</span></div><div class="table-wrap"><table><thead><tr><th>Case</th><th>Category</th><th>Severity</th><th>Owner</th><th>Age</th><th>Due</th></tr></thead><tbody>${reconciliationExceptions.slice().sort((a,b)=>b.age-a.age).map(e=>`<tr data-action="open-exception" data-id="${e.id}"><td class="table-primary">${e.id}</td><td>${e.code}</td><td>${statusPill(e.severity)}</td><td>${escapeHTML(e.owner)}</td><td>${e.age} days</td><td>${escapeHTML(e.due)}</td></tr>`).join('')}</tbody></table></div></section>`,`${button('Export exceptions','export-exceptions','','download')}${button('Close','close-modal','primary')}`,{variant:'operations',size:'lg',eyebrow:'Exception operations'});
  }

  function v22ShowTableFilter(trigger,title,options){
    state.v22TableFilterContext={title,values:options};
    showPopover(trigger,`<div class="v22-filter-popover"><div class="popover-title">${escapeHTML(title)}</div>${options.map(value=>`<button class="popover-item" data-action="v22-apply-table-filter" data-value="${escapeHTML(value)}">${icon(value==='All'?'layers':'filter')}<span class="popover-item-copy"><strong>${escapeHTML(value)}</strong><small>${value==='All'?'Show every row':'Show rows containing this value'}</small></span></button>`).join('')}</div>`,290);
  }

  function v22ApplyTableTextFilter(value){
    const table=workspace.querySelector('.table-card table'); if(!table)return;
    table.querySelectorAll('tbody tr').forEach(row=>{row.hidden=value!=='All'&&!row.innerText.toLowerCase().includes(value.toLowerCase());});
    const visible=[...table.querySelectorAll('tbody tr')].filter(row=>!row.hidden).length;
    closeOverlays();toast('Table filtered',value==='All'?`${visible} rows visible.`:`${visible} row${visible===1?'':'s'} contain “${value}”.`);
  }

  const v22xBaseActivitySubject=activitySubject;
  activitySubject=function(context,id){
    if(context==='document')return documents.find(item=>item.id===id)||{name:id||'Document'};
    if(context==='report')return reportVaultItems.find(item=>item.id===id)||{name:id||'Report'};
    return v22xBaseActivitySubject(context,id);
  };

  const v22xBaseHandleAction=handleAction;
  handleAction=function(action,trigger,event){
    switch(action){
      case 'create-reservation': v22ShowReservationForm();return;
      case 'v22-submit-reservation': v22SubmitReservation();return;
      case 'create-exception': v22ShowExceptionForm();return;
      case 'v22-submit-exception': v22SubmitException();return;
      case 'download-import-template': exportCSV('matanho_statement_import_error_template.csv',[['line_number','error_code','source_value','explanation','required_action'],['12','ACCOUNT_SCOPE_MISMATCH','••••3372','Account mapping does not match selected fund/vehicle','Select the approved account mapping'],['48','SIGN_AMBIGUITY','125000 DR','Provider sign cannot be normalised confidently','Review the approved provider layout']]);return;
      case 'download-import-errors': {const item=statementImports.find(i=>i.id===trigger.dataset.id)||statementImports[0];exportCSV(`${item.id}_import_errors.csv`,[['line_number','error_code','source_value','explanation','required_action'],['12','ACCOUNT_SCOPE_MISMATCH',item.account,'Account mapping failed the selected scope','Review fund, vehicle and currency mapping'],['48','SIGN_AMBIGUITY','125000 DR','Provider sign is ambiguous','Confirm layout version before commit']]);return;}
      case 'upload-statement': showUploadBankStatementModal();return;
      case 'open-account-setup': v22ShowAccountSetup();return;
      case 'trace-ledger-source': v22ShowLedgerTrace();return;
      case 'exception-sla-view': v22ShowSlaView();return;
      case 'cash-account-filters': v22ShowTableFilter(trigger,'Account filters',['All','USD','ZWG','ACTIVE','SUSPENDED']);return;
      case 'ledger-filters': v22ShowTableFilter(trigger,'Ledger filters',['All','POSTED','PENDING_APPROVAL','Exported','Pending export']);return;
      case 'reconciliation-filters': v22ShowTableFilter(trigger,'Reconciliation filters',['All','USD','ZWG','READY_TO_CLOSE','RECONCILING','BLOCKED']);return;
      case 'exception-filters': v22ShowTableFilter(trigger,'Exception filters',['All','Critical','High','Medium','Low','OPEN','INVESTIGATING']);return;
      case 'v22-apply-table-filter': v22ApplyTableTextFilter(trigger.dataset.value||'All');return;
      default:return v22xBaseHandleAction(action,trigger,event);
    }
  };


  /* V22.2 — uploaded-document integrity and exception drill-down */
  uploadDocuments=function(fileList){
    const files=Array.from(fileList||[]); if(!files.length)return;
    const folder=state.v22VaultFolder&&state.v22VaultFolder!=='all'?state.v22VaultFolder:(state.selectedFolder&&state.selectedFolder!=='All Documents'?state.selectedFolder:'General');
    files.forEach(file=>{
      const ext=(file.name.split('.').pop()||'FILE').toUpperCase();
      documents.push({id:`DOC-${String(documents.length+1).padStart(3,'0')}`,name:file.name,type:ext,version:'v1.0',owner:v11RoleMember().name,uploaded:'13 Aug 2026',status:'In review',access:'Internal',folder,classification:'Internal confidential',signatureStatus:/PDF|DOC|DOCX/.test(ext)?'Not required':'Not required',retention:'Fund life + 10 years',size:file.size>1048576?`${(file.size/1048576).toFixed(1)} MB`:`${Math.max(1,Math.round(file.size/1024))} KB`,pages:/PDF|DOC|DOCX/.test(ext)?6:1});
    });
    state.selectedDocumentId=documents[documents.length-files.length].id; state.v22VaultFolder=folder; closeOverlays();toast('Files uploaded',`${files.length} file${files.length===1?'':'s'} added to ${folder}.`);render();
  };

  const v22fBaseHandleAction=handleAction;
  handleAction=function(action,trigger,event){
    if(action==='open-exception'){showExceptionDetail(trigger.dataset.id);return;}
    return v22fBaseHandleAction(action,trigger,event);
  };


  function __pv11ClearFixtures() {
    const cols = [funds, companies, deals, capitalCalls, lps, reports, documents, cashAccounts, cashJournals, cashReservations, statementImports, reconciliationBatches, reconciliationExceptions, reportVaultItems, signatureEnvelopes, mailerLists];
    cols.forEach((c) => { if (Array.isArray(c)) c.splice(0, c.length); });
  }
  function __pv11BeginLiveLoad() {
    try { rootEl.classList.add('is-hydrating'); } catch (_) {}
    __pv11ClearFixtures();
    if (typeof render === 'function') render();
  }
  function __pv11FailLiveLoad(message) {
    try { rootEl.classList.remove('is-hydrating'); rootEl.classList.add('is-host-error'); } catch (_) {}
    if (typeof toast === 'function') toast('Live data failed', message || 'Could not load portfolio data.', 'error');
  }
  function __pv11SetActionBusy(busy, message, actionName) {
    try {
      rootEl.classList.toggle('is-action-busy', Boolean(busy));
      let banner = rootEl.querySelector('.pv11-action-busy-banner');
      if (busy) {
        if (!banner) {
          banner = document.createElement('div');
          banner.className = 'pv11-action-busy-banner';
          rootEl.appendChild(banner);
        }
        banner.textContent = message || (actionName ? ('Working: ' + actionName) : 'Working…');
      } else if (banner) banner.remove();
    } catch (_) {}
  }
  window.MatanhoPortfolioUI = Object.freeze({
    version: '25.0.0',
    hydrate: function(payload) {
      try { rootEl.classList.remove('is-hydrating', 'is-host-error'); } catch (_) {}
      return hydrateFromBackend(payload);
    },
    beginLiveLoad: __pv11BeginLiveLoad,
    failLiveLoad: __pv11FailLiveLoad,
    setActionBusy: __pv11SetActionBusy,
    notify: function(title, body, tone) { if (typeof toast === 'function') toast(title, body || '', tone || 'info'); },
    closeOverlays: function() { if (typeof closeOverlays === 'function') closeOverlays(); },
    setDealTab: function(tab) { if (tab) { state.dealTab = tab; render(); } },
    setDealDetail: function(detail) {
      if (!detail || typeof detail !== 'object') return;
      if (detail.selectedDealId != null) state.selectedDealId = detail.selectedDealId;
      if (detail.dealDetail != null) state.dealDetail = detail.dealDetail;
      Object.assign(state, detail);
      render();
    },
    setDealDetailLoading: function(loading) {
      state.dealDetailLoading = Boolean(loading);
      try { rootEl.classList.toggle('is-deal-loading', Boolean(loading)); } catch (_) {}
      render();
    },
    setInvestmentUsers: function(users) { state.investmentUsers = Array.isArray(users) ? users : []; },
    openDdTaskModal: function(users) {
      if (Array.isArray(users)) state.investmentUsers = users;
      if (typeof showAssignDdTaskModal === 'function') showAssignDdTaskModal();
      else if (typeof toast === 'function') toast('Assign DD task', 'Open Due Diligence on the deal to assign tasks.');
    },
    getSnapshot: publicSnapshot,
    render,
    navigate,
    openDeal,
    openCompany,
    openFund,
    openLP,
    openCapitalCall,
    setTheme(theme) { if (theme === 'light' || theme === 'dark') { state.theme = theme; render(); } },
    setSidebarCollapsed(collapsed) { state.sidebarCollapsed = Boolean(collapsed); render(); },
    setRole(roleId) { if (v11RoleDefinitions[roleId]) { state.currentRole = roleId; render(); } },
    getRoles() { return cloneForIntegration(Object.values(v11RoleDefinitions)); },
    canRead(page) { return v11CanRead(page); },
    canWrite(page) { return v11CanWrite(page); }
  });

  emitIntegrationEvent('matanho:ui-ready', publicSnapshot());
  render();


  if (liveOnly && typeof __pv11ClearFixtures === 'function') {
    __pv11ClearFixtures();
  }

  if (typeof state !== 'undefined' && initialPage) {
    state.page = initialPage;
  }

  if (typeof render === 'function') render();

  api = {
    setPage(page, detail = {}) {
      if (detail && typeof detail === 'object') {
        if (detail.selectedDealId != null) state.selectedDealId = detail.selectedDealId;
        if (detail.selectedCompanyId != null) state.selectedCompanyId = detail.selectedCompanyId;
        if (detail.selectedFundId != null) state.selectedFundId = detail.selectedFundId;
        if (detail.selectedLPId != null) state.selectedLPId = detail.selectedLPId;
        if (detail.selectedCapitalCallId != null) state.selectedCapitalCallId = detail.selectedCapitalCallId;
      }
      state.page = page;
      state.mobileNavOpen = false;
      render();
    },
    hydrate: (payload) => {
      if (window.MatanhoPortfolioUI && typeof window.MatanhoPortfolioUI.hydrate === 'function') {
        return window.MatanhoPortfolioUI.hydrate(payload);
      }
      return hydrateFromBackend(payload);
    },
    beginLiveLoad: window.MatanhoPortfolioUI && window.MatanhoPortfolioUI.beginLiveLoad,
    failLiveLoad: window.MatanhoPortfolioUI && window.MatanhoPortfolioUI.failLiveLoad,
    destroy() {
      try { __pv11Abort.abort(); } catch (_) {}
      delete window.__PORTFOLIO_V11_NAV__;
      try { delete window.MatanhoPortfolioUI; } catch (_) {}
      rootEl.innerHTML = '';
    },
  };

  return api;
}
