import { expect, test } from '@playwright/test'

// 工具链验收：真实页面装配、交互和重新加载；不代表业务验收。
test('updates the counter without runtime errors and resets on reload', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Count is 0', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Count is 1', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Count is 0', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
