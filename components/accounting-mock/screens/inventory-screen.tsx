"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Boxes,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Scale,
  Settings,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcCardHeader,
  AcField,
  AcScreenHeader,
  AcSearchInput,
  AcSelectInput,
  AcStatusPill,
  AcTabs,
} from "@/components/accounting-mock/primitives"
import {
  acInvAlerts,
  acInvCostLayers,
  acInvDetail,
  acInvFilters,
  acInvKpis,
  acInvMovements,
  acInvPagination,
  acInvRows,
  acInvValuation,
  type AcInvKpi,
  type AcInvRow,
} from "@/lib/accounting-mock/fixtures-inventory"
import { cn } from "@/lib/utils"

function KpiIcon({ kpi }: { kpi: AcInvKpi }) {
  const cls = "h-3.5 w-3.5"
  const bg =
    kpi.tone === "exception"
      ? "bg-[#FEE2E2] text-[#DC2626]"
      : kpi.tone === "pending"
        ? "bg-[#FEF3C7] text-[#B45309]"
        : "bg-[#DBEAFE] text-[#2563EB]"
  const icon =
    kpi.icon === "box" ? (
      <Boxes className={cls} />
    ) : kpi.icon === "tag" ? (
      <Tag className={cls} />
    ) : kpi.icon === "alert" ? (
      <AlertTriangle className={cls} />
    ) : kpi.icon === "clock" ? (
      <Clock className={cls} />
    ) : (
      <Scale className={cls} />
    )
  return <span className={cn("h-8 w-8 rounded-full inline-flex items-center justify-center shrink-0", bg)}>{icon}</span>
}

export function InventoryScreen() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("Overview")
  const [selected, setSelected] = useState("NET-SW-024")
  const [panelOpen, setPanelOpen] = useState(true)
  const [page, setPage] = useState(1)

  const openRow = (row: AcInvRow) => {
    setSelected(row.sku)
    setPanelOpen(true)
  }

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <AcScreenHeader
        title="Inventory Valuation & Controls"
        actions={
          <>
            <AcButton variant="cobaltOutline" className="h-9 px-4" onClick={() => toast("Stock adjustment")}>
              <SlidersHorizontal className="h-3.5 w-3.5" /> Stock adjustment
            </AcButton>
            <AcButton className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4" onClick={() => toast("Run valuation")}>
              <Play className="h-3.5 w-3.5" /> Run valuation
            </AcButton>
          </>
        }
      />

      <AcCard className="p-3">
        <div className="flex flex-wrap items-end gap-3">
          <AcField label="Warehouse" className="w-[150px]">
            <AcSelectInput value={acInvFilters.warehouse} options={["Harare Main", "Bulawayo Branch"]} />
          </AcField>
          <AcField label="Valuation date" className="w-[150px]">
            <AcSelectInput
              value={acInvFilters.valuationDate}
              options={["31 Jul 2026", "30 Jun 2026"]}
              icon={<Calendar className="h-3.5 w-3.5" />}
            />
          </AcField>
          <AcField label="Valuation method" className="w-[170px]">
            <AcSelectInput value={acInvFilters.valuationMethod} options={["Weighted Average", "FIFO"]} />
          </AcField>
        </div>
      </AcCard>

      <AcCard>
        <div className="flex flex-wrap items-stretch divide-x divide-[#EEF1F5]">
          {acInvKpis.map((k) => (
            <div key={k.id} className="flex-1 min-w-[140px] px-4 py-3 flex items-center gap-3">
              <KpiIcon kpi={k} />
              <div>
                <p className="text-[10px] text-[#6B7280]">{k.label}</p>
                <p
                  className={cn(
                    "text-[18px] font-bold tracking-tight leading-none mt-0.5 tabular-nums",
                    k.tone === "exception" ? "text-[#DC2626]" : k.tone === "pending" ? "text-[#F59E0B]" : "text-[#0B1739]"
                  )}
                >
                  {k.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </AcCard>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <AcCard className="flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#EEF1F5]">
            <AcSearchInput value={search} onChange={setSearch} placeholder="Search inventory…" className="flex-1 min-w-[180px]" />
            <AcButton variant="outline" onClick={() => toast("Filters")}>
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B7280]" /> Filters
            </AcButton>
            <AcButton variant="outline" onClick={() => toast("Export")}>
              Export <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
            </AcButton>
            <button
              type="button"
              onClick={() => toast("Table settings")}
              aria-label="Table settings"
              className="h-8 w-8 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#6B7280] border-b border-[#EEF1F5] bg-[#F9FAFB]">
                  <th className="px-3 py-2.5 w-8">
                    <input type="checkbox" className="rounded border-[#D1D5DB]" aria-label="Select all" />
                  </th>
                  <th className="px-3 py-2.5 text-left font-normal">SKU</th>
                  <th className="px-3 py-2.5 text-left font-normal">Item</th>
                  <th className="px-3 py-2.5 text-left font-normal">Category</th>
                  <th className="px-3 py-2.5 text-left font-normal">Location</th>
                  <th className="px-3 py-2.5 text-right font-normal">On hand</th>
                  <th className="px-3 py-2.5 text-right font-normal">Reserved</th>
                  <th className="px-3 py-2.5 text-right font-normal">Available</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Unit cost (USD)</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Stock value (USD)</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Last movement</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Control state</th>
                </tr>
              </thead>
              <tbody>
                {acInvRows.map((r) => {
                  const isSelected = selected === r.sku
                  return (
                    <tr
                      key={r.sku}
                      onClick={() => openRow(r)}
                      className={cn(
                        "border-b border-[#EEF1F5] cursor-pointer",
                        isSelected ? "bg-[#EFF6FF]" : "hover:bg-[#F9FBFE]"
                      )}
                    >
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelected(r.sku)}
                          className="rounded border-[#D1D5DB]"
                          aria-label={`Select ${r.sku}`}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.sku}</td>
                      <td className="px-3 py-2.5 text-[#2563EB] font-medium whitespace-nowrap">{r.item}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.category}</td>
                      <td className="px-3 py-2.5 text-[#2563EB] whitespace-nowrap">{r.location}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.onHand}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.reserved}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.available}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.unitCost}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.stockValue}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.lastMovement}</td>
                      <td className="px-3 py-2.5">
                        <AcStatusPill label={r.controlState} tone="posted" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-[#EEF1F5]">
            <span className="text-[10px] text-[#9CA3AF]">{acInvPagination.showing}</span>
            <div className="flex items-center gap-3">
              <AcSelectInput value="10 per page" options={["10 per page", "25 per page"]} className="w-[110px]" />
              <div className="flex items-center gap-1">
                <button type="button" className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#9CA3AF]" aria-label="Previous">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {acInvPagination.pages.map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-[#9CA3AF]">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(Number(p))}
                      className={cn(
                        "h-7 min-w-[28px] px-1.5 rounded-md border text-[11px] font-medium",
                        page === Number(p)
                          ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                          : "border-[#E5E7EB] text-[#374151] hover:bg-[#F5F8FC]"
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
                <button type="button" className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#374151]" aria-label="Next">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </AcCard>

        {panelOpen && (
          <AcCard className="w-full xl:w-[320px] shrink-0 overflow-hidden">
            <AcCardHeader
              title={`${acInvDetail.sku} · ${acInvDetail.item}`}
              action={
                <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close panel" className="text-[#9CA3AF] hover:text-[#0B1739]">
                  <X className="h-4 w-4" />
                </button>
              }
            />
            <div className="px-4 pt-2">
              <AcTabs tabs={["Overview", "Movements", "Batches / Serial", "Costs"]} active={tab} onChange={setTab} />
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5] grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">Category</span>
                <span className="font-semibold text-[#0B1739] text-right">{acInvDetail.category}</span>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">Unit cost (USD)</span>
                <span className="font-semibold text-[#0B1739] tabular-nums">{acInvDetail.unitCost}</span>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">Location</span>
                <span className="font-semibold text-[#2563EB] text-right">{acInvDetail.location}</span>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">Stock value (USD)</span>
                <span className="font-semibold text-[#0B1739] tabular-nums">{acInvDetail.stockValue}</span>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">On hand</span>
                <span className="font-semibold text-[#0B1739]">{acInvDetail.onHand}</span>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">Last movement</span>
                <span className="font-semibold text-[#0B1739]">{acInvDetail.lastMovement}</span>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">Reserved</span>
                <span className="font-semibold text-[#0B1739]">{acInvDetail.reserved}</span>
              </div>
              <div className="flex justify-between gap-2 py-1 items-center">
                <span className="text-[#6B7280]">Control state</span>
                <AcStatusPill label={acInvDetail.controlState} tone="posted" />
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">Available</span>
                <span className="font-semibold text-[#0B1739]">{acInvDetail.available}</span>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">Linked PO</span>
                <button type="button" className="font-semibold text-[#2563EB] hover:underline" onClick={() => toast(acInvDetail.linkedPo)}>
                  {acInvDetail.linkedPo}
                </button>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">Reorder level</span>
                <span className="font-semibold text-[#0B1739]">{acInvDetail.reorderLevel}</span>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">GL account</span>
                <button type="button" className="font-semibold text-[#2563EB] hover:underline" onClick={() => toast(acInvDetail.glAccount)}>
                  {acInvDetail.glAccount}
                </button>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">Reorder qty</span>
                <span className="font-semibold text-[#0B1739]">{acInvDetail.reorderQty}</span>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <span className="text-[#6B7280]">ABC classification</span>
                <span className="font-semibold text-[#0B1739]">{acInvDetail.abc}</span>
              </div>
              <div className="flex justify-between gap-2 py-1 col-span-2">
                <span className="text-[#6B7280]">Unit of measure</span>
                <span className="font-semibold text-[#0B1739]">{acInvDetail.uom}</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-[11px] font-bold text-[#0B1739] mb-2">Recent movements</p>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                    <th className="py-1.5 text-left font-normal">Date</th>
                    <th className="py-1.5 text-left font-normal">Type</th>
                    <th className="py-1.5 text-left font-normal">Reference</th>
                    <th className="py-1.5 text-right font-normal">In</th>
                    <th className="py-1.5 text-right font-normal">Out</th>
                    <th className="py-1.5 text-right font-normal">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {acInvMovements.map((m) => (
                    <tr key={m.reference} className="border-b border-[#EEF1F5]">
                      <td className="py-1.5 text-[#374151]">{m.date}</td>
                      <td className="py-1.5 text-[#374151]">{m.type}</td>
                      <td className="py-1.5 text-[#2563EB] font-medium">{m.reference}</td>
                      <td className="py-1.5 text-right tabular-nums text-[#0B1739]">{m.inQty}</td>
                      <td className="py-1.5 text-right tabular-nums text-[#0B1739]">{m.outQty}</td>
                      <td className="py-1.5 text-right tabular-nums text-[#0B1739]">{m.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={() => toast("View all movements")} className="mt-2 text-[10px] font-medium text-[#2563EB] hover:underline">
                View all movements &gt;
              </button>
            </div>
          </AcCard>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <AcCard className="xl:col-span-4 overflow-hidden">
          <AcCardHeader title="Month-end valuation (USD)" />
          <div className="px-4 py-3 flex flex-wrap items-start divide-x divide-[#EEF1F5]">
            {[
              { label: "Opening balance", value: acInvValuation.opening },
              { label: "Receipts", value: acInvValuation.receipts },
              { label: "Issues", value: acInvValuation.issues },
              { label: "Adjustments", value: acInvValuation.adjustments, tone: "exception" as const },
              { label: "Closing balance", value: acInvValuation.closing, tone: "posted" as const },
            ].map((v) => (
              <div key={v.label} className="flex-1 min-w-[90px] px-3 first:pl-0">
                <p className="text-[10px] text-[#6B7280]">{v.label}</p>
                <p
                  className={cn(
                    "text-[14px] font-bold tabular-nums mt-0.5",
                    v.tone === "exception" ? "text-[#DC2626]" : v.tone === "posted" ? "text-[#2563EB]" : "text-[#0B1739]"
                  )}
                >
                  {v.value}
                </p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => toast("Valuation report")} className="px-4 pb-3 text-[11px] font-medium text-[#2563EB] hover:underline">
            View valuation report
          </button>
        </AcCard>

        <AcCard className="xl:col-span-4 overflow-hidden">
          <AcCardHeader
            title="Inventory control alerts"
            action={
              <button type="button" onClick={() => toast("All alerts")} className="text-[11px] font-medium text-[#2563EB] hover:underline">
                View all alerts
              </button>
            }
          />
          <div className="divide-y divide-[#EEF1F5]">
            {acInvAlerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    "h-7 w-7 rounded-full inline-flex items-center justify-center shrink-0 text-[11px] font-bold",
                    a.tone === "exception" ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#FEF3C7] text-[#B45309]"
                  )}
                >
                  !
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#0B1739]">{a.title}</p>
                  <p className="text-[10px] text-[#6B7280]">{a.detail}</p>
                </div>
                <span
                  className={cn(
                    "text-[18px] font-bold tabular-nums",
                    a.tone === "exception" ? "text-[#DC2626]" : "text-[#F59E0B]"
                  )}
                >
                  {a.count}
                </span>
              </div>
            ))}
          </div>
        </AcCard>

        <AcCard className="xl:col-span-4 overflow-hidden">
          <AcCardHeader title="Cost layers (Weighted Average)" />
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                <th className="px-4 py-2.5 text-left font-normal">Date</th>
                <th className="px-2 py-2.5 text-right font-normal">Qty</th>
                <th className="px-2 py-2.5 text-right font-normal whitespace-nowrap">Unit cost (USD)</th>
                <th className="px-4 py-2.5 text-right font-normal whitespace-nowrap">Total value (USD)</th>
              </tr>
            </thead>
            <tbody>
              {acInvCostLayers.map((l) => (
                <tr key={`${l.date}-${l.qty}`} className="border-b border-[#EEF1F5]">
                  <td className="px-4 py-2.5 text-[#374151]">{l.date}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-[#0B1739]">{l.qty}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-[#0B1739]">{l.unitCost}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#0B1739]">{l.totalValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => toast("Cost layers")} className="px-4 py-2.5 text-[11px] font-medium text-[#2563EB] hover:underline">
            View all cost layers &gt;
          </button>
        </AcCard>
      </div>
    </div>
  )
}
