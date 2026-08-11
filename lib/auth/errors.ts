/**
 * Auth.js only propagates a short `code` out of the Credentials `authorize`
 * callback, so the backend's failure reason is mapped to a code on the server
 * and back to a message on the client. Both sides share this table.
 */
export const SIGN_IN_ERROR_CODES = [
  "invalid_credentials",
  "email_unverified",
  "two_factor_required",
  "not_admin",
  "service_unavailable",
] as const

export type SignInErrorCode = (typeof SIGN_IN_ERROR_CODES)[number]

const SIGN_IN_ERROR_MESSAGES: Record<SignInErrorCode, string> = {
  invalid_credentials: "The email or password is incorrect.",
  email_unverified: "Verify your email before signing in to the admin portal.",
  two_factor_required: "Two-factor verification is required to continue.",
  not_admin: "This account does not have administrator access.",
  service_unavailable:
    "The authentication service is unavailable. Try again shortly.",
}

const FALLBACK_MESSAGE = "Unable to sign in."

export function getSignInErrorMessage(code: string | undefined | null) {
  if (!code) {
    return FALLBACK_MESSAGE
  }

  return SIGN_IN_ERROR_MESSAGES[code as SignInErrorCode] ?? FALLBACK_MESSAGE
}
