import { expect, test } from '@playwright/test'

test('redirects an unauthenticated administrator to the login page', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('status of 401')) errors.push(message.text())
  })
  await page.route('**/api/v2/auth/admin/refresh', route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 401, message: 'Refresh Token 无效', data: null }) }))
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: '管理员登录' })).toBeVisible()
  await expect(page.getByRole('button', { name: '登录管理后台' })).toBeVisible()
  expect(errors).toEqual([])
})
