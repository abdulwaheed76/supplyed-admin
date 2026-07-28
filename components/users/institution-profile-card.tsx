import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { InstitutionProfile } from "@/lib/users/get-role-profile"

type InstitutionProfileCardProps = {
  profile: InstitutionProfile
}

export function InstitutionProfileCard({
  profile,
}: InstitutionProfileCardProps) {
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
        <CardTitle>Institution profile</CardTitle>
        <CardDescription>
          Organisation, registration, subscription, and staffing information.
        </CardDescription>
        <CardAction>
          <span
            className={
              profile.verified
                ? "inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                : "inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
            }
          >
            {profile.verified ? "Verified" : "Not verified"}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{profile.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.domain}
          </p>
        </div>

        <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Registration ID
            </dt>
            <dd className="mt-1 font-medium">
              {profile.registrationId || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Subscription
            </dt>
            <dd className="mt-1 font-medium">
              {profile.subscriptionTier || "No subscription"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Contact role
            </dt>
            <dd className="mt-1 font-medium">{profile.userRole || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Profile ID
            </dt>
            <dd className="mt-1 break-all font-mono text-xs">{profile.id}</dd>
          </div>
          <div className="sm:col-span-2 xl:col-span-4">
            <dt className="text-xs font-medium text-muted-foreground">
              Address
            </dt>
            <dd className="mt-1">{address || "—"}</dd>
          </div>
        </dl>

        <div className="border-t pt-5">
          <h3 className="text-xs font-medium text-muted-foreground">
            Staffing needs
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed">
            {profile.staffingNeeds || "No staffing needs have been provided."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
