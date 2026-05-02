import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-cbc'

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || 'pm-tools-default-key-change-in-prod'
  return Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf8')
}

export function encryptApiKey(apiKey: string): string {
  const iv = randomBytes(16)
  const key = getEncryptionKey()
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return iv.toString('hex') + ':' + encrypted
}

export function decryptApiKey(encryptedKey: string): string {
  const parts = encryptedKey.split(':')
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted key format')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  const key = getEncryptionKey()
  const decipher = createDecipheriv(ALGORITHM, key, iv)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export function isEncrypted(value: string): boolean {
  const parts = value.split(':')
  return parts.length === 2 && /^[0-9a-f]{32}$/.test(parts[0])
}
