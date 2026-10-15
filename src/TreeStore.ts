import type { Item } from './api/items'

export class TreeStore {
  private items: Item[] = []
  private readonly itemsById = new Map<Item['id'], Item>()
  private readonly childrenByParent = new Map<Item['id'], Item[]>()

  constructor(items: Item[]) {
    this.setItems(items)
  }

  private indexItem(item: Item): void {
    this.itemsById.set(item.id, item)

    if (item.parent !== null) {
      const children = this.childrenByParent.get(item.parent)

      children
          ? children.push(item)
          : this.childrenByParent.set(item.parent, [item])
    }
  }

  setItems(items: Item[]): void {
    this.items = items
    this.itemsById.clear()
    this.childrenByParent.clear()

    for (const item of items) {
      this.indexItem(item)
    }
  }

  addItem(item: Item): void {
    this.items.push(item)
    this.indexItem(item)
  }

  updateItem(item: Item): void {
    if (!this.getItem(item.id)) {
      return
    }

    this.setItems(this.items.map(current => current.id === item.id
        ? item
        : current
    ))
  }

  removeItem(id: Item['id']): void {
    if (!this.getItem(id)) {
      return
    }

    const removedIds = new Set<Item['id']>([id])

    for (const item of this.getAllChildren(id)) {
      removedIds.add(item.id)
    }

    this.setItems(this.items.filter(item => !removedIds.has(item.id)))
  }

  getAll(): Item[] {
    return this.items
  }

  getItem(id: Item['id']): Item | undefined {
    return this.itemsById.get(id)
  }

  getChildren(id: Item['id']): Item[] {
    return this.childrenByParent.get(id) ?? []
  }

  getAllChildren(id: Item['id']): Item[] {
    const descendants = [...this.getChildren(id)]

    for (const item of descendants) {
      for (const child of this.getChildren(item.id)) {
        descendants.push(child)
      }
    }

    return descendants
  }

  getAllParents(id: Item['id']): Item[] {
    const path: Item[] = []
    let item = this.getItem(id)

    while (item) {
      path.push(item)
      item = item.parent === null
          ? undefined
          : this.getItem(item.parent)
    }

    return path
  }
}
