function workdaySessionPanel(){
    const s=state.daySession;
    if(!s.active){
      return `<div class="hero-start-card"><div class="hero-start-copy"><span>Plan · focus · begin</span><strong>Start your day</strong><small>Choose a task, set your status and start a focused timer.</small></div><button class="hero-start-button" data-action="start-day">${icon('play')} Start your day</button></div>`;
    }
    const task=selectedSessionTask();
    const remaining=sessionSecondsRemaining();
    return `<div class="hero-session-card"><div class="session-orb ${s.paused?'paused':''}">${icon(s.paused?'clock':'target')}</div><div class="hero-session-copy"><span>${esc(s.status)} · ${s.paused?'Paused':'In progress'}</span><strong data-session-time>${formatSessionTime(remaining)}</strong><small>${esc(task?.title||'Unassigned focus session')}</small></div><div class="hero-session-actions"><button data-action="${s.paused?'resume-day-session':'pause-day-session'}" title="${s.paused?'Resume':'Pause'} timer">${icon(s.paused?'play':'pause')}</button><button data-action="end-day-session" title="End timer">${icon('close')}</button></div></div>`;
  }