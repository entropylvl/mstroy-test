<script setup lang="ts">
import { computed } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import {
  CellStyleModule,
  ClientSideRowModelModule,
  RenderApiModule,
  themeQuartz,
  type GetRowIdParams
} from 'ag-grid-community'
import { TreeDataModule } from 'ag-grid-enterprise'
import type { Item } from '../../models/item'
import type { TreeStore } from '../../stores/TreeStore'
import { createColumnDefs, defaultColDef, onModelUpdated } from './columns'
import { getRowKey } from './utils'

const props = defineProps<{
  store: TreeStore
  loading: boolean
}>()

const modules = [
  ClientSideRowModelModule,
  RenderApiModule,
  CellStyleModule,
  TreeDataModule
]

const rowData = computed(
    () => [...props.store.getAll()]
)

const columnDefs = createColumnDefs(() => props.store)

function getRowId({ data }: GetRowIdParams<Item>): string {
  return getRowKey(data.id)
}

function getDataPath(item: Item): string[] {
  return props.store.getAllParents(item.id)
      .reverse()
      .map(parent => getRowKey(parent.id))
}
</script>

<template>
  <ag-grid-vue
    class="tree-table"
    :modules="modules"
    :theme="themeQuartz"
    :loading="loading"
    :overlay-component-params="{ loading: { overlayText: 'Загрузка…' } }"
    :row-data="rowData"
    :column-defs="columnDefs"
    :default-col-def="defaultColDef"
    :get-row-id="getRowId"
    :get-data-path="getDataPath"
    :tree-data="true"
    tree-data-display-type="custom"
    :suppress-movable-columns="true"
    @model-updated="onModelUpdated"
  />
</template>

<style scoped>
.tree-table {
  width: 100%;
  height: 100%;

  &:deep(.ag-cell) {
    font-weight: 500;
  }

  &:deep(.tree-element-cell) {
    color: #787878;
  }
}
</style>
