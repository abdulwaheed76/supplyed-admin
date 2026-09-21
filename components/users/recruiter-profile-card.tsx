import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RecruiterStatusControl } from "@/components/users/instructor-status-control"
import type { RecruiterProfile } from "@/lib/users/get-role-profile"

type RecruiterProfileCardProps = {
  profile: RecruiterProfile
}

export function RecruiterProfileCard({ profile }: RecruiterProfileCardProps) {
  const address = [
    profile.address,
    profile.city,
    profile.county,
    profile.postalCode,
    profile.countryCode,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Recruiter profile</CardTitle>
        <CardDescription>
          Contact, location, and profile status information.
        </CardDescription>
        <CardAction>
          <RecruiterStatusControl
            profileId={profile.id}
            userId={profile.userId}
            currentStatus={profile.status}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">
            {profile.displayName || "Unnamed recruiter"}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {profile.bio || "No recruiter biography has been provided."}
          </p>
        </div>

        <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              City
            </dt>
            <dd className="mt-1 font-medium">{profile.city || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              County
            </dt>
            <dd className="mt-1 font-medium">{profile.county || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Postcode
            </dt>
            <dd className="mt-1 font-medium">
              {profile.postalCode || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Country
            </dt>
            <dd className="mt-1 font-medium">
              {profile.countryCode || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-muted-foreground">
              Address
            </dt>
            <dd className="mt-1">{address || "—"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

