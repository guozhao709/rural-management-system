import { expect, test } from '@playwright/test'

test('redirects an unauthenticated user to login and exposes registration navigation', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('status of 401')) errors.push(message.text())
  })
  await page.route('**/api/v2/auth/user/refresh', route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 401, message: 'Refresh Token 无效', data: null }) }))
  await page.goto('/home')
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
  await page.getByRole('link', { name: '还没有账号？去注册' }).click()
  await expect(page.getByRole('heading', { name: '创建账号' })).toBeVisible()
  expect(errors).toEqual([])
})
