export const lesson1InitialState = {
    fileSystem: {
        type: 'directory',
        contents: {
            home: { type: 'directory', contents: {} },
            Documents: { type: 'directory', contents: {} },
            etc: { type: 'directory', contents: {} },
            cmd: { type: 'directory', contents: {} }
        }
    },
    currentPath: ['/'],
    history: []
};
// Проверка выполнения урока 1
export const checkLesson1Completion = (state) => {
    // Нормализация текущего пути
    const normalizedPath = state.currentPath
        .join('/')
        .replace(/\/+/g, '/') // Удаляем дублирующиеся слеши
        .replace(/\/$/, '');  // Удаляем trailing slash

    // Проверка что находимся в /Documents
    const inDocuments = normalizedPath === '/Documents';

    // Проверка существования MyFolder
    const dirExists = state.fileSystem.contents?.Documents?.contents?.MyFolder?.type === 'directory';

    return inDocuments && dirExists;
};