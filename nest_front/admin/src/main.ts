import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import { configureAuthentication } from './app/bootstrap'
import { router } from './router'

const app = createApp(App); const pinia = createPinia(); app.use(pinia); app.use(router); app.use(ElementPlus); configureAuthentication(pinia, router); app.mount('#app')
