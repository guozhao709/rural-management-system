import { createApp } from 'vue'
import App from './App.vue'
import { Notify } from 'vant';
import 'vant/es/notify/style'; 
import './styles/reset.css'

import router from './router/index.js'

const app = createApp(App)
app.use(router)
app.use(Notify)
app.mount('#app')
