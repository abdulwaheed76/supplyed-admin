import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Building2Icon,
  GraduationCapIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react"

const metrics = [
  {
    title: "Total users",
    value: "1,284",
    change: "+12.5%",
    detail: "from last month",
    Icon: UsersIcon,
  },
  {
    title: "Active instructors",
    value: "312",
    change: "+8.2%",
    detail: "from last month",
    Icon: GraduationCapIcon,
  },
  {
    title: "Institutions",
    value: "92",
    change: "+5.4%",
    detail: "from last month",
    Icon: Building2Icon,
  },
  {
    title: "Pending approvals",
    value: "18",
    change: "6 resolved",
    detail: "this week",
    Icon: UserCheckIcon,
  },
]

const recentActivity = [
  {
    title: "Bright Future Academy joined",
    description: "New institution registration",
    time: "12 minutes ago",
  },
  {
    title: "Ayesha Khan was approved",
    description: "Instructor verification completed",
    time: "38 minutes ago",
  },
  {
    title: "24 new students registered",
    description: "Registration activity",
    time: "2 hours ago",
  },
  {
    title: "Lahore Skills Institute updated its profile",
    description: "Institution profile update",
    time: "5 hours ago",
  },
]

const roleDistribution = [
  { role: "Students", count: 726, percentage: 57 },
  { role: "Instructors", count: 312, percentage: 24 },
  { role: "Recruiters", count: 154, percentage: 12 },
  { role: "Institutions", count: 92, percentage: 7 },
]

export default function DashboardPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A quick overview of activity across the Supplyed platform.
          </p>
        </div>

        <section
          aria-label="Platform metrics"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map(({ Icon, change, detail, title, value }) => (
            <Card key={title}>
              <CardHeader>
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  {value}
                </CardTitle>
                <CardAction>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    {change}
                  </span>{" "}
                  {detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>
                The latest updates from across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <ul className="divide-y" aria-label="Recent platform activity">
                {recentActivity.map((activity) => (
                  <li
                    key={activity.title}
                    className="flex items-start gap-3 px-4 py-4 md:px-6"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {activity.time}
                    </time>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Users by role</CardTitle>
              <CardDescription>Distribution of all active users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {roleDistribution.map(({ count, percentage, role }) => (
                <div key={role}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="font-medium">{role}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {count.toLocaleString()} · {percentage}%
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${role}: ${percentage}%`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
