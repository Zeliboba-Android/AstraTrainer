export const createLessonCard = (lesson, options = {
    defaultStatus: undefined
}) => {
    const card = document.createElement('div');
    card.className = 'lesson-card';

    const status = localStorage.getItem(`lesson${lesson.id}`) || options.defaultStatus || 'not-started';
    const statusText = {
        'completed': 'Выполнено',
        'in-progress': 'В процессе',
        'not-started': 'Не начат'
    }[status];

    card.innerHTML = `
        <h2>Урок ${lesson.id}: ${lesson.title}</h2>
        ${options.showDescription ? `<p>${lesson.description}</p>` : ''}
        <span class="status ${status}">${statusText}</span>
    `;

    if (options.onClick) {
        card.addEventListener('click', () => options.onClick(lesson.id));
    }

    return card;
};