const CategoriaModel = require('../models/cardapioAdmModel');

exports.mostrarCardapio = async (req, res) => {
  try {
    // Headers para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Agora getCategoriasComProdutos retorna um array de categorias com array produtos
    const categorias = await CategoriaModel.getCategoriasComProdutos();


    // Retorna diretamente, sem necessidade de agrupar
    res.json({ categorias });

  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar o cardápio' });
  }
};

exports.mostrarCardapioPublico = async (req, res) => {
  try {
    // Headers para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Usa a função que filtra apenas produtos disponíveis
    const categorias = await CategoriaModel.getCategoriasComProdutosDisponiveis();

    // Retorna diretamente, sem necessidade de agrupar
    res.json({ categorias });

  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar o cardápio' });
  }
};