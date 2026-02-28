document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            const errorMessage = document.getElementById('error-message');
            
            try {
                const response = await apiFetch('/auth/token', 'POST', { username, password });

                if (response.ok) {
                    const token = await response.text();
                    localStorage.setItem('authToken', token);
                    window.location.href = 'index.html';
                } else {
                    const errorText = await response.text();
                    errorMessage.textContent = `Error: ${errorText || response.statusText}`;
                }
            } catch (error) {
                errorMessage.textContent = error.message;
                console.error('Error en el login:', error);
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = registerForm.name.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');

            errorMessage.textContent = '';
            successMessage.textContent = '';

            try {
                const response = await apiFetch('/auth/register', 'POST', { name, email, password });

                if (response.ok) {
                    const result = await response.text();
                    successMessage.textContent = `${result}. Ahora puedes iniciar sesión.`;
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    const errorText = await response.text();
                    errorMessage.textContent = `Error en el registro: ${errorText || response.statusText}`;
                }
            } catch (error) {
                errorMessage.textContent = error.message;
                console.error('Error en el registro:', error);
            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        });
    }

    if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
        }
    }
});
