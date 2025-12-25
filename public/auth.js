/**
 * ADA Compliance Scanner - Client Side Auth
 * Include this at the TOP of index.html
 */

(function () {
    const token = localStorage.getItem('ada_auth_token');

    // 1. Check if token exists
    if (!token) {
        console.log('🔒 No token found, redirecting to login...');
        window.location.href = '/login.html';
        return;
    }

    // 2. Attach Authorization header to all Fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function (url, options = {}) {
        // Add headers object if missing
        if (!options.headers) {
            options.headers = {};
        }

        // Add Auth Token (unless it's a login request, though logic here handles all)
        options.headers['Authorization'] = `Bearer ${token}`;

        const response = await originalFetch(url, options);

        // 3. Handle 401/403 (Token Expired or Invalid)
        if (response.status === 401 || response.status === 403) {
            console.log('🔒 Session expired or unauthorized, logging out...');
            localStorage.removeItem('ada_auth_token');
            localStorage.removeItem('ada_user_email');
            window.location.href = '/login.html';
        }

        return response;
    };

    // 4. Add Logout Button Logic (Wait for DOM)
    document.addEventListener('DOMContentLoaded', () => {
        const header = document.querySelector('.header-row') || document.body;

        // Show who is logged in
        const userEmail = localStorage.getItem('ada_user_email') || 'User';

        const userBadge = document.createElement('div');
        userBadge.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(255,255,255,0.1);
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            color: var(--text-muted);
            display: flex;
            gap: 10px;
            align-items: center;
            z-index: 1000;
        `;

        userBadge.innerHTML = `
            <span>👤 ${userEmail}</span>
            <button id="logout-btn" style="
                background: none; 
                border: none; 
                color: var(--accent-error); 
                cursor: pointer; 
                padding: 0; 
                font-size: 0.8rem;
                text-decoration: underline;">Logout</button>
        `;

        document.body.appendChild(userBadge);

        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('ada_auth_token');
            localStorage.removeItem('ada_user_email');
            window.location.href = '/login.html';
        });
    });

})();
