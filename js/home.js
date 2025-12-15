(function(){
    const API_BASE = "/api/v1";
    const searchBar = document.querySelector(".search-bar");
    let debounceId;
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
    function atualizarNomeUsuario() {
        const token = localStorage.getItem("token");
        if (token) {
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
                        userProfile.appendChild(badge);
                    }
                }
            }
        }
    }
    atualizarNomeUsuario();
    verificarPermissaoAdmin();
    function verificarPermissaoAdmin() {
        const token = localStorage.getItem("token");
        if (!token) return;
        const decodedToken = decodeJWT(token);
        const role = decodedToken?.role;
        const btnCadastroUsuario = document.getElementById("btnCadastroUsuario");
        const btnListarUsuarios = document.getElementById("btnListarUsuarios");
        if (role === 'ADMIN') {
            if (btnCadastroUsuario) btnCadastroUsuario.style.display = "";
            if (btnListarUsuarios) btnListarUsuarios.style.display = "";
        } else {
            if (btnCadastroUsuario) btnCadastroUsuario.style.display = "none";
            if (btnListarUsuarios) btnListarUsuarios.style.display = "none";
        }
    }
    function applyCpfMask(value) {
        const digits = (value || "").replace(/\D/g, "").slice(0, 11);
        const part1 = digits.slice(0, 3);
        const part2 = digits.slice(3, 6);
        const part3 = digits.slice(6, 9);
        const part4 = digits.slice(9, 11);
        let out = part1;
        if (part2) out += `.${part2}`;
        if (part3) out += `.${part3}`;
        if (part4) out += `-${part4}`;
        return out;
    }
    function isCpf(value) {
        const digits = (value || "").replace(/\D/g, "");
        return digits.length === 11;
    }
    searchBar.addEventListener("input", () => {
        const cursorPos = searchBar.selectionStart;
        const oldValue = searchBar.value;
        const newValue = applyCpfMask(searchBar.value);
        searchBar.value = newValue;
        if (oldValue.length < newValue.length) {
            searchBar.setSelectionRange(cursorPos + 1, cursorPos + 1);
        }
    });
    searchBar.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            buscarPaciente();
        }
    });
    searchBar.addEventListener("input", () => {
        clearTimeout(debounceId);
        const cpf = searchBar.value;
        if (isCpf(cpf)) {
            debounceId = setTimeout(() => {
                buscarPaciente();
            }, 500);
        }
    });
    async function buscarPaciente() {
        const cpf = (searchBar.value || "").replace(/\D/g, "");
        if (cpf.length !== 11) {
            alert("Informe um CPF válido com 11 dígitos.");
            return;
        }
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Você precisa estar logado para buscar pacientes.");
            window.location.href = "login.html";
            return;
        }
        searchBar.disabled = true;
        searchBar.style.opacity = "0.6";
        const originalPlaceholder = searchBar.placeholder;
        searchBar.placeholder = "Buscando...";
        try {
            const resp = await fetch(`${API_BASE}/pessoa/buscar-por-cpf`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ cpf: cpf }),
            });
            if (!resp.ok) {
                if (resp.status === 404) {
                    alert("Paciente não encontrado. Verifique se o CPF está correto ou cadastre um novo paciente.");
                } else if (resp.status === 401) {
                    alert("Sessão expirada. Faça login novamente.");
                    localStorage.removeItem("token");
                    window.location.href = "login.html";
                } else {
                    const data = await resp.json().catch(() => ({}));
                    alert(`Erro ao buscar paciente: ${data?.mensagem || 'Erro desconhecido'}`);
                }
                return;
            }
            const raw = await resp.json().catch(() => ({}));
            let pessoa = null;
            if (Array.isArray(raw?.dados) && Array.isArray(raw.dados[0])) {
                pessoa = raw.dados[0][0];
            } else if (Array.isArray(raw?.dados)) {
                pessoa = raw.dados[0];
            } else if (raw?.dados) {
                pessoa = raw.dados;
            } else {
                pessoa = raw;
            }
            if (pessoa && pessoa.uuid) {
                if (pessoa.ativo === false) {
                    alert("Este paciente foi removido do sistema e não pode mais ser acessado.");
                    return;
                }
                localStorage.setItem("pacienteSelecionado", JSON.stringify(pessoa));
                window.location.href = `paciente-detalhes.html?cpf=${cpf}`;
            } else {
                alert("Erro nos dados do paciente. Tente novamente.");
            }
        } catch (err) {
            alert("Erro de conexão. Verifique sua internet e tente novamente.");
        } finally {
            searchBar.disabled = false;
            searchBar.style.opacity = "1";
            searchBar.placeholder = originalPlaceholder;
        }
    }
})();


