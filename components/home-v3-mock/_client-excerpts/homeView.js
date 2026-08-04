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
          <div class="hero-location">${icon('location')}<span>In Office&nbsp;&nbsp;•&nbsp;&nbsp;Harare, Zimbabwe</span></div>
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
          <div class="snapshot-time-pane">
            <div class="snapshot-chart-heading"><div><span class="eyebrow">Portfolio signal</span><strong>Assets under management</strong></div><span class="trend-positive">+16.9% YoY</span></div>
            <div class="axis-chart-frame detailed-chart-home">${detailedChartSvg([1.06,1.08,1.07,1.11,1.13,1.15,1.14,1.18,1.19,1.21,1.22,1.24],{xLabels:['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul'],yPrefix:'US$',ySuffix:'B',decimals:2,yLabel:'AUM',xLabel:'Month',target:1.20,showValues:false,ariaLabel:'Assets under management from August to July'})}</div>
            <div class="chart-context"><span>12-month range <strong>US$1.06B–US$1.24B</strong></span><span>Updated today</span></div>
          </div>
        </div>
      </section>
      <section class="home-action-grid">
        <article class="card card-pad card-hover home-priority-card">
          <div class="card-title"><div><h3>Today’s Priorities</h3><p>${state.priorities.filter(x=>x.done).length} of ${state.priorities.length} complete</p></div><button class="link-btn" data-nav="my-work">Open My Work ${icon('arrow')}</button></div>
          ${state.priorities.map(t=>`<div class="task-row"><button class="check-circle ${t.done?'checked':''}" data-priority-toggle="${t.id}">${t.done?icon('check'):''}</button><div class="task-copy"><strong style="${t.done?'text-decoration:line-through;color:var(--muted)':''}">${t.title}</strong><span>${t.meta}</span></div><span class="status-pill ${t.priority.toLowerCase()}">${t.priority}</span></div>`).join('')}
        </article>
        <article class="card card-pad card-hover schedule-card home-schedule-card">
          <div class="card-title"><div><h3>Upcoming Schedule</h3><p>Your next three commitments</p></div><button class="link-btn" data-nav="calendar">View calendar ${icon('arrow')}</button></div>
          ${D.schedule.map((e,i)=>`<div class="schedule-row" data-event="${e.id}"><div class="date-tile">${e.month}<strong>${e.day}</strong></div><div class="event-copy"><strong>${e.title}</strong><span>${e.time} · ${e.location}</span></div><div class="avatar-stack">${e.people.map((p,j)=>avatar(p,colorByIndex(j))).join('')}</div></div>`).join('')}
        </article>
      </section>`;
  }