const LESSON_STORAGE_PREFIX = 'lesson4-'; // Было 'lesson4_'
window.LESSON_STORAGE_PREFIX = 'lesson4-'; // Было 'lesson4_'
window.LESSON_STATUS_ELEMENT_ID = 'lesson4-status';
window.CURRENT_LESSON_ID = 4;

let lesson4Status = localStorage.getItem(LESSON_STORAGE_PREFIX + 'Status') || 'not-started';
let completedCommands = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'CompletedCommands')) || [];
let currentDirectory = localStorage.getItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory') || '/';
let fileSystem = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileSystem')) || {
  '/': []
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
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/-n\s+/g, '-n');
}

function handleCommand(command) {
  let result = '';
  const originalCommand = command;
  command = command.replace(/"/g, '');
  const [cmd, ...args] = command.split(' ');
  const normalizedCmd = normalizeCommand(originalCommand);

  switch (cmd.toLowerCase()) {
    case 'help':
      result = 'Available commands: help, cd, touch, echo, sort, uniq, cut, head, tail, ls, clear';
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
      } else {
        result = `File "${fileName}" already exists.`;
      }
      break;

    case 'echo':
      let interpretEscapes = false;
      let argsCopy = [...args];

      // Проверяем наличие флага -e и удаляем его из аргументов
      if (argsCopy[0] === '-e') {
        interpretEscapes = true;
        argsCopy = argsCopy.slice(1);
      }

      let textParts = [];
      let redirectIndex = -1;
      let redirectType = '';

      for (let i = 0; i < argsCopy.length; i++) {
        if (argsCopy[i] === '>' || argsCopy[i] === '>>') {
          redirectIndex = i;
          redirectType = argsCopy[i];
          break;
        }
        textParts.push(argsCopy[i]);
      }

      let text = textParts.join(' ');

      // Обрабатываем escape-последовательности
      if (interpretEscapes) {
        text = text.replace(/\\n/g, '\n')  // Заменяем \n на символ новой строки
          .replace(/\\t/g, '\t')  // Заменяем \t на символ табуляции
          .replace(/\\"/g, '"')  // Заменяем \" на кавычку
          .replace(/\\\\/g, '\\'); // Заменяем \\ на обратный слэш
      }

      if (redirectIndex !== -1) {
        const fileName = argsCopy.slice(redirectIndex + 1).join(' ');
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

        result = '';
      } else {
        result = text;
      }
      break;

    case 'sort':
      if (args.length < 1) {
        result = 'Usage: sort <file>';
        break;
      }
      const sortFilePath = resolvePath(args[0]);
      if (!fileContents[sortFilePath] && fileContents[sortFilePath] !== '') {
        result = `sort: cannot read '${args[0]}': No such file`;
        break;
      }
      const sortLines = fileContents[sortFilePath].split('\n').filter(line => line.trim() !== '');
      const sortedContent = sortLines.sort().join('\n');
      const outputRedirectIndex = args.indexOf('>') !== -1 ? args.indexOf('>') : args.indexOf('>>');
      if (outputRedirectIndex !== -1 && outputRedirectIndex < args.length - 1) {
        const outputFile = resolvePath(args[outputRedirectIndex + 1]);
        const outputDir = outputFile.substring(0, outputFile.lastIndexOf('/')) || '/';
        const outputFileName = outputFile.split('/').pop();
        if (!fileSystem[outputDir]) {
          result = `sort: cannot create file '${outputFileName}': No such directory`;
          break;
        }
        if (!fileSystem[outputDir].includes(outputFileName)) {
          fileSystem[outputDir].push(outputFileName);
          fileContents[outputFile] = '';
        }
        fileContents[outputFile] = sortedContent;
        result = '';
      } else {
        result = sortedContent;
      }
      break;

    case 'uniq':
      if (args.length < 1) {
        result = 'Usage: uniq <file>';
        break;
      }
      const uniqFilePath = resolvePath(args[0]);
      if (!fileContents[uniqFilePath] && fileContents[uniqFilePath] !== '') {
        result = `uniq: cannot read '${args[0]}': No such file`;
        break;
      }
      const uniqLines = fileContents[uniqFilePath].split('\n').filter(line => line.trim() !== '');
      const uniqueContent = [];
      let previousLine = null;
      for (const line of uniqLines) {
        if (line !== previousLine) {
          uniqueContent.push(line);
          previousLine = line;
        }
      }
      const uniqueContentStr = uniqueContent.join('\n');
      const uniqOutputRedirectIndex = args.indexOf('>') !== -1 ? args.indexOf('>') : args.indexOf('>>');
      if (uniqOutputRedirectIndex !== -1 && uniqOutputRedirectIndex < args.length - 1) {
        const outputFile = resolvePath(args[uniqOutputRedirectIndex + 1]);
        const outputDir = outputFile.substring(0, outputFile.lastIndexOf('/')) || '/';
        const outputFileName = outputFile.split('/').pop();
        if (!fileSystem[outputDir]) {
          result = `uniq: cannot create file '${outputFileName}': No such directory`;
          break;
        }
        if (!fileSystem[outputDir].includes(outputFileName)) {
          fileSystem[outputDir].push(outputFileName);
          fileContents[outputFile] = '';
        }
        fileContents[outputFile] = uniqueContentStr;
        result = '';
      } else {
        result = uniqueContentStr;
      }
      break;

    case 'cut':
      if (args.length < 2 || !args[0].startsWith('-c')) {
        result = 'Usage: cut -cN-M <file>';
        break;
      }

      const rangeArg = args[0].replace('-c', '');
      const rangeParts = rangeArg.includes('-') ? rangeArg.split('-') : args[1].split('-');
      const start = parseInt(rangeParts[0]);
      const end = rangeParts[1] ? parseInt(rangeParts[1]) : start;
      const cutFilePath = resolvePath(args[args[0] === '-c' ? 2 : 1]);

      if (!fileContents[cutFilePath] && fileContents[cutFilePath] !== '') {
        result = `cut: cannot open '${args[args[0] === '-c' ? 2 : 1]}' for reading: No such file`;
        break;
      }

      const cutLines = fileContents[cutFilePath].split('\n').map(line => line.substring(start - 1, end));
      const cutContent = cutLines.join('\n');
      const outputArgIndex = args.findIndex(a => a === '>' || a === '>>');
      if (outputArgIndex !== -1 && outputArgIndex < args.length - 1) {
        const outputFile = resolvePath(args[outputArgIndex + 1]);
        const outputDir = outputFile.substring(0, outputFile.lastIndexOf('/')) || '/';
        const outputFileName = outputFile.split('/').pop();

        if (!fileSystem[outputDir]) {
          result = `cut: cannot create file '${outputFileName}': No such directory`;
          break;
        }

        if (!fileSystem[outputDir].includes(outputFileName)) {
          fileSystem[outputDir].push(outputFileName);
          fileContents[outputFile] = '';
        }

        fileContents[outputFile] = cutContent;
        result = '';
      } else {
        result = cutContent;
      }
      break;

    case 'head':
      if (args.length < 2 || !args[0].startsWith('-n')) {
        result = 'Usage: head -n<number> <file>';
        break;
      }

      const headNum = parseInt(args[0].replace('-n', '') || args[1]);
      const headFilePath = resolvePath(args[args[0] === '-n' ? 2 : 1]);

      if (!fileContents[headFilePath] && fileContents[headFilePath] !== '') {
        result = `head: cannot open '${args[args[0] === '-n' ? 2 : 1]}' for reading: No such file`;
        break;
      }

      const headLines = fileContents[headFilePath].split('\n').slice(0, headNum).join('\n');
      result = headLines;
      completedCommands.push(normalizeCommand(originalCommand));
      break;

    case 'tail':
      if (args.length < 2 || !args[0].startsWith('-n')) {
        result = 'Usage: tail -n<number> <file>';
        break;
      }

      const tailNum = parseInt(args[0].replace('-n', '') || args[1]);
      const tailFilePath = resolvePath(args[args[0] === '-n' ? 2 : 1]);

      if (!fileContents[tailFilePath] && fileContents[tailFilePath] !== '') {
        result = `tail: cannot open '${args[args[0] === '-n' ? 2 : 1]}' for reading: No such file`;
        break;
      }

      const tailLines = fileContents[tailFilePath].split('\n').slice(-tailNum).join('\n');
      result = tailLines;
      completedCommands.push(normalizeCommand(originalCommand));
      break;

    case 'cat':
      if (args.length < 1) {
        result = 'Usage: cat <file>';
        break;
      }

      const catFilePath = resolvePath(args[0]);
      if (!fileContents[catFilePath] && fileContents[catFilePath] !== '') {
        result = `cat: cannot open '${args[0]}' for reading: No such file`;
        break;
      }

      result = fileContents[catFilePath];
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
  const requiredFiles = ['data.txt', 'sorted.txt', 'unique.txt', 'final.txt'];
  const filesExist = requiredFiles.every(file =>
    fileSystem['/'].includes(file) && fileContents[`/${file}`] !== undefined
  );

  if (!filesExist) return false;

  // Проверка содержимого data.txt
  const dataContent = fileContents['/data.txt'];
  const dataLines = dataContent.split('\n').filter(line => line.trim() !== '');
  if (dataLines.length !== 10) return false;

  // Проверка сортировки
  const sortedContent = fileContents['/sorted.txt'];
  const sortedLines = sortedContent.split('\n').filter(line => line.trim() !== '');
  const isSorted = JSON.stringify(sortedLines) === JSON.stringify([...sortedLines].sort());
  if (!isSorted) return false;

  // Проверка уникальности
  const uniqueContent = fileContents['/unique.txt'];
  const uniqueLines = uniqueContent.split('\n').filter(line => line.trim() !== '');
  const isUnique = uniqueLines.every((line, index) =>
    index === 0 || line !== uniqueLines[index - 1]
  );
  if (!isUnique) return false;

  // Проверка результата cut
  const resultContent = fileContents['/final.txt'];
  const resultLines = resultContent.split('\n').filter(line => line.trim() !== '');
  const expectedResult = uniqueLines.map(line => line.substring(0, 3));

  // Проверка выполнения head и tail
  const headExecuted = completedCommands.some(cmd =>
    cmd.startsWith('head -n3 final.txt') || cmd.startsWith('head -n 3 final.txt')
  );

  const tailExecuted = completedCommands.some(cmd =>
    cmd.startsWith('tail -n3 final.txt') || cmd.startsWith('tail -n 3 final.txt')
  );

  return JSON.stringify(resultLines) === JSON.stringify(expectedResult) &&
    headExecuted &&
    tailExecuted;
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
    '/': []
  };
  fileContents = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileContents')) || {};
  const statusElement = document.getElementById(`lesson${window.CURRENT_LESSON_ID}-status`);
  if (statusElement) {
    statusElement.textContent =
      lesson4Status === 'completed' ? 'Completed' :
        lesson4Status === 'in-progress' ? 'In Progress' : 'Not Started';
    statusElement.className = `status ${lesson4Status}`;
  }
});

window.isRelevantCommand = function(command) {
  const relevantCommands = ['cd', 'touch', 'echo', 'sort', 'uniq', 'cut', 'head', 'tail', 'ls'];
  return relevantCommands.some(cmd => command.toLowerCase().startsWith(cmd));
};

document.addEventListener('DOMContentLoaded', function() {
  const status = localStorage.getItem(LESSON_STORAGE_PREFIX + 'Status') || 'not-started'; // Теперь использует правильный префикс
  const statusElement = document.getElementById(window.LESSON_STATUS_ELEMENT_ID);
  if (statusElement) {
    statusElement.textContent = `Status: ${status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}`;
    statusElement.className = `status ${status}`;
  }
});