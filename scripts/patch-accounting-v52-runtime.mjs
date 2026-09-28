/**
 * Accounting V52 runtime patches (live Payables + record writes).
 *
 *   node scripts/patch-accounting-v52-runtime.mjs
 *
 * The vendored runtime is auto-extracted (scripts/extract-accounting-v52.mjs). Its live wiring was edited in place;
 * the Payables work is applied here instead, so a re-extraction can be patched again rather than silently losing it.
 * Each step names its anchor and the marker that shows it is already applied; a missed anchor fails the run.
 *
 *   1. scripts/accounting-v52-payables-live.inc.js is injected ahead of the v28 Payables page (refreshed on re-run)
 *   2. the Payables page renders ac52LiveApPage() in a live session
 *   3. the bill, purchase order and RFQ detail pages render ac52LiveApDetail()
 *   4. the v28 click dispatcher sends aplive-* actions to ac52LiveApClick()
 *   5. hydrate keeps the bank accounts a payment can be made from (window.__ac52ApBanks)
 *   6. AC52_LIVE_ACTION_KEYS includes invoice-create / cash-post / receipt-post
 *   7. Receivables New invoice / Record receipt open the live v8 modals
 *   8. Cash New receipt/payment/transfer open live v8 cash modal (not v14 toast-only batch)
 *   9. Receivables Create customer posts via customer-create
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const FILE = path.join(ROOT, "components", "accounting-v52-mock", "matanho-accounting-runtime.js")
const INC = path.join(ROOT, "scripts", "accounting-v52-payables-live.inc.js")

let s = fs.readFileSync(FILE, "utf8")
let applied = 0
let already = 0
let missed = 0

function step(label, anchor, replacement, marker) {
  if (s.includes(marker)) {
    already += 1
    console.log(`  skip (already)  ${label}`)
    return
  }
  const count = s.split(anchor).length - 1
  if (count !== 1) {
    missed += 1
    console.log(`  MISS            ${label} (${count} occurrences, expected 1)`)
    return
  }
  s = s.replace(anchor, () => replacement)
  applied += 1
  console.log(`  patch           ${label}`)
}

// 1. The live block, between markers so a re-run replaces it with the current include (LF only: the CRLF trap).
const BEGIN = "/* BEGIN_AC52_PAYABLES_LIVE */"
const END = "/* END_AC52_PAYABLES_LIVE */"
const block = `${BEGIN}\n${fs.readFileSync(INC, "utf8").replace(/\r\n/g, "\n").trim()}\n${END}\n`
if (s.includes(BEGIN) && s.includes(END)) {
  s = s.slice(0, s.indexOf(BEGIN)) + block + s.slice(s.indexOf(END) + END.length).replace(/^\n/, "")
  console.log("  refresh         live payables block")
} else {
  step("live payables block", "function apPage(){", `${block}function apPage(){`, BEGIN)
}

step(
  "payables page -> live records, queue and actions",
  "function apPage(){const t=V28.apTab,",
  "function apPage(){if(window.__AC52_LIVE__)return ac52LiveApPage();const t=V28.apTab,",
  "if(window.__AC52_LIVE__)return ac52LiveApPage();",
)
step(
  "bill, order and RFQ detail -> live",
  "if(type==='apbill'){",
  "if(window.__AC52_LIVE__&&(type==='apbill'||type==='appo'||type==='aprfq'))return ac52LiveApDetail(type,id);if(type==='apbill'){",
  "return ac52LiveApDetail(type,id);",
)
step(
  "v28 click -> live payables actions",
  "const a=el.dataset.v28,id=el.dataset.id;ev.preventDefault();ev.stopImmediatePropagation();",
  "const a=el.dataset.v28,id=el.dataset.id;ev.preventDefault();ev.stopImmediatePropagation();if(window.__AC52_LIVE__&&a.indexOf('aplive-')===0){ac52LiveApClick(a,id);return}",
  "ac52LiveApClick(a,id);return}",
)
step(
  "hydrate -> payment bank accounts",
  "const source = (payload && payload.data) || payload || {};",
  "const source = (payload && payload.data) || payload || {}; if (Array.isArray(source.apBanks)) window.__ac52ApBanks = source.apBanks;",
  "window.__ac52ApBanks = source.apBanks;",
)

// The prototype's own profile menu names its demo user ("Tariro Moyo") and is appended to <body>, outside the
// .accounting-v52-root its styles are scoped to. Unstyled, it made every page taller than the window: the page scrolled,
// the sidebar slid over the content (it took Payables' Pay bill click), and the demo name showed below the fold. The
// shared topbar carries the signed-in user's own menu, so a live session does not install it.
step(
  "profile menu -> not installed in a live session",
  "function installProfileMenu(){if(document.querySelector('#v5ProfileMenu'))return;",
  "function installProfileMenu(){if(window.__AC52_LIVE__){document.querySelector('#v5ProfileMenu')?.remove();return}if(document.querySelector('#v5ProfileMenu'))return;",
  "function installProfileMenu(){if(window.__AC52_LIVE__)",
)

step(
  "live action keys -> invoice / cash / receipt writes",
  "const AC52_LIVE_ACTION_KEYS=new Set(['coa-save']);",
  "const AC52_LIVE_ACTION_KEYS=new Set(['coa-save','invoice-create','cash-post','receipt-post']);",
  "'invoice-create','cash-post','receipt-post'",
)

step(
  "receivables New invoice -> live v8 modal",
  "if(a==='new-ar-invoice'){formDoc('invoice');return}",
  "if(a==='new-ar-invoice'){if(window.__AC52_LIVE__&&window.MatanhoAccountingV8?.openInvoiceModal){window.MatanhoAccountingV8.openInvoiceModal();return}formDoc('invoice');return}",
  "openInvoiceModal();return}formDoc('invoice')",
)

step(
  "cash New receipt/payment -> live v8 modal (not v14 batch toast)",
  "if(legacy){e.preventDefault();e.stopImmediatePropagation();openBatch(legacy.dataset.id||'receipt',legacy.dataset.v12==='cash-import');return}",
  "if(legacy){e.preventDefault();e.stopImmediatePropagation();if(window.__AC52_LIVE__&&window.MatanhoAccountingV8?.openCashModal){if(legacy.dataset.v12==='cash-import'){if(typeof toast==='function')toast('Import stays local','Cash batch import is not wired to the live cashbook yet.');return}window.MatanhoAccountingV8.openCashModal(legacy.dataset.id||'receipt');return}openBatch(legacy.dataset.id||'receipt',legacy.dataset.v12==='cash-import');return}",
  "openCashModal(legacy.dataset.id",
)

step(
  "receivables Create customer -> live form",
  "if(a==='ar-receipt'){if(window.__AC52_LIVE__&&window.MatanhoAccountingV8?.openReceiptModal){window.MatanhoAccountingV8.openReceiptModal(id);return}}",
  "if(a==='new-customer'){if(window.__AC52_LIVE__){modal('Create customer','Customer master used for invoices and receipts',`<div class=\"v28-form-grid\">${field('Legal / display name','<input class=\"v28-input\" id=\"ac52CustName\" placeholder=\"e.g. Horizon Mining Ltd\">')}${field('Email','<input class=\"v28-input\" id=\"ac52CustEmail\" type=\"email\" placeholder=\"accounts@example.com\">')}${field('Phone','<input class=\"v28-input\" id=\"ac52CustPhone\" placeholder=\"Optional\">')}${field('Tax / registration','<input class=\"v28-input\" id=\"ac52CustTax\" placeholder=\"Optional\">')}</div>`,'ac52-customer-create');return}}\n if(a==='ac52-customer-create'){const name=(document.querySelector('#ac52CustName')?.value||'').trim();if(!name){if(typeof toast==='function')toast('Name required','Enter the customer name.');return}window.dispatchEvent(new CustomEvent('matanho:before-action',{detail:{action:'customer-create',payload:{name,email:(document.querySelector('#ac52CustEmail')?.value||'').trim()||undefined,phone:(document.querySelector('#ac52CustPhone')?.value||'').trim()||undefined,taxNumber:(document.querySelector('#ac52CustTax')?.value||'').trim()||undefined},dataset:{},state:{}},cancelable:true}));document.querySelector('#v28Overlay')?.remove();return}\n if(a==='ar-receipt'){if(window.__AC52_LIVE__&&window.MatanhoAccountingV8?.openReceiptModal){window.MatanhoAccountingV8.openReceiptModal(id);return}}",
  "ac52-customer-create",
)

// Expand live action keys beyond invoice/cash/receipt (marker: expense-create).
step(
  "live action keys -> expense / stock / asset / recurring / recon",
  "const AC52_LIVE_ACTION_KEYS=new Set(['coa-save','invoice-create','cash-post','receipt-post']);",
  "const AC52_LIVE_ACTION_KEYS=new Set(['coa-save','invoice-create','cash-post','receipt-post','expense-create','stock-adjust','asset-create','recurring-run','recurring-run-due','recon-signoff']);",
  "'expense-create','stock-adjust'",
)

step(
  "hydrate -> expense claim lookups",
  "if (Array.isArray(source.claims) && typeof rootEl.__ac52HydrateClaims === 'function') {\n      rootEl.__ac52HydrateClaims(source.claims);\n    }",
  "if (Array.isArray(source.claims) && typeof rootEl.__ac52HydrateClaims === 'function') {\n      rootEl.__ac52HydrateClaims(source.claims);\n    }\n    if (source.expenseLookups) window.__ac52ExpenseLookups = source.expenseLookups;",
  "window.__ac52ExpenseLookups = source.expenseLookups",
)

step(
  "expenses New claim -> live form; card import blocked",
  "if(a==='action-modal'){modal('Finance action',id||'Controlled update',",
  "if(a==='action-modal'){if(window.__AC52_LIVE__&&id==='Expense claim'){const lookups=window.__ac52ExpenseLookups||{vendors:[],categories:[]};const vendors=lookups.vendors||[];const cats=lookups.categories||[];if(!vendors.length){if(typeof toast==='function')toast('No vendors','Create a vendor in Payables before recording an expense.');return}const today=new Date().toISOString().slice(0,10);const catOpts=cats.length?cats.map(c=>`<option value=\"${c.id}\" data-name=\"${String(c.name).replace(/\"/g,'&quot;')}\">${c.name}</option>`).join(''):['Travel and Accommodation','Operations','Office Equipment','Salaries and Wages','Branding and Marketing'].map(n=>`<option value=\"\" data-name=\"${n}\">${n}</option>`).join('');modal('New expense claim','Posts to live accounting expenses (vendor + category required)',`<div class=\"v34-filter-panel open\" style=\"grid-template-columns:repeat(2,minmax(0,1fr))\">${field('Vendor',`<select id=\"ac52ExpVendor\">${vendors.map(v=>`<option value=\"${v.id}\">${v.name}</option>`).join('')}</select>`)}${field('Category',`<select id=\"ac52ExpCategory\">${catOpts}</select>`)}${field('Date',`<input id=\"ac52ExpDate\" type=\"date\" value=\"${today}\">`)}${field('Amount',`<input id=\"ac52ExpAmount\" type=\"number\" step=\"0.01\" min=\"0\">`)}${field('Currency',`<select id=\"ac52ExpCurrency\"><option>USD</option><option>ZWG</option><option>ZAR</option></select>`)}<div style=\"grid-column:1/-1\">${field('Description / purpose',`<textarea id=\"ac52ExpDesc\" style=\"width:100%;min-height:70px;border:1px solid #c9d6e4;border-radius:9px;padding:9px\"></textarea>`)}</div></div>`,`${btn('Cancel','close')}${btn('Save expense','ac52-expense-create','primary')}`);return}if(window.__AC52_LIVE__&&id==='Corporate card import'){if(typeof toast==='function')toast('Not available','Corporate card import has no live backend endpoint yet.');return}modal('Finance action',id||'Controlled update',",
  "ac52-expense-create",
)

step(
  "expenses save expense -> live action",
  "if(a==='timesheet-approve-confirm'||a==='timesheet-return-confirm'){document.querySelector('#v34Overlay')?.remove();window.dispatchEvent(new CustomEvent('matanho:before-action',{detail:{action:a==='timesheet-approve-confirm'?'timesheet-approve':'timesheet-return',payload:{id},dataset:{},state:{}},cancelable:true}));return}",
  "if(a==='ac52-expense-create'){const vendorId=document.querySelector('#ac52ExpVendor')?.value;const catEl=document.querySelector('#ac52ExpCategory');const categoryId=catEl?.value||undefined;const category=catEl?.selectedOptions?.[0]?.dataset?.name||catEl?.selectedOptions?.[0]?.textContent||undefined;const amount=Number(document.querySelector('#ac52ExpAmount')?.value||0);const transactionDate=document.querySelector('#ac52ExpDate')?.value||new Date().toISOString().slice(0,10);const currency=document.querySelector('#ac52ExpCurrency')?.value||'USD';const description=(document.querySelector('#ac52ExpDesc')?.value||'').trim();if(!vendorId||!(amount>0)||!description){if(typeof toast==='function')toast('Incomplete claim','Vendor, amount and description are required.');return}document.querySelector('#v34Overlay')?.remove();window.dispatchEvent(new CustomEvent('matanho:before-action',{detail:{action:'expense-create',payload:{vendorId,categoryId,category,amount,currency,transactionDate,description},dataset:{},state:{}},cancelable:true}));return}\n if(a==='timesheet-approve-confirm'||a==='timesheet-return-confirm'){document.querySelector('#v34Overlay')?.remove();window.dispatchEvent(new CustomEvent('matanho:before-action',{detail:{action:a==='timesheet-approve-confirm'?'timesheet-approve':'timesheet-return',payload:{id},dataset:{},state:{}},cancelable:true}));return}",
  "action:'expense-create'",
)

step(
  "receivables quotations -> honest product gap",
  "if(a==='new-ar-invoice'){if(window.__AC52_LIVE__&&window.MatanhoAccountingV8?.openInvoiceModal){window.MatanhoAccountingV8.openInvoiceModal();return}formDoc('invoice');return} if(a==='new-ar-quote'){formDoc('quotation');return}",
  "if(a==='new-ar-invoice'){if(window.__AC52_LIVE__&&window.MatanhoAccountingV8?.openInvoiceModal){window.MatanhoAccountingV8.openInvoiceModal();return}formDoc('invoice');return} if(a==='new-ar-quote'){if(window.__AC52_LIVE__){if(typeof toast==='function')toast('Not available','Customer quotations are not persisted by the live accounting API yet.');return}formDoc('quotation');return}",
  "quotations are not persisted",
)

step(
  "recon sign-off / auto-match -> live cashbook session",
  "if(a==='recon-auto'){reconLines.forEach(x=>{if(x.status==='Suggested')x.status='Matched'});saveToast('Suggested matches were accepted into the reconciliation workbench.');return}",
  "if(a==='recon-auto'||a==='recon-submit'){if(window.__AC52_LIVE__){const bank=reconBanks.find(x=>x.id===V28.reconBank)||reconBanks[0];if(!bank){if(typeof toast==='function')toast('No bank','Select a cashbook bank first.');return}window.dispatchEvent(new CustomEvent('matanho:before-action',{detail:{action:'recon-signoff',payload:{bankId:bank.id,statementEndBalance:Number(bank.statement)||0,statementDate:new Date().toISOString().slice(0,10),reference:`REC-${bank.id}`},dataset:{},state:{}},cancelable:true}));return}reconLines.forEach(x=>{if(x.status==='Suggested')x.status='Matched'});saveToast('Suggested matches were accepted into the reconciliation workbench.');return}",
  "action:'recon-signoff'",
)

step(
  "inventory save movement -> live stock-adjust",
  "if(a==='save-inv'){saveInv(id);return}",
  "if(a==='save-inv'){if(window.__AC52_LIVE__){const sku=q('#v51InvSku')?.value;const item=inventory.find(x=>x.sku===sku||x.backendId===sku);const itemId=item?.backendId||item?.sku||sku;const rawQty=Number(q('#v51InvQty')?.value||0);if(!itemId||!rawQty){if(typeof toast==='function')toast('Incomplete','Select an item and enter a quantity.');return}const kind=id||'adjust';const quantity=kind==='issue'?-Math.abs(rawQty):kind==='adjust'||kind==='count'?rawQty:Math.abs(rawQty);q('#v51Layer')?.remove();window.dispatchEvent(new CustomEvent('matanho:before-action',{detail:{action:'stock-adjust',payload:{kind,itemId,quantity,reason:q('#v51InvNote')?.value||kind,reference:q('#v51InvRef')?.value,notes:q('#v51InvNote')?.value,unitCost:item?.unitCost},dataset:{},state:{}},cancelable:true}));return}saveInv(id);return}",
  "action:'stock-adjust'",
)

step(
  "inventory modal SKU options use backendId",
  "function invModal(kind){const names={receipt:'Receive stock',issue:'Issue stock',transfer:'Transfer stock',adjust:'Adjust stock',count:'Capture physical count'};const isTransfer=kind==='transfer';modal(names[kind]||'Inventory action','Update the inventory sub-ledger with source reference, dimensions and an auditable quantity movement.',`<div class=\"v51-form\">${field('SKU',select('v51InvSku',inventory.map(x=>x.sku),inventory[0].sku))}",
  "function invModal(kind){const names={receipt:'Receive stock',issue:'Issue stock',transfer:'Transfer stock',adjust:'Adjust stock',count:'Capture physical count'};const isTransfer=kind==='transfer';const invOpts=inventory.map(x=>({value:x.backendId||x.sku,label:`${x.sku} · ${x.item}`}));modal(names[kind]||'Inventory action','Update the inventory sub-ledger with source reference, dimensions and an auditable quantity movement.',`<div class=\"v51-form\">${field('SKU',`<select id=\"v51InvSku\" class=\"v51-input\">${invOpts.map(o=>`<option value=\"${e(o.value)}\">${e(o.label)}</option>`).join('')}</select>`)}",
  "x.backendId||x.sku",
)

step(
  "assets save -> live asset-create",
  "if(a==='save-asset'){saveAsset();return}",
  "if(a==='save-asset'){if(window.__AC52_LIVE__){const assetName=(q('#v51AssetDesc')?.value||'').trim();const cost=Number(q('#v51AssetCost')?.value||0);if(!assetName||!(cost>0)){if(typeof toast==='function')toast('Incomplete','Asset description and cost are required.');return}const lifeRaw=q('#v51AssetLife')?.value||'5 years';q('#v51Layer')?.remove();window.dispatchEvent(new CustomEvent('matanho:before-action',{detail:{action:'asset-create',payload:{assetName,cost,usefulLifeYears:lifeRaw,depreciationMethod:q('#v51AssetMethod')?.value,purchaseDate:q('#v51AssetDate')?.value,location:q('#v51AssetLocation')?.value,vendor:q('#v51AssetSupplier')?.value,description:assetName,assetAccountCode:q('#v51AssetGL')?.value,expenseAccountCode:q('#v51AssetDepGL')?.value},dataset:{},state:{}},cancelable:true}));return}saveAsset();return}",
  "action:'asset-create'",
)

step(
  "recurring run / run-due -> live templates",
  "if(a==='schedule-run-confirm'){const s=ST27.schedules.find(x=>x.id===id);if(s)runSchedule27(s);return}",
  "if(a==='schedule-run-confirm'){if(window.__AC52_LIVE__){const live=ac52LiveSchedules27().find(x=>x.id===id)||ST27.schedules.find(x=>x.id===id);closeOverlay27?.();window.dispatchEvent(new CustomEvent('matanho:before-action',{detail:{action:'recurring-run',payload:{id:live?.id||id},dataset:{},state:{}},cancelable:true}));return}const s=ST27.schedules.find(x=>x.id===id);if(s)runSchedule27(s);return}",
  "action:'recurring-run'",
)

step(
  "recurring run-due confirm -> live",
  "if(a==='run-due-confirm'){",
  "if(a==='run-due-confirm'){if(window.__AC52_LIVE__){closeOverlay27?.();window.dispatchEvent(new CustomEvent('matanho:before-action',{detail:{action:'recurring-run-due',payload:{asOf:new Date().toISOString().slice(0,10)},dataset:{},state:{}},cancelable:true}));return}",
  "action:'recurring-run-due'",
)

if (!s.includes("function ac52LiveApClick(")) {
  missed += 1
  console.log("  MISS            live block did not land (ac52LiveApClick not found)")
}

if (!s.includes("openCashModal:")) {
  missed += 1
  console.log("  MISS            MatanhoAccountingV8.openCashModal not found (hand-edit required)")
}

console.log(`\n${applied} applied, ${already} already in place, ${missed} missed`)
if (missed) {
  console.log("One or more patches did not find their anchor. The runtime was NOT written.")
  process.exit(1)
}
fs.writeFileSync(FILE, s)
console.log(`Wrote ${path.relative(ROOT, FILE)}`)
