// ============================================================
// Authentication & Session Management
// ============================================================

const Auth = {
    // Hardcoded credentials for Demo purposes
    VALID_USERNAME: 'admin',
    VALID_PASSWORD: 'admin',

    init: function() {
        this.loginOverlay = document.getElementById('login-overlay');
        this.appLayout = document.querySelector('.app-layout');
        this.loginForm = document.getElementById('login-form');
        this.usernameInput = document.getElementById('login-username');
        this.passwordInput = document.getElementById('login-password');
        this.errorMsg = document.getElementById('login-error');

        // Check if user is already authenticated
        if (sessionStorage.getItem('isAuthenticated') === 'true') {
            this.showApp();
        } else {
            this.showLogin();
        }

        // Bind events if elements exist
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    },

    showLogin: function() {
        this.appLayout.style.display = 'none';
        this.loginOverlay.style.display = 'flex';
        // Minor delay to trigger CSS fade in if needed
        setTimeout(() => {
            this.loginOverlay.classList.add('active');
        }, 10);
    },

    showApp: function() {
        this.loginOverlay.style.display = 'none';
        this.loginOverlay.classList.remove('active');
        
        // Show app and trigger its layout recalculations
        this.appLayout.style.display = 'flex';
        
        // Let app know we logged in (can trigger initial setup if app hasn't)
        if (window.app && typeof window.app.fireToast === 'function') {
            // Optional: don't annoy them constantly if they just refreshed
            if (!sessionStorage.getItem('justRefreshed')) {
                 window.app.fireToast('Authentication successful. Welcome Admin.', 'success');
                 sessionStorage.setItem('justRefreshed', 'true');
            }
        }
    },

    handleLogin: function() {
        const user = this.usernameInput.value.trim();
        const pass = this.passwordInput.value.trim();

        // Clear previous error states
        this.errorMsg.style.display = 'none';
        this.usernameInput.classList.remove('error');
        this.passwordInput.classList.remove('error');

        if (user === this.VALID_USERNAME && pass === this.VALID_PASSWORD) {
            // Success
            sessionStorage.setItem('isAuthenticated', 'true');
            
            // Nice fade out
            this.loginOverlay.classList.remove('active');
            
            // Show app after transition
            setTimeout(() => {
                this.showApp();
                // We clear justRefreshed so the toast shows on explicit login
                sessionStorage.removeItem('justRefreshed');
                window.app.fireToast('Authentication successful. Welcome Admin.', 'success');
            }, 300); // 300ms matches css transition
        } else {
            // Failure
            this.errorMsg.textContent = 'Invalid username or password.';
            this.errorMsg.style.display = 'block';
            this.usernameInput.classList.add('error');
            this.passwordInput.classList.add('error');
            
            // Add shake animation class
            const card = document.querySelector('.login-card');
            card.classList.remove('shake');
            void card.offsetWidth; // trigger reflow
            card.classList.add('shake');
        }
    },

    logout: function() {
        sessionStorage.removeItem('isAuthenticated');
        this.usernameInput.value = '';
        this.passwordInput.value = '';
        this.errorMsg.style.display = 'none';
        this.showLogin();
        
        if (window.app && typeof window.app.fireToast === 'function') {
            window.app.fireToast('You have been securely logged out.', 'info');
        }
    }
};

// Initialize early before app.js runs full DOM manipulations
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
