"use client"

import { useState } from "react"
import { DownloadIcon, LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type ExportFormat = "csv" | "xlsx"

function downloadFilename(response: Response, format: ExportFormat) {
  const disposition = response.headers.get("Content-Disposition")
  const match = disposition?.match(/filename="([^"]+)"/i)
  return match?.[1] ?? `supplyed-waiting-list.${format}`
}

export function ExportWaitingListButton() {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function exportWaitingList(format: ExportFormat) {
    setExportingFormat(format)
    setError(null)

    try {
      const response = await fetch(`/api/contact/founding-interest/export?format=${format}`, {
        headers: {
          Accept: format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        signal: AbortSignal.timeout(30_000),
      })

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null)
        const message =
          body &&
          typeof body === "object" &&
          "message" in body &&
          typeof body.message === "string"
            ? body.message
            : "Unable to export the waiting list."
        throw new Error(message)
      }

      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement("a")
      link.href = url
      link.download = downloadFilename(response, format)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to export the waiting list."
      )
    } finally {
      setExportingFormat(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {(["csv", "xlsx"] as const).map((format) => (
          <Button
            key={format}
            type="button"
            variant="outline"
            disabled={exportingFormat !== null}
            onClick={() => exportWaitingList(format)}
          >
            {exportingFormat === format ? (
              <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
            ) : (
              <DownloadIcon aria-hidden="true" />
            )}
            {exportingFormat === format
              ? "Exporting..."
              : format === "csv"
                ? "Export all CSV"
                : "Export all Excel"}
          </Button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="max-w-64 text-right text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
