// Sample file system structure
const fileSystem = {
  '/': {
    'home': {
      'user': {
      }
    }
  }
};

let currentPath = '/';

const commands = {
  ls: () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    let dir = fileSystem;
    for (const part of pathParts) {
      dir = dir[part];
    }
    return Object.keys(dir).join('  ');
  },

  cd: (args) => {
    const target = args[0];
    if (!target) return 'Usage: cd <directory>';
    if (target === '/') {
      currentPath = '/';
    } else if (target === '..') {
      const pathParts = currentPath.split('/').filter(Boolean);
      pathParts.pop();
      currentPath = '/' + pathParts.join('/');
    } else {
      const pathParts = currentPath.split('/').filter(Boolean);
      pathParts.push(target);
      currentPath = '/' + pathParts.join('/');
    }
    return `Now in ${currentPath}`;
  },

  pwd: () => {
    return currentPath;
  },

  mkdir: (args) => {
    const dirName = args[0];
    if (!dirName) return 'Usage: mkdir <directory>';

    const pathParts = currentPath.split('/').filter(Boolean);
    let dir = fileSystem;
    for (const part of pathParts) {
      dir = dir[part];
    }

    if (dir[dirName]) {
      return `Directory ${dirName} already exists.`;
    }

    dir[dirName] = {};
    return `Directory ${dirName} created.`;
  },

  rm: (args) => {
    const target = args[0];
    if (!target) return 'Usage: rm <file or directory>';

    const pathParts = currentPath.split('/').filter(Boolean);
    let dir = fileSystem;
    for (const part of pathParts) {
      dir = dir[part];
    }

    if (dir[target] === undefined) {
      return `File or directory ${target} not found.`;
    }

    delete dir[target];
    return `Deleted ${target}.`;
  },

  cp: (args) => {
    const [source, destination] = args;
    if (!source || !destination) return 'Usage: cp <source> <destination>';

    const pathParts = currentPath.split('/').filter(Boolean);
    let dir = fileSystem;
    for (const part of pathParts) {
      dir = dir[part];
    }

    if (dir[source] === undefined) {
      return `Source file ${source} not found.`;
    }

    // Copy file content (assuming it's null or undefined for empty files)
    dir[destination] = dir[source];
    return `Copied ${source} to ${destination}.`;
  },

  mv: (args) => {
    const [source, destination] = args;
    if (!source || !destination) return 'Usage: mv <source> <destination>';

    const pathParts = currentPath.split('/').filter(Boolean);
    let dir = fileSystem;
    for (const part of pathParts) {
      dir = dir[part];
    }

    if (dir[source] === undefined) {
      return `Source file ${source} not found.`;
    }

    // Move (rename) the file
    dir[destination] = dir[source];
    delete dir[source];
    return `Moved ${source} to ${destination}.`;
  },
  touch: (args) => {
    const fileName = args[0];
    if (!fileName) return 'Usage: touch <file>';

    const pathParts = currentPath.split('/').filter(Boolean);
    let dir = fileSystem;
    for (const part of pathParts) {
      dir = dir[part];
    }

    if (dir[fileName]) {
      return `File ${fileName} already exists.`;
    }

    dir[fileName] = null;
    return `File ${fileName} created.`;
  },

  rmdir: (args) => {
    const dirName = args[0];
    if (!dirName) return 'Usage: rmdir <directory>';

    const pathParts = currentPath.split('/').filter(Boolean);
    let dir = fileSystem;
    for (const part of pathParts) {
      dir = dir[part];
    }

    if (!dir[dirName]) {
      return `Directory ${dirName} not found.`;
    }

    // Ensure the directory is empty
    if (Object.keys(dir[dirName]).length > 0) {
      return `Directory ${dirName} is not empty.`;
    }

    delete dir[dirName];
    return `Directory ${dirName} removed.`;
  },
  help: () => {
    return `Available commands:
- ls: List directory contents
- cd <directory>: Change directory
- mkdir <directory>: Create a new directory
- touch <file>: Create a new file
- rm <file>: Remove a file
- cp <source> <destination>: Copy a file
- mv <source> <destination>: Move or rename a file
- rmdir <directory>: Remove a directory
- help: Show this help message`;
  },

  clear: () => {
    terminalOutput.innerHTML = 'Welcome to CLI Trainer!\n' +
      '    Type "help" for a list of commands.';
    return '';
  }
};