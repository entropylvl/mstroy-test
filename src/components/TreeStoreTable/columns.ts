import type { ColDef, ModelUpdatedEvent } from 'ag-grid-community'
import type { Item } from '../../models/item'
import type { TreeStore } from '../../stores/TreeStore'
import { type MaybeRefOrGetter, toValue } from 'vue'

export const defaultColDef: ColDef<Item> = { sortable: false, resizable: true }

export function createColumnDefs(store: MaybeRefOrGetter<TreeStore>): ColDef<Item>[] {
  const cellClassRules: ColDef<Item>['cellClassRules'] = {
    'tree-element-cell': ({ data }) => !!data && toValue(store).getChildren(data.id).length === 0,
  }

  return [
    {
      colId: 'rowNumber',
      headerName: '№ п/п',
      valueGetter: ({ node }) => node?.rowIndex == null
          ? ''
          : node.rowIndex + 1,
    },
    {
      colId: 'category',
      headerName: 'Категория',
      flex: 1,
      showRowGroup: true,
      cellClassRules,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        suppressCount: true
      },
      valueGetter: ({ data }) => data && toValue(store).getChildren(data.id).length > 0
        ? 'Группа'
        : 'Элемент',
    },
    {
      field: 'label',
      headerName: 'Наименование',
      flex: 2,
      cellClassRules
    },
  ]
}

export function onModelUpdated({ api }: ModelUpdatedEvent<Item>): void {
  api.refreshCells({ columns: ['rowNumber'] })
}
