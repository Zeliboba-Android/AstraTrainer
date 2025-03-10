const LESSON_STORAGE_PREFIX = 'lesson1_';

// Состояние урока
let lesson1Status = localStorage.getItem(LESSON_STORAGE_PREFIX + 'Status') || 'not-started';
const requiredCommands = ['cd Documents', 'mkdir MyFolder', 'ls'];
let completedCommands = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'CompletedCommands')) || [];
let currentDirectory = localStorage.getItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory') || '/';
let fileSystem = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileSystem')) || {
  '/': ['Documents', 'file1.txt', 'file2.txt'],
  '/Documents': ['file3.txt', 'file4.txt']
};

// Логика команд
function handleCommand(command) {
  let result = '';

  const [cmd, ...args] = command.split(' ');

  switch (cmd.toLowerCase()) {
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
      } else {
        result = `Directory "${newDir}" already exists.`;
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

  saveState();
  return result;
}

// Логика урока
function updateLessonStatus(command) {
  const normalizedCommand = command.trim().replace(/\s+/g, ' ').toLowerCase();
  const expectedIndex = completedCommands.length;

  if (expectedIndex >= requiredCommands.length) return;

  const expectedCommand = requiredCommands[expectedIndex].toLowerCase();

  if (normalizedCommand === expectedCommand) {
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
      localStorage.setItem(LESSON_STORAGE_PREFIX + 'CompletedCommands', JSON.stringify(completedCommands));

      if (lesson1Status === 'not-started') {
        lesson1Status = 'in-progress';
        localStorage.setItem(LESSON_STORAGE_PREFIX + 'Status', lesson1Status);
      }

      if (completedCommands.length === requiredCommands.length) {
        lesson1Status = 'completed';
        localStorage.setItem(LESSON_STORAGE_PREFIX + 'Status', lesson1Status);
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