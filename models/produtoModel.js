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
  },

  deletarProduto: async (idproduto) => {
    const fs = require('fs');
    const path = require('path');
    try {
      // Buscar nome da imagem
      const [rows] = await db.query('SELECT imagem FROM Produto WHERE idproduto = ?', [idproduto]);
      if (rows.length > 0 && rows[0].imagem) {
        let nomeArquivo = rows[0].imagem;
        if (nomeArquivo.startsWith('/imgs/')) {
          nomeArquivo = nomeArquivo.replace('/imgs/', '');
        }
        const imgPath = path.join(__dirname, '../public/imgs/', nomeArquivo);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      }
      // Deletar produto do banco
      await db.query(
        'DELETE FROM Produto WHERE idproduto = ?',
        [idproduto]
      );
    } catch (err) {
      throw err;
    }
  },

  atualizarProduto: async (idproduto, { nome, descricao, preco, imagem, idcategoria }) => {
    try {
      await db.query(
        'UPDATE Produto SET nome = ?, descricao = ?, preco = ?, imagem = ?, idcategoria = ? WHERE idproduto = ?',
        [nome, descricao, preco, imagem, idcategoria, idproduto]
      );
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Produto;
