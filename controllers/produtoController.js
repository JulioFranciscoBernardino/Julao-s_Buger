const Produto = require('../models/produtoModel');
const Categoria = require('../models/categoriaModel');

const produtoController = {
  listarProdutos: async (req, res) => {
    try {
      const produtos = await Produto.getAll();
      const categorias = await Categoria.getAll();
      res.render('index', { produtos, categorias });
    } catch (err) {
      console.error('Erro ao buscar produtos e categorias:', err);
      res.status(500).send('Erro interno do servidor');
    }
  },
  // Outros métodos do controlador...
};


module.exports = produtoController;
