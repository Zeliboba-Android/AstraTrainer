const LESSON_STORAGE_PREFIX = 'lesson1_';
window.LESSON_STORAGE_PREFIX = 'lesson1_';
window.LESSON_STATUS_ELEMENT_ID = 'lesson1-status';
// Состояние урока
let lesson1Status = localStorage.getItem(LESSON_STORAGE_PREFIX + 'Status') || 'not-started';
const requiredCommands = ['cd Documents', 'mkdir MyFolder', 'ls'];
let completedCommands = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'CompletedCommands')) || [];
let currentDirectory = localStorage.getItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory') || '/';
let fileSystem = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileSystem')) || {
  '/': ['Documents', 'file1.txt', 'file2.txt'],
  '/Documents': ['file3.txt', 'file4.txt']
};

function handleCommand(command) {
  let result = '';
  const [cmd, ...args] = command.split(' ');

  // Проверяем команду (чувствительно к регистру)
  switch (cmd) { // Убрали .toLowerCase() для команды
    case 'help':
      result = 'Available commands: help, cd, mkdir, ls, clear';
      break;

    case 'cd':
      if (args.length === 0) {
        result = 'Usage: cd <directory>';
        break;
      }

      const targetDir = args[0];
      const newPath = currentDirectory === '/' ? `/${targetDir}` : `${currentDirectory}/${targetDir}`;

      if (fileSystem[newPath]) {
        currentDirectory = newPath;
        result = `Changed directory to "${targetDir}".`;

        // Нормализуем команду: команда в нижнем регистре, аргумент — как есть
        const normalizedCdCommand = `cd ${targetDir}`;
        if (requiredCommands.includes(normalizedCdCommand) && !completedCommands.includes(normalizedCdCommand)) {
          completedCommands.push(normalizedCdCommand);
          localStorage.setItem(LESSON_STORAGE_PREFIX + 'CompletedCommands', JSON.stringify(completedCommands));
        }
      } else {
        result = `Directory "${targetDir}" not found.`;
      }
      break;

    case 'mkdir':
      if (args.length === 0) {
        result = 'Usage: mkdir <directory>';
        break;
      }

      const newDir = args[0];
      const newDirPath = currentDirectory === '/' ? `/${newDir}` : `${currentDirectory}/${newDir}`;

      if (!fileSystem[newDirPath]) {
        fileSystem[newDirPath] = [];
        fileSystem[currentDirectory].push(newDir);
        result = `Directory "${newDir}" created.`;

        // Нормализуем команду: команда в нижнем регистре, аргумент — как есть
        const normalizedMkdirCommand = `mkdir ${newDir}`;
        if (currentDirectory === '/Documents' && requiredCommands.includes(normalizedMkdirCommand) && !completedCommands.includes(normalizedMkdirCommand)) {
          completedCommands.push(normalizedMkdirCommand);
          localStorage.setItem(LESSON_STORAGE_PREFIX + 'CompletedCommands', JSON.stringify(completedCommands));
        }
      } else {
        result = `Directory "${newDir}" already exists.`;
      }
      break;

    case 'ls':
      result = fileSystem[currentDirectory].join('\n');

      // Добавляем команду ls в completedCommands только если:
      // 1. Текущая директория — /Documents.
      // 2. Папка MyFolder уже создана.
      if (currentDirectory === '/Documents' && fileSystem['/Documents'].includes('MyFolder')) {
        const normalizedCommand = 'ls';
        if (requiredCommands.includes(normalizedCommand) && !completedCommands.includes(normalizedCommand)) {
          completedCommands.push(normalizedCommand);
          localStorage.setItem(LESSON_STORAGE_PREFIX + 'CompletedCommands', JSON.stringify(completedCommands));
        }
      }
      break;

    case 'clear':
      result = '';
      break;

    default:
      result = `Command not found: ${command}`;
  }

  saveState();
  return result;
}

// Логика урока
function checkFinalState() {
  const requiredCommands = ['cd Documents', 'mkdir MyFolder', 'ls'];
  const completedCommands = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'CompletedCommands')) || [];

  // Проверяем, выполнены ли все команды
  if (completedCommands.length !== requiredCommands.length) {
    console.log('Не все команды выполнены');
    console.log('Выполнено:', completedCommands.length, 'из', requiredCommands.length);
    return false;
  }

  // Проверяем состояние файловой системы
  const isInDocumentsDir = currentDirectory === '/Documents';
  const isMyFolderCreated = fileSystem['/Documents'].includes('MyFolder');

  // Проверяем, была ли выполнена команда ls
  const isLsCommandExecuted = completedCommands.includes('ls');

  // Урок завершён, если все условия выполнены
  return isInDocumentsDir && isMyFolderCreated && isLsCommandExecuted;
}

window.checkFinalState = checkFinalState; // Экспортируем функцию
// Специфичные функции урока
function resetLesson() {
  currentDirectory = '/';
  fileSystem = {
    '/': ['Documents', 'file1.txt', 'file2.txt'],
    '/Documents': ['file3.txt', 'file4.txt']
  };
  completedCommands = [];
  lesson1Status = 'not-started';

  localStorage.removeItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory');
  localStorage.removeItem(LESSON_STORAGE_PREFIX + 'FileSystem');
  localStorage.removeItem(LESSON_STORAGE_PREFIX + 'Status');
  localStorage.removeItem(LESSON_STORAGE_PREFIX + 'CompletedCommands');

  const statusElement = document.getElementById('lesson1-status');
  if (statusElement) {
    statusElement.textContent = 'Not Started';
    statusElement.className = 'status not-started';
  }

  clearTerminal();
  const hint = document.getElementById('hint1');
  if (hint) {
    hint.style.display = 'none';
  }
}

// Инициализация урока
document.addEventListener('DOMContentLoaded', function () {
  currentDirectory = localStorage.getItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory') || '/';
  fileSystem = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileSystem')) || {
    '/': ['Documents', 'file1.txt', 'file2.txt'],
    '/Documents': ['file3.txt', 'file4.txt']
  };

  const statusElement = document.getElementById('lesson1-status');
  if (statusElement) {
    const savedStatus = localStorage.getItem(LESSON_STORAGE_PREFIX + 'Status') || 'not-started';
    const completed = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'CompletedCommands')) || [];

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