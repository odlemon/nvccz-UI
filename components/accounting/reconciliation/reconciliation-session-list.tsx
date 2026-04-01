"use client"

import { useSelector } from "react-redux"
import { RootState } from "@/lib/store/store"
import { ReconciliationSession } from "@/lib/api/reconciliation-api"
import { ProcurementDataTable, Column } from "../../procurement/procurement-data-table"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"

interface ReconciliationSessionListProps {
  onOpenSession: (session: ReconciliationSession) => void
  onViewSession: (session: ReconciliationSession) => void
}

export function ReconciliationSessionList({ onOpenSession, onViewSession }: ReconciliationSessionListProps) {
  const { sessions, sessionsLoading } = useSelector((state: RootState) => state.reconciliation)

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy")
    } catch {
      return dateStr
    }
  }

  const formatAmount = (val: number) => {
    return (val ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      case "FINALIZED":
        return <Badge className="bg-green-100 text-green-800">Finalized</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: Column<ReconciliationSession>[] = [
    {
      key: "statementDate" as any,
      label: "Statement Date",
      sortable: true,
      render: (value) => formatDate(value as string),
    },
    {
      key: "reference" as any,
      label: "Reference",
      sortable: true,
      render: (value) => (value as string) || "-",
    },
    {
      key: "status" as any,
      label: "Status",
      sortable: true,
      render: (value) => getStatusBadge(value as string),
    },
    {
      key: "openingBalance" as any,
      label: "Opening Balance",
      sortable: true,
      render: (value) => formatAmount(value as number),
    },
    {
      key: "statementEndBalance" as any,
      label: "Statement End Balance",
      sortable: true,
      render: (value) => formatAmount(value as number),
    },
    {
      key: "createdAt" as any,
      label: "Created",
      sortable: true,
      render: (value) => formatDate(value as string),
    },
  ]

  const handleRowClick = (session: ReconciliationSession) => {
    if (session.status === "DRAFT") {
      onOpenSession(session)
    } else {
      onViewSession(session)
    }
  }

  return (
    <ProcurementDataTable
      columns={columns}
      data={sessions}
      isLoading={sessionsLoading}
      emptyMessage="No reconciliation sessions found for this bank."
      searchPlaceholder="Search sessions..."
      onView={handleRowClick}
    />
  )
}
