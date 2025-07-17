const CategoriaModel = require('../models/cardapioAdmModel');

exports.mostrarCardapio = async (req, res) => {
  try {
    // Agora getCategoriasComProdutos retorna um array de categorias com array produtos
    const categorias = await CategoriaModel.getCategoriasComProdutos();

    // Retorna diretamente, sem necessidade de agrupar
    res.json({ categorias });

  } catch (error) {
    console.error('Erro ao carregar o cardápio:', error);
    res.status(500).json({ erro: 'Erro ao carregar o cardápio' });
  }
};
