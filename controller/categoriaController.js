const Categoria = require('../models/categoriaModel');

const categoriaController = {
  listarCategorias: async (req, res) => {
    try {
      const categorias = await Categoria.getAll();
      res.render('categorias', { categorias });
    } catch (err) {
      res.status(500).send('Erro ao buscar categorias.');
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
