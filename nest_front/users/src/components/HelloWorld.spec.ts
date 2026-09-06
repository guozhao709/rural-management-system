import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import HelloWorld from './HelloWorld.vue'

enableAutoUnmount(afterEach)

// 验证现有模板的公开交互；页面替换时随功能更新此用例。
describe('HelloWorld', () => {
  it('increments the visible count and isolates component instances', async () => {
    const first = mount(HelloWorld)
    const second = mount(HelloWorld)
    const button = first.get('button')
    expect(button.text()).toBe('Count is 0')
    await button.trigger('click')
    await button.trigger('click')
    expect(button.text()).toBe('Count is 2')
    expect(second.get('button').text()).toBe('Count is 0')
  })
})
