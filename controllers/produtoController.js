const Produto = require('../models/produtoModel');
const Categoria = require('../models/categoriaModel');
const SaborBebida = require('../models/saborBebidaModel');

const produtoController = {
  listarProdutos: async (req, res) => {
    try {
      const produtos = await Produto.getAll();
      const categorias = await Categoria.getAll();
      const sabores = await SaborBebida.getAll(); // <- Aqui você busca os sabores

      // ✅ Renderiza passando todos os dados necessários
      res.render('index', { produtos, categorias, sabores });
    } catch (err) {
      console.error('Erro ao buscar produtos, categorias ou sabores:', err);
      res.status(500).send('Erro interno do servidor');
    }
  },
};

module.exports = produtoController;
