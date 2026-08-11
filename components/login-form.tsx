"use client"

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

import { getSignInErrorMessage } from "@/lib/auth/errors"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type LoginInput = {
  email: string
  password: string
}

async function login(input: LoginInput) {
  // `redirect: false` keeps the result in this component so the form can render
  // the failure inline instead of bouncing through /login?error=.
  const result = await signIn("credentials", { ...input, redirect: false })

  if (!result || result.error) {
    throw new Error(getSignInErrorMessage(result?.code))
  }

  return result
}

/**
 * Read at redirect time rather than via `useSearchParams`, which would force
 * both pages that render this form into a Suspense/CSR bailout for a value
 * only needed after the user submits.
 *
 * Only same-origin paths are honoured, so a crafted `?next=` cannot send the
 * admin off-site after a successful sign-in.
 */
function getSafeRedirect() {
  const next = new URLSearchParams(window.location.search).get("next")

  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard"
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      router.replace(getSafeRedirect())
      router.refresh()
    },
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email")
    const password = formData.get("password")

    if (typeof email !== "string" || typeof password !== "string") {
      return
    }

    loginMutation.mutate({ email, password })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your Supplyed Admin account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  aria-invalid={loginMutation.isError}
                  disabled={loginMutation.isPending}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={loginMutation.isError}
                  disabled={loginMutation.isPending}
                  minLength={8}
                  required
                />
              </Field>
              <Field>
                {loginMutation.error ? (
                  <FieldError>{loginMutation.error.message}</FieldError>
                ) : null}
                <Button type="submit" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in..." : "Login"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Don&apos;t have an account? <a href="#">Sign up</a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="/placeholder.svg"
              alt="Abstract Supplyed workspace illustration"
              fill
              priority
              sizes="(min-width: 768px) 448px, 0px"
              className="object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
