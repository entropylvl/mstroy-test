import type { Item } from '../../api/items'

export function getRowKey(id: Item['id']): string {
  return `${typeof id}:${id}`
}
