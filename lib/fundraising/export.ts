"use client"

export type FrExportColumn<T> = {
  key: keyof T | string
  label: string
  value?: (row: T) => unknown
}

function csvCell(value: unknown) {
  const text =
    value == null
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function downloadText(content: string, fileName: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportFundraisingCsv<T extends Record<string, any>>(
  rows: T[],
  columns: FrExportColumn<T>[],
  fileName: string,
) {
  const header = columns.map((column) => csvCell(column.label)).join(",")
  const body = rows.map((row) =>
    columns
      .map((column) =>
        csvCell(
          column.value
            ? column.value(row)
            : row[column.key as keyof T],
        ),
      )
      .join(","),
  )
  downloadText([header, ...body].join("\r\n"), `${fileName}.csv`)
}

export function downloadCsvPayload(payload: unknown, fileName: string) {
  const csv =
    typeof payload === "string"
      ? payload
      : payload && typeof payload === "object" && "csv" in payload
        ? String((payload as { csv: unknown }).csv || "")
        : ""
  if (!csv) throw new Error("The export response did not contain CSV data")
  downloadText(csv, `${fileName}.csv`)
}
