const TaxaEntrega = require('../models/taxaEntregaModel');

const taxaEntregaController = {
  listarPublico: async (req, res) => {
    try {
      const taxas = await TaxaEntrega.getAll({ apenasAtivas: true });
      res.json(taxas);
    } catch (error) {
      console.error('Erro ao listar taxas de entrega:', error);
      res.status(500).json({ erro: 'Erro ao listar taxas de entrega' });
    }
  },

  listarAdmin: async (req, res) => {
    try {
      const taxas = await TaxaEntrega.getAll({ apenasAtivas: false });
      res.json(taxas);
    } catch (error) {
      console.error('Erro ao listar taxas de entrega (admin):', error);
      res.status(500).json({ erro: 'Erro ao listar taxas de entrega' });
    }
  },

  criar: async (req, res) => {
    try {
      const { distancia_km, valor, observacao, ativo } = req.body;

      if (!distancia_km || !valor) {
        return res.status(400).json({ erro: 'Distância e valor são obrigatórios' });
      }

      const resultado = await TaxaEntrega.criar({
        distancia_km,
        valor,
        observacao,
        ativo,
      });

      res.status(201).json({
        mensagem: 'Taxa cadastrada com sucesso',
        id: resultado.id,
      });
    } catch (error) {
      console.error('Erro ao criar taxa de entrega:', error);
      res.status(500).json({ erro: 'Erro ao criar taxa de entrega' });
    }
  },

  atualizar: async (req, res) => {
    try {
      const { idtaxa } = req.params;
      const atualizou = await TaxaEntrega.atualizar(idtaxa, req.body || {});

      if (!atualizou) {
        return res.status(404).json({ erro: 'Taxa não encontrada' });
      }

      res.json({ mensagem: 'Taxa atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar taxa de entrega:', error);
      res.status(500).json({ erro: 'Erro ao atualizar taxa de entrega' });
    }
  },

  excluir: async (req, res) => {
    try {
      const { idtaxa } = req.params;
      const removeu = await TaxaEntrega.excluir(idtaxa);

      if (!removeu) {
        return res.status(404).json({ erro: 'Taxa não encontrada' });
      }

      res.json({ mensagem: 'Taxa excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir taxa de entrega:', error);
      res.status(500).json({ erro: 'Erro ao excluir taxa de entrega' });
    }
  },
};

module.exports = taxaEntregaController;

