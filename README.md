# Документация к веб-тренажеру по Linux-командам

## 1. Введение

Веб-тренажер предназначен для изучения базовых команд Linux через интерактивный терминал.
Цели:

Освоить навигацию в файловой системе.

Научиться работать с файлами и директориями.

Понять основы текстовой обработки и сетевой диагностики.

## 2. Установка и запуск

Зависимости:

Веб-браузер (Chrome, Firefox, Edge).

Локальный сервер (например, Live Server в VS Code).

Запуск:

Склонируйте репозиторий.

Запустите View.html.

## 3. Интерфейс

Терминал: Основное окно для ввода команд.

### Кнопки:

Lessons — переход к списку уроков.

Back — возврат на главный экран.

Reset Lesson — сброс текущего урока.

Clear — очистка терминала.

Подсказки: Нажмите кнопку "Показать подсказку" для получения совета.
## 4. Список уроков
### Урок 1: Навигация в файловой системе

Задача: Перейти в папку Documents, создать директорию MyFolder, вывести список содержимого.

Пример команд:

bash
cd Documents
mkdir MyFolder
ls

### Урок 2: Управление файлами

Задача: Изучить команды cp, mv, rm.

### Урок 3: Работа с содержимым файлов

Задача: Использовать cat, echo, head, tail.

### Урок 4: Обработка текста

Задача: Применить grep, sort, cut.

### Урок 5: Сеть и логи

Задача: Использовать ping, ifconfig, wc.

## 5. Сброс прогресса

Для урока: Нажмите Reset Lesson в интерфейсе урока.

### Полный сброс:

Откройте консоль браузера (F12).

Введите:
```
localStorage.clear();
location.reload();
```