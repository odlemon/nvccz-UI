/**
 * Harden portfolio runtime against empty live collections (cashAccounts etc.).
 * Run after extract-portfolio-v25.mjs if needed: node scripts/patch-portfolio-v25-empty-guards.mjs
 */
import fs from "fs"

const p = "components/portfolio-v11-mock/matanho-portfolio-runtime.js"
let s = fs.readFileSync(p, "utf8")

s = s.replaceAll(
  "account.purpose.replaceAll('_',' ')",
  "String(account.purpose||'FUND_OPERATING_BANK').replaceAll('_',' ')",
)
s = s.replaceAll(
  "a.purpose.replaceAll('_',' ')",
  "String(a.purpose||'FUND_OPERATING_BANK').replaceAll('_',' ')",
)

if (!s.includes("if(!a){toast('No cash accounts'")) {
  s = s.replace(
    "function showAccountDetail(id) {\n    const a=cashAccounts.find(item=>item.id===id)||cashAccounts[0]; state.selectedCashAccountId=a.id;",
    "function showAccountDetail(id) {\n    const a=cashAccounts.find(item=>item.id===id)||cashAccounts[0]; if(!a){toast('No cash accounts','Seed cash accounts to open this view.','warning');return;} state.selectedCashAccountId=a.id;",
  )
  s = s.replace(
    "function showCashExplanation(id=state.selectedCashAccountId) {\n    const a=cashAccounts.find(item=>item.id===id)||cashAccounts[0];",
    "function showCashExplanation(id=state.selectedCashAccountId) {\n    const a=cashAccounts.find(item=>item.id===id)||cashAccounts[0]; if(!a){toast('No cash accounts','Seed cash accounts to open this view.','warning');return;}",
  )
}

if (!s.includes("No cash accounts loaded")) {
  s = s.replace(
    /const cashContextBar = \(accountId = state\.selectedCashAccountId\) => \{\s*const account = cashAccounts\.find\(item => item\.id === accountId\) \|\| cashAccounts\[0\];\s*return/,
    `const cashContextBar = (accountId = state.selectedCashAccountId) => {
    const account = cashAccounts.find(item => item.id === accountId) || cashAccounts[0];
    if (!account) {
      return \`<div class="cash-context-bar"><div><span>Manager legal entity</span><strong>Matanho Capital Zimbabwe</strong></div><div><span>Fund / Vehicle</span><strong>No cash accounts loaded</strong></div><div><span>External account</span><strong>—</strong></div><div><span>Purpose / Currency</span><strong>—</strong></div><div><span>As of</span><strong>\${escapeHTML(state.asOfDate || '—')} · Africa/Harare</strong></div></div>\`;
    }
    const purpose = String(account.purpose || 'FUND_OPERATING_BANK').replaceAll('_',' ');
    return`,
  )
  // Fix the original template to use purpose var if still using account.purpose.replaceAll
  s = s.replace(
    /\$\{escapeHTML\(String\(account\.purpose\|\|'FUND_OPERATING_BANK'\)\.replaceAll\('_',' '\)\)\} · \$\{escapeHTML\(account\.currency\)\}/,
    "${escapeHTML(purpose)} · ${escapeHTML(account.currency || 'USD')}",
  )
}

if (!s.includes("workspace?.focus")) {
  s = s.replace(
    "requestAnimationFrame(() => { try { workspace.focus({preventScroll:true}); } catch (_) {} });",
    "requestAnimationFrame(() => { try { workspace?.focus?.({preventScroll:true}); } catch (_) {} });",
  )
}
if (!s.includes("$('#app')?.classList.toggle")) {
  s = s.replace(
    "$('#app').classList.toggle('sidebar-collapsed', state.sidebarCollapsed);\n    sidebar.classList.toggle('mobile-open', state.mobileNavOpen);",
    "$('#app')?.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);\n    sidebar?.classList.toggle('mobile-open', state.mobileNavOpen);",
  )
}

if (!s.includes("workspace ? workspace.scrollTop")) {
  s = s.replace(
    "const previousScrollTop = workspace.scrollTop;",
    "const previousScrollTop = workspace ? workspace.scrollTop : 0;",
  )
}
if (!s.includes("[portfolio-v11] render failed")) {
  s = s.replace(
    "workspace.innerHTML = `<div class=\"page page-enter\">${html}</div><div id=\"chartTooltip\" class=\"chart-tooltip\"></div>`;\n    renderStaticIcons(workspace);\n    workspace.scrollTop = preserveScroll ? previousScrollTop : 0;\n    lastRenderedPage = state.page;\n    bindDynamicElements();\n    emitIntegrationEvent('matanho:state-change', publicSnapshot());\n  }",
    "if (!workspace) return;\n    workspace.innerHTML = `<div class=\"page page-enter\">${html}</div><div id=\"chartTooltip\" class=\"chart-tooltip\"></div>`;\n    renderStaticIcons(workspace);\n    workspace.scrollTop = preserveScroll ? previousScrollTop : 0;\n    lastRenderedPage = state.page;\n    bindDynamicElements();\n    emitIntegrationEvent('matanho:state-change', publicSnapshot());\n    } catch (err) {\n      console.error('[portfolio-v11] render failed', err);\n      try {\n        if (workspace) {\n          workspace.innerHTML = `<div class=\"page\"><div class=\"empty-state\"><h3>Unable to render this view</h3><p>${escapeHTML(err && err.message ? err.message : 'Unexpected error')}</p></div></div>`;\n        }\n      } catch (_) {}\n    }\n  }",
  )
  // Ensure try { after function render() {
  if (!s.includes("function render() {\n    try {")) {
    s = s.replace("function render() {\n    const previousScrollTop", "function render() {\n    try {\n    const previousScrollTop")
  }
}
if (!s.includes("No funds loaded")) {
  s = s.replace(
    "renderFundPerformance = function() {\n    const selectedFund = funds.find(fund=>fund.name===state.activeFund) || funds[0];\n    const views = ['Performance','Cash Flows','Portfolio','Attribution','Benchmarks'];",
    "renderFundPerformance = function() {\n    const selectedFund = funds.find(fund=>fund.name===state.activeFund) || funds[0];\n    if (!selectedFund) {\n      return `${pageHeader('Fund Reporting','Interactive performance, cash-flow, portfolio, attribution and benchmark reporting.',`${button('Refresh','reset-fund-reporting-filters','','refresh')}`,'Fund Reporting')}<div class=\"empty-state\"><div class=\"empty-state-icon\">${icon('file-chart')}</div><h3>No funds loaded</h3><p>Live fund data is still loading or has not been seeded yet.</p></div>`;\n    }\n    const views = ['Performance','Cash Flows','Portfolio','Attribution','Benchmarks'];",
  )
}

fs.writeFileSync(p, s)
console.log("patched", p)
