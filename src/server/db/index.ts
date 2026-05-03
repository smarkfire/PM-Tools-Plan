import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function getConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  return 'postgresql://postgres:difyai135@localhost:5432/pmtools'
}

const client = postgres(getConnectionString(), {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
