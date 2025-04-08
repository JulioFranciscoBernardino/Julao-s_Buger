const Produto = require('../models/produtoModel');

const produtoController = {
  listarProdutos: async (req, res) => {
    try {
      const produtos = await Produto.getAll();
      res.render('index', { produtos });
    } catch (err) {
      console.error(err);
      res.status(500).send('Erro ao buscar produtos.');
    }
  }
  // Outras funções relacionadas aos produtos podem ser adicionadas aqui
};

module.exports = produtoController;
