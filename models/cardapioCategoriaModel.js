const db = require('../config/bd');

async function getCategoriasComProdutos() {
  const [categorias] = await db.query(`
    SELECT c.idcategoria, c.nome AS categoria_nome,
           p.idproduto, p.nome AS produto_nome, p.descricao, p.preco
    FROM Categoria c
    LEFT JOIN Produto p ON c.idcategoria = p.idcategoria
    ORDER BY c.idcategoria;
  `);
  return categorias;
}

module.exports = {
  getCategoriasComProdutos
};
