import { lessons } from './lessonsData.js';
import { createLessonCard } from './lessonCard.js';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('lessons-list');
    const backBtn = document.getElementById('back-btn');

    lessons.forEach(lesson => {
        const card = createLessonCard(lesson, {
            showDescription: true,
            onClick: (lessonId) => {
                window.location.href = `lesson.html?lesson=${lessonId}`;
            }
        });
        container.appendChild(card);
    });

    backBtn.addEventListener('click', () => {
        window.location.href = '../startScreen/View.html';
    });
});