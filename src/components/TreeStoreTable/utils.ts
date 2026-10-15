import type { Item } from '../../models/item'

export function getRowKey(id: Item['id']): string {
  return `${typeof id}:${id}`
}
