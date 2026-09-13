import { expect, test } from '@playwright/test'

test('protects the health route with the existing user login flow', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))

  await page.goto('/health')

  await expect(page).toHaveURL(/\/login\?redirect=\/health$/)
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
  expect(pageErrors).toEqual([])
})
