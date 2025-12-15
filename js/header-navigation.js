(function() {
    'use strict';

    

    // ===== CONTROLE DE DROPDOWNS =====
    function initDropdowns() {
        const dropdownItems = document.querySelectorAll('.nav-item.has-dropdown');

        dropdownItems.forEach(item => {
            const link = item.querySelector('.nav-link');
            const dropdown = item.querySelector('.nav-dropdown');

            if (!link || !dropdown) return;

            // Toggle dropdown ao clicar
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Fechar outros dropdowns
                dropdownItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherDropdown = otherItem.querySelector('.nav-dropdown');
                        if (otherDropdown) {
                            otherDropdown.classList.remove('show');
                        }
                    }
                });

                // Toggle do dropdown atual
                const isActive = item.classList.contains('active');
                item.classList.toggle('active');
                dropdown.classList.toggle('show');

                
            });
        });

        // Fechar dropdowns ao clicar fora
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-item.has-dropdown')) {
                dropdownItems.forEach(item => {
                    item.classList.remove('active');
                    const dropdown = item.querySelector('.nav-dropdown');
                    if (dropdown) {
                        dropdown.classList.remove('show');
                    }
                });
            }
        });

        
    }

    // ===== CONTROLE DO MENU MOBILE =====
    function initMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const mainNav = document.getElementById('main-nav');

        if (!mobileToggle || !mainNav) {
            
            return;
        }

        mobileToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isShowing = mainNav.classList.contains('show');
            mainNav.classList.toggle('show');
            
            // Alterar ícone
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.className = isShowing ? 'fa-solid fa-bars' : 'fa-solid fa-times';
            }

            
        });

        // Fechar menu mobile ao clicar fora
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.main-nav') && !e.target.closest('.mobile-menu-toggle')) {
                mainNav.classList.remove('show');
                const icon = mobileToggle.querySelector('i');
                if (icon) {
                    icon.className = 'fa-solid fa-bars';
                }
            }
        });

        
    }

    // ===== DESTACAR PÁGINA ATIVA =====
    function highlightActivePage() {
        const currentPage = window.location.pathname.split('/').pop() || 'home.html';
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes(currentPage)) {
                link.classList.add('active');
                
            }
        });
    }

    // ===== VERIFICAR PERMISSÕES DE ADMIN =====
    function checkAdminPermissions() {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload?.role;

            const navAdmin = document.getElementById('nav-admin');
            
            if (role === 'ADMIN' && navAdmin) {
                navAdmin.style.display = '';
            } else if (navAdmin) {
                navAdmin.style.display = 'none';
            }
        } catch (e) {
            
        }
    }

    // ===== INICIALIZAÇÃO =====
    function init() {
        
        
        initDropdowns();
        initMobileMenu();
        highlightActivePage();
        checkAdminPermissions();
        
        
    }

    // Executar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();



