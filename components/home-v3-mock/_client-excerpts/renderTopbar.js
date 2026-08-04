function renderTopbar() {
    return `<header class="topbar">
      <button class="icon-btn mobile-menu" data-action="mobile-menu">${icon('apps')}</button>
      <div class="search-wrap">${icon('search')}<input class="search-input" id="globalSearch" placeholder="Search people, work, news and more…" autocomplete="off" /><span class="shortcut">⌘ K</span></div>
      <div class="top-actions">
        <button class="icon-btn calendar-top" data-nav="calendar" title="Calendar">${icon('calendar')}</button>
        <button class="icon-btn app-launcher-top" data-nav="apps" title="Apps & workflows">${icon('apps')}</button>
        <button class="icon-btn messages-top" data-action="messages" title="Messages">${icon('message')}</button>
        <button class="icon-btn notifications-top" data-action="notifications" title="Notifications">${icon('bell')}<i class="badge-dot"></i></button>
        <button class="profile-top" data-action="profile-popover">${avatar(D.user.initials)}${icon('down')}</button>
      </div>
    </header>`;
  }