"""Supplier invoices for testing how the LLM reads invoices, built against the dev demo purchase orders.

    python scripts/_uat/fixtures/invoices/make_invoices.py

Writes text PDFs in four real-world layouts, a scanned (image-only) PDF, a phone photo (PNG and JPG) and truth.json:
what a correct reading of each file must return. The suppliers are the fictitious ones in the dev demo dataset.
"""
import json
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageEnhance, ImageFilter

HERE = Path(__file__).resolve().parent
BILL_TO = ["Matanho Investment Management (Private) Limited", "Procurement Department", "Harare, Zimbabwe"]


def amount(v):
    return f"{v:,.2f}"


def totals(lines, vat_rate):
    subtotal = round(sum(q * p for _, q, p in lines), 2)
    vat = round(subtotal * vat_rate / 100, 2)
    return subtotal, vat, round(subtotal + vat, 2)


INVOICES = [
    {
        "file": "msasa-boardroom.pdf",
        "layout": "classic",
        "po": "PO_20260908_0004",
        "supplier": "Msasa Contract Furniture (Pvt) Ltd",
        "address": ["41 Beverley Road, Msasa", "Harare, Zimbabwe", "VAT Reg: 10019882   BP: 198802"],
        "invoice_number": "MCF-INV-10482",
        "date": "2026-09-13",
        "date_text": "13 September 2026",
        "due_text": "13 October 2026",
        "currency": "USD",
        "lines": [("Boardroom table, 12-seater, oak veneer", 1, 2750.00), ("Boardroom chair, mesh back, chrome base", 12, 295.00)],
        "vat_rate": 15.5,
    },
    {
        "file": "sable-hvac-quarter.pdf",
        "layout": "service",
        "po": "PO_20260903_0003",
        "supplier": "Sable Facilities Management (Pvt) Ltd",
        "address": ["22 Lytton Road, Workington", "Harare", "VAT No. 10020914"],
        "invoice_number": "SFM/2026/0917",
        "date": "2026-09-12",
        "date_text": "12/09/2026",
        "due_text": "12/10/2026",
        "currency": "USD",
        "lines": [("Generator and HVAC preventive maintenance - quarter 1 visit (September 2026)", 1, 2600.00)],
        "vat_rate": 15.5,
    },
    {
        "file": "jacaranda-toner-variance.pdf",
        "layout": "amount-first",
        "po": "PO_20260830_0002",
        "supplier": "Jacaranda Office Supplies (Pvt) Ltd",
        "address": ["12 Coventry Road, Workington, Harare", "Tel +263 242 700 101", "VAT 10023418"],
        "invoice_number": "JOS-24117",
        "date": "2026-09-11",
        "date_text": "11-Sep-2026",
        "due_text": "11-Oct-2026",
        "currency": "USD",
        "lines": [("Toner cartridge for HP LaserJet M404", 12, 89.00), ("Lever arch file, A4", 60, 3.20)],
        "vat_rate": 15.5,
    },
    {
        "file": "kopje-multipage.pdf",
        "layout": "multipage",
        "po": None,
        "supplier": "Kopje Office Furniture (Pvt) Ltd",
        "address": ["3 Paisley Road, Southerton", "Harare", "VAT: 10027455"],
        "invoice_number": "KOF 3391",
        "date": "2026-09-10",
        "date_text": "10 Sep 2026",
        "due_text": "10 Oct 2026",
        "currency": "USD",
        "lines": [
            (f"{name} - {colour}", qty, price)
            for (name, qty, price), colour in zip(
                [
                    ("Visitor chair, fabric", 4, 85.00), ("Task chair, mesh", 6, 145.00), ("Filing cabinet, 4-drawer", 3, 210.00),
                    ("Desk pedestal, 3-drawer", 5, 120.00), ("Bookcase, 5-shelf", 2, 165.00), ("Meeting table, round 1.2m", 1, 380.00),
                    ("Coat stand", 3, 38.50), ("Whiteboard, 1.8m x 1.2m", 2, 142.00), ("Notice board, cork", 4, 46.00),
                    ("Monitor arm, single", 8, 54.00), ("Footrest, adjustable", 6, 29.00), ("Desk lamp, LED", 10, 32.50),
                    ("Waste bin, steel", 12, 14.00), ("Cable tray, under-desk", 10, 18.00), ("Reception sofa, 2-seater", 1, 640.00),
                    ("Side table", 2, 95.00), ("Storage locker, 6-door", 2, 310.00), ("Mobile pedestal", 4, 115.00),
                    ("Standing desk converter", 3, 225.00), ("Acoustic screen, 1.6m", 6, 175.00), ("Lectern", 1, 260.00),
                    ("Stacking chair", 20, 42.00), ("Folding table, 1.8m", 4, 88.00), ("Magazine rack", 2, 36.00),
                    ("Key cabinet, 50 hooks", 1, 72.00), ("Shredder, cross-cut", 2, 189.00), ("Safe, fire-rated", 1, 520.00),
                    ("Printer stand", 3, 64.00), ("Umbrella stand", 2, 27.50), ("Wall clock", 6, 19.50),
                ],
                ["black", "grey", "charcoal", "walnut", "oak", "white"] * 5,
            )
        ],
        "vat_rate": 15.5,
    },
]


def text(page, x, y, s, size=10, bold=False, right=False, colour=(0, 0, 0)):
    font = "hebo" if bold else "helv"
    if right:
        x -= fitz.get_text_length(s, fontname=font, fontsize=size)
    page.insert_text((x, y), s, fontsize=size, fontname=font, color=colour)


def header(page, inv, title="TAX INVOICE"):
    text(page, 50, 60, inv["supplier"], 15, bold=True)
    for i, line in enumerate(inv["address"]):
        text(page, 50, 78 + 13 * i, line, 9, colour=(0.3, 0.3, 0.3))
    text(page, 545, 60, title, 17, bold=True, right=True, colour=(0.1, 0.25, 0.5))


def bill_to(page, y):
    text(page, 50, y, "Bill to", 9, bold=True)
    for i, line in enumerate(BILL_TO):
        text(page, 50, y + 13 * (i + 1), line, 9)


def totals_block(page, inv, y, currency_label):
    subtotal, vat, total = totals(inv["lines"], inv["vat_rate"])
    rows = [("Subtotal", subtotal), (f"VAT @ {inv['vat_rate']:g}%", vat), (f"Total due ({currency_label})", total)]
    for i, (label, v) in enumerate(rows):
        bold = i == len(rows) - 1
        text(page, 400, y + 16 * i, label, 10, bold=bold)
        text(page, 545, y + 16 * i, amount(v), 10, bold=bold, right=True)
    return y + 16 * len(rows)


def classic(doc, inv):
    page = doc.new_page(width=595, height=842)
    header(page, inv)
    meta = [("Invoice number", inv["invoice_number"]), ("Invoice date", inv["date_text"]), ("Due date", inv["due_text"]), ("Your order", inv["po"]), ("Currency", inv["currency"])]
    for i, (k, v) in enumerate(meta):
        text(page, 360, 100 + 14 * i, f"{k}:", 9, bold=True)
        text(page, 450, 100 + 14 * i, v, 9)
    bill_to(page, 190)
    y = 270
    page.draw_rect(fitz.Rect(45, y - 14, 550, y + 6), color=None, fill=(0.9, 0.93, 0.97))
    text(page, 50, y, "Description", 9, bold=True)
    text(page, 360, y, "Qty", 9, bold=True, right=True)
    text(page, 450, y, "Unit price", 9, bold=True, right=True)
    text(page, 545, y, "Amount", 9, bold=True, right=True)
    for name, qty, price in inv["lines"]:
        y += 20
        text(page, 50, y, name, 9)
        text(page, 360, y, f"{qty:g}", 9, right=True)
        text(page, 450, y, amount(price), 9, right=True)
        text(page, 545, y, amount(qty * price), 9, right=True)
    page.draw_line((45, y + 10), (550, y + 10), color=(0.7, 0.7, 0.7))
    end = totals_block(page, inv, y + 30, inv["currency"])
    text(page, 50, end + 40, "Banking: CBZ Bank, Kurima House branch, account 01123456789012. Payment within 30 days.", 8, colour=(0.35, 0.35, 0.35))


def service(doc, inv):
    page = doc.new_page(width=595, height=842)
    header(page, inv, title="INVOICE")
    text(page, 50, 150, f"Invoice No: {inv['invoice_number']}", 10, bold=True)
    text(page, 50, 165, f"Date: {inv['date_text']}", 10)
    text(page, 50, 180, f"Payment due: {inv['due_text']}", 10)
    text(page, 50, 195, f"Purchase order: {inv['po']}", 10)
    bill_to(page, 225)
    y = 310
    text(page, 50, y, "Dear Sir/Madam,", 10)
    text(page, 50, y + 16, "We invoice you for the following services rendered under the maintenance agreement:", 10)
    y += 50
    text(page, 50, y, "Service", 9, bold=True)
    text(page, 545, y, f"Amount {inv['currency']}", 9, bold=True, right=True)
    for name, qty, price in inv["lines"]:
        y += 20
        text(page, 50, y, name, 9)
        text(page, 545, y, amount(qty * price), 9, right=True)
    totals_block(page, inv, y + 30, inv["currency"])
    text(page, 50, y + 120, "Yours faithfully,", 10)
    text(page, 50, y + 150, "Accounts Department", 10, bold=True)


def amount_first(doc, inv):
    page = doc.new_page(width=595, height=842)
    header(page, inv, title="Tax Invoice")
    text(page, 360, 110, f"No. {inv['invoice_number']}", 11, bold=True)
    text(page, 360, 126, f"Dated {inv['date_text']}", 10)
    text(page, 360, 142, f"Order ref {inv['po']}", 10)
    text(page, 360, 158, "Terms: 30 days", 10)
    bill_to(page, 190)
    y = 280
    text(page, 50, y, "US$ Amount", 9, bold=True)
    text(page, 130, y, "Unit", 9, bold=True)
    text(page, 190, y, "Qty", 9, bold=True)
    text(page, 240, y, "Item", 9, bold=True)
    for name, qty, price in inv["lines"]:
        y += 18
        text(page, 50, y, amount(qty * price), 9)
        text(page, 130, y, amount(price), 9)
        text(page, 190, y, f"{qty:g}", 9)
        text(page, 240, y, name, 9)
    totals_block(page, inv, y + 34, "US$")


def multipage(doc, inv):
    per_page = 18
    chunks = [inv["lines"][i:i + per_page] for i in range(0, len(inv["lines"]), per_page)]
    for n, chunk in enumerate(chunks):
        page = doc.new_page(width=595, height=842)
        header(page, inv)
        text(page, 360, 110, f"Invoice {inv['invoice_number']}", 10, bold=True)
        text(page, 360, 125, f"Date {inv['date_text']}   Page {n + 1} of {len(chunks)}", 9)
        if n == 0:
            bill_to(page, 160)
        y = 250 if n == 0 else 150
        text(page, 50, y, "Item", 9, bold=True)
        text(page, 380, y, "Qty", 9, bold=True, right=True)
        text(page, 460, y, "Price", 9, bold=True, right=True)
        text(page, 545, y, "Total", 9, bold=True, right=True)
        for name, qty, price in chunk:
            y += 18
            text(page, 50, y, name, 9)
            text(page, 380, y, f"{qty:g}", 9, right=True)
            text(page, 460, y, amount(price), 9, right=True)
            text(page, 545, y, amount(qty * price), 9, right=True)
        if n < len(chunks) - 1:
            text(page, 545, y + 24, "continued overleaf", 8, right=True, colour=(0.4, 0.4, 0.4))
        else:
            totals_block(page, inv, y + 30, inv["currency"])


LAYOUTS = {"classic": classic, "service": service, "amount-first": amount_first, "multipage": multipage}


def truth_of(inv):
    subtotal, vat, total = totals(inv["lines"], inv["vat_rate"])
    return {
        "supplier": inv["supplier"],
        "invoiceNumber": inv["invoice_number"],
        "invoiceDate": inv["date"],
        "currency": inv["currency"],
        "purchaseOrder": inv["po"],
        "lines": [{"description": n, "quantity": q, "unitPrice": p, "lineTotal": round(q * p, 2)} for n, q, p in inv["lines"]],
        "subtotal": subtotal,
        "taxAmount": vat,
        "total": total,
    }


def rasterise(pdf_path, dpi):
    doc = fitz.open(pdf_path)
    images = []
    for page in doc:
        pix = page.get_pixmap(dpi=dpi)
        images.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
    return images


def main():
    truth = {}
    for inv in INVOICES:
        doc = fitz.open()
        LAYOUTS[inv["layout"]](doc, inv)
        path = HERE / inv["file"]
        doc.save(path)
        truth[inv["file"]] = {**truth_of(inv), "kind": "text PDF", "layout": inv["layout"]}

    # A scanned copy: the classic invoice as an image-only PDF (no text layer), slightly skewed and greyed.
    scan = rasterise(HERE / "msasa-boardroom.pdf", 150)[0].convert("L").rotate(0.6, fillcolor=255, expand=False)
    scan = ImageEnhance.Contrast(scan).enhance(0.85).filter(ImageFilter.GaussianBlur(0.5))
    scanned = fitz.open()
    buf = HERE / "_scan.png"
    scan.save(buf)
    page = scanned.new_page(width=595, height=842)
    page.insert_image(page.rect, filename=str(buf))
    scanned.save(HERE / "msasa-boardroom-scanned.pdf")
    buf.unlink()
    truth["msasa-boardroom-scanned.pdf"] = {**truth["msasa-boardroom.pdf"], "kind": "scanned PDF (no text layer)"}

    # A phone photo of the variance invoice: rotated, warm-tinted, softened, on a desk-coloured border.
    photo = rasterise(HERE / "jacaranda-toner-variance.pdf", 110)[0].rotate(2.2, fillcolor=(214, 196, 170), expand=True)
    photo = ImageEnhance.Color(photo).enhance(0.8)
    photo = Image.blend(photo, Image.new("RGB", photo.size, (255, 236, 205)), 0.08).filter(ImageFilter.GaussianBlur(0.7))
    photo.save(HERE / "jacaranda-photo.png")
    photo.save(HERE / "jacaranda-photo.jpg", quality=82)
    for name in ("jacaranda-photo.png", "jacaranda-photo.jpg"):
        truth[name] = {**truth["jacaranda-toner-variance.pdf"], "kind": "phone photo"}

    (HERE / "truth.json").write_text(json.dumps(truth, indent=2), encoding="utf-8")
    for name, t in truth.items():
        print(f"{name:34} {t['kind']:28} {len(t['lines']):2} lines  total {t['currency']} {amount(t['total'])}")


if __name__ == "__main__":
    main()
