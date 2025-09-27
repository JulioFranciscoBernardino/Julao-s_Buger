const Opcional = require('../models/opcionalModel');

const opcionalController = {
  listarOpcionais: async (req, res) => {
    try {
      const opcionais = await Opcional.getAll();
      res.json(opcionais);
    } catch (err) {
      console.error('Erro ao buscar opcionais:', err);
      res.status(500).json({ error: 'Erro ao buscar opcionais.' });
    }
  },

  inserirOpcional: async (req, res) => {
    const { nome, tipo, preco, idgrupo_opcional } = req.body;
    try {
      await Opcional.cadastrarOpcional({ nome, tipo, preco, idgrupo_opcional });
      res.json({ message: 'Opcional cadastrado com sucesso!' });
    } catch (error) {
      console.error('Erro ao cadastrar opcional:', error);
      res.status(500).json({ error: 'Erro ao cadastrar opcional' });
    }
  },

  deletarOpcional: async (req, res) => {
    try {
      await Opcional.deletarOpcional(req.params.idopcional);
      res.json({ message: 'Opcional marcado como excluído com sucesso!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao marcar opcional como excluído.' });
    }
  },

  atualizarOpcional: async (req, res) => {
    const { nome, tipo, preco } = req.body;
    try {
      await Opcional.atualizarOpcional(req.params.idopcional, { nome, tipo, preco });
      res.json({ message: 'Opcional atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar opcional:', error);
      res.status(500).json({ error: 'Erro ao atualizar opcional' });
    }
  },

  getOpcionaisByProduto: async (req, res) => {
    try {
      const opcionais = await Opcional.getOpcionaisByProduto(req.params.idproduto);
      res.json(opcionais);
    } catch (err) {
      console.error('Erro ao buscar opcionais do produto:', err);
      res.status(500).json({ error: 'Erro ao buscar opcionais do produto.' });
    }
  },

  adicionarOpcionalAoProduto: async (req, res) => {
    const { idproduto, idopcional } = req.body;
    try {
      await Opcional.adicionarOpcionalAoProduto(idproduto, idopcional);
      res.json({ message: 'Opcional adicionado ao produto com sucesso!' });
    } catch (error) {
      console.error('Erro ao adicionar opcional ao produto:', error);
      res.status(500).json({ error: 'Erro ao adicionar opcional ao produto' });
    }
  },

  removerOpcionalDoProduto: async (req, res) => {
    const { idproduto, idopcional } = req.body;
    try {
      await Opcional.removerOpcionalDoProduto(idproduto, idopcional);
      res.json({ message: 'Opcional removido do produto com sucesso!' });
    } catch (error) {
      console.error('Erro ao remover opcional do produto:', error);
      res.status(500).json({ error: 'Erro ao remover opcional do produto' });
    }
  },

  buscarOpcionalPorId: async (req, res) => {
    try {
      const opcional = await Opcional.getById(req.params.idopcional);
      res.json(opcional);
    } catch (err) {
      console.error('Erro ao buscar opcional:', err);
      res.status(500).json({ error: 'Erro ao buscar opcional.' });
    }
  }
};

module.exports = opcionalController;
