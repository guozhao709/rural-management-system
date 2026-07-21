<template>
    <van-nav-bar class="nav-bar" :title="title" left-arrow @click-left="onClickLeft" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

withDefaults(defineProps<{ title?: string }>(), {
    title: "",
});

const router = useRouter();
const onClickLeft = () => {
    if (window.history.length > 1) {
        router.back();
        return;
    }
    router.push('/home');
};
</script>


