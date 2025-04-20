// lessons.js (общие функции)
function saveState() {
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory', currentDirectory);
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'FileSystem', JSON.stringify(fileSystem));
}

function clearTerminal() {
  const output = document.getElementById('terminal-output');
  output.innerHTML = `
    <div class="prompt-line">
      <span class="prompt">user@astra:~$</span>
      <span class="output"> Welcome to Astra CLI Trainer!</span>
    </div>
    <div class="prompt-line">
      <span class="prompt">user@astra:~$</span>
      <span class="output"> Type 'help' for available commands</span>
    </div>
  `;
}

function formatPath(path) {
  return path === '/' ? '~' : path.replace(/^\/?(\w+)/, '~/$1');
}

function showCongratulations() {
  const congrats = document.createElement('div');
  congrats.textContent = '🎉 Congratulations! Lesson Completed! 🎉';
  congrats.style.position = 'fixed';
  congrats.style.top = '50%';
  congrats.style.left = '50%';
  congrats.style.transform = 'translate(-50%, -50%)';
  congrats.style.fontSize = '2em';
  congrats.style.color = '#fff';
  congrats.style.textShadow = '0 0 10px #000';
  congrats.style.zIndex = '10000';
  congrats.style.animation = 'zoomInOut 4s forwards';
  congrats.style.pointerEvents = 'none';

  document.body.appendChild(congrats);

  setTimeout(() => {
    congrats.remove();
  }, 4000);
}
function executeCommand() {
  const input = document.getElementById('command-input').value.trim();
  const output = document.getElementById('terminal-output');

  if (!input) return;

  const promptLine = document.createElement('div');
  promptLine.className = 'prompt-line';
  promptLine.innerHTML = `
    <span class="prompt">user@astra:${formatPath(currentDirectory)}$</span>
    <span class="command">${input}</span>
  `;
  output.appendChild(promptLine);

  const response = handleCommand(input);

  const outputLine = document.createElement('div');
  outputLine.className = 'output';
  outputLine.textContent = response;
  output.appendChild(outputLine);

  output.scrollTop = output.scrollHeight;
  document.getElementById('command-input').value = '';

  // Проверяем, является ли команда релевантной
  const isRelevantCommand = window.isRelevantCommand ? window.isRelevantCommand(input) : false;

  // Обновляем статус урока, если CURRENT_LESSON_ID определен
  if (window.CURRENT_LESSON_ID) {
    updateLessonStatus(window.CURRENT_LESSON_ID, isRelevantCommand);
  }
}
// Общие обработчики
function handleKeyDown(event) {
  if (event.key === 'Enter') {
    executeCommand();
  } else if (event.key === 'Tab') {
    event.preventDefault();
  }
}
function updateLessonStatus(lessonId, isRelevantCommand = false) {
  const lessonStoragePrefix = `lesson${lessonId}-`;
  const statusElementId = `lesson${lessonId}-status`;

  if (typeof window.checkFinalState !== 'function') {
    console.error('checkFinalState is not defined for this lesson');
    return;
  }

  let lessonStatus = localStorage.getItem(lessonStoragePrefix + 'Status') || 'not-started';

  // Обновляем статус на 'in-progress' только если команда релевантна
  if (lessonStatus !== 'completed' && isRelevantCommand) {
    lessonStatus = 'in-progress';
    localStorage.setItem(lessonStoragePrefix + 'Status', lessonStatus);

    const statusElement = document.getElementById(statusElementId);
    if (statusElement) {
      statusElement.textContent = 'In Progress';
      statusElement.className = 'status in-progress';
    }
  }

  // Проверяем условие завершения урока
  if (window.checkFinalState()) {
    lessonStatus = 'completed';
    localStorage.setItem(lessonStoragePrefix + 'Status', lessonStatus);
    showCongratulations();

    const statusElement = document.getElementById(statusElementId);
    if (statusElement) {
      statusElement.textContent = 'Completed';
      statusElement.className = 'status completed';
    }

    // Триггерим событие для обновления списка уроков
    const event = new StorageEvent('storage', {
      key: lessonStoragePrefix + 'Status',
      newValue: lessonStatus
    });
    window.dispatchEvent(event);
  }
}
function updateAllLessonStatuses() {
  const lessons = [
    { id: 1, elementId: 'lesson1-status' },
    { id: 2, elementId: 'lesson2-status' },
    { id: 3, elementId: 'lesson3-status' },
    { id: 4, elementId: 'lesson4-status' },
    { id: 5, elementId: 'lesson5-status' }
    // Добавьте другие уроки по мере необходимости
  ];

  lessons.forEach(lesson => {
    const status = localStorage.getItem(`lesson${lesson.id}-Status`) || 'not-started';
    const statusElement = document.getElementById(lesson.elementId);
    if (statusElement) {
      statusElement.textContent =
        status === 'completed' ? 'Completed' :
          status === 'in-progress' ? 'In Progress' : 'Not Started';
      statusElement.className = `status ${status}`;
    }
  });
}

// Обновляем статусы при загрузке страницы
document.addEventListener('DOMContentLoaded', updateAllLessonStatuses);

// Отслеживаем изменения в localStorage
window.addEventListener('storage', function(e) {
  if (e.key.includes('-Status')) {
    updateAllLessonStatuses();
  }
});
function resetLesson(lessonId) {
  // Сбрасываем состояние урока
  currentDirectory = '/';

  // Устанавливаем начальную файловую систему в зависимости от урока
  if (lessonId === 1) {
    fileSystem = {
      '/': ['Documents', 'file1.txt', 'file2.txt'],
      '/Documents': ['file3.txt', 'file4.txt']
    };
  } else if (lessonId === 2) {
    fileSystem = {
      '/': ['Documents', 'Backup'],
      '/Documents': [],
      '/Backup': []
    };
  } else if (lessonId === 3) {
    fileSystem = {
      '/': ['Documents'],
      '/Documents': []
    };
  } else if (lessonId === 4) {
    fileSystem = {
      '/': ['Documents'],
      '/Documents': []
    };
  }

  completedCommands = [];
  const lessonStoragePrefix = `lesson${lessonId}-`;

  // Удаляем данные урока из localStorage
  localStorage.removeItem(lessonStoragePrefix + 'CurrentDirectory');
  localStorage.removeItem(lessonStoragePrefix + 'FileSystem');
  localStorage.removeItem(lessonStoragePrefix + 'Status');
  localStorage.removeItem(lessonStoragePrefix + 'CompletedCommands');

  // Устанавливаем статус урока в 'not-started'
  localStorage.setItem(lessonStoragePrefix + 'Status', 'not-started');

  // Обновляем статус внутри урока
  const statusElement = document.getElementById(`lesson${lessonId}-status`);
  if (statusElement) {
    statusElement.textContent = 'Not Started';
    statusElement.className = 'status not-started';
  }

  // Очищаем терминал
  clearTerminal();

  // Скрываем все подсказки
  document.querySelectorAll('.hint').forEach(h => h.style.display = 'none');

  // Триггерим событие для обновления статуса на lessons.html
  const event = new StorageEvent('storage', {
    key: lessonStoragePrefix + 'Status',
    newValue: 'not-started'
  });
  window.dispatchEvent(event);
}
// Обновляем статусы при загрузке страницы
document.addEventListener('DOMContentLoaded', updateAllLessonStatuses);

// Отслеживаем изменения в localStorage
window.addEventListener('storage', function(e) {
  if (e.key.includes('-Status')) {
    updateAllLessonStatuses();
  }
});
function showHint(hintId) {
  const hint = document.getElementById(hintId);
  hint.style.display = hint.style.display === 'block' ? 'none' : 'block';
}
function appendOutput(text, type = 'output') {
  const outputDiv = document.getElementById('terminal-output');
  const promptLine = document.createElement('div');
  promptLine.className = 'prompt-line';

  let outputClass = 'output';
  if (type === 'error') outputClass += ' error';
  if (type === 'success') outputClass += ' success';
  if (type === 'command') outputClass += ' command';

  promptLine.innerHTML = `
        <span class="prompt">user@astra:~$</span>
        <span class="${outputClass}">${text}</span>
    `;

  outputDiv.appendChild(promptLine);
  outputDiv.scrollTop = outputDiv.scrollHeight;
}