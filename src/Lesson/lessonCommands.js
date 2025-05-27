import { lesson1InitialState } from './lesson1.js';
import { lesson2InitialState } from './lesson2.js';

const lessonInitialStates = {
  1: lesson1InitialState,
  2: lesson2InitialState,
};

export const createLessonCommands = (lessonId) => {
  // Загрузка состояния для урока
  const loadState = () => {
    try {
      const savedData =
        JSON.parse(localStorage.getItem(`lesson${lessonId}_history`)) || {};
      const initialState = lessonInitialStates[lessonId] || lesson1InitialState;

      return {
        fileSystem:
          savedData.fileSystem ||
          JSON.parse(JSON.stringify(initialState.fileSystem)),
        currentPath: savedData.currentPath || [...initialState.currentPath],
        history: savedData.history || [],
      };
    } catch (e) {
      console.error('Error loading state:', e);
      const fallbackState =
        lessonInitialStates[lessonId] || lesson1InitialState;
      return {
        fileSystem: JSON.parse(JSON.stringify(fallbackState.fileSystem)),
        currentPath: [...fallbackState.currentPath],
        history: [],
      };
    }
  };
  let state = {
    ...loadState(),
    currentUser: localStorage.getItem('currentUser') || null,
  };

  // Сохранение состояния
  const saveState = (state) => {
    try {
      // Сохраняем пользователя отдельно
      localStorage.setItem('currentUser', state.currentUser);

      // Остальные данные
      const saveData = {
        fileSystem: state.fileSystem,
        currentPath: state.currentPath,
        history: state.history,
      };
      localStorage.setItem(
        `lesson${lessonId}_history`,
        JSON.stringify(saveData),
      );
    } catch (e) {
      console.error('Ошибка сохранения:', e);
    }
  };

  // Утилиты для работы с путями
  const pathUtils = {
    parsePath: (currentPath, path) => {
      if (path.startsWith('/')) {
        return path.split('/').filter((p) => p !== '');
      }
      return path.split('/').filter((p) => p !== ''); // Исправлено!
    },

    resolvePath: (fileSystem, currentPath, pathParts) => {
      let current = fileSystem;
      const tempPath = [...currentPath.slice(1)];

      for (const part of tempPath) {
        current = current.contents[part];
      }

      for (const part of pathParts) {
        if (part === '..') {
          if (tempPath.length > 0) {
            tempPath.pop();
            current = fileSystem;
            for (const p of tempPath) {
              current = current.contents[p];
            }
          }
          continue;
        }

        if (current.contents[part]?.type === 'directory') {
          current = current.contents[part];
          tempPath.push(part);
        } else {
          return null;
        }
      }
      return current;
    },
  };

  // Парсер аргументов с поддержкой кавычек
  const parseArgs = (input) => {
    const args = [];
    let current = '';
    let inQuotes = false;
    let buffer = '';

    for (let char of input.trim()) {
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      // Обработка > и >>
      if (!inQuotes && (char === '>' || char === '<')) {
        if (buffer + char === '>>') {
          args.push(buffer + char);
          buffer = '';
          current = '';
          continue;
        } else if (buffer === '>') {
          args.push(buffer);
          buffer = '';
        }
        buffer += char;
        continue;
      }

      if (buffer) {
        args.push(buffer);
        buffer = '';
      }

      if (char === ' ' && !inQuotes) {
        if (current !== '') {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (buffer) args.push(buffer);
    if (current) args.push(current);

    return args.filter((a) => a !== '' && a !== '-e');
  };

  // Вспомогательная функция для получения содержимого файла
  function getFileContent(state, filePath) {
    const pathParts = pathUtils.parsePath(state.currentPath, filePath);
    const fileName = pathParts.pop();
    let currentDir = state.fileSystem;

    try {
      for (const part of [...state.currentPath.slice(1), ...pathParts]) {
        currentDir = currentDir.contents[part];
      }
    } catch {
      return {
        output: `No such file or directory: ${filePath}`,
        error: true,
      };
    }

    const file = currentDir.contents[fileName];
    if (!file || file.type !== 'file') {
      return {
        output: `File not found: ${filePath}`,
        error: true,
      };
    }

    return {
      data: file.contents || '',
      error: false,
    };
  }

  function parseFields(fieldStr) {
    return fieldStr.split(',').flatMap((part) => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      }
      return [Number(part)];
    });
  }

  // Команды для уроков
  const commands = {
    ls: (args, state) => {
      const { fileSystem, currentPath } = state;
      const parsedArgs = parseArgs(args.join(' '));
      const path = parsedArgs[0] || '';

      let targetDir;
      const pathParts = pathUtils.parsePath(currentPath, path);

      try {
        targetDir = pathUtils.resolvePath(fileSystem, currentPath, pathParts);
      } catch (e) {
        return {
          ...state,
          output: `ls: cannot access '${path}': No such file or directory`,
          error: true,
        };
      }

      if (!targetDir || targetDir.type !== 'directory') {
        return {
          ...state,
          output: `ls: cannot access '${path}': Not a directory`,
          error: true,
        };
      }

      const entries = Object.keys(targetDir.contents)
        .filter((name) => name !== '..')
        .join(' ');

      return {
        ...state,
        output: entries || 'Директория пуста',
      };
    },

    cd: (args, state) => {
      const { fileSystem, currentPath } = state;
      const parsedArgs = parseArgs(args.join(' '));
      const path = parsedArgs[0] || '/';

      // Парсинг пути
      const pathParts = pathUtils.parsePath(currentPath, path);
      const newPath = ['/'];
      let current = fileSystem;
      let isValidPath = true;

      // Обработка специальных случаев
      if (path === '/' || path === '~') {
        saveState(fileSystem, ['/']);
        return {
          ...state,
          currentPath: ['/'],
          output: 'Текущий путь: /',
        };
      }

      // Построение нового пути
      try {
        for (const part of pathParts) {
          if (part === '..') {
            if (newPath.length > 1) newPath.pop();
            continue;
          }

          if (part === '.' || part === '') continue;

          const temp = [...newPath.slice(1), part].reduce((acc, p) => {
            return acc.contents[p];
          }, current);

          if (temp?.type === 'directory') {
            newPath.push(part);
          } else {
            isValidPath = false;
            break;
          }
        }
      } catch (e) {
        isValidPath = false;
      }

      // Нормализация пути
      const normalizedPath = newPath
        .filter((p) => p !== '/' && p !== '')
        .reduce(
          (acc, part) => {
            if (part === '..') {
              acc.pop();
            } else if (part !== '.') {
              acc.push(part);
            }
            return acc;
          },
          ['/'],
        );

      if (!isValidPath) {
        return {
          ...state,
          output: `cd: no such file or directory: ${path}`,
          error: true,
        };
      }

      // Сохранение и возврат нового состояния
      saveState(fileSystem, normalizedPath);
      return {
        ...state,
        currentPath: normalizedPath,
        output: `Текущий путь: ${normalizedPath.join('/').replace(/\/+/g, '/')}`,
      };
    },

    mkdir: (args, state) => {
      const { fileSystem, currentPath } = state;
      const parsedArgs = parseArgs(args.join(' '));
      if (!parsedArgs[0])
        return { ...state, output: 'mkdir: missing operand', error: true };

      const newFS = JSON.parse(JSON.stringify(fileSystem));
      const pathParts = pathUtils.parsePath(currentPath, parsedArgs[0]);
      let current = newFS;

      // Переход по текущему пути
      for (const part of currentPath.slice(1)) {
        current = current.contents[part];
        if (!current) {
          return {
            ...state,
            output: `mkdir: cannot create directory '${parsedArgs[0]}': Invalid path`,
            error: true,
          };
        }
      }

      // Создание всех директорий в пути
      for (const part of pathParts) {
        if (!current.contents[part]) {
          current.contents[part] = {
            type: 'directory',
            contents: {},
          };
        }

        if (current.contents[part].type !== 'directory') {
          return {
            ...state,
            output: `mkdir: cannot create directory '${parsedArgs[0]}': Not a directory`,
            error: true,
          };
        }

        current = current.contents[part];
      }

      saveState(newFS, currentPath);
      return {
        ...state,
        fileSystem: newFS,
        output: `Директория '${parsedArgs[0]}' создана`,
      };
    },

    touch: (args, state) => {
      const { fileSystem, currentPath } = state;
      const parsedArgs = parseArgs(args.join(' '));
      if (!parsedArgs[0])
        return { ...state, output: 'touch: missing file operand', error: true };

      const newFS = JSON.parse(JSON.stringify(fileSystem));
      const pathParts = pathUtils.parsePath(currentPath, parsedArgs[0]);
      const fileName = pathParts.pop();
      let current = newFS;

      for (const part of currentPath.slice(1)) {
        current = current.contents[part];
      }

      for (const part of pathParts) {
        if (!current.contents[part]) {
          return {
            ...state,
            output: `touch: cannot touch '${parsedArgs[0]}': No such directory`,
            error: true,
          };
        }
        current = current.contents[part];
      }

      if (current.contents[fileName]) {
        return {
          ...state,
          output: `touch: cannot touch '${parsedArgs[0]}': File exists`,
          error: true,
        };
      }

      current.contents[fileName] = { type: 'file', contents: '' };
      saveState(newFS, currentPath);
      return {
        ...state,
        fileSystem: newFS,
        output: `Файл '${parsedArgs[0]}' создан`,
      };
    },

    cp: (args, state) => {
      const { fileSystem, currentPath } = state;
      const parsedArgs = parseArgs(args.join(' '));
      if (parsedArgs.length < 2)
        return {
          ...state,
          output: 'cp: missing destination file operand',
          error: true,
        };

      const newFS = JSON.parse(JSON.stringify(fileSystem));

      // Обработка исходного файла
      const srcPath = parsedArgs[0];
      const srcParts = pathUtils.parsePath(currentPath, srcPath);
      const srcFileName = srcParts.pop();

      let srcDir = newFS;
      try {
        // Для абсолютных путей
        if (srcPath.startsWith('/')) {
          srcDir = newFS;
          for (const part of srcParts) {
            srcDir = srcDir.contents[part];
          }
        } else {
          for (const part of [...currentPath.slice(1), ...srcParts]) {
            srcDir = srcDir.contents[part];
          }
        }
      } catch {
        return {
          ...state,
          output: `cp: cannot stat '${srcPath}': No such file or directory`,
          error: true,
        };
      }

      if (
        !srcDir.contents[srcFileName] ||
        srcDir.contents[srcFileName].type !== 'file'
      ) {
        return {
          ...state,
          output: `cp: cannot stat '${srcPath}': No such file`,
          error: true,
        };
      }

      // Обработка целевого пути
      const destPath = parsedArgs[1];
      const destParts = pathUtils.parsePath(currentPath, destPath);
      const isAbsolute = destPath.startsWith('/');

      let destDir = newFS;
      let createdDirs = [];

      try {
        // Для абсолютных путей
        if (isAbsolute) {
          destDir = newFS;
          for (const part of destParts) {
            if (!destDir.contents[part]) {
              destDir.contents[part] = { type: 'directory', contents: {} };
              createdDirs.push(part);
            }
            destDir = destDir.contents[part];
          }
        }
        // Для относительных путей
        else {
          destDir = newFS;
          // Переходим в текущую директорию
          for (const part of currentPath.slice(1)) {
            destDir = destDir.contents[part];
          }
          // Создаем недостающие директории
          for (const part of destParts) {
            if (!destDir.contents[part]) {
              destDir.contents[part] = { type: 'directory', contents: {} };
              createdDirs.push(part);
            }
            destDir = destDir.contents[part];
          }
        }
      } catch {
        // Откатываем созданные директории при ошибке
        createdDirs.forEach((dir) => delete destDir.contents[dir]);
        return {
          ...state,
          output: `cp: cannot create directory '${destPath}': Invalid path`,
          error: true,
        };
      }

      // Копируем файл
      destDir.contents[srcFileName] = { ...srcDir.contents[srcFileName] };

      saveState(newFS, currentPath);
      return {
        ...state,
        fileSystem: newFS,
        output: `Файл '${srcPath}' скопирован в '${destPath}'`,
      };
    },
    rm: (args, state) => {
      const { fileSystem, currentPath } = state;
      const parsedArgs = parseArgs(args.join(' '));

      // Проверка наличия аргумента
      if (parsedArgs.length !== 1) {
        return {
          ...state,
          output: 'rm: missing operand',
          error: true,
        };
      }

      // Создаем глубокую копию файловой системы
      const newFS = JSON.parse(JSON.stringify(fileSystem));
      const targetPath = parsedArgs[0];

      // Парсим путь к файлу
      const pathParts = pathUtils.parsePath(currentPath, targetPath);
      const fileName = pathParts.pop();
      let currentDir = newFS;

      // Переходим по пути к родительской директории
      try {
        for (const part of [...currentPath.slice(1), ...pathParts]) {
          currentDir = currentDir.contents[part];
          if (!currentDir) throw new Error();
        }
      } catch {
        return {
          ...state,
          output: `rm: cannot remove '${targetPath}': No such file or directory`,
          error: true,
        };
      }

      // Проверяем существование файла
      if (!currentDir.contents[fileName]) {
        return {
          ...state,
          output: `rm: cannot remove '${targetPath}': No such file`,
          error: true,
        };
      }

      // Проверяем что это файл
      if (currentDir.contents[fileName].type !== 'file') {
        return {
          ...state,
          output: `rm: cannot remove '${targetPath}': Is a directory`,
          error: true,
        };
      }

      // Удаляем файл
      delete currentDir.contents[fileName];

      // Сохраняем состояние
      saveState(newFS, currentPath);

      return {
        ...state,
        fileSystem: newFS,
        output: `Файл '${targetPath}' удален`,
      };
    },
    echo: (args, state) => {
      const parsedArgs = parseArgs(args.join(' '));
      let outputText = '';
      let filePath = null;
      let appendMode = false;
      let interpretEscapes = false;
      let contentParts = [];

      if (parsedArgs[0] === '-e') {
        interpretEscapes = true;
        parsedArgs.shift();
      }

      const redirectIndex = parsedArgs.findIndex(
        (a) => a === '>' || a === '>>',
      );

      if (redirectIndex !== -1) {
        contentParts = parsedArgs.slice(0, redirectIndex);
        filePath = parsedArgs.slice(redirectIndex + 1).join(' ');
        appendMode = parsedArgs[redirectIndex] === '>>';
      } else {
        contentParts = parsedArgs;
      }

      outputText = contentParts
        .join(' ')
        .replace(/(^"|"$)/g, '')
        .replace(/\\"/g, '"');

      // Добавляем автоматические переносы строк
      if (filePath) {
        const lineCount = (outputText.match(/\\n/g) || []).length + 1;
        outputText = outputText.replace(/\\n/g, '\n');
        if (appendMode) {
          outputText = '\n' + outputText;
        }
      }
      // Добавляем перенос строки при записи в файл
      if (appendMode && filePath) {
        outputText = '\n' + outputText;
      }
      if (interpretEscapes) {
        outputText = outputText
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\');
      }
      if (filePath) {
        const newFS = JSON.parse(JSON.stringify(state.fileSystem));
        const pathParts = pathUtils.parsePath(state.currentPath, filePath);
        const fileName = pathParts.pop();
        let currentDir = newFS;

        try {
          for (const part of [...state.currentPath.slice(1), ...pathParts]) {
            if (!currentDir.contents[part]) {
              currentDir.contents[part] = { type: 'directory', contents: {} };
            }
            currentDir = currentDir.contents[part];
          }
        } catch {
          return {
            ...state,
            output: `echo: cannot access '${filePath}': No such directory`,
            error: true,
          };
        }

        // Получаем текущее содержимое для режима добавления
        let existingContent = '';
        if (appendMode && currentDir.contents[fileName]?.type === 'file') {
          existingContent = currentDir.contents[fileName].contents || '';
        }

        // Сохраняем с учетом режима
        currentDir.contents[fileName] = {
          type: 'file',
          contents: appendMode ? existingContent + outputText : outputText,
        };

        saveState(newFS, state.currentPath);
        return {
          ...state,
          fileSystem: newFS,
          output: ``,
        };
      }

      return {
        ...state,
        output: outputText,
      };
    },
    cat: (args, state) => {
      const parsedArgs = parseArgs(args.join(' '));
      if (parsedArgs.length === 0) {
        return {
          ...state,
          output: 'cat: missing file operand',
          error: true,
        };
      }

      const filePath = parsedArgs[0];
      const pathParts = pathUtils.parsePath(state.currentPath, filePath);
      const fileName = pathParts.pop();
      let currentDir = state.fileSystem;

      try {
        for (const part of [...state.currentPath.slice(1), ...pathParts]) {
          currentDir = currentDir.contents[part];
        }
      } catch {
        return {
          ...state,
          output: `cat: ${filePath}: No such file or directory`,
          error: true,
        };
      }

      const file = currentDir.contents[fileName];
      if (!file || file.type !== 'file') {
        return {
          ...state,
          output: `cat: ${filePath}: No such file`,
          error: true,
        };
      }

      return {
        ...state,
        output: file.contents || '',
      };
    },

    wc: (args, state) => {
      const parsedArgs = parseArgs(args.join(' '));
      if (parsedArgs.length === 0) {
        return {
          ...state,
          output: 'wc: missing file operand',
          error: true,
        };
      }

      const filePath = parsedArgs[0];
      const pathParts = pathUtils.parsePath(state.currentPath, filePath);
      const fileName = pathParts.pop();
      let currentDir = state.fileSystem;

      try {
        for (const part of [...state.currentPath.slice(1), ...pathParts]) {
          currentDir = currentDir.contents[part];
        }
      } catch {
        return {
          ...state,
          output: `wc: ${filePath}: No such file or directory`,
          error: true,
        };
      }

      const file = currentDir.contents[fileName];
      if (!file || file.type !== 'file') {
        return {
          ...state,
          output: `wc: ${filePath}: No such file`,
          error: true,
        };
      }

      const content = file.contents || '';
      const lines = content.split('\n').length;
      const words = content
        .trim()
        .split(/\s+/)
        .filter((w) => w).length;
      const bytes = new TextEncoder().encode(content).length;

      return {
        ...state,
        output: ` ${lines}  ${words} ${bytes} ${filePath}`,
      };
    },
    pwd: (args, state) => {
      const path = '/' + state.currentPath.slice(1).join('/');
      return {
        ...state,
        output: path.replace(/\/+/g, '/'),
      };
    },

    rmdir: (args, state) => {
      const parsedArgs = parseArgs(args.join(' '));
      if (parsedArgs.length === 0) {
        return {
          ...state,
          output: 'rmdir: missing operand',
          error: true,
        };
      }

      const newFS = JSON.parse(JSON.stringify(state.fileSystem));
      const targetPath = parsedArgs[0];
      const pathParts = pathUtils.parsePath(state.currentPath, targetPath);
      const dirName = pathParts.pop();
      let currentDir = newFS;

      try {
        for (const part of [...state.currentPath.slice(1), ...pathParts]) {
          currentDir = currentDir.contents[part];
        }
      } catch {
        return {
          ...state,
          output: `rmdir: failed to remove '${targetPath}': No such file or directory`,
          error: true,
        };
      }

      if (!currentDir.contents[dirName]) {
        return {
          ...state,
          output: `rmdir: failed to remove '${targetPath}': No such file or directory`,
          error: true,
        };
      }

      const target = currentDir.contents[dirName];

      if (target.type !== 'directory') {
        return {
          ...state,
          output: `rmdir: failed to remove '${targetPath}': Not a directory`,
          error: true,
        };
      }

      if (Object.keys(target.contents).length > 0) {
        return {
          ...state,
          output: `rmdir: failed to remove '${targetPath}': Directory not empty`,
          error: true,
        };
      }

      delete currentDir.contents[dirName];
      saveState(newFS, state.currentPath);

      return {
        ...state,
        fileSystem: newFS,
        output: `Директория '${targetPath}' удалена`,
      };
    },

    mv: (args, state) => {
      const parsedArgs = parseArgs(args.join(' '));
      if (parsedArgs.length < 2) {
        return {
          ...state,
          output: 'mv: missing destination file operand',
          error: true,
        };
      }

      const newFS = JSON.parse(JSON.stringify(state.fileSystem));
      const srcPath = parsedArgs[0];
      const destPath = parsedArgs[1];

      // Получаем исходный объект
      const srcParts = pathUtils.parsePath(state.currentPath, srcPath);
      const srcName = srcParts.pop();
      let srcParent = newFS;

      try {
        for (const part of [...state.currentPath.slice(1), ...srcParts]) {
          srcParent = srcParent.contents[part];
        }
      } catch {
        return {
          ...state,
          output: `mv: cannot stat '${srcPath}': No such file or directory`,
          error: true,
        };
      }

      if (!srcParent.contents[srcName]) {
        return {
          ...state,
          output: `mv: cannot stat '${srcPath}': No such file or directory`,
          error: true,
        };
      }

      const srcObj = srcParent.contents[srcName];

      // Обработка целевого пути
      const destParts = pathUtils.parsePath(state.currentPath, destPath);
      let destParent = newFS;
      let destName = srcName;

      try {
        // Разрешаем путь до родительской директории
        const parentParts = destParts.slice(0, -1);
        const targetName = destParts[destParts.length - 1] || srcName;

        for (const part of [...state.currentPath.slice(1), ...parentParts]) {
          if (!destParent.contents[part]) {
            destParent.contents[part] = { type: 'directory', contents: {} };
          }
          destParent = destParent.contents[part];
        }

        // Проверяем если цель - существующая директория
        if (destParent.contents[targetName]?.type === 'directory') {
          destParent = destParent.contents[targetName];
          destName = srcName;
        } else {
          destName = targetName;
        }
      } catch {
        return {
          ...state,
          output: `mv: cannot create directory '${destPath}': Invalid path`,
          error: true,
        };
      }

      // Перемещаем объект
      destParent.contents[destName] = srcObj;
      delete srcParent.contents[srcName];

      saveState(newFS, state.currentPath);

      return {
        ...state,
        fileSystem: newFS,
        output: `'${srcPath}' -> '${destPath}'`,
      };
    },
    sort: (args, state) => {
      const parsedArgs = parseArgs(args.join(' '));
      const options = {
        reverse: parsedArgs.includes('-r'),
      };
      let outputText = '';
      let fileName = '';
      let appendMode = false;

      const redirectIndex = parsedArgs.findIndex(
        (a) => a === '>' || a === '>>',
      );
      if (redirectIndex !== -1) {
        fileName = parsedArgs.slice(redirectIndex + 1).join(' ');
        appendMode = parsedArgs[redirectIndex] === '>>';
        parsedArgs.splice(redirectIndex);
      }

      const inputFile = parsedArgs[0];
      if (!inputFile) {
        return { ...state, output: 'sort: missing file operand', error: true };
      }

      const fileContent = getFileContent(state, inputFile);
      if (fileContent.error) return { ...state, ...fileContent };

      const lines = fileContent.data
        .split('\n')
        .filter((line) => line.trim() !== '');
      const sorted = lines.sort((a, b) =>
        options.reverse ? b.localeCompare(a) : a.localeCompare(b),
      );
      outputText = sorted.join('\n');

      if (fileName) {
        const newFS = JSON.parse(JSON.stringify(state.fileSystem));
        const pathParts = pathUtils.parsePath(state.currentPath, fileName);
        const fileNamePart = pathParts.pop();
        let currentDir = newFS;

        try {
          for (const part of [...state.currentPath.slice(1), ...pathParts]) {
            currentDir = currentDir.contents[part];
            if (!currentDir.contents[part]) {
              currentDir.contents[part] = { type: 'directory', contents: {} };
            }
          }
        } catch {
          return {
            ...state,
            output: `sort: cannot access '${fileName}': No such directory`,
            error: true,
          };
        }

        const existingContent =
          currentDir.contents[fileNamePart]?.contents || '';
        currentDir.contents[fileNamePart] = {
          type: 'file',
          contents: appendMode
            ? existingContent + '\n' + outputText
            : outputText,
        };

        saveState(newFS, state.currentPath);
        return { ...state, fileSystem: newFS, output: '' };
      }

      return { ...state, output: outputText };
    },

    uniq: (args, state) => {
      const parsedArgs = parseArgs(args.join(' '));
      let fileName = '';
      let appendMode = false;

      const redirectIndex = parsedArgs.findIndex(
        (a) => a === '>' || a === '>>',
      );
      if (redirectIndex !== -1) {
        fileName = parsedArgs.slice(redirectIndex + 1).join(' ');
        appendMode = parsedArgs[redirectIndex] === '>>';
        parsedArgs.splice(redirectIndex);
      }

      const inputFile = parsedArgs[0];
      if (!inputFile) {
        return { ...state, output: 'uniq: missing file operand', error: true };
      }

      const fileContent = getFileContent(state, inputFile);
      if (fileContent.error) return { ...state, ...fileContent };

      // Разделяем на строки и фильтруем последовательные дубликаты
      const lines = fileContent.data
        .split('\n')
        .filter((line) => line.trim() !== '');
      const uniqueLines = [];
      let prevLine = null;

      for (const line of lines) {
        if (line !== prevLine) {
          uniqueLines.push(line);
          prevLine = line;
        }
      }
      const outputText = uniqueLines.join('\n');

      if (fileName) {
        const newFS = JSON.parse(JSON.stringify(state.fileSystem));
        const pathParts = pathUtils.parsePath(state.currentPath, fileName);
        const fileNamePart = pathParts.pop();
        let currentDir = newFS;

        try {
          for (const part of [...state.currentPath.slice(1), ...pathParts]) {
            if (!currentDir.contents[part]) {
              currentDir.contents[part] = { type: 'directory', contents: {} };
            }
            currentDir = currentDir.contents[part];
          }
        } catch {
          return {
            ...state,
            output: `uniq: cannot access '${fileName}': No such directory`,
            error: true,
          };
        }

        const existingContent =
          currentDir.contents[fileNamePart]?.contents || '';
        currentDir.contents[fileNamePart] = {
          type: 'file',
          contents: appendMode
            ? existingContent + '\n' + outputText
            : outputText,
        };

        saveState(newFS, state.currentPath);
        return { ...state, fileSystem: newFS, output: '' };
      }

      return { ...state, output: outputText };
    },

    cut: (args, state) => {
      const parsedArgs = parseArgs(args.join(' '));
      let delimiter = '\t';
      let fields = [];
      let charsRange = null;
      let fileName = '';
      let appendMode = false;
      let filePath = '';

      const redirectIndex = parsedArgs.findIndex(
        (a) => a === '>' || a === '>>',
      );
      if (redirectIndex !== -1) {
        fileName = parsedArgs.slice(redirectIndex + 1).join(' ');
        appendMode = parsedArgs[redirectIndex] === '>>';
        parsedArgs.splice(redirectIndex);
      }

      for (let i = 0; i < parsedArgs.length; i++) {
        const arg = parsedArgs[i];
        if (arg === '-d') {
          delimiter = parsedArgs[++i]?.replace(/['"]/g, '') || '\t';
        } else if (arg.startsWith('-d')) {
          delimiter = arg.slice(2).replace(/['"]/g, '');
        } else if (arg === '-f') {
          fields = parseFields(parsedArgs[++i]);
        } else if (arg.startsWith('-f')) {
          fields = parseFields(arg.slice(2));
        } else if (arg === '-c') {
          const range = parsedArgs[++i].split('-').map(Number);
          charsRange = { start: range[0] - 1, end: range[1] };
        } else if (!filePath) {
          filePath = arg;
        }
      }

      if (!filePath) {
        return { ...state, output: 'cut: missing file operand', error: true };
      }

      const fileContent = getFileContent(state, filePath);
      if (fileContent.error) return { ...state, ...fileContent };

      const lines = fileContent.data.split('\n');
      const result = lines.map((line) => {
        if (charsRange) {
          return line.slice(charsRange.start, charsRange.end);
        }
        const parts = line.split(delimiter);
        return fields.map((f) => parts[f - 1] || '').join(delimiter);
      });

      const outputText = result.join('\n');

      if (fileName) {
        const newFS = JSON.parse(JSON.stringify(state.fileSystem));
        const pathParts = pathUtils.parsePath(state.currentPath, fileName);
        const fileNamePart = pathParts.pop();
        let currentDir = newFS;

        try {
          for (const part of [...state.currentPath.slice(1), ...pathParts]) {
            currentDir = currentDir.contents[part];
            if (!currentDir.contents[part]) {
              currentDir.contents[part] = { type: 'directory', contents: {} };
            }
          }
        } catch {
          return {
            ...state,
            output: `cut: cannot access '${fileName}': No such directory`,
            error: true,
          };
        }

        const existingContent =
          currentDir.contents[fileNamePart]?.contents || '';
        currentDir.contents[fileNamePart] = {
          type: 'file',
          contents: appendMode
            ? existingContent + '\n' + outputText
            : outputText,
        };

        saveState(newFS, state.currentPath);
        return { ...state, fileSystem: newFS, output: '' };
      }

      return { ...state, output: outputText };
    },

    head: (args, state) => {
      const parsedArgs = parseArgs(args.join(' '));
      let lines = 10;
      let fileName = '';

      for (let i = 0; i < parsedArgs.length; i++) {
        const arg = parsedArgs[i];
        if (arg === '-n') {
          const num = parseInt(parsedArgs[++i], 10);
          if (isNaN(num) || num <= 0) {
            return {
              ...state,
              output: `head: invalid line count: ${parsedArgs[i]}`,
              error: true,
            };
          }
          lines = num;
        } else if (arg.startsWith('-n')) {
          const num = parseInt(arg.slice(2), 10);
          if (isNaN(num) || num <= 0) {
            return {
              ...state,
              output: `head: invalid line count: ${arg.slice(2)}`,
              error: true,
            };
          }
          lines = num;
        } else {
          fileName = arg;
        }
      }

      if (!fileName) {
        return { ...state, output: 'head: missing file operand', error: true };
      }

      const fileContent = getFileContent(state, fileName);
      if (fileContent.error) return { ...state, ...fileContent };

      const contentLines = fileContent.data
        .split('\n')
        .filter((l) => l.trim() !== '');
      return { ...state, output: contentLines.slice(0, lines).join('\n') };
    },

    // Исправленная команда tail
    tail: (args, state) => {
      const parsedArgs = parseArgs(args.join(' '));
      let lines = 10;
      let fileName = '';

      for (let i = 0; i < parsedArgs.length; i++) {
        const arg = parsedArgs[i];
        if (arg === '-n') {
          const num = parseInt(parsedArgs[++i], 10);
          if (isNaN(num) || num <= 0) {
            return {
              ...state,
              output: `tail: invalid line count: ${parsedArgs[i]}`,
              error: true,
            };
          }
          lines = num;
        } else if (arg.startsWith('-n')) {
          const num = parseInt(arg.slice(2), 10);
          if (isNaN(num) || num <= 0) {
            return {
              ...state,
              output: `tail: invalid line count: ${arg.slice(2)}`,
              error: true,
            };
          }
          lines = num;
        } else {
          fileName = arg;
        }
      }

      if (!fileName) {
        return { ...state, output: 'tail: missing file operand', error: true };
      }

      const fileContent = getFileContent(state, fileName);
      if (fileContent.error) return { ...state, ...fileContent };

      const contentLines = fileContent.data
        .split('\n')
        .filter((l) => l.trim() !== '');
      const start = Math.max(0, contentLines.length - lines);
      return { ...state, output: contentLines.slice(start).join('\n') };
    },
    grep: (args, state) => {
      const parsedArgs = parseArgs(args.join(' '));
      let invertMatch = false;
      let ignoreCase = false;
      let fileName = '';
      let pattern = '';
      let outputText = '';
      let appendMode = false;
      let redirectFile = '';

      // Разбор аргументов и флагов
      let i = 0;
      while (i < parsedArgs.length) {
        const arg = parsedArgs[i];
        if (arg === '-v') {
          invertMatch = true;
          i++;
        } else if (arg === '-i') {
          ignoreCase = true;
          i++;
        } else if (arg === '>>' || arg === '>') {
          appendMode = arg === '>>';
          redirectFile = parsedArgs.slice(i + 1).join(' ');
          break;
        } else if (!pattern) {
          pattern = arg.replace(/^"(.*)"$/, '$1');
          i++;
        } else {
          fileName = arg;
          i++;
        }
      }

      if (!pattern || !fileName) {
        return { ...state, output: 'Usage: grep [-v] [-i] "pattern" <file>', error: true };
      }

      // Получение содержимого файла
      const fileContent = getFileContent(state, fileName);
      if (fileContent.error) {
        return { ...state, output: `grep: ${fileContent.output}`, error: true };
      }

      // Поиск по паттерну
      const regex = new RegExp(
          pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          ignoreCase ? 'i' : ''
      );

      const lines = fileContent.data.split('\n');
      const matchedLines = lines.filter(line =>
          invertMatch ? !regex.test(line) : regex.test(line)
      );

      outputText = matchedLines.length > 0
          ? matchedLines.join('\n')
          : `No matches found for "${pattern}"`;

      // Обработка перенаправления вывода
      if (redirectFile) {
        const newFS = JSON.parse(JSON.stringify(state.fileSystem));
        const pathParts = pathUtils.parsePath(state.currentPath, redirectFile);
        const fileNamePart = pathParts.pop();
        let currentDir = newFS;

        try {
          for (const part of [...state.currentPath.slice(1), ...pathParts]) {
            if (!currentDir.contents[part]) {
              currentDir.contents[part] = { type: 'directory', contents: {} };
            }
            currentDir = currentDir.contents[part];
          }
        } catch (e) {
          return { ...state, output: `grep: cannot access '${redirectFile}'`, error: true };
        }

        const existingContent = currentDir.contents[fileNamePart]?.type === 'file'
            ? currentDir.contents[fileNamePart].contents
            : '';

        currentDir.contents[fileNamePart] = {
          type: 'file',
          contents: appendMode ? `${existingContent}\n${outputText}` : outputText
        };

        saveState(newFS, state.currentPath);
        return { ...state, fileSystem: newFS, output: '' };
      }

      return { ...state, output: outputText };
    },

    // 3. Команда ifconfig
    ifconfig: (args, state) => {
      const randomMAC = () =>
          'XX:XX:XX:XX:XX:XX'.replace(/X/g, () =>
              Math.floor(Math.random() * 16).toString(16));

      const randomIP = () =>
          `192.168.1.${Math.floor(Math.random() * 255)}`;

      const output = `
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet ${randomIP()}  netmask 255.255.255.0  broadcast 192.168.1.255
        ether ${randomMAC()}  txqueuelen 1000  (Ethernet)
        RX packets 100  bytes 10000 (10.0 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 50  bytes 5000 (5.0 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0`.trim();

      return { ...state, output };
    }
  };

  return { commands, loadState, saveState };
};
