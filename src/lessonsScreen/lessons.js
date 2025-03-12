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
  updateLessonStatus(input);
}
// Общие обработчики
function handleKeyDown(event) {
  if (event.key === 'Enter') {
    executeCommand();
  } else if (event.key === 'Tab') {
    event.preventDefault();
  }
}
function updateLessonStatus() {
  // Получаем конфигурацию урока из глобальных переменных
  const lessonStoragePrefix = window.LESSON_STORAGE_PREFIX;
  const statusElementId = window.LESSON_STATUS_ELEMENT_ID;
  const checkFinalState = window.checkFinalState;

  if (!lessonStoragePrefix || !statusElementId || !checkFinalState) return;

  let lessonStatus = localStorage.getItem(lessonStoragePrefix + 'Status') || 'not-started';

  // Обновляем статус на 'in-progress', если урок не завершен
  if (lessonStatus !== 'completed') {
    lessonStatus = 'in-progress';
    localStorage.setItem(lessonStoragePrefix + 'Status', lessonStatus);

    const statusElement = document.getElementById(statusElementId);
    if (statusElement) {
      statusElement.textContent = 'In Progress';
      statusElement.className = 'status in-progress';
    }
  }

  // Проверяем условие завершения урока
  if (checkFinalState()) {
    lessonStatus = 'completed';
    localStorage.setItem(lessonStoragePrefix + 'Status', lessonStatus);
    showCongratulations();

    const statusElement = document.getElementById(statusElementId);
    if (statusElement) {
      statusElement.textContent = 'Completed';
      statusElement.className = 'status completed';
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  function updateLessonStatusOnPage(lessonNumber) {
    const status = localStorage.getItem(`lesson${lessonNumber}_status`) || 'not-started';
    const elementId = `lesson${lessonNumber}-status`;
    const statusElement = document.getElementById(elementId);

    if (statusElement) {
      statusElement.textContent =
        status === 'completed' ? 'Completed' :
          status === 'in-progress' ? 'In Progress' : 'Not Started';
      statusElement.className = `status ${status}`;
    }
  }

  // Обновляем статусы для всех уроков
  updateLessonStatusOnPage(1);
  updateLessonStatusOnPage(2);
  updateLessonStatusOnPage(3); // Добавьте для остальных уроков
});
function showHint(hintId) {
  const hint = document.getElementById(hintId);
  hint.style.display = hint.style.display === 'block' ? 'none' : 'block';
}