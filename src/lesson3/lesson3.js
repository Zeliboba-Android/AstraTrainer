const LESSON_STORAGE_PREFIX = 'lesson3_';
window.LESSON_STORAGE_PREFIX = 'lesson3_';
window.LESSON_STATUS_ELEMENT_ID = 'lesson3-status';
window.CURRENT_LESSON_ID = 3;

const requiredCommands = [
  'cd Documents',
  'touch lesson3.txt',
  'echo Line 1 >> lesson3.txt',
  'echo Line 2 >> lesson3.txt',
  'echo Line 3 >> lesson3.txt',
  'cat lesson3.txt',
  'wc lesson3.txt'
];

let lesson3Status = localStorage.getItem(LESSON_STORAGE_PREFIX + 'Status') || 'not-started';
let completedCommands = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'CompletedCommands')) || [];
let currentDirectory = localStorage.getItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory') || '/';
let fileSystem = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileSystem')) || {
  '/': ['Documents'],
  '/Documents': []
};
let fileContents = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileContents')) || {};

function resolvePath(path) {
  if (path.startsWith('/')) return path;
  let current = currentDirectory;
  const parts = path.split('/').filter(p => p !== '');
  for (const part of parts) {
    if (part === '..') {
      current = current.substring(0, current.lastIndexOf('/')) || '/';
    } else if (part !== '.') {
      current = current === '/' ? `/${part}` : `${current}/${part}`;
    }
  }
  return current;
}

function normalizeCommand(command) {
  return command
    .replace(/-n\s+(\d+)/g, '-n$1')
    .replace(/\s+/g, ' ')
    .replace(/">>/g, ' >>');
}

function handleCommand(command) {
  let result = '';
  const originalCommand = command;
  command = command.replace(/"/g, ''); // Удаляем кавычки для обработки
  const [cmd, ...args] = command.split(' ');
  const normalizedCmd = normalizeCommand(originalCommand);

  switch (cmd.toLowerCase()) {
    case 'help':
      result = 'Available commands: help, cd, touch, echo, cat, wc, ls, clear';
      break;

    case 'cd':
      if (args.length === 0) {
        result = 'Usage: cd <directory>';
        break;
      }
      const targetPath = resolvePath(args[0]);
      if (fileSystem[targetPath]) {
        currentDirectory = targetPath;
        result = `Changed directory to "${targetPath === '/' ? '~' : targetPath.split('/').pop()}"`;
        if (normalizedCmd === 'cd Documents' && !completedCommands.includes(normalizedCmd)) {
          completedCommands.push(normalizedCmd);
        }
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
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
      const fileName = filePath.split('/').pop();

      if (!fileSystem[dirPath]) {
        result = `touch: cannot touch '${args[0]}': No such directory`;
      } else if (!fileSystem[dirPath].includes(fileName)) {
        fileSystem[dirPath].push(fileName);
        fileContents[filePath] = '';
        result = `File "${fileName}" created.`;
        if (normalizedCmd === 'touch lesson3.txt' && !completedCommands.includes(normalizedCmd)) {
          completedCommands.push(normalizedCmd);
        }
      } else {
        result = `File "${fileName}" already exists.`;
      }
      break;

    case 'echo':
      let textParts = [];
      let redirectIndex = -1;
      let redirectType = '';
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '>' || args[i] === '>>') {
          redirectIndex = i;
          redirectType = args[i];
          break;
        }
        textParts.push(args[i]);
      }
      const text = textParts.join(' ');
      if (redirectIndex !== -1) {
        const fileName = args.slice(redirectIndex + 1).join(' ');
        const filePath = resolvePath(fileName);
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
        const fileNameOnly = filePath.split('/').pop();

        if (!fileSystem[dirPath]) {
          result = `echo: cannot write to '${fileName}': No such directory`;
          break;
        }

        if (!fileSystem[dirPath].includes(fileNameOnly)) {
          fileSystem[dirPath].push(fileNameOnly);
          fileContents[filePath] = '';
        }

        const currentContent = fileContents[filePath] || '';
        if (redirectType === '>') {
          fileContents[filePath] = text;
        } else {
          fileContents[filePath] = currentContent ? `${currentContent}\n${text}` : text;
        }

        const echoCmd = normalizeCommand(`echo ${textParts.join(' ')} ${redirectType} ${fileName}`);
        if (requiredCommands.includes(echoCmd) && !completedCommands.includes(echoCmd)) {
          completedCommands.push(echoCmd);
        }
        result = ''; // echo с перенаправлением не выводит текст
      } else {
        result = text;
      }
      break;

    case 'cat':
      if (args.length === 0) {
        result = 'Usage: cat <file>';
        break;
      }
      const catFilePath = resolvePath(args[0]);
      if (!fileContents[catFilePath] && fileContents[catFilePath] !== '') {
        result = `cat: ${args[0]}: No such file or directory`;
      } else {
        result = fileContents[catFilePath];
        const catCmd = normalizeCommand(`cat ${args[0]}`);
        if (requiredCommands.includes(catCmd) && !completedCommands.includes(catCmd)) {
          completedCommands.push(catCmd);
        }
      }
      break;

    case 'wc':
      if (args.length === 0) {
        result = 'Usage: wc <file>';
        break;
      }
      const wcFilePath = resolvePath(args[0]);
      if (!fileContents[wcFilePath] && fileContents[wcFilePath] !== '') {
        result = `wc: ${args[0]}: No such file`;
      } else {
        const content = fileContents[wcFilePath];
        const lines = content.split('\n').filter(line => line).length;
        const words = content.split(/\s+/).filter(word => word).length;
        const chars = content.length;
        result = ` ${lines}  ${words} ${chars} ${args[0]}`;
        const wcCmd = normalizeCommand(`wc ${args[0]}`);
        if (requiredCommands.includes(wcCmd) && !completedCommands.includes(wcCmd)) {
          completedCommands.push(wcCmd);
        }
      }
      break;

    case 'ls':
      result = fileSystem[currentDirectory].join('\n') || 'Directory is empty';
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
  const allCommandsCompleted = requiredCommands.every(cmd => completedCommands.includes(normalizeCommand(cmd)));
  const filePath = '/Documents/lesson3.txt';
  const fileExists = fileSystem['/Documents']?.includes('lesson3.txt');
  const content = fileContents[filePath] || '';
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const contentCorrect = lines.length >= 3;

  return allCommandsCompleted && fileExists && contentCorrect;
}

window.checkFinalState = checkFinalState;

function saveState() {
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'CompletedCommands', JSON.stringify(completedCommands));
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory', currentDirectory);
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'FileSystem', JSON.stringify(fileSystem));
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'FileContents', JSON.stringify(fileContents));
}

document.addEventListener('DOMContentLoaded', () => {
  currentDirectory = localStorage.getItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory') || '/';
  fileSystem = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileSystem')) || {
    '/': ['Documents'],
    '/Documents': []
  };
  fileContents = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileContents')) || {};
  const statusElement = document.getElementById(`lesson${window.CURRENT_LESSON_ID}-status`);
  if (statusElement) {
    statusElement.textContent =
      lesson3Status === 'completed' ? 'Completed' :
        lesson3Status === 'in-progress' ? 'In Progress' : 'Not Started';
    statusElement.className = `status ${lesson3Status}`;
  }
});

window.isRelevantCommand = function(command) {
  const relevantCommands = ['cd', 'touch', 'echo', 'cat', 'head', 'tail', 'wc', 'ls'];
  return relevantCommands.some(cmd => command.toLowerCase().startsWith(cmd));
};