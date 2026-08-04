function renderSidebar() {
    const groups = D.nav.map(group => `<section class="nav-section"><div class="nav-label">${group.section}</div>${group.items.map(item=>`<button class="nav-item ${state.route===item.id?'active':''}" data-nav="${item.id}" title="${item.label}">${icon(item.icon)}<span>${item.label}</span></button>`).join('')}</section>`).join('');
    return `${state.mobileNav?'<button class="sidebar-scrim" data-action="mobile-menu" aria-label="Close navigation"></button>':''}<aside class="sidebar ${state.mobileNav?'open':''} ${state.sidebarCollapsed?'collapsed':''}">
      <div class="brand"><img class="brand-full" src="assets/matanho-logo.png" alt="Matanho"/><div class="brand-mark" aria-label="Matanho">m</div><button class="collapse-control" data-action="collapse-sidebar" title="${state.sidebarCollapsed?'Expand':'Collapse'} navigation">${icon(state.sidebarCollapsed?'chevron':'arrow')}</button></div>
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