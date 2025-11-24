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
  },

  deletarCategoria: async (req, res) => {
    try {
      await Categoria.deletarCategoria(req.params.idcategoria);
      res.json({ message: 'Categoria marcada como excluída com sucesso!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao marcar categoria como excluída.' });
    }
  },

  atualizarCategoria: async (req, res) => {
    const { nome } = req.body;
    try {
      await Categoria.atualizarCategoria(req.params.idcategoria, { nome });
      res.json({ message: 'Categoria atualizada com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar categoria');
      res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  },

  reordenarCategorias: async (req, res) => {
    try {
      const { categorias } = req.body;
      
      if (!categorias || categorias.length === 0) {
        return res.status(400).json({ error: 'Lista de categorias vazia' });
      }
      
      await Categoria.reordenarCategorias(categorias);
      res.json({ message: 'Categorias reordenadas com sucesso!' });
    } catch (error) {
      console.error('Erro ao reordenar categorias');
      res.status(500).json({ error: 'Erro ao reordenar categorias' });
    }
  }
};

module.exports = categoriaController;
