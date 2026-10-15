import type { ColDef, ModelUpdatedEvent } from 'ag-grid-community'
import type { Item } from '../../models/item'
import type { TreeStore } from '../../stores/TreeStore'
import { type MaybeRefOrGetter, toValue } from 'vue'

export const defaultColDef: ColDef<Item> = { sortable: false, resizable: true }

export function createColumnDefs(store: MaybeRefOrGetter<TreeStore>): ColDef<Item>[] {
  function isGroup(item: Item): boolean {
    return toValue(store).getChildren(item.id).length > 0
  }

  const cellClassRules: ColDef<Item>['cellClassRules'] = {
    'tree-element-cell': ({ data }) => !!data && !isGroup(data),
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
      valueGetter: ({ data }) => data && isGroup(data)
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
