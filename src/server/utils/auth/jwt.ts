import jwt from 'jsonwebtoken'

const ACCESS_TOKEN_EXPIRES = '2h'
const REFRESH_TOKEN_EXPIRES = '7d'

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'pm-tools-jwt-secret-change-in-prod-2026'
}

function getJwtRefreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || 'pm-tools-jwt-refresh-secret-change-in-prod-2026'
}

interface TokenPayload {
  userId: string
  email: string
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRES })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtRefreshSecret(), { expiresIn: REFRESH_TOKEN_EXPIRES })
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtRefreshSecret()) as TokenPayload
  } catch {
    return null
  }
}

export function generateTokenPair(payload: TokenPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  }
}
