const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Serviço para gerenciar extratos financeiros via Google Sheets
 */
class ExtratoService {
  constructor(credentialsPath, configPath) {
    this.credentialsPath = credentialsPath;
    this.configPath = configPath;
    this.sheets = null;
    this.config = null;
    this.init();
  }

  /**
   * Inicializa o serviço
   */
  init() {
    try {
      // Carregar configuração das planilhas
      if (fs.existsSync(this.configPath)) {
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        console.log('✅ Configuração de planilhas carregada');
      } else {
        throw new Error(`Arquivo de configuração não encontrado: ${this.configPath}`);
      }

      // Configurar Google Sheets API
      if (fs.existsSync(this.credentialsPath)) {
        const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
          credentials: credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
        this.sheets = google.sheets({ version: 'v4', auth });
        console.log('✅ Google Sheets API configurada');
      } else {
        throw new Error(`Arquivo de credenciais não encontrado: ${this.credentialsPath}`);
      }
    } catch (error) {
      console.error('❌ Erro na inicialização do ExtratoService:', error.message);
      throw error;
    }
  }

  /**
   * Formatar data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
   */
  formatarDataBrasileira(dataBrasileira) {
    if (!dataBrasileira || dataBrasileira.trim() === '') {
      return '';
    }

    try {
      if (dataBrasileira.includes('/')) {
        const [dia, mes, ano] = dataBrasileira.split('/');
        if (dia && mes && ano) {
          const diaFormatado = dia.padStart(2, '0');
          const mesFormatado = mes.padStart(2, '0');
          return `${ano}-${mesFormatado}-${diaFormatado}`;
        }
      }
      return dataBrasileira;
    } catch (error) {
      console.error('Erro ao formatar data:', dataBrasileira, error);
      return '';
    }
  }

  /**
   * Buscar dados de uma planilha específica
   */
  async buscarDadosPlanilha(unidade) {
    if (!this.config.planilhas[unidade]) {
      throw new Error(`Unidade não encontrada: ${unidade}`);
    }

    const planilhaConfig = this.config.planilhas[unidade];
    
    try {
      console.log(`📊 Buscando dados da planilha: ${planilhaConfig.nome}`);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: planilhaConfig.id,
        range: planilhaConfig.range
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log(`⚠️  Nenhum dado encontrado na planilha: ${planilhaConfig.nome}`);
        return [];
      }

      console.log(`✅ ${rows.length - 1} registros encontrados na planilha: ${planilhaConfig.nome}`);
      return this.processarDadosPlanilha(rows, planilhaConfig.nome);
    } catch (error) {
      console.error(`❌ Erro ao buscar dados da planilha ${unidade}:`, error.message);
      return [];
    }
  }

  /**
   * Buscar dados de todas as planilhas
   */
  async buscarTodosDados() {
    const todasUnidades = Object.keys(this.config.planilhas);
    const promessas = todasUnidades.map(unidade => this.buscarDadosPlanilha(unidade));
    
    try {
      console.log('📊 Buscando dados de todas as planilhas...');
      const resultados = await Promise.all(promessas);
      const dadosCompletos = resultados.flat();
      console.log(`✅ Total de ${dadosCompletos.length} registros encontrados`);
      return dadosCompletos;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de todas as planilhas:', error);
      return [];
    }
  }

  /**
   * Processar dados brutos da planilha
   */
  processarDadosPlanilha(rows, unidade) {
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      
      // Normalizar valor numérico
      let valorNumerico = 0;
      if (obj['Valor']) {
        const valorStr = obj['Valor'].toString().replace(/[R$\s]/g, '');
        // Se o valor já está com ponto como decimal (formato americano), usar direto
        // Se está com vírgula (formato brasileiro), substituir por ponto
        const valorLimpo = valorStr.includes(',') ? valorStr.replace(',', '.') : valorStr;
        valorNumerico = parseFloat(valorLimpo) || 0;
      }
      
      return {
        'Data de Pagamento': this.formatarDataBrasileira(obj['Data de Pagamento']) || '',
        'Nome do Aluno': obj['Nome Cliente'] || obj['Nome do Aluno'] || '',
        'Forma de Pagamento': obj['Forma de Pagamento'] || '',
        'Valor': valorNumerico > 0 ? `R$ ${valorNumerico.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'R$ 0,00',
        'ValorNumerico': valorNumerico,
        'Unidade': obj['Unidade'] || unidade,
        'Descrição': obj['Observações'] || obj['Descrição'] || '',
        'Competencia': obj['Competencia'] || this.extrairCompetencia(obj['Data de Pagamento'])
      };
    });
  }

  /**
   * Extrair competência (YYYY-MM) de uma data
   */
  extrairCompetencia(data) {
    if (!data) return '';
    
    try {
      const dataFormatada = this.formatarDataBrasileira(data);
      if (dataFormatada) {
        const [ano, mes] = dataFormatada.split('-');
        return `${ano}-${mes}`;
      }
    } catch (error) {
      console.error('Erro ao extrair competência:', data, error);
    }
    
    return '';
  }

  /**
   * Filtrar dados por critérios
   */
  filtrarPorData(dados, dataInicio, dataFim, competencia) {
    return dados.filter(item => {
      const dataStr = item['Data de Pagamento'];
      
      if (!dataStr || dataStr === '') {
        return false;
      }
      
      const dataItem = new Date(dataStr + 'T00:00:00');
      
      if (isNaN(dataItem.getTime())) {
        return false;
      }
      
      // Filtro por competência (mês/ano)
      if (competencia) {
        const [ano, mes] = competencia.split('-');
        const anoItem = dataItem.getFullYear();
        const mesItem = dataItem.getMonth() + 1;
        
        if (anoItem != parseInt(ano) || mesItem != parseInt(mes)) {
          return false;
        }
      }
      
      // Filtro por data inicial
      if (dataInicio) {
        const dataInicioObj = new Date(dataInicio + 'T00:00:00');
        if (dataItem < dataInicioObj) {
          return false;
        }
      }
      
      // Filtro por data final
      if (dataFim) {
        const dataFimObj = new Date(dataFim + 'T23:59:59');
        if (dataItem > dataFimObj) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Calcular estatísticas dos dados
   */
  calcularEstatisticas(dados) {
    if (!dados || dados.length === 0) {
      return {
        totalRegistros: 0,
        valorTotal: 0,
        valorMedio: 0,
        porUnidade: {},
        porFormaPagamento: {},
        porMes: {}
      };
    }

    const valorTotal = dados.reduce((sum, item) => sum + (item.ValorNumerico || 0), 0);
    const valorMedio = valorTotal / dados.length;

    // Estatísticas por unidade
    const porUnidade = {};
    dados.forEach(item => {
      const unidade = item['Unidade'];
      if (!porUnidade[unidade]) {
        porUnidade[unidade] = { registros: 0, valor: 0 };
      }
      porUnidade[unidade].registros++;
      porUnidade[unidade].valor += item.ValorNumerico || 0;
    });

    // Estatísticas por forma de pagamento
    const porFormaPagamento = {};
    dados.forEach(item => {
      const forma = item['Forma de Pagamento'];
      if (!porFormaPagamento[forma]) {
        porFormaPagamento[forma] = { registros: 0, valor: 0 };
      }
      porFormaPagamento[forma].registros++;
      porFormaPagamento[forma].valor += item.ValorNumerico || 0;
    });

    // Estatísticas por mês
    const porMes = {};
    dados.forEach(item => {
      const competencia = item['Competencia'];
      if (competencia && competencia !== '') {
        if (!porMes[competencia]) {
          porMes[competencia] = { registros: 0, valor: 0 };
        }
        porMes[competencia].registros++;
        porMes[competencia].valor += item.ValorNumerico || 0;
      }
    });

    return {
      totalRegistros: dados.length,
      valorTotal: valorTotal,
      valorMedio: valorMedio,
      porUnidade: porUnidade,
      porFormaPagamento: porFormaPagamento,
      porMes: porMes
    };
  }

  /**
   * Buscar extratos com filtros
   */
  async buscarExtratos(filtros = {}) {
    const { unidade, dataInicio, dataFim, competencia } = filtros;
    
    console.log('🔍 Buscando extratos com filtros:', filtros);
    
    // Buscar dados
    let dados;
    if (unidade && unidade !== 'todas') {
      dados = await this.buscarDadosPlanilha(unidade.toUpperCase());
    } else {
      dados = await this.buscarTodosDados();
    }
    
    // Aplicar filtros de data
    if (dataInicio || dataFim || competencia) {
      dados = this.filtrarPorData(dados, dataInicio, dataFim, competencia);
    }
    
    // Ordenar por data decrescente (mais recente primeiro)
    dados.sort((a, b) => {
      const dataA = new Date(a['Data de Pagamento']);
      const dataB = new Date(b['Data de Pagamento']);
      return dataB - dataA;
    });
    
    // Calcular estatísticas
    const estatisticas = this.calcularEstatisticas(dados);
    
    console.log(`✅ Retornando ${dados.length} registros com valor total de R$ ${estatisticas.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    
    return {
      dados,
      estatisticas,
      filtros
    };
  }

  /**
   * Buscar unidades disponíveis
   */
  getUnidades() {
    return Object.keys(this.config.planilhas).map(key => ({
      codigo: key,
      nome: this.config.planilhas[key].nome,
      id: this.config.planilhas[key].id
    }));
  }

  /**
   * Verificar saúde do sistema
   */
  async verificarSaude() {
    try {
      const unidades = this.getUnidades();
      const testePlanilha = await this.buscarDadosPlanilha(unidades[0].codigo);
      
      return {
        status: 'OK',
        unidades: unidades.length,
        conexaoGoogle: this.sheets ? 'OK' : 'ERRO',
        ultimoTeste: new Date().toISOString(),
        registrosTeste: testePlanilha.length
      };
    } catch (error) {
      return {
        status: 'ERRO',
        erro: error.message,
        ultimoTeste: new Date().toISOString()
      };
    }
  }
}

module.exports = ExtratoService; 