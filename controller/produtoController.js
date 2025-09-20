const Produto = require('../models/produtoModel');
const Categoria = require('../models/categoriaModel');
const SaborBebida = require('../models/saborBebidaModel');

const produtoController = {
  listarProdutos: async (req, res) => {
    try {
      const produtos = await Produto.getAll();
      res.json(produtos);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  inserirProduto: async (req, res) => {
    try {
      const { nome, descricao, preco, categoria } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'Imagem é obrigatória' });
      }

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
      res.json({ mensagem: 'Produto marcado como excluído com sucesso!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ mensagem: 'Erro ao marcar produto como excluído.' });
    }
  },


};

module.exports = produtoController;
