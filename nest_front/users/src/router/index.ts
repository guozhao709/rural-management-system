import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { installAuthGuard } from './guards/auth'

export const router = createRouter({ history: createWebHistory(), routes })

installAuthGuard(router)
