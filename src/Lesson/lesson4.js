export const lesson4InitialState = {
    fileSystem: {
        type: 'directory',
        contents: {
            home: { type: 'directory', contents: {} },
            Documents: { type: 'directory', contents: {} }
        }
    },
    currentPath: ['/'],
    history: []
};

export const checkLesson4Completion = (state) => {
    try {
        // 1. Проверка существования data.txt (с правильным именем файла)
        const dataFile = state.fileSystem.contents?.['data.txt']?.type === 'file';
        if (!dataFile) return false;

        // 2. Проверка что data.txt содержит ровно 10 непустых строк
        const dataContent = state.fileSystem.contents['data.txt'].contents || '';
        const dataLines = dataContent.split('\n').filter(l => l.trim() !== '');
        if (dataLines.length !== 10) return false;

        // 3. Проверка выполнения команд с любыми аргументами
        const hasSort = state.history.some(entry =>
            entry.command.includes('sort data.txt')
        );
        const hasUniq = state.history.some(entry =>
            entry.command.includes('uniq data.txt')
        );

        // 4. Проверка команд просмотра с разными форматами
        const hasHead = state.history.some(entry =>
            /head (-n3|-\s*3)/.test(entry.command)
        );
        const hasTail = state.history.some(entry =>
            /tail (-n3|-\s*3)/.test(entry.command)
        );

        return hasSort && hasUniq && hasHead && hasTail;
    } catch(e) {
        return false;
    }
};