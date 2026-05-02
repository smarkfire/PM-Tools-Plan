export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return {
    message: `Hello, ${body.name || 'World'}!`,
    timestamp: new Date().toISOString()
  }
})
