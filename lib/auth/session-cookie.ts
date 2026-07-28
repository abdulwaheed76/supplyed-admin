export const ACCESS_TOKEN_COOKIE_NAME = "supplyed_access_token"
export const REFRESH_TOKEN_COOKIE_NAME = "supplyed_refresh_token"
const ACCESS_TOKEN_REFRESH_BUFFER_SECONDS = 30

export function getAccessTokenCookieOptions(maxAge: number) {
  const bufferedMaxAge =
    maxAge > ACCESS_TOKEN_REFRESH_BUFFER_SECONDS
      ? maxAge - ACCESS_TOKEN_REFRESH_BUFFER_SECONDS
      : maxAge

  return {
    httpOnly: true,
    maxAge: bufferedMaxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  }
}

export function getRefreshTokenCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  }
}

type SessionTokens = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn: number
  refreshTokenExpiresIn: number
}

export function getSessionCookies(tokens: SessionTokens) {
  return [
    {
      name: ACCESS_TOKEN_COOKIE_NAME,
      value: tokens.accessToken,
      ...getAccessTokenCookieOptions(tokens.accessTokenExpiresIn),
    },
    {
      name: REFRESH_TOKEN_COOKIE_NAME,
      value: tokens.refreshToken,
      ...getRefreshTokenCookieOptions(tokens.refreshTokenExpiresIn),
    },
  ]
}

export function getClearedSessionCookies() {
  return [
    {
      name: ACCESS_TOKEN_COOKIE_NAME,
      value: "",
      ...getAccessTokenCookieOptions(0),
      maxAge: 0,
    },
    {
      name: REFRESH_TOKEN_COOKIE_NAME,
      value: "",
      ...getRefreshTokenCookieOptions(0),
      maxAge: 0,
    },
  ]
}
