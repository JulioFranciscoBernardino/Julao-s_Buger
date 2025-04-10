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
    // Outros métodos relacionados às categorias podem ser adicionados aqui
  };
  
  module.exports = categoriaController;
  