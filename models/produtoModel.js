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


  atualizarProduto: async (idproduto, updateData) => {
    try {
      const updateFields = [];
      const values = [];
      
      if (updateData.nome !== undefined) {
        updateFields.push('nome = ?');
        values.push(updateData.nome);
      }
      if (updateData.descricao !== undefined) {
        updateFields.push('descricao = ?');
        values.push(updateData.descricao);
      }
      if (updateData.preco !== undefined) {
        updateFields.push('preco = ?');
        values.push(updateData.preco);
      }
      if (updateData.imagem !== undefined && updateData.imagem !== null) {
        updateFields.push('imagem = ?');
        values.push(updateData.imagem);
      }
      if (updateData.idcategoria !== undefined) {
        updateFields.push('idcategoria = ?');
        values.push(updateData.idcategoria);
      }
      
      values.push(idproduto);
      
      const query = `UPDATE produto SET ${updateFields.join(', ')} WHERE idproduto = ?`;
      await db.query(query, values);
    } catch (err) {
      throw err;
    }
  },

  getById: async (idproduto) => {
    try {
      const [rows] = await db.query(`
        SELECT produto.*, categoria.nome AS categoria_nome
        FROM produto
        JOIN categoria ON produto.idcategoria = categoria.idcategoria
        WHERE produto.idproduto = ? AND produto.excluido = 0
      `, [idproduto]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const produto = rows[0];
      produto.preco = Number(produto.preco);
      return produto;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Produto;
