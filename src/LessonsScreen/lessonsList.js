import { lessons } from './lessonsData.js';
import { createLessonCard } from './lessonCard.js';

document.addEventListener('DOMContentLoaded', () => {
    const lessonsList = document.getElementById('lessons-list');
    const backBtn = document.getElementById('back-btn');

    lessons.forEach(lesson => {
        const card = createLessonCard(lesson, {
            onClick: (lessonId) => {
                window.location.href = `../Lesson/lesson.html?lesson=${lessonId}`;
            }
        });
        lessonsList.appendChild(card);
    });

    backBtn.addEventListener('click', () => {
        window.location.href = '../Terminal/Terminal.html';
    });
});