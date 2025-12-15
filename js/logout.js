(function() {
    'use strict';
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
        const span = userProfile.querySelector('span');
        if (span && !userProfile.querySelector('.dropdown-indicator')) {
            const indicator = document.createElement('i');
            indicator.className = 'fa-solid fa-chevron-down dropdown-indicator';
            span.appendChild(indicator);
        }
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <a href="perfil.html" class="user-dropdown-item">
                <i class="fa-solid fa-user"></i>
                <span>Meu Perfil</span>
            </a>
            <div class="user-dropdown-divider"></div>
            <button class="user-dropdown-item logout" id="btn-logout">
                <i class="fa-solid fa-right-from-bracket"></i>
                <span>Sair</span>
            </button>
        `;
        userProfile.appendChild(dropdown);
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            userProfile.classList.toggle('active');
        });
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                dropdown.classList.remove('show');
                userProfile.classList.remove('active');
            }
        });
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                logout();
            });
        }
    }
    function verificarAutenticacao() {
        const token = localStorage.getItem("token");
        const paginaAtual = window.location.pathname.split('/').pop();
        if (!token && paginaAtual !== 'login.html') {
            window.location.href = "login.html";
            return false;
        }
        return true;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (verificarAutenticacao()) {
                criarDropdownUsuario();
            }
        });
    } else {
        if (verificarAutenticacao()) {
            criarDropdownUsuario();
        }
    }
    window.yaravacLogout = logout;
})();


