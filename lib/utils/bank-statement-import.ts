import { format, parse, parseISO } from "date-fns"
import { ReconciliationEntry } from "@/lib/api/reconciliation-api"

export interface ImportedStatementTransaction {
  id: string
  transactionDate: string
  valueDate: string | null
  description: string
  reference: string
  debit: number
  credit: number
  balance: number | null
  type: "PAYMENT" | "RECEIPT"
  amount: number
}

export interface ImportedBankStatement {
  accountNumber?: string
  accountName?: string
  currency?: string
  openingBalance?: number
  closingBalance?: number
  statementDate?: string
  transactions: ImportedStatementTransaction[]
  warnings: string[]
}

const toNumeric = (value: string): number | null => {
  const cleaned = (value || "").replace(/,/g, "").trim()
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"'
      i++
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  result.push(current.trim())
  return result
}

const normalizeHeader = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "")

const parseStatementDate = (rawDate: string): string | null => {
  const trimmed = rawDate.trim()
  if (!trimmed) return null

  const formats = ["dd MMM yyyy", "d MMM yyyy", "yyyy-MM-dd", "dd/MM/yyyy", "d/M/yyyy"]
  for (const dateFormat of formats) {
    const parsed = parse(trimmed, dateFormat, new Date())
    if (!Number.isNaN(parsed.getTime())) {
      return format(parsed, "yyyy-MM-dd")
    }
  }

  try {
    const parsed = parseISO(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return format(parsed, "yyyy-MM-dd")
    }
  } catch {
    // Ignore, we return null for unparseable dates.
  }

  return null
}

const toSignedAmount = (entry: ReconciliationEntry): number => {
  if (entry.type === "RECEIPT") return Math.abs(entry.received || entry.amount || 0)
  return -Math.abs(entry.paid || entry.amount || 0)
}

const dateDistanceDays = (a: string, b: string): number => {
  const dateA = new Date(a)
  const dateB = new Date(b)
  const diffMs = Math.abs(dateA.getTime() - dateB.getTime())
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export const parseBankStatementCSV = (csvText: string): ImportedBankStatement => {
  const warnings: string[] = []
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !!line)

  let accountNumber: string | undefined
  let accountName: string | undefined
  let currency: string | undefined
  let openingBalance: number | undefined
  let closingBalance: number | undefined

  if (lines.length > 0) {
    const accountParts = parseCSVLine(lines[0])
    if (accountParts.length >= 1) accountNumber = accountParts[0] || undefined
    if (accountParts.length >= 2) accountName = accountParts[1] || undefined
  }

  let headerIndex = -1
  let headerMap: Record<string, number> = {}

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i])
    const normalized = row.map(normalizeHeader)

    const hasTransactionHeader = normalized.includes("transactiondate") && normalized.includes("description")
    if (hasTransactionHeader) {
      headerIndex = i
      headerMap = {
        transactionDate: normalized.indexOf("transactiondate"),
        valueDate: normalized.indexOf("valuedate"),
        description: normalized.indexOf("description"),
        reference: normalized.indexOf("referencenumber"),
        debits: normalized.indexOf("debits"),
        credits: normalized.indexOf("credits"),
        balance: normalized.indexOf("balance"),
      }
      break
    }

    if (row.length >= 2) {
      const key = normalizeHeader(row[0])
      const value = row[1]?.trim() || ""
      if (key === "currency") currency = value || undefined
      if (key === "openingbalance") {
        const parsed = toNumeric(value)
        if (parsed !== null) openingBalance = parsed
      }
      if (key === "closingbalance") {
        const parsed = toNumeric(value)
        if (parsed !== null) closingBalance = parsed
      }
    }
  }

  if (headerIndex < 0) {
    return {
      accountNumber,
      accountName,
      currency,
      openingBalance,
      closingBalance,
      transactions: [],
      warnings: ["Could not detect the transaction header row in the uploaded CSV."],
    }
  }

  const transactions: ImportedStatementTransaction[] = []

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i])
    const transactionDateRaw = row[headerMap.transactionDate] || ""
    const transactionDate = parseStatementDate(transactionDateRaw)
    if (!transactionDate) {
      warnings.push(`Skipped row ${i + 1}: invalid transaction date '${transactionDateRaw}'.`)
      continue
    }

    const valueDate = headerMap.valueDate >= 0 ? parseStatementDate(row[headerMap.valueDate] || "") : null
    const description = headerMap.description >= 0 ? row[headerMap.description] || "" : ""
    const reference = headerMap.reference >= 0 ? row[headerMap.reference] || "" : ""

    const debit = headerMap.debits >= 0 ? toNumeric(row[headerMap.debits] || "") || 0 : 0
    const credit = headerMap.credits >= 0 ? toNumeric(row[headerMap.credits] || "") || 0 : 0
    const balance = headerMap.balance >= 0 ? toNumeric(row[headerMap.balance] || "") : null

    const amount = credit > 0 ? credit : debit
    if (amount <= 0) {
      warnings.push(`Skipped row ${i + 1}: missing debit/credit amount.`)
      continue
    }

    transactions.push({
      id: `stmt-${i}-${reference || transactionDate}`,
      transactionDate,
      valueDate,
      description,
      reference,
      debit,
      credit,
      balance,
      type: credit > 0 ? "RECEIPT" : "PAYMENT",
      amount,
    })
  }

  const statementDate = transactions
    .map((tx) => tx.transactionDate)
    .sort((a, b) => (a < b ? 1 : -1))[0]

  return {
    accountNumber,
    accountName,
    currency,
    openingBalance,
    closingBalance,
    statementDate,
    transactions,
    warnings,
  }
}

export const matchStatementTransactionsToEntries = (
  statementTransactions: ImportedStatementTransaction[],
  entries: ReconciliationEntry[]
) => {
  const unmatchedEntries = entries.filter((entry) => !entry.isReconciled)
  const matchedMapping: Record<string, string> = {} // txId -> entryId

  for (const tx of statementTransactions) {
    const txSignedAmount = tx.type === "RECEIPT" ? tx.amount : -tx.amount

    const candidates = unmatchedEntries
      .filter((entry) => !usedEntryIds.has(entry.id))
      .filter((entry) => Math.abs(toSignedAmount(entry) - txSignedAmount) < 0.01)
      .map((entry) => {
        const dateDiff = dateDistanceDays(entry.transactionDate, tx.transactionDate)
        const referenceMatch =
          !!tx.reference &&
          !!entry.reference &&
          entry.reference.toLowerCase() === tx.reference.toLowerCase()
        const looseReferenceMatch =
          !!tx.reference &&
          !!entry.reference &&
          (entry.reference.toLowerCase().includes(tx.reference.toLowerCase()) ||
            tx.reference.toLowerCase().includes(entry.reference.toLowerCase()))
        const descriptionMatch =
          !!tx.description &&
          !!entry.description &&
          (entry.description.toLowerCase().includes(tx.description.toLowerCase()) ||
            tx.description.toLowerCase().includes(entry.description.toLowerCase()))

        const score =
          (dateDiff === 0 ? 5 : dateDiff <= 1 ? 3 : dateDiff <= 2 ? 1 : 0) +
          (referenceMatch ? 4 : looseReferenceMatch ? 2 : 0) +
          (descriptionMatch ? 1 : 0)

        return { entry, score, dateDiff, referenceMatch }
      })
      .filter((candidate) => candidate.dateDiff <= 2 || candidate.referenceMatch)
      .sort((a, b) => b.score - a.score)

    if (candidates.length === 0) continue

    const best = candidates[0]
    const bestScore = best.score
    const topMatches = candidates.filter((candidate) => candidate.score === bestScore)

    if (topMatches.length === 1 && bestScore >= 4) {
      matchedEntryIds.push(best.entry.id)
      usedEntryIds.add(best.entry.id)
      matchedMapping[tx.id] = best.entry.id
    }
  }

  return {
    matchedEntryIds,
    matchedMapping,
    matchedTransactionCount: matchedEntryIds.length,
    unmatchedTransactionCount: Math.max(0, statementTransactions.length - matchedEntryIds.length),
  }
}

export const getBankStatementTemplateCSV = () => {
  return [
    "14301245637,BLESSING MWALE",
    "Currency,USD",
    "Opening Balance,0.00",
    "Closing Balance,0.00",
    "Transaction Date,Value Date,Description,Reference Number,Debits,Credits,Balance",
    "31 Mar 2026,31 Mar 2026,CHRG: A/C MAINTENANCE FEE,QS7616523,0.06,,0.00",
    "26 Mar 2026,26 Mar 2026,TRF:20260326/0012/1111/0000002/0000274:DokumaPriva,QS7364751,,1419.23,1419.36",
  ].join("\n")
}