<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { fetchItems } from './api/items'
import { TreeStore } from './TreeStore'
import { TreeStoreTable } from './components/TreeStoreTable'

const store = reactive(new TreeStore([])) as TreeStore
const isLoading = ref(true)

onMounted(async () => {
  store.setItems(await fetchItems())
  isLoading.value = false
})
</script>

<template>
  <main>
    <TreeStoreTable
        :store="store"
        :loading="isLoading"
    />
  </main>
</template>
