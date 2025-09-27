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

      await Produto.cadastrarProduto({ nome, descricao, preco: parseFloat(preco), imagem: imagemUrl, idcategoria: parseInt(categoria) });
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

  atualizarProduto: async (req, res) => {
    try {
      const { nome, descricao, preco, categoria } = req.body;
      const idproduto = req.params.idproduto;
      
      
      const updateData = { 
        nome, 
        descricao, 
        preco: parseFloat(preco), 
        idcategoria: parseInt(categoria) 
      };
      
      // Só adiciona imagem se um arquivo foi enviado
      if (req.file) {
        updateData.imagem = `/imgs/${req.file.filename}`;
      }

      await Produto.atualizarProduto(idproduto, updateData);
      
      res.json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      res.status(500).json({ error: 'Erro ao atualizar produto: ' + error.message });
    }
  },

  buscarProdutoPorId: async (req, res) => {
    try {
      const produto = await Produto.getById(req.params.idproduto);
      res.json(produto);
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      res.status(500).json({ error: 'Erro ao buscar produto.' });
    }
  },


};

module.exports = produtoController;
