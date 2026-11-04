/** Synthetic local API CRUD checks; never run against a nonlocal URL. */
const base = process.env.RECEIVABLES_API_BASE || 'http://127.0.0.1:3009/api'
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api$/.test(base)) throw new Error('Local API only')
const email = process.env.ACCOUNTING_TEST_EMAIL, password = process.env.ACCOUNTING_TEST_PASSWORD
if (!email || !password) throw new Error('Set local synthetic test credentials')
const login = await (await fetch(`${base}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) })).json()
if (!login.token) throw new Error('Synthetic login failed')
const headers = { Authorization:`Bearer ${login.token}`, 'Content-Type':'application/json' }
const call = async (method, path, body) => { const response = await fetch(`${base}${path}`, { method, headers, body:body === undefined ? undefined : JSON.stringify(body) }); return { status:response.status, json:await response.json().catch(() => ({})) } }
const data = r => r.json?.data
const tag = `UATARCRUD${Date.now()}`
const result = {}
const currencies = data(await call('GET','/accounting/currencies'))
const usd = currencies.find(x => x.code === 'USD')
const customer = await call('POST','/accounting/customers',{name:`${tag} Customer`,email:`${tag.toLowerCase()}@example.test`,paymentTerms:'30'})
if (!data(customer)?.id) throw new Error('Could not create synthetic customer')
const customerId = data(customer).id
let invoiceId = null, creditId = null
try {
  const updated = await call('PUT',`/accounting/customers/${customerId}`,{name:`${tag} Customer Updated`,paymentTerms:'14'})
  result.customerUpdate = updated.status < 300 && data(updated)?.name?.endsWith('Updated')
  const invoice = await call('POST','/accounting/invoices',{customerId,currencyId:usd.id,invoiceDate:'2026-10-01',description:tag,items:[{description:'Service',quantity:1,unitPrice:25}],isTaxable:false})
  invoiceId = data(invoice)?.id
  result.invoiceCreateDraft = invoice.status < 300 && data(invoice)?.status === 'DRAFT'
  if (invoiceId) {
    const edited = await call('PUT',`/accounting/invoices/${invoiceId}`,{description:`${tag} edited`})
    result.invoiceUpdate = edited.status < 300
    const deleted = await call('DELETE',`/accounting/invoices/${invoiceId}`)
    result.invoiceDelete = deleted.status < 300
    invoiceId = null
  }
  const sent = data(await call('GET','/accounting/invoices?status=SENT&limit=10'))?.invoices?.find(x => Number(x.outstandingAmount) > 0)
  if (sent) {
    const credit = await call('POST','/accounting/credit-notes',{invoiceId:sent.id,amount:1,vatAmount:0,totalAmount:1,reason:tag})
    creditId = data(credit)?.id
    result.creditCreateDraft = credit.status < 300 && data(credit)?.status === 'DRAFT'
    if (creditId) { result.creditDeleteDraft = (await call('DELETE',`/accounting/credit-notes/${creditId}`)).status < 300; creditId = null }
  } else result.creditCreateDraft = 'no outstanding sent invoice fixture'
} finally {
  if (creditId) await call('DELETE',`/accounting/credit-notes/${creditId}`)
  if (invoiceId) await call('DELETE',`/accounting/invoices/${invoiceId}`)
  result.customerDelete = (await call('DELETE',`/accounting/customers/${customerId}`)).status < 300
}
console.log(JSON.stringify(result,null,2))
if (Object.values(result).some(x => x === false)) process.exitCode = 1
