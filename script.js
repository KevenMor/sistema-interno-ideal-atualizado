class ExtratoManager {
    constructor() {
        this.dados = [];
        this.dadosFiltrados = [];
        this.unidades = [];
        this.competencias = [];
        this.filtros = {
            unidade: 'todas',
            dataInicio: '',
            dataFim: '',
            competencia: ''
        };
        this.estatisticas = null;
        
        // Base URL da API
        this.API_BASE_URL = '/api';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.carregarUnidades();
        this.gerarCompetencias();
        this.verificarConexaoAPI();
    }

    async verificarConexaoAPI() {
        console.log('🔍 Verificando conexão com API...');
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/health`);
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ API de extratos funcionando:', result.detalhes);
                this.carregarDados();
            } else {
                console.warn('⚠️ API com problemas:', result.message);
                this.showError('Sistema de extratos com problemas. Verifique a conexão.');
            }
        } catch (error) {
            console.error('❌ Erro ao conectar com API:', error);
            this.showError('Não foi possível conectar com o sistema de extratos.');
        }
    }

    bindEvents() {
        // Botão de atualizar
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.addEventListener('click', () => this.carregarDados());

        // Campo de busca
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.filtrarDados(e.target.value));

        // Filtros
        const unidadeSelect = document.getElementById('unidadeSelect');
        unidadeSelect.addEventListener('change', (e) => {
            this.filtros.unidade = e.target.value;
            this.carregarDados();
        });

        const competenciaSelect = document.getElementById('competenciaSelect');
        competenciaSelect.addEventListener('change', (e) => {
            this.filtros.competencia = e.target.value;
            this.carregarDados();
        });

        const dataInicio = document.getElementById('dataInicio');
        dataInicio.addEventListener('change', (e) => {
            this.filtros.dataInicio = e.target.value;
            this.carregarDados();
        });

        const dataFim = document.getElementById('dataFim');
        dataFim.addEventListener('change', (e) => {
            this.filtros.dataFim = e.target.value;
            this.carregarDados();
        });

        // Botão limpar filtros
        const limparFiltrosBtn = document.getElementById('limparFiltrosBtn');
        limparFiltrosBtn.addEventListener('click', () => this.limparFiltros());
    }

    async carregarUnidades() {
        try {
            console.log('🏢 Carregando unidades via API...');
            
            const response = await fetch(`${this.API_BASE_URL}/unidades`);
            const result = await response.json();
            
            if (result.success) {
                this.unidades = result.data;
                console.log('✅ Unidades carregadas:', this.unidades);
                this.popularSeletorUnidades();
            } else {
                console.error('❌ Erro ao carregar unidades:', result.message);
                this.showError('Erro ao carregar unidades disponíveis.');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar unidades:', error);
            this.showError('Não foi possível carregar as unidades.');
        }
    }

    formatarNomeUnidade(unidade) {
        return unidade
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    popularSeletorUnidades() {
        const unidadeSelect = document.getElementById('unidadeSelect');
        
        // Limpar opções existentes (exceto "Todas")
        while (unidadeSelect.children.length > 1) {
            unidadeSelect.removeChild(unidadeSelect.lastChild);
        }

        // Adicionar opções das unidades
        this.unidades.forEach(unidade => {
            const option = document.createElement('option');
            option.value = unidade.codigo;
            option.textContent = unidade.nome;
            unidadeSelect.appendChild(option);
        });
    }

    async carregarDados() {
        const refreshBtn = document.getElementById('refreshBtn');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const errorMessage = document.getElementById('errorMessage');
        
        try {
            // Mostrar loading
            refreshBtn.disabled = true;
            loadingSpinner.style.display = 'inline-block';
            errorMessage.style.display = 'none';
            
            // Mostrar mensagem de carregamento na tabela
            const tableBody = document.getElementById('tableBody');
            const noDataMessage = document.getElementById('noDataMessage');
            const table = document.getElementById('extratosTable');
            
            table.style.display = 'none';
            noDataMessage.style.display = 'block';
            noDataMessage.innerHTML = `
                <i class="bi bi-arrow-clockwise" style="animation: spin 1s linear infinite;"></i>
                <p>Carregando dados via API...</p>
                <small>Isso pode levar alguns segundos.</small>
            `;

            console.log('🚀 Carregando dados via API...');
            console.log('📋 Filtros atuais:', this.filtros);

            // Construir parâmetros da query
            const params = new URLSearchParams();
            
            if (this.filtros.unidade && this.filtros.unidade !== 'todas') {
                params.append('unidade', this.filtros.unidade);
            }
            
            if (this.filtros.dataInicio) {
                params.append('dataInicio', this.filtros.dataInicio);
            }
            
            if (this.filtros.dataFim) {
                params.append('dataFim', this.filtros.dataFim);
            }
            
            if (this.filtros.competencia) {
                params.append('competencia', this.filtros.competencia);
            }

            // Fazer chamada para API
            const url = `${this.API_BASE_URL}/extrato?${params.toString()}`;
            console.log('📡 Chamando API:', url);
            
            const response = await fetch(url);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Erro HTTP: ${response.status}`);
            }

            if (result.success) {
                // Processar dados recebidos da API
                this.dados = result.data || [];
                this.dadosFiltrados = [...this.dados];
                this.estatisticas = result.estatisticas || null;
                
                console.log(`✅ ${this.dados.length} registros carregados via API`);
                console.log('📊 Estatísticas:', this.estatisticas);
                
                // Renderizar resultados
                this.renderizarTabela();
                this.atualizarEstatisticas();
                this.atualizarInfoPeriodo();
                
                // Mensagem de sucesso
                if (this.dados.length > 0) {
                    const mensagem = `✅ ${this.dados.length} registros carregados com sucesso!`;
                    this.showMessage(mensagem, 'success');
                } else {
                    this.showMessage('⚠️ Nenhum registro encontrado com os filtros aplicados.', 'info');
                }
            } else {
                throw new Error(result.message || 'Erro desconhecido na API');
            }

        } catch (error) {
            console.error('❌ Erro ao carregar dados via API:', error);
            this.showError(`Erro ao carregar dados: ${error.message}`);
        } finally {
            // Esconder loading
            refreshBtn.disabled = false;
            loadingSpinner.style.display = 'none';
        }
    }

    gerarCompetencias() {
        const competenciaSelect = document.getElementById('competenciaSelect');
        const hoje = new Date();
        
        // Gerar últimos 24 meses
        for (let i = 0; i < 24; i++) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const ano = data.getFullYear();
            const mes = (data.getMonth() + 1).toString().padStart(2, '0');
            const valor = `${ano}-${mes}`;
            const texto = data.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
            
            const option = document.createElement('option');
            option.value = valor;
            option.textContent = texto;
            competenciaSelect.appendChild(option);
        }
    }

    limparFiltros() {
        this.filtros = {
            unidade: 'todas',
            dataInicio: '',
            dataFim: '',
            competencia: ''
        };

        // Resetar campos
        document.getElementById('unidadeSelect').value = 'todas';
        document.getElementById('competenciaSelect').value = '';
        document.getElementById('dataInicio').value = '';
        document.getElementById('dataFim').value = '';
        document.getElementById('searchInput').value = '';

        this.carregarDados();
    }

    filtrarDados(termo) {
        if (!termo.trim()) {
            this.dadosFiltrados = [...this.dados];
        } else {
            const termoLower = termo.toLowerCase();
            this.dadosFiltrados = this.dados.filter(item => {
                return (
                    (item['Nome do Aluno'] && item['Nome do Aluno'].toLowerCase().includes(termoLower)) ||
                    (item['Forma de Pagamento'] && item['Forma de Pagamento'].toLowerCase().includes(termoLower)) ||
                    (item['Unidade'] && item['Unidade'].toLowerCase().includes(termoLower)) ||
                    (item['Descrição'] && item['Descrição'].toLowerCase().includes(termoLower)) ||
                    // Compatibilidade com formato antigo
                    (item.aluno && item.aluno.toLowerCase().includes(termoLower)) ||
                    (item.formaPagamento && item.formaPagamento.toLowerCase().includes(termoLower)) ||
                    (item.unidade && item.unidade.toLowerCase().includes(termoLower)) ||
                    (item.descricao && item.descricao.toLowerCase().includes(termoLower))
                );
            });
        }
        
        this.renderizarTabela();
        this.calcularEstatisticas();
        this.atualizarEstatisticas();
    }

    renderizarTabela() {
        const tableBody = document.getElementById('tableBody');
        const noDataMessage = document.getElementById('noDataMessage');
        const table = document.getElementById('extratosTable');
        
        if (this.dadosFiltrados.length === 0) {
            table.style.display = 'none';
            noDataMessage.style.display = 'block';
            noDataMessage.innerHTML = `
                <i class="bi bi-inbox"></i>
                <p>Nenhum registro encontrado.</p>
                <small>Tente ajustar os filtros ou verificar a conexão.</small>
            `;
            return;
        }
        
        table.style.display = 'table';
        noDataMessage.style.display = 'none';
        
        tableBody.innerHTML = '';
        
        this.dadosFiltrados.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'fade-in';
            
            // Usar campos da API ou campos antigos para compatibilidade
            const data = item['Data de Pagamento'] || item.data;
            const aluno = item['Nome do Aluno'] || item.aluno;
            const formaPagamento = item['Forma de Pagamento'] || item.formaPagamento;
            const valor = item['Valor'] || item.valor;
            const unidade = item['Unidade'] || item.unidade;
            const descricao = item['Descrição'] || item.descricao;
            
            row.innerHTML = `
                <td>${this.formatarData(data)}</td>
                <td>${aluno || '-'}</td>
                <td>${formaPagamento || '-'}</td>
                <td class="valor-cell">${this.formatarValor(valor)}</td>
                <td>${unidade || '-'}</td>
                <td>${descricao || '-'}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    calcularEstatisticas() {
        // Se já temos estatísticas da API e não estamos filtrando localmente, usar elas
        if (this.estatisticas && this.dadosFiltrados.length === this.dados.length) {
            return;
        }

        // Calcular estatísticas localmente (para buscas ou filtros locais)
        const valores = this.dadosFiltrados.map(item => 
            this.extrairValorNumerico(item['Valor'] || item.valor || item['ValorNumerico'])
        );
        const valoresValidos = valores.filter(v => !isNaN(v) && v !== null);
        
        this.estatisticas = {
            totalRegistros: this.dadosFiltrados.length,
            valorTotal: valoresValidos.reduce((sum, val) => sum + val, 0),
            valorMedio: valoresValidos.length > 0 ? valoresValidos.reduce((sum, val) => sum + val, 0) / valoresValidos.length : 0
        };
    }

    atualizarEstatisticas() {
        if (!this.estatisticas) {
            this.calcularEstatisticas();
        }
        
        document.getElementById('totalRecords').textContent = this.estatisticas.totalRegistros.toLocaleString('pt-BR');
        document.getElementById('totalValue').textContent = this.formatarMoeda(this.estatisticas.valorTotal);
        document.getElementById('averageValue').textContent = this.formatarMoeda(this.estatisticas.valorMedio);
    }

    atualizarInfoPeriodo() {
        const periodoInfo = document.getElementById('periodoInfo');
        let texto = 'Todos os dados';
        
        if (this.filtros.dataInicio && this.filtros.dataFim) {
            const inicio = new Date(this.filtros.dataInicio).toLocaleDateString('pt-BR');
            const fim = new Date(this.filtros.dataFim).toLocaleDateString('pt-BR');
            texto = `${inicio} - ${fim}`;
        } else if (this.filtros.dataInicio) {
            const inicio = new Date(this.filtros.dataInicio).toLocaleDateString('pt-BR');
            texto = `A partir de ${inicio}`;
        } else if (this.filtros.dataFim) {
            const fim = new Date(this.filtros.dataFim).toLocaleDateString('pt-BR');
            texto = `Até ${fim}`;
        } else if (this.filtros.competencia) {
            const [ano, mes] = this.filtros.competencia.split('-');
            const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
            texto = data.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
        }
        
        if (this.filtros.unidade !== 'todas') {
            texto += ` - ${this.formatarNomeUnidade(this.filtros.unidade)}`;
        }
        
        periodoInfo.textContent = texto;
    }

    formatarData(data) {
        if (!data) return '-';
        
        // Se já está no formato ISO (YYYY-MM-DD), converter diretamente
        if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [ano, mes, dia] = data.split('-');
            return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia)).toLocaleDateString('pt-BR');
        }
        
        // Tentar parser para outros formatos
        const dataObj = this.parseData(data);
        return dataObj ? dataObj.toLocaleDateString('pt-BR') : String(data);
    }

    parseData(dataStr) {
        if (!dataStr) return null;
        
        // Tentar diferentes formatos de data
        const formatos = [
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
        ];
        
        for (const formato of formatos) {
            const match = String(dataStr).match(formato);
            if (match) {
                let dia, mes, ano;
                if (formato === formatos[1]) { // YYYY-MM-DD
                    [, ano, mes, dia] = match;
                } else { // DD/MM/YYYY ou DD-MM-YYYY
                    [, dia, mes, ano] = match;
                }
                return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
            }
        }
        
        return null;
    }

    formatarValor(valor) {
        const numerico = this.extrairValorNumerico(valor);
        return isNaN(numerico) ? String(valor || '-') : this.formatarMoeda(numerico);
    }

    extrairValorNumerico(valor) {
        if (typeof valor === 'number') return valor;
        if (!valor) return 0;
        
        const str = String(valor).replace(/[^\d,-]/g, '').replace(',', '.');
        return parseFloat(str) || 0;
    }

    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    showMessage(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Funcionalidade de navegação entre abas
function setupTabNavigation() {
    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = button.dataset.tab;

            // Update active states
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show target tab
            tabContents.forEach(tab => tab.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');
            
            // Ajustar layout do container para aba de extratos
            const mainContainer = document.querySelector('.main-container');
            if (targetTab === 'statementTab') {
                mainContainer.style.maxWidth = '95vw';
                mainContainer.style.width = '95vw';
                
                // Se for a aba de extratos, inicializar se necessário
                if (!window.extratoManager) {
                    window.extratoManager = new ExtratoManager();
                }
            } else {
                mainContainer.style.maxWidth = '800px';
                mainContainer.style.width = '';
            }
        });
    });
}

// Funcionalidade original do sistema (templates, etc.)
function setupOriginalSystem() {
    // Configurar unidades selecionadas no login
    const selectedUnit = localStorage.getItem('selectedUnit');
    if (selectedUnit) {
        const branchSelect = document.getElementById('branch');
        const paymentUnitSelect = document.getElementById('paymentUnit');
        
        if (branchSelect) {
            branchSelect.value = selectedUnit;
            branchSelect.disabled = false;
        }
        if (paymentUnitSelect) {
            paymentUnitSelect.value = selectedUnit;
            paymentUnitSelect.disabled = false;
        }
    }
    
    // Templates para mensagens
    const templates = {
        'boas-vindas': [
            {
                id: 'boas-vindas-1',
                title: 'Boas-vindas',
                text: `Bem-vindo(a) à Autoescola Ideal {{primeiro nome}}!
É uma alegria ter você como nosso aluno! A partir de agora, começa sua jornada rumo à conquista da CNH com uma equipe pronta para te orientar em todas as etapas.

📲 Acompanhe tudo pelo app "Minha Habilitação". Nele, você acessa agendamentos, exames, andamento do processo e pendências.

Seu acesso é o CPF e a senha padrão 123456.

🩺 Agende seus exames obrigatórios o quanto antes! Quanto mais rápido realizar, mais cedo poderá avançar.

📍Caso tenha dúvidas, nossa equipe está à disposição para te ajudar!

👩‍🏫 Conte com a equipe Ideal para uma experiência prática, tranquila e de qualidade em cada etapa.

💙 Seja muito bem-vindo(a) mais uma vez — você está em boas mãos!`
            }
        ],
        'recado-importante': [
            {
                id: 'recado-importante-1',
                title: 'Recado Importante',
                text: `Temos um recado importante pra você!

Olá {{primeiro nome}}! Nossa equipe precisa falar com você sobre o seu processo na Autoescola Ideal.

Para conseguirmos dar continuidade no atendimento, precisamos que selecione o botão abaixo. É rapidinho! 😊

Clique para ativar a conversa!`
            }
        ]
    };
    
    // Configurar formulário de mensagens
    const messageTypeSelect = document.getElementById('messageType');
    const templateSection = document.getElementById('templateSection');
    const templateOptions = templateSection?.querySelector('.template-options');
    const fullNameInput = document.getElementById('fullName');
    
    if (messageTypeSelect && templateSection && fullNameInput) {
        function getFirstName(fullName) {
            const first = (fullName || '').split(' ')[0] || '';
            return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
        }

        function showTemplates(type, firstName) {
            if (!templateOptions) return;
            templateOptions.innerHTML = '';
            if (!type || !templates[type]) {
                templateSection.style.display = 'none';
                return;
            }
            templates[type].forEach(template => {
                const contentWithName = template.text.replace(/{{primeiro nome}}/g, firstName).replace(/\n/g, '<br>');
                const card = document.createElement('div');
                card.className = 'template-card';
                card.innerHTML = `
                    <input type="radio" name="template" id="${template.id}" value="${template.id}" required>
                    <div class="template-content">
                        <h6>${template.title}</h6>
                        <p>${contentWithName}</p>
                    </div>
                `;
                card.addEventListener('click', function() {
                    const radio = this.querySelector('input[type="radio"]');
                    radio.checked = true;
                    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
                    this.classList.add('selected');
                });
                templateOptions.appendChild(card);
            });
            const firstCard = templateOptions.querySelector('.template-card');
            if (firstCard) {
                firstCard.classList.add('selected');
                firstCard.querySelector('input[type="radio"]').checked = true;
            }
            templateSection.style.display = 'block';
        }

        messageTypeSelect.addEventListener('change', function() {
            showTemplates(this.value, getFirstName(fullNameInput.value));
        });

        fullNameInput.addEventListener('input', function() {
            if (messageTypeSelect.value) {
                showTemplates(messageTypeSelect.value, getFirstName(this.value));
            }
        });
    }
    
    // Configurar formulários de pagamento
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        const paymentTypeRadios = paymentForm.querySelectorAll('input[name="paymentType"]');
        const pixFields = document.getElementById('pixFields');
        const boletoFields = document.getElementById('boletoFields');

        function togglePaymentFields() {
            const selected = paymentForm.querySelector('input[name="paymentType"]:checked');
            if (selected && selected.value === 'pix') {
                pixFields.style.display = 'block';
                boletoFields.style.display = 'none';
                pixFields.querySelectorAll('input,select').forEach(el => el.required = true);
                boletoFields.querySelectorAll('input,select').forEach(el => el.required = false);
            } else if (selected && selected.value === 'boleto') {
                pixFields.style.display = 'none';
                boletoFields.style.display = 'block';
                pixFields.querySelectorAll('input,select').forEach(el => el.required = false);
                boletoFields.querySelectorAll('input,select').forEach(el => el.required = true);
            } else {
                pixFields.style.display = 'none';
                boletoFields.style.display = 'none';
                pixFields.querySelectorAll('input,select').forEach(el => el.required = false);
                boletoFields.querySelectorAll('input,select').forEach(el => el.required = false);
            }
        }

        paymentTypeRadios.forEach(radio => {
            radio.addEventListener('change', togglePaymentFields);
        });

        togglePaymentFields();
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('selectedUnit');
            window.location.href = 'login.html';
        });
    }
}

// Inicializar o sistema quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verificar login
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.href = 'login.html';
        return;
    }
    
    // Configurar navegação entre abas
    setupTabNavigation();
    
    // Configurar funcionalidades originais
    setupOriginalSystem();
    
    // Não inicializar o ExtratoManager automaticamente - será inicializado quando a aba for clicada
}); 