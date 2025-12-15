(function() {
    function decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }
    function logout() {
        const confirmar = confirm("Deseja realmente sair do sistema?");
        if (!confirmar) return;
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("pacienteSelecionado");
            sessionStorage.clear();
            window.location.href = "login.html";
        } catch (error) {
            alert("Erro ao fazer logout. Você será redirecionado para a página de login.");
            window.location.href = "login.html";
        }
    }
    function criarDropdownUsuario() {
        const userProfile = document.querySelector(".user-profile");
        if (!userProfile) return;
        if (userProfile.querySelector('.user-dropdown')) return;
        const userSpan = userProfile.querySelector('span');
        if (userSpan) {
            const indicator = document.createElement('i');
            indicator.className = 'fa-solid fa-chevron-down dropdown-indicator';
            userSpan.insertAdjacentElement('afterend', indicator);
        }
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <a href="perfil.html" class="user-dropdown-item" data-action="navigate">
                <i class="fa-solid fa-user"></i>
                <span>Meu Perfil</span>
            </a>
            <div class="user-dropdown-divider"></div>
            <button type="button" class="user-dropdown-item logout" id="btn-logout-header" data-action="logout">
                <i class="fa-solid fa-right-from-bracket"></i>
                <span>Sair</span>
            </button>
        `;
        userProfile.appendChild(dropdown);
        userProfile.removeAttribute('href');
        userProfile.style.cursor = 'pointer';
        userProfile.addEventListener('click', function(e) {
            if (e.target.closest('.user-dropdown-item')) return;
            if (e.target.classList.contains('user-dropdown')) return;
            e.preventDefault();
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('show');
            dropdown.classList.toggle('show');
            userProfile.classList.toggle('active');
            const indicator = userProfile.querySelector('.dropdown-indicator');
            if (indicator) {
                indicator.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                dropdown.classList.remove('show');
                userProfile.classList.remove('active');
                const indicator = userProfile.querySelector('.dropdown-indicator');
                if (indicator) {
                    indicator.style.transform = 'rotate(0deg)';
                }
            }
        });
        const btnLogout = document.getElementById('btn-logout-header');
        if (btnLogout) {
            btnLogout.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                logout();
            });
        }
        const dropdownItems = dropdown.querySelectorAll('.user-dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function() {
                setTimeout(() => {
                    dropdown.classList.remove('show');
                    userProfile.classList.remove('active');
                    const indicator = userProfile.querySelector('.dropdown-indicator');
                    if (indicator) {
                        indicator.style.transform = 'rotate(0deg)';
                    }
                }, 100);
            });
        });
    }
    function inicializar() {
        const token = localStorage.getItem("token");
        if (!token) {
            if (!window.location.href.includes('login.html')) {
                window.location.href = "login.html";
            }
            return;
        }
        const decodedToken = decodeJWT(token);
        const username = decodedToken?.sub;
        const role = decodedToken?.role;
        if (username) {
            const userProfileSpan = document.querySelector(".user-profile span");
            if (userProfileSpan) {
                userProfileSpan.textContent = username;
            }
            if (role === 'ADMIN') {
                const userProfile = document.querySelector(".user-profile");
                if (userProfile && !userProfile.querySelector('.admin-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'admin-badge';
                    badge.style.cssText = `
                        background-color: #dc3545;
                        color: white;
                        font-size: 0.65rem;
                        padding: 0.15rem 0.4rem;
                        border-radius: 10px;
                        margin-left: 0.3rem;
                        font-weight: 700;
                    `;
                    badge.textContent = 'ADMIN';
                    const span = userProfile.querySelector('span');
                    if (span) {
                        span.insertAdjacentElement('afterend', badge);
                    } else {
                        userProfile.appendChild(badge);
                    }
                }
            }
        }
        criarDropdownUsuario();
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedToken?.exp && decodedToken.exp < currentTime) {
            alert("Sua sessão expirou. Faça login novamente.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
})();


