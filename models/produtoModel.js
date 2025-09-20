const db = require('../config/bd');

const Produto = {
  getAll: async () => {
    try {
      const [rows] = await db.query(`
        SELECT produto.*, categoria.nome AS categoria_nome
        FROM produto
        JOIN categoria ON produto.idcategoria = categoria.idcategoria
        WHERE produto.excluido = 0 AND produto.ativo = 1
        ORDER BY produto.posicao ASC, produto.nome ASC
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
        'INSERT INTO produto (nome, descricao, preco, imagem, idcategoria) VALUES (?,?,?,?,?)',
        [nome, descricao, preco, imagem, idcategoria]
      );
    } catch (err) {
      throw err;
    }
  },

  deletarProduto: async (idproduto) => {
  try {
    console.log('ID para marcar como excluído:', idproduto); 


    const [result] = await db.query(`
      UPDATE produto
      SET excluido = 1, ativo = 0
      WHERE idproduto = ?
    `, [idproduto]);

    console.log('Produto marcado como excluído:', result);
  } catch (err) {
    throw err;
  }
},


  atualizarProduto: async (idproduto, { nome, descricao, preco, imagem, idcategoria }) => {
    try {
      await db.query(
        'UPDATE produto SET nome = ?, descricao = ?, preco = ?, imagem = ?, idcategoria = ? WHERE idproduto = ?',
        [nome, descricao, preco, imagem, idcategoria, idproduto]
      );
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Produto;
