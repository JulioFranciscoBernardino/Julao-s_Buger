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

  inserirProduto: async (req, res) => {
    const {nome, descricao, preco, imagem, idcategoria} = req.body;
    try {
      await Categoria.cadastrarProduto({nome, descricao, preco, imagem, idcategoria});
      res.json({ message: 'Categoria cadastrada com sucesso!' });
    } catch (error) {
      console.error('Erro ao cadastrar a categoria:', error);
      res.status(500).json({ error: 'Erro ao cadastrar a categoria' });
    }
  }

  
};

module.exports = produtoController;
