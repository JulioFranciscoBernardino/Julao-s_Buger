const db = require('../config/bd');

async function getCategoriasComProdutos() {
  // Busca categorias ativas (não excluídas)
  const [categorias] = await db.query(`
    SELECT idcategoria, nome
    FROM categoria
    WHERE excluido = 0 AND ativo = 1
    ORDER BY posicao ASC;
  `);

  // Para cada categoria, busca produtos ativos
  for (const categoria of categorias) {
    const [produtos] = await db.query(`
      SELECT idproduto, nome, descricao, preco, preco_pontos, imagem, posicao, disponivel
      FROM produto
      WHERE idcategoria = ? AND excluido = 0 AND ativo = 1
      ORDER BY posicao ASC, nome ASC;
    `, [categoria.idcategoria]);

    // Converter preço e preco_pontos para número
    categoria.produtos = produtos.map(produto => ({
      ...produto,
      preco: Number(produto.preco),
      preco_pontos: produto.preco_pontos ? Number(produto.preco_pontos) : null
    }));
  }

  return categorias;
}

// Função para buscar categorias com produtos disponíveis (para cardápio público)
async function getCategoriasComProdutosDisponiveis() {
  // Busca categorias ativas (não excluídas)
  const [categorias] = await db.query(`
    SELECT idcategoria, nome
    FROM categoria
    WHERE excluido = 0 AND ativo = 1
    ORDER BY posicao ASC;
  `);

  // Para cada categoria, busca apenas produtos disponíveis
  for (const categoria of categorias) {
    const [produtos] = await db.query(`
      SELECT idproduto, nome, descricao, preco, preco_pontos, imagem, posicao, disponivel
      FROM produto
      WHERE idcategoria = ? AND excluido = 0 AND ativo = 1 AND disponivel = 1
      ORDER BY posicao ASC, nome ASC;
    `, [categoria.idcategoria]);

    // Converter preço e preco_pontos para número
    categoria.produtos = produtos.map(produto => ({
      ...produto,
      preco: Number(produto.preco),
      preco_pontos: produto.preco_pontos ? Number(produto.preco_pontos) : null
    }));
  }

  return categorias;
}

module.exports = {
  getCategoriasComProdutos,
  getCategoriasComProdutosDisponiveis
};
