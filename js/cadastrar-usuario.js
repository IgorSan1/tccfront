document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "/api/v1";
    const form = document.getElementById("cadastroUsuarioForm");
    const submitButton = form.querySelector('button[type="submit"]');
    verificarPermissaoAdmin();
    function verificarPermissaoAdmin() {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Você precisa estar logado para acessar esta página.");
            window.location.href = "login.html";
            return;
        }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role !== 'ADMIN') {
                alert("Apenas usuários ADMIN podem cadastrar novos usuários.");
                window.location.href = "home.html";
                return;
            }
            const agora = Math.floor(Date.now() / 1000);
            if (payload.exp < agora) {
                alert("Sua sessão expirou. Faça login novamente.");
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return;
            }
        } catch (e) {
            alert("Sessão inválida. Faça login novamente.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
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
    function applyPhoneMask(value) {
        const digits = (value || "").replace(/\D/g, "").slice(0, 11);
        if (digits.length === 0) return "";
        if (digits.length <= 2) return `(${digits}`;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    const cpfInput = document.getElementById("cpf");
    if (cpfInput) {
        cpfInput.addEventListener("input", () => {
            cpfInput.value = applyCpfMask(cpfInput.value);
        });
    }
    const telefoneInput = document.getElementById("telefone");
    if (telefoneInput) {
        telefoneInput.addEventListener("input", () => {
            telefoneInput.value = applyPhoneMask(telefoneInput.value);
        });
    }
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const nomeCompleto = document.getElementById("nomeCompleto").value.trim();
        const usuario = document.getElementById("usuario").value.trim();
        const email = document.getElementById("email").value.trim();
        const cpf = document.getElementById("cpf").value.replace(/\D/g, "");
        const telefone = document.getElementById("telefone").value.replace(/\D/g, "");
        const dataNascimento = document.getElementById("dataNascimento").value;
        const cargo = document.getElementById("cargo").value;
        const senha = document.getElementById("senha").value;
        const confirmarSenha = document.getElementById("confirmarSenha").value;
        const role = document.getElementById("role").value;
        if (!nomeCompleto || !usuario || !email || !cpf || !dataNascimento || !cargo || !senha || !confirmarSenha || !role) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        if (cpf.length !== 11) {
            alert("CPF deve ter exatamente 11 dígitos.");
            return;
        }
        if (senha !== confirmarSenha) {
            alert("As senhas não coincidem.");
            return;
        }
        if (senha.length < 4) {
            alert("A senha deve ter pelo menos 4 caracteres.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Por favor, informe um e-mail válido.");
            return;
        }
        const partes = dataNascimento.split("-");
        const dataNascimentoFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
        const data = {
            nomeCompleto,
            usuario,
            email,
            cpf,
            telefone,
            dataNascimento: dataNascimentoFormatada,
            cargo,
            password: senha,
            role
        };
        submitButton.disabled = true;
        const originalText = submitButton.textContent;
        submitButton.textContent = "Cadastrando...";
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Você precisa estar logado para cadastrar um usuário.");
                window.location.href = "login.html";
                return;
            }
            const response = await fetch(`${API_BASE}/usuario`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                alert("Usuário cadastrado com sucesso!");
                form.reset();
                window.location.href = "home.html";
            } else if (response.status === 403) {
                alert("Apenas usuários ADMIN podem cadastrar novos usuários.");
            } else {
                const errorData = await response.json().catch(() => ({ mensagem: response.statusText }));
                let mensagemErro = errorData.mensagem || errorData.message || 'Erro desconhecido';
                if (errorData.erros) {
                    const erros = Array.isArray(errorData.erros) ? errorData.erros : [errorData.erros];
                    mensagemErro = erros.join('\n');
                }
                alert(`Erro ao cadastrar usuário:\n\n${mensagemErro}`);
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor. Verifique sua conexão.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
    const btnVoltarHome = document.getElementById("btnVoltarHome");
    if (btnVoltarHome) {
        btnVoltarHome.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm("Deseja realmente sair? As informações não serão salvas.")) {
                window.location.href = "home.html";
            }
        });
    }
});


