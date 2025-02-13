let lesson1Status = localStorage.getItem('lesson1Status') || 'not-started';
const requiredCommands = ['cd Documents', 'mkdir MyFolder', 'ls'];
let completedCommands = JSON.parse(localStorage.getItem('lesson1CompletedCommands')) || [];
let currentDirectory = localStorage.getItem('currentDirectory') || '/';
let fileSystem = JSON.parse(localStorage.getItem('fileSystem')) || {
  '/': ['Documents', 'file1.txt', 'file2.txt'],
  '/Documents': ['file.pdf', 'files']
};
function saveState() {
  localStorage.setItem('currentDirectory', currentDirectory);
  localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
}
function createFireworks() {
  const colors = ['#ff0', '#f00', '#0f0', '#00f', '#fff'];
  const fireworksCount = 50;

  for (let i = 0; i < fireworksCount; i++) {
    const firework = document.createElement('div');
    firework.className = 'firework';

    // Случайная позиция по горизонтали
    const x = Math.random() * window.innerWidth;
    const y = window.innerHeight + 100;

    // Случайная задержка и продолжительность анимации
    const delay = Math.random() * 0.5;
    const duration = 1 + Math.random() * 0.5;

    firework.style.left = `${x}px`;
    firework.style.top = `${y}px`;
    firework.style.animationDelay = `${delay}s`;
    firework.style.animationDuration = `${duration}s`;
    firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    document.body.appendChild(firework);

    // Удаляем элемент после завершения анимации
    setTimeout(() => firework.remove(), (duration + 1) * 1000);
  }
}


function showHint(hintId) {
  const hint = document.getElementById(hintId);
  hint.style.display = 'block';
}

function executeCommand() {
  const input = document.getElementById('command-input').value.trim();
  const output = document.getElementById('terminal-output');

  if (input === '') {
    return; // Не выполняем ничего, если команда пустая
  }

  // Добавляем введенную команду в вывод
  output.textContent += `\n> ${input}\n`;

  // Обработка команд
  const response = handleCommand(input);
  output.textContent += response + '\n';

  // Очищаем поле ввода
  document.getElementById('command-input').value = '';

  // Прокручиваем терминал вниз
  output.scrollTop = output.scrollHeight;

  // Обновляем статус урока
  updateLessonStatus(input);
}

function clearTerminal() {
  document.getElementById('terminal-output').textContent = 'Welcome to CLI Trainer!\nType "help" for a list of commands.';
}

function handleCommand(command) {
  let result = '';

  switch (command.toLowerCase()) {
    case 'help':
      result = 'Available commands: help, cd, mkdir, ls, clear';
      break;

    case 'cd documents':
      if (currentDirectory === '/') {
        currentDirectory = '/Documents';
        result = 'Changed directory to "Documents".';
      } else {
        result = 'Directory not found.';
      }
      break;

    case 'mkdir myfolder':
      if (currentDirectory === '/Documents') {
        if (!fileSystem['/Documents'].includes('MyFolder')) {
          fileSystem['/Documents'].push('MyFolder');
          result = 'Directory "MyFolder" created.';
        } else {
          result = 'Directory already exists.';
        }
      } else {
        result = 'You must be in "Documents" to create a directory here.';
      }
      break;

    case 'ls':
      result = fileSystem[currentDirectory].join('\n');
      break;

    case 'clear':
      result = '';
      break;

    default:
      result = `Command not found: ${command}`;
  }

  // Сохраняем состояние после каждой команды
  saveState();
  return result;
}
function updateLessonStatus(command) {
  const normalizedCommand = command.trim().replace(/\s+/g, ' ').toLowerCase();
  const expectedIndex = completedCommands.length;

  if (expectedIndex >= requiredCommands.length) return;

  const expectedCommand = requiredCommands[expectedIndex].toLowerCase();

  if (normalizedCommand === expectedCommand) {
    // Проверяем состояние системы для критических команд
    let isValid = true;

    switch (expectedCommand) {
      case 'cd documents':
        isValid = currentDirectory === '/Documents';
        break;
      case 'mkdir myfolder':
        isValid = fileSystem['/Documents'].includes('MyFolder');
        break;
      case 'ls':
        isValid = currentDirectory === '/Documents' &&
          fileSystem['/Documents'].includes('MyFolder');
        break;
    }

    if (isValid) {
      completedCommands.push(requiredCommands[expectedIndex]);
      localStorage.setItem('lesson1CompletedCommands', JSON.stringify(completedCommands));

      // Обновляем статус урока
      if (lesson1Status === 'not-started') {
        lesson1Status = 'in-progress';
        localStorage.setItem('lesson1Status', lesson1Status);
      }

      if (completedCommands.length === requiredCommands.length) {
        lesson1Status = 'completed';
        localStorage.setItem('lesson1Status', lesson1Status);
        createFireworks();
        showCongratulations();
      }

      const statusElement = document.getElementById('lesson1-status');
      if (statusElement) {
        statusElement.textContent = lesson1Status === 'completed' ? 'Completed' : 'In Progress';
        statusElement.className = `status ${lesson1Status}`;
      }
    }
  }
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
  congrats.style.animation = 'zoomInOut 4s forwards'; // Добавили forwards
  congrats.style.pointerEvents = 'none'; // Чтобы текст не мешал взаимодействию

  document.body.appendChild(congrats);

  // Удаляем сообщение только после завершения анимации
  setTimeout(() => {
    congrats.remove();
  }, 4000); // Время должно совпадать с продолжительностью анимации
}
document.addEventListener('DOMContentLoaded', function() {
  // Восстанавливаем состояние
  currentDirectory = localStorage.getItem('currentDirectory') || '/';
  fileSystem = JSON.parse(localStorage.getItem('fileSystem')) || {
    '/': ['Documents', 'file1.txt', 'file2.txt'],
    '/Documents': []
  };

  // Восстанавливаем статус урока
  const statusElement = document.getElementById('lesson1-status');
  if (statusElement) {
    const savedStatus = localStorage.getItem('lesson1Status') || 'not-started';
    const completed = JSON.parse(localStorage.getItem('lesson1CompletedCommands')) || [];

    let displayStatus = savedStatus;
    if (completed.length === requiredCommands.length) {
      displayStatus = 'completed';
    } else if (completed.length > 0) {
      displayStatus = 'in-progress';
    }

    statusElement.textContent =
      displayStatus === 'completed' ? 'Completed' :
        displayStatus === 'in-progress' ? 'In Progress' : 'Not Started';
    statusElement.className = `status ${displayStatus}`;
  }
});
function resetLesson() {
  currentDirectory = '/';
  fileSystem['/'] = ['Documents', 'file1.txt', 'file2.txt'];
  fileSystem['/Documents'] = [];
  completedCommands = [];
  lesson1Status = 'not-started';

  localStorage.removeItem('currentDirectory');
  localStorage.removeItem('fileSystem');
  localStorage.removeItem('lesson1Status');
  localStorage.removeItem('lesson1CompletedCommands');

  const statusElement = document.getElementById('lesson1-status');
  if (statusElement) {
    statusElement.textContent = 'Not Started';
    statusElement.className = 'status not-started';
  }

  clearTerminal();
}