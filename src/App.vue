<template>
  <div class="pt-[8%]">
    <router-view />
    <!-- 只在特定页面显示底部导航栏 -->
    <BottomNavigation v-if="showBottomNav" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNavigation from '@/components/BottomNavigation.vue'

const route = useRoute()

// 定义需要显示底部导航栏的页面
const showBottomNav = computed(() => {
  const pagesWithBottomNav = ['/home', '/settings', '/debug']
  return pagesWithBottomNav.includes(route.path)
})
</script>

<style scoped></style>
