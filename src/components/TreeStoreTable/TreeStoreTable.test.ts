import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, reactive, ref, shallowRef, type App } from 'vue'
import type { Item } from '../../models/item'
import { TreeStore } from '../../stores/TreeStore'
import TreeStoreTable from './index.vue'

function createItems(): Item[] {
  return [
    { id: 1, parent: null, label: 'root 1' },
    { id: 'branch', parent: 1, label: 'branch' },
    { id: 3, parent: 1, label: 'leaf 1' },
    { id: 4, parent: 'branch', label: 'leaf 2' },
    { id: 'other', parent: null, label: 'root 2' },
  ]
}

let app: App | undefined
let container: HTMLDivElement

function mountTable(items = createItems(), initLoading = false) {
  const store = reactive(new TreeStore(items)) as TreeStore
  const activeStore = shallowRef(store)

  const loading = ref(initLoading)

  container = document.createElement('div')
  container.style.cssText = 'width: 900px; height: 600px;'

  document.body.append(container)

  app = createApp({
    setup: () => () => h(
        TreeStoreTable,
        {
          store: activeStore.value,
          loading: loading.value,
        }
    ),
  })
  app.mount(container)

  return {
    store,
    activeStore,
    loading
  }
}

afterEach(() => {
  app?.unmount()
  app = undefined
  container?.remove()
})

function rows(): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[role="row"][row-index]')]
    .sort((a, b) => Number(a.getAttribute('row-index')) - Number(b.getAttribute('row-index')))
}

function cell(row: HTMLElement, column: string): HTMLElement {
  const result = row.querySelector<HTMLElement>(`[col-id="${column}"]`)

  if (!result) {
    throw new Error(` ${column} cell not found`)
  }

  return result
}

function rowByLabel(label: string): HTMLElement {
  const result = rows()
      .find(row => cell(row, 'label').textContent?.trim() === label)

  if (!result) {
    throw new Error(`${label} row not found`)
  }

  return result
}

async function expectRows(labels: string[]): Promise<void> {
  await vi.waitFor(() => {
    expect(rows().map(row => cell(row, 'label').textContent?.trim())).toEqual(labels)

    for (const row of rows()) {
      expect(cell(row, 'category').textContent?.trim()).toMatch(/^(Группа|Элемент)$/)
    }
  }, { timeout: 3000 })
}

function toggleGroup(label: string): void {
  cell(rowByLabel(label), 'category').dispatchEvent(new MouseEvent('dblclick'))
}

describe('TreeStoreTable', () => {
  it('Отображает столбцы в заданном порядке', async () => {
    mountTable()

    await expectRows(['root 1', 'root 2'])

    const headers = container.querySelectorAll('.ag-header-cell-text')
    expect([...headers].map(header => header.textContent)).toEqual(['№ п/п', 'Категория', 'Наименование'])
  })

  it('Показывает только корни до раскрытия и определяет категории по наличию потомков', async () => {
    mountTable()

    await expectRows(['root 1', 'root 2'])

    const root1 = rowByLabel('root 1')
    const root2 = rowByLabel('root 2')

    expect(root1.getAttribute('aria-expanded')).toBe('false')
    expect(root2.hasAttribute('aria-expanded')).toBe(false)

    expect(cell(root1, 'category').textContent?.trim()).toBe('Группа')
    expect(cell(root2, 'category').textContent?.trim()).toBe('Элемент')
  })

  it('Раскрывает вложенные группы и пересчитывает номера', async () => {
    mountTable()

    await expectRows(['root 1', 'root 2'])

    toggleGroup('root 1')
    await expectRows(['root 1', 'branch', 'leaf 1', 'root 2'])

    toggleGroup('branch')
    await expectRows(['root 1', 'branch', 'leaf 2', 'leaf 1', 'root 2'])
    await vi.waitFor(() => {
      expect(rows().map(row => cell(row, 'rowNumber').textContent)).toEqual(['1', '2', '3', '4', '5'])
    })

    toggleGroup('root 1')
    await expectRows(['root 1', 'root 2'])
    await vi.waitFor(() => {
      expect(rows().map(row => cell(row, 'rowNumber').textContent)).toEqual(['1', '2'])
    })
  })

  it('Показывает загрузку, затем строки после setItems', async () => {
    const { store, loading } = mountTable([], true)

    await vi.waitFor(() => expect(container.textContent).toContain('Загрузка…'))
    expect(rows()).toHaveLength(0)

    store.setItems(createItems())
    loading.value = false

    await expectRows(['root 1', 'root 2'])
    await vi.waitFor(() => expect(container.textContent).not.toContain('Загрузка…'))
  })

  it('Отображает пустое хранилище без строк и индикатора загрузки', async () => {
    mountTable([])
    await vi.waitFor(() => expect(container.querySelector('.ag-overlay-no-rows-center')).not.toBeNull())

    expect(rows()).toHaveLength(0)
    expect(container.textContent).not.toContain('Загрузка…')
  })

  it('Реагирует на добавление потомка и меняет категорию бывшего листа на группу', async () => {
    const { store } = mountTable()

    await expectRows(['root 1', 'root 2'])

    store.addItem({ id: 'new', parent: 'other', label: 'new leaf' })

    const root2 = rowByLabel('root 2')

    await vi.waitFor(() => {
      expect(cell(root2, 'category').textContent?.trim()).toBe('Группа')
      expect(cell(root2, 'label').classList.contains('tree-element-cell')).toBe(false)
    })

    toggleGroup('root 2')
    await expectRows(['root 1', 'root 2', 'new leaf'])
  })

  it('Показывает новое наименование после updateItem', async () => {
    const { store } = mountTable()

    await expectRows(['root 1', 'root 2'])

    store.updateItem({ id: 'other', parent: null, label: 'root updated' })

    await expectRows(['root 1', 'root updated'])
  })

  it('Перестраивает иерархию при смене родителя через updateItem', async () => {
    const { store } = mountTable()

    await expectRows(['root 1', 'root 2'])

    toggleGroup('root 1')
    await expectRows(['root 1', 'branch', 'leaf 1', 'root 2'])

    store.updateItem({ id: 'branch', parent: 'other', label: 'branch' })
    await expectRows(['root 1', 'leaf 1', 'root 2'])

    toggleGroup('root 2')
    await expectRows(['root 1', 'leaf 1', 'root 2', 'branch'])

    toggleGroup('branch')
    await expectRows(['root 1', 'leaf 1', 'root 2', 'branch', 'leaf 2'])
  })

  it('Удаляет из таблицы ветку вместе с потомками', async () => {
    const { store } = mountTable()

    await expectRows(['root 1', 'root 2'])

    toggleGroup('root 1')
    await expectRows(['root 1', 'branch', 'leaf 1', 'root 2'])

    toggleGroup('branch')
    await expectRows(['root 1', 'branch', 'leaf 2', 'leaf 1', 'root 2'])

    store.removeItem('branch')

    await expectRows(['root 1', 'leaf 1', 'root 2'])
  })

  it('Обновляет категорию после удаления последнего потомка', async () => {
    const { store } = mountTable()

    await expectRows(['root 1', 'root 2'])

    store.removeItem('branch')
    store.removeItem(3)

    await vi.waitFor(() => {
      const root = rowByLabel('root 1')

      expect(cell(root, 'category').textContent?.trim()).toBe('Элемент')
      expect(root.hasAttribute('aria-expanded')).toBe(false)
    })
  })

  it('Полностью заменяет строки при setItems', async () => {
    const { store } = mountTable()

    await expectRows(['root 1', 'root 2'])

    store.setItems([{ id: 'replacement', parent: null, label: 'replacement' }])
    await expectRows(['replacement'])

    store.setItems([])
    await expectRows([])
  })

  it('Использует актуальное хранилище при смене prop store', async () => {
    const { activeStore } = mountTable()

    await expectRows(['root 1', 'root 2'])

    activeStore.value = new TreeStore([
      { id: 1, parent: null, label: 'replacement' },
      { id: 'other', parent: 1, label: 'child' },
    ])

    await expectRows(['replacement'])
    expect(cell(rowByLabel('replacement'), 'category').textContent?.trim()).toBe('Группа')

    toggleGroup('replacement')
    await expectRows(['replacement', 'child'])
  })

  it('Различает числовой и строковый id с одинаковым значением', async () => {
    mountTable([
      { id: 1, parent: null, label: 'numeric root' },
      { id: '1', parent: null, label: 'string root' },
      { id: 2, parent: 1, label: 'numeric child' },
      { id: 3, parent: '1', label: 'string child' },
    ])

    await expectRows(['numeric root', 'string root'])

    toggleGroup('numeric root')
    await expectRows(['numeric root', 'numeric child', 'string root'])

    toggleGroup('string root')
    await expectRows(['numeric root', 'numeric child', 'string root', 'string child'])
  })
})
