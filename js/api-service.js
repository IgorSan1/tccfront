const ApiService = (() => {
  const API_BASE = '/api/v1';

  const getToken = () => localStorage.getItem('token');

  const getDefaultHeaders = () => ({
    'Content-Type': 'application/json',
    ...(getToken() && { 'Authorization': `Bearer ${getToken()}` })
  });

  const handleResponse = async (response) => {
    if (!response.ok) {
      // Tenta obter JSON da resposta; se falhar, captura texto cru
      let parsed;
      try {
        parsed = await response.json();
      } catch (e) {
        parsed = await response.text().catch(() => null);
      }

      const detail = parsed
        ? (typeof parsed === 'string' ? parsed : JSON.stringify(parsed))
        : response.statusText;

      const err = new Error(`HTTP ${response.status} ${response.statusText} - ${detail}`);
      err.status = response.status;
      err.body = parsed;
      throw err;
    }

    // Se não houver conteúdo JSON (204), retorna null; caso contrário parseia JSON
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch (e) {
      return text;
    }
  };

  return {
    /**
     * Realiza login do usuário
     * @param {string} usuario - Nome de usuário
     * @param {string} password - Senha
     * @returns {Promise<Object>} Resposta da API com token
     */
    async login(usuario, password) {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ usuario, password })
      });
      return handleResponse(response);
    },

    /**
     * Obtém lista de pessoas (pacientes)
     * @param {boolean} isAdmin - Se true, busca todos; se false, apenas ativos
     * @param {number} size - Número de registros por página
     * @param {number} page - Número da página
     * @returns {Promise<Object>} Lista de pessoas
     */
    async getPessoas(isAdmin = false, size = 1000, page = 0) {
      const endpoint = isAdmin ? 
        `${API_BASE}/pessoa/all?size=${size}&page=${page}` : 
        `${API_BASE}/pessoa?size=${size}&page=${page}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: getDefaultHeaders()
      });
      return handleResponse(response);
    },

    /**
     * Cria nova pessoa (paciente)
     * @param {Object} data - Dados da pessoa
     * @returns {Promise<Object>} Pessoa criada
     */
    async createPessoa(data) {
      const response = await fetch(`${API_BASE}/pessoa`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },

    /**
     * Atualiza pessoa existente
     * @param {string} uuid - UUID da pessoa
     * @param {Object} data - Dados a atualizar
     * @returns {Promise<Object>} Pessoa atualizada
     */
    async updatePessoa(uuid, data) {
      const response = await fetch(`${API_BASE}/pessoa/${uuid}`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },

    /**
     * Obtém lista de usuários
     * @param {number} size - Número de registros por página
     * @param {number} page - Número da página
     * @returns {Promise<Object>} Lista de usuários
     */
    async getUsuarios(size = 1000, page = 0) {
      const response = await fetch(`${API_BASE}/usuario?size=${size}&page=${page}`, {
        method: 'GET',
        headers: getDefaultHeaders()
      });
      return handleResponse(response);
    },

    /**
     * Cria novo usuário
     * @param {Object} data - Dados do usuário
     * @returns {Promise<Object>} Usuário criado
     */
    async createUsuario(data) {
      const response = await fetch(`${API_BASE}/usuario`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },

    /**
     * Obtém lista de vacinas
     * @param {number} size - Número de registros por página
     * @param {number} page - Número da página
     * @returns {Promise<Object>} Lista de vacinas
     */
    async getVacinas(size = 200, page = 0) {
      const response = await fetch(`${API_BASE}/vacina/all?size=${size}&page=${page}`, {
        method: 'GET',
        headers: getDefaultHeaders()
      });
      return handleResponse(response);
    },

    /**
     * Cria nova vacina
     * @param {Object} data - Dados da vacina
     * @returns {Promise<Object>} Vacina criada
     */
    async createVacina(data) {
      const response = await fetch(`${API_BASE}/vacina`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },

    /**
     * Atualiza vacina existente
     * @param {string} uuid - UUID da vacina
     * @param {Object} data - Dados a atualizar
     * @returns {Promise<Object>} Vacina atualizada
     */
    async updateVacina(uuid, data) {
      const response = await fetch(`${API_BASE}/vacina/${uuid}`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },

    /**
     * Deleta vacina
     * @param {string} uuid - UUID da vacina
     * @returns {Promise<Object>} Resposta da API
     */
    async deleteVacina(uuid) {
      const response = await fetch(`${API_BASE}/vacina/${uuid}`, {
        method: 'DELETE',
        headers: getDefaultHeaders()
      });
      return handleResponse(response);
    },

    /**
     * Obtém lista de vacinações
     * @param {string} pessoaUuid - UUID da pessoa para filtrar vacinações
     * @param {number} size - Número de registros por página
     * @param {number} page - Número da página
     * @returns {Promise<Object>} Lista de vacinações
     */
    async getVacinacoes(pessoaUuid = null, size = 100, page = 0) {
      let endpoint = `${API_BASE}/vacinacoes?size=${size}&page=${page}`;
      if (pessoaUuid) {
        endpoint = `${API_BASE}/pessoa/${pessoaUuid}/vacinacoes?size=${size}&page=${page}`;
      }
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: getDefaultHeaders()
      });
      return handleResponse(response);
    },

    /**
     * Cria nova vacinação
     * @param {Object} data - Dados da vacinação
     * @returns {Promise<Object>} Vacinação criada
     */
    async createVacinacao(data) {
      const response = await fetch(`${API_BASE}/vacinacoes`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },

    /**
     * Atualiza vacinação existente
     * @param {string} uuid - UUID da vacinação
     * @param {Object} data - Dados a atualizar
     * @returns {Promise<Object>} Vacinação atualizada
     */
    async updateVacinacao(uuid, data) {
      const response = await fetch(`${API_BASE}/vacinacoes/${uuid}`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },

    /**
     * Deleta vacinação
     * @param {string} uuid - UUID da vacinação
     * @returns {Promise<Object>} Resposta da API
     */
    async deleteVacinacao(uuid) {
      const response = await fetch(`${API_BASE}/vacinacoes/${uuid}`, {
        method: 'DELETE',
        headers: getDefaultHeaders()
      });
      return handleResponse(response);
    },

    /**
     * Reativa pessoa (paciente)
     * @param {string} uuid - UUID da pessoa
     * @param {Object} data - Dados para reativação
     * @returns {Promise<Object>} Resposta da API
     */
    async reativarPessoa(uuid, data) {
      const response = await fetch(`${API_BASE}/pessoa/${uuid}`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    }
  };
})();


