import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InstitutionStatusControl } from "@/components/users/instructor-status-control"
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

  const coverTypes = [
    ...new Set(
      profile.coverTypes
        .map((coverType) => coverType.trim())
        .filter((coverType) => coverType.length > 0)
    ),
  ]

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Institution profile</CardTitle>
        <CardDescription>
          Organisation, registration, subscription, and staffing information.
        </CardDescription>
        <CardAction>
          <InstitutionStatusControl
            profileId={profile.id}
            userId={profile.userId}
            currentStatus={profile.status}
          />
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
              Typical pupil count
            </dt>
            <dd className="mt-1 font-medium">
              {profile.typicalPupilCount?.toLocaleString() ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Verification
            </dt>
            <dd className="mt-1 font-medium">
              {profile.verified ? "Verified" : "Not verified"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Safeguarding
            </dt>
            <dd className="mt-1 font-medium">
              {profile.safeguardingConfirmed ? "Confirmed" : "Not confirmed"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Country
            </dt>
            <dd className="mt-1 font-medium">
              {profile.countryCode || "Not provided"}
            </dd>
          </div>
          <div className="sm:col-span-2 xl:col-span-4">
            <dt className="text-xs font-medium text-muted-foreground">
              Address
            </dt>
            <dd className="mt-1">{address || "—"}</dd>
          </div>
        </dl>

        <div className="grid min-w-0 gap-6 border-t pt-5 lg:grid-cols-2">
          <section className="min-w-0">
            <h3 className="text-sm font-semibold">Staffing requirements</h3>
            <div className="mt-4 space-y-5">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground">
                  Staffing needs
                </h4>
                <p className="mt-2 max-w-full break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
                  {profile.staffingNeeds.join(", ") ||
                    "No staffing needs have been provided."}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground">
                  Cover types
                </h4>
                {coverTypes.length > 0 ? (
                  <ul
                    className="mt-2 flex flex-wrap gap-2"
                    aria-label="Cover types"
                  >
                    {coverTypes.map((coverType) => (
                      <li
                        key={coverType}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                      >
                        {coverType}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No cover types have been provided.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="min-w-0">
            <h3 className="text-sm font-semibold">Compliance contact</h3>
            <dl className="mt-4 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs font-medium text-muted-foreground">
                  Contact name
                </dt>
                <dd className="mt-1 break-words font-medium [overflow-wrap:anywhere]">
                  {profile.complianceContact || "—"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-muted-foreground">
                  Contact email
                </dt>
                <dd className="mt-1 break-all font-medium">
                  {profile.complianceEmail ? (
                    <a
                      className="text-primary underline-offset-4 hover:underline"
                      href={`mailto:${profile.complianceEmail}`}
                    >
                      {profile.complianceEmail}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}
