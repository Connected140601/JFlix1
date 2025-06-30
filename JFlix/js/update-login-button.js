document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button-nav');
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.email) {
        loginButton.innerHTML = `<i class="fas fa-user"></i> ${user.email}`;
    }
});
