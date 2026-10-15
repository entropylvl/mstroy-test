export interface Item {
  id: number | string
  parent: Item['id'] | null
  label: string
}

export async function fetchItems(): Promise<Item[]> {
  await new Promise<void>((resolve) => setTimeout(resolve, 2000))

  const response = await fetch(`${import.meta.env.BASE_URL}items.json`)

  if (!response.ok) {
    throw new Error(`Не удалось загрузить элементы: HTTP ${response.status}`)
  }

  return response.json()
}
