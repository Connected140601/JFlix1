document.addEventListener('DOMContentLoaded', () => {
    const serverButtons = document.querySelectorAll('.server-button');
    serverButtons.forEach(button => {
        button.classList.remove('active');
    });

    const videasyButton = document.getElementById('server-videasy');
    if (videasyButton) {
        videasyButton.classList.add('active');
    }
});
