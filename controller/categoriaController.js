const Categoria = require('../models/categoriaModel');

const categoriaController = {
  listarCategorias: async (req, res) => {
    try {
      const categorias = await Categoria.getAll();
      res.json(categorias);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
  },

  inserirCategoria: async (req, res) => {
    const { nome } = req.body;
    try {
      await Categoria.cadastrarCategoria({ nome });
      res.json({ message: 'Categoria cadastrada com sucesso!' });
    } catch (error) {
      console.error('Erro ao cadastrar a categoria:', error);
      res.status(500).json({ error: 'Erro ao cadastrar a categoria' });
    }
  }
};

module.exports = categoriaController;
