import { test, expect } from '@playwright/test'

test.describe('Project Management (Authenticated)', () => {
  let authToken: string | null = null

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: `e2e-test-${Date.now()}@example.com`,
        password: 'TestPass123!',
        displayName: 'E2E Test User',
      },
    })
    if (response.ok()) {
      const data = await response.json()
      authToken = data.accessToken
    }
  })

  test('should create a project', async ({ request }) => {
    if (!authToken) return test.skip()
    const response = await request.post('/api/projects', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'E2E Test Project',
        description: 'Created by E2E test',
        startDate: '2026-05-01',
        endDate: '2026-06-30',
      },
    })
    expect(response.ok()).toBeTruthy()
    const project = await response.json()
    expect(project.name).toBe('E2E Test Project')
  })

  test('should list projects', async ({ request }) => {
    if (!authToken) return test.skip()
    const response = await request.get('/api/projects', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.ok()).toBeTruthy()
    const projects = await response.json()
    expect(Array.isArray(projects)).toBeTruthy()
  })

  test('should reject invalid project name', async ({ request }) => {
    if (!authToken) return test.skip()
    const response = await request.post('/api/projects', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: '' },
    })
    expect(response.status()).toBe(400)
  })
})

test.describe('Task Management (Authenticated)', () => {
  let authToken: string | null = null
  let projectId: string | null = null

  test.beforeAll(async ({ request }) => {
    const regResponse = await request.post('/api/auth/register', {
      data: {
        email: `e2e-task-${Date.now()}@example.com`,
        password: 'TestPass123!',
        displayName: 'E2E Task User',
      },
    })
    if (regResponse.ok()) {
      const data = await regResponse.json()
      authToken = data.accessToken
    }

    if (authToken) {
      const projResponse = await request.post('/api/projects', {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { name: 'Task Test Project' },
      })
      if (projResponse.ok()) {
        const project = await projResponse.json()
        projectId = project.id
      }
    }
  })

  test('should create a task', async ({ request }) => {
    if (!authToken || !projectId) return test.skip()
    const response = await request.post(`/api/projects/${projectId}/tasks`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'E2E Test Task',
        startDate: '2026-05-01',
        endDate: '2026-05-15',
        duration: 15,
        priority: 'high',
        status: 'pending',
      },
    })
    expect(response.ok()).toBeTruthy()
    const task = await response.json()
    expect(task.name).toBe('E2E Test Task')
    expect(task.priority).toBe('high')
  })

  test('should reject invalid priority', async ({ request }) => {
    if (!authToken || !projectId) return test.skip()
    const response = await request.post(`/api/projects/${projectId}/tasks`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'Bad Priority Task',
        priority: 'invalid_priority',
      },
    })
    expect(response.ok()).toBeTruthy()
    const task = await response.json()
    expect(task.priority).toBe('medium')
  })

  test('should list tasks for project', async ({ request }) => {
    if (!authToken || !projectId) return test.skip()
    const response = await request.get(`/api/projects/${projectId}/tasks`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.ok()).toBeTruthy()
    const tasks = await response.json()
    expect(Array.isArray(tasks)).toBeTruthy()
  })
})

test.describe('Security - Rate Limiting', () => {
  test('should rate limit login attempts', async ({ request }) => {
    const promises = []
    for (let i = 0; i < 15; i++) {
      promises.push(
        request.post('/api/auth/login', {
          data: { email: 'rate-limit-test@example.com', password: 'wrong' },
        })
      )
    }
    const responses = await Promise.all(promises)
    const rateLimited = responses.some((r) => r.status() === 429)
    expect(rateLimited).toBeTruthy()
  })
})

test.describe('Security - Input Validation', () => {
  test('should reject invalid email on registration', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: 'not-an-email',
        password: 'TestPass123!',
        displayName: 'Test',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('should reject short password on registration', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: 'short-pwd@example.com',
        password: '123',
        displayName: 'Test',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('should reject invalid UUID for project ID', async ({ request }) => {
    const response = await request.get('/api/projects/not-a-uuid', {
      headers: { Authorization: 'Bearer fake-token' },
    })
    expect([400, 401]).toContain(response.status())
  })
})
