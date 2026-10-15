export interface Item {
  id: number | string
  parent: Item['id'] | null
  label: string
}
