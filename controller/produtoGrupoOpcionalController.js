const produtoGrupoOpcionalModel = require('../models/produtoGrupoOpcionalModel');

class ProdutoGrupoOpcionalController {
  // Buscar grupos de opcionais de um produto
  async getGruposByProduto(req, res) {
    try {
      const { idproduto } = req.params;
      const grupos = await produtoGrupoOpcionalModel.getGruposByProduto(idproduto);
      res.json(grupos);
    } catch (error) {
      console.error('Erro ao buscar grupos do produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Adicionar grupo de opcionais a um produto
  async adicionarGrupoAoProduto(req, res) {
    try {
      const { idproduto } = req.params;
      const { idgrupo_opcional, obrigatorio, maximo_escolhas, minimo_escolhas, nome_exibicao, instrucoes } = req.body;
      
      if (!idgrupo_opcional) {
        return res.status(400).json({ error: 'ID do grupo é obrigatório' });
      }
      
      // Verificar se o produto já tem este grupo
      const jaTemGrupo = await produtoGrupoOpcionalModel.produtoTemGrupo(idproduto, idgrupo_opcional);
      if (jaTemGrupo) {
        return res.status(400).json({ error: 'Este produto já possui este grupo de opcionais' });
      }
      
      await produtoGrupoOpcionalModel.adicionarGrupoAoProduto(idproduto, idgrupo_opcional, {
        obrigatorio: obrigatorio || 0,
        maximo_escolhas: maximo_escolhas || null,
        minimo_escolhas: minimo_escolhas || 0,
        nome_exibicao: nome_exibicao || null,
        instrucoes: instrucoes || null
      });
      
      res.json({ message: 'Grupo adicionado ao produto com sucesso' });
    } catch (error) {
      console.error('Erro ao adicionar grupo ao produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Remover grupo de opcionais de um produto
  async removerGrupoDoProduto(req, res) {
    try {
      const { idproduto, idgrupo_opcional } = req.params;
      
      const sucesso = await produtoGrupoOpcionalModel.removerGrupoDoProduto(idproduto, idgrupo_opcional);
      
      if (!sucesso) {
        return res.status(404).json({ error: 'Relacionamento não encontrado' });
      }
      
      res.json({ message: 'Grupo removido do produto com sucesso' });
    } catch (error) {
      console.error('Erro ao remover grupo do produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Atualizar configurações do grupo no produto
  async atualizarGrupoNoProduto(req, res) {
    try {
      const { idproduto, idgrupo_opcional } = req.params;
      const { obrigatorio, maximo_escolhas, minimo_escolhas, nome_exibicao, instrucoes } = req.body;
      
      const sucesso = await produtoGrupoOpcionalModel.atualizarGrupoNoProduto(idproduto, idgrupo_opcional, {
        obrigatorio,
        maximo_escolhas,
        minimo_escolhas,
        nome_exibicao,
        instrucoes
      });
      
      if (!sucesso) {
        return res.status(404).json({ error: 'Relacionamento não encontrado' });
      }
      
      res.json({ message: 'Configurações do grupo atualizadas com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar grupo no produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar produtos que usam um grupo de opcionais
  async getProdutosByGrupo(req, res) {
    try {
      const { idgrupo_opcional } = req.params;
      const produtos = await produtoGrupoOpcionalModel.getProdutosByGrupo(idgrupo_opcional);
      res.json(produtos);
    } catch (error) {
      console.error('Erro ao buscar produtos do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar grupos disponíveis para adicionar a um produto
  async getGruposDisponiveisParaProduto(req, res) {
    try {
      const { idproduto } = req.params;
      const grupos = await produtoGrupoOpcionalModel.getGruposDisponiveisParaProduto(idproduto);
      res.json(grupos);
    } catch (error) {
      console.error('Erro ao buscar grupos disponíveis:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar opcionais de um grupo específico de um produto
  async getOpcionaisDoGrupoNoProduto(req, res) {
    try {
      const { idproduto, idgrupo_opcional } = req.params;
      const opcionais = await produtoGrupoOpcionalModel.getOpcionaisDoGrupoNoProduto(idproduto, idgrupo_opcional);
      res.json(opcionais);
    } catch (error) {
      console.error('Erro ao buscar opcionais do grupo no produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new ProdutoGrupoOpcionalController();
