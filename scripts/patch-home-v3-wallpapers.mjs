import fs from "fs"

// Fourth pass on the extracted runtime. Same CRLF-normalise / function-form-replace rules as
// the earlier patch-home-v3-*.mjs scripts — see patch-home-v3-live-data.mjs's header for why
// plain-string replacements are unsafe here.
const p = "components/home-v3-mock/matanho-runtime.js"
let s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n")
let missed = 0

function patch(label, oldStr, buildNew) {
  if (s.includes(oldStr)) {
    s = s.replace(oldStr, () => buildNew())
  } else {
    missed++
    console.error(`MISS: ${label}`)
  }
}

// 1. Rotation timer variable, declared alongside the existing abort-signal plumbing.
patch(
  "rotation timer variable declaration",
  "const __hv3Sig = { signal: __hv3Abort.signal };",
  () => "const __hv3Sig = { signal: __hv3Abort.signal };\n  let wallpaperRotationTimer = null;\n  let lastRotationIndex = null;"
)

// 2. currentHeroScene(): was pure day-granularity ("changes automatically each day", no way to
//    change that) and only ever indexed into the 7 built-in heroScenes. Now: interval-based
//    (D.rotationIntervalMinutes, minutes not days) and prefers the user's own uploaded images
//    (D.customWallpapers) over the presets when any exist. A "fixed" selection can point at
//    either pool — "custom:<id>" for an upload, a bare number for a preset index, matching the
//    two id shapes the wallpaper grid can now produce.
patch(
  "currentHeroScene",
  "function currentHeroScene(){\n    const now=new Date();\n    const day=Math.floor(new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()/86400000);\n    const fixed = state.cover.wallpaper !== 'auto' && Number.isFinite(Number(state.cover.wallpaper));\n    const base = fixed ? Number(state.cover.wallpaper) : (state.settings.autoHero ? day : 0);\n    const offset = fixed ? 0 : state.heroOffset;\n    const index=((base+offset)%heroScenes.length+heroScenes.length)%heroScenes.length;\n    return {...heroScenes[index],index};\n  }",
  () =>
    `function wallpaperPool(){
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
  }`
)

// 3. Wallpaper grid: custom uploads become additional tiles in the same grid (not a separate
//    gallery), plus an "Upload image" tile, plus a rotation-interval control shown only in auto
//    mode — all via small helper functions inserted before serviceModal, mirroring the
//    servicesSummaryTiles()/payslipModalMarkup() pattern from the previous patch.
const serviceModalAnchor = "function serviceModal(id){"
if (!s.includes("function customWallpaperTiles()")) {
  patch("serviceModal anchor for wallpaper helpers", serviceModalAnchor, () => `function customWallpaperTiles(){
    const list = D.customWallpapers || [];
    return list.map(w=>{
      const active = state.cover.wallpaper === ('custom:'+w.id);
      return \`<button class="wallpaper-card \${active?'active':''}" data-cover-wallpaper="custom:\${esc(w.id)}"><img src="\${esc(w.url)}" alt="\${esc(w.label||'Custom wallpaper')}" loading="lazy"/><span><strong>\${esc(w.label||'Custom')}</strong><small>Uploaded</small></span>\${active?\`<b>\${icon('check')}</b>\`:''}<span class="wallpaper-remove" data-action="delete-wallpaper" data-wallpaper-id="\${esc(w.id)}" role="button" aria-label="Remove wallpaper">\\u00d7</span></button>\`;
    }).join('');
  }
  function rotationIntervalControl(){
    if(state.cover.wallpaper!=='auto') return '';
    const opts=[[3,'Every 3 minutes'],[5,'Every 5 minutes'],[15,'Every 15 minutes'],[60,'Every hour'],[1440,'Once a day']];
    const current=Number(D.rotationIntervalMinutes)||1440;
    return \`<div class="rotation-interval-row"><label>Rotate</label><select class="select-control small-btn" id="rotationInterval">\${opts.map(([v,l])=>\`<option value="\${v}" \${current===v?'selected':''}>\${l}</option>\`).join('')}</select></div>\`;
  }
  ${serviceModalAnchor}`)
}

patch(
  "wallpaper grid section header + auto-card (inject interval control + custom tiles + upload tile)",
  '<section class="card editor-section theme-section-v10"><div class="editor-step"><span class="step-num">2</span><div><strong>Select the home wallpaper</strong><small>Use the daily rotation or keep one favourite scene.</small></div></div><div class="wallpaper-choice-grid"><button class="wallpaper-card auto-card ${state.cover.wallpaper===\'auto\'?\'active\':\'\'}" data-cover-wallpaper="auto"><div>${icon(\'sparkles\')}</div><strong>Daily rotation</strong><small>A different scene every day</small></button>${heroScenes.map((s,i)=>',
  () =>
    '<section class="card editor-section theme-section-v10"><div class="editor-step"><span class="step-num">2</span><div><strong>Select the home wallpaper</strong><small>Use the daily rotation or keep one favourite scene.</small></div></div>${rotationIntervalControl()}<div class="wallpaper-choice-grid"><button class="wallpaper-card auto-card ${state.cover.wallpaper===\'auto\'?\'active\':\'\'}" data-cover-wallpaper="auto"><div>${icon(\'sparkles\')}</div><strong>Daily rotation</strong><small>Cycles through your own photos if you\\u2019ve uploaded any, otherwise the built-in scenes</small></button>${customWallpaperTiles()}<button class="wallpaper-card auto-card" data-action="upload-wallpaper"><div>${icon(\'plus\')}</div><strong>Upload image</strong><small>Add your own photo</small></button><input type="file" id="wallpaperFileInput" accept="image/*" multiple style="display:none"/>${heroScenes.map((s,i)=>'
)

// 4. New click actions: trigger the hidden file input, and remove an uploaded wallpaper.
//    Inserted right after the existing reset-daily-cover branch (an established, simple
//    single-purpose action) so this stays a small, easy-to-diff addition.
patch(
  "reset-daily-cover anchor for new click actions",
  "if(action==='reset-daily-cover'){state.cover.theme='Porcelain';state.cover.wallpaper='auto';state.heroOffset=0;state.settings.autoHero=true;saveState();emitIntegrationEvent('preferences.theme.updated',{theme:'Porcelain',wallpaper:'auto'});render();toast('Daily Cover reset to automatic rotation.','success');return}",
  () =>
    "if(action==='reset-daily-cover'){state.cover.theme='Porcelain';state.cover.wallpaper='auto';state.heroOffset=0;state.settings.autoHero=true;saveState();emitIntegrationEvent('preferences.theme.updated',{theme:'Porcelain',wallpaper:'auto'});render();toast('Daily Cover reset to automatic rotation.','success');return}\n      if(action==='upload-wallpaper'){const input=document.getElementById('wallpaperFileInput');if(input)input.click();return}\n      if(action==='delete-wallpaper'){const id=e.target.closest('[data-action=\"delete-wallpaper\"]')?.dataset.wallpaperId;if(!id)return;emitIntegrationEvent('wallpaper.delete.requested',{id});return}"
)

// 5. change listener: file picker + rotation-interval select. Inserted at the start of the
//    existing document-level 'change' handler.
patch(
  "change listener anchor for file input + rotation interval",
  "document.addEventListener('change', e => { const wp=e.target.closest('[data-work-progress]');",
  () =>
    "document.addEventListener('change', e => { if(e.target.id==='wallpaperFileInput'){const files=Array.from(e.target.files||[]);e.target.value='';if(files.length){toast('Uploading wallpaper\\u2026');emitIntegrationEvent('wallpaper.upload.requested',{files})}return} if(e.target.id==='rotationInterval'){emitIntegrationEvent('preferences.rotation.updated',{intervalMinutes:Number(e.target.value)});return} const wp=e.target.closest('[data-work-progress]');"
)

// 6. Start/stop the rotation timer alongside the runtime's own lifecycle: begins right after
//    first mount (next to the existing `return api;`), stops in destroy(). Only re-renders when
//    the computed scene actually changes, so a 15s poll costs nothing between rotations even at
//    the longest (once-a-day) interval.
patch(
  "destroy(): stop rotation timer",
  '      __hv3Abort.abort();\n      delete window.__HOME_V3_NAV__;\n      rootEl.innerHTML = "";\n    },\n  };\n\n  return api;',
  () =>
    '      __hv3Abort.abort();\n      delete window.__HOME_V3_NAV__;\n      rootEl.innerHTML = "";\n      if(wallpaperRotationTimer) window.clearInterval(wallpaperRotationTimer);\n    },\n  };\n\n  lastRotationIndex = currentHeroScene().index;\n  wallpaperRotationTimer = window.setInterval(() => {\n    if (state.cover.wallpaper !== \'auto\') return;\n    const scene = currentHeroScene();\n    if (scene.index !== lastRotationIndex) { lastRotationIndex = scene.index; render(); }\n  }, 15000);\n\n  return api;'
)

fs.writeFileSync(p, s.replace(/\n/g, "\r\n"))
console.log(missed === 0 ? "0 missed" : `${missed} missed`)
