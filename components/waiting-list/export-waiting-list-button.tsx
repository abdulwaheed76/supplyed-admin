"use client"

import { useState } from "react"
import { DownloadIcon, LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

function downloadFilename(response: Response) {
  const disposition = response.headers.get("Content-Disposition")
  const match = disposition?.match(/filename="([^"]+)"/i)
  return match?.[1] ?? "supplyed-waiting-list.csv"
}

export function ExportWaitingListButton() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function exportWaitingList() {
    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch("/api/contact/founding-interest/export", {
        headers: { Accept: "text/csv" },
      signal: AbortSignal.timeout(15_000),
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
      link.download = downloadFilename(response)
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
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        disabled={isExporting}
        onClick={exportWaitingList}
      >
        {isExporting ? (
          <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
        ) : (
          <DownloadIcon aria-hidden="true" />
        )}
        {isExporting ? "Exporting..." : "Export all CSV"}
      </Button>
      {error ? (
        <p role="alert" className="max-w-64 text-right text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
