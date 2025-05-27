export const lesson3InitialState = {
    fileSystem: {
        type: 'directory',
        contents: {
            home: { type: 'directory', contents: {} },
            Documents: {
                type: 'directory',
                contents: {}
            },
            etc: { type: 'directory', contents: {} }
        }
    },
    currentPath: ['/'],
    history: []
};

export const checkLesson3Completion = (state) => {
    try {
        // 1. Проверка текущей директории
        const normalizedPath = state.currentPath
            .join('/')
            .replace(/\/+/g, '/')
            .replace(/\/$/, '');
        if (normalizedPath !== '/Documents') return false;

        // 2. Проверка существования файла
        const file = state.fileSystem.contents.Documents.contents['lesson3.txt'];
        if (!file || file.type !== 'file') return false;

        // 3. Проверка содержимого файла (ровно 3 непустые строки)
        const content = file.contents || '';
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length !== 3) return false;

        // 4. Поиск успешного выполнения wc в истории команд
        const wcCommandFound = state.history.some(entry => {
            const isWC = entry.command.startsWith('wc lesson3.txt');
            const outputParts = entry.output.trim().split(/\s+/);
            return isWC && outputParts[0] === '3'; // Проверяем количество строк
        });

        return wcCommandFound;
    } catch(e) {
        return false;
    }
};