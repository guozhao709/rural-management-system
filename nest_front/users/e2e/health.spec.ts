import { expect, test } from '@playwright/test'

test('authenticated user can enter health, filter knowledge, and open detail', async ({ page }) => {
  await page.route('**/api/v2/auth/user/refresh', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { accessToken: 'e2e-token', expiresIn: 900, user: { id: 1, phone: '13800000000', name: '测试用户', gender: 'unknown', birthday: null, address: null, status: 'active' } } }) }))
  await page.route('**/api/health/profile', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: null }) }))
  await page.route('**/api/health/metrics/trend*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { target: { type: 'weight', unit: 'kg' }, points: [{ measuredAt: '2026-09-13T08:00:00+08:00', value: 65.2 }], statistics: { latest: 65.2, average: 65.2, min: 65.2, max: 65.2, change: 0, trend: 'flat' } } }) }))
  await page.route('**/api/health/metrics?*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { items: [], page: 1, pageSize: 10, total: 0 } }) }))
  await page.route('**/api/health/metric-templates*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { items: [], page: 1, pageSize: 100, total: 0 } }) }))
  await page.route('**/api/health/analyses*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { items: [], page: 1, pageSize: 20, total: 0 } }) }))
  await page.route('**/api/health/knowledge/1', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { id: 1, title: '如何正确测量血压', summary: '掌握正确的测量方法。', category: 'health_metric', tags: ['血压'], sourceName: '健康机构', content: '测量前保持安静。', source: { name: '健康机构', url: 'https://example.com/health' }, createdAt: '2026-09-01T10:00:00+08:00', updatedAt: '2026-09-01T10:00:00+08:00' } }) }))
  await page.route('**/api/health/knowledge*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { items: [{ id: 1, title: '如何正确测量血压', summary: '掌握正确的测量方法。', category: 'health_metric', tags: ['血压'], sourceName: '健康机构' }], page: 1, pageSize: 10, total: 1 } }) }))

  await page.goto('/health')
  await expect(page.getByRole('heading', { name: '照顾好每一次记录' })).toBeVisible()
  await page.getByText('指标趋势', { exact: true }).click()
  await expect(page.getByRole('heading', { name: '指标变化' })).toBeVisible()
  await page.getByText('健康知识', { exact: true }).click()
  await page.getByRole('textbox', { name: '搜索健康知识' }).fill('血压')
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page.getByRole('button', { name: /如何正确测量血压/ })).toBeVisible()
  await page.getByRole('button', { name: /如何正确测量血压/ }).click()
  await expect(page.getByText('测量前保持安静。')).toBeVisible()
})

test('authenticated user can complete health writes and recover from analysis failure', async ({ page }) => {
  let metricItems: unknown[] = []
  let templates: Array<Record<string, unknown>> = []
  let analysisAttempts = 0
  let profileAttempts = 0
  let metricCreateAttempts = 0
  let metricDeleteAttempts = 0
  let templateCreateAttempts = 0
  let templateEndAttempts = 0
  const profile = { id: 1, sex: 'male', birthDate: '2006-07-09', heightCm: 175, smokingStatus: null, drinkingStatus: null, exerciseStatus: null, sleepStatus: null, healthHistory: null, allergies: null, createdAt: '2026-09-01', updatedAt: '2026-09-01' }

  await page.route('**/api/v2/auth/user/refresh', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { accessToken: 'e2e-token', expiresIn: 900, user: { id: 1, phone: '13800000000', name: '测试用户', gender: 'unknown', birthday: null, address: null, status: 'active' } } }) }))
  await page.route('**/api/health/profile', route => {
    if (route.request().method() === 'PUT') {
      profileAttempts += 1
      if (profileAttempts === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '档案保存失败', data: null }) })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: profile }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: null }) })
  })
  await page.route('**/api/health/metrics**', route => {
    const method = route.request().method()
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/trend')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { target: { type: 'weight', unit: 'kg' }, points: [], statistics: { latest: 0, average: 0, min: 0, max: 0, change: 0, trend: 'flat' } } }) })
    if (method === 'POST') {
      metricCreateAttempts += 1
      if (metricCreateAttempts === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '指标保存失败', data: null }) })
      const record = { id: 1, metricType: 'weight', value: 65.2, unit: 'kg', measuredAt: '2026-09-13T20:30:00+08:00', createdAt: '2026-09-13T20:31:00+08:00' }
      metricItems = [record]
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: record }) })
    }
    if (method === 'DELETE') {
      metricDeleteAttempts += 1
      if (metricDeleteAttempts === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '指标删除失败', data: null }) })
      metricItems = []
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: null }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { items: metricItems, page: 1, pageSize: 10, total: metricItems.length } }) })
  })
  await page.route('**/api/health/metric-templates**', route => {
    const method = route.request().method()
    if (method === 'POST') {
      templateCreateAttempts += 1
      if (templateCreateAttempts === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '模板创建失败', data: null }) })
      templates = [{ id: 2, name: '发烧期间体温', metricName: '体温', unit: '℃', relatedSystemMetricType: 'temperature', startedAt: '2026-09-13T20:00:00+08:00', endedAt: null, createdAt: '2026-09-13T20:00:00+08:00', updatedAt: '2026-09-13T20:00:00+08:00' }]
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: templates[0] }) })
    }
    if (method === 'PATCH') {
      templateEndAttempts += 1
      if (templateEndAttempts === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '模板结束失败', data: null }) })
      templates = templates.map(template => ({ ...template, endedAt: '2026-09-15T18:00:00+08:00' }))
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: templates[0] }) })
    }
    if (new URL(route.request().url()).pathname.match(/\/\d+$/)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: templates[0] }) })
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { items: templates, page: 1, pageSize: 100, total: templates.length } }) })
  })
  await page.route('**/api/health/analyses**', route => {
    const method = route.request().method()
    if (method === 'POST') {
      analysisAttempts += 1
      if (analysisAttempts === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '分析服务暂时不可用', data: null }) })
      const detail = { id: 3, input: { symptoms: ['fatigue'], severity: 'mild', duration: 'today', description: '今天有些乏力。' }, context: {}, result: { summary: '请先休息并观察变化。', concerns: [], factors: [], suggestions: ['适当休息'], medicalAdvice: '如加重请就医', references: [] }, createdAt: '2026-09-13T21:00:00+08:00' }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: detail }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { items: analysisAttempts > 1 ? [{ id: 3, symptoms: ['fatigue'], severity: 'mild', summary: '请先休息并观察变化。', createdAt: '2026-09-13T21:00:00+08:00' }] : [], page: 1, pageSize: 20, total: analysisAttempts > 1 ? 1 : 0 } }) })
  })
  await page.route('**/api/health/knowledge*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { items: [], page: 1, pageSize: 10, total: 0 } }) }))

  await page.goto('/health')
  await page.getByRole('button', { name: '保存健康档案' }).click()
  await expect(page.getByRole('alert')).toContainText('档案保存失败')
  await page.getByRole('button', { name: '保存健康档案' }).click()
  await page.getByText('指标趋势', { exact: true }).click()
  await page.getByLabel(/数值/).fill('65.2')
  await page.getByRole('button', { name: '保存指标记录' }).click()
  await expect(page.getByRole('alert')).toContainText('指标保存失败')
  await page.getByRole('button', { name: '保存指标记录' }).click()
  await expect(page.getByText('65.2 kg')).toBeVisible()
  page.on('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '删除' }).click()
  await expect(page.getByRole('alert')).toContainText('指标删除失败')
  await page.getByRole('button', { name: '删除' }).click()
  await expect(page.getByText('暂无指标记录')).toBeVisible()
  await page.getByLabel('模板名称').fill('发烧期间体温')
  await page.getByLabel('指标名称').fill('体温')
  await page.getByLabel('单位').fill('℃')
  await page.getByRole('button', { name: '创建跟踪模板' }).click()
  await expect(page.getByRole('alert')).toContainText('模板创建失败')
  await page.getByRole('button', { name: '创建跟踪模板' }).click()
  await expect(page.locator('.template-item strong').filter({ hasText: '发烧期间体温' })).toBeVisible()
  await page.getByRole('button', { name: '结束跟踪' }).click()
  await expect(page.getByRole('alert')).toContainText('模板结束失败')
  await page.getByRole('button', { name: '结束跟踪' }).click()
  await expect(page.getByText(/已结束/)).toBeVisible()
  await page.getByText('AI 分析', { exact: true }).click()
  await page.getByRole('checkbox').first().check()
  await page.getByRole('textbox', { name: '补充描述' }).fill('今天有些乏力。')
  await page.getByRole('button', { name: '生成健康分析' }).click()
  await expect(page.getByRole('alert')).toContainText('分析服务暂时不可用')
  await page.getByRole('button', { name: '生成健康分析' }).click()
  await expect(page.locator('p.summary').filter({ hasText: '请先休息并观察变化。' })).toBeVisible()
})
