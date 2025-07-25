const db = require('../config/bd');

async function getCategoriasComProdutos() {
  // Busca categorias ativas (não excluídas)
  const [categorias] = await db.query(`
    SELECT idcategoria, nome
    FROM Categoria
    WHERE excluido = 0
    ORDER BY idcategoria;
  `);

  // Para cada categoria, busca produtos ativos
  for (const categoria of categorias) {
    const [produtos] = await db.query(`
      SELECT idproduto, nome, descricao, preco, imagem
      FROM Produto
      WHERE idcategoria = ? AND excluido = 0
      ORDER BY posicao ASC, nome ASC;
    `, [categoria.idcategoria]);

    categoria.produtos = produtos;
  }

  return categorias;
}

module.exports = {
  getCategoriasComProdutos
};
