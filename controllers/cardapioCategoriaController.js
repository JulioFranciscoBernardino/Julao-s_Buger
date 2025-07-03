const CategoriaModel = require('../models/cardapioCategoriaModel');

exports.mostrarCardapio = async (req, res) => {
  try {
    const categoriasProdutos = await CategoriaModel.getCategoriasComProdutos();

    // Agrupar os produtos por categoria
    const categorias = {};
    categoriasProdutos.forEach(item => {
      const id = item.idcategoria;
      if (!categorias[id]) {
        categorias[id] = {
          id: id,
          nome: item.categoria_nome,
          produtos: []
        };
      }
      if (item.idproduto) {
        categorias[id].produtos.push({
          id: item.idproduto,
          nome: item.produto_nome,
          descricao: item.descricao,
          preco: item.preco
        });
      }
    });

    res.render('cardapio', { categorias: Object.values(categorias) });

  } catch (error) {
    console.error('Erro ao carregar o cardápio:', error);
    res.status(500).send('Erro ao carregar o cardápio');
  }
};
