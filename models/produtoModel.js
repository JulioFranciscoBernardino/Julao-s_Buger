const db = require('../config/bd');

const Produto = {
  getAll: async () => {
    try {
      const [rows] = await db.query(`
        SELECT Produto.*, Categoria.nome AS categoria_nome
        FROM Produto
        JOIN Categoria ON Produto.idcategoria = Categoria.idcategoria
      `);

      // Converter preço para número
      const produtosFormatados = rows.map(produto => ({
        ...produto,
        preco: Number(produto.preco)
      }));

      return produtosFormatados;
    } catch (err) {
      throw err;
    }
  },

  cadastrarProduto: async ({ nome, descricao, preco, imagem, idcategoria }) => {
  try {
    await db.query(
      'INSERT INTO Produto (nome, descricao, preco, imagem, idcategoria) VALUES (?,?,?,?,?)',
      [nome, descricao, preco, imagem, idcategoria]
    );
  } catch (err) {
    throw err;
  }
}
};

module.exports = Produto;
