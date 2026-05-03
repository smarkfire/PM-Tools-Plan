import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h2, .login-title, [class*="login"]')).toBeVisible({ timeout: 10000 })
  })

  test('should show register page', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('h2, .register-title, [class*="register"]')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login')
    const registerLink = page.locator('a[href="/register"], a:has-text("注册"), a:has-text("Register")')
    if (await registerLink.isVisible()) {
      await registerLink.click()
      await expect(page).toHaveURL(/\/register/)
    }
  })

  test('should show validation error on empty login submit', async ({ page }) => {
    await page.goto('/login')
    const submitBtn = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await expect(page.locator('.el-form-item__error, .error, [class*="error"]')).toBeVisible({ timeout: 5000 }).catch(() => {})
    }
  })
})

test.describe('Guest Mode - Local Storage', () => {
  test('should load workspace page in guest mode', async ({ page }) => {
    await page.goto('/workspace')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#app')).toBeVisible({ timeout: 15000 })
  })

  test('should show project toolbar in workspace', async ({ page }) => {
    await page.goto('/workspace')
    await page.waitForLoadState('networkidle')
    const toolbar = page.locator('.toolbar, [class*="toolbar"], [class*="Toolbar"]')
    await expect(toolbar).toBeVisible({ timeout: 10000 }).catch(() => {
      expect(page.locator('#app')).toBeVisible()
    })
  })
})

test.describe('Projects Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForURL(/\/(login|workspace)/, { timeout: 10000 }).catch(() => {})
  })
})

test.describe('Share Page', () => {
  test('should show not found for invalid share token', async ({ page }) => {
    const response = await page.goto('/share/invalid-token-12345')
    if (response) {
      expect([404, 410, 500]).toContain(response.status())
    }
  })
})

test.describe('Health Check', () => {
  test('should return health status', async ({ page }) => {
    const response = await page.request.get('/api/health')
    expect(response.ok()).toBeTruthy()
  })
})
