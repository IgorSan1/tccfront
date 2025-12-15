(function() {
    const API_BASE = "/api/v1";
    const token = localStorage.getItem("token");
    let todasVacinas = [];
    let vacinasFiltradas = [];
    let vacinaEmEdicao = null;
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 5;
    let ordenacaoAtual = {
        campo: 'dataFabricacao', 
        direcao: 'desc' 
    };
    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "login.html";
        return;
    }
    function formatarData(data) {
        if (!data) return "-";
        if (data.includes('/')) {
            return data;
        }
        if (data.includes('-')) {
            const [ano, mes, dia] = data.split('-');
            return `${dia}/${mes}/${ano}`;
        }
        return data;
    }
    function verificarVencimento(dataValidade) {
        if (!dataValidade) return 'vencida';
        let dataValidadeObj;
        if (dataValidade.includes('/')) {
            const [dia, mes, ano] = dataValidade.split('/');
            dataValidadeObj = new Date(ano, mes - 1, dia);
        } else if (dataValidade.includes('-')) {
            const [ano, mes, dia] = dataValidade.split('-');
            dataValidadeObj = new Date(ano, mes - 1, dia.split('T')[0]);
        } else {
            return 'vencida';
        }
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        return dataValidadeObj >= hoje ? 'valida' : 'vencida';
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
    function formatarFabricante(fabricante) {
        if (!fabricante) return "-";
        const fabricantes = {
            'PFIZER_BIONTECH': 'Pfizer Biontech',
            'ASTRAZENECA_FIOCRUZ': 'AstraZeneca Fiocruz',
            'SINOVAC_BUTANTAN': 'Sinovac Butantan',
            'JANSSEN': 'Janssen',
            'MODERNA': 'Moderna',
            'SERUM_INSTITUTE': 'Serum Institute of India',
            'SANOFI_PASTEUR': 'Sanofi Pasteur',
            'GLAXOSMITHKLINE': 'GlaxoSmithKline',
            'MERCK_SHARP_DOHME': 'Merck Sharp & Dohme'
        };
        return fabricantes[fabricante] || fabricante;
    }
    function normalizeText(text) {
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }
    function converterParaDate(dataString) {
        if (!dataString) return new Date(0); 
        if (dataString.includes('/')) {
            const [dia, mes, ano] = dataString.split('/');
            return new Date(ano, mes - 1, dia);
        }
        if (dataString.includes('-')) {
            const [ano, mes, dia] = dataString.split('-');
            return new Date(ano, mes - 1, dia.split('T')[0]);
        }
        return new Date(dataString);
    }
    function ordenarVacinas(vacinas) {
        return [...vacinas].sort((a, b) => {
            let valorA, valorB;
            switch(ordenacaoAtual.campo) {
                case 'dataFabricacao':
                    valorA = converterParaDate(a.dataFabricacao);
                    valorB = converterParaDate(b.dataFabricacao);
                    break;
                case 'dataValidade':
                    valorA = converterParaDate(a.dataValidade);
                    valorB = converterParaDate(b.dataValidade);
                    break;
                case 'nome':
                    valorA = (a.nome || '').toLowerCase();
                    valorB = (b.nome || '').toLowerCase();
                    return ordenacaoAtual.direcao === 'asc' 
                        ? valorA.localeCompare(valorB)
                        : valorB.localeCompare(valorA);
                default:
                    if (a.createdAt && b.createdAt) {
                        valorA = new Date(a.createdAt);
                        valorB = new Date(b.createdAt);
                    } else if (a.id && b.id) {
                        return b.id - a.id;
                    }
            }
            if (ordenacaoAtual.direcao === 'asc') {
                return valorA - valorB; 
            } else {
                return valorB - valorA; 
            }
        });
    }
    async function carregarVacinas() {
        const loading = document.getElementById('loading');
        const tbody = document.getElementById('vacinas-table-body');
        const msgVazio = document.getElementById('vacinas-vazio');
        loading.style.display = 'block';
        tbody.innerHTML = '';
        msgVazio.style.display = 'none';
        try {
            const response = await fetch(`${API_BASE}/vacina?size=1000&page=0`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`Erro ao carregar vacinas: ${response.status}`);
            }
            const data = await response.json();
            let vacinas = [];
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                vacinas = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                vacinas = data.dados;
            }
            todasVacinas = vacinas;
            vacinasFiltradas = [...vacinas];
            renderizarTabela(vacinas);
        } catch (error) {
            alert("Erro ao carregar vacinas. Verifique sua conexão.");
        } finally {
            loading.style.display = 'none';
        }
    }
    function renderizarTabela(vacinas) {
        const tbody = document.getElementById('vacinas-table-body');
        const msgVazio = document.getElementById('vacinas-vazio');
        if (vacinas.length === 0) {
            tbody.innerHTML = '';
            msgVazio.style.display = 'block';
            removerPaginacao();
            return;
        }
        tbody.innerHTML = '';
        msgVazio.style.display = 'none';
        const vacinasOrdenadas = ordenarVacinas(vacinas);
        vacinasOrdenadas.slice(0, 3).forEach((v, i) => {
        });
        const totalPaginas = Math.ceil(vacinasOrdenadas.length / ITENS_POR_PAGINA);
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        const vacinasPaginadas = vacinasOrdenadas.slice(inicio, fim);
        vacinasPaginadas.forEach(vacina => {
            const row = tbody.insertRow();
            row.insertCell().textContent = vacina.nome || '-';
            row.insertCell().textContent = vacina.numeroLote || '-';
            row.insertCell().textContent = formatarFabricante(vacina.fabricante);
            row.insertCell().textContent = formatarData(vacina.dataFabricacao);
            row.insertCell().textContent = formatarData(vacina.dataValidade);
            const cellStatus = row.insertCell();
            const status = verificarVencimento(vacina.dataValidade);
            const badgeStatus = document.createElement('span');
            badgeStatus.className = `badge-status ${status}`;
            badgeStatus.textContent = status === 'valida' ? 'Válida' : 'Vencida';
            cellStatus.appendChild(badgeStatus);
            const cellAcoes = row.insertCell();
            cellAcoes.className = 'action-buttons-cell';
            const actionDiv = document.createElement('div');
            actionDiv.style.cssText = 'display: flex; gap: 8px; justify-content: center; align-items: center;';
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-action btn-edit';
            btnEditar.innerHTML = '<i class="fa-solid fa-edit"></i> Editar';
            btnEditar.title = 'Editar vacina';
            btnEditar.onclick = () => abrirModalEdicaoVacina(vacina);
            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn-action btn-delete';
            btnExcluir.innerHTML = '<i class="fa-solid fa-trash"></i> Excluir';
            btnExcluir.title = 'Excluir vacina';
            btnExcluir.onclick = () => excluirVacina(vacina.uuid, vacina.nome);
            actionDiv.appendChild(btnEditar);
            actionDiv.appendChild(btnExcluir);
            cellAcoes.appendChild(actionDiv);
        });
        criarPaginacao(vacinasOrdenadas.length);
    }
    function criarPaginacao(totalItens) {
        const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);
        const paginacaoExistente = document.querySelector('.paginacao-container');
        if (paginacaoExistente) {
            paginacaoExistente.remove();
        }
        if (totalPaginas <= 1) {
            return;
        }
        const card = document.querySelector('.card');
        if (!card) return;
        const paginacaoContainer = document.createElement('div');
        paginacaoContainer.className = 'paginacao-container';
        paginacaoContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border-color);
        `;
        const info = document.createElement('div');
        info.className = 'paginacao-info';
        info.style.cssText = 'color: var(--text-secondary); font-size: 0.9rem;';
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
        const fim = Math.min(paginaAtual * ITENS_POR_PAGINA, totalItens);
        info.textContent = `Mostrando ${inicio} a ${fim} de ${totalItens} vacinas`;
        const botoesContainer = document.createElement('div');
        botoesContainer.className = 'paginacao-botoes';
        botoesContainer.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';
        const btnAnterior = criarBotaoPaginacao(
            '<i class="fa-solid fa-chevron-left"></i> Anterior',
            paginaAtual === 1,
            () => {
                if (paginaAtual > 1) {
                    paginaAtual--;
                    renderizarTabela(vacinasFiltradas);
                    scrollToTop();
                }
            }
        );
        const paginasNumeros = document.createElement('div');
        paginasNumeros.style.cssText = 'display: flex; gap: 0.3rem;';
        let paginasVisiveis = [];
        if (totalPaginas <= 5) {
            for (let i = 1; i <= totalPaginas; i++) {
                paginasVisiveis.push(i);
            }
        } else {
            if (paginaAtual <= 3) {
                paginasVisiveis = [1, 2, 3, 4, '...', totalPaginas];
            } else if (paginaAtual >= totalPaginas - 2) {
                paginasVisiveis = [1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas];
            } else {
                paginasVisiveis = [1, '...', paginaAtual - 1, paginaAtual, paginaAtual + 1, '...', totalPaginas];
            }
        }
        paginasVisiveis.forEach(numeroPagina => {
            if (numeroPagina === '...') {
                const reticencias = document.createElement('span');
                reticencias.textContent = '...';
                reticencias.style.cssText = 'padding: 0.5rem; color: var(--text-secondary);';
                paginasNumeros.appendChild(reticencias);
            } else {
                const btnPagina = criarBotaoNumeroPagina(numeroPagina, numeroPagina === paginaAtual);
                paginasNumeros.appendChild(btnPagina);
            }
        });
        const btnProximo = criarBotaoPaginacao(
            'Próximo <i class="fa-solid fa-chevron-right"></i>',
            paginaAtual === totalPaginas,
            () => {
                if (paginaAtual < totalPaginas) {
                    paginaAtual++;
                    renderizarTabela(vacinasFiltradas);
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
        btn.style.cssText = `
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: ${disabled ? 'var(--background-color)' : 'var(--card-background)'};
            color: ${disabled ? 'var(--text-secondary)' : 'var(--text-primary)'};
            cursor: ${disabled ? 'not-allowed' : 'pointer'};
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            opacity: ${disabled ? '0.6' : '1'};
        `;
        if (!disabled) {
            btn.onmouseover = () => {
                btn.style.backgroundColor = 'var(--background-color)';
                btn.style.borderColor = 'var(--primary-blue)';
            };
            btn.onmouseout = () => {
                btn.style.backgroundColor = 'var(--card-background)';
                btn.style.borderColor = 'var(--border-color)';
            };
            btn.onclick = onClick;
        }
        return btn;
    }
    function criarBotaoNumeroPagina(numero, isAtiva) {
        const btn = document.createElement('button');
        btn.className = 'btn-pagina-numero';
        btn.textContent = numero;
        btn.style.cssText = `
            padding: 0.5rem 0.75rem;
            border: 1px solid ${isAtiva ? 'var(--primary-blue)' : 'var(--border-color)'};
            border-radius: 8px;
            background-color: ${isAtiva ? 'var(--primary-blue)' : 'var(--card-background)'};
            color: ${isAtiva ? 'white' : 'var(--text-primary)'};
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: ${isAtiva ? '600' : '500'};
            min-width: 40px;
            transition: all 0.2s ease;
        `;
        if (!isAtiva) {
            btn.onmouseover = () => {
                btn.style.backgroundColor = 'var(--background-color)';
                btn.style.borderColor = 'var(--primary-blue)';
            };
            btn.onmouseout = () => {
                btn.style.backgroundColor = 'var(--card-background)';
                btn.style.borderColor = 'var(--border-color)';
            };
            btn.onclick = () => {
                paginaAtual = numero;
                renderizarTabela(vacinasFiltradas);
                scrollToTop();
            };
        }
        return btn;
    }
    function removerPaginacao() {
        const paginacaoExistente = document.querySelector('.paginacao-container');
        if (paginacaoExistente) {
            paginacaoExistente.remove();
        }
    }
    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.abrirModalEdicaoVacina = function(vacina) {
        vacinaEmEdicao = vacina;
        document.getElementById('edit-vacina-uuid').value = vacina.uuid;
        document.getElementById('edit-vacina-nome').value = vacina.nome || '';
        document.getElementById('edit-vacina-lote').value = vacina.numeroLote || '';
        document.getElementById('edit-vacina-fabricante').value = vacina.fabricante || '';
        const dataFabricacao = formatarDataParaInput(vacina.dataFabricacao);
        document.getElementById('edit-vacina-fabricacao').value = dataFabricacao;
        const dataValidade = formatarDataParaInput(vacina.dataValidade);
        document.getElementById('edit-vacina-validade').value = dataValidade;
        document.getElementById('modal-editar-vacina').style.display = 'flex';
    };
    window.fecharModalEdicaoVacina = function() {
        document.getElementById('modal-editar-vacina').style.display = 'none';
        document.getElementById('form-editar-vacina').reset();
        vacinaEmEdicao = null;
    };
    document.getElementById('form-editar-vacina').addEventListener('submit', async function(e) {
        e.preventDefault();
        const vacinaUuid = document.getElementById('edit-vacina-uuid').value;
        const nome = document.getElementById('edit-vacina-nome').value.trim();
        const numeroLote = document.getElementById('edit-vacina-lote').value.trim();
        const fabricante = document.getElementById('edit-vacina-fabricante').value;
        const dataFabricacaoInput = document.getElementById('edit-vacina-fabricacao').value;
        const dataValidadeInput = document.getElementById('edit-vacina-validade').value;
        if (!nome || !numeroLote || !fabricante || !dataFabricacaoInput || !dataValidadeInput) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        const dataFabricacao = formatDateToDDMMYYYY(dataFabricacaoInput);
        const dataValidade = formatDateToDDMMYYYY(dataValidadeInput);
        const payload = {
            nome,
            numeroLote,
            fabricante,
            dataFabricacao,
            dataValidade
        };
        try {
            const response = await fetch(`${API_BASE}/vacina/${vacinaUuid}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (response.ok || response.status === 204) {
                alert("Vacina atualizada com sucesso!");
                fecharModalEdicaoVacina();
                await carregarVacinas();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao atualizar vacina: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor.");
        }
    });
    window.excluirVacina = async function(uuid, nome) {
        const confirmacao = confirm(
            `Tem certeza que deseja excluir a vacina "${nome}"?\n\n` +
            `Esta ação não pode ser desfeita.`
        );
        if (!confirmacao) return;
        try {
            const response = await fetch(`${API_BASE}/vacina/${uuid}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok || response.status === 204) {
                alert("Vacina excluída com sucesso!");
                await carregarVacinas();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao excluir vacina: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor.");
        }
    };
    function filtrarVacinas() {
        const filtroTexto = normalizeText(document.getElementById('filtro-vacina').value.trim());
        const filtroFabricante = document.getElementById('filtro-fabricante').value;
        const filtroStatus = document.getElementById('filtro-status').value;
        const resultadoDiv = document.getElementById('resultado-filtro');
        const btnLimpar = document.getElementById('limpar-filtro');
        if (filtroTexto.length > 0 || filtroFabricante || filtroStatus) {
            btnLimpar.style.display = 'flex';
        } else {
            btnLimpar.style.display = 'none';
        }
        vacinasFiltradas = todasVacinas.filter(vacina => {
            let passaFiltroTexto = true;
            if (filtroTexto) {
                const nome = normalizeText(vacina.nome || '');
                const lote = normalizeText(vacina.numeroLote || '');
                const fabricante = normalizeText(formatarFabricante(vacina.fabricante));
                passaFiltroTexto = nome.includes(filtroTexto) || 
                                   lote.includes(filtroTexto) || 
                                   fabricante.includes(filtroTexto);
            }
            let passaFiltroFabricante = true;
            if (filtroFabricante) {
                passaFiltroFabricante = vacina.fabricante === filtroFabricante;
            }
            let passaFiltroStatus = true;
            if (filtroStatus) {
                const statusVacina = verificarVencimento(vacina.dataValidade);
                passaFiltroStatus = statusVacina === filtroStatus;
            }
            return passaFiltroTexto && passaFiltroFabricante && passaFiltroStatus;
        });
        if (filtroTexto || filtroFabricante || filtroStatus) {
            if (vacinasFiltradas.length > 0) {
                resultadoDiv.textContent = `${vacinasFiltradas.length} vacina(s) encontrada(s)`;
                resultadoDiv.className = 'resultado-filtro tem-resultados';
            } else {
                resultadoDiv.textContent = 'Nenhuma vacina encontrada com estes filtros';
                resultadoDiv.className = 'resultado-filtro sem-resultados';
            }
        } else {
            resultadoDiv.textContent = '';
            resultadoDiv.className = 'resultado-filtro';
        }
        paginaAtual = 1;
        renderizarTabela(vacinasFiltradas);
    }
    function limparFiltros() {
        document.getElementById('filtro-vacina').value = '';
        document.getElementById('filtro-fabricante').value = '';
        document.getElementById('filtro-status').value = '';
        paginaAtual = 1;
        filtrarVacinas();
        document.getElementById('filtro-vacina').focus();
    }
    const filtroInput = document.getElementById('filtro-vacina');
    const filtroFabricante = document.getElementById('filtro-fabricante');
    const filtroStatus = document.getElementById('filtro-status');
    const btnLimpar = document.getElementById('limpar-filtro');
    if (filtroInput) {
        let debounceTimer;
        filtroInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filtrarVacinas, 300);
        });
        filtroInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filtrarVacinas();
            }
        });
    }
    if (filtroFabricante) {
        filtroFabricante.addEventListener('change', filtrarVacinas);
    }
    if (filtroStatus) {
        filtroStatus.addEventListener('change', filtrarVacinas);
    }
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFiltros);
    }
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('modal-editar-vacina');
        if (e.target === modal) {
            fecharModalEdicaoVacina();
        }
    });
    carregarVacinas();
})();


