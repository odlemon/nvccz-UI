# Connecting Procurement to the client's SmartStream — discovery notes

**Status:** early discovery. The client has said they want Procurement connected to "their SmartStream"
but hasn't yet supplied version, hosting, or which records need to move. This doc captures what's
actually true about the product (verified against Infor's own documentation, not marketing copy), the
realistic integration options for the shape of system it turns out to be, and — most useful right now —
a discovery checklist to take back to the client's IT/finance team before any integration design is
locked in.

---

## 1. What SmartStream is (verified, not assumed)

There are two unrelated products called "SmartStream." Only one of them is accounting software:

| | SmartStream Technologies (`smart.stream`) | **Infor FMS SmartStream** ← this is almost certainly the one |
|---|---|---|
| What it does | Bank/capital-markets transaction reconciliation, cash & liquidity matching | General ledger, Payables, Receivables, Purchasing, Fixed Assets, Projects, Budget/Funds Control |
| Era | Modern SaaS, AI-driven | Originally built by **Geac Computer Systems**, absorbed into Infor. Documentation on file dates from 2000–2007 (SmartStream 6.0, SmartStream Web Portal 1.5, SmartStream Web Ledger 2.0) |
| Relevance here | Not accounting software — flagging only so it isn't confused with the real target | The client's actual AP/GL system, per their own description |

The client's own description — **"a desktop app, might require an internal computer to access it"** —
matches Infor FMS SmartStream exactly. It's a classic Windows client-server application: a shared
back-end database server, with SmartStream client software installed on individual PCs (installed at
`c:\geac\...` in Infor's own docs — the Geac lineage is still visible in the install path). It is *not* a
web app or cloud service, and nothing about it is reachable from the public internet by default.

## 2. Does it have an API? (checked against the actual Infor documentation)

**No.** Pulled Infor's own *SmartStream Web Portal Implementation Guide* directly (not a summary) —
its entire idea of "integration" is:

- **"Multiple Database Server Connectivity"** — the Portal can point at more than one SmartStream
  database, but that's SmartStream talking to *its own* database, not to an external system.
- Custom "menu links" are literally static HTML files copied into a subdirectory on the web server and
  wired into a menu — not an API, not a data feed.
- No REST, SOAP, OData, message queue, or webhook is mentioned anywhere in the product's own
  documentation.

Infor's modern integration layer — **ION / Infor OS API Gateway** (real REST/SOAP/OData support) —
exists for Infor's current CloudSuite-era products (LN, M3, SunSystems, etc.). There's no evidence it
has a SmartStream connector, and `infor.com/products/smartstream` no longer resolves — consistent with
SmartStream being in Infor's legacy/sustaining-support tier rather than something still being built out.

**Practical conclusion:** don't design around an API appearing. Plan for one of the classic
legacy-ERP integration patterns below.

## 3. Realistic integration options, ranked by how likely they are to actually work

| # | Approach | How it would work | Needs from the client |
|---|---|---|---|
| 1 | **File-based interface (most likely path)** | Procurement exports approved invoices / POs / GL journals as CSV or a fixed-width file on a schedule (or right after approval); SmartStream's own **import/interface programs** (AP invoice import, GL journal import — standard on ERPs of this era) pick the file up from a folder or SFTP drop | The exact import file layout SmartStream expects (their AP/GL module ships one), and who/what runs the import on their side — a person clicking Import, or a scheduled job |
| 2 | **Direct database-level integration** | A scheduled job in the `nvccz` backend reads/writes SmartStream's underlying SQL Server/Oracle tables directly | Network access from our servers to their DB server (their answer suggests this is unlikely — "internal computer" implies a LAN-only setup), DB credentials, and the actual table schema (SmartStream's internal schema isn't public — would need their DBA or Infor support) |
| 3 | **Middleware / broker service** | If the client's wider Infor estate includes ION, route through it instead of talking to SmartStream directly | Confirmation they actually license ION, and that it has a SmartStream connector — not guaranteed even if they have ION for other Infor products |
| 4 | **Manual bridge (fallback, not really "integration")** | Procurement generates an export (spreadsheet/PDF) a person re-keys or imports by hand into the SmartStream desktop client | Nothing technical — just acceptable as an interim step while a real interface is scoped |
| 5 | **RPA / UI automation (last resort)** | A bot drives the SmartStream desktop client's own screens to enter data, since there's no other way in | Only worth considering if 1–3 are genuinely impossible — fragile, breaks on any SmartStream UI update, and needs a machine with the SmartStream client installed and logged in |

Given "desktop app, internal computer" is the only fact confirmed so far, **option 1 (file-based
interface) is the best bet** — it's how virtually every non-API legacy ERP of this generation is
actually integrated in production, it doesn't require opening network access into the client's internal
LAN, and it degrades gracefully (a human can always look at the file if automation breaks).

## 4. Discovery checklist — take this to the client's IT/finance team

Everything below turns directly into a design decision once answered:

**About the SmartStream install itself**
- [ ] Version/release (e.g., "SmartStream 6.0", "SmartStream 7.0.01") — determines which import
      layouts and Infor documentation apply
- [ ] Is there a shared database server behind the desktop clients, or is each installation
      standalone? If shared: what database engine (SQL Server / Oracle), and is it reachable from
      outside the desktop LAN at all (even via VPN)?
- [ ] Who administers it — an internal IT person, or an external Infor partner/reseller?

**About existing interfaces (reuse beats reinvent)**
- [ ] Does anything else already feed SmartStream today (payroll, a bank statement import, a POS,
      a spreadsheet upload)? If yes — what file format and how often? Copying a working pattern is
      far less risky than inventing a new one.
- [ ] Does SmartStream Payables have a documented "AP invoice import" or "batch invoice interface"
      already licensed/configured? (Standard on ERPs of this era, but sometimes it's an add-on
      module that isn't turned on.)

**About what actually needs to flow**
- [ ] Direction: does Procurement only need to *send* data to SmartStream (e.g., approved invoices
      for payment), or does something need to come *back* (e.g., payment confirmation, vendor
      master updates)?
- [ ] Which records, specifically — pick from: approved invoices → AP, GRN/expense journals → GL,
      vendor master (bank details, tax clearance) either direction, payment status back to
      Procurement once SmartStream pays
- [ ] Frequency: does this need to be near-real-time (e.g., the moment Finance approves an invoice
      in Procurement), or is a nightly/on-demand batch acceptable? Batch is far simpler to build and
      is how this class of system is almost always integrated in practice.

## 5. What NOT to build yet

- No export job, file format, or scheduled sync code should be written until at least the "existing
  interfaces" and "what needs to flow" sections above have real answers — guessing the file layout
  wastes effort against a system whose actual import format we haven't seen.
- Don't assume network reachability to a SmartStream database server; the client's own description
  ("internal computer") suggests it isn't reachable without VPN access at minimum, which itself would
  need to be arranged.
