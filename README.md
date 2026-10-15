# mstroy-test

Тестовое задание MStroy: Приложение на Vue 3 TypeScript для отображения иерархических данных из класса `TreeStore`
в таблице `TreeStoreTable` на базе AG Grid.

## Запуск

```sh
npm install
npm run dev
```

## Проверка типов и сборка

```sh
npm run build
```

## Просмотр сборки

```sh
npm run preview
```

## Тесты

Все тесты:

```sh
npm test
```

Только класс `TreeStore`:

```sh
npm test -- --project unit
```

Только компонент таблицы `TreeStoreTable`:

```sh
npm test -- --project browser
```

Режим наблюдения:

```sh
npm run test:watch -- --watch
```

Для просмотра выполнения сценариев в окне Chrome:

```sh
npm run test:watch -- --watch --project browser --browser.headless=false
```

## Структура

```text
public/items.json                         # Исходные данные
src/
  api/items.ts                            # Загрузка данных с симуляцией задержки
  models/item.ts                          # Тип элемента
  stores/
    TreeStore.ts                          # Класс хранилища и операции над деревом
    TreeStore.test.ts                     # Тесты класса
  components/TreeStoreTable/
    index.vue                             # Компонент таблицы
    index.ts                              # Публичный API модуля
    columns.ts                            # Столбцы, категории и нумерация
    utils.ts                              # Формирование ключей строк
    TreeStoreTable.test.ts                # Браузерные тесты компонента
  App.vue                                 # Корневой компонент
  main.ts                                 # Точка входа
  style.css                               # Общие стили
vitest.config.ts                          # Проекты unit и browser
```
