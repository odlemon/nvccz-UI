/* eslint-disable */
// Extracted from Matanho Employee Hub Premium V17.1
export const MATANHO_DATA = {
  user: {
    name: 'Fadzai Moyo',
    firstName: 'Fadzai',
    role: 'Managing Partner',
    location: 'Harare, Zimbabwe',
    email: 'fadzai.moyo@matanho.co.zw',
    initials: 'FM',
    image: '/home-v3/assets/people/fadzai.jpg'
  },
  quotes: [
    'Calm focus compounds into exceptional outcomes.',
    'Clarity turns complexity into confident action.',
    'Meaningful progress begins with one deliberate choice.',
    'Quiet discipline creates work that speaks for itself.',
    'Make the important work feel inevitable.',
    'Protect your attention; it is the beginning of quality.',
    'Precision today becomes confidence tomorrow.',
    'Choose fewer priorities and finish them beautifully.',
    'A clear mind makes room for decisive work.',
    'Consistency is a quiet form of ambition.',
    'Good judgement grows in moments of stillness.',
    'Let the next right action be simple and visible.',
    'Create space before you create speed.',
    'Excellence often looks like patient repetition.',
    'Progress feels lighter when the purpose is clear.',
    'Build trust through small promises kept well.',
    'Focus on the signal; let the noise pass.',
    'Deliberate work creates durable value.',
    'Your calendar should reflect what matters most.',
    'Calm execution is a competitive advantage.',
    'Make room for the work only you can do.',
    'Clarity is kindness to your future self.',
    'One thoughtful decision can improve an entire week.',
    'Finish with the same care you used to begin.',
    'Quality emerges when attention is uninterrupted.',
    'Keep the standard high and the process humane.',
    'Purpose gives momentum a direction.',
    'Good systems turn intention into repeatable progress.',
    'Leave space for insight, not only activity.',
    'The best work is both useful and beautifully resolved.',
    'Begin gently, then build with conviction.',
  ],
  nav: [
    { section: 'Home', items: [
      { id: 'home', label: 'Home', icon: 'home' },
      { id: 'daily-cover', label: 'Daily Cover', icon: 'cover' }
    ]},
    { section: 'Communication', items: [
      { id: 'news', label: 'News', icon: 'news' },
      { id: 'newsletters', label: 'Newsletters', icon: 'newsletter' },
      { id: 'forums', label: 'Forums', icon: 'forum' }
    ]},
    { section: 'Work', items: [
      { id: 'calendar', label: 'Calendar', icon: 'calendar' },
      { id: 'my-work', label: 'My Work', icon: 'check' },
      { id: 'performance', label: 'Performance', icon: 'performance' }
    ]},
    { section: 'People', items: [
      { id: 'people', label: 'People', icon: 'people' },
      { id: 'my-profile', label: 'My Profile', icon: 'profile' }
    ]},
    { section: 'Services', items: [
      { id: 'services', label: 'Services', icon: 'services' }
    ]},
    { section: 'Apps', items: [
      { id: 'apps', label: 'Apps', icon: 'apps' },
      { id: 'matanho-ai', label: 'Matanho AI', icon: 'sparkles' }
    ]}
  ],
  priorities: [
    { id: 1, title: 'Quarterly LP report', meta: 'Due today · 10:00', priority: 'High', done: false },
    { id: 2, title: 'Investment committee', meta: 'Today · 14:00', priority: 'Medium', done: false },
    { id: 3, title: 'Portfolio review', meta: 'Tomorrow · 09:30', priority: 'Low', done: true }
  ],
  schedule: [
    { id: 1, day: '30', month: 'JUL', title: 'Investment committee', time: '14:00 – 15:30', location: 'Boardroom A', people: ['NM','TK','FD'], color: 'blue' },
    { id: 2, day: '31', month: 'JUL', title: 'Market update', time: '10:00 – 11:00', location: 'Microsoft Teams', people: ['RM','AM'], color: 'sage' },
    { id: 3, day: '01', month: 'AUG', title: 'LP call', time: '11:00 – 12:00', location: 'Zoom', people: ['NM','AM','TK','+2'], color: 'sand' }
  ],
  people: [
    { id: 'nyasha', name: 'Nyasha Moyo', initials: 'NM', image: '/home-v3/assets/people/nyasha.jpg', role: 'Senior Investment Analyst', team: 'Investments', location: 'Harare', status: 'Available now', statusType: 'available', expertise: ['Financial analysis','ESG','Modelling'], email: 'nyasha.moyo@matanho.co.zw', phone: '+263 77 312 8542', manager: 'Tawanda Kasere', projects: ['Zambia Solar Fund II','Energy Transition Mandate','ESG Integration Framework'], score: 92 },
    { id: 'tawanda', name: 'Tawanda Kasere', initials: 'TK', image: '/home-v3/assets/people/tawanda.jpg', role: 'Portfolio Manager', team: 'Investments', location: 'Harare', status: 'In a meeting', statusType: 'meeting', expertise: ['Portfolio strategy','Private equity','ESG'], email: 'tawanda.kasere@matanho.co.zw', phone: '+263 77 201 6638', manager: 'Chipo Dube', projects: ['Southern Africa Expansion','Q3 Portfolio Review'], score: 88 },
    { id: 'rudo', name: 'Rudo Maposa', initials: 'RM', image: '/home-v3/assets/people/rudo.jpg', role: 'Client Relations Manager', team: 'Client Relations', location: 'Harare', status: 'Available now', statusType: 'available', expertise: ['Client engagement','Stakeholder relations'], email: 'rudo.maposa@matanho.co.zw', phone: '+263 78 122 9043', manager: 'Nyasha Moyo', projects: ['Institutional Client Onboarding','Investor Communications'], score: 89 },
    { id: 'farai', name: 'Farai Dube', initials: 'FD', image: '/home-v3/assets/people/farai.jpg', role: 'Operations Manager', team: 'Operations', location: 'Bulawayo', status: 'Available now', statusType: 'available', expertise: ['Process optimisation','Risk management'], email: 'farai.dube@matanho.co.zw', phone: '+263 77 033 1921', manager: 'Fadzai Moyo', projects: ['Finance Close Automation','Vendor Governance'], score: 86 },
    { id: 'chipo', name: 'Chipo Ndlovu', initials: 'CN', image: '/home-v3/assets/people/chipo.jpg', role: 'People Business Partner', team: 'People & Culture', location: 'Harare', status: 'Busy until 15:00', statusType: 'busy', expertise: ['Employee relations','Change management'], email: 'chipo.ndlovu@matanho.co.zw', phone: '+263 77 405 5177', manager: 'Fadzai Moyo', projects: ['Leadership Programme','Performance Framework'], score: 91 },
    { id: 'tinashe', name: 'Tinashe Chaka', initials: 'TC', image: '/home-v3/assets/people/tinashe.jpg', role: 'Finance Manager', team: 'Finance', location: 'Harare', status: 'Available now', statusType: 'available', expertise: ['Financial reporting','Budgeting','Forecasting'], email: 'tinashe.chaka@matanho.co.zw', phone: '+263 78 221 7821', manager: 'Fadzai Moyo', projects: ['Q3 Forecast','Management Accounts'], score: 90 },
    { id: 'lerato', name: 'Lerato Maseko', initials: 'LM', image: '/home-v3/assets/people/lerato.jpg', role: 'People & Culture Adviser', team: 'People & Culture', location: 'Mutare', status: 'Available now', statusType: 'available', expertise: ['Talent development','Learning'], email: 'lerato.maseko@matanho.co.zw', phone: '+263 77 988 3055', manager: 'Chipo Ndlovu', projects: ['Graduate Programme','Learning Academy'], score: 87 },
    { id: 'danai', name: 'Danai Chirwa', initials: 'DC', image: '/home-v3/assets/people/danai.jpg', role: 'Investment Associate', team: 'Investments', location: 'Harare', status: 'Out of office', statusType: 'away', expertise: ['Financial analysis','Valuation','Modelling'], email: 'danai.chirwa@matanho.co.zw', phone: '+263 78 443 9600', manager: 'Tawanda Kasere', projects: ['Zambia Solar Fund II','Market Insights'], score: 84 }
  ],
  news: [
    { id: 1, source: 'Matanho Newsroom', category: 'Company', title: 'Matanho expands its investment research capability', excerpt: 'A new research unit will deepen sector intelligence and strengthen investment decisions across the region.', time: '2h ago', read: '6 min', tone: 'navy', image: '/home-v3/assets/news/research-capability.jpg' },
    { id: 2, source: 'Market Brief', category: 'Markets', title: 'Renewable energy investment accelerates across Southern Africa', excerpt: 'Policy reform and private capital are creating a stronger pipeline of investable clean-energy projects.', time: '1h ago', read: '5 min', tone: 'sage', image: '/home-v3/assets/news/renewable-energy.jpg' },
    { id: 3, source: 'Africa Capital', category: 'Investment', title: 'Private markets enter a more disciplined growth cycle', excerpt: 'Fund managers are placing greater emphasis on operating evidence, cash conversion and governance quality.', time: '3h ago', read: '4 min', tone: 'sand', image: '/home-v3/assets/news/private-markets.jpg' },
    { id: 4, source: 'Matanho Newsroom', category: 'People', title: 'Matanho welcomes its 2026 graduate analyst cohort', excerpt: 'The programme combines investment training, mentorship and meaningful project exposure.', time: '5h ago', read: '3 min', tone: 'blue', image: '/home-v3/assets/news/graduates.jpg' },
    { id: 5, source: 'Technology Review', category: 'Technology', title: 'AI governance becomes a board-level investment question', excerpt: 'Institutional investors are asking for more transparent operating controls and responsible adoption plans.', time: '6h ago', read: '7 min', tone: 'coral', image: '/home-v3/assets/news/ai-governance.jpg' },
    { id: 6, source: 'Infrastructure Africa', category: 'Africa', title: 'Regional infrastructure pipeline strengthens', excerpt: 'New transport and energy projects could unlock trade corridors and lower logistics costs.', time: '8h ago', read: '5 min', tone: 'teal', image: '/home-v3/assets/news/infrastructure.jpg' }
  ],
  newsletters: [
    { id: 1, title: 'Matanho Weekly', issue: 'Issue 28', date: '30 Jul 2026', description: 'Ideas, progress and signals shaping the week ahead.', tone: 'navy' },
    { id: 2, title: 'Market Brief', issue: 'July 2026', date: '25 Jul 2026', description: 'A disciplined view of markets, portfolios and emerging risks.', tone: 'blue' },
    { id: 3, title: 'People & Culture', issue: 'July 2026', date: '18 Jul 2026', description: 'Stories about leadership, learning and how we work.', tone: 'sage' },
    { id: 4, title: 'Portfolio Pulse', issue: 'Q2 2026', date: '10 Jul 2026', description: 'Portfolio signals, milestones and value-creation priorities.', tone: 'sand' }
  ],
  forums: [
    { id: 1, title: 'How should we frame risk appetite at project level?', category: 'Investment Insights', author: 'Tawanda Kasere', replies: 24, followers: 38, last: '18m ago', featured: true },
    { id: 2, title: 'What is the best way to engage clients on sustainability expectations?', category: 'Client Experience', author: 'Nyasha Moyo', replies: 15, followers: 27, last: '1h ago' },
    { id: 3, title: 'How do we apply the new procurement policy to consultants?', category: 'Operations', author: 'Farai Dube', replies: 12, followers: 31, last: '3h ago', solved: true },
    { id: 4, title: 'Ask Leadership: AMA with the Executive Committee', category: 'Ask Leadership', author: 'Fadzai Moyo', replies: 42, followers: 64, last: '5h ago' },
    { id: 5, title: 'Hybrid work: what is working, and what can we improve?', category: 'People & Culture', author: 'Rudo Maposa', replies: 8, followers: 19, last: '1d ago' }
  ],
  workProjects: [
    { id: 'sa', name: 'Southern Africa Expansion', progress: 64, status: 'On track' },
    { id: 'co', name: 'Client Onboarding', progress: 48, status: 'On track' },
    { id: 'ro', name: 'Risk Optimisation', progress: 32, status: 'At risk' },
    { id: 'mi', name: 'Market Insights', progress: 56, status: 'On track' }
  ],
  workTasks: [
    { id: 11, title: 'Update Q3 investment deck', project: 'Southern Africa Expansion', owner: 'You', due: 'Today', progress: 60, status: 'High', done: false },
    { id: 12, title: 'Review Angola market assumptions', project: 'Southern Africa Expansion', owner: 'Tawanda Kasere', due: 'Today', progress: 30, status: '', done: false },
    { id: 13, title: 'Stakeholder sync: ZB Bank Group', project: 'Client Onboarding', owner: 'Nyasha Moyo', due: 'Today', progress: 80, status: 'High', done: false },
    { id: 14, title: 'Prepare market commentary', project: 'Market Insights', owner: 'Rudo Maposa', due: '31 Jul', progress: 80, status: '', done: false },
    { id: 15, title: 'Validate portfolio risk models', project: 'Risk Optimisation', owner: 'You', due: '3 Aug', progress: 40, status: 'Medium', done: false },
    { id: 16, title: 'Client data room setup', project: 'Client Onboarding', owner: 'Farai Dube', due: '4 Aug', progress: 20, status: '', done: false },
    { id: 17, title: 'Compliance review: KYC workflow', project: 'Risk Optimisation', owner: 'Tawanda Kasere', due: '5 Aug', progress: 10, status: 'Medium', done: false }
  ],
  services: [
    { id: 'leave', name: 'Leave & Time', description: 'Request leave, view balances and manage your time.', icon: 'calendar' },
    { id: 'payroll', name: 'Payroll & Pay', description: 'Payslips, tax, banking details and salary advances.', icon: 'wallet' },
    { id: 'expenses', name: 'Expenses', description: 'Submit and track expenses and per diems.', icon: 'receipt' },
    { id: 'learning', name: 'Learning', description: 'Courses, compliance training and certifications.', icon: 'learning' },
    { id: 'travel', name: 'Travel', description: 'Book travel and manage itineraries and allowances.', icon: 'plane' },
    { id: 'support', name: 'IT Support', description: 'Get help with devices, software and access.', icon: 'support' },
    { id: 'facilities', name: 'Facilities', description: 'Workspace, equipment and facilities requests.', icon: 'building' }
  ],
  apps: [
    { id: 'portfolio', name: 'Portfolio Management', description: 'Mandates, investments and portfolio reporting.', icon: 'pie', category: 'Investment', pinned: true },
    { id: 'performance-app', name: 'Performance', description: 'Goals, reviews and feedback.', icon: 'target', category: 'People & Work', pinned: true },
    { id: 'accounting', name: 'Accounting', description: 'General ledger and management reporting.', icon: 'calculator', category: 'Finance & Operations', pinned: true },
    { id: 'drive', name: 'Matanho Drive', description: 'Documents, folders and secure sharing.', icon: 'folder', category: 'Finance & Operations', pinned: true },
    { id: 'procurement', name: 'Procurement', description: 'Source, approve and manage purchasing.', icon: 'cart', category: 'Finance & Operations', pinned: false },
    { id: 'payroll-app', name: 'Payroll & HR', description: 'Pay, benefits and compliance.', icon: 'people', category: 'Finance & Operations', pinned: false },
    { id: 'directory', name: 'People Directory', description: 'Find colleagues, skills and teams.', icon: 'profile', category: 'People & Work', pinned: false },
    { id: 'analytics', name: 'Analytics', description: 'Dashboards, KPIs and decision intelligence.', icon: 'performance', category: 'Insights', pinned: false },
    { id: 'events', name: 'Events', description: 'Company events and webinars.', icon: 'calendar', category: 'Communication', pinned: false }
  ]
} as const
