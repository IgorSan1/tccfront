(function() {
    const API_BASE = "/api/v1";
    const token = localStorage.getItem("token");

    let todosPacientes = [];
    let pacientesFiltrados = [];
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 10;
    let isAdmin = false;

    function verificarPermissao() {
        if (!token) {
            alert("Você precisa estar logado para acessar esta página.");
            window.location.href = "login.html";
            return false;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            isAdmin = payload.role === 'ADMIN';
            return true;
        } catch (e) {
            alert("Sessão inválida. Faça login novamente.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return false;
        }
    }

    function configurarInterface() {
        const filtroStatusContainer = document.getElementById('filtro-status-container');
        const colunaStatusHeader = document.getElementById('coluna-status-header');
        const filtroPacienteInput = document.getElementById('filtro-paciente');
        
        if (isAdmin) {
            if (filtroStatusContainer) {
                filtroStatusContainer.style.display = 'block';
            }
            if (colunaStatusHeader) {
                colunaStatusHeader.style.display = 'table-cell';
            }
        } else {
            if (filtroStatusContainer) filtroStatusContainer.style.display = 'none';
            if (colunaStatusHeader) colunaStatusHeader.style.display = 'none';
        }

        if (filtroPacienteInput) {
            filtroPacienteInput.placeholder = "Buscar por CPF";
        }
    }

    // ===== FUNÇÕES AUXILIARES =====
    function formatarCpf(cpf) {
        if (!cpf || cpf.length !== 11) return cpf;
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    function formatarData(data) {
        if (!data) return "-";
        
        if (data.includes('/')) return data;
        
        if (data.includes('-')) {
            const [ano, mes, dia] = data.split('-');
            return `${dia}/${mes}/${ano}`;
        }
        
        return data;
    }

    function normalizeText(text) {
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // ===== APLICAR MÁSCARA DE CPF NO CAMPO DE BUSCA =====
    function aplicarMascaraCpf() {
        const filtroPacienteInput = document.getElementById('filtro-paciente');
        
        if (filtroPacienteInput) {
            filtroPacienteInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.slice(0, 11);
                
                if (value.length > 9) {
                    e.target.value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                } else if (value.length > 6) {
                    e.target.value = value.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
                } else if (value.length > 3) {
                    e.target.value = value.replace(/(\d{3})(\d{3})/, "$1.$2");
                } else {
                    e.target.value = value;
                }
            });
        }
    }

    // ===== CARREGAR PACIENTES =====
    async function carregarPacientes() {
        const loading = document.getElementById('loading');
        const tbody = document.getElementById('pacientes-table-body');
        const msgVazio = document.getElementById('pacientes-vazio');

        loading.style.display = 'block';
        tbody.innerHTML = '';
        msgVazio.style.display = 'none';

        try {
            

            // USER: buscar apenas ativos | ADMIN: buscar todos
            const endpoint = isAdmin ? 
                `${API_BASE}/pessoa/all?size=1000&page=0` : 
                `${API_BASE}/pessoa?size=1000&page=0`;

            

            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao carregar pacientes: ${response.status}`);
            }

            const data = await response.json();
            

            let pacientes = [];
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                pacientes = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                pacientes = data.dados;
            }

            todosPacientes = pacientes;
            pacientesFiltrados = [...pacientes];

            renderizarTabela(pacientes);

        } catch (error) {
            
            alert("Erro ao carregar pacientes. Verifique sua conexão.");
        } finally {
            loading.style.display = 'none';
        }
    }

    // ===== ✅ CORRIGIDO: RENDERIZAR TABELA =====
    function renderizarTabela(pacientes) {
        const tbody = document.getElementById('pacientes-table-body');
        const msgVazio = document.getElementById('pacientes-vazio');

        if (pacientes.length === 0) {
            tbody.innerHTML = '';
            msgVazio.style.display = 'block';
            removerPaginacao();
            return;
        }

        tbody.innerHTML = '';
        msgVazio.style.display = 'none';

        // Ordenar por mais recente
        const pacientesOrdenados = [...pacientes].sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (a.id && b.id) {
                return b.id - a.id;
            }
            return a.nomeCompleto.localeCompare(b.nomeCompleto);
        });

        // Paginação
        const totalPaginas = Math.ceil(pacientesOrdenados.length / ITENS_POR_PAGINA);
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        const pacientesPaginados = pacientesOrdenados.slice(inicio, fim);

        pacientesPaginados.forEach(paciente => {
            const row = tbody.insertRow();

            // Nome Completo
            row.insertCell().textContent = paciente.nomeCompleto || '-';

            // CPF
            row.insertCell().textContent = formatarCpf(paciente.cpf) || '-';

            // Data Nascimento
            row.insertCell().textContent = formatarData(paciente.dataNascimento) || '-';

            // Sexo
            row.insertCell().textContent = paciente.sexo || '-';

            // Comunidade
            row.insertCell().textContent = paciente.comunidade || '-';

            // ✅ CORRIGIDO: COLUNA STATUS - APENAS PARA ADMIN E COM VALOR CORRETO
            if (isAdmin) {
                const cellStatus = row.insertCell();
                const badgeStatus = document.createElement('span');
                badgeStatus.className = `badge-status ${paciente.ativo ? 'ativo' : 'inativo'}`;
                badgeStatus.textContent = paciente.ativo ? 'Ativo' : 'Inativo';
                cellStatus.appendChild(badgeStatus);
                
                
            }

            // Ações
            const cellAcoes = row.insertCell();
            cellAcoes.className = 'action-buttons-cell';
            
            const actionDiv = document.createElement('div');
            actionDiv.style.cssText = 'display: flex; gap: 8px; justify-content: center; align-items: center;';
            
            // Botão Ver Detalhes
            const btnVer = document.createElement('button');
            btnVer.className = 'btn-action btn-view';
            btnVer.innerHTML = '<i class="fa-solid fa-eye"></i> Ver';
            btnVer.title = 'Ver detalhes';
            btnVer.onclick = () => verDetalhes(paciente);
            actionDiv.appendChild(btnVer);
            
            // ✅ Botão Reativar - APENAS PARA ADMIN e PACIENTES INATIVOS
            if (isAdmin && !paciente.ativo) {
                const btnReativar = document.createElement('button');
                btnReativar.className = 'btn-action btn-reactivate';
                btnReativar.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Reativar';
                btnReativar.title = 'Reativar paciente';
                btnReativar.onclick = () => abrirModalReativar(paciente);
                actionDiv.appendChild(btnReativar);
            }
            
            cellAcoes.appendChild(actionDiv);
        });

        criarPaginacao(pacientesOrdenados.length);
    }

    // ===== VER DETALHES DO PACIENTE =====
    function verDetalhes(paciente) {
        
        localStorage.setItem("pacienteSelecionado", JSON.stringify(paciente));
        window.location.href = `paciente-detalhes.html?cpf=${paciente.cpf}`;
    }

    // ===== MODAL DE REATIVAÇÃO =====
    let pacienteParaReativar = null;

    window.abrirModalReativar = function(paciente) {
        
        pacienteParaReativar = paciente;
        document.getElementById('nome-paciente-reativar').textContent = paciente.nomeCompleto;
        document.getElementById('modal-reativar-paciente').style.display = 'flex';
    };

    window.fecharModalReativar = function() {
        document.getElementById('modal-reativar-paciente').style.display = 'none';
        pacienteParaReativar = null;
    };

    // ===== ✅ CORRIGIDO: REATIVAR PACIENTE (robusto) =====
    // Extrai a lógica para função reutilizável e adiciona fallback caso o elemento não exista
    async function reativarPaciente() {
        if (!pacienteParaReativar) {
            
            alert('Nenhum paciente selecionado para reativar.');
            return;
        }

        

        try {
            // Incluir explicitamente 'ativo: true' para garantir que o paciente seja reativado
            const payload = {
                nomeCompleto: pacienteParaReativar.nomeCompleto,
                cpf: pacienteParaReativar.cpf,
                sexo: pacienteParaReativar.sexo,
                dataNascimento: formatarData(pacienteParaReativar.dataNascimento),
                comorbidade: pacienteParaReativar.comorbidade || "Nenhuma",
                etnia: pacienteParaReativar.etnia,
                cns: pacienteParaReativar.cns,
                comunidade: pacienteParaReativar.comunidade,
                ativo: true
            };

            

            const uuidParaUso = pacienteParaReativar.uuid ?? pacienteParaReativar.id;
            const response = await fetch(`${API_BASE}/pessoa/${uuidParaUso}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            

            if (response.ok || response.status === 204) {
                alert(`Paciente "${pacienteParaReativar.nomeCompleto}" reativado com sucesso!`);
                fecharModalReativar();
                await carregarPacientes();
            } else {
                const errorData = await response.json().catch(() => ({}));
                
                alert(`Erro ao reativar paciente: ${errorData.mensagem || response.statusText || response.status}`);
            }
        } catch (error) {
            
            alert("Erro ao conectar com o servidor.");
        }
    }

    // Tenta anexar o listener diretamente; se o botão não existir, usa delegação no documento como fallback
    const _btnConfirmarReativar = document.getElementById('btn-confirmar-reativar');
    if (_btnConfirmarReativar) {
        _btnConfirmarReativar.addEventListener('click', reativarPaciente);
    } else {
        document.addEventListener('click', function(e) {
            const target = e.target;
            if (!target) return;

            // verifica id ou se um ancestral do elemento possui esse id (por exemplo: ícone dentro do botão)
            if (target.id === 'btn-confirmar-reativar' || (target.closest && target.closest('#btn-confirmar-reativar'))) {
                reativarPaciente();
            }
        });
    }

    // ===== ✅ CORRIGIDO: FILTRAR PACIENTES =====
    function filtrarPacientes() {
        const filtroCpf = document.getElementById('filtro-paciente').value.replace(/\D/g, '').trim();
        const filtroStatus = isAdmin ? document.getElementById('filtro-status').value : '';
        
        const resultadoDiv = document.getElementById('resultado-filtro');
        const btnLimpar = document.getElementById('limpar-filtro');

        if (filtroCpf.length > 0 || filtroStatus) {
            btnLimpar.style.display = 'flex';
        } else {
            btnLimpar.style.display = 'none';
        }

        pacientesFiltrados = todosPacientes.filter(paciente => {
            // Filtro de CPF
            let passaFiltroCpf = true;
            if (filtroCpf) {
                const cpfPaciente = paciente.cpf || '';
                passaFiltroCpf = cpfPaciente.includes(filtroCpf);
            }

            // ✅ CORRIGIDO: Filtro de status (apenas para admin)
            let passaFiltroStatus = true;
            if (isAdmin && filtroStatus) {
                const statusBoolean = filtroStatus === 'true';
                passaFiltroStatus = paciente.ativo === statusBoolean;
                
            }

            return passaFiltroCpf && passaFiltroStatus;
        });

        if (filtroCpf || filtroStatus) {
            if (pacientesFiltrados.length > 0) {
                resultadoDiv.textContent = `${pacientesFiltrados.length} paciente(s) encontrado(s)`;
                resultadoDiv.className = 'resultado-filtro tem-resultados';
            } else {
                resultadoDiv.textContent = 'Nenhum paciente encontrado com este filtro';
                resultadoDiv.className = 'resultado-filtro sem-resultados';
            }
        } else {
            resultadoDiv.textContent = '';
            resultadoDiv.className = 'resultado-filtro';
        }

        paginaAtual = 1;
        renderizarTabela(pacientesFiltrados);
    }

    function limparFiltros() {
        document.getElementById('filtro-paciente').value = '';
        if (isAdmin) {
            document.getElementById('filtro-status').value = '';
        }
        paginaAtual = 1;
        filtrarPacientes();
        document.getElementById('filtro-paciente').focus();
    }

    // ===== PAGINAÇÃO =====
    function criarPaginacao(totalItens) {
        const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);
        
        const paginacaoExistente = document.querySelector('.paginacao-container');
        if (paginacaoExistente) {
            paginacaoExistente.remove();
        }

        if (totalPaginas <= 1) return;

        const card = document.querySelector('.card');
        const paginacaoContainer = document.createElement('div');
        paginacaoContainer.className = 'paginacao-container';

        const info = document.createElement('div');
        info.className = 'paginacao-info';
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
        const fim = Math.min(paginaAtual * ITENS_POR_PAGINA, totalItens);
        info.textContent = `Mostrando ${inicio} a ${fim} de ${totalItens} pacientes`;

        const botoesContainer = document.createElement('div');
        botoesContainer.className = 'paginacao-botoes';

        const btnAnterior = criarBotaoPaginacao(
            '<i class="fa-solid fa-chevron-left"></i> Anterior',
            paginaAtual === 1,
            () => {
                if (paginaAtual > 1) {
                    paginaAtual--;
                    renderizarTabela(pacientesFiltrados);
                    scrollToTop();
                }
            }
        );

        const paginasNumeros = document.createElement('div');
        paginasNumeros.style.cssText = 'display: flex; gap: 0.3rem;';

        for (let i = 1; i <= Math.min(totalPaginas, 5); i++) {
            const btnPagina = criarBotaoNumeroPagina(i, i === paginaAtual);
            paginasNumeros.appendChild(btnPagina);
        }

        const btnProximo = criarBotaoPaginacao(
            'Próximo <i class="fa-solid fa-chevron-right"></i>',
            paginaAtual === totalPaginas,
            () => {
                if (paginaAtual < totalPaginas) {
                    paginaAtual++;
                    renderizarTabela(pacientesFiltrados);
                    scrollToTop();
                }
            }
        );

        botoesContainer.appendChild(btnAnterior);
        botoesContainer.appendChild(paginasNumeros);
        botoesContainer.appendChild(btnProximo);

        paginacaoContainer.appendChild(info);
        paginacaoContainer.appendChild(botoesContainer);
        card.appendChild(paginacaoContainer);
    }

    function criarBotaoPaginacao(html, disabled, onClick) {
        const btn = document.createElement('button');
        btn.className = 'btn-paginacao';
        btn.innerHTML = html;
        btn.disabled = disabled;
        if (!disabled) btn.onclick = onClick;
        return btn;
    }

    function criarBotaoNumeroPagina(numero, isAtiva) {
        const btn = document.createElement('button');
        btn.className = `btn-pagina-numero ${isAtiva ? 'ativa' : ''}`;
        btn.textContent = numero;
        if (!isAtiva) {
            btn.onclick = () => {
                paginaAtual = numero;
                renderizarTabela(pacientesFiltrados);
                scrollToTop();
            };
        }
        return btn;
    }

    function removerPaginacao() {
        const paginacaoExistente = document.querySelector('.paginacao-container');
        if (paginacaoExistente) paginacaoExistente.remove();
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ===== EVENTOS =====
    const filtroInput = document.getElementById('filtro-paciente');
    const filtroStatus = document.getElementById('filtro-status');
    const btnLimpar = document.getElementById('limpar-filtro');

    if (filtroInput) {
        let debounceTimer;
        filtroInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filtrarPacientes, 300);
        });
    }

    if (filtroStatus) filtroStatus.addEventListener('change', filtrarPacientes);
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);

    // Fechar modal ao clicar fora
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('modal-reativar-paciente');
        if (e.target === modal) {
            fecharModalReativar();
        }
    });

    // ===== INICIALIZAR =====
    if (verificarPermissao()) {
        configurarInterface();
        aplicarMascaraCpf();
        carregarPacientes();
    }
})();



