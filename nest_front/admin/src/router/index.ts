import { createRouter, createWebHistory } from 'vue-router'
import { installAuthGuard } from './guards/auth'
import { installPermissionGuard } from './guards/permission'
import { routes } from './routes'
export const router = createRouter({ history: createWebHistory(), routes })
installAuthGuard(router); installPermissionGuard(router)
