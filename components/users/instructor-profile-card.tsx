import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { InstructorProfile } from "@/lib/users/get-role-profile"

type InstructorProfileCardProps = {
  profile: InstructorProfile
}

function formatMoney(value: number | null | undefined, currency?: string | null) {
  if (value == null) {
    return "—"
  }

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return String(value)
  }
}

function Tags({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

export function InstructorProfileCard({ profile }: InstructorProfileCardProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Instructor profile</CardTitle>
        <CardDescription>
          Teaching, availability, verification, and rating information.
        </CardDescription>
        <CardAction>
          <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {profile.status}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{profile.fullName}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {profile.bio || "No instructor biography has been provided."}
          </p>
        </div>

        <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Experience
            </dt>
            <dd className="mt-1 font-medium">
              {profile.experience == null
                ? "—"
                : `${profile.experience} years`}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Hourly rate
            </dt>
            <dd className="mt-1 font-medium">
              {formatMoney(profile.hourlyRate, profile.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Daily rate
            </dt>
            <dd className="mt-1 font-medium">
              {formatMoney(profile.dailyRate, profile.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Maximum travel
            </dt>
            <dd className="mt-1 font-medium">
              {profile.maxTravelDistance == null
                ? "—"
                : `${profile.maxTravelDistance} miles`}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Rating
            </dt>
            <dd className="mt-1 font-medium">
              {profile.ratingCount > 0
                ? `${profile.ratingAverage.toFixed(1)} (${profile.ratingCount})`
                : "No ratings"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              DBS verification
            </dt>
            <dd className="mt-1 font-medium">
              {profile.dbsVerified ? "Verified" : "Not verified"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-muted-foreground">
              Profile ID
            </dt>
            <dd className="mt-1 break-all font-mono text-xs">{profile.id}</dd>
          </div>
        </dl>

        <div className="grid gap-5 border-t pt-5 lg:grid-cols-3">
          <div>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">
              Subjects
            </h3>
            <Tags items={profile.subjects} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">
              Key stages
            </h3>
            <Tags items={profile.keyStages} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">
              Skills
            </h3>
            <Tags items={profile.skills} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
