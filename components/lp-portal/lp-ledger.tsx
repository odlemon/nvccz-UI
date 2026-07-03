"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchLpLedger, fetchLpLedgerEntry } from "@/lib/store/slices/lpPortalSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LpLedgerEntrySheet } from "./lp-ledger-entry-sheet"
import { Wallet } from "lucide-react"

const CURRENCY_OPTIONS = ["USD", "ZIG", "ZWG"]

function typeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "CAPITAL_CALL":
      return "default"
    case "DISTRIBUTION":
      return "secondary"
    case "FEE":
      return "destructive"
    default:
      return "outline"
  }
}

export function LpLedger() {
  const dispatch = useAppDispatch()
  const { ledger, ledgerLoading, ledgerError } = useAppSelector((s) => s.lpPortal)

  const [fundId, setFundId] = useState("")
  const [currencyCode, setCurrencyCode] = useState<string>("")
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchLpLedger({}))
  }, [dispatch])

  const applyFilters = () => {
    dispatch(fetchLpLedger({ fundId: fundId || undefined, currencyCode: currencyCode || undefined }))
  }

  const handleRowClick = (entryId: string) => {
    dispatch(fetchLpLedgerEntry(entryId))
    setSheetOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Capital Account</h1>
        <p className="text-sm text-muted-foreground">Capital calls, distributions, and fees for your commitments.</p>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-none">
        <CardContent className="py-4 flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fund ID</label>
            <Input
              placeholder="Filter by fund ID"
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              className="w-56"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Currency</label>
            <Select value={currencyCode || "ALL"} onValueChange={(v) => setCurrencyCode(v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All currencies</SelectItem>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={applyFilters} size="default">Apply Filters</Button>
        </CardContent>
      </Card>

      {/* Entries */}
      <Card className="border-gray-200 shadow-none">
        <CardContent className="pt-6">
          {ledgerLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : ledgerError ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{ledgerError}</div>
          ) : ledger.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Wallet className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No ledger entries found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Value Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(entry.id)}
                  >
                    <TableCell>
                      <Badge variant={typeVariant(entry.type)}>{entry.type?.replaceAll("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description || "—"}</TableCell>
                    <TableCell>{entry.valueDate}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {entry.amount?.toLocaleString(undefined, { maximumFractionDigits: 2 })} {entry.currencyCode}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LpLedgerEntrySheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
