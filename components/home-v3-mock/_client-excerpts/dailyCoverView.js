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
          <section class="card editor-section theme-section-v10"><div class="editor-step"><span class="step-num">2</span><div><strong>Select the home wallpaper</strong><small>Use the daily rotation or keep one favourite scene.</small></div></div><div class="wallpaper-choice-grid"><button class="wallpaper-card auto-card ${state.cover.wallpaper==='auto'?'active':''}" data-cover-wallpaper="auto"><div>${icon('sparkles')}</div><strong>Daily rotation</strong><small>A different scene every day</small></button>${heroScenes.map((s,i)=>`<button class="wallpaper-card ${String(state.cover.wallpaper)===String(i)?'active':''}" data-cover-wallpaper="${i}"><img src="${s.src}" alt="${esc(s.label)}" loading="lazy"/><span><strong>${s.label}</strong><small>${s.mood}</small></span>${String(state.cover.wallpaper)===String(i)?`<b>${icon('check')}</b>`:''}</button>`).join('')}</div></section>
          <section class="card editor-section theme-section-v10"><div class="editor-step"><span class="step-num">3</span><div><strong>Workspace behaviour</strong><small>Personalisation is stored against the employee profile.</small></div></div><div class="theme-behaviour-list"><div class="theme-lock-row"><div class="theme-lock-icon">${icon('apps')}</div><div><strong>Consistent app identity</strong><small>Icons, actions and Matanho blue remain familiar in every theme.</small></div><span class="status-pill low">Locked</span></div><div class="theme-lock-row"><div class="theme-lock-icon">${icon('sun')}</div><div><strong>Responsive scene composition</strong><small>Desktop, tablet and mobile use purpose-cropped imagery.</small></div><span class="status-pill low">Active</span></div><div class="theme-lock-row"><div class="theme-lock-icon">${icon('services')}</div><div><strong>Accessibility protection</strong><small>Text contrast and focus states are preserved automatically.</small></div><span class="status-pill low">Active</span></div></div></section>
        </div>
      </div>`;
  }