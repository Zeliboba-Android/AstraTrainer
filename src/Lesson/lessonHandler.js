import { lessons } from '../LessonsScreen/lessonsData.js';
import { createLessonCommands } from './lessonCommands.js';
import { checkLesson1Completion, lesson1InitialState } from './lesson1.js';
import { checkLesson2Completion, lesson2InitialState } from './lesson2.js';
import { checkLesson3Completion, lesson3InitialState } from './lesson3.js';
import { checkLesson4Completion, lesson4InitialState } from './lesson4.js';
import { checkLesson5Completion, lesson5InitialState } from './lesson5.js';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const lessonId = parseInt(urlParams.get('lesson')) || 1;
  const lesson = lessons.find((l) => l.id === lessonId);

  // Инициализация команд и состояния
  const { commands, loadState, saveState } = createLessonCommands(lessonId);
  let state = loadState();

  // Функция инициализации файловой системы
  const initializeFileSystem = () => {
    let lessonState;

    if (lessonId === 1) {
      lessonState = lesson1InitialState;
    } else if (lessonId === 2) {
      lessonState = lesson2InitialState;
    } else if (lessonId === 3) {
      lessonState = lesson3InitialState;
    } else if (lessonId === 4) {
      lessonState = lesson4InitialState;
    }else if (lessonId === 5) {
      lessonState = lesson5InitialState;
    }

    if (!lessonState) {
      console.error(`Состояние для урока ${lessonId} не найдено`);
      return;
    }

    // Глубокая копия состояния
    state.fileSystem = JSON.parse(JSON.stringify(lessonState.fileSystem));
    state.currentPath = [...lessonState.currentPath];
    saveState(state.fileSystem, state.currentPath);
  };

  // Проверка и инициализация состояния
  if (!state.fileSystem) initializeFileSystem();

  // Элементы интерфейса
  const input = document.getElementById('command-input');
  const output = document.getElementById('terminal-output');
  const statusElement = document.getElementById('lesson-status');
  const inputPrompt = document.getElementById('input-prompt');
  // Функция обновления промпта
  const updatePrompt = () => {
    const path = state.currentPath.join('/').replace(/\/+/g, '/');
    inputPrompt.textContent = `user@astra:${path}$`;
  };
  // Проверка выполнения урока
  const checkLessonCompletion = () => {
    switch (lessonId) {
      case 1:
        const isCompleted1 = checkLesson1Completion({
          fileSystem: state.fileSystem,
          currentPath: state.currentPath,
        });
        return isCompleted1
          ? 'completed'
          : state.history.length > 0
            ? 'in-progress'
            : 'not-started';
      case 2:
        const isCompleted2 = checkLesson2Completion({
          fileSystem: state.fileSystem,
          currentPath: state.currentPath,
        });
        return isCompleted2
          ? 'completed'
          : state.history.length > 0
            ? 'in-progress'
            : 'not-started';
      case 3:
        const isCompleted3 = checkLesson3Completion({
          fileSystem: state.fileSystem,
          currentPath: state.currentPath,
          history: state.history
        });
        return isCompleted3 ? 'completed' : state.history.length > 0 ? 'in-progress' : 'not-started';
      case 4:
        const isCompleted4 = checkLesson4Completion({
          fileSystem: state.fileSystem,
          currentPath: state.currentPath,
          history: state.history
        });
        return isCompleted4
            ? 'completed'
            : state.history.length > 0
                ? 'in-progress'
                : 'not-started';
      case 5:
        const isCompleted5 = checkLesson5Completion({
          fileSystem: state.fileSystem,
          currentPath: state.currentPath,
          history: state.history
        });
        return isCompleted5
            ? 'completed'
            : state.history.length > 0
                ? 'in-progress'
                : 'not-started';
      default:
        return 'not-started';
    }
  };

  // Обновление статуса урока
  const updateLessonStatus = (commandExecuted = false) => {
    const currentStatus = checkLessonCompletion();
    let newStatus = currentStatus;

    // Упрощенная логика обновления статуса
    if (commandExecuted) {
      newStatus = currentStatus === 'completed' ? 'completed' :
          state.history.length > 0 ? 'in-progress' :
              'not-started';
    }

    // Обновление отображения
    statusElement.className = `status ${newStatus}`;
    statusElement.textContent = {
      completed: 'Выполнено',
      'in-progress': 'В процессе',
      'not-started': 'Не начат',
    }[newStatus];

    // Сохранение состояния
    localStorage.setItem(`lesson${lessonId}`, newStatus);
  };
  // Функция отрисовки истории
  const renderHistory = () => {
    output.innerHTML = state.history
      .map(
        (entry) => `
        <div class="prompt-line">
            <span class="prompt">${entry.prompt}</span>
            <span class="command">${entry.command}</span>
        </div>
        <div class="prompt-line">
            <span class="output${entry.error ? ' error' : ''}">${entry.output || ''}</span>
        </div>
    `,
      )
      .join('');
  };

  const renderSingleCommand = (entry) => {
    output.innerHTML += `
        <div class="prompt-line">
            <span class="prompt">${entry.prompt}</span>
            <span class="command">${entry.command}</span>
        </div>
        <div class="prompt-line">
            <span class="output${entry.error ? ' error' : ''}">${entry.output}</span>
        </div>
    `;
  };
  // Выполнение команд
  const executeCommand = (inputText) => {
    const [command, ...args] = inputText.trim().split(/\s+/);
    const cmd = commands[command];

    if (!cmd) {
      return {
        output: `${command}: команда не найдена`,
        error: true,
      };
    }

    try {
      const result = cmd(args, state);
      state.fileSystem = result.fileSystem ?? state.fileSystem;
      state.currentPath = result.currentPath ?? state.currentPath;
      saveState(state);
      return {
        output: result.output,
        error: result.error || false,
      };
    } catch (e) {
      return {
        output: `Ошибка выполнения: ${e.message}`,
        error: true,
      };
    }
  };

  // Обработка ввода команды
  const handleCommandInput = () => {
    const inputText = input.value.trim();
    input.value = '';
    if (!inputText) return;

    // 1. Создаем запись истории ДО выполнения команды
    const historyEntry = {
      prompt: inputPrompt.textContent,
      command: inputText,
      output: '',
      error: false,
      timestamp: Date.now(),
    };

    // 2. Добавляем в историю и сразу сохраняем
    state.history.push(historyEntry);
    saveState(state); // Первое сохранение - команда добавлена

    // 3. Выполняем команду
    const result = executeCommand(inputText);

    // 4. Обновляем запись истории
    const lastEntry = state.history[state.history.length - 1];
    lastEntry.output = result.output;
    lastEntry.error = result.error;

    // 5. Сохраняем полный результат
    saveState(state); // Второе сохранение - результат добавлен

    // 6. Мгновенное обновление интерфейса
    renderSingleCommand(lastEntry);
    updatePrompt();
    updateLessonStatus();
    output.scrollTop = output.scrollHeight;
  };

  // Обновленный обработчик сброса
  document.getElementById('reset-btn').addEventListener('click', () => {
    initializeFileSystem();
    state.history = [];
    saveState(state);
    localStorage.setItem(`lesson${lessonId}`, 'not-started');
    updateLessonStatus();
    updatePrompt();
    renderHistory(); // Очистка через перерисовку
  });

  // Настройка обработчиков событий
  const setupEventListeners = () => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleCommandInput();
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
      output.innerHTML = `<div class="prompt-line">
                <span class="prompt">user@astra:~$</span>
                <span class="output">История команд очищена</span>
            </div>`;
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
      initializeFileSystem();
      localStorage.setItem(`lesson${lessonId}`, 'not-started');
      updateLessonStatus();
      updatePrompt();
      output.innerHTML = `<div class="prompt-line">
        <span class="prompt">${inputPrompt.textContent}</span>
        <span class="output">Система сброшена</span>
    </div>`;
    });

    document.getElementById('show-hint-btn').addEventListener('click', () => {
      document.getElementById('hint-content').style.display = 'block';
    });

    document.getElementById('back-btn').addEventListener('click', () => {
      saveState(state);
      window.location.href = '../LessonsScreen/lessonsScreen.html';
    });
  };

  // Инициализация интерфейса
  const initializeUI = () => {
    if (lesson) {
      document.getElementById('lesson-title').textContent =
        `Урок ${lesson.id}: ${lesson.title}`;
      document.getElementById('task-description').textContent = lesson.task;
      document.getElementById('hint-text').textContent = lesson.hint;
    }
    updatePrompt();
    renderHistory();
    updateLessonStatus();
  };

  // Запуск приложения
  setupEventListeners();
  initializeUI();
});
