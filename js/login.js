document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector(".auth-box form");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const usuario = document.getElementById("usuario").value.trim();
        const password = document.getElementById("senha").value.trim();

        if (!usuario || !password) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const result = await ApiService.login(usuario, password);
            const token = result.dados?.[0]?.token || result.token;
            
            if (!token) {
                alert("Erro: Token não recebido do servidor.");
                return;
            }
            
            localStorage.setItem("token", token);
            window.location.href = "home.html";
        } catch (error) {
            alert(error.message || "Usuário ou senha inválidos.");
        }
    });
});




