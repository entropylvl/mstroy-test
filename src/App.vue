<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchItems, type Item } from './api/items'

const items = ref<Item[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    items.value = await fetchItems()
  } catch (cause) {
    error.value = cause instanceof Error
        ? cause.message
        : 'Не удалось загрузить элементы'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <main>
    <p v-if="isLoading">Загрузка…</p>
    <p v-else-if="error">{{ error }}</p>
    <ul v-else>
      <li v-for="item in items" :key="item.id">
        {{ item.label }}
      </li>
    </ul>
  </main>
</template>
