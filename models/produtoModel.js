const db = require('../config/bd');

const Produto = {
  getAll: async () => {
    try {
      const [rows] = await db.query(`
        SELECT Produto.*, Categoria.nome AS categoria_nome
        FROM Produto
        JOIN Categoria ON Produto.idcategoria = Categoria.idcategoria
      `);

      // Convertendo preco para número (caso venha como string do MySQL)
      const produtosFormatados = rows.map(produto => ({
        ...produto,
        preco: Number(produto.preco)
      }));

      return produtosFormatados;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Produto;
