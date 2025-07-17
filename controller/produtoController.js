const Produto = require('../models/produtoModel');
const Categoria = require('../models/categoriaModel');
const SaborBebida = require('../models/saborBebidaModel');

const produtoController = {
  listarProdutos: async (req, res) => {
    try {
      const produtos = await Produto.getAll();
      const categorias = await Categoria.getAll();
      const sabores = await SaborBebida.getAll();

      // ✅ Renderiza passando todos os dados necessários
      res.render('index', { produtos, categorias, sabores });
    } catch (err) {
      console.error('Erro ao buscar produtos, categorias ou sabores:', err);
      res.status(500).send('Erro interno do servidor');
    }
  },

  inserirProduto: async (req, res) => {
    try {
      const { nome, descricao, preco, categoria } = req.body;

      const imagemUrl = `/imgs/${req.file.filename}`;

      await Produto.cadastrarProduto({ nome, descricao, preco, imagem: imagemUrl, idcategoria: categoria });
      res.json({ message: 'Produto cadastrado com sucesso!', imagem: imagemUrl });
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      res.status(500).json({ error: 'Erro ao cadastrar produto' });
    }
  },

  deleteProduto: async (req, res) => {
    try {
      await Produto.deletarProduto(req.params.idproduto);
      res.json({ mensagem: 'Produto deletado com sucesso!' });
    } catch (err) {
      res.status(500).json({ mensagem: 'Erro ao deletar produto.' });
    }
  },

};

module.exports = produtoController;
