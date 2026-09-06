<template><main class="page"><h1>管理员权限页</h1><p>仅 super_admin 可以进入此路由。管理员管理功能将在相应业务模块中实现。</p><RouterLink :to="{ name: 'admin-dashboard' }">返回工作台</RouterLink></main></template>
<style scoped>.page { padding: 48px; }.page h1 { color: var(--color-text-primary); }.page p { color: var(--color-text-secondary); }</style>
