/* Auto-extracted Matanho V17.1 runtime — adapted for Home Version 3 */
import { clientDesignSignOut } from "@/components/client-design-mock/runtime-auth";
export function startMatanhoRuntime(rootEl, options = {}) {
  const initialRoute = options.initialRoute || "home";
  window.__HOME_V3_NAV__ = options.onNavigate || (() => {});
  if (typeof options.onSignOut === "function") {
    window.__HOME_V3_SIGN_OUT__ = options.onSignOut;
  }
  window.MATANHO_DATA = options.data;
  window.MATANHO_CONFIG = options.config || { useMockData: true, apiBaseUrl: "" };

  rootEl.innerHTML = "";
  const app = document.createElement("div");
  app.id = "app";
  const portal = document.createElement("div");
  portal.id = "portal";
  rootEl.appendChild(app);
  rootEl.appendChild(portal);

  let api = { setRoute() {}, destroy() {} };
  const __hv3Abort = new AbortController();
  const __hv3Sig = { signal: __hv3Abort.signal };
  let wallpaperRotationTimer = null;
  let lastRotationIndex = null;

  'use strict';

  const D = window.MATANHO_DATA;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('matanho-hub-state') || '{}'); } catch (_) { saved = {}; }
  const state = {
    route: initialRoute || 'home',
    mobileNav: false,
    sidebarCollapsed: saved.sidebarCollapsed || false,
    calendarDetailsOpen: saved.calendarDetailsOpen ?? true,
    calendarSelectedEvent: saved.calendarSelectedEvent || 2,
    calendarSources: saved.calendarSources || [true,true,true,true,false],
    heroOffset: Number.isFinite(saved.heroOffset) ? saved.heroOffset : 0,
    settings: saved.settings || {
      language:'English (UK)', timezone:'CAT — Harare', density:'comfortable', saturation:118,
      glass:true, motion:true, autoHero:true, calendarAlerts:true, newsDigest:true,
      forumMentions:true, performanceReminders:true, profileVisibility:'Organisation', usageAnalytics:true
    },
    priorities: saved.priorities || D.priorities.map(x => ({...x})),
    workTasks: saved.workTasks || D.workTasks.map(x => ({...x})),
    workProjects: saved.workProjects || D.workProjects.map(x => ({...x})),
    workMode: saved.workMode || 'My work',
    workProject: saved.workProject || 'all',
    workFilter: saved.workFilter || 'All tasks',
    workSearch: saved.workSearch || '',
    newsletterStudioPanel: saved.newsletterStudioPanel || 'canvas',
    apps: saved.apps || D.apps.map(x => ({...x})),
    selectedPerson: saved.selectedPerson || 'nyasha',
    selectedNews: null,
    newsFilter: 'Top stories',
    performanceTab: 'Overview',
    scorecardPerspective: saved.scorecardPerspective || 'Financial & Portfolio',
    profileTab: saved.profileTab || 'Overview',
    profileAvailability: saved.profileAvailability || 'Available',
    profileSkills: saved.profileSkills || [
      {name:'Financial modelling',endorsements:23},{name:'Market research',endorsements:18},{name:'Risk analysis',endorsements:15},{name:'Valuation',endorsements:12},{name:'ESG analysis',endorsements:9}
    ],
    profileDocuments: saved.profileDocuments || [
      {name:'CFA Investment Foundations.pdf',category:'Certification',size:'1.8 MB',status:'Verified',updated:'14 Jul 2026',icon:'learning'},
      {name:'Executive biography.docx',category:'Profile document',size:'284 KB',status:'Current',updated:'09 Jul 2026',icon:'newsletter'},
      {name:'MSc Finance certificate.pdf',category:'Education',size:'2.4 MB',status:'Verified',updated:'12 Jun 2026',icon:'learning'},
      {name:'Professional headshot.jpg',category:'Profile media',size:'3.1 MB',status:'Current',updated:'28 May 2026',icon:'profile'}
    ],
    profilePreferences: saved.profilePreferences || {focusHours:'14:00 – 16:00 CAT',preferredContact:'Microsoft Teams',officeDays:'Tuesday – Thursday',timezone:'CAT (Harare)',showAvailability:true,shareSkills:true,showProjects:true,discoverable:true},
    newsletterMode: 'library',
    selectedNewsletter: 1,
    newsletterRole: saved.newsletterRole || 'Publisher',
    newsletterLists: saved.newsletterLists || [
      {id:'all-employees',name:'All employees',type:'Internal',members:128,owner:'People & Culture'},
      {id:'investments',name:'Investment team',type:'Internal',members:32,owner:'Investments'},
      {id:'leadership',name:'Leadership circle',type:'Internal',members:12,owner:'Executive Office'},
      {id:'partners',name:'Quarterly partner update',type:'External',members:46,owner:'Client Relations'}
    ],
    newsletterShares: saved.newsletterShares || [],
    forumThread: null,
    forumComments: saved.forumComments || {},
    appAccessRequests: saved.appAccessRequests || [
      {appId:'analytics',status:'Pending',submitted:'29 Jul 2026',reason:'Quarterly performance reporting'}
    ],
    leaveBalance: Number.isFinite(saved.leaveBalance) ? saved.leaveBalance : 18.5,
    performancePeriod: 'Q3 2026',
    cover: {...{theme:'Porcelain',wallpaper:'auto',style:'Editorial Mono',mood:'Deep Focus',intention:'Make complex things feel simple.',priorities:true,focus:true,goals:true,weather:true}, ...(saved.cover||{})},
    daySession: {...{active:false,paused:false,taskId:'none',status:'Focus mode',durationMinutes:50,startedAt:null,pausedRemaining:null}, ...(saved.daySession||{})},
    notificationsOpen: false,
    profileOpen: false,
    requests: saved.requests || [
      { id:'SRV-2026-1047', service:'Annual leave', submitted:'15 Jul 2026', owner:'Nyasha Moyo', status:'In progress', next:'Manager approval' },
      { id:'SRV-2026-1038', service:'Laptop replacement', submitted:'10 Jul 2026', owner:'Tawanda Kasere', status:'In progress', next:'IT to assign device' },
      { id:'SRV-2026-1022', service:'Expense claim', submitted:'07 Jul 2026', owner:'Rudo Maposa', status:'Pending', next:'Provide receipt' },
      { id:'SRV-2026-0996', service:'Training enrolment', submitted:'01 Jul 2026', owner:'Farai Dube', status:'Completed', next:'View certificate' }
    ],
    aiMessages: saved.aiMessages || [],
    aiMode: saved.aiMode || 'ask',
    aiScope: saved.aiScope || 'All connected work',
    aiContextOpen: saved.aiContextOpen ?? false,
    aiContextSources: saved.aiContextSources || {work:true,calendar:true,documents:true,forums:true,news:true,people:true},
    aiSaved: saved.aiSaved || [],
    aiRecent: saved.aiRecent || [
      {id:'portfolio-review',title:'Portfolio review brief',prompt:'Prepare me for today’s portfolio review',meta:'Today · 09:12'},
      {id:'weekly-priorities',title:'Weekly priorities',prompt:'Summarise my priorities and risks for this week',meta:'Yesterday'},
      {id:'client-update',title:'Client update draft',prompt:'Draft a concise client update for the Zambia mandate',meta:'29 Jul'}
    ],
    aiDraft: saved.aiDraft || {type:'Executive update',audience:'Investment team',subject:'Q3 progress update',body:''},
    newsBookmarks: saved.newsBookmarks || [],
    profile: options.liveSession
      ? {
          ...(saved.profile || {}),
          name: D.user.name,
          role: D.user.role,
          email: D.user.email,
          location: D.user.location || saved.profile?.location || "",
          bio:
            saved.profile?.bio ||
            "Investment leader focused on building disciplined systems, strong teams and durable institutional value.",
        }
      : saved.profile || {
          name: D.user.name,
          role: D.user.role,
          email: D.user.email,
          location: D.user.location,
          bio: "Investment leader focused on building disciplined systems, strong teams and durable institutional value.",
        },
  };
  state.apps = state.apps.map(a => ({...a, hasAccess: a.hasAccess ?? !['procurement','analytics'].includes(a.id)}));
  state.settings = {...{language:'English (UK)',timezone:'CAT — Harare',density:'comfortable',saturation:118,glass:true,motion:true,autoHero:true,calendarAlerts:true,newsDigest:true,forumMentions:true,performanceReminders:true,profileVisibility:'Organisation',usageAnalytics:true}, ...state.settings};
  const heroScenes = [
    {src:'/home/assets/hero-scenes/4k/01-sunlit-bonsai.jpg',tablet:'/home/assets/hero-scenes/1080p/01-sunlit-bonsai.jpg',mobile:'/home/assets/hero-scenes/mobile/01-sunlit-bonsai.jpg',label:'Sunlit bonsai',mood:'Clarity'},
    {src:'/home/assets/hero-scenes/4k/02-quiet-courtyard.jpg',tablet:'/home/assets/hero-scenes/1080p/02-quiet-courtyard.jpg',mobile:'/home/assets/hero-scenes/mobile/02-quiet-courtyard.jpg',label:'Quiet courtyard',mood:'Intention'},
    {src:'/home/assets/hero-scenes/4k/03-morning-serenity.jpg',tablet:'/home/assets/hero-scenes/1080p/03-morning-serenity.jpg',mobile:'/home/assets/hero-scenes/mobile/03-morning-serenity.jpg',label:'Morning serenity',mood:'Focus'},
    {src:'/home/assets/hero-scenes/4k/04-soft-focus-bonsai.jpg',tablet:'/home/assets/hero-scenes/1080p/04-soft-focus-bonsai.jpg',mobile:'/home/assets/hero-scenes/mobile/04-soft-focus-bonsai.jpg',label:'Soft light',mood:'Balance'},
    {src:'/home/assets/hero-scenes/4k/05-minimal-zen.jpg',tablet:'/home/assets/hero-scenes/1080p/05-minimal-zen.jpg',mobile:'/home/assets/hero-scenes/mobile/05-minimal-zen.jpg',label:'Minimal zen',mood:'Perspective'},
    {src:'/home/assets/hero-scenes/4k/06-sand-garden.jpg',tablet:'/home/assets/hero-scenes/1080p/06-sand-garden.jpg',mobile:'/home/assets/hero-scenes/mobile/06-sand-garden.jpg',label:'Sand garden',mood:'Momentum'},
    {src:'/home/assets/hero-scenes/4k/07-evening-stillness.jpg',tablet:'/home/assets/hero-scenes/1080p/07-evening-stillness.jpg',mobile:'/home/assets/hero-scenes/mobile/07-evening-stillness.jpg',label:'Evening stillness',mood:'Reflection'}
  ];
  function wallpaperPool(){
    const custom = D.customWallpapers || [];
    return custom.length ? custom.map(w=>({src:w.url,tablet:w.url,mobile:w.url,label:w.label||'Custom',mood:'',id:w.id})) : heroScenes;
  }
  function currentHeroScene(){
    const wp = String(state.cover.wallpaper);
    if (wp !== 'auto' && wp.startsWith('custom:')) {
      const id = wp.slice(7);
      const found = (D.customWallpapers||[]).find(w=>String(w.id)===id);
      if (found) return {src:found.url,tablet:found.url,mobile:found.url,label:found.label||'Custom',mood:'',index:-1};
    }
    const fixed = wp !== 'auto' && !wp.startsWith('custom:') && Number.isFinite(Number(wp));
    const pool = wallpaperPool();
    if (fixed) {
      const index=((Number(wp))%pool.length+pool.length)%pool.length;
      return {...pool[index],index};
    }
    const intervalMs = Math.max(1, Number(D.rotationIntervalMinutes)||1440) * 60000;
    const tick = Math.floor(Date.now()/intervalMs);
    const base = state.settings.autoHero ? tick : 0;
    const offset = state.heroOffset;
    const index=((base+offset)%pool.length+pool.length)%pool.length;
    return {...pool[index],index};
  }
  function heroAssetForViewport(scene){
    if(window.matchMedia('(max-width:760px)').matches) return scene.mobile;
    if(window.matchMedia('(max-width:1180px)').matches) return scene.tablet;
    return scene.src;
  }
  function preloadHeroScene(scene){
    const primary=new Image();
    primary.decoding='async';
    primary.src=heroAssetForViewport(scene);
    const next=heroScenes[(scene.index+1)%heroScenes.length];
    window.clearTimeout(preloadHeroScene.timer);
    preloadHeroScene.timer=window.setTimeout(()=>{
      const adjacent=new Image();
      adjacent.decoding='async';
      adjacent.src=heroAssetForViewport(next);
    },900);
  }

  const icons = {
    home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-6h6v6"/>',
    cover:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    news:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    newsletter:'<path d="M3 6.5 12 13l9-6.5"/><rect x="3" y="5" width="18" height="14" rx="2"/>',
    forum:'<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    performance:'<path d="M4 19V9M10 19V5M16 19v-8M22 19H2"/>',
    people:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    services:'<path d="M12 3 4 7v5c0 4.5 3.2 7.6 8 9 4.8-1.4 8-4.5 8-9V7z"/><path d="m9 12 2 2 4-4"/>',
    apps:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    sparkles:'<path d="m12 3-1.2 3.8L7 8l3.8 1.2L12 13l1.2-3.8L17 8l-3.8-1.2z"/><path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8zM19 14l-.8 2.2L16 17l2.2.8L19 20l.8-2.2L22 17l-2.2-.8z"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.8 2c-.9.6-1.6 1-1.6 2.3M12 17h.01"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    message:'<path d="M4 5h16v12H8l-4 4z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
    moon:'<path d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5 8.5 8.5 0 1 0 20.5 14.4z"/>',
    sunrise:'<path d="M17 18a5 5 0 0 0-10 0M12 2v6M4.22 10.22l1.42 1.42M18.36 11.64l1.42-1.42M1 18h22M4 22h16"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    down:'<path d="m6 9 6 6 6-6"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    play:'<path d="m8 5 11 7-11 7z"/>',
    pause:'<path d="M9 5v14M15 5v14"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    pin:'<path d="M12 17v5M5 3h14l-3 6v4l2 2H6l2-2V9z"/>',
    location:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    wallet:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 9h18M15 14h3"/>',
    receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    learning:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c2 2 10 2 12 0v-4.5"/>',
    plane:'<path d="M22 2 9 15M22 2l-5 20-4-7-7-4z"/>',
    support:'<path d="M4 13a8 8 0 0 1 16 0v5h-4v-5h4M4 13v5H1v-5z"/><path d="M16 20c-1 1-2 1-4 1"/>',
    building:'<path d="M4 21V4h10v17M14 9h6v12M7 8h4M7 12h4M7 16h4M17 13h1M17 17h1"/>',
    pie:'<path d="M12 3v9h9A9 9 0 1 1 12 3z"/><path d="M15 3.6A9 9 0 0 1 20.4 9H15z"/>',
    calculator:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M7 5h10v4H7zM8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/>',
    folder:'<path d="M3 6h7l2 2h9v11H3z"/>',
    cart:'<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h3l2.4 11.4a2 2 0 0 0 2 1.6H18a2 2 0 0 0 2-1.6L22 7H6"/>',
    more:'<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
    download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    send:'<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
    filter:'<path d="M4 5h16M7 12h10M10 19h4"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
  };

  function icon(name, cls='') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.apps}</svg>`;
  }
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const toneClass = (tone) => `tone-${tone || 'navy'}`;
  const colorByIndex = i => ['blue','sage','sand','coral','teal'][i % 5];
  const avatar = (subject, cls='') => {
    const p = typeof subject === 'object' ? subject : (D.people.find(x=>x.initials===subject) || (D.user.initials===subject ? D.user : null));
    const initials = typeof subject === 'object' ? subject.initials : subject;
    const image = p && p.image;
    return `<div class="avatar ${cls} ${image?'has-photo':''}">${image?`<img src="${image}" alt="${esc(p.name||'Employee')}" loading="lazy"/>`:esc(initials||'')}</div>`;
  };
  function saveState() {
    try { localStorage.setItem('matanho-hub-state', JSON.stringify({ priorities:state.priorities, workTasks:state.workTasks, workProjects:state.workProjects, workMode:state.workMode, workProject:state.workProject, workFilter:state.workFilter, workSearch:state.workSearch, newsletterStudioPanel:state.newsletterStudioPanel, apps:state.apps, selectedPerson:state.selectedPerson, cover:state.cover, requests:state.requests, aiMessages:state.aiMessages, aiMode:state.aiMode, aiScope:state.aiScope, aiContextOpen:state.aiContextOpen, aiContextSources:state.aiContextSources, aiSaved:state.aiSaved, aiRecent:state.aiRecent, aiDraft:state.aiDraft, newsBookmarks:state.newsBookmarks, profile:state.profile, profileTab:state.profileTab, profileAvailability:state.profileAvailability, profileSkills:state.profileSkills, profileDocuments:state.profileDocuments, profilePreferences:state.profilePreferences, sidebarCollapsed:state.sidebarCollapsed, newsletterRole:state.newsletterRole, newsletterLists:state.newsletterLists, newsletterShares:state.newsletterShares, forumComments:state.forumComments, appAccessRequests:state.appAccessRequests, leaveBalance:state.leaveBalance, calendarDetailsOpen:state.calendarDetailsOpen, calendarSelectedEvent:state.calendarSelectedEvent, calendarSources:state.calendarSources, heroOffset:state.heroOffset, settings:state.settings, daySession:state.daySession })); } catch (_) {}
  }
  function routeLabel(id) {
    for (const group of D.nav) for (const item of group.items) if (item.id === id) return item.label;
    return 'Home';
  }
  function syncUrl() {
    if (typeof window.__HOME_V3_PATH__ === 'function') {
      window.__HOME_V3_PATH__({
        route: state.route,
        selectedNews: state.selectedNews,
        forumThread: state.forumThread,
        selectedNewsletter: state.selectedNewsletter,
        newsletterMode: state.newsletterMode,
      });
    } else if (typeof window.__HOME_V3_NAV__ === 'function') {
      window.__HOME_V3_NAV__(state.route);
    }
  }
  function applySessionUser(nextUser) {
    if (!nextUser) return;
    D.user = { ...D.user, ...nextUser };
    state.profile = {
      ...state.profile,
      name: D.user.name,
      role: D.user.role,
      email: D.user.email,
      location: D.user.location || state.profile.location || "",
    };
    render();
  }
  function navigate(route) {
    state.route = route;
    state.mobileNav = false;
    // Sidebar / top-level navigate always resets drill-downs
    state.selectedNews = null;
    state.forumThread = null;
    if (route === 'newsletters') state.newsletterMode = 'library';
    else state.newsletterMode = 'library';
    syncUrl();
    render();
    try { scrollTo(0,0); } catch (_) {}
  }
  /* hashchange disabled — Next.js owns routing */
  function renderSidebar() {
    const groups = D.nav.map(group => `<section class="nav-section"><div class="nav-label">${group.section}</div>${group.items.map(item=>`<button class="nav-item ${state.route===item.id?'active':''}" data-nav="${item.id}" title="${item.label}">${icon(item.icon)}<span>${item.label}</span></button>`).join('')}</section>`).join('');
    return `${state.mobileNav?'<button class="sidebar-scrim" data-action="mobile-menu" aria-label="Close navigation"></button>':''}<aside class="sidebar ${state.mobileNav?'open':''} ${state.sidebarCollapsed?'collapsed':''}">
      <div class="brand"><img class="brand-full" src="/home/assets/matanho-logo.png" alt="Matanho"/><div class="brand-mark" aria-label="Matanho">m</div><button class="collapse-control" data-action="collapse-sidebar" title="${state.sidebarCollapsed?'Expand':'Collapse'} navigation">${icon(state.sidebarCollapsed?'chevron':'arrow')}</button></div>
      <div class="sidebar-scroll">${groups}</div>
      <div class="sidebar-bottom">
        <button class="nav-item utility-item" data-action="settings" title="Settings">${icon('settings')}<span>Settings</span></button>
        <button class="nav-item utility-item" data-action="help" title="Help & Support">${icon('help')}<span>Help & Support</span></button>
        <div class="user-chip" title="Click your profile to ${state.sidebarCollapsed?'expand':'collapse'} navigation">
          <button class="user-identity-button" data-action="profile-sidebar-toggle">${avatar(D.user)}<div class="meta"><strong>${D.user.name}</strong><span>${D.user.role}</span></div></button>
        </div>
      </div>
    </aside>`;
  }
  function renderTopbar() {
    return `<header class="topbar">
      <button class="icon-button mobile-menu" data-action="mobile-nav" aria-label="Open navigation">${icon('apps')}</button>
      <button class="search-trigger" data-action="search">${icon('search')}<span>Search people, work, news, KPIs and documents...</span><kbd>Ctrl K</kbd></button>
      <div class="spacer"></div>
      <select id="entitySelect" class="top-select entity" aria-label="Entity"><option>Matanho Capital</option><option>Matanho Holdings</option><option>Matanho Advisory</option></select>
      <select id="yearSelect" class="top-select year" aria-label="Financial year"><option>FY 2026</option><option>FY 2025</option></select>
      <select id="roleSelect" class="top-select role" aria-label="Demo role"><option>HR/M&amp;E Manager</option><option>Executive</option><option>Department Manager</option><option>Employee</option><option>SysAdmin</option></select>
      <button class="icon-button theme-toggle" data-action="toggle-theme" title="Toggle Theme" aria-label="Toggle theme">${icon('sun')}</button>
      <button class="icon-button apps" data-action="apps" aria-label="Matanho applications">${icon('apps')}</button>
      <button class="icon-button notification-button" data-action="notifications" aria-label="Notifications">${icon('bell')}<span class="notification-count">4</span></button>
      <button class="user-button" data-action="user-menu"><span class="avatar">${esc(D.user.initials||'TM')}</span><span class="user-copy"><strong>${esc(D.user.name||'Tariro Moyo')}</strong><span id="userRoleCopy">${esc(D.user.role||'HR/M&E Manager')}</span></span></button>
    </header>`;
  }
  function pageHead(title, subtitle='', actions='') {
    return `<div class="page-head"><div><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div>${actions?`<div class="page-actions">${actions}</div>`:''}</div>`;
  }
  let chartSequence = 0;
  function chartSvg(points=[10,24,18,36,39,51,48,63,66,78,73,92]) {
    const w=310,h=108,m={top:8,right:8,bottom:27,left:31};
    const min=0,max=100,innerW=w-m.left-m.right,innerH=h-m.top-m.bottom;
    const coords=points.map((v,i)=>[m.left+i*innerW/(points.length-1),m.top+(max-v)/(max-min)*innerH,v]);
    const line=coords.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    const area=`${line} L${coords.at(-1)[0]} ${m.top+innerH} L${coords[0][0]} ${m.top+innerH} Z`;
    const yTicks=[0,50,100].map(v=>{const yy=m.top+(100-v)/100*innerH;return `<g><line class="micro-grid" x1="${m.left}" y1="${yy}" x2="${w-m.right}" y2="${yy}"/><text class="micro-axis-label" x="${m.left-5}" y="${yy+2.5}" text-anchor="end">${v}%</text></g>`}).join('');
    const quarterIndexes=[[0,'Q1'],[Math.floor((points.length-1)/2),'Q2'],[points.length-1,'Q3']];
    const xTicks=quarterIndexes.map(([i,l])=>`<g><line class="micro-baseline" x1="${coords[i][0]}" y1="${m.top+innerH}" x2="${coords[i][0]}" y2="${m.top+innerH+3}"/><text class="micro-axis-label" x="${coords[i][0]}" y="${h-14}" text-anchor="middle">${l}</text></g>`).join('');
    const dots=coords.map((p,i)=>`<g class="micro-point-group ${i===coords.length-1?'is-last':''}"><circle class="chart-hit" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="8"><title>Review period ${i+1}: ${p[2]}%</title></circle><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i===coords.length-1?2.8:2.2}" class="chart-point ${i===coords.length-1?'chart-point-last':''}"/></g>`).join('');
    return `<svg class="oled-chart micro-axis-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" role="img" aria-label="Quarterly KPI percentage trend with review quarter on the horizontal axis and performance percentage on the vertical axis"><title>Quarterly KPI trend</title>${yTicks}<line class="micro-baseline" x1="${m.left}" y1="${m.top}" x2="${m.left}" y2="${m.top+innerH}"/><line class="micro-baseline" x1="${m.left}" y1="${m.top+innerH}" x2="${w-m.right}" y2="${m.top+innerH}"/>${xTicks}<path d="${area}" class="micro-area"/><path d="${line}" class="chart-line" pathLength="1" stroke="#075DFF"/>${dots}<text class="micro-axis-title" x="${m.left+innerW/2}" y="${h-2}" text-anchor="middle">Review quarter</text><text class="micro-axis-title" transform="translate(8 ${m.top+innerH/2}) rotate(-90)" text-anchor="middle">Performance (%)</text></svg>`;
  }
  function detailedChartSvg(points=[], options={}) {
    const values=points.map(Number).filter(Number.isFinite);
    if(!values.length) return '';
    const w=560,h=206,m={top:18,right:22,bottom:38,left:options.yPrefix?70:54};
    const targetValue=Number.isFinite(options.target)?Number(options.target):null;
    const rangeValues=targetValue===null?values:[...values,targetValue];
    const rawMin=Math.min(...rangeValues),rawMax=Math.max(...rangeValues);
    const rawSpan=Math.max(rawMax-rawMin,Math.abs(rawMax||1)*.06,1);
    const niceStep=(span,ticks=3)=>{
      const rough=span/ticks, power=10**Math.floor(Math.log10(Math.max(rough,1e-9))), fraction=rough/power;
      const nice=fraction<=1?1:fraction<=2?2:fraction<=2.5?2.5:fraction<=5?5:10;
      return nice*power;
    };
    let min=Number.isFinite(options.min)?Number(options.min):rawMin-rawSpan*.12;
    let max=Number.isFinite(options.max)?Number(options.max):rawMax+rawSpan*.12;
    const step=niceStep(max-min,3);
    if(!Number.isFinite(options.min)) min=Math.floor(min/step)*step;
    if(!Number.isFinite(options.max)) max=Math.ceil(max/step)*step;
    if(max<=min) max=min+step*3;
    const innerW=w-m.left-m.right,innerH=h-m.top-m.bottom;
    const x=i=>m.left+(values.length===1?innerW/2:i*innerW/(values.length-1));
    const y=v=>m.top+(max-v)/(max-min)*innerH;
    const coords=values.map((v,i)=>[x(i),y(v),v]);
    const pointString=coords.map(p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
    const decimals=Number.isFinite(options.decimals)?options.decimals:(Math.abs(step)<1?2:Math.abs(step)<10?1:0);
    const formatY=v=>`${options.yPrefix||''}${Number(v).toFixed(decimals)}${options.ySuffix||''}`;
    const yTicks=Array.from({length:4},(_,i)=>min+(max-min)*(3-i)/3);
    const yGrid=yTicks.map(v=>`<g><line class="axis-grid" x1="${m.left}" y1="${y(v).toFixed(2)}" x2="${w-m.right}" y2="${y(v).toFixed(2)}"/><text class="axis-tick" x="${m.left-8}" y="${(y(v)+3.2).toFixed(2)}" text-anchor="end">${esc(formatY(v))}</text></g>`).join('');
    const labels=(options.xLabels||values.map((_,i)=>String(i+1))).map(String);
    const tickStep=Math.max(1,Math.ceil(labels.length/5));
    const xTicks=labels.map((label,i)=>{
      const show=i===0||i===labels.length-1||i%tickStep===0;
      return show?`<text class="axis-tick" x="${x(i).toFixed(2)}" y="${h-21}" text-anchor="middle">${esc(label)}</text>`:'';
    }).join('');
    const pointsSvg=coords.map((p,i)=>`<g class="axis-point-group ${i===coords.length-1?'is-last':''}"><circle class="axis-point-hit" cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="10"><title>${esc(labels[i]||String(i+1))}: ${esc(formatY(p[2]))}</title></circle><circle class="axis-point" cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="2.65"/></g>`).join('');
    const target=targetValue!==null&&targetValue>=min&&targetValue<=max?`<line class="axis-target" x1="${m.left}" y1="${y(targetValue).toFixed(2)}" x2="${w-m.right}" y2="${y(targetValue).toFixed(2)}"/><text class="axis-target-label" x="${w-m.right}" y="${m.top-6}" text-anchor="end">Target ${esc(formatY(targetValue))}</text>`:'';
    const aria=options.ariaLabel||`${options.yLabel||'Value'} by ${options.xLabel||'period'}`;
    return `<svg class="axis-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" role="img" aria-label="${esc(aria)}"><title>${esc(aria)}</title>${yGrid}<line class="axis-baseline" x1="${m.left}" y1="${m.top}" x2="${m.left}" y2="${m.top+innerH}"/><line class="axis-baseline" x1="${m.left}" y1="${m.top+innerH}" x2="${w-m.right}" y2="${m.top+innerH}"/>${xTicks}${target}<polyline class="axis-line" vector-effect="non-scaling-stroke" stroke="#075DFF" points="${pointString}"/>${pointsSvg}<text class="axis-title" x="${m.left+innerW/2}" y="${h-4}" text-anchor="middle">${esc(options.xLabel||'Period')}</text><text class="axis-title" transform="translate(11 ${m.top+innerH/2}) rotate(-90)" text-anchor="middle">${esc(options.yLabel||'Value')}</text></svg>`;
  }

  function performanceMetricChartSvg(points=[], options={}) {
    const values=points.map(Number).filter(Number.isFinite);
    if(!values.length) return '';
    const w=320,h=132,m={top:13,right:11,bottom:27,left:31};
    const min=0,max=100,innerW=w-m.left-m.right,innerH=h-m.top-m.bottom;
    const labels=(options.xLabels||values.map((_,i)=>String(i+1))).map(String);
    const x=i=>m.left+(values.length===1?innerW/2:i*innerW/(values.length-1));
    const y=v=>m.top+(max-v)/(max-min)*innerH;
    const coords=values.map((v,i)=>[x(i),y(v),v]);
    const pointString=coords.map(p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
    const yTicks=[0,50,100].map(v=>`<g><line class="metric-axis-grid" x1="${m.left}" y1="${y(v)}" x2="${w-m.right}" y2="${y(v)}"/><text class="metric-axis-text" x="${m.left-5}" y="${y(v)+3}" text-anchor="end">${v}%</text></g>`).join('');
    const labelIndexes=new Set([0,Math.floor((labels.length-1)/2),labels.length-1]);
    const xTicks=labels.map((label,i)=>labelIndexes.has(i)?`<text class="metric-axis-text" x="${x(i)}" y="${h-13}" text-anchor="middle">${esc(label)}</text>`:'').join('');
    const pointsSvg=coords.map((p,i)=>`<g class="metric-point-group ${i===coords.length-1?'is-last':''}"><circle class="metric-point-hit" cx="${p[0]}" cy="${p[1]}" r="9"><title>${esc(labels[i])}: ${p[2]}%</title></circle><circle class="metric-point" cx="${p[0]}" cy="${p[1]}" r="2.45"/></g>`).join('');
    const target=Number.isFinite(options.target)?options.target:null;
    const targetMarkup=target===null?'':`<line class="metric-target" x1="${m.left}" y1="${y(target)}" x2="${w-m.right}" y2="${y(target)}"/><text class="metric-target-text" x="${w-m.right}" y="9" text-anchor="end">Target ${target}%</text>`;
    const aria=options.ariaLabel||`${options.yLabel||'Performance'} by ${options.xLabel||'month'}`;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" role="img" aria-label="${esc(aria)}"><title>${esc(aria)}</title>${yTicks}<line class="metric-axis" x1="${m.left}" y1="${m.top}" x2="${m.left}" y2="${m.top+innerH}"/><line class="metric-axis" x1="${m.left}" y1="${m.top+innerH}" x2="${w-m.right}" y2="${m.top+innerH}"/>${xTicks}${targetMarkup}<polyline class="metric-line" vector-effect="non-scaling-stroke" stroke="#075DFF" points="${pointString}"/>${pointsSvg}</svg>`;
  }


  function aumSnapshotMarkup(){
    const a = D.workdaySnapshot && D.workdaySnapshot.aum;
    if (!a) {
      return '<div class="snapshot-time-pane"><div class="snapshot-chart-heading"><div><span class="eyebrow">Portfolio signal</span><strong>Assets under management</strong></div></div><div class="chart-empty-state">Portfolio AUM is unavailable right now.</div></div>';
    }
    if (!Array.isArray(a.values) || !a.values.length) {
      return `<div class="snapshot-time-pane"><div class="snapshot-chart-heading"><div><span class="eyebrow">Portfolio signal</span><strong>Assets under management</strong></div>${a.yoyLabel?`<span class="trend-positive">${esc(a.yoyLabel)}</span>`:''}</div><div class="chart-context"><span>${esc(a.totalLabel||'Not available')}</span><span>No trend history yet</span></div></div>`;
    }
    return `<div class="snapshot-time-pane"><div class="snapshot-chart-heading"><div><span class="eyebrow">Portfolio signal</span><strong>Assets under management</strong></div><span class="trend-positive">${esc(a.yoyLabel||'')}</span></div><div class="axis-chart-frame detailed-chart-home">${detailedChartSvg(a.values,{xLabels:a.xLabels||[],yPrefix:'US$',ySuffix:'B',decimals:2,yLabel:'AUM',xLabel:'Month',target:a.target,showValues:false,ariaLabel:'Assets under management, trailing 12 months'})}</div><div class="chart-context"><span>12-month range <strong>${esc(a.rangeLabel||'')}</strong></span><span>Updated today</span></div></div>`;
  }
  let sessionTimerHandle = null;
  function emitIntegrationEvent(type, payload={}){
    window.dispatchEvent(new CustomEvent(`matanho:${type}`, {detail:{...payload, occurredAt:new Date().toISOString()}}));
  }
  function selectedSessionTask(){
    if(String(state.daySession.taskId)==='none') return null;
    return state.workTasks.find(t=>String(t.id)===String(state.daySession.taskId)) || state.priorities.find(t=>String(t.id)===String(state.daySession.taskId)) || null;
  }
  function sessionSecondsRemaining(){
    const s=state.daySession;
    if(!s.active) return 0;
    if(s.paused) return Math.max(0, Number(s.pausedRemaining)||0);
    const elapsed=Math.max(0,Math.floor((Date.now()-Number(s.startedAt||Date.now()))/1000));
    return Math.max(0, Number(s.durationMinutes||50)*60-elapsed);
  }
  function formatSessionTime(seconds){
    const safe=Math.max(0,Math.floor(seconds));
    const h=Math.floor(safe/3600), m=Math.floor((safe%3600)/60), sec=safe%60;
    return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }
  function workdaySessionPanel(){
    const s=state.daySession;
    if(!s.active){
      return `<div class="hero-start-card"><div class="hero-start-copy"><span>Plan · focus · begin</span><strong>Start your day</strong><small>Choose a task, set your status and start a focused timer.</small></div><button class="hero-start-button" data-action="start-day">${icon('play')} Start your day</button></div>`;
    }
    const task=selectedSessionTask();
    const remaining=sessionSecondsRemaining();
    return `<div class="hero-session-card"><div class="session-orb ${s.paused?'paused':''}">${icon(s.paused?'clock':'target')}</div><div class="hero-session-copy"><span>${esc(s.status)} · ${s.paused?'Paused':'In progress'}</span><strong data-session-time>${formatSessionTime(remaining)}</strong><small>${esc(task?.title||'Unassigned focus session')}</small></div><div class="hero-session-actions"><button data-action="${s.paused?'resume-day-session':'pause-day-session'}" title="${s.paused?'Resume':'Pause'} timer">${icon(s.paused?'play':'pause')}</button><button data-action="end-day-session" title="End timer">${icon('close')}</button></div></div>`;
  }
  function syncSessionTimer(){
    window.clearInterval(sessionTimerHandle);
    if(!state.daySession.active || state.daySession.paused) return;
    const update=()=>{
      const remaining=sessionSecondsRemaining();
      const node=document.querySelector('[data-session-time]');
      if(node) node.textContent=formatSessionTime(remaining);
      if(remaining<=0){
        window.clearInterval(sessionTimerHandle);
        state.daySession={...state.daySession,active:false,paused:false,startedAt:null,pausedRemaining:null};
        saveState(); emitIntegrationEvent('workday.session.completed',{taskId:state.daySession.taskId}); render(); toast('Focus session completed.','success');
      }
    };
    update(); sessionTimerHandle=window.setInterval(update,1000);
  }

  function dayInfo() {
    const now = new Date(); const h=now.getHours();
    const period = h<12?'morning':h<18?'afternoon':'evening';
    const ic = h<5 || h>=19 ? 'moon' : h<9 ? 'sunrise' : 'sun';
    return {now, period, icon:ic, time:now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), ampm:now.toLocaleTimeString([], {hour12:true}).split(' ')[1] || '', date:now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})};
  }

  function homeView() {
    const d=dayInfo();
    const epochDay=Math.floor(Date.UTC(d.now.getFullYear(),d.now.getMonth(),d.now.getDate())/86400000);
    const quote=D.quotes[((epochDay%D.quotes.length)+D.quotes.length)%D.quotes.length];
    const scene=currentHeroScene(); preloadHeroScene(scene);
    const assistant=`<section class="card assistant-bar home-assistant-priority"><div class="assistant-orb">${icon('sparkles')}</div><div class="assistant-copy"><strong>Matanho Assistant <span class="ai-badge">AI</span></strong><span>Ask for insights, prepare meetings or turn priorities into action.</span></div><div class="assistant-suggestions"><button data-ai-prompt="Summarise my priorities for today">Today’s priorities</button><button data-ai-prompt="Prepare me for my next meeting">Prepare next meeting</button><button data-ai-prompt="What needs my attention?">Attention needed</button></div><form class="assistant-input" id="homeAssistant"><input name="prompt" placeholder="Ask anything…"/><button aria-label="Send">${icon('arrow')}</button></form></section>`;
    return `${pageHead('', '')}
      <section class="hero" style="--hero-image-desktop:url('${scene.src}');--hero-image-tablet:url('${scene.tablet}');--hero-image-mobile:url('${scene.mobile}')">
        <div class="hero-content">
          <div class="greeting">Good ${d.period}, ${D.user.firstName} ${icon(d.icon,'day-icon')}</div>
          <div class="hero-time">${d.time.replace(/\s?(AM|PM)/,'')}<span>${d.ampm}</span></div>
          <div class="hero-date">${d.date}</div>
          <div class="hero-location">${icon('location')}<span>${D.user.location ? esc(D.user.location) : 'In Office · Harare, Zimbabwe'}</span></div>
          <div class="quote"><span>Daily perspective</span><strong>${quote}</strong></div>
        </div>
        <div class="hero-scene-control">
          <button data-action="hero-prev" aria-label="Previous Japandi scene">${icon('chevron')}</button>
          <div><span>Daily scene</span><strong>${scene.label}</strong><small>${scene.mood} · changes automatically each day</small></div>
          <button data-action="hero-next" aria-label="Next Japandi scene">${icon('arrow')}</button>
        </div>
        ${workdaySessionPanel()}
      </section>
      ${assistant}
      <section class="card card-pad home-insight-card">
        <div class="card-title"><div><h3>Workday Snapshot</h3><p>Focus quality and portfolio momentum in one calm view</p></div><select class="select-control small-btn" data-action="snapshot-range"><option>Today</option><option>This week</option><option>This month</option></select></div>
        <div class="snapshot-chart-pair">
          <div class="snapshot-donut-pane">
            <div class="focus-ring" style="--score:86%"><div><strong>86</strong><span>Excellent</span></div></div>
            <div class="snapshot-signals">
              <div><span>Deep work</span><strong>4h 48m</strong><i class="signal-bar"><b style="width:78%"></b></i></div>
              <div><span>Momentum</span><strong>+12%</strong><i class="signal-bar emerald"><b style="width:88%"></b></i></div>
              <div><span>Balance</span><strong>82%</strong><i class="signal-bar amber"><b style="width:82%"></b></i></div>
            </div>
          </div>
          ${aumSnapshotMarkup()}
        </div>
      </section>
      <section class="home-action-grid">
        <article class="card card-pad card-hover home-priority-card">
          <div class="card-title"><div><h3>Today’s Priorities</h3><p>${state.priorities.filter(x=>x.done).length} of ${state.priorities.length} complete</p></div><button class="link-btn" data-nav="my-work">Open My Work ${icon('arrow')}</button></div>
          ${state.priorities.length?state.priorities.map(t=>`<div class="task-row"><button class="check-circle ${t.done?'checked':''}" data-priority-toggle="${t.id}">${t.done?icon('check'):''}</button><div class="task-copy"><strong style="${t.done?'text-decoration:line-through;color:var(--muted)':''}">${t.title}</strong><span>${t.meta}</span></div><span class="status-pill ${t.priority.toLowerCase()}">${t.priority}</span></div>`).join(''):'<div class="empty-state-row">No open tasks right now.</div>'}
        </article>
        <article class="card card-pad card-hover schedule-card home-schedule-card">
          <div class="card-title"><div><h3>Upcoming Schedule</h3><p>Your next three commitments</p></div><button class="link-btn" data-nav="calendar">View calendar ${icon('arrow')}</button></div>
          ${D.schedule.length?D.schedule.map((e,i)=>`<div class="schedule-row" data-event="${e.id}"><div class="date-tile">${e.month}<strong>${e.day}</strong></div><div class="event-copy"><strong>${e.title}</strong><span>${e.time} · ${e.location}</span></div><div class="avatar-stack">${e.people.map((p,j)=>avatar(p,colorByIndex(j))).join('')}</div></div>`).join(''):'<div class="empty-state-row">Nothing on your calendar yet.</div>'}
        </article>
      </section>`;
  }

  function dailyCoverView() {
    const themes=[
      {id:'Porcelain',name:'Porcelain',desc:'Crisp white with warm stone undertones.',swatch:'porcelain'},
      {id:'Mist',name:'Morning Mist',desc:'Cool mineral surfaces and airy depth.',swatch:'mist'},
      {id:'Sage',name:'Sage Studio',desc:'Quiet botanical warmth and soft contrast.',swatch:'sage'},
      {id:'Sand',name:'Sand Garden',desc:'Warm Japandi neutrals with tactile calm.',swatch:'sand'},
      {id:'Slate',name:'Soft Slate',desc:'Editorial graphite surfaces without changing Matanho blue.',swatch:'slate'}
    ];
    const scene=currentHeroScene();
    return `${pageHead('Daily Cover','Personalise the atmosphere of your workspace. Matanho blue remains fixed for consistency.',`<span class="theme-saved-pill">${icon('check')} Applied instantly</span><button class="secondary-btn" data-action="reset-daily-cover">Reset to daily</button>`)}
      <div class="theme-studio-layout">
        <section class="card theme-live-preview" style="--preview-image:url('${scene.src}')">
          <div class="theme-preview-top"><span>Live workspace preview</span><strong>${esc(state.cover.theme)} · ${scene.label}</strong></div>
          <div class="theme-preview-window"><div class="theme-preview-sidebar"><i></i><i></i><i></i><i></i></div><div class="theme-preview-main"><div class="theme-preview-hero"><span>Good ${dayInfo().period}, ${D.user.firstName}</span><small>${scene.mood} for the day ahead</small></div><div class="theme-preview-cards"><i></i><i></i><i></i></div></div></div>
          <div class="locked-primary">${icon('lock')} Primary brand colour <strong>#075DFF</strong> stays unchanged</div>
        </section>
        <div class="theme-studio-controls">
          <section class="card editor-section theme-section-v10"><div class="editor-step"><span class="step-num">1</span><div><strong>Choose the interface atmosphere</strong><small>Surface colour, depth and ambient background change together.</small></div></div><div class="theme-choice-grid">${themes.map(t=>`<button class="theme-choice ${state.cover.theme===t.id?'active':''}" data-ui-theme="${t.id}"><span class="theme-swatch-v10 ${t.swatch}"><i></i></span><strong>${t.name}</strong><small>${t.desc}</small>${state.cover.theme===t.id?`<b>${icon('check')}</b>`:''}</button>`).join('')}</div></section>
          <section class="card editor-section theme-section-v10"><div class="editor-step"><span class="step-num">2</span><div><strong>Select the home wallpaper</strong><small>Use the daily rotation or keep one favourite scene.</small></div></div>${rotationIntervalControl()}<div class="wallpaper-choice-grid"><button class="wallpaper-card auto-card ${state.cover.wallpaper==='auto'?'active':''}" data-cover-wallpaper="auto"><div>${icon('sparkles')}</div><strong>Daily rotation</strong><small>Cycles through your own photos if you\u2019ve uploaded any, otherwise the built-in scenes</small></button>${customWallpaperTiles()}<button class="wallpaper-card auto-card" data-action="upload-wallpaper"><div>${icon('plus')}</div><strong>Upload image</strong><small>Add your own photo</small></button><input type="file" id="wallpaperFileInput" accept="image/*" multiple style="display:none"/>${heroScenes.map((s,i)=>`<button class="wallpaper-card ${String(state.cover.wallpaper)===String(i)?'active':''}" data-cover-wallpaper="${i}"><img src="${s.src}" alt="${esc(s.label)}" loading="lazy"/><span><strong>${s.label}</strong><small>${s.mood}</small></span>${String(state.cover.wallpaper)===String(i)?`<b>${icon('check')}</b>`:''}</button>`).join('')}</div></section>
          <section class="card editor-section theme-section-v10"><div class="editor-step"><span class="step-num">3</span><div><strong>Workspace behaviour</strong><small>Personalisation is stored against the employee profile.</small></div></div><div class="theme-behaviour-list"><div class="theme-lock-row"><div class="theme-lock-icon">${icon('apps')}</div><div><strong>Consistent app identity</strong><small>Icons, actions and Matanho blue remain familiar in every theme.</small></div><span class="status-pill low">Locked</span></div><div class="theme-lock-row"><div class="theme-lock-icon">${icon('sun')}</div><div><strong>Responsive scene composition</strong><small>Desktop, tablet and mobile use purpose-cropped imagery.</small></div><span class="status-pill low">Active</span></div><div class="theme-lock-row"><div class="theme-lock-icon">${icon('services')}</div><div><strong>Accessibility protection</strong><small>Text contrast and focus states are preserved automatically.</small></div><span class="status-pill low">Active</span></div></div></section>
        </div>
      </div>`;
  }

    function timeAgo(iso){
    if(!iso) return '';
    const d=new Date(iso); if(isNaN(d.getTime())) return '';
    const diffMs=Date.now()-d.getTime();
    const mins=Math.floor(diffMs/60000);
    if(mins<1) return 'just now';
    if(mins<60) return mins+'m ago';
    const hours=Math.floor(mins/60);
    if(hours<24) return hours+'h ago';
    const days=Math.floor(hours/24);
    if(days<7) return days+'d ago';
    return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
  }
  function excerpt(text,len){
    const plain=String(text||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    return plain.length>len?plain.slice(0,len).trim()+'…':plain;
  }
  function postContentHtml(text){
    return esc(text||'').replace(/\n/g,'<br>');
  }
  function nestReplies(replies){
    const byParent={};
    replies.forEach(r=>{const k=r.parentReplyId||'root';(byParent[k]=byParent[k]||[]).push(r)});
    return (byParent.root||[]).map(r=>({...r,children:byParent[r.id]||[]}));
  }
  function forumCategories(){
    return ['Investment Insights','Client Experience','People & Culture','Operations','Ask Leadership'];
  }
  function postReplyForm(postId){
    return `<form class="reply-box reply-box-v5" id="postReplyForm" data-reply-post="${esc(postId)}"><div class="reply-identity">${avatar(D.user)}<div><strong>Comment as ${esc(D.user.name)}</strong><span>Visible to everyone with access.</span></div></div><textarea class="textarea-control" name="reply" required placeholder="Add a comment…"></textarea><div class="reply-tools"><button class="primary-btn">Post reply</button></div></form>`;
  }
  function newsLibraryView() {
    const posts=D.newsPosts||[];
    const featured=posts[0];
    const rest=posts.slice(1);
    return `${pageHead('News','Company announcements and updates.',`<button class="primary-btn" data-action="new-post">${icon('plus')} New post</button>`)}
      ${posts.length?`<div class="news-layout news-layout-premium"><main>${featured?`<article class="story-card featured" data-news-open="${esc(featured.id)}"><div class="story-body"><div class="story-kicker"><span>${esc(featured.authorName)}</span><span>${timeAgo(featured.createdAt)}</span></div><h3>${esc(featured.title)}</h3><p>${esc(excerpt(featured.content,220))}</p><div class="story-meta"><span>${featured.replies.length} repl${featured.replies.length===1?'y':'ies'}</span></div></div></article>`:''}<div class="latest-list latest-list-premium">${rest.map(n=>`<article class="latest-item" data-news-open="${esc(n.id)}"><div><div class="story-source">${esc(n.authorName)} · ${timeAgo(n.createdAt)}</div><h4>${esc(n.title)}</h4><p>${esc(excerpt(n.content,140))}</p><div class="story-meta"><span>${n.replies.length} repl${n.replies.length===1?'y':'ies'}</span></div></div></article>`).join('')}</div></main></div>`:`<div class="empty-state">${icon('newsletter')}<h3>No posts yet.</h3><p>Company announcements will appear here once someone posts.</p></div>`}`;
  }
  function newsArticleView(n) {
    if(!n) return `${pageHead('', '', `<button class="secondary-btn" data-action="back-news">${icon('arrow')} Back to news</button>`)}<div class="empty-state">${icon('newsletter')}<h3>Post not found.</h3></div>`;
    const nested=nestReplies(n.replies);
    return `${pageHead('', '', `<button class="secondary-btn" data-action="back-news">${icon('arrow')} Back to news</button>`)}<div class="article-layout article-layout-premium"><article class="card article-main article-main-premium"><div class="article-kicker">Company post</div><h1>${esc(n.title)}</h1><div class="article-byline"><div class="article-author">${avatar({name:n.authorName,initials:(n.authorName||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()})}<div><strong>${esc(n.authorName)}</strong><span>${timeAgo(n.createdAt)}</span></div></div></div><div class="article-copy"><p class="article-lead">${postContentHtml(n.content)}</p></div></article><aside><section class="card side-list"><div class="card-title"><h3>${n.replies.length} comment${n.replies.length===1?'':'s'}</h3></div>${nested.length?nested.map(r=>`<div class="post live-comment"><div class="post-head">${avatar({name:r.authorName,initials:(r.authorName||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()})}<div><strong>${esc(r.authorName)}</strong><span> · ${timeAgo(r.createdAt)}</span></div></div><p>${postContentHtml(r.content)}</p></div>`).join(''):'<div class="empty-state-row">No comments yet.</div>'}${postReplyForm(n.id)}</section></aside></div>`;
  }
function newsView(){ return state.selectedNews ? newsArticleView((D.newsPosts||[]).find(x=>x.id===state.selectedNews)||(D.newsPosts||[])[0]) : newsLibraryView(); }

    function newslettersView() {
    if (state.newsletterMode==='reader') return newsletterReaderView();
    const list=D.newsletters||[];
    const featured=list[0];
    const rest=list.slice(1);
    const actions=`<button class="primary-btn" data-action="new-newsletter">${icon('plus')} Create newsletter</button>`;
    return `${pageHead('Newsletters','Company newsletters and internal updates.',actions)}
      ${list.length?`<div class="newsletter-grid newsletter-grid-v5"><main>${featured?`<section class="card featured-newsletter" data-newsletter-open="${esc(featured.id)}"><div class="newsletter-cover">${featured.imageUrl?`<img src="${esc(featured.imageUrl)}" alt="${esc(featured.title)}" style="width:100%;height:100%;object-fit:cover"/>`:`<strong>${esc(featured.title)}</strong>`}</div><div class="newsletter-copy"><div class="story-source">Latest</div><h2>${esc(featured.title)}</h2><p>${esc(excerpt(featured.content,220))}</p><div class="toolbar"><button class="primary-btn" data-newsletter-open="${esc(featured.id)}">Continue reading ${icon('arrow')}</button><span style="font-size:10px;color:var(--muted)">${esc(featured.authorName)} · ${timeAgo(featured.createdAt)}</span></div></div></section>`:''}${rest.length?`<div class="card-title" style="margin:18px 0 8px"><h3>Issue library</h3></div><div class="issue-library">${rest.map(n=>`<div class="issue-card" data-newsletter-open="${esc(n.id)}">${n.imageUrl?`<div class="issue-mini"><img src="${esc(n.imageUrl)}" alt="${esc(n.title)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"/></div>`:`<div class="issue-mini"><strong>${esc(n.title)}</strong></div>`}<strong>${esc(n.title)}</strong><span>${esc(n.authorName)} · ${timeAgo(n.createdAt)}</span></div>`).join('')}</div>`:''}</main></div>`:`<div class="empty-state">${icon('newsletter')}<h3>No newsletters yet.</h3><p>Published newsletters will appear here.</p></div>`}`;
  }
  function newsletterReaderView() {
    const n=(D.newsletters||[]).find(x=>x.id===state.selectedNewsletter)||(D.newsletters||[])[0];
    if(!n) return `${pageHead('', '', `<button class="secondary-btn" data-newsletter-mode="library">${icon('arrow')} Back to library</button>`)}<div class="empty-state">${icon('newsletter')}<h3>Newsletter not found.</h3></div>`;
    return `${pageHead('', '', `<button class="secondary-btn" data-newsletter-mode="library">${icon('arrow')} Back to library</button>`)}<div class="reader-layout"><main class="card card-pad">${n.imageUrl?`<div class="reader-hero"><img src="${esc(n.imageUrl)}" alt="${esc(n.title)}" style="width:100%;border-radius:12px"/></div>`:''}<div class="reader-hero"><h1>${esc(n.title)}</h1><p>${esc(n.authorName)} · ${timeAgo(n.createdAt)}</p></div><article class="reader-copy">${n.content}</article></main></div>`;
  }
  function forumsView() {
    if (state.forumThread) {
      const t=(D.forumPosts||[]).find(x=>x.id===state.forumThread);
      if(t) return forumThreadView(t);
    }
    const posts=D.forumPosts||[];
    const filter=state.forumFilter||'All discussions';
    const counts={};
    posts.forEach(p=>{const c=p.category||'Other';counts[c]=(counts[c]||0)+1});
    const cats=forumCategories().map(c=>[c,counts[c]||0]);
    let filtered=posts;
    if(filter==='Unanswered') filtered=posts.filter(p=>p.replies.length===0);
    if(filter==='My discussions') filtered=posts.filter(p=>p.authorId===D.user.id);
    const contributorCounts={};
    posts.forEach(p=>{contributorCounts[p.authorName]=(contributorCounts[p.authorName]||0)+1;p.replies.forEach(r=>{contributorCounts[r.authorName]=(contributorCounts[r.authorName]||0)+1})});
    const topContributors=Object.entries(contributorCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);
    const solvedRecent=posts.filter(p=>p.isSolved).slice(0,3);
    return `${pageHead('Forums','Ask, share and build knowledge together.',`<button class="primary-btn" data-action="new-discussion">${icon('edit')} Start a discussion</button>`)}<div class="category-row">${cats.map((c,i)=>`<div class="card category-card card-hover"><div class="task-icon">${icon(['performance','people','people','settings','sparkles'][i])}</div><div><strong>${esc(c[0])}</strong><span>${c[1]} discussion${c[1]===1?'':'s'}</span></div></div>`).join('')}</div><div class="forum-layout"><main class="card forum-table"><div class="toolbar" style="padding:12px 14px;margin:0"><div class="segmented">${['All discussions','Unanswered','My discussions'].map(x=>`<button class="${filter===x?'active':''}" data-forum-filter="${x}">${x}</button>`).join('')}</div></div><div class="forum-head"><span>Discussion</span><span>Topic</span><span>Author</span><span>Replies</span><span>Last activity</span></div>${filtered.length?filtered.map(f=>`<div class="forum-row" data-forum-open="${esc(f.id)}"><div class="forum-topic"><strong>${f.isSolved?'✓ ':''}${esc(f.title)}</strong><span>${f.isSolved?'Solved · ':''}${esc(excerpt(f.content,80))}</span></div><span class="status-pill blue">${esc(f.category||'')}</span><div class="author-cell">${avatar({name:f.authorName,initials:(f.authorName||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()})}<span>${esc(f.authorName)}</span></div><span>${f.replies.length}</span><span style="font-size:9.5px;color:var(--muted)">${timeAgo(f.createdAt)}</span></div>`).join(''):`<div class="work-empty-state">${icon('message')}<strong>No discussions match this view.</strong><span>Start a discussion to get the conversation going.</span></div>`}</main><aside>${solvedRecent.length?`<section class="card side-list"><div class="card-title"><div><h3>Knowledge that lasts</h3><p>Recently solved discussions.</p></div></div>${solvedRecent.map(x=>`<div class="detail-line" style="align-items:flex-start;color:var(--success)">${icon('check')}<div><strong style="font-size:10px;color:var(--ink)">${esc(x.title)}</strong><div style="font-size:9px;color:var(--muted);margin-top:3px">Solved · ${timeAgo(x.updatedAt||x.createdAt)}</div></div></div>`).join('')}</section>`:''}${topContributors.length?`<section class="card side-list" style="margin-top:14px"><div class="card-title"><h3>Top contributors</h3><span style="font-size:10px;color:var(--muted)">This forum</span></div>${topContributors.map(([name,count])=>`<div class="detail-line">${avatar({name,initials:(name||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()})}<div><strong style="font-size:10px">${esc(name)}</strong></div><span style="margin-left:auto;color:var(--blue);font-weight:700">${count}</span></div>`).join('')}</section>`:''}</aside></div>`;
  }
  function forumThreadView(f) {
    const nested=nestReplies(f.replies);
    const isAuthor=f.authorId===D.user.id;
    const related=(D.forumPosts||[]).filter(x=>x.id!==f.id&&x.category===f.category).slice(0,3);
    const renderReply=(r,depth)=>`<article class="post live-comment" style="margin-left:${depth*24}px"><div class="post-head">${avatar({name:r.authorName,initials:(r.authorName||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()})}<div><strong>${esc(r.authorName)}</strong><span> · ${timeAgo(r.createdAt)}</span></div></div><p>${postContentHtml(r.content)}</p><div class="post-actions"><button data-action="focus-reply" data-reply-target="${esc(r.id)}">Reply</button></div></article>${(r.children||[]).map(c=>renderReply(c,depth+1)).join('')}`;
    return `${pageHead('', '', `<button class="secondary-btn" data-action="back-forums">${icon('arrow')} Back to forums</button>`)}<div class="thread-layout"><main class="card thread-main"><div class="breadcrumb">Forums / ${esc(f.category||'')}</div><h1 class="thread-title">${esc(f.title)}</h1><div class="post original-post"><div class="post-head">${avatar({name:f.authorName,initials:(f.authorName||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()})}<div><strong>${esc(f.authorName)}</strong><span> · ${esc(f.category||'')} · ${timeAgo(f.createdAt)}</span></div>${f.isSolved?'<span class="status-pill low" style="margin-left:auto">Solved</span>':''}</div><p>${postContentHtml(f.content)}</p><div class="toolbar">${isAuthor?`<button class="ghost-btn small-btn" data-action="toggle-solved" data-post-solved="${esc(f.id)}">${icon('check')} ${f.isSolved?'Mark unsolved':'Mark as solved'}</button>`:''}</div></div><div class="discussion-count"><strong>${f.replies.length} repl${f.replies.length===1?'y':'ies'}</strong><span>Newest contributions appear immediately.</span></div>${nested.length?nested.map(r=>renderReply(r,0)).join(''):'<div class="empty-state-row">No replies yet. Be the first to respond.</div>'}${postReplyForm(f.id)}</main><aside><section class="card side-list"><div class="card-title"><h3>Thread details</h3></div><div class="detail-line">${icon('clock')}<span>Posted ${timeAgo(f.createdAt)}</span></div><div class="detail-line">${icon('message')}<span>${f.replies.length} repl${f.replies.length===1?'y':'ies'}</span></div></section>${related.length?`<section class="card side-list" style="margin-top:14px"><div class="card-title"><h3>Related discussions</h3></div>${related.map(x=>`<div class="rank-row" data-forum-open="${esc(x.id)}"><div>${icon('forum')}</div><div><strong>${esc(x.title)}</strong><span>${x.replies.length} replies</span></div></div>`).join('')}</section>`:''}</aside></div>`;
  }
function calendarWeekStart(){
    const now=new Date();
    const day=now.getDay();
    const diff=(day===0?-6:1-day);
    return new Date(now.getFullYear(),now.getMonth(),now.getDate()+diff);
  }
  function calendarWeekDays(){
    const monday=calendarWeekStart();
    const labels=['Mon','Tue','Wed','Thu','Fri'];
    const today=new Date(); today.setHours(0,0,0,0);
    return labels.map((lab,i)=>{
      const d=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+i);
      return {label:lab+' '+d.getDate(),isToday:d.getTime()===today.getTime()};
    });
  }
  function combinedWeekEvents(){
    const monday=calendarWeekStart();
    const mStart=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate());
    const mine=(D.myCalendarEntries||[]).map(x=>({...x,source:'mine'}));
    const company=(D.companyEvents||[]).map(x=>({...x,source:'company'}));
    return [...mine,...company].map(e=>{
      const start=new Date(e.startDate);
      const end=new Date(e.endDate||e.startDate);
      const dayStart=new Date(start.getFullYear(),start.getMonth(),start.getDate());
      const dayIndex=Math.round((dayStart-mStart)/86400000);
      const durMin=Math.max(15,Math.round((end-start)/60000));
      return {...e,start,end,dayIndex,durMin};
    }).filter(e=>e.dayIndex>=0&&e.dayIndex<5);
  }
  function selectedCalendarEvent(){
    const all=combinedWeekEvents();
    return all.find(e=>String(e.id)===String(state.calendarSelectedEvent))||all[0]||null;
  }
  function calendarView() {
    const week=calendarWeekDays();
    const monthLabel=new Date().toLocaleDateString('en-GB',{month:'long',year:'numeric'});
    const daysInMonth=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate();
    const todayDate=new Date().getDate();
    const selected=selectedCalendarEvent();
    const detailToggle=`<button class="secondary-btn calendar-detail-toggle" data-action="toggle-calendar-details">${icon(state.calendarDetailsOpen?'close':'calendar')} ${state.calendarDetailsOpen?'Hide':'Show'} event details</button>`;
    const todayLabel=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    const detailPane = !state.calendarDetailsOpen ? '' : (selected ? `<aside class="card calendar-side"><div class="card-title"><div><span class="eyebrow">Selected event</span><h3>${esc(selected.title)}</h3><p>${esc(selected.start.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}))} · ${esc(selected.start.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}))} – ${esc(selected.end.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}))}</p></div><button class="close-btn" data-action="toggle-calendar-details" aria-label="Collapse event details">${icon('close')}</button></div>${selected.location?`<div class="detail-line">${icon('location')}<span>${esc(selected.location)}</span></div>`:''}<div class="calendar-event-actions">${selected.googleCalendarLink?`<a class="primary-btn" href="${esc(selected.googleCalendarLink)}" target="_blank" rel="noopener">${icon('message')} Join meeting</a>`:''}${selected.source==='mine'?`<button class="secondary-btn" data-action="delete-calendar-entry" data-entry-id="${esc(selected.id)}">${icon('close')} Remove</button>`:''}</div>${selected.description?`<div class="detail-section"><h4>Details</h4><p>${esc(selected.description)}</p></div>`:''}${selected.source==='company'?`<div class="detail-section"><h4>Organiser</h4><p>${esc((selected.author&&(selected.author.firstName+' '+selected.author.lastName))||'Matanho')}</p></div>`:''}</aside>` : `<aside class="card calendar-side"><div class="card-title"><h3>No events this week</h3></div><div class="empty-state-row">Nothing on your calendar right now.</div></aside>`);
    return `${pageHead('Calendar','Plan your week, protect focus time and keep meeting context close.',`${detailToggle}<button class="secondary-btn" data-action="find-time">Find a time</button><button class="primary-btn" data-action="create-event">${icon('plus')} Create event</button>`)}<div class="calendar-layout ${state.calendarDetailsOpen?'':'details-collapsed'}"><aside class="card month-mini"><div class="card-title"><h3>${esc(monthLabel)}</h3><div>${icon('down')}</div></div><div class="month-grid">${['M','T','W','T','F','S','S',...Array.from({length:daysInMonth},(_,i)=>i+1)].map((x)=>`<span class="${x===todayDate?'active':''}">${x}</span>`).join('')}</div><div class="detail-section calendar-sources"><h4>Calendar sources</h4>${['My calendar','Company events'].map((x,i)=>`<div class="toggle-row"><span>${x}</span><button class="switch ${state.calendarSources[i]?'on':''}" data-action="calendar-source" data-index="${i}" aria-pressed="${state.calendarSources[i]}" aria-label="Toggle ${x}"></button></div>`).join('')}</div></aside><main class="card calendar-board"><div class="toolbar"><div class="segmented"><button>Day</button><button class="active">Week</button><button>Month</button></div><button class="secondary-btn small-btn">${esc(todayLabel)}</button><div class="calendar-toolbar-spacer"></div><button class="icon-only calendar-inline-detail" data-action="toggle-calendar-details" aria-label="Toggle event details">${icon(state.calendarDetailsOpen?'close':'chevron')}</button><div class="calendar-timezone">CAT</div></div><div class="calendar-scroll"><div class="week-grid"><div class="time-col"><div class="day-head">.</div>${[8,9,10,11,12,13,14,15,16,17].map((h,i)=>`<span class="time-label" style="top:${48+i*60}px">${String(h).padStart(2,'0')}:00</span>`).join('')}</div>${week.map((day,di)=>`<div class="day-col"><div class="day-head ${day.isToday?'active':''}">${esc(day.label)}</div>${calendarEventsForDay(di)}</div>`).join('')}</div></div></main>${detailPane}</div>`;
  }
  function calendarEventsForDay(di){
    return combinedWeekEvents().filter(e=>e.dayIndex===di).map(e=>{
      const top=48+(e.start.getHours()-8)*60+e.start.getMinutes();
      const cls=e.source==='company'?'sage':(e.entryType==='focus'?'gray':'blue');
      const timeLabel=e.start.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
      return `<div class="cal-event ${cls}" style="top:${Math.max(0,top)}px;height:${Math.max(34,e.durMin-5)}px" data-event="${esc(e.id)}"><strong>${esc(e.title)}</strong><br>${timeLabel}</div>`;
    }).join('');
  }

  function myWorkView() {
    const mode=state.workMode||'My work', project=state.workProject||'all', filter=state.workFilter||'All tasks', query=(state.workSearch||'').trim().toLowerCase();
    const projectSource=state.workProjects||D.workProjects;
    const projectStats=projectSource.map(p=>{
      const linked=state.workTasks.filter(t=>t.project===p.name);
      const progress=linked.length?Math.round(linked.reduce((sum,t)=>sum+(t.done?100:Number(t.progress)||0),0)/linked.length):Number(p.progress)||0;
      const open=linked.filter(t=>!t.done).length;
      const status=open&&progress<40?'At risk':progress>=80?'Ahead':'On track';
      return {...p,progress,open,status,linked};
    });
    let tasks=state.workTasks.filter(t=>project==='all'||t.project===project);
    if(filter==='Open') tasks=tasks.filter(t=>!t.done);
    if(filter==='Completed') tasks=tasks.filter(t=>t.done);
    if(filter==='High priority') tasks=tasks.filter(t=>t.status==='High'&&!t.done);
    if(query) tasks=tasks.filter(t=>`${t.title} ${t.project} ${t.owner} ${t.due}`.toLowerCase().includes(query));
    const isToday=t=>String(t.due).toLowerCase().includes('today')||String(t.due).toLowerCase()==='new';
    const groups=[['Due now',tasks.filter(t=>isToday(t)&&!t.done)],['This week',tasks.filter(t=>!isToday(t)&&!t.done)],['Completed',tasks.filter(t=>t.done)]];
    const completion=state.workTasks.length?Math.round(state.workTasks.filter(t=>t.done).length/state.workTasks.length*100):0;
    const avgProgress=state.workTasks.length?Math.round(state.workTasks.reduce((s,t)=>s+(t.done?100:Number(t.progress)||0),0)/state.workTasks.length):0;
    const dueToday=state.workTasks.filter(t=>isToday(t)&&!t.done).length;
    const taskRows=groups.map(([g,list])=>`<section class="dynamic-work-group"><div class="work-group-title"><span>${g}</span><b>${list.length}</b></div>${list.length?list.map(t=>`<article class="work-row dynamic-work-row ${t.done?'is-complete':''}" data-task-open="${t.id}"><button class="check-circle ${t.done?'checked':''}" data-work-toggle="${t.id}" aria-label="${t.done?'Reopen':'Complete'} ${esc(t.title)}">${t.done?icon('check'):''}</button><div class="work-task-title"><strong>${esc(t.title)}</strong><span>${esc(t.project)}</span></div><span class="project-tag">${esc(t.status||'Normal')}</span><span class="work-owner">${esc(t.owner)}</span><span class="work-due">${esc(t.due)}</span><label class="inline-progress" data-stop><span>${t.progress}%</span><select data-work-progress="${t.id}" aria-label="Progress for ${esc(t.title)}">${Array.from({length:11},(_,i)=>i*10).map(v=>`<option value="${v}" ${Number(t.progress)===v?'selected':''}>${v}%</option>`).join('')}</select></label><button class="task-more" data-task-open="${t.id}" aria-label="Open task">${icon('chevron')}</button></article>`).join(''):`<div class="work-empty-state">${icon('check')}<strong>No ${g.toLowerCase()} tasks match this view.</strong><span>Change the filters or add a new task.</span></div>`}</section>`).join('');
    const projectCards=projectStats.map(p=>`<button class="project-card ${project===p.name?'active':''} ${p.status==='At risk'?'at-risk':''}" data-work-project="${esc(p.name)}"><div><strong>${p.name}</strong><span>${p.open} open · ${p.status}</span></div><b>${p.progress}%</b><div class="progress-mini"><i style="width:${p.progress}%"></i></div></button>`).join('');
    const projectsView=`<div class="work-project-board">${projectStats.map((p,i)=>`<article class="card work-project-summary" data-work-project="${esc(p.name)}"><div class="project-summary-icon">${icon(['pie','people','services','news'][i%4])}</div><div><span class="eyebrow">${p.status}</span><h3>${p.name}</h3><p>${p.linked.length} tasks · ${p.linked.filter(t=>t.done).length} complete</p></div><strong>${p.progress}%</strong><div class="progress-bar"><span style="width:${p.progress}%"></span></div><button class="link-btn">Open project ${icon('arrow')}</button></article>`).join('')}</div>`;
    const teamRows=D.teamRows||[];
    const teamsView=teamRows.length?`<div class="work-team-board">${teamRows.map(p=>`<article class="card work-team-card">${avatar({name:p.name,initials:(p.name||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()})}<div><h3>${esc(p.name)}</h3><p>${esc(p.role||'Team member')} · ${p.openCount} open task${p.openCount===1?'':'s'}</p></div><strong>${p.progress}%</strong><div class="progress-bar"><span style="width:${p.progress}%"></span></div></article>`).join('')}</div>`:`<div class="work-empty-state">${icon('people')}<strong>No shared task assignments yet.</strong><span>Team workload appears here once tasks are assigned to more than one person.</span></div>`;
    const roadmapProject=project==='all'?(projectStats[0]?projectStats[0].name:null):project;
    const roadmapTasks=state.workTasks.filter(t=>t.project===roadmapProject).slice(0,5);
    return `${pageHead('My Work','Turn priorities into measurable progress.',`<select class="select-control" id="workQuarter"><option>Q3 2026</option><option>Q2 2026</option></select><button class="primary-btn" data-action="new-task">${icon('plus')} New task</button>`)}
      <section class="work-metric-strip">${[[state.workTasks.filter(t=>!t.done).length,'Open tasks','check'],[dueToday,'Due today','calendar'],[completion+'%','Completed','target'],[avgProgress+'%','Average progress','performance']].map(x=>`<div class="card work-metric-card"><span>${icon(x[2])}</span><div><strong>${x[0]}</strong><small>${x[1]}</small></div></div>`).join('')}</section>
      <section class="work-command-bar card"><label class="work-search">${icon('search')}<input id="workSearch" value="${esc(state.workSearch||'')}" placeholder="Search tasks, projects or owners…"/></label><select id="workStatusFilter" class="select-control">${['All tasks','Open','Completed','High priority'].map(x=>`<option ${filter===x?'selected':''}>${x}</option>`).join('')}</select><button class="secondary-btn" data-action="clear-work-filters">Clear filters</button><div class="work-live-summary"><span>${state.workTasks.filter(t=>!t.done).length} open</span><strong>${avgProgress}% moving</strong></div></section>
      <div class="work-layout dynamic-work-layout"><aside class="card project-list"><div class="card-title"><h3>Projects</h3></div><button class="project-card project-all ${project==='all'?'active':''}" data-work-project="all"><div><strong>All projects</strong><span>${state.workTasks.filter(t=>!t.done).length} open tasks</span></div><b>${avgProgress}%</b><div class="progress-mini"><i style="width:${avgProgress}%"></i></div></button>${projectCards}<button class="link-btn" style="margin:15px 4px" data-action="clear-work-filters">Reset project filter ${icon('arrow')}</button></aside><main class="card work-table dynamic-work-table"><div class="card-title"><div><h3>${mode}</h3><p>${tasks.filter(x=>!x.done).length} open tasks in this view</p></div><div class="segmented">${['My work','Projects','Teams'].map(x=>`<button class="${mode===x?'active':''}" data-work-mode="${x}">${x}</button>`).join('')}</div></div>${mode==='My work'?taskRows:mode==='Projects'?projectsView:teamsView}</main><aside class="work-side"><section class="card card-pad"><div class="card-title"><h3>Performance</h3><button class="link-btn" data-nav="performance">Open</button></div>${D.performanceOverview&&D.performanceOverview.available?`<div class="detail-section"><div style="display:flex;justify-content:space-between;align-items:baseline"><strong style="font-size:20px">${D.performanceOverview.overallScore!=null?D.performanceOverview.overallScore+'%':'—'}</strong><span style="font-size:10px;color:var(--muted)">${esc(D.performanceOverview.periodLabel||'')}</span></div><span style="font-size:10px;color:var(--muted)">${esc(D.performanceOverview.statusLabel||'Overall score')}</span></div>${D.performanceOverview.goals.slice(0,3).map(g=>`<div class="detail-section"><div style="display:flex;justify-content:space-between"><strong style="font-size:10px">${esc(g.title)}</strong><strong style="font-size:12px">${g.score!=null?g.score+'%':'—'}</strong></div><div class="progress-mini"><i style="width:${g.score||0}%"></i></div></div>`).join('')}`:`<div class="empty-state-row">${esc((D.performanceOverview&&D.performanceOverview.blockedReason)||'No active performance contract for this period.')}</div>`}</section></aside></div>
      ${roadmapProject?`<section class="card roadmap dynamic-roadmap"><div class="card-title"><div><h3>${esc(roadmapProject)} roadmap</h3><p>Milestones update immediately as linked tasks move.</p></div><button class="link-btn" data-work-project="${esc(roadmapProject)}">View project ${icon('arrow')}</button></div>${roadmapTasks.length?roadmapTasks.map((t,i)=>`<div class="roadmap-row"><span>${esc(t.title)}</span><div class="timeline"><span style="width:${Math.max(8,Number(t.progress)||0)}%;margin-left:${Math.min(10,i*2)}%">${t.done?'Completed':t.progress>=70?'In review':t.progress>=30?'In progress':'Planned'}</span></div></div>`).join(''):`<div class="work-empty-state"><strong>No linked milestones yet.</strong><span>Add a task to this project to populate the roadmap.</span></div>`}</section>`:''}`;
  }

  function balancedScorecardData(){
    return [
      {id:'Financial & Portfolio',short:'Financial',icon:'pie',weight:30,score:88,status:'On track',tone:'blue',
       strategicObjective:'Allocate capital efficiently, protect portfolio value and support disciplined enterprise growth.',
       goals:['Deliver sustainable AUM and mandate growth.','Maintain strong investment returns within agreed cost and risk boundaries.'],
       executionObjectives:['Convert priority pipeline opportunities into investable mandates.','Use verified portfolio and budget data to improve capital-allocation decisions.'],
       kpis:[
        {name:'AUM growth contribution',target:'12.0%',actual:'10.8%',achievement:90,weight:12,evidence:4,status:'On track'},
        {name:'Portfolio return vs benchmark',target:'+2.0 pp',actual:'+2.4 pp',achievement:100,weight:10,evidence:3,status:'Ahead'},
        {name:'Operating budget variance',target:'≤ 3.0%',actual:'2.6%',achievement:100,weight:8,evidence:2,status:'On track'}]},
      {id:'Stakeholder & Client',short:'Stakeholder',icon:'people',weight:25,score:92,status:'Ahead',tone:'emerald',
       strategicObjective:'Build trusted relationships and make every investor, client and partner interaction valuable.',
       goals:['Improve stakeholder confidence, retention and advocacy.','Deliver faster and clearer responses to stakeholder needs.'],
       executionObjectives:['Close stakeholder actions within agreed service levels.','Use feedback and engagement data to improve reporting and decision support.'],
       kpis:[
        {name:'Institutional client retention',target:'95%',actual:'97%',achievement:100,weight:10,evidence:4,status:'Ahead'},
        {name:'Investor satisfaction',target:'4.5 / 5',actual:'4.6 / 5',achievement:100,weight:8,evidence:5,status:'Ahead'},
        {name:'Strategic partner actions closed',target:'90%',actual:'82%',achievement:91,weight:7,evidence:2,status:'Watch'}]},
      {id:'Internal Process & Governance',short:'Process',icon:'services',weight:25,score:84,status:'Watch',tone:'amber',
       strategicObjective:'Strengthen execution quality, governance discipline and the reliability of critical investment processes.',
       goals:['Improve delivery speed without weakening control.','Increase first-pass quality across investment, risk and board workflows.'],
       executionObjectives:['Standardise review gates, ownership and escalation rules.','Use workflow evidence and service data to remove recurring bottlenecks.'],
       kpis:[
        {name:'Investment papers delivered on time',target:'95%',actual:'89%',achievement:94,weight:10,evidence:4,status:'Watch'},
        {name:'Risk actions closed by due date',target:'90%',actual:'78%',achievement:87,weight:8,evidence:3,status:'Needs attention'},
        {name:'Board pack first-pass quality',target:'90%',actual:'85%',achievement:94,weight:7,evidence:3,status:'On track'}]},
      {id:'Learning & Growth',short:'Growth',icon:'learning',weight:20,score:86,status:'On track',tone:'violet',
       strategicObjective:'Build the leadership depth, specialist capability and knowledge-sharing habits required for long-term growth.',
       goals:['Increase leadership leverage and succession readiness.','Turn personal expertise into stronger team capability.'],
       executionObjectives:['Complete targeted development milestones and apply them to live work.','Coach emerging leaders and run practical knowledge-sharing sessions.'],
       kpis:[
        {name:'Leadership development plan',target:'100%',actual:'80%',achievement:80,weight:8,evidence:3,status:'Watch'},
        {name:'Succession coverage for key roles',target:'2 roles',actual:'2 roles',achievement:100,weight:7,evidence:2,status:'Ahead'},
        {name:'Knowledge-sharing commitments',target:'4 sessions',actual:'3 sessions',achievement:75,weight:5,evidence:3,status:'Watch'}]}
    ];
  }

  function performanceScorecard(){
    const perspectives=balancedScorecardData();
    const active=perspectives.find(p=>p.id===state.scorecardPerspective)||perspectives[0];
    const overall=Math.round(perspectives.reduce((sum,p)=>sum+p.score*p.weight/100,0));
    const weightedContribution=perspectives.map(p=>({...p,contribution:(p.score*p.weight/100).toFixed(1)}));
    const matrixRows=perspectives.map(p=>`<article class="bsc-matrix-row ${active.id===p.id?'active':''}" data-scorecard-perspective="${esc(p.id)}" role="button" tabindex="0" aria-label="Open ${esc(p.id)} perspective">
      <div class="bsc-matrix-cell bsc-matrix-perspective ${p.tone}" data-label="Perspective & strategic objective"><div class="bsc-matrix-perspective-top"><span class="bsc-map-icon ${p.tone}">${icon(p.icon)}</span><strong>${p.id}</strong></div><p>${p.strategicObjective}</p><small>${p.weight}% of personal scorecard · ${p.kpis.length} measures</small></div>
      <div class="bsc-matrix-cell" data-label="Goal"><ul>${p.goals.map(x=>`<li>${x}</li>`).join('')}</ul></div>
      <div class="bsc-matrix-cell" data-label="Objective"><ul>${p.executionObjectives.map(x=>`<li>${x}</li>`).join('')}</ul></div>
      <div class="bsc-matrix-cell" data-label="KPIs"><div class="bsc-matrix-kpis">${p.kpis.map(k=>`<div class="bsc-matrix-kpi"><strong>${k.name}</strong><span>${k.actual}</span></div>`).join('')}</div></div>
      <div class="bsc-matrix-cell" data-label="Targets"><div class="bsc-matrix-targets">${p.kpis.map(k=>`<span>${k.target}</span>`).join('')}</div></div>
      <div class="bsc-matrix-cell" data-label="Progress"><div class="bsc-progress-summary"><div class="bsc-progress-head"><strong>${p.score}</strong><span>${p.weight}% weight</span></div><div class="bsc-progress-track"><i style="width:${Math.min(100,p.score)}%"></i></div><div class="bsc-progress-foot"><span class="status-pill ${p.status==='Ahead'?'low':p.status==='Watch'?'medium':'blue'}">${p.status}</span><small>${(p.score*p.weight/100).toFixed(1)} weighted points</small></div></div></div>
    </article>`).join('');
    return `<div class="balanced-scorecard-page">
      <section class="card bsc-summary-card"><div class="bsc-person"><div class="bsc-avatar">${avatar(D.user)}</div><div><span class="eyebrow">Personal balanced scorecard</span><h2>${esc(D.user.name)}</h2><p>${esc(D.user.role)} · Q3 2026 · Strategy aligned</p></div></div><div class="bsc-overall"><div class="bsc-ring" style="--score:${overall}"><div><strong>${overall}</strong><span>Weighted score</span></div></div><div><strong>Strong</strong><span>3 perspectives on track</span><small>Weighted across 100%</small></div></div><div class="bsc-actions"><button class="secondary-btn" data-action="export-scorecard">${icon('download')} Export</button><button class="primary-btn" data-action="prepare-review">${icon('edit')} Prepare review</button></div></section>
      <section class="card bsc-matrix-card"><div class="bsc-matrix-titlebar"><div><span class="eyebrow">Balanced scorecard matrix</span><h3>From strategic intent to measurable personal performance</h3><p>Select a perspective to inspect the objectives, measures, evidence and progress that make up Fadzai’s score.</p></div><span class="status-pill blue">Q3 2026 · Live</span></div><div class="bsc-matrix-header"><span>Perspective & strategic objective</span><span>Goal</span><span>Objective</span><span>KPIs</span><span>Targets</span><span>Progress</span></div><div class="bsc-matrix-body">${matrixRows}</div></section>
      <div class="bsc-focus-layout"><main class="card card-pad bsc-focus-card"><div class="card-title"><div><span class="eyebrow">${active.id}</span><h3>${active.strategicObjective}</h3><p>${active.weight}% of the total personal scorecard.</p></div><span class="status-pill ${active.status==='Ahead'?'low':active.status==='Watch'?'medium':'blue'}">${active.status}</span></div><div class="bsc-focus-path"><div class="bsc-path-step"><span>Strategic objective</span><p>${active.strategicObjective}</p></div><div class="bsc-path-step"><span>Goals</span><ul>${active.goals.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="bsc-path-step"><span>Execution objectives</span><ul>${active.executionObjectives.map(x=>`<li>${x}</li>`).join('')}</ul></div></div><div class="card-title" style="margin-top:18px"><div><span class="eyebrow">Personal measures</span><h3>KPIs, targets and verified progress</h3></div><span class="bsc-weight-chip">${active.kpis.reduce((s,k)=>s+k.evidence,0)} evidence items</span></div><div class="bsc-kpi-grid">${active.kpis.map((k,i)=>`<article class="bsc-kpi-card"><div class="bsc-kpi-card-head"><h4>${k.name}</h4><button class="icon-only more-actions-btn" data-scorecard-kpi="${i}" data-scorecard-perspective="${esc(active.id)}" aria-label="More options for ${esc(k.name)}">${icon('more')}</button></div><div class="bsc-kpi-card-meta"><div><span>Target</span><strong>${k.target}</strong></div><div><span>Current</span><strong>${k.actual}</strong></div><div><span>Achievement</span><strong>${k.achievement}%</strong></div></div><div class="bsc-progress-track"><i style="width:${Math.min(100,k.achievement)}%"></i></div><div class="bsc-kpi-card-footer"><span class="status-pill ${k.status==='Ahead'?'low':k.status==='Needs attention'?'high':k.status==='Watch'?'medium':'blue'}">${k.status}</span><small>${k.weight}% weight · ${k.evidence} evidence</small></div></article>`).join('')}</div></main><aside class="bsc-side-column"><section class="card card-pad bsc-progress-panel"><div class="card-title"><div><span class="eyebrow">Progress</span><h3>Weighted score composition</h3></div></div><div class="bsc-ring" style="--score:${overall}"><div><strong>${overall}</strong><span>Overall</span></div></div><div class="bsc-progress-panel-copy"><strong>Strong performance</strong><span>${perspectives.filter(p=>p.status!=='Watch').length} perspectives on track</span><small>Calculated from 100% total weighting</small></div>${weightedContribution.map(p=>`<div class="bsc-contribution-row"><span>${p.short}</span><div class="progress-mini"><i style="width:${Math.min(100,p.score)}%"></i></div><strong>${p.contribution}</strong></div>`).join('')}</section><section class="card card-pad" style="margin-top:14px"><div class="card-title"><div><span class="eyebrow">Management attention</span><h3>Next meaningful actions</h3></div></div>${[['Close overdue risk actions','Internal Process & Governance','31 Aug'],['Complete leadership-plan milestone','Learning & Growth','12 Sep'],['Close partner action backlog','Stakeholder & Client','06 Sep']].map((x,i)=>`<div class="bsc-action-row"><span class="goal-rank">0${i+1}</span><div><strong>${x[0]}</strong><small>${x[1]} · Due ${x[2]}</small></div>${icon('chevron')}</div>`).join('')}</section></aside></div>
    </div>`;
  }

  function performanceView() {
    const periods={'Q3 2026':1,'Q2 2026':.91,'Q1 2026':.84}, mult=periods[state.performancePeriod]||1;
    const tabs=['Overview','Scorecard','Goals','Feedback','Development'];
    const body=state.performanceTab==='Scorecard'?performanceScorecard():state.performanceTab==='Goals'?performanceGoals(mult):state.performanceTab==='Feedback'?performanceFeedback():state.performanceTab==='Development'?performanceDevelopment():performanceOverview(mult);
    return `${pageHead('My Performance','A clear view of outcomes, contribution, evidence and growth.',`<button class="secondary-btn" data-action="open-scorecard">${icon('performance')} Balanced scorecard</button><button class="primary-btn" data-action="prepare-review">${icon('edit')} Prepare review</button>`)}<div class="performance-controls"><select class="select-control" id="performancePeriod"><option>Q3 2026</option><option>Q2 2026</option><option>Q1 2026</option></select><div class="performance-tabs">${tabs.map(t=>`<button class="${state.performanceTab===t?'active':''}" data-performance-tab="${t}">${t}</button>`).join('')}</div><span class="live-sync"><i></i> Scorecard synced 4 min ago</span></div>${body}`;
  }

  function performanceOverview(mult){
    const perf=D.performanceOverview;
    if(!perf||!perf.available){
      return `<div class="performance-page-v9"><section class="card card-pad"><div class="empty-state">${icon('performance')}<h3>No active performance contract</h3><p>${esc((perf&&perf.blockedReason)||'Your reviewer has not opened a performance contract for the current period yet.')}</p></div></section></div>`;
    }
    const goals=perf.goals||[];
    return `<div class="performance-page-v9"><section class="card performance-hero-v9"><div class="performance-hero-copy"><span class="eyebrow">${esc(perf.periodLabel||'Current period')}</span><h2>${esc(perf.contractTitle||'Your performance contract')}</h2><p>${goals.length} linked goal${goals.length===1?'':'s'} · ${esc(perf.statusLabel||'In progress')}</p><div class="performance-hero-actions"><button class="primary-btn" data-nav="my-work">Open linked work ${icon('arrow')}</button></div></div><div class="performance-score-v9"><div class="score-ring" style="--score:${Math.round(perf.overallScore||0)}"><div><strong>${perf.overallScore!=null?Math.round(perf.overallScore):'—'}</strong><span>Overall score</span></div></div></div></section>
      <section class="card card-pad"><div class="card-title"><div><span class="eyebrow">Goal portfolio</span><h3>Weighted goals for this period</h3></div></div>${goals.length?goals.map((g,i)=>`<div class="goal-row-v4"><div class="goal-rank">0${i+1}</div><div class="goal-title"><strong>${esc(g.title)}</strong><span>${g.weight!=null?g.weight+'% weighting':'No weighting set'}</span></div><div class="goal-progress"><div class="progress-mini"><i style="width:${g.score||0}%"></i></div><strong>${g.score!=null?g.score+'%':'—'}</strong></div>${g.status?`<span class="confidence">${esc(g.status)}</span>`:''}</div>`).join(''):`<div class="work-empty-state">${icon('target')}<strong>No goals linked yet.</strong><span>Goals your reviewer links to this contract will appear here.</span></div>`}</section></div>`;
  }

  function performanceGoals(mult){
    return `<div class="performance-detail-grid"><main><section class="card card-pad"><div class="card-title"><div><span class="eyebrow">Goal portfolio</span><h3>Four weighted goals</h3></div><button class="primary-btn" data-action="prepare-review">Add goal update</button></div>${[['Zambia renewable energy mandate','Deliver final investment recommendation and close diligence items.',78,'High','31 Aug 2026',['Financial model complete','Risk committee sign-off','IC recommendation']],['Diversify sector research pipeline','Publish two investable sector theses for the next mandate cycle.',65,'Medium','15 Sep 2026',['Healthcare thesis draft','Logistics data room','Expert interviews']],['Build client insights capability','Create a repeatable client intelligence briefing format.',72,'High','30 Sep 2026',['Pilot brief delivered','Client feedback captured','Template approved']],['Team knowledge sharing','Run two practical learning sessions for the investment team.',60,'Medium','20 Sep 2026',['Session one complete','Materials published','Session two scheduled']]].map((g,i)=>`<article class="goal-detail-card" data-performance-goal="${i}"><div class="goal-detail-head"><div><span class="goal-number">0${i+1}</span><div><h3>${g[0]}</h3><p>${g[1]}</p></div></div><span class="confidence ${g[3].toLowerCase()}"><i></i>${g[3]} confidence</span></div><div class="goal-detail-metrics"><div><span>Progress</span><strong>${g[2]}%</strong></div><div><span>Weight</span><strong>${[40,25,20,15][i]}%</strong></div><div><span>Due</span><strong>${g[4]}</strong></div><div><span>Evidence</span><strong>${3-i%2} items</strong></div></div><div class="goal-detail-progress"><div class="progress-mini"><i style="width:${g[2]}%"></i></div></div><div class="milestone-list">${g[5].map((m,j)=>`<div class="milestone ${j<(i===0?2:1)?'done':''}"><span>${j<(i===0?2:1)?icon('check'):''}</span><strong>${m}</strong><small>${j<(i===0?2:1)?'Completed':'Upcoming'}</small></div>`).join('')}</div></article>`).join('')}</section></main><aside><section class="card card-pad"><div class="card-title"><h3>Goal alignment</h3></div>${[['Company goal','Sustainable growth in core markets','74%'],['Department objective','Grow enterprise pipeline','68%'],['Personal contribution','Win 12 enterprise accounts','50%']].map((x,i)=>`<div class="alignment-step"><span>${i+1}</span><div><strong>${x[0]}</strong><p>${x[1]}</p></div><b>${x[2]}</b></div>`).join('')}</section><section class="card card-pad" style="margin-top:14px"><div class="card-title"><h3>Evidence library</h3><button class="link-btn">Open all</button></div>${[['Zambia model v8.xlsx','Updated 2h ago','excel'],['IC recommendation.pdf','Updated yesterday','pdf'],['Client feedback notes.docx','Updated 3d ago','doc']].map(x=>`<div class="evidence-row"><span class="file-type ${x[2]}">${x[2].toUpperCase()}</span><div><strong>${x[0]}</strong><small>${x[1]}</small></div>${icon('chevron')}</div>`).join('')}</section><section class="card card-pad" style="margin-top:14px"><div class="card-title"><h3>Risks & blockers</h3></div><div class="risk-item"><span class="status-dot busy"></span><div><strong>Regulatory data outstanding</strong><p>One diligence item is waiting on external confirmation.</p></div></div><div class="risk-item"><span class="status-dot meeting"></span><div><strong>Sector note review</strong><p>Editorial review is booked for Friday.</p></div></div></section></aside></div>`;
  }
  function performanceFeedback(){
    return `<div class="feedback-dashboard"><section class="card feedback-summary-card"><div><span class="eyebrow">360° feedback</span><h2>Trusted, precise and increasingly influential.</h2><p>Feedback from managers, peers and project partners consistently highlights analytical judgement and client confidence. The clearest development opportunity is delegation.</p></div><div class="feedback-score-ring"><strong>4.6</strong><span>out of 5</span><small>18 responses</small></div></section><section class="feedback-metrics">${[['Manager','4.7','2 responses'],['Peers','4.5','9 responses'],['Project partners','4.6','7 responses']].map((x,i)=>`<div class="card feedback-metric"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small><div class="rating-stars">★★★★★</div></div>`).join('')}</section><div class="feedback-content-grid"><section class="card card-pad"><div class="card-title"><div><span class="eyebrow">Themes</span><h3>What is showing up repeatedly</h3></div></div>${[['Analytical judgement',92,'A consistent strength'],['Client confidence',88,'Strong positive signal'],['Collaboration',82,'Reliable and generous'],['Delegation',64,'Primary development area']].map((x,i)=>`<div class="theme-row"><div><strong>${x[0]}</strong><span>${x[2]}</span></div><div class="progress-mini"><i style="width:${x[1]}%"></i></div><b>${x[1]}%</b></div>`).join('')}</section><section class="card card-pad"><div class="card-title"><div><span class="eyebrow">Comments</span><h3>Selected feedback</h3></div><select class="select-control small-btn"><option>All feedback</option><option>Manager</option><option>Peers</option></select></div>${D.people.slice(0,4).map((p,i)=>`<article class="quote-feedback">${avatar(p)}<div><div><strong>${p.name}</strong><span>${['Manager','Project peer','Client partner','Cross-functional peer'][i]}</span></div><blockquote>${['Fadzai creates calm around complex investment decisions and is trusted to surface the issue that matters.','The quality of analysis is consistently high. More delegation would help the team learn faster.','Communication is concise, commercially aware and easy to act on.','A generous collaborator who improves the quality of the room, not only the output.'][i]}</blockquote><small>${['15 Jul 2026','10 Jul 2026','03 Jul 2026','28 Jun 2026'][i]}</small></div></article>`).join('')}</section></div></div>`;
  }
  function performanceDevelopment(){
    return `<div class="development-grid"><main><section class="card development-hero"><div><span class="eyebrow">Development plan</span><h2>Build deeper leadership leverage without losing analytical quality.</h2><p>Your next growth edge is not doing more. It is creating stronger decision systems, delegating earlier and increasing the capability of the team around you.</p></div><div class="development-progress"><strong>68%</strong><span>Plan progress</span><div class="progress-mini"><i style="width:68%"></i></div></div></section><section class="card card-pad" style="margin-top:14px"><div class="card-title"><div><span class="eyebrow">Active development objectives</span><h3>Three focused commitments</h3></div><button class="primary-btn">Add objective</button></div>${[['Delegate portfolio workstreams earlier','Create explicit owners, decision rights and review points.',72,'31 Aug 2026'],['Lead knowledge-sharing programme','Run two practical investment judgement sessions.',60,'20 Sep 2026'],['Complete Advanced Valuation','Finish the programme and apply it to a live mandate.',84,'30 Jul 2026']].map((x,i)=>`<article class="development-objective"><div class="objective-icon">${icon(['people','learning','target'][i])}</div><div><h3>${x[0]}</h3><p>${x[1]}</p><div class="objective-meta"><span>${x[2]}% complete</span><span>Due ${x[3]}</span></div><div class="progress-mini"><i style="width:${x[2]}%"></i></div></div><button class="ghost-btn">Update</button></article>`).join('')}</section></main><aside><section class="card card-pad"><div class="card-title"><h3>Capability matrix</h3></div>${[['Investment judgement','Advanced',90],['Leadership leverage','Developing',66],['Commercial communication','Strong',82],['People development','Developing',62]].map(x=>`<div class="capability-row"><div><strong>${x[0]}</strong><span>${x[1]}</span></div><div class="progress-mini"><i style="width:${x[2]}%"></i></div></div>`).join('')}</section><section class="card card-pad" style="margin-top:14px"><div class="card-title"><h3>Learning activity</h3><button class="link-btn">View academy</button></div>${[['Advanced Valuation','84%','In progress'],['Leading through ambiguity','Completed','Certificate'],['Coaching for performance','Starts 12 Aug','Upcoming']].map((x,i)=>`<div class="learning-row"><div class="task-icon">${icon('learning')}</div><div><strong>${x[0]}</strong><span>${x[1]} · ${x[2]}</span></div>${icon('chevron')}</div>`).join('')}</section><section class="card card-pad" style="margin-top:14px"><div class="card-title"><h3>Manager check-ins</h3></div><div class="checkin-card"><span>Next check-in</span><strong>12 August · 09:30</strong><small>With Chipo Dube</small><button class="secondary-btn">Open agenda</button></div></section></aside></div>`;
  }
  function peopleView() {
    const query=(state.peopleSearch||'').trim().toLowerCase();
    const deptFilter=state.peopleDept||'All departments';
    const all=D.directory||[];
    const depts=Array.from(new Set(all.map(p=>p.department).filter(Boolean))).sort();
    let filtered=all;
    if(deptFilter!=='All departments') filtered=filtered.filter(p=>p.department===deptFilter);
    if(query) filtered=filtered.filter(p=>`${p.name} ${p.email} ${p.department||''} ${p.role||''}`.toLowerCase().includes(query));
    const selected=filtered.find(p=>p.id===state.selectedPerson)||all.find(p=>p.id===state.selectedPerson)||filtered[0];
    return `${pageHead('People','Find colleagues across Matanho.','')}<div class="people-layout people-layout-v4"><main><section class="people-stats people-stats-v4">${[[String(all.length),'Colleagues'],[String(depts.length),'Departments']].map((x,i)=>`<div class="card people-stat"><div class="task-icon">${icon(i===0?'people':'building')}</div><div><strong>${x[0]}</strong><span>${x[1]}</span></div></div>`).join('')}</section><div class="people-toolbar-v4"><div class="people-search-wrap">${icon('search')}<input id="peopleSearch" value="${esc(state.peopleSearch||'')}" placeholder="Search by name, email, department or role…"/></div><select class="select-control" id="peopleDept"><option ${deptFilter==='All departments'?'selected':''}>All departments</option>${depts.map(d=>`<option ${deptFilter===d?'selected':''}>${esc(d)}</option>`).join('')}</select></div><section class="card people-table people-table-v4"><div class="people-head"><span>Colleague</span><span>Department</span><span>Role</span><span></span></div>${filtered.length?filtered.map(p=>`<div class="person-row ${selected&&p.id===selected.id?'active':''}" data-person="${esc(p.id)}"><div class="person-name">${avatar({name:p.name,initials:(p.name||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()})}<div><strong>${esc(p.name)}</strong><span>${esc(p.email)}</span></div></div><span>${esc(p.department||'—')}</span><span>${esc(p.role||'—')}</span>${icon('chevron')}</div>`).join(''):`<div class="work-empty-state">${icon('people')}<strong>No colleagues match this search.</strong><span>Try a different name, department or role.</span></div>`}</section></main>${selected?`<aside class="card person-detail person-detail-v4">${personDetail(selected)}</aside>`:''}</div>`;
  }
function personDetail(p){
    return `<div class="profile-hero-v4"><div class="profile-photo-large">${avatar({name:p.name,initials:(p.name||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()})}</div><div class="profile-identity"><h2>${esc(p.name)}</h2><p>${esc(p.role||'Team member')}<br>${esc(p.department||'')}</p></div></div><div class="profile-actions"><button class="secondary-btn" data-action="schedule-person">${icon('calendar')} Schedule time</button></div><div class="detail-section"><h4>Contact</h4><div class="detail-line">${icon('newsletter')}<span>${esc(p.email)}</span></div></div>`;
  }
function profileView() {
    const tab=state.profileTab||'Overview';
    const tabs=['Overview','Goals'];
    const perf=D.performanceOverview;
    const openTasks=(D.workTasks||[]).filter(t=>!t.done).slice(0,3);
    const week=calendarWeekDays();
    const overview=`<div class="profile-overview-v8 profile-tab-content-v8">
      <div class="profile-column-v8">
        <section class="card info-card"><div class="profile-card-head"><div><h3>Performance</h3><p>Your current scorecard.</p></div><button class="link-btn" data-nav="performance">View scorecard</button></div>${perf&&perf.available?`<div class="detail-section"><div style="display:flex;justify-content:space-between;align-items:baseline"><strong style="font-size:28px">${perf.overallScore!=null?Math.round(perf.overallScore)+'%':'—'}</strong><span style="font-size:10px;color:var(--muted)">${esc(perf.periodLabel||'')}</span></div><span style="font-size:10px;color:var(--muted)">${esc(perf.statusLabel||'Overall score')}</span></div>`:`<div class="empty-state-row">${esc((perf&&perf.blockedReason)||'No active performance contract for this period.')}</div>`}</section>
      </div>
      <div class="profile-column-v8">
        <section class="card info-card"><div class="profile-card-head"><div><h3>Current focus</h3><p>Your open tasks.</p></div><button class="link-btn" data-nav="my-work">Open My Work</button></div>${openTasks.length?openTasks.map(t=>`<button class="profile-focus-item" data-nav="my-work"><div class="task-icon">${icon('check')}</div><div><strong>${esc(t.title)}</strong><span>${esc(t.project)}</span></div><b>${t.progress}%</b>${icon('chevron')}</button>`).join(''):`<div class="empty-state-row">No open tasks right now.</div>`}</section>
      </div>
      <aside class="profile-column-v8">
        <section class="card info-card"><div class="profile-card-head"><div><h3>This week</h3><p>Your calendar week.</p></div><button class="link-btn" data-nav="calendar">Calendar</button></div><div class="profile-week-v8">${week.map(d=>`<div class="profile-week-day ${d.isToday?'today':''}"><span>${esc(d.label.split(' ')[0])}</span><strong>${esc(d.label.split(' ')[1]||'')}</strong></div>`).join('')}</div></section>
        <section class="card info-card"><div class="profile-card-head"><div><h3>Organisation</h3><p>Your position at Matanho.</p></div></div><div class="detail-line"><i class="status-dot available"></i><div><strong>${esc(D.user.role)}</strong><div style="font-size:9px;color:var(--muted)">Role</div></div></div><div class="detail-line"><i class="status-dot meeting"></i><div><strong>${esc(D.user.location||'Not set')}</strong><div style="font-size:9px;color:var(--muted)">Department</div></div></div></section>
      </aside>
    </div>`;
    const goals=`<div class="profile-tab-content-v8">${perf&&perf.available?`<div class="profile-card-head"><div><h3>My aligned goals</h3><p>${esc(perf.contractTitle||'Current performance contract')}</p></div><button class="primary-btn" data-nav="performance">Open full scorecard</button></div><div class="profile-goal-grid">${perf.goals.length?perf.goals.map(g=>`<article class="card profile-goal-card"><div class="profile-goal-head"><h3>${esc(g.title)}</h3><span>${g.score!=null?g.score+'%':'—'}</span></div><div class="progress-bar"><span style="width:${g.score||0}%"></span></div><div class="profile-goal-meta"><span>${g.weight!=null?g.weight+'% weight':'No weighting set'}</span>${g.status?`<span>${esc(g.status)}</span>`:''}</div></article>`).join(''):`<div class="empty-state-row">No goals linked yet.</div>`}</div>`:`<div class="empty-state">${icon('performance')}<h3>No active performance contract</h3><p>${esc((perf&&perf.blockedReason)||'Your reviewer has not opened a performance contract for the current period yet.')}</p></div>`}</div>`;
    const content={Overview:overview,Goals:goals}[tab]||overview;
    return `${pageHead('My Profile','Manage how you appear and connect across Matanho.',`<button class="secondary-btn" data-action="copy-profile">Copy profile link</button><button class="primary-btn" data-action="edit-profile">${icon('edit')} Edit profile</button>`)}<div class="profile-page profile-page-v8"><section class="card profile-banner profile-banner-v8"><div class="profile-portrait-wrap">${avatar(D.user,'blue')}</div><div class="profile-banner-copy"><h2>${esc(D.user.name)}</h2><p>${esc(D.user.role)}</p><div class="profile-meta-row"><span class="profile-meta-chip">${icon('newsletter')} ${esc(D.user.email)}</span>${D.user.location?`<span class="profile-meta-chip">${icon('building')} ${esc(D.user.location)}</span>`:''}</div></div></section><nav class="profile-tabs profile-tabs-v8" aria-label="Profile sections">${tabs.map(x=>`<button class="${tab===x?'active':''}" data-profile-tab="${x}">${x}</button>`).join('')}</nav>${content}</div>`;
  }
function servicesView() {
    return `${pageHead('Employee Services','Everything you need, with clear status and accountable owners.',`<button class="primary-btn" data-service="leave">${icon('calendar')} Request leave</button>`)}
      <div class="services-layout"><main><section class="card service-search"><div class="card-title"><div><h3>How can we help today?</h3><p>Search services, policies, support and more.</p></div></div><input class="input-control" id="serviceSearch" placeholder="Search leave, payroll, travel, learning…"/></section><section class="summary-grid">${servicesSummaryTiles().map((x,i)=>`<article class="card summary-service ${i===0?'clickable':''}" ${i===0?'data-service="leave"':''}><div class="task-icon">${icon(['calendar','wallet','receipt','learning'][i])}</div><strong>${x[0]}</strong><span>${x[1]} · ${x[2]}</span></article>`).join('')}</section><section class="card card-pad"><div class="card-title"><h3>Browse services</h3></div><div class="service-grid">${D.services.map(s=>`<article class="card service-card card-hover" data-service="${s.id}"><div class="task-icon">${icon(s.icon)}</div><div><h4>${s.name}</h4><p>${s.description}</p></div>${icon('chevron')}</article>`).join('')}</div></section><section class="card request-table"><div class="card-title" style="padding:16px 14px 0"><h3>My requests</h3><button class="link-btn">View all requests</button></div><div class="request-head"><span>Request #</span><span>Service</span><span>Submitted</span><span>Owner</span><span>Status</span><span>Next action</span></div>${state.requests.map(r=>`<div class="request-row"><span>${r.id}</span><span>${r.service}</span><span>${r.submitted}</span><span>${r.owner}</span><span class="status-pill ${r.status==='Completed'?'low':r.status==='Pending'?'medium':'blue'}">${r.status}</span><span>${r.next}</span></div>`).join('')}</section></main><aside><section class="card concierge"><div class="assistant-orb" style="width:42px;height:42px">${icon('sparkles')}</div><h3 style="margin-top:12px">Matanho AI Concierge</h3><p>Ask a question or start a service request.</p>${['What is the annual leave policy?','How do I claim travel expenses?','When is the next public holiday?'].map(x=>`<button class="prompt-chip" data-ai-prompt="${x}">${x}</button>`).join('')}<form class="assistant-input" style="min-width:0;width:100%;margin-top:12px" id="serviceAi"><input name="prompt" placeholder="Describe what you need…"/><button>${icon('send')}</button></form></section><section class="card concierge" style="margin-top:14px"><div class="card-title"><h3>Quick actions</h3></div>${[['Request leave','Apply for annual or other leave','leave'],['Download payslip','View or download your payslip','payroll'],['Submit expense','Claim expenses and per diems','expenses'],['Book travel','Flights, hotels and car hire','travel'],['Report an issue','Get help with IT or facilities','support']].map((x,i)=>`<div class="quick-action" data-service="${x[2]}"><div class="task-icon">${icon(['calendar','wallet','receipt','plane','support'][i])}</div><div><strong>${x[0]}</strong><span>${x[1]}</span></div>${icon('chevron')}</div>`).join('')}</section></aside></div>`;
  }

  function appsView() {
    const groups=[...new Set(state.apps.map(a=>a.category))], requestFor=id=>state.appAccessRequests.find(r=>r.appId===id&&r.status==='Pending');
    const pinned=state.apps.filter(a=>a.hasAccess).slice(0,6);
    const recent=state.apps.filter(a=>a.hasAccess).slice(2,6);
    const categoryIcons={Investment:'pie','Finance & Operations':'calculator','People & Work':'people',Insights:'performance',Communication:'message'};
    const categoryList=groups.map((name,i)=>({name,count:state.apps.filter(a=>a.category===name).length,icon:categoryIcons[name]||'apps',tone:i%6}));
    return `<div class="apps-v9">${pageHead('Apps','Your gateway to the tools, services and resources you need to do your best work.',`<button class="secondary-btn" data-action="view-access-requests">${icon('lock')} Access requests</button><button class="primary-btn" data-action="build-workflow">${icon('plus')} Build workflow</button>`)}<div class="apps-hero-row"><input class="input-control app-search" id="appSearch" style="height:50px" placeholder="Find an app, workflow or action…"/><select class="select-control" id="appCategory"><option>All categories</option>${groups.map(g=>`<option>${g}</option>`).join('')}</select></div><div class="card-title"><div><h3>Pinned apps</h3><p>Your most important tools, all in one place.</p></div><button class="link-btn">Edit pins ${icon('edit')}</button></div><section class="premium-pinned-grid">${pinned.map((a,i)=>`<article class="card premium-app-tile" data-launch-app="${a.id}"><button class="pin-btn ${a.pinned?'pinned':''}" data-pin-app="${a.id}" title="Pin app">${icon('pin')}</button><div class="premium-app-icon tone-${i%6}">${icon(a.icon)}</div><h3>${a.name}</h3><p>${a.description}</p></article>`).join('')}</section><div class="apps-mid-grid-v9"><section class="card card-pad"><div class="card-title"><div><h3>Recently used</h3><p>Quickly reopen your latest workspaces.</p></div></div><div class="recent-app-grid-v9">${recent.map((a,i)=>`<article class="card recent-app-v9 card-hover" data-launch-app="${a.id}"><div class="premium-app-icon tone-${(i+2)%6}">${icon(a.icon)}</div><h4>${a.name}</h4><p>${['2 hours ago','Yesterday','2 days ago','3 days ago'][i]}</p></article>`).join('')}</div></section><section class="card card-pad"><div class="card-title"><div><h3>Access requests</h3><p>Track pending and approved access.</p></div><button class="link-btn" data-action="view-access-requests">View all requests ${icon('arrow')}</button></div><div class="access-list-v9">${state.appAccessRequests.length?state.appAccessRequests.slice(0,4).map((r,i)=>{const a=state.apps.find(x=>x.id===r.appId);return `<div class="access-row-v9"><div class="premium-app-icon tone-${(i+2)%6}">${icon(a?.icon||'apps')}</div><div><strong>${a?.name||r.appId}</strong><span>${a?.description||r.reason||'Business access request'}</span></div><span class="status-pill ${r.status==='Approved'?'low':'medium'}">${r.status}</span><small>${r.submitted}</small></div>`}).join(''):`<div class="empty-inline">No active requests.</div>`}<div class="access-row-v9"><div class="premium-app-icon tone-1">${icon('people')}</div><div><strong>HR Portal</strong><span>Employee records and benefits</span></div><span class="status-pill low">Approved</span><small>5 days ago</small></div><div class="access-row-v9"><div class="premium-app-icon tone-3">${icon('cart')}</div><div><strong>Procurement Hub</strong><span>Vendor and procurement management</span></div><span class="status-pill medium">Pending</span><small>1 week ago</small></div></div></section></div><section class="card card-pad"><div class="card-title"><div><h3>App categories</h3><p>Browse by category to find the right workspace.</p></div><button class="link-btn">View all apps ${icon('arrow')}</button></div><div class="app-category-strip-v9">${categoryList.map(c=>`<button class="card category-zen-card card-hover" data-filter-app-category="${c.name}"><div class="premium-app-icon tone-${c.tone}">${icon(c.icon)}</div><div><strong>${c.name}</strong><span>${c.count} app${c.count===1?'':'s'}</span></div></button>`).join('')}</div></section><section class="card card-pad" style="margin-top:16px"><div class="card-title"><div><h3>All connected apps</h3><p>Launch, pin or request access without leaving the hub.</p></div></div><div class="app-browser-grid-v9">${state.apps.map((a,i)=>{const pending=requestFor(a.id);return `<article class="card app-card app-card-v9 card-hover ${!a.hasAccess?'locked-app':''}" data-launch-app="${a.id}" data-app-group="${a.category}"><div class="premium-app-icon tone-${i%6}">${icon(a.icon)}</div><div><h4>${a.name}</h4><p>${a.description}</p><span class="app-access ${a.hasAccess?'granted':pending?'pending':'restricted'}">${a.hasAccess?'Access granted':pending?'Request pending':'Access required'}</span></div>${a.hasAccess?`<button class="pin-btn ${a.pinned?'pinned':''}" data-pin-app="${a.id}" title="Pin app">${icon('pin')}</button>`:pending?`<span class="status-pill medium">Pending</span>`:`<button class="secondary-btn small-btn" data-request-app="${a.id}">Request</button>`}</article>`}).join('')}</div></section><section class="card apps-marketplace-callout"><div class="premium-app-icon tone-0">${icon('apps')}</div><div><strong>Can’t find what you’re looking for?</strong><span>Discover more apps in the Matanho App Marketplace.</span></div><button class="primary-btn" data-action="build-workflow">Explore marketplace ${icon('arrow')}</button></section></div>`;
  }

  function aiSources(){
    return [
      {id:'work',label:'My Work',icon:'check',count:state.workTasks.length,detail:`${state.workTasks.filter(t=>!t.done).length} open tasks`},
      {id:'calendar',label:'Calendar',icon:'calendar',count:D.schedule.length,detail:'Meetings and focus blocks'},
      {id:'documents',label:'Documents',icon:'folder',count:8,detail:'Files you can access'},
      {id:'forums',label:'Forums',icon:'forum',count:D.forums.length,detail:'Discussions and accepted answers'},
      {id:'news',label:'News',icon:'news',count:D.news.length,detail:'Internal and trusted sources'},
      {id:'people',label:'People',icon:'people',count:D.people.length,detail:'Profiles, skills and availability'}
    ];
  }
  function activeAiSources(){ return aiSources().filter(x=>state.aiContextSources[x.id]!==false); }
  function aiAnswerFor(prompt){
    const lower=prompt.toLowerCase();
    if(lower.includes('portfolio')||lower.includes('review')) return {
      title:'Portfolio review brief',
      summary:'The portfolio review is ready for a focused decision conversation. The Q3 deck is current, two risk-model comments are resolved, and one market note still needs review.',
      highlights:['Q3 investment deck updated 42 minutes ago','Risk-model comments from Finance and Compliance resolved','Market commentary is awaiting final review'],
      decisions:['Confirm Q3 portfolio positioning','Approve revised risk thresholds','Assign ownership of the outstanding market note'],
      actions:[{label:'Open calendar',route:'calendar',icon:'calendar'},{label:'Open My Work',route:'my-work',icon:'check'},{label:'Create follow-up task',action:'ai-create-task',icon:'plus'}],
      sources:['Calendar','My Work','Documents','Forums'], confidence:'High'
    };
    if(lower.includes('leave')) return {
      title:'Annual leave guidance',
      summary:`You have ${state.leaveBalance.toFixed(1)} days of annual leave available. Your pending requests do not currently conflict with the visible team schedule.`,
      highlights:['Current balance is available for use','Manager approval is the next workflow step','Team coverage is strongest from 12–16 August'],
      decisions:['Choose the leave period','Confirm your handover owner'],
      actions:[{label:'Request leave',route:'services',icon:'calendar'},{label:'Check calendar',route:'calendar',icon:'calendar'}],
      sources:['Employee Services','Calendar','People'],confidence:'High'
    };
    if(lower.includes('people')||lower.includes('nyasha')||lower.includes('colleague')) return {
      title:'People and expertise match',
      summary:'Nyasha Moyo is available now and is the strongest visible match for financial analysis, ESG and modelling support.',
      highlights:['Senior Investment Analyst · Harare','Available now','Current projects include Zambia Solar Fund II and the Energy Transition Mandate'],
      decisions:['Schedule a working session','Send a concise context note before the meeting'],
      actions:[{label:'Open People',route:'people',icon:'people'},{label:'View calendar',route:'calendar',icon:'calendar'}],
      sources:['People','Calendar','My Work'],confidence:'High'
    };
    if(lower.includes('draft')||lower.includes('update')||lower.includes('email')||lower.includes('memo')) return {
      title:'Draft ready for refinement',
      summary:'I prepared a concise executive update that separates progress, decisions and next actions. Open Draft mode to edit the message before sharing.',
      highlights:['Progress framed against the Q3 objectives','Risks stated without unnecessary operational detail','Next actions assigned to clear owners'],
      decisions:['Choose the audience','Confirm whether the draft is internal or external'],
      actions:[{label:'Open draft workspace',mode:'draft',icon:'edit'},{label:'Open Newsletter Studio',route:'newsletters',icon:'newsletter'}],
      sources:['My Work','Performance','Documents'],confidence:'Medium'
    };
    if(lower.includes('task')||lower.includes('priority')||lower.includes('week')) return {
      title:'Priority and workload summary',
      summary:'Your workload is manageable if the Quarterly LP report remains the first protected focus item. The Investment Committee is the next fixed commitment.',
      highlights:[`${state.workTasks.filter(t=>!t.done).length} open tasks across ${state.workProjects.length} projects`,'Quarterly LP report is the highest-priority item','One task is ready to be closed after evidence is attached'],
      decisions:['Protect the first focus block','Move one low-value task to next week'],
      actions:[{label:'Open My Work',route:'my-work',icon:'check'},{label:'Start a focus session',route:'home',icon:'play'}],
      sources:['My Work','Calendar','Performance'],confidence:'High'
    };
    return {
      title:'Connected work summary',
      summary:'I found relevant context across your connected workspaces. The clearest next step is to review the current decision pack, confirm ownership and convert unresolved items into visible tasks.',
      highlights:['Current work and calendar context were checked','Only permission-visible sources were used','The answer can be saved or turned into a task'],
      decisions:['Confirm which outcome matters most','Choose an owner for the next action'],
      actions:[{label:'Open My Work',route:'my-work',icon:'check'},{label:'Find a colleague',route:'people',icon:'people'},{label:'Create task',action:'ai-create-task',icon:'plus'}],
      sources:activeAiSources().slice(0,4).map(x=>x.label),confidence:'Medium'
    };
  }
  function aiMessageView(message,index){
    if(message.role==='user') return `<div class="ai-user-row-v16"><div class="ai-user-message-v16"><span>${esc(message.text)}</span><small>Just now</small></div>${avatar(D.user,'')}</div>`;
    if(!message.title) return `<article class="ai-answer-v16"><div class="ai-answer-head-v16"><div class="ai-orb-v16">${icon('sparkles')}</div><div><strong>Matanho AI</strong><span>Permission-aware answer</span></div></div><p class="ai-answer-summary-v16">${esc(message.text)}</p></article>`;
    return `<article class="ai-answer-v16" data-ai-answer-index="${index}">
      <div class="ai-answer-head-v16"><div class="ai-orb-v16">${icon('sparkles')}</div><div><strong>Matanho AI</strong><span>${message.confidence||'High'} confidence · ${message.sources?.length||0} source groups</span></div><button class="icon-only more-actions-btn" data-action="ai-answer-menu" data-index="${index}" aria-label="Answer actions">${icon('more')}</button></div>
      <div class="ai-answer-title-v16"><span class="eyebrow">Work brief</span><h3>${esc(message.title)}</h3><p>${esc(message.summary)}</p></div>
      <div class="ai-answer-grid-v16"><section><strong>${icon('news')} What matters</strong><ul>${(message.highlights||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section><strong>${icon('target')} Decisions and next steps</strong><ul>${(message.decisions||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section></div>
      <div class="ai-source-chips-v16">${(message.sources||[]).map(x=>`<span>${icon('lock')} ${esc(x)}</span>`).join('')}</div>
      <div class="ai-answer-actions-v16">${(message.actions||[]).map(a=>`<button class="${a.route||a.mode?'secondary-btn':'primary-btn'}" ${a.route?`data-ai-open-route="${a.route}"`:a.mode?`data-ai-mode="${a.mode}"`:`data-action="${a.action}"`}>${icon(a.icon||'arrow')} ${esc(a.label)}</button>`).join('')}<button class="ghost-btn" data-action="ai-save-latest">${icon('bookmark')} Save answer</button></div>
    </article>`;
  }
  function aiAskPanel(){
    const messages=state.aiMessages||[];
    const workflows=[
      {icon:'calendar',title:'Prepare a meeting',text:'Build a concise brief with changes, decisions and preparation.',prompt:'Prepare me for today’s portfolio review'},
      {icon:'check',title:'Summarise my work',text:'Show priorities, progress, blockers and ownership.',prompt:'Summarise my priorities and risks for this week'},
      {icon:'edit',title:'Draft an update',text:'Create an executive-ready update from connected work.',prompt:'Draft a concise executive update for my current projects'},
      {icon:'search',title:'Find information',text:'Search people, documents, forums and news together.',prompt:'Find the latest information about the Zambia mandate'}
    ];
    return `<section class="ai-conversation-panel-v16 card">
      ${messages.length?`<div class="ai-thread-head-v16"><div><span class="eyebrow">Current thread</span><h3>${esc(messages.find(m=>m.role==='user')?.text||'Connected work question')}</h3></div><button class="secondary-btn" data-action="ai-new-thread">${icon('plus')} New thread</button></div><div class="ai-thread-v16" id="aiConversation">${messages.map(aiMessageView).join('')}</div>`:`<div class="ai-welcome-v16"><div class="ai-welcome-copy-v16"><span class="eyebrow">Practical AI for your workday</span><h2>What do you need to move forward?</h2><p>Ask one question across the workspaces you already use. Matanho will show the answer, the source context and the next useful action.</p></div><div class="ai-workflow-grid-v16">${workflows.map(x=>`<button class="ai-workflow-v16" data-ai-prompt="${esc(x.prompt)}"><div class="ai-workflow-icon-v16">${icon(x.icon)}</div><strong>${x.title}</strong><span>${x.text}</span>${icon('arrow')}</button>`).join('')}</div><div class="ai-recent-v16"><div class="card-title"><div><h3>Recent work</h3><p>Continue a previous question.</p></div></div><div class="ai-recent-list-v16">${state.aiRecent.slice(0,3).map(x=>`<button data-ai-recent="${x.id}"><div>${icon('clock')}<span><strong>${esc(x.title)}</strong><small>${esc(x.meta)}</small></span></div>${icon('chevron')}</button>`).join('')}</div></div></div>`}
      <form class="ai-composer-v16" id="aiComposer"><div class="ai-compose-field-v16">${icon('sparkles')}<textarea name="prompt" rows="1" placeholder="Ask Matanho AI about your work…" aria-label="Ask Matanho AI"></textarea><button type="button" class="ai-attach-v16" title="Add context">${icon('plus')}</button></div><button class="primary-btn">${icon('send')} Ask</button></form>
    </section>`;
  }
  function aiBriefsPanel(){
    const briefs=[
      {title:'Today’s leadership brief',meta:'Calendar + My Work + Performance',detail:'Three decisions, two risks and your most important next action.',prompt:'Prepare a leadership brief for today'},
      {title:'Portfolio review',meta:'14:00 · Harare Boardroom',detail:'Changes, unresolved risks and the decision pack in one place.',prompt:'Prepare me for today’s portfolio review'},
      {title:'Weekly execution summary',meta:'7 active tasks · 3 projects',detail:'Progress, delivery confidence and ownership gaps.',prompt:'Summarise my priorities and risks for this week'}
    ];
    return `<section class="card ai-library-panel-v16"><div class="ai-section-head-v16"><div><span class="eyebrow">Work briefs</span><h2>Decision-ready context</h2><p>Generate repeatable briefs without rebuilding the same search every time.</p></div><button class="primary-btn" data-ai-prompt="Prepare a leadership brief for today">${icon('sparkles')} Generate brief</button></div><div class="ai-brief-list-v16">${briefs.map((b,i)=>`<article><div class="ai-brief-icon-v16">${icon(['sunrise','calendar','performance'][i])}</div><div><strong>${b.title}</strong><span>${b.meta}</span><p>${b.detail}</p></div><button class="secondary-btn" data-ai-prompt="${esc(b.prompt)}">Generate ${icon('arrow')}</button></article>`).join('')}</div></section>`;
  }
  function aiSearchPanel(){
    const results=[
      {type:'Document',title:'Q3 investment deck.pptx',detail:'Updated today · My Work',icon:'newsletter',route:'my-work'},
      {type:'Person',title:'Nyasha Moyo',detail:'Senior Investment Analyst · Available now',icon:'profile',route:'people'},
      {type:'Discussion',title:'Q3 strategy workshop prep',detail:'17 replies · Strategy forum',icon:'forum',route:'forums'},
      {type:'News',title:'Southern Africa expansion enters its next chapter',detail:'Matanho Newsroom · 8 min read',icon:'news',route:'news'},
      {type:'Calendar',title:'Portfolio review',detail:'Today · 14:00 · Harare Boardroom',icon:'calendar',route:'calendar'}
    ];
    return `<section class="card ai-library-panel-v16"><div class="ai-section-head-v16"><div><span class="eyebrow">Universal search</span><h2>Find one answer across connected work</h2><p>Search only the sources currently enabled in your context panel.</p></div></div><form class="ai-knowledge-search-v16" id="aiSearchForm">${icon('search')}<input id="aiKnowledgeSearch" name="query" placeholder="Search people, documents, discussions and news…"/><button class="primary-btn">Search</button></form><div class="ai-result-list-v16">${results.map(r=>`<article class="ai-search-result-v16"><div class="ai-result-icon-v16">${icon(r.icon)}</div><div><span>${r.type}</span><strong>${r.title}</strong><p>${r.detail}</p></div><button class="secondary-btn" data-ai-open-route="${r.route}">Open ${icon('arrow')}</button></article>`).join('')}</div></section>`;
  }
  function aiDraftPanel(){
    return `<section class="card ai-library-panel-v16"><div class="ai-section-head-v16"><div><span class="eyebrow">Draft workspace</span><h2>Turn context into a useful first draft</h2><p>Use connected work as source material, then review every sentence before sharing.</p></div><span class="ai-safety-chip-v16">${icon('lock')} Not shared until you approve</span></div><form id="aiDraftForm" class="ai-draft-form-v16"><div class="form-grid"><div class="form-field"><label>Draft type</label><select class="select-control" name="type"><option ${state.aiDraft.type==='Executive update'?'selected':''}>Executive update</option><option ${state.aiDraft.type==='Client email'?'selected':''}>Client email</option><option ${state.aiDraft.type==='Decision memo'?'selected':''}>Decision memo</option><option ${state.aiDraft.type==='Meeting follow-up'?'selected':''}>Meeting follow-up</option></select></div><div class="form-field"><label>Audience</label><select class="select-control" name="audience"><option ${state.aiDraft.audience==='Investment team'?'selected':''}>Investment team</option><option ${state.aiDraft.audience==='Executive committee'?'selected':''}>Executive committee</option><option ${state.aiDraft.audience==='Client'?'selected':''}>Client</option><option ${state.aiDraft.audience==='All employees'?'selected':''}>All employees</option></select></div><div class="form-field full"><label>Subject</label><input class="input-control" name="subject" value="${esc(state.aiDraft.subject)}"/></div><div class="form-field full"><label>Draft</label><textarea class="input-control ai-draft-editor-v16" name="body" placeholder="Generate or write your draft here…">${esc(state.aiDraft.body||'Q3 delivery remains on track. The team has completed the primary portfolio analysis, resolved the material model comments and prepared the next decision pack. Two items require leadership attention: final confirmation of risk thresholds and ownership of the outstanding market note. Recommended next step: confirm both decisions during today’s portfolio review and record owners before close of business.')}</textarea></div></div><div class="ai-draft-footer-v16"><span>${icon('sparkles')} Drafted from permission-visible work context.</span><div><button type="button" class="secondary-btn" data-ai-prompt="Draft a concise executive update for my current projects">Regenerate</button><button class="primary-btn">${icon('bookmark')} Save draft</button></div></div></form></section>`;
  }
  function aiSavedPanel(){
    return `<section class="card ai-library-panel-v16"><div class="ai-section-head-v16"><div><span class="eyebrow">Saved answers</span><h2>Your reusable work intelligence</h2><p>Return to useful answers without running the same search again.</p></div></div>${state.aiSaved.length?`<div class="ai-saved-list-v16">${state.aiSaved.map((x,i)=>`<article><div class="ai-result-icon-v16">${icon('bookmark')}</div><div><strong>${esc(x.title||'Saved answer')}</strong><p>${esc(x.summary||x.prompt||'Saved Matanho AI result')}</p><span>${esc(x.savedAt||'Saved recently')}</span></div><button class="secondary-btn" data-ai-saved-open="${i}">Open ${icon('arrow')}</button></article>`).join('')}</div>`:`<div class="ai-empty-v16"><div class="ai-orb-v16">${icon('bookmark')}</div><h3>No saved answers yet</h3><p>Save a useful brief or answer and it will appear here.</p><button class="primary-btn" data-ai-mode="ask">Ask Matanho AI</button></div>`}</section>`;
  }
  function aiModePanel(){ if(state.aiMode==='briefs')return aiBriefsPanel(); if(state.aiMode==='search')return aiSearchPanel(); if(state.aiMode==='draft')return aiDraftPanel(); if(state.aiMode==='saved')return aiSavedPanel(); return aiAskPanel(); }
  function aiView() {
    const sourceCount=activeAiSources().length;
    const modeItems=[['ask','Ask','sparkles'],['briefs','Briefs','newsletter'],['search','Search','search'],['draft','Draft','edit'],['saved','Saved','bookmark']];
    return `${pageHead('Matanho AI','Practical, permission-aware assistance across your connected work.',`<span class="ai-connected-badge-v16">${icon('lock')} ${sourceCount} sources connected</span><button class="secondary-btn ai-context-mobile-v16" data-action="ai-toggle-context">${icon('services')} Context</button><button class="primary-btn" data-action="ai-new-thread">${icon('plus')} New thread</button>`)}
      <div class="ai-shell-v16 ${state.aiContextOpen?'context-open':''}">
        <aside class="card ai-rail-v16"><nav aria-label="Matanho AI modes">${modeItems.map(x=>`<button class="ai-mode-v16 ${state.aiMode===x[0]?'active':''}" data-ai-mode="${x[0]}">${icon(x[2])}<span>${x[1]}</span></button>`).join('')}</nav><div class="ai-rail-divider-v16"></div><div class="ai-rail-label-v16">Recent</div><div class="ai-rail-recents-v16">${state.aiRecent.slice(0,3).map(x=>`<button data-ai-recent="${x.id}"><span>${esc(x.title)}</span><small>${esc(x.meta)}</small></button>`).join('')}</div><div class="ai-rail-safety-v16">${icon('lock')}<span><strong>Private by design</strong><small>Only uses information you can access.</small></span></div></aside>
        <main class="ai-workspace-v16"><section class="card ai-command-v16"><form id="aiTopForm"><div class="ai-command-icon-v16">${icon('sparkles')}</div><div class="ai-command-field-v16"><label for="aiTopInput">Ask across your work</label><input id="aiTopInput" name="prompt" placeholder="Prepare me for today’s portfolio review" autocomplete="off"/></div><select class="select-control ai-scope-v16" id="aiScope" aria-label="AI search scope"><option ${state.aiScope==='All connected work'?'selected':''}>All connected work</option><option ${state.aiScope==='My work only'?'selected':''}>My work only</option><option ${state.aiScope==='People and knowledge'?'selected':''}>People and knowledge</option></select><button class="primary-btn">${icon('send')} Ask</button></form><div class="ai-prompt-row-v16">${['Summarise my week','Prepare a meeting brief','Draft a project update','Find a colleague'].map(p=>`<button data-ai-prompt="${p}">${icon('sparkles')} ${p}</button>`).join('')}</div></section>${aiModePanel()}</main>
        <aside class="ai-context-v16"><section class="card ai-context-card-v16"><div class="card-title"><div><h3>Active context</h3><p>Choose what Matanho may search for this answer.</p></div><button class="icon-only ai-context-close-v16" data-action="ai-toggle-context" aria-label="Close context">${icon('close')}</button></div><div class="ai-source-list-v16">${aiSources().map(s=>`<button class="ai-source-toggle-v16 ${state.aiContextSources[s.id]!==false?'active':''}" data-ai-source="${s.id}" aria-pressed="${state.aiContextSources[s.id]!==false}"><div class="ai-source-icon-v16">${icon(s.icon)}</div><span><strong>${s.label}</strong><small>${s.detail}</small></span><b>${s.count}</b><i></i></button>`).join('')}</div></section><section class="card ai-context-card-v16"><div class="card-title"><div><h3>Today’s context</h3><p>Useful signals from your workday.</p></div></div><div class="ai-context-signal-v16"><span>${icon('calendar')}</span><div><strong>Portfolio review</strong><small>14:00 · Harare Boardroom</small></div><button data-ai-open-route="calendar">Open</button></div><div class="ai-context-signal-v16"><span>${icon('check')}</span><div><strong>Quarterly LP report</strong><small>High priority · due today</small></div><button data-ai-open-route="my-work">Open</button></div><div class="ai-context-signal-v16"><span>${icon('target')}</span><div><strong>Two decisions need attention</strong><small>Performance and risk thresholds</small></div><button data-ai-open-route="performance">Open</button></div></section><section class="card ai-context-card-v16"><div class="card-title"><div><h3>Related people</h3><p>Available expertise for your current work.</p></div></div>${D.people.slice(0,3).map((p,i)=>`<button class="ai-person-row-v16" data-ai-open-route="people">${avatar(p,colorByIndex(i))}<span><strong>${p.name}</strong><small>${p.role}</small></span><i class="availability-dot ${p.statusType}"></i>${icon('chevron')}</button>`).join('')}</section></aside>
      </div>`;
  }

  function viewForRoute() {
    switch(state.route){
      case 'home': return homeView(); case 'daily-cover': return dailyCoverView(); case 'news': return newsView(); case 'newsletters': return newslettersView(); case 'forums': return forumsView(); case 'calendar': return calendarView(); case 'my-work': return myWorkView(); case 'performance': return performanceView(); case 'people': return peopleView(); case 'my-profile': return profileView(); case 'services': return servicesView(); case 'apps': return appsView(); case 'matanho-ai': return aiView(); default: return homeView();
    }
  }
  function render() {
    rootEl.style.setProperty('--user-saturation',String((state.settings.saturation||118)/100));
    rootEl.dataset.coverTheme=String(state.cover.theme||'Porcelain').toLowerCase();
    const shellClasses=[state.sidebarCollapsed?'sidebar-collapsed':'',`density-${state.settings.density||'comfortable'}`,state.settings.glass?'glass-on':'glass-off',state.settings.motion?'motion-on':'motion-off'].filter(Boolean).join(' ');
    app.innerHTML = `<div class="app-shell ${shellClasses}">${renderSidebar()}<div class="main">${renderTopbar()}<main class="content">${viewForRoute()}</main></div></div>`;
    closePortal();
    syncControls(); syncSessionTimer();
  }
  function syncControls(){
    const p=document.getElementById('performancePeriod'); if(p) p.value=state.performancePeriod;
    const nr=document.getElementById('newsletterRole'); if(nr) nr.value=state.newsletterRole;
    const wf=document.getElementById('workStatusFilter'); if(wf) wf.value=state.workFilter||'All tasks';
  }

  function toast(message, type='') {
    let c=document.querySelector('.toast-container'); if(!c){c=document.createElement('div');c.className='toast-container';document.body.appendChild(c)}
    const t=document.createElement('div');t.className=`toast ${type}`;t.innerHTML=`${icon(type==='success'?'check':'sparkles')}<span>${message}</span>`;c.appendChild(t);setTimeout(()=>t.remove(),3200);
  }
  function closePortal(){ portal.innerHTML=''; }
  function modal(title, body, footer='') {
    portal.innerHTML=`<div class="overlay" data-action="close-portal"><div class="modal" data-stop><div class="modal-head"><h2>${title}</h2><button class="close-btn" data-action="close-portal">${icon('close')}</button></div>${body}${footer}</div></div>`;
  }
  function drawer(title, body){ portal.innerHTML=`<div class="overlay" data-action="close-portal"><aside class="drawer" data-stop><div class="modal-head"><h2>${title}</h2><button class="close-btn" data-action="close-portal">${icon('close')}</button></div>${body}</aside></div>`; }
  function showNotifications(anchor){
    const r=anchor.getBoundingClientRect(); portal.innerHTML=`<div class="popover" style="top:${r.bottom+8}px;right:${Math.max(16,innerWidth-r.right)}px"><h3>Notifications</h3>${[['Your portfolio review starts in 45 minutes.','calendar'],['Nyasha mentioned you in Q3 strategy workshop prep.','forum'],['The June payslip is ready to view.','wallet']].map((x,i)=>`<div class="notification"><div class="task-icon">${icon(x[1])}</div><div><strong>${x[0]}</strong><span>${i?'Earlier today':'Just now'}</span></div></div>`).join('')}</div>`;
  }
  function signOut() {
    closePortal();
    if (clientDesignSignOut()) return;
    toast('This prototype keeps you signed in.');
  }
  function showProfile(anchor){
    const r=anchor.getBoundingClientRect(); portal.innerHTML=`<div class="popover" style="top:${r.bottom+8}px;right:${Math.max(16,innerWidth-r.right)}px"><div style="display:flex;gap:10px;align-items:center;padding:6px">${avatar(D.user.initials)}<div><strong style="font-size:12px">${D.user.name}</strong><div style="font-size:9px;color:var(--muted);margin-top:2px">${D.user.email}</div></div></div><div class="detail-section"><button type="button" class="nav-item" data-nav="my-profile">${icon('profile')} My profile</button><button type="button" class="nav-item" data-action="settings">${icon('settings')} Settings</button><button type="button" class="nav-item" data-action="sign-out">${icon('arrow')} Sign out</button></div></div>`;
    portal.querySelector('[data-action="sign-out"]')?.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      signOut();
    }, { once: true });
  }
  function commandPalette(query=''){
    const q=query.toLowerCase(); const items=[];
    D.nav.forEach(g=>g.items.forEach(i=>items.push({title:i.label,meta:g.section,route:i.id,icon:i.icon})));
    D.people.forEach(p=>items.push({title:p.name,meta:`${p.role} · ${p.team}`,route:'people',person:p.id,icon:'profile'}));
    D.news.forEach(n=>items.push({title:n.title,meta:`News · ${n.source}`,route:'news',news:n.id,icon:'news'}));
    const filtered=items.filter(x=>!q||`${x.title} ${x.meta}`.toLowerCase().includes(q)).slice(0,12);
    portal.innerHTML=`<div class="overlay" data-action="close-portal"><div class="modal command" data-stop><div class="command-search">${icon('search')}<input id="commandInput" autofocus value="${esc(query)}" placeholder="Search Matanho…"/><span class="shortcut">Esc</span></div><div class="command-results">${filtered.map(x=>`<div class="command-item" data-command-route="${x.route}" ${x.person?`data-command-person="${x.person}"`:''} ${x.news?`data-command-news="${x.news}"`:''}><div class="task-icon">${icon(x.icon)}</div><div><strong>${x.title}</strong><span>${x.meta}</span></div>${icon('chevron')}</div>`).join('')||'<div class="empty-state">No results found.</div>'}</div></div></div>`;
    setTimeout(()=>document.getElementById('commandInput')?.focus(),20);
  }
  function eventDrawer(id){ const e=D.schedule.find(x=>x.id==id)||D.schedule[0]; drawer(e.title,`<div class="detail-line">${icon('calendar')}<span>${e.month} ${e.day}, 2026</span></div><div class="detail-line">${icon('clock')}<span>${e.time}</span></div><div class="detail-line">${icon('location')}<span>${e.location}</span></div><div class="detail-section"><h4>Attendees</h4><div class="avatar-stack" style="justify-content:flex-start">${e.people.map((p,i)=>avatar(p,colorByIndex(i))).join('')}</div></div><div class="detail-section"><h4>Agenda</h4><p style="font-size:11px;color:var(--muted);line-height:1.6">Review current decisions, agree next actions and identify any constraints requiring leadership attention.</p></div><button class="primary-btn" style="width:100%;margin-top:16px">Join meeting</button>`); }
  function servicesSummaryTiles(){
    const sum = D.servicesSummary || {};
    return [
      [sum.leaveBalanceLabel || '—', 'Leave balance', sum.leaveBalanceMeta || ''],
      [sum.payslipLabel || '—', 'Latest payslip', sum.payslipMeta || ''],
      [sum.pendingExpensesLabel || '—', 'Pending expenses', sum.pendingExpensesMeta || ''],
      [sum.learningLabel || 'Not tracked yet', 'Learning', sum.learningMeta || '']
    ];
  }
  function payslipModalMarkup(){
    const p = D.servicesSummary && D.servicesSummary.latestPayslip;
    if(!p){ return '<div class="card card-pad"><p>No payslips yet.</p></div>'; }
    return `<div class="card card-pad"><div class="card-title"><h3>${esc(p.periodLabel||'')}</h3><span class="status-pill low">Ready</span></div><div class="toggle-row"><span>Gross pay</span><strong>${esc(p.grossLabel||'')}</strong></div><div class="toggle-row"><span>Deductions</span><strong>${esc(p.deductionsLabel||'')}</strong></div><div class="toggle-row"><span>Take-home pay</span><strong style="font-size:18px;color:var(--blue)">${esc(p.netLabel||'')}</strong></div></div><button class="primary-btn" style="width:100%;margin-top:14px" data-action="download-payslip" data-payslip-id="${esc(p.id||'')}">${icon('download')} Download payslip</button>`;
  }
  function customWallpaperTiles(){
    const list = D.customWallpapers || [];
    return list.map(w=>{
      const active = state.cover.wallpaper === ('custom:'+w.id);
      return `<button class="wallpaper-card ${active?'active':''}" data-cover-wallpaper="custom:${esc(w.id)}"><img src="${esc(w.url)}" alt="${esc(w.label||'Custom wallpaper')}" loading="lazy"/><span><strong>${esc(w.label||'Custom')}</strong><small>Uploaded</small></span>${active?`<b>${icon('check')}</b>`:''}<span class="wallpaper-remove" data-action="delete-wallpaper" data-wallpaper-id="${esc(w.id)}" role="button" aria-label="Remove wallpaper">\u00d7</span></button>`;
    }).join('');
  }
  function rotationIntervalControl(){
    if(state.cover.wallpaper!=='auto') return '';
    const opts=[[3,'Every 3 minutes'],[5,'Every 5 minutes'],[15,'Every 15 minutes'],[60,'Every hour'],[1440,'Once a day']];
    const current=Number(D.rotationIntervalMinutes)||1440;
    return `<div class="rotation-interval-row"><label>Rotate</label><select class="select-control small-btn" id="rotationInterval">${opts.map(([v,l])=>`<option value="${v}" ${current===v?'selected':''}>${l}</option>`).join('')}</select></div>`;
  }
  function serviceModal(id){
    const s=D.services.find(x=>x.id===id)||D.services[0];
    if(id==='payroll'){ modal('Latest payslip', payslipModalMarkup()); return; }
    if(id==='leave'){ modal('Request leave',`<form id="leaveRequestForm"><div class="leave-balance-panel"><div><span>Available annual leave</span><strong>${state.leaveBalance.toFixed(1)} days</strong></div><div class="leave-ring" style="--leave:${Math.min(100,state.leaveBalance/25*100)}%"><span>${Math.round(state.leaveBalance/25*100)}%</span></div></div><div class="form-grid leave-form-grid"><div class="form-field"><label>Leave type</label><select class="select-control" name="type"><option>Annual leave</option><option>Compassionate leave</option><option>Study leave</option><option>Unpaid leave</option></select></div><div class="form-field"><label>Manager</label><input class="input-control" value="Tawanda Kasere" disabled/></div><div class="form-field"><label>Start date</label><input class="input-control" type="date" name="start" required/></div><div class="form-field"><label>End date</label><input class="input-control" type="date" name="end" required/></div><div class="form-field full"><label>Handover note</label><textarea class="textarea-control" name="handover" required placeholder="What should your team know while you are away?"></textarea></div><div class="form-field full"><label class="form-check"><input type="checkbox" class="form-check-input" name="halfDay"/><span class="form-check-label">This is a half-day request</span></label></div></div><div class="leave-impact"><div>${icon('calendar')} Team coverage is healthy for the selected period.</div><div>${icon('check')} Policy checks will run before submission.</div></div><div class="form-actions"><button class="secondary-btn" type="button" data-action="close-portal">Cancel</button><button class="primary-btn" type="submit">Submit leave request</button></div></form>`);return;}
    modal(s.name,`<form id="serviceRequestForm"><input type="hidden" name="service" value="${esc(s.name)}"/><input type="hidden" name="requestType" value="${esc(s.id)}"/><div class="form-grid"><div class="form-field"><label>Request type</label><select class="select-control" name="type"><option>${s.name} request</option><option>General enquiry</option></select></div>${s.id==='expenses'?'<div class="form-field"><label>Amount (US$)</label><input class="input-control" type="number" step="0.01" min="0" name="amount" required placeholder="0.00"/></div>':''}<div class="form-field"><label>Required by</label><input class="input-control" type="date" name="date"/></div><div class="form-field full"><label>Details</label><textarea class="textarea-control" name="details" placeholder="Describe what you need and include any relevant context."></textarea></div><div class="form-field full"><label>Attachment</label><input class="input-control" type="file"/></div></div><div class="form-actions"><button class="secondary-btn" type="button" data-action="close-portal">Cancel</button><button class="primary-btn" type="submit">Submit request</button></div></form>`);
  }

  function exportCover(){
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d');
    const grad=ctx.createLinearGradient(0,0,1080,1920);grad.addColorStop(0,'#fbf8f0');grad.addColorStop(.58,'#edf4f7');grad.addColorStop(1,'#d9e6ef');ctx.fillStyle=grad;ctx.fillRect(0,0,1080,1920);
    const rg=ctx.createRadialGradient(830,900,50,830,900,520);rg.addColorStop(0,'rgba(255,255,255,.95)');rg.addColorStop(.55,'rgba(103,158,198,.38)');rg.addColorStop(1,'rgba(103,158,198,0)');ctx.fillStyle=rg;ctx.fillRect(0,0,1080,1920);
    ctx.fillStyle='#526378';ctx.font='700 28px Arial';ctx.textAlign='center';ctx.fillText(new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}).toUpperCase(),540,120);
    ctx.fillStyle='#1f3550';ctx.font='70px Georgia';ctx.fillText(`GOOD ${dayInfo().period.toUpperCase()},`,540,250);ctx.fillText(D.user.firstName.toUpperCase(),540,330);
    ctx.strokeStyle='rgba(47,103,216,.28)';ctx.lineWidth=2;ctx.roundRect(375,375,330,64,32);ctx.stroke();ctx.fillStyle='#2f67d8';ctx.font='700 24px Arial';ctx.fillText(state.cover.mood.toUpperCase(),540,416);
    ctx.textAlign='left';ctx.fillStyle='#587693';ctx.font='28px Arial';ctx.fillText('Today’s intention',100,1280);ctx.fillStyle='#1f3550';ctx.font='64px Georgia';wrapText(ctx,state.cover.intention,100,1375,850,78);
    ctx.strokeStyle='rgba(45,65,86,.15)';ctx.beginPath();ctx.moveTo(100,1580);ctx.lineTo(980,1580);ctx.stroke();
    ctx.fillStyle='#1f3550';ctx.font='700 42px Arial';ctx.fillText('3',150,1670);ctx.fillText('2h 30m',420,1670);ctx.fillText('74%',790,1670);ctx.fillStyle='#798796';ctx.font='700 20px Arial';ctx.fillText('PRIORITIES',110,1710);ctx.fillText('FOCUS',450,1710);ctx.fillText('GOAL PROGRESS',745,1710);
    ctx.fillStyle='#66778b';ctx.font='26px Arial';ctx.fillText('Harare · 18°C · Clear',100,1825);ctx.textAlign='right';ctx.fillStyle='#263a54';ctx.font='700 34px Arial';ctx.fillText('matanho',980,1825);
    const a=document.createElement('a');a.download='matanho-daily-cover.png';a.href=canvas.toDataURL('image/png');a.click();toast('Daily Cover exported as a PNG.','success');
  }
  function wrapText(ctx,text,x,y,maxWidth,lineHeight){const words=text.split(' ');let line='';for(let n=0;n<words.length;n++){const test=line+words[n]+' ';if(ctx.measureText(test).width>maxWidth&&n>0){ctx.fillText(line,x,y);line=words[n]+' ';y+=lineHeight}else line=test}ctx.fillText(line,x,y)}
  function aiRespond(prompt){
    const p=String(prompt||'').trim(); if(!p)return;
    state.aiMode='ask';
    state.aiMessages.push({role:'user',text:p,createdAt:Date.now()});
    const answer=aiAnswerFor(p);
    state.aiMessages.push({role:'assistant',prompt:p,createdAt:Date.now(),...answer});
    state.aiRecent=[{id:`ai-${Date.now()}`,title:answer.title,prompt:p,meta:'Just now'},...state.aiRecent.filter(x=>x.prompt!==p)].slice(0,8);
    saveState(); render();
    setTimeout(()=>{const thread=document.getElementById('aiConversation');if(thread)thread.scrollTo({top:thread.scrollHeight,behavior:'smooth'})},60);
  }

  document.addEventListener('click' , e => {
    const nav=e.target.closest('[data-nav]'); if(nav){navigate(nav.dataset.nav);return}
    const insideStop=e.target.closest('[data-stop]');
    if(insideStop) e.stopPropagation();
    const actionNode=e.target.closest('[data-action]');
    const action=(insideStop && actionNode?.classList.contains('overlay')) ? null : actionNode?.dataset.action;
    if(action){
      if(action==='mobile-menu'){state.mobileNav=!state.mobileNav;render();return}
      if(action==='collapse-sidebar'||action==='profile-sidebar-toggle'){state.sidebarCollapsed=!state.sidebarCollapsed;saveState();render();return}
      if(action==='calendar-source'){const b=e.target.closest('[data-action="calendar-source"]'),i=Number(b?.dataset.index);if(Number.isInteger(i)){state.calendarSources[i]=!state.calendarSources[i];saveState();render()}return}
      if(action==='toggle-calendar-details'){state.calendarDetailsOpen=!state.calendarDetailsOpen;saveState();render();return}
      if(action==='hero-prev'){if(state.cover.wallpaper==='auto')state.heroOffset-=1;else state.cover.wallpaper=String((Number(state.cover.wallpaper)-1+heroScenes.length)%heroScenes.length);saveState();render();return}
      if(action==='hero-next'){if(state.cover.wallpaper==='auto')state.heroOffset+=1;else state.cover.wallpaper=String((Number(state.cover.wallpaper)+1)%heroScenes.length);saveState();render();return}
      if(action==='start-day'){
        const activeTasks=state.workTasks.filter(t=>!t.done);
        modal('Start your day',`<form id="startDayForm"><div class="start-day-intro"><div class="session-orb">${icon('play')}</div><div><span>Build a focused work session</span><strong>Choose what you want to move forward.</strong></div></div><div class="form-grid"><div class="form-field full"><label>Task</label><select class="select-control" name="taskId"><option value="none">No linked task</option>${activeTasks.map(t=>`<option value="${t.id}">${esc(t.title)} · ${esc(t.project)}</option>`).join('')}</select></div><div class="form-field"><label>Set status</label><select class="select-control" name="status"><option>Focus mode</option><option>Available</option><option>In office</option><option>Working remotely</option><option>Do not disturb</option></select></div><div class="form-field"><label>Timer</label><select class="select-control" name="duration"><option value="25">25 minutes · quick focus</option><option value="50" selected>50 minutes · deep work</option><option value="90">90 minutes · extended focus</option><option value="120">2 hours · protected block</option></select></div></div><div class="session-policy-note">${icon('lock')} Your task and status are visible only according to your profile permissions.</div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">${icon('play')} Start timer</button></div></form>`);return}
      if(action==='pause-day-session'){state.daySession.pausedRemaining=sessionSecondsRemaining();state.daySession.paused=true;saveState();emitIntegrationEvent('workday.session.paused',{...state.daySession});render();return}
      if(action==='resume-day-session'){const remaining=Number(state.daySession.pausedRemaining)||0;state.daySession.startedAt=Date.now()-((Number(state.daySession.durationMinutes)*60-remaining)*1000);state.daySession.paused=false;saveState();emitIntegrationEvent('workday.session.resumed',{...state.daySession});render();return}
      if(action==='end-day-session'){const ended={...state.daySession,remainingSeconds:sessionSecondsRemaining()};state.daySession={...state.daySession,active:false,paused:false,startedAt:null,pausedRemaining:null};saveState();emitIntegrationEvent('workday.session.ended',ended);render();toast('Work session ended.','success');return}
      if(action==='reset-daily-cover'){state.cover.theme='Porcelain';state.cover.wallpaper='auto';state.heroOffset=0;state.settings.autoHero=true;saveState();emitIntegrationEvent('preferences.theme.updated',{theme:'Porcelain',wallpaper:'auto'});render();toast('Daily Cover reset to automatic rotation.','success');return}
      if(action==='delete-calendar-entry'){const id=e.target.closest('[data-action="delete-calendar-entry"]')?.dataset.entryId;if(!id)return;emitIntegrationEvent('calendar.entry.deleted',{id});return}
      if(action==='upload-wallpaper'){const input=document.getElementById('wallpaperFileInput');if(input)input.click();return}
      if(action==='delete-wallpaper'){const id=e.target.closest('[data-action="delete-wallpaper"]')?.dataset.wallpaperId;if(!id)return;emitIntegrationEvent('wallpaper.delete.requested',{id});return}
      if(action==='close-portal'){closePortal();return}
      if(action==='notifications'){showNotifications(e.target.closest('[data-action]'));return}
      if(action==='profile-popover'){showProfile(e.target.closest('[data-action]'));return}
      if(action==='messages'){toast('Messages are ready — no unread conversations.');return}
      if(action==='ai-new-thread'){state.aiMessages=[];state.aiMode='ask';saveState();render();return}
      if(action==='ai-toggle-context'){state.aiContextOpen=!state.aiContextOpen;saveState();render();return}
      if(action==='ai-save-latest'){const latest=[...state.aiMessages].reverse().find(m=>m.role==='assistant');if(latest){state.aiSaved=[{...latest,savedAt:'Saved just now'},...state.aiSaved.filter(x=>x.title!==latest.title)].slice(0,12);saveState();toast('Answer saved to Matanho AI.','success');render()}return}
      if(action==='ai-create-task'){const latest=[...state.aiMessages].reverse().find(m=>m.role==='assistant');state.workTasks.unshift({id:Date.now(),title:latest?.decisions?.[0]||'Follow up on Matanho AI brief',project:'Executive priorities',owner:'You',due:'Today',progress:0,status:'High',done:false});saveState();toast('Follow-up task created in My Work.','success');return}
      if(action==='ai-answer-menu'){const latest=state.aiMessages[Number(e.target.closest('[data-index]')?.dataset.index)];drawer('Answer actions',`<div class="quick-action" data-action="ai-save-latest"><div class="task-icon">${icon('bookmark')}</div><div><strong>Save answer</strong><span>Keep this brief for later.</span></div>${icon('chevron')}</div><div class="quick-action" data-action="ai-create-task"><div class="task-icon">${icon('plus')}</div><div><strong>Create task</strong><span>Turn the first next step into work.</span></div>${icon('chevron')}</div><div class="quick-action" data-ai-mode="draft"><div class="task-icon">${icon('edit')}</div><div><strong>Open as draft</strong><span>Refine the answer before sharing.</span></div>${icon('chevron')}</div>`);return}
      if(action==='toggle-profile-availability'){const states=['Available','Focus mode','Away'];state.profileAvailability=states[(states.indexOf(state.profileAvailability)+1)%states.length];saveState();render();toast(`Availability changed to ${state.profileAvailability}.`,'success');return}
      if(action==='change-profile-photo'){toast('Profile photo uploader opened. Approved portraits can replace the prototype image.');return}
      if(action==='add-profile-skill'){modal('Add a skill',`<form id="profileSkillForm"><div class="form-field"><label>Skill or expertise</label><input class="input-control" name="skill" required placeholder="e.g. Portfolio construction"/></div><div class="form-field"><label>Starting endorsements</label><input class="input-control" type="number" min="0" name="endorsements" value="0"/></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Add skill</button></div></form>`);return}
      if(action==='upload-profile-document'){modal('Upload profile document',`<form id="profileDocumentForm"><div class="form-grid"><div class="form-field full"><label>Document name</label><input class="input-control" name="name" required placeholder="Document title"/></div><div class="form-field"><label>Category</label><select class="select-control" name="category"><option>Certification</option><option>Education</option><option>Profile document</option><option>Profile media</option></select></div><div class="form-field"><label>File</label><input class="input-control" type="file" name="file"/></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Upload document</button></div></form>`);return}
      if(action==='edit-profile-preferences'){const p=state.profilePreferences;modal('Work and visibility preferences',`<form id="profilePreferencesForm"><div class="form-grid"><div class="form-field"><label>Focus hours</label><input class="input-control" name="focusHours" value="${esc(p.focusHours)}"/></div><div class="form-field"><label>Preferred contact</label><select class="select-control" name="preferredContact"><option ${p.preferredContact==='Microsoft Teams'?'selected':''}>Microsoft Teams</option><option ${p.preferredContact==='Email'?'selected':''}>Email</option><option ${p.preferredContact==='Phone'?'selected':''}>Phone</option></select></div><div class="form-field"><label>Office days</label><input class="input-control" name="officeDays" value="${esc(p.officeDays)}"/></div><div class="form-field"><label>Timezone</label><select class="select-control" name="timezone"><option>CAT (Harare)</option><option>SAST (Johannesburg)</option><option>GMT (London)</option></select></div></div><div class="settings-toggle-grid">${[['showAvailability','Show availability'],['shareSkills','Share skills and endorsements'],['showProjects','Show current projects'],['discoverable','Allow profile discovery']].map(([k,l])=>`<label class="setting-toggle"><div><strong>${l}</strong><span>Control visibility across Matanho.</span></div><input type="checkbox" name="${k}" ${p[k]?'checked':''}/><i></i></label>`).join('')}</div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Save preferences</button></div></form>`);return}
      if(action==='settings'){modal('Settings & personalisation',`<form id="settingsForm" class="settings-form"><section class="settings-section"><div class="settings-section-head"><div class="settings-icon">${icon('sun')}</div><div><h3>Appearance</h3><p>Tune clarity, colour and spatial density.</p></div></div><div class="settings-grid"><div class="form-field"><label>Language</label><select class="select-control" name="language"><option ${state.settings.language==='English (UK)'?'selected':''}>English (UK)</option><option>English (US)</option></select></div><div class="form-field"><label>Timezone</label><select class="select-control" name="timezone"><option ${state.settings.timezone==='CAT — Harare'?'selected':''}>CAT — Harare</option><option>SAST — Johannesburg</option><option>GMT — London</option></select></div><div class="form-field"><label>Interface density</label><select class="select-control" name="density"><option value="comfortable" ${state.settings.density==='comfortable'?'selected':''}>Comfortable</option><option value="compact" ${state.settings.density==='compact'?'selected':''}>Compact</option><option value="spacious" ${state.settings.density==='spacious'?'selected':''}>Spacious</option></select></div><div class="form-field"><label>Profile visibility</label><select class="select-control" name="profileVisibility"><option ${state.settings.profileVisibility==='Organisation'?'selected':''}>Organisation</option><option ${state.settings.profileVisibility==='My teams'?'selected':''}>My teams</option><option ${state.settings.profileVisibility==='Projects only'?'selected':''}>Projects only</option></select></div><div class="form-field full"><label>OLED colour intensity <span id="saturationValue">${state.settings.saturation}%</span></label><input id="saturationRange" class="range-control" type="range" min="95" max="130" step="1" name="saturation" value="${state.settings.saturation}"/><div class="range-labels"><span>Natural</span><span>Vivid</span></div></div></div></section><section class="settings-section"><div class="settings-section-head"><div class="settings-icon">${icon('sparkles')}</div><div><h3>Experience</h3><p>Choose how the workspace behaves.</p></div></div><div class="settings-toggle-grid">${[["glass","Frosted premium surfaces","Adds refined depth without reducing contrast"],["motion","Interface motion","Enables subtle transitions and chart animation"],["autoHero","Daily Japandi scene","Rotates the home hero image each day"],["usageAnalytics","Improve Matanho","Shares anonymous product usage diagnostics"]].map(([key,title,desc])=>`<label class="setting-toggle"><div><strong>${title}</strong><span>${desc}</span></div><input type="checkbox" name="${key}" ${state.settings[key]?'checked':''}/><i></i></label>`).join('')}</div></section><section class="settings-section"><div class="settings-section-head"><div class="settings-icon">${icon('bell')}</div><div><h3>Notifications</h3><p>Control the signals that interrupt your day.</p></div></div><div class="settings-toggle-grid">${[["calendarAlerts","Calendar reminders","Meeting reminders and schedule changes"],["newsDigest","News digest","Daily editorial and market briefing"],["forumMentions","Forum mentions","Replies, accepted insights and mentions"],["performanceReminders","Performance reminders","Goal updates, reviews and evidence prompts"]].map(([key,title,desc])=>`<label class="setting-toggle"><div><strong>${title}</strong><span>${desc}</span></div><input type="checkbox" name="${key}" ${state.settings[key]?'checked':''}/><i></i></label>`).join('')}</div></section><div class="settings-preview"><span>Live preview</span><strong>Light Japandi · ${state.settings.saturation}% OLED colour · ${state.settings.density}</strong></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Save preferences</button></div></form>`);return}
      if(action==='help'){modal('Help & Support',`<p style="font-size:12px;color:var(--muted);line-height:1.6">Search the knowledge base or create a support request.</p><input class="input-control" style="width:100%" placeholder="What do you need help with?"/><div class="service-grid" style="margin-top:14px"><button class="service-card card" data-service="support"><div class="task-icon">${icon('support')}</div><div><h4>IT support</h4><p>Device, software or access.</p></div></button><button class="service-card card"><div class="task-icon">${icon('help')}</div><div><h4>How-to guides</h4><p>Learn how to use Matanho.</p></div></button></div>`);return}
      if(action==='sign-out'){signOut();return}
      if(action==='export-cover'){exportCover();return}
      if(action==='copy-cover-link'){navigator.clipboard?.writeText(location.origin+'/home/cover');toast('Share link copied.','success');return}
      if(action==='create-newsletter-list'){if(state.newsletterRole==='Read only'){toast('Your role has read-only access.');return}modal('Create newsletter list',`<form id="newsletterListForm"><div class="form-grid"><div class="form-field full"><label>List name</label><input class="input-control" name="name" required placeholder="e.g. Quarterly client partners"/></div><div class="form-field"><label>Channel</label><select class="select-control" name="type"><option>Internal</option><option ${state.newsletterRole==='Publisher'?'':'disabled'}>External</option></select></div><div class="form-field"><label>Estimated recipients</label><input class="input-control" type="number" name="members" min="1" value="12"/></div><div class="form-field full"><label>Owner</label><select class="select-control" name="owner"><option>Communications</option><option>Investment team</option><option>Client Relations</option><option>People & Culture</option></select></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Create list</button></div></form>`);return}
      if(action==='share-newsletter'||action==='publish-newsletter'){if(state.newsletterRole==='Read only'){toast('Read-only users cannot share newsletters.');return}const canExternal=state.newsletterRole==='Publisher';modal(canExternal?'Share or schedule newsletter':'Submit newsletter for approval',`<form id="newsletterShareForm"><div class="form-grid"><div class="form-field full"><label>Newsletter</label><input class="input-control" name="title" value="Market Brief · July 2026"/></div><div class="form-field"><label>Channel</label><select class="select-control" name="channel"><option>Internal</option><option ${canExternal?'':'disabled'}>External</option></select></div><div class="form-field"><label>Audience</label><select class="select-control" name="audience">${state.newsletterLists.filter(x=>canExternal||x.type==='Internal').map(x=>`<option>${x.name}</option>`).join('')}</select></div><div class="form-field"><label>Send date</label><input class="input-control" type="date" name="date"/></div><div class="form-field"><label>Approval</label><select class="select-control" name="approval"><option>${canExternal?'Publish directly':'Send to publisher'}</option><option>Request legal review</option></select></div><div class="form-field full"><label>Distribution note</label><textarea class="textarea-control" name="note" placeholder="Optional context for approvers or recipients"></textarea></div></div><div class="governance-notice">${icon('lock')} External distribution is logged, permission-checked and limited to Publisher roles.</div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">${canExternal?'Schedule distribution':'Submit for approval'}</button></div></form>`);return}
      if(action==='request-newsletter-access'){modal('Request newsletter access',`<form id="newsletterAccessForm"><div class="form-field"><label>Requested role</label><select class="select-control" name="role"><option>Editor</option><option>Publisher</option></select></div><div class="form-field"><label>Business reason</label><textarea class="textarea-control" name="reason" required></textarea></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Submit request</button></div></form>`);return}
      if(action==='metric-menu'){const metric=actionNode?.dataset.metric||'Performance metric';drawer(metric,`<div class="detail-section"><h4>Metric options</h4><p style="font-size:11px;color:var(--muted);line-height:1.6">Inspect evidence, compare the current period, or add this measure to your review packet.</p></div><button class="secondary-btn" style="width:100%;margin-top:12px" data-action="close-portal">View evidence</button><button class="primary-btn" style="width:100%;margin-top:9px" data-action="prepare-review">Add to review</button>`);return}
      if(action==='profile-more'){drawer('Profile actions',`<div class="detail-section"><h4>Profile controls</h4><p style="font-size:11px;color:var(--muted);line-height:1.6">Manage visibility, share the profile or open the employee record.</p></div><button class="secondary-btn" style="width:100%;margin-top:12px" data-action="copy-profile">Copy profile link</button><button class="primary-btn" style="width:100%;margin-top:9px" data-nav="my-profile">Open full profile</button>`);return}
      if(action==='open-scorecard'){state.route='performance';state.performanceTab='Scorecard';location.hash='#/performance';saveState();render();return}
      if(action==='view-access-requests'){drawer('App access requests',`${state.appAccessRequests.map(r=>{const a=state.apps.find(x=>x.id===r.appId);return `<div class="access-request-detail"><div class="task-icon">${icon(a?.icon||'apps')}</div><div><strong>${a?.name||r.appId}</strong><span>${r.reason||'Business need submitted'} · ${r.submitted}</span></div><span class="status-pill ${r.status==='Approved'?'low':'medium'}">${r.status}</span></div>`}).join('')||'<div class="empty-state">No requests yet.</div>'}`);return}
      if(action==='focus-reply'){document.querySelector('#postReplyForm textarea')?.focus();return}
      if(action==='back-news'){state.selectedNews=null;syncUrl();render();return}
      if(action==='share'){navigator.clipboard?.writeText(location.href);toast('Link copied to clipboard.','success');return}
      if(action==='new-newsletter'){modal('Create newsletter',`<form id="newsletterForm"><div class="form-grid"><div class="form-field full"><label>Title</label><input class="input-control" name="title" required/></div><div class="form-field full"><label>Content</label><textarea class="textarea-control" name="content" required rows="8"></textarea></div><div class="form-field full"><label>Cover image (optional)</label><input type="file" name="image" accept="image/*"/></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Publish newsletter</button></div></form>`);return}
      if(action==='new-post'){modal('New post',`<form id="postForm"><div class="form-grid"><div class="form-field full"><label>Title</label><input class="input-control" name="title" required/></div><div class="form-field full"><label>Message</label><textarea class="textarea-control" name="content" required rows="6"></textarea></div></div><label class="setting-toggle"><div><strong>Notify everyone</strong><span>Send an in-app notification to all staff.</span></div><input type="checkbox" name="notify"/><i></i></label><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Publish</button></div></form>`);return}
      if(action==='toggle-solved'){const btn=e.target.closest('[data-post-solved]');const id=btn&&btn.dataset.postSolved;const p=(D.forumPosts||[]).find(x=>x.id===id);if(p){p.isSolved=!p.isSolved;render();toast(p.isSolved?'Marked as solved.':'Marked as unsolved.','success');emitIntegrationEvent('post.solved.toggled',{id:p.id,title:p.title,content:p.content,isSolved:p.isSolved})}return}
      if(action==='new-discussion'){modal('Start a discussion',`<form id="discussionForm"><div class="form-grid"><div class="form-field full"><label>Title</label><input class="input-control" name="title" required/></div><div class="form-field full"><label>Topic</label><select class="select-control" name="category">${forumCategories().map(c=>`<option>${esc(c)}</option>`).join('')}</select></div><div class="form-field full"><label>Opening message</label><textarea class="textarea-control" name="body" required rows="5"></textarea></div></div><div class="form-actions"><button class="secondary-btn" type="button" data-action="close-portal">Cancel</button><button class="primary-btn">Publish discussion</button></div></form>`);return}
      if(action==='back-forums'){state.forumThread=null;syncUrl();render();return}
      if(action==='find-time'){toast('Three shared time windows found for this week.','success');return}
      if(action==='create-event'){modal('Create event',`<form id="eventForm"><div class="form-grid"><div class="form-field full"><label>Event name</label><input class="input-control" name="title" required/></div><div class="form-field"><label>Date</label><input class="input-control" type="date" name="date"/></div><div class="form-field"><label>Time</label><input class="input-control" type="time" name="time"/></div><div class="form-field full"><label>Attendees</label><input class="input-control" name="attendees" placeholder="Add people or teams"/></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Create event</button></div></form>`);return}
      if(action==='clear-work-filters'){state.workProject='all';state.workFilter='All tasks';state.workSearch='';saveState();render();return}
      
      if(action==='new-task'){modal('Create task',`<form id="taskForm"><div class="form-grid"><div class="form-field full"><label>Task</label><input class="input-control" name="title" required/></div><div class="form-field"><label>Project</label><input class="input-control" name="project" list="workProjectOptions" placeholder="e.g. Client Onboarding"/><datalist id="workProjectOptions">${(state.workProjects||D.workProjects).map(p=>`<option value="${esc(p.name)}"></option>`).join('')}</datalist></div><div class="form-field"><label>Due date</label><input class="input-control" type="date" name="date" required/></div><div class="form-field"><label>Priority</label><select class="select-control" name="priority"><option>Medium</option><option>High</option><option>Low</option></select></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Add task</button></div></form>`);return}
      if(action==='export-scorecard'){const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;const rows=balancedScorecardData().flatMap(p=>p.kpis.map(k=>[p.id,p.strategicObjective,p.goals.join(' | '),p.executionObjectives.join(' | '),k.name,k.target,k.actual,k.achievement,k.weight,k.status].map(q).join(',')));const csv=['Perspective,Strategic objective,Goals,Execution objectives,KPI,Target,Current,Achievement,Weight,Status',...rows].join('\n');const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Fadzai_Moyo_Balanced_Scorecard_Q3_2026.csv';a.click();URL.revokeObjectURL(a.href);toast('Balanced scorecard exported.','success');return}
      if(action==='prepare-review'){modal('Prepare performance review',`<p style="font-size:12px;color:var(--muted);line-height:1.6">Matanho will assemble goals, evidence, feedback and the most important outcomes from this period.</p><div class="toggle-row"><span>Include completed goals</span><button class="switch on"></button></div><div class="toggle-row"><span>Include stakeholder feedback</span><button class="switch on"></button></div><div class="toggle-row"><span>Draft reflection with Matanho AI</span><button class="switch on"></button></div><div class="form-actions"><button class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn" data-action="generate-review">Generate review</button></div>`);return}
      if(action==='generate-review'){closePortal();toast('Review preparation workspace created.','success');return}
      if(action==='import-people'){toast('Import accepts CSV or XLSX files in the production integration.');return}
      if(action==='add-person'){modal('Add person',`<form id="personForm"><div class="form-grid"><div class="form-field"><label>Full name</label><input class="input-control" name="name" required/></div><div class="form-field"><label>Email</label><input class="input-control" type="email" name="email" required/></div><div class="form-field"><label>Role</label><input class="input-control" name="role"/></div><div class="form-field"><label>Team</label><select class="select-control"><option>Investments</option><option>Operations</option><option>People & Culture</option></select></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Add person</button></div></form>`);return}
      if(action==='message-person'){toast('Message composer opened.');return}
      if(action==='schedule-person'){navigate('calendar');return}
      if(action==='copy-profile'){navigator.clipboard?.writeText(location.origin+'/home/profile');toast('Profile link copied.','success');return}
      if(action==='edit-profile'){modal('Edit profile',`<form id="profileForm"><div class="form-grid"><div class="form-field"><label>First name</label><input class="input-control" name="firstName" value="${esc(D.user.firstName)}" required/></div><div class="form-field"><label>Last name</label><input class="input-control" name="lastName" value="${esc(D.user.lastName)}" required/></div><div class="form-field full"><label>Email</label><input class="input-control" type="email" name="email" value="${esc(D.user.email)}" required/></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Save changes</button></div></form>`);return}
      if(action==='download-payslip'){const btn=e.target.closest('[data-action="download-payslip"]');const payslipId=btn&&btn.dataset.payslipId;if(!payslipId){toast('No payslip to download yet.');return}emitIntegrationEvent('payslip.download.requested',{payslipId});return}
      if(action==='build-workflow'){modal('Build a workflow',`<form id="workflowForm"><div class="form-grid"><div class="form-field full"><label>When this happens</label><select class="select-control"><option>An expense is approved</option><option>A goal is completed</option><option>A new employee joins</option></select></div><div class="form-field full"><label>Do this</label><select class="select-control"><option>Create accounting journal</option><option>Notify owner</option><option>Update performance goal</option></select></div><div class="form-field full"><label>Workflow name</label><input class="input-control" name="name" value="Automate expense approvals"/></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Create workflow</button></div></form>`);return}
      if(action==='personalise-news'){toast('News preferences saved to your profile.','success');return}
      if(action==='calendar-source'){e.target.closest('.switch').classList.toggle('on');return}
    }
    const aiMode=e.target.closest('[data-ai-mode]'); if(aiMode){state.aiMode=aiMode.dataset.aiMode;saveState();render();return}
    const aiSource=e.target.closest('[data-ai-source]'); if(aiSource){const id=aiSource.dataset.aiSource;state.aiContextSources[id]=state.aiContextSources[id]===false;saveState();render();return}
    const aiRoute=e.target.closest('[data-ai-open-route]'); if(aiRoute){navigate(aiRoute.dataset.aiOpenRoute);return}
    const aiRecent=e.target.closest('[data-ai-recent]'); if(aiRecent){const item=state.aiRecent.find(x=>x.id===aiRecent.dataset.aiRecent);if(item){state.aiMessages=[];aiRespond(item.prompt)}return}
    const aiSaved=e.target.closest('[data-ai-saved-open]'); if(aiSaved){const item=state.aiSaved[Number(aiSaved.dataset.aiSavedOpen)];if(item){state.aiMode='ask';state.aiMessages=[{role:'user',text:item.prompt||item.title},{role:'assistant',...item}];saveState();render()}return}
    const pri=e.target.closest('[data-priority-toggle]'); if(pri){const t=state.priorities.find(x=>x.id==pri.dataset.priorityToggle);t.done=!t.done;saveState();emitIntegrationEvent('priorities.task.toggled',{id:t.id,done:t.done});render();toast(t.done?'Priority completed.':'Priority reopened.',t.done?'success':'');return}
    const wt=e.target.closest('[data-work-toggle]'); if(wt){e.stopPropagation();const t=state.workTasks.find(x=>String(x.id)===String(wt.dataset.workToggle));if(t){t.done=!t.done;if(t.done)t.progress=100;saveState();render();toast(t.done?'Task completed.':'Task reopened.',t.done?'success':'');emitIntegrationEvent('work.task.updated',{id:t.id,progress:t.progress,done:t.done})}return}
    const scorecardPerspective=e.target.closest('[data-scorecard-perspective]'); if(scorecardPerspective && !e.target.closest('[data-scorecard-kpi]')){state.scorecardPerspective=scorecardPerspective.dataset.scorecardPerspective;saveState();render();return}
    const scorecardKpi=e.target.closest('[data-scorecard-kpi]'); if(scorecardKpi){const perspective=balancedScorecardData().find(p=>p.id===scorecardKpi.dataset.scorecardPerspective);const kpi=perspective?.kpis[Number(scorecardKpi.dataset.scorecardKpi)];if(kpi)drawer(kpi.name,`<div class="scorecard-drawer-head"><div class="score-ring-large"><strong>${kpi.achievement}</strong><span>Achievement</span></div><div><span class="eyebrow">${perspective.id}</span><h3>${kpi.status}</h3><p>This measure contributes ${kpi.weight}% to the personal scorecard and has ${kpi.evidence} linked evidence items.</p></div></div><div class="scorecard-detail-row"><div><strong>Target</strong><span>Agreed for Q3 2026</span></div><b>${kpi.target}</b></div><div class="scorecard-detail-row"><div><strong>Current result</strong><span>Latest verified value</span></div><b>${kpi.actual}</b></div><div class="scorecard-detail-row"><div><strong>Weighted contribution</strong><span>Achievement × KPI weight</span></div><b>${(kpi.achievement*kpi.weight/100).toFixed(1)}</b></div><button class="primary-btn" style="width:100%;margin-top:18px" data-action="prepare-review">Add evidence or update</button>`);return}
    const workMode=e.target.closest('[data-work-mode]'); if(workMode){state.workMode=workMode.dataset.workMode;saveState();render();return}
    const workProject=e.target.closest('[data-work-project]'); if(workProject){state.workProject=workProject.dataset.workProject;state.workMode='My work';saveState();render();return}
    const taskOpen=e.target.closest('[data-task-open]'); if(taskOpen){const t=state.workTasks.find(x=>String(x.id)===String(taskOpen.dataset.taskOpen));if(t)modal('Task details',`<form id="taskDetailForm"><input type="hidden" name="taskId" value="${t.id}"/><div class="task-detail-head"><div class="task-icon">${icon('check')}</div><div><span>${esc(t.project)}</span><h3>${esc(t.title)}</h3></div></div><div class="form-grid"><div class="form-field"><label>Owner</label><input class="input-control" value="${esc(t.owner)}" disabled/></div><div class="form-field"><label>Due</label><input class="input-control" type="date" name="due" value="${esc((t.dueIso||'').slice(0,10))}"/></div><div class="form-field"><label>Priority</label><select class="select-control" name="status"><option ${t.status==='High'?'selected':''}>High</option><option ${!t.status||t.status==='Medium'?'selected':''}>Medium</option><option ${t.status==='Low'?'selected':''}>Low</option></select></div><div class="form-field"><label>Progress <span id="taskProgressValue">${t.progress}%</span></label><input id="taskProgressRange" type="range" min="0" max="100" step="5" name="progress" value="${t.progress}"/></div></div><label class="setting-toggle"><div><strong>Completed</strong><span>Mark this task as finished.</span></div><input type="checkbox" name="done" ${t.done?'checked':''}/><i></i></label><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Save task</button></div></form>`);return}
    const editorPanel=e.target.closest('[data-editor-panel]'); if(editorPanel){state.newsletterStudioPanel=editorPanel.dataset.editorPanel;saveState();render();return}
    const ev=e.target.closest('[data-event]'); if(ev){if(state.route==='calendar'){state.calendarSelectedEvent=ev.dataset.event;state.calendarDetailsOpen=true;saveState();render()}else eventDrawer(ev.dataset.event);return}
    const uiTheme=e.target.closest('[data-ui-theme]'); if(uiTheme){state.cover.theme=uiTheme.dataset.uiTheme;saveState();emitIntegrationEvent('preferences.theme.updated',{theme:state.cover.theme,wallpaper:state.cover.wallpaper});render();toast(`${state.cover.theme} atmosphere applied.`,'success');return}
    const wallpaper=e.target.closest('[data-cover-wallpaper]'); if(wallpaper){state.cover.wallpaper=wallpaper.dataset.coverWallpaper;state.heroOffset=0;state.settings.autoHero=state.cover.wallpaper==='auto';saveState();emitIntegrationEvent('preferences.wallpaper.updated',{wallpaper:state.cover.wallpaper});render();toast(state.cover.wallpaper==='auto'?'Daily wallpaper rotation enabled.':'Wallpaper applied.','success');return}
    const cs=e.target.closest('[data-cover-style]'); if(cs){state.cover.style=cs.dataset.coverStyle;saveState();render();return}
    const cm=e.target.closest('[data-cover-mood]'); if(cm){state.cover.mood=cm.dataset.coverMood;saveState();render();return}
    const ct=e.target.closest('[data-cover-toggle]'); if(ct){state.cover[ct.dataset.coverToggle]=!state.cover[ct.dataset.coverToggle];saveState();render();return}
    const nf=e.target.closest('[data-news-filter]'); if(nf){state.newsFilter=nf.dataset.newsFilter;render();return}
    const ff=e.target.closest('[data-forum-filter]'); if(ff){state.forumFilter=ff.dataset.forumFilter;render();return}
    const pt=e.target.closest('[data-performance-tab]'); if(pt){state.performanceTab=pt.dataset.performanceTab;render();scrollTo(0,0);return}
    const pg=e.target.closest('[data-performance-goal]'); if(pg){const goals=['Zambia renewable energy mandate','Diversify sector research pipeline','Build client insights capability','Team knowledge sharing'];modal(goals[Number(pg.dataset.performanceGoal)]||'Goal detail',`<div class="modal-insight"><span class="eyebrow">Goal update</span><h3>Progress is supported by current evidence.</h3><p>Review milestones, evidence and confidence before submitting the next update.</p><div class="form-actions"><button class="secondary-btn" data-action="close-portal">Close</button><button class="primary-btn" data-action="close-portal">Open goal workspace</button></div></div>`);return}
    const fb=e.target.closest('[data-feedback-open]'); if(fb){modal('Feedback detail',`<div class="modal-insight"><span class="eyebrow">Confidential feedback</span><h3>Clear judgement and trusted communication.</h3><p>This feedback is linked to your Q3 performance narrative and can be included as review evidence.</p><div class="form-actions"><button class="secondary-btn" data-action="close-portal">Close</button><button class="primary-btn" data-action="close-portal">Add to review</button></div></div>`);return}
    const no=e.target.closest('[data-news-open]'); if(no){state.selectedNews=no.dataset.newsOpen;state.route='news';syncUrl();render();scrollTo(0,0);return}
    const nb=e.target.closest('[data-news-bookmark]'); if(nb){const id=Number(nb.dataset.newsBookmark);state.newsBookmarks=state.newsBookmarks.includes(id)?state.newsBookmarks.filter(x=>x!==id):[...state.newsBookmarks,id];saveState();render();toast(state.newsBookmarks.includes(id)?'Saved for later.':'Removed from saved.','success');return}
    const nm=e.target.closest('[data-newsletter-mode]'); if(nm){state.newsletterMode=nm.dataset.newsletterMode;state.route='newsletters';syncUrl();render();scrollTo(0,0);return}
    const nlo=e.target.closest('[data-newsletter-open]'); if(nlo){state.selectedNewsletter=nlo.dataset.newsletterOpen;state.newsletterMode='reader';state.route='newsletters';syncUrl();render();scrollTo(0,0);return}
    const fl=e.target.closest('[data-forum-like]'); if(fl){const list=state.forumComments[state.forumThread]||[];const c=list.find(x=>String(x.id)===fl.dataset.forumLike);if(c){c.likes=(c.likes||0)+1;saveState();render()}else toast('Reaction recorded.','success');return}
    const fo=e.target.closest('[data-forum-open]'); if(fo){state.forumThread=fo.dataset.forumOpen;state.route='forums';syncUrl();render();scrollTo(0,0);return}
    const ptab=e.target.closest('[data-profile-tab]'); if(ptab){state.profileTab=ptab.dataset.profileTab;saveState();render();return}
    const skill=e.target.closest('[data-endorse-skill]'); if(skill){const s=state.profileSkills[Number(skill.dataset.endorseSkill)];if(s){s.endorsements+=1;saveState();render();toast(`${s.name} endorsed.`,'success')}return}
    const pdoc=e.target.closest('[data-profile-document]'); if(pdoc){const d=state.profileDocuments[Number(pdoc.dataset.profileDocument)];if(d)drawer(d.name,`<div class="detail-line">${icon(d.icon||'newsletter')}<span>${d.category}</span></div><div class="detail-line">${icon('clock')}<span>Updated ${d.updated}</span></div><div class="detail-line">${icon('lock')}<span>${d.status} · Permission protected</span></div><div class="detail-section"><h4>Document preview</h4><p style="font-size:11px;color:var(--muted);line-height:1.65">A secure preview would appear here in the connected document service. Access and download actions are audited.</p></div><button class="primary-btn" style="width:100%;margin-top:16px">${icon('download')} Download</button>`);return}
    const per=e.target.closest('[data-person]'); if(per){state.selectedPerson=per.dataset.person;saveState();render();return}
    const ser=e.target.closest('[data-service]'); if(ser){serviceModal(ser.dataset.service);return}
    const ra=e.target.closest('[data-request-app]'); if(ra){e.stopPropagation();const a=state.apps.find(x=>x.id===ra.dataset.requestApp);modal(`Request access to ${a?.name||'app'}`,`<form id="appAccessForm"><input type="hidden" name="appId" value="${a?.id||''}"/><div class="app-request-summary"><div class="task-icon">${icon(a?.icon||'apps')}</div><div><strong>${a?.name}</strong><span>${a?.description}</span></div></div><div class="form-field"><label>Business reason</label><textarea class="textarea-control" name="reason" required placeholder="Explain the work that requires this access."></textarea></div><div class="form-field"><label>Access duration</label><select class="select-control" name="duration"><option>Permanent</option><option>90 days</option><option>30 days</option></select></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Submit request</button></div></form>`);return}
    const pin=e.target.closest('[data-pin-app]'); if(pin){e.stopPropagation();const a=state.apps.find(x=>x.id===pin.dataset.pinApp);a.pinned=!a.pinned;saveState();render();toast(a.pinned?'App pinned to your workspace.':'App unpinned.','success');return}
    const categoryButton=e.target.closest('[data-filter-app-category]'); if(categoryButton){const category=categoryButton.dataset.filterAppCategory;document.querySelectorAll('.app-card-v9').forEach(card=>card.style.display=card.dataset.appGroup===category?'grid':'none');const select=document.getElementById('appCategory');if(select) select.value=category;document.querySelector('.app-browser-grid-v9')?.scrollIntoView({behavior:'smooth',block:'start'});return}
    const app=e.target.closest('[data-launch-app]'); if(app){const a=state.apps.find(x=>x.id===app.dataset.launchApp);if(!a?.hasAccess){const pending=state.appAccessRequests.some(r=>r.appId===a?.id&&r.status==='Pending');toast(pending?'Your access request is pending.':'Request access before opening this app.');return}toast(`${a?.name||'App'} opened in a connected workspace.`,'success');return}
    const ai=e.target.closest('[data-ai-prompt]'); if(ai){state.aiMessages=[];navigate('matanho-ai');setTimeout(()=>{aiRespond(ai.dataset.aiPrompt)},50);return}
    const cmd=e.target.closest('[data-command-route]'); if(cmd){if(cmd.dataset.commandPerson)state.selectedPerson=cmd.dataset.commandPerson;if(cmd.dataset.commandNews)state.selectedNews=Number(cmd.dataset.commandNews);closePortal();navigate(cmd.dataset.commandRoute);return}
    if(e.target.classList.contains('overlay'))closePortal();
  }, __hv3Sig);

  document.addEventListener('input', e => {
    if(e.target.id==='saturationRange'){rootEl.style.setProperty('--user-saturation',String(Number(e.target.value)/100));const label=document.getElementById('saturationValue');if(label)label.textContent=`${e.target.value}%`;return}
    if(e.target.id==='globalSearch'){commandPalette(e.target.value);return}
    if(e.target.id==='commandInput'){commandPalette(e.target.value);return}
    if(e.target.id==='coverIntention'){state.cover.intention=e.target.value;saveState();const q=document.querySelector('.story-quote');if(q)q.textContent=e.target.value;return}
    if(e.target.id==='peopleSearch'){state.peopleSearch=e.target.value;window.clearTimeout(window.__peopleSearchTimer);window.__peopleSearchTimer=setTimeout(render,180);return} if(e.target.id==='peopleDept'){state.peopleDept=e.target.value;render();return}
    if(e.target.id==='serviceSearch'){const q=e.target.value.toLowerCase();document.querySelectorAll('.service-card[data-service]').forEach(row=>{row.style.display=row.textContent.toLowerCase().includes(q)?'flex':'none'});return}
    if(e.target.id==='appSearch'){const q=e.target.value.toLowerCase();document.querySelectorAll('.app-card').forEach(row=>{row.style.display=row.textContent.toLowerCase().includes(q)?'grid':'none'});return}
    if(e.target.id==='aiKnowledgeSearch'){const q=e.target.value.toLowerCase();document.querySelectorAll('.ai-search-result-v16').forEach(row=>{row.style.display=row.textContent.toLowerCase().includes(q)?'grid':'none'});return}
    if(e.target.id==='workSearch'){state.workSearch=e.target.value;saveState();window.clearTimeout(window.__workSearchTimer);window.__workSearchTimer=setTimeout(render,180);return}
    if(e.target.id==='taskProgressRange'){const label=document.getElementById('taskProgressValue');if(label)label.textContent=`${e.target.value}%`;return}
  }, __hv3Sig);
  document.addEventListener('change', e => { if(e.target.id==='wallpaperFileInput'){const files=Array.from(e.target.files||[]);e.target.value='';if(files.length){toast('Uploading wallpaper\u2026');emitIntegrationEvent('wallpaper.upload.requested',{files})}return} if(e.target.id==='rotationInterval'){emitIntegrationEvent('preferences.rotation.updated',{intervalMinutes:Number(e.target.value)});return} const wp=e.target.closest('[data-work-progress]'); if(wp){const t=state.workTasks.find(x=>String(x.id)===String(wp.dataset.workProgress));if(t){t.progress=Number(wp.value||0);t.done=t.progress>=100;saveState();render();toast(t.done?'Task completed.':'Task progress updated.','success');emitIntegrationEvent('work.task.progress.updated',{id:t.id,progress:t.progress,done:t.done})}return} if(e.target.id==='aiScope'){state.aiScope=e.target.value;saveState();return} if(e.target.id==='workStatusFilter'){state.workFilter=e.target.value;saveState();render();return} if(e.target.id==='performancePeriod'){state.performancePeriod=e.target.value;render();return} if(e.target.id==='newsletterRole'){state.newsletterRole=e.target.value;saveState();render();toast(`Newsletter role set to ${state.newsletterRole}.`,'success');return} if(e.target.id==='appCategory'){document.querySelectorAll('.app-card-v9').forEach(g=>g.style.display=e.target.value==='All categories'||g.dataset.appGroup===e.target.value?'grid':'none');return} }, __hv3Sig);
  document.addEventListener('submit', e => {
    e.preventDefault();
    if(e.target.id==='startDayForm'){const f=new FormData(e.target);const duration=Number(f.get('duration')||50);state.daySession={active:true,paused:false,taskId:String(f.get('taskId')||'none'),status:String(f.get('status')||'Focus mode'),durationMinutes:duration,startedAt:Date.now(),pausedRemaining:null};state.profileAvailability=state.daySession.status;saveState();emitIntegrationEvent('workday.session.started',{...state.daySession,task:selectedSessionTask()});closePortal();render();toast('Your timer is running.','success');return}
    if(e.target.id==='settingsForm'){const f=new FormData(e.target);state.settings={...state.settings,language:f.get('language'),timezone:f.get('timezone'),density:f.get('density'),profileVisibility:f.get('profileVisibility'),saturation:Number(f.get('saturation')||118),glass:f.has('glass'),motion:f.has('motion'),autoHero:f.has('autoHero'),usageAnalytics:f.has('usageAnalytics'),calendarAlerts:f.has('calendarAlerts'),newsDigest:f.has('newsDigest'),forumMentions:f.has('forumMentions'),performanceReminders:f.has('performanceReminders')};saveState();closePortal();render();toast('Preferences saved across your workspace.','success');return}
    if(e.target.id==='homeAssistant'||e.target.id==='serviceAi'){const p=new FormData(e.target).get('prompt');state.aiMessages=[];navigate('matanho-ai');setTimeout(()=>aiRespond(p),50);return}
    if(e.target.id==='aiTopForm'||e.target.id==='aiComposer'){const p=new FormData(e.target).get('prompt');e.target.reset();aiRespond(p);return}
    if(e.target.id==='aiSearchForm'){const q=String(new FormData(e.target).get('query')||'').trim();if(q)toast(`Showing permission-visible results for “${q}”.`,'success');return}
    if(e.target.id==='aiDraftForm'){const f=new FormData(e.target);state.aiDraft={type:String(f.get('type')),audience:String(f.get('audience')),subject:String(f.get('subject')),body:String(f.get('body'))};saveState();toast('Draft saved privately.','success');return}
    if(e.target.id==='postReplyForm'){const f=new FormData(e.target),text=String(f.get('reply')||'').trim();if(!text)return;emitIntegrationEvent('post.reply.created',{postId:e.target.dataset.replyPost,content:text});return}
    if(e.target.id==='discussionForm'){const f=new FormData(e.target);closePortal();emitIntegrationEvent('post.created',{title:f.get('title'),content:f.get('body'),category:f.get('category')});return}
    if(e.target.id==='postForm'){const f=new FormData(e.target);closePortal();emitIntegrationEvent('post.created',{title:f.get('title'),content:f.get('content'),category:null,isNotified:f.has('notify')});return}
    if(e.target.id==='newsletterForm'){const f=new FormData(e.target);const imageFile=f.get('image');closePortal();emitIntegrationEvent('newsletter.created',{title:f.get('title'),content:f.get('content'),imageFile:(imageFile&&imageFile.size)?imageFile:null});return}
    if(e.target.id==='eventForm'){const f=new FormData(e.target);const dateStr=String(f.get('date')||'');const timeStr=String(f.get('time')||'09:00');const start=dateStr?new Date(dateStr+'T'+timeStr):new Date();const end=new Date(start.getTime()+60*60000);const attendees=String(f.get('attendees')||'').trim();emitIntegrationEvent('calendar.entry.created',{title:f.get('title'),startDate:start.toISOString(),endDate:end.toISOString(),description:attendees?('Attendees: '+attendees):null});closePortal();toast('Event created.','success');return}
    if(e.target.id==='taskForm'){const f=new FormData(e.target);closePortal();emitIntegrationEvent('work.task.created',{title:f.get('title'),project:f.get('project')||null,dueDate:f.get('date'),priority:f.get('priority')});return}
    if(e.target.id==='taskDetailForm'){const f=new FormData(e.target),t=state.workTasks.find(x=>String(x.id)===String(f.get('taskId')));if(t){const rawDue=f.get('due');if(rawDue){const d=new Date(`${rawDue}T12:00:00`);t.dueIso=d.toISOString();const today=new Date();t.due=d.toDateString()===today.toDateString()?'Today':d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}t.status=String(f.get('status')||'Medium');t.progress=Number(f.get('progress')||0);t.done=f.has('done')||t.progress>=100;if(t.done)t.progress=100;saveState();emitIntegrationEvent('work.task.updated',{id:t.id,dueDate:t.dueIso,priority:t.status,progress:t.progress,done:t.done})}closePortal();render();toast('Task updated.','success');return}
    
    if(e.target.id==='personForm'){closePortal();toast('Person added to the directory.','success');return}
    if(e.target.id==='leaveRequestForm'){const f=new FormData(e.target),start=new Date(f.get('start')),end=new Date(f.get('end'));let days=Math.max(.5,Math.round((end-start)/86400000)+1);if(f.get('halfDay'))days=.5;if(!Number.isFinite(days)||days<=0){toast('Choose a valid leave period.');return}if(f.get('type')==='Annual leave'&&days>state.leaveBalance){toast('This request exceeds your available annual leave.');return}if(f.get('type')==='Annual leave')state.leaveBalance=Math.max(0,state.leaveBalance-days);const leaveSummary=`${f.get('type')} · ${days} day${days===1?'':'s'}`;state.requests.unshift({id:`LEV-2026-${Math.floor(1100+Math.random()*800)}`,service:leaveSummary,submitted:'31 Jul 2026',owner:'Tawanda Kasere',status:'In progress',next:'Manager approval'});saveState();emitIntegrationEvent('service.request.created',{type:'leave',summary:leaveSummary,amount:null});closePortal();render();toast('Leave request submitted.','success');return}
    if(e.target.id==='newsletterListForm'){const f=new FormData(e.target);state.newsletterLists.push({id:`list-${Date.now()}`,name:f.get('name'),type:f.get('type'),members:Number(f.get('members')||0),owner:f.get('owner')});saveState();closePortal();render();toast('Newsletter list created.','success');return}
    if(e.target.id==='newsletterShareForm'){const f=new FormData(e.target);state.newsletterShares.unshift({title:f.get('title'),channel:f.get('channel'),audience:f.get('audience'),status:state.newsletterRole==='Publisher'?'Scheduled':'In review'});saveState();closePortal();render();toast(state.newsletterRole==='Publisher'?'Newsletter scheduled.':'Newsletter submitted for approval.','success');return}
    if(e.target.id==='newsletterAccessForm'){closePortal();toast('Newsletter access request submitted.','success');return}
    if(e.target.id==='appAccessForm'){const f=new FormData(e.target),id=f.get('appId');if(!state.appAccessRequests.some(r=>r.appId===id&&r.status==='Pending'))state.appAccessRequests.unshift({appId:id,status:'Pending',submitted:'31 Jul 2026',reason:f.get('reason')});saveState();closePortal();render();toast('App access request submitted.','success');return}
    if(e.target.id==='serviceRequestForm'){const f=new FormData(e.target);const reqSummary=String(f.get('service')||'Service request');state.requests.unshift({id:`SRV-2026-${Math.floor(1100+Math.random()*800)}`,service:reqSummary,submitted:'30 Jul 2026',owner:'Fadzai Moyo',status:'In progress',next:'Review submitted details'});saveState();emitIntegrationEvent('service.request.created',{type:String(f.get('requestType')||'other'),summary:reqSummary,amount:f.get('amount')?Number(f.get('amount')):null});closePortal();render();toast('Service request submitted.','success');return}
    if(e.target.id==='profileSkillForm'){const f=new FormData(e.target),name=(f.get('skill')||'').trim();if(!name)return;state.profileSkills.push({name,endorsements:Number(f.get('endorsements')||0)});saveState();closePortal();render();toast('Skill added to your profile.','success');return}
    if(e.target.id==='profileDocumentForm'){const f=new FormData(e.target),file=f.get('file');state.profileDocuments.unshift({name:f.get('name'),category:f.get('category'),size:file&&file.size?`${Math.max(1,Math.round(file.size/1024))} KB`:'Pending upload',status:'Current',updated:'31 Jul 2026',icon:f.get('category')==='Profile media'?'profile':'newsletter'});saveState();closePortal();render();toast('Document added to your secure profile.','success');return}
    if(e.target.id==='profilePreferencesForm'){const f=new FormData(e.target);state.profilePreferences={focusHours:f.get('focusHours'),preferredContact:f.get('preferredContact'),officeDays:f.get('officeDays'),timezone:f.get('timezone'),showAvailability:f.has('showAvailability'),shareSkills:f.has('shareSkills'),showProjects:f.has('showProjects'),discoverable:f.has('discoverable')};saveState();closePortal();render();toast('Profile preferences saved.','success');return}
    if(e.target.id==='profileForm'){const f=new FormData(e.target);closePortal();emitIntegrationEvent('profile.updated',{firstName:f.get('firstName'),lastName:f.get('lastName'),email:f.get('email')});return}
    if(e.target.id==='workflowForm'){closePortal();toast('Connected workflow created.','success');return}
  }, __hv3Sig);
  document.addEventListener('keydown', e => {
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();commandPalette()}
    if(e.key==='Escape')closePortal();
    if((e.metaKey||e.ctrlKey)&&e.key==='Enter'&&state.route==='matanho-ai'){const input=document.getElementById('aiTopInput');if(input?.value){aiRespond(input.value);input.value=''}}
  }, __hv3Sig);

  render();

  api = {
    setRoute(route, detail = {}) {
      state.route = route;
      state.mobileNav = false;
      if (Object.prototype.hasOwnProperty.call(detail, 'selectedNews')) state.selectedNews = detail.selectedNews;
      if (Object.prototype.hasOwnProperty.call(detail, 'forumThread')) state.forumThread = detail.forumThread;
      if (Object.prototype.hasOwnProperty.call(detail, 'selectedNewsletter') && detail.selectedNewsletter != null) {
        state.selectedNewsletter = detail.selectedNewsletter;
      }
      if (Object.prototype.hasOwnProperty.call(detail, 'newsletterMode') && detail.newsletterMode) {
        state.newsletterMode = detail.newsletterMode;
      }
      if (route === 'news' && detail.selectedNews == null && !Object.prototype.hasOwnProperty.call(detail, 'selectedNews')) {
        /* keep existing */
      }
      render();
    },
    setSessionUser(user) {
      applySessionUser(user);
    },
    destroy() {
      try {
        if (typeof timerInterval !== "undefined" && timerInterval) clearInterval(timerInterval);
      } catch (_) {}
      try {
        if (typeof sessionTimer !== "undefined" && sessionTimer) clearInterval(sessionTimer);
      } catch (_) {}
      __hv3Abort.abort();
      delete window.__HOME_V3_NAV__;
      rootEl.innerHTML = "";
      if(wallpaperRotationTimer) window.clearInterval(wallpaperRotationTimer);
    },
  };

function checkWallpaperRotation(){
    if (state.cover.wallpaper !== 'auto') return;
    const scene = currentHeroScene();
    if (scene.index !== lastRotationIndex) { lastRotationIndex = scene.index; render(); }
  }
  lastRotationIndex = currentHeroScene().index;
  wallpaperRotationTimer = window.setInterval(checkWallpaperRotation, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkWallpaperRotation(); }, __hv3Sig);

  return api;
}
