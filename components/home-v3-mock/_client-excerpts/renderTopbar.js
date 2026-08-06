function renderTopbar() {
    return `<header class="topbar">
      <button class="icon-btn mobile-menu" data-action="mobile-menu">${icon('apps')}</button>
      <div class="search-wrap">${icon('search')}<input class="search-input" id="globalSearch" placeholder="Search people, work, news and more…" autocomplete="off" /><span class="shortcut">⌘ K</span></div>
      <div class="top-actions">
        <button type="button" class="secondary-btn" data-arcus-modules title="Switch module" style="height:36px;padding:0 12px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600">${icon('apps')}<span>Modules</span></button>
        <button class="icon-btn calendar-top" data-nav="calendar" title="Calendar">${icon('calendar')}</button>
        <button class="icon-btn app-launcher-top" data-arcus-modules title="Switch module">${icon('apps')}</button>
        <button class="icon-btn messages-top" data-action="messages" title="Messages">${icon('message')}</button>
        <button class="icon-btn notifications-top" data-action="notifications" title="Notifications">${icon('bell')}<i class="badge-dot"></i></button>
        <button class="profile-top" data-action="profile-popover">${avatar(D.user.initials)}${icon('down')}</button>
      </div>
    </header>`;
  }