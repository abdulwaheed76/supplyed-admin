import Link from "next/link"
import { ArrowUpRightIcon, MessageSquareIcon, ReceiptTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function JobActivityLinks({
  jobId,
  jobTitle,
  compact = false,
}: {
  jobId: string
  jobTitle: string
  compact?: boolean
}) {
  const baseHref = `/dashboard/jobs/${encodeURIComponent(jobId)}`
  const links = [
    {
      title: "Chat",
      description: "Review conversations between the teacher and job poster.",
      href: `${baseHref}/conversations`,
      Icon: MessageSquareIcon,
    },
    {
      title: "Payments",
      description: "View invoices, billed schools, recipients and payment history.",
      href: `${baseHref}/payments`,
      Icon: ReceiptTextIcon,
    },
  ]

  if (compact) {
    return (
      <TooltipProvider>
        <nav aria-label={`Chat and payments for ${jobTitle}`} className="flex items-center gap-0.5">
          {links.map(({ title, href, Icon }) => (
            <Tooltip key={title}>
              <TooltipTrigger asChild>
                <Button asChild size="icon" variant="ghost" className="rounded-md text-muted-foreground hover:bg-background hover:text-foreground">
                  <Link href={href} aria-label={`${title} for ${jobTitle}`}>
                    <Icon className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{title}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </TooltipProvider>
    )
  }

  return (
    <nav
      aria-label={`Chat and payments for ${jobTitle}`}
      className="grid gap-4 sm:grid-cols-2"
    >
      {links.map(({ title, description, href, Icon }) => (
        <Button
          key={title}
          asChild
          size="lg"
          variant={title === "Chat" ? "default" : "outline"}
          className="h-auto min-h-28 justify-start gap-4 whitespace-normal rounded-xl px-5 py-6 text-left"
        >
          <Link href={href} aria-label={`${title} for ${jobTitle}`}>
            <Icon className="size-7 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold">{title}</span>
              <span className="mt-1 block text-sm font-normal opacity-80">{description}</span>
            </span>
            <ArrowUpRightIcon className="size-5 shrink-0" aria-hidden="true" />
          </Link>
        </Button>
      ))}
    </nav>
  )
}
