(function(){
    const API_BASE = "/api/v1";
    let usuarioAtual = null;
    let isAdmin = false;
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
    function formatarCpf(cpf) {
        if (!cpf) return "";
        const digits = cpf.replace(/\D/g, "");
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    function formatarTelefone(telefone) {
        if (!telefone) return "";
        const digits = telefone.replace(/\D/g, "");
        if (digits.length === 11) {
            return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        } else if (digits.length === 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }
        return telefone;
    }
    function formatarData(data) {
        if (!data) return "";
        if (data.includes('/')) {
            return data;
        }
        if (data.includes('-')) {
            const [ano, mes, dia] = data.split("-");
            return `${dia}/${mes}/${ano}`;
        }
        try {
            const date = new Date(data);
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const ano = date.getFullYear();
            return `${dia}/${mes}/${ano}`;
        } catch (e) {
            return data;
        }
    }
    function formatarDataParaInput(data) {
        if (!data) return "";
        if (data.includes('/')) {
            const [dia, mes, ano] = data.split('/');
            return `${ano}-${mes}-${dia}`;
        }
        if (data.includes('-')) {
            return data.split('T')[0];
        }
        return "";
    }
    function formatDateToDDMMYYYY(isoDate) {
        if (!isoDate) return null;
        const [y, m, d] = isoDate.split("-");
        return `${d}/${m}/${y}`;
    }
    function formatarCargo(cargo) {
        if (!cargo) return "";
        const cargos = {
            'TECNICO': 'Técnico',
            'ENFERMEIRO': 'Enfermeiro',
            'TECNICO_DE_ENFERMAGEM': 'Técnico de Enfermagem'
        };
        return cargos[cargo] || cargo;
    }
    async function carregarPerfilUsuario() {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Você precisa estar logado para acessar o perfil.");
            window.location.href = "login.html";
            return;
        }
        const decodedToken = decodeJWT(token);
        const username = decodedToken?.sub;
        const role = decodedToken?.role;
        if (!username) {
            alert("Token inválido. Faça login novamente.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }
        isAdmin = (role === 'ADMIN');
        try {
            const resp = await fetch(`${API_BASE}/usuario?size=1000&page=0`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!resp.ok) {
                preencherPerfilDoToken(decodedToken);
                return;
            }
            const data = await resp.json().catch(() => ({}));
            let usuarios = [];
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                usuarios = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                usuarios = data.dados;
            }
            const usuario = usuarios.find(u => u.usuario === username);
            if (usuario) {
                usuarioAtual = usuario;
                preencherPerfil(usuario);
            } else {
                preencherPerfilDoToken(decodedToken);
            }
        } catch (err) {
            preencherPerfilDoToken(decodedToken);
        }
    }
    function preencherPerfilDoToken(decodedToken) {
        const headerUserSpan = document.querySelector(".user-profile span");
        if (headerUserSpan) {
            headerUserSpan.textContent = decodedToken.sub || "Administrador";
        }
        document.getElementById('view-usuario').value = decodedToken.sub || "";
        if (isAdmin) {
            const perfilCard = document.querySelector('.profile-card');
            const avisoDiv = document.createElement('div');
            avisoDiv.className = 'info-box';
            avisoDiv.style.cssText = `
                background: #fff9e6;
                border-left: 4px solid #ffc107;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1.5rem;
            `;
            avisoDiv.innerHTML = `
                <strong style="color: #856404; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-circle-info"></i> Perfil Administrativo
                </strong>
                <p style="margin-top: 0.5rem; color: #212529; font-size: 0.9rem;">
                    Você está logado como <strong>Administrador do Sistema</strong>. 
                    Este perfil não possui informações detalhadas cadastradas.
                    <br><br>
                    Para ter um perfil completo com todas as informações, cadastre-se como usuário através da página 
                    <a href="cadastrar-usuario.html" style="color: #007BFF; font-weight: 600;">Cadastrar Usuário</a> 
                    e selecione o perfil ADMIN.
                </p>
            `;
            const profileHeader = perfilCard.querySelector('.profile-header');
            profileHeader.after(avisoDiv);
            const btnEditar = document.getElementById('btn-editar-perfil');
            if (btnEditar) {
                btnEditar.style.display = 'none';
            }
            document.getElementById('view-cpf').value = "N/A";
            document.getElementById('view-data-nascimento').value = "N/A";
            document.getElementById('view-nome-completo').value = decodedToken.sub || "Administrador";
            document.getElementById('view-email').value = "N/A";
            document.getElementById('view-telefone').value = "N/A";
            document.getElementById('view-cargo').value = "Administrador do Sistema";
        }
    }
    function preencherPerfil(usuario) {
        const headerUserSpan = document.querySelector(".user-profile span");
        if (headerUserSpan) {
            headerUserSpan.textContent = usuario.usuario || "Usuário";
        }
        document.getElementById('view-usuario').value = usuario.usuario || "";
        document.getElementById('view-cpf').value = formatarCpf(usuario.cpf) || "";
        document.getElementById('view-data-nascimento').value = formatarData(usuario.dataNascimento) || "";
        document.getElementById('view-nome-completo').value = usuario.nomeCompleto || "";
        document.getElementById('view-email').value = usuario.email || "";
        document.getElementById('view-telefone').value = formatarTelefone(usuario.telefone) || "";
        document.getElementById('view-cargo').value = formatarCargo(usuario.cargo) || "";
    }
    window.abrirModalEdicaoPerfil = function() {
        if (!usuarioAtual) {
            alert("Erro: Perfil não disponível para edição. Apenas usuários com cadastro completo podem editar o perfil.");
            return;
        }
        document.getElementById('edit-usuario-uuid').value = usuarioAtual.uuid;
        document.getElementById('edit-usuario').value = usuarioAtual.usuario || '';
        document.getElementById('edit-cpf').value = formatarCpf(usuarioAtual.cpf) || '';
        const dataNasc = formatarDataParaInput(usuarioAtual.dataNascimento);
        document.getElementById('edit-data-nascimento').value = dataNasc;
        document.getElementById('edit-nome-completo').value = usuarioAtual.nomeCompleto || '';
        document.getElementById('edit-email').value = usuarioAtual.email || '';
        document.getElementById('edit-telefone').value = usuarioAtual.telefone || '';
        document.getElementById('edit-cargo').value = usuarioAtual.cargo || '';
        document.getElementById('edit-senha').value = '';
        document.getElementById('edit-confirmar-senha').value = '';
        const campoCargo = document.getElementById('edit-cargo');
        const avisoCargo = document.getElementById('aviso-cargo-bloqueado');
        if (isAdmin) {
            campoCargo.disabled = false;
            campoCargo.style.backgroundColor = '';
            campoCargo.style.color = '';
            campoCargo.style.cursor = '';
            avisoCargo.style.display = 'none';
        } else {
            campoCargo.disabled = true;
            campoCargo.style.backgroundColor = 'var(--input-background)';
            campoCargo.style.color = 'var(--text-secondary)';
            campoCargo.style.cursor = 'not-allowed';
            avisoCargo.style.display = 'block';
        }
        const secaoSeguranca = document.getElementById('secao-seguranca');
        const campoSenha = document.getElementById('edit-senha');
        const campoConfirmarSenha = document.getElementById('edit-confirmar-senha');
        const avisoSenha = document.getElementById('aviso-senha-bloqueada');
        if (isAdmin) {
            secaoSeguranca.style.display = 'block';
            campoSenha.disabled = false;
            campoConfirmarSenha.disabled = false;
            avisoSenha.style.display = 'none';
        } else {
            secaoSeguranca.style.display = 'none';
            campoSenha.disabled = true;
            campoConfirmarSenha.disabled = true;
        }
        document.getElementById('modal-editar-perfil').style.display = 'flex';
    };
    window.fecharModalEdicaoPerfil = function() {
        document.getElementById('modal-editar-perfil').style.display = 'none';
        document.getElementById('form-editar-perfil').reset();
    };
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('modal-editar-perfil');
        if (e.target === modal) {
            fecharModalEdicaoPerfil();
        }
    });
    document.getElementById('form-editar-perfil').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!usuarioAtual) {
            alert("Erro: Não é possível editar este perfil.");
            return;
        }
        const usuarioUuid = document.getElementById('edit-usuario-uuid').value;
        const usuario = document.getElementById('edit-usuario').value.trim();
        const nomeCompleto = document.getElementById('edit-nome-completo').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const telefone = document.getElementById('edit-telefone').value.replace(/\D/g, '');
        const dataNascimentoInput = document.getElementById('edit-data-nascimento').value;
        const cargo = document.getElementById('edit-cargo').value;
        const senha = document.getElementById('edit-senha').value;
        const confirmarSenha = document.getElementById('edit-confirmar-senha').value;
        if (!usuario || !nomeCompleto || !email || !dataNascimentoInput || !cargo) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Por favor, informe um e-mail válido.");
            return;
        }
        let novaSenha = null;
        if (isAdmin && senha) {
            if (senha !== confirmarSenha) {
                alert("As senhas não coincidem.");
                return;
            }
            if (senha.length < 4) {
                alert("A senha deve ter pelo menos 4 caracteres.");
                return;
            }
            novaSenha = senha;
        }
        const dataNascimento = formatDateToDDMMYYYY(dataNascimentoInput);
        const cpf = usuarioAtual.cpf;
        const role = usuarioAtual.role;
        const payload = {
            nomeCompleto,
            cpf,
            dataNascimento,
            email,
            telefone,
            usuario,
            role,
            cargo
        };
        if (novaSenha) {
            payload.password = novaSenha;
        }
        try {
            const token = localStorage.getItem("token");
            const decodedToken = decodeJWT(token);
            const usernameAtual = decodedToken?.sub;
            const alterouUsuario = (usuario !== usernameAtual);
            const response = await fetch(`${API_BASE}/usuario/${usuarioUuid}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                alert("Perfil atualizado com sucesso!");
                fecharModalEdicaoPerfil();
                if (alterouUsuario) {
                    alert("Seu nome de usuário foi alterado. Você será redirecionado para fazer login novamente com suas novas credenciais.");
                    localStorage.removeItem("token");
                    localStorage.removeItem("pacienteSelecionado");
                    window.location.href = "login.html";
                } else {
                    await carregarPerfilUsuario();
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao atualizar perfil: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor.");
        }
    });
    const telefoneInput = document.getElementById('edit-telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length === 0) {
                e.target.value = "";
            } else if (value.length <= 2) {
                e.target.value = `(${value}`;
            } else if (value.length <= 7) {
                e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            } else {
                e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
            }
        });
    }
    const btnEditar = document.getElementById('btn-editar-perfil');
    if (btnEditar) {
        btnEditar.addEventListener('click', abrirModalEdicaoPerfil);
    }
    carregarPerfilUsuario();
})();


