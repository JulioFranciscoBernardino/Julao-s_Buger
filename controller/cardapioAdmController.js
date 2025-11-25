const CategoriaModel = require('../models/cardapioAdmModel');

function limparImagensProdutos(categorias) {
  categorias.forEach(categoria => {
    if (categoria.produtos) {
      categoria.produtos.forEach(produto => {
        if (produto.imagem) {
          if (produto.imagem.startsWith('http://') || produto.imagem.startsWith('https://')) {
            const fileName = produto.imagem.split('/').pop().split('?')[0];
            produto.imagem = `/imgs/${fileName}`;
          } else if (!produto.imagem.startsWith('/imgs/')) {
            produto.imagem = `/imgs/${produto.imagem}`;
          }
        }
      });
    }
  });
  return categorias;
}

exports.mostrarCardapio = async (req, res) => {
  try {
    // Headers para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Agora getCategoriasComProdutos retorna um array de categorias com array produtos
    let categorias = await CategoriaModel.getCategoriasComProdutos();
    
    // Limpar URLs absolutas das imagens
    categorias = limparImagensProdutos(categorias);

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
    let categorias = await CategoriaModel.getCategoriasComProdutosDisponiveis();
    
    // Limpar URLs absolutas das imagens
    categorias = limparImagensProdutos(categorias);

    // Retorna diretamente, sem necessidade de agrupar
    res.json({ categorias });

  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar o cardápio' });
  }
};