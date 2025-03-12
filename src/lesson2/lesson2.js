const LESSON_STORAGE_PREFIX = 'lesson2_';
window.LESSON_STORAGE_PREFIX = 'lesson2_';
window.LESSON_STATUS_ELEMENT_ID = 'lesson2-status';
window.CURRENT_LESSON_ID = 2;
// Состояние урока
let lesson2Status = localStorage.getItem(LESSON_STORAGE_PREFIX + 'Status') || 'not-started';
let completedCommands = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'CompletedCommands')) || [];
let currentDirectory = localStorage.getItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory') || '/';
let fileSystem = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileSystem')) || {
  '/': ['Documents', 'Backup'],
  '/Documents': [],
  '/Backup': []
};

// Функция разрешения пути
function resolvePath(path) {
  if (path.startsWith('/')) return path;
  let current = currentDirectory;
  const parts = path.split('/').filter(p => p !== '');
  for (const part of parts) {
    if (part === '..') {
      current = current.substring(0, current.lastIndexOf('/'));
      if (current === '') current = '/';
    } else if (part !== '.') {
      current = current === '/' ? `/${part}` : `${current}/${part}`;
    }
  }
  return current || '/';
}

// Обработчик команд
function handleCommand(command) {
  let result = '';
  const [cmd, ...args] = command.split(' ');

  switch (cmd.toLowerCase()) {
    case 'help':
      result = 'Available commands: help, cd, touch, cp, rm, ls, mkdir, clear';
      break;

    case 'cd':
      if (args.length === 0) {
        result = 'Usage: cd <directory>';
        break;
      }
      const targetPath = resolvePath(args[0]);
      if (fileSystem[targetPath] && Object.prototype.hasOwnProperty.call(fileSystem, targetPath)) {
        currentDirectory = targetPath;
        result = `Changed directory to "${targetPath === '/' ? '~' : targetPath.split('/').pop()}"`;
      } else {
        result = `cd: no such directory: ${args[0]}`;
      }
      break;

    case 'touch':
      if (args.length === 0) {
        result = 'Usage: touch <filename>';
        break;
      }
      const filePath = resolvePath(args[0]);
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

      if (!fileSystem[dirPath]) {
        result = `Cannot create file: Directory "${dirPath}" does not exist`;
      } else if (!fileSystem[dirPath].includes(fileName)) {
        fileSystem[dirPath].push(fileName);
        result = `File "${fileName}" created in "${dirPath}"`;
      } else {
        result = `File "${fileName}" already exists in "${dirPath}"`;
      }
      break;

    case 'cp':
      if (args.length < 2) {
        result = 'Usage: cp <source> <destination>';
        break;
      }
      const source = resolvePath(args[0]);
      const dest = resolvePath(args[1]);
      const sourceDir = source.substring(0, source.lastIndexOf('/'));
      const sourceFile = source.substring(source.lastIndexOf('/') + 1);

      // Проверка исходного файла
      if (!fileSystem[sourceDir] || !fileSystem[sourceDir].includes(sourceFile)) {
        result = `cp: cannot stat '${args[0]}': No such file or directory`;
        break;
      }

      // Обработка назначения
      let destPath = dest;
      if (fileSystem[destPath] && fileSystem[destPath].constructor === Array) { // Если это директория
        destPath += `/${sourceFile}`;
      }
      const destDir = destPath.substring(0, destPath.lastIndexOf('/'));
      const destFile = destPath.substring(destPath.lastIndexOf('/') + 1);

      if (!fileSystem[destDir]) {
        result = `cp: cannot create file '${args[1]}': No such directory`;
        break;
      }

      fileSystem[destDir].push(destFile);
      result = `Copied '${sourceFile}' to '${destPath}'`;
      break;

    case 'rm':
      if (args.length === 0) {
        result = 'Usage: rm <file>';
        break;
      }
      const targetFile = resolvePath(args[0]);
      const targetDir = targetFile.substring(0, targetFile.lastIndexOf('/'));
      const targetFileName = targetFile.substring(targetFile.lastIndexOf('/') + 1);

      if (fileSystem[targetDir] && fileSystem[targetDir].includes(targetFileName)) {
        fileSystem[targetDir] = fileSystem[targetDir].filter(f => f !== targetFileName);
        result = `Removed '${targetFileName}'`;
      } else {
        result = `rm: cannot remove '${args[0]}': No such file`;
      }
      break;

    case 'ls':
      result = fileSystem[currentDirectory].join('\n') || 'Directory is empty';
      break;

    case 'mkdir':
      if (args.length === 0) {
        result = 'Usage: mkdir <directory>';
        break;
      }
      const newDir = resolvePath(args[0]);
      if (fileSystem[newDir]) {
        result = `Directory '${args[0]}' already exists`;
      } else {
        const parentDir = newDir.substring(0, newDir.lastIndexOf('/'));
        const dirName = newDir.split('/').pop();
        if (fileSystem[parentDir]) {
          fileSystem[parentDir].push(dirName);
          fileSystem[newDir] = [];
          result = `Directory '${dirName}' created`;
        } else {
          result = `mkdir: cannot create directory: No such parent directory`;
        }
      }
      break;

    case 'clear':
      result = '';
      break;

    default:
      result = `command not found: ${cmd}`;
  }

  saveState();
  return result;
}

function checkFinalState() {
  const isFileRemovedFromDocuments = !fileSystem['/Documents'].includes('example.txt');
  const isFileInBackup = fileSystem['/Backup'].includes('example.txt');
  return isFileRemovedFromDocuments && isFileInBackup;
}
window.checkFinalState = checkFinalState;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  currentDirectory = localStorage.getItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory') || '/';
  fileSystem = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileSystem')) || {
    '/': ['Documents', 'Backup'],
    '/Documents': [],
    '/Backup': []
  };
  const statusElement = document.getElementById(`lesson${window.CURRENT_LESSON_ID}-status`);
  if (statusElement) {
    statusElement.textContent =
      lesson2Status === 'completed' ? 'Completed' :
        lesson2Status === 'in-progress' ? 'In Progress' : 'Not Started';
    statusElement.className = `status ${lessonStatus}`;
  }
});
window.isRelevantCommand = function(command) {
  // Список релевантных команд для урока 2
  const relevantCommands = ['cd','touch', 'mkdir', 'rm']; // Пример для урока по управлению файлами
  return relevantCommands.some(cmd => command.startsWith(cmd));
};
// Сохранение состояния
function saveState() {
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory', currentDirectory);
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'FileSystem', JSON.stringify(fileSystem));
}