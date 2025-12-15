/* Login: valida formulário, realiza requisição de autenticação e armazena token */
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector(".auth-box form");
    const submitButton = loginForm.querySelector('button[type="submit"]');
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        /* Captura valores do formulário e valida campos */
        const usuario = document.getElementById("usuario").value.trim();
        const password = document.getElementById("senha").value.trim();
        if (!usuario || !password) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        /* Feedback de carregamento no botão */
        submitButton.disabled = true;
        const originalText = submitButton.textContent;
        submitButton.textContent = "Conectando...";
        try {
            const response = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario, password }),
            });
            if (response.ok) {
                const result = await response.json();
                const token = result.dados?.[0]?.token || result.token;
                if (token) {
                    localStorage.setItem("token", token);
                    window.location.href = "home.html";
                } else {
                    alert("Erro: Token não recebido do servidor.");
                }
            } else {
                const result = await response.json();
                alert(result.mensagem || result.message || "Usuário ou senha inválidos.");
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor. Verifique sua conexão.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
});


