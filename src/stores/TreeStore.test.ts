import { beforeEach, describe, expect, it } from 'vitest'
import type { Item } from '../models/item'
import { TreeStore } from './TreeStore'

describe('TreeStore', () => {
  let items: Item[]
  let store: TreeStore

  beforeEach(() => {
    items = [
      { id: 1, parent: null, label: 'root' },
      { id: 'branch 1', parent: 1, label: 'branch 1' },
      { id: 3, parent: 1, label: 'branch 2' },
      { id: 4, parent: 'branch 1', label: 'group' },
      { id: 5, parent: 'branch 1', label: 'leaf' },
      { id: 7, parent: 4, label: 'leaf' },
      { id: 'other', parent: null, label: 'other' },
    ]

    store = new TreeStore(items)
  })

  describe('getAll', () => {
    it('Возвращает все элементы в исходном порядке', () => {
      expect(store.getAll()).toEqual(items)
    })

    it('Возвращает пустой массив для пустого TreeStore', () => {
      expect(new TreeStore([]).getAll()).toEqual([])
    })
  })

  describe('getItem', () => {
    it.each([1, 'branch 1', 7])('Находит элемент с id %s', id => {
      expect(store.getItem(id)).toEqual(items.find(item => item.id === id))
    })

    it('Возвращает undefined для неизвестного id', () => {
      expect(store.getItem('missing')).toBeUndefined()
    })

    it('Различает числовые и строковые id с одинаковым значением', () => {
      const numeric: Item = { id: 1, parent: null, label: 'number' }
      const string: Item = { id: '1', parent: null, label: 'string' }

      const mixed = new TreeStore([numeric, string])

      expect(mixed.getItem(1)).toEqual(numeric)
      expect(mixed.getItem('1')).toEqual(string)
    })
  })

  describe('getChildren', () => {
    it('Возвращает только непосредственных потомков', () => {
      expect(store.getChildren(1)).toEqual([items[1], items[2]])
      expect(store.getChildren('branch 1')).toEqual([items[3], items[4]])
    })

    it.each([7, 'missing'])('Возвращает пустой массив для id %s без потомков', id => {
      expect(store.getChildren(id)).toEqual([])
    })
  })

  describe('getAllChildren', () => {
    it('Возвращает потомков всех уровней без элемента и других веток', () => {
      const descendants = store.getAllChildren('branch 1')

      expect(descendants).toHaveLength(3)
      expect(descendants).toEqual(expect.arrayContaining([items[3], items[4], items[5]]))
    })

    it.each([7, 'missing'])('Возвращает пустой массив для id %s без потомков', id => {
      expect(store.getAllChildren(id)).toEqual([])
    })
  })

  describe('getAllParents', () => {
    it('Возвращает путь от элемента к корню в точном порядке', () => {
      expect(store.getAllParents(7)).toEqual([items[5], items[3], items[1], items[0]])
    })

    it('Возвращает корень при запросе корня', () => {
      expect(store.getAllParents(1)).toEqual([items[0]])
    })

    it('Возвращает пустой массив для неизвестного id', () => {
      expect(store.getAllParents('missing')).toEqual([])
    })
  })

  describe('setItems', () => {
    it('Полностью заменяет данные и удаляет старые связи, в том числе при повторном id', () => {
      const root: Item = { id: 1, parent: null, label: 'new root' }
      const child: Item = { id: 'new', parent: 1, label: 'new child' }

      store.setItems([root, child])

      expect(store.getAll()).toEqual([root, child])
      expect(store.getItem(1)).toEqual(root)
      expect(store.getChildren(1)).toEqual([child])
      expect(store.getAllChildren(1)).toEqual([child])
      expect(store.getAllParents('new')).toEqual([child, root])
      expect(store.getItem('branch 1')).toBeUndefined()
      expect(store.getChildren('branch 1')).toEqual([])
      expect(store.getAllParents(7)).toEqual([])
    })

    it('Очищает хранилище при передаче пустого массива', () => {
      store.setItems([])

      expect(store.getAll()).toEqual([])
      expect(store.getItem(1)).toBeUndefined()
      expect(store.getChildren(1)).toEqual([])
      expect(store.getAllChildren(1)).toEqual([])
      expect(store.getAllParents(7)).toEqual([])
    })
  })

  describe('addItem', () => {
    it('Добавляет корень в пустое хранилище', () => {
      const root: Item = { id: 0, parent: null, label: 'root' }

      const store = new TreeStore([])

      store.addItem(root)

      expect(store.getAll()).toEqual([root])
      expect(store.getItem(0)).toEqual(root)
      expect(store.getAllParents(0)).toEqual([root])
    })

    it('Добавляет потомка в конец массива и обновляет связи дерева', () => {
      const child: Item = { id: 'new', parent: 7, label: 'new leaf' }
      const original = [...store.getAll()]

      store.addItem(child)

      expect(store.getAll()).toEqual([...original, child])
      expect(store.getItem('new')).toEqual(child)
      expect(store.getChildren(7)).toEqual([child])
      expect(store.getAllChildren(1)).toContainEqual(child)
      expect(store.getAllParents('new')).toEqual([child, items[5], items[3], items[1], items[0]])
    })

    it('Работает после очистки через setItems', () => {
      const root: Item = { id: 1, parent: null, label: 'new root' }

      store.setItems([])
      store.addItem(root)

      expect(store.getAll()).toEqual([root])
      expect(store.getChildren(1)).toEqual([])
    })
  })

  describe('updateItem', () => {
    it('Заменяет объект, сохраняя порядок и количество элементов', () => {
      const updated: Item = { id: 5, parent: 'branch 1', label: 'updated leaf' }

      store.updateItem(updated)

      expect(store.getAll()).toEqual([items[0], items[1], items[2], items[3], updated, items[5], items[6]])
      expect(store.getItem(5)).toEqual(updated)
      expect(store.getChildren('branch 1')).toEqual([items[3], updated])
    })

    it('Переносит ветку к другому родителю вместе с её потомками', () => {
      const moved: Item = { id: 4, parent: 3, label: 'moved group' }

      store.updateItem(moved)

      expect(store.getChildren('branch 1')).toEqual([items[4]])
      expect(store.getChildren(3)).toEqual([moved])
      expect(store.getChildren(4)).toEqual([items[5]])
      expect(store.getAllChildren(3)).toEqual([moved, items[5]])
      expect(store.getAllParents(7)).toEqual([items[5], moved, items[2], items[0]])
    })

    it('Позволяет сделать элемент корнем', () => {
      const root: Item = { id: 4, parent: null, label: 'new root' }

      store.updateItem(root)

      expect(store.getChildren('branch 1')).toEqual([items[4]])
      expect(store.getAllParents(7)).toEqual([items[5], root])
    })

    it('Не добавляет элемент с неизвестным id', () => {
      store.updateItem({ id: 'missing', parent: null, label: 'unknown' })

      expect(store.getAll()).toEqual(items)
      expect(store.getItem('missing')).toBeUndefined()
    })
  })

  describe('removeItem', () => {
    it('Удаляет элемент, сохраняя его родителя и соседей', () => {
      store.removeItem(5)

      expect(store.getAll()).toEqual([items[0], items[1], items[2], items[3], items[5], items[6]])
      expect(store.getItem(5)).toBeUndefined()
      expect(store.getChildren('branch 1')).toEqual([items[3]])
    })

    it('Удаляет всю ветку и очищает её индексы', () => {
      store.removeItem('branch 1')

      expect(store.getAll()).toEqual([items[0], items[2], items[6]])
      expect(store.getChildren(1)).toEqual([items[2]])
      expect(store.getAllChildren(1)).toEqual([items[2]])

      for (const id of ['branch 1', 4, 5, 7]) {
        expect(store.getItem(id)).toBeUndefined()
        expect(store.getChildren(id)).toEqual([])
        expect(store.getAllChildren(id)).toEqual([])
        expect(store.getAllParents(id)).toEqual([])
      }
    })

    it('Удаляет корень с потомками, сохраняя другие корни', () => {
      store.removeItem(1)

      expect(store.getAll()).toEqual([items[6]])
      expect(store.getAllParents('other')).toEqual([items[6]])
    })

    it('Не меняет данные для неизвестного или уже удалённого id', () => {
      store.removeItem('missing')
      expect(store.getAll()).toEqual(items)

      store.removeItem(5)
      const remaining = [...store.getAll()]

      store.removeItem(5)
      expect(store.getAll()).toEqual(remaining)
    })

    it('Различает числовые и строковые id с одинаковым значением', () => {
      const numeric: Item = { id: 1, parent: null, label: 'number' }
      const string: Item = { id: '1', parent: null, label: 'string' }

      const numericChild: Item = { id: 2, parent: 1, label: 'number child' }
      const stringChild: Item = { id: 3, parent: '1', label: 'string child' }

      const mixed = new TreeStore([numeric, string, numericChild, stringChild])

      mixed.removeItem(1)

      expect(mixed.getAll()).toEqual([string, stringChild])
      expect(mixed.getChildren('1')).toEqual([stringChild])
      expect(mixed.getChildren(1)).toEqual([])
    })
  })

  it('Обходит глубокое дерево без переполнения стека', () => {
    const depth = 20000
    const chain: Item[] = Array.from({ length: depth }, (_, id) => ({
      id,
      parent: id === 0
          ? null
          : id - 1,
      label: String(id),
    }))

    const store = new TreeStore(chain)

    expect(store.getAllChildren(0)).toHaveLength(depth - 1)
    expect(store.getAllParents(depth - 1)).toEqual([...chain].reverse())

    store.removeItem(1)
    expect(store.getAll()).toEqual([chain[0]])
  })
})
