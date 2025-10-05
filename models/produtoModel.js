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

  getByCategoria: async (idcategoria) => {
    try {
      const [rows] = await db.query(`
        SELECT produto.*, categoria.nome AS categoria_nome
        FROM produto
        JOIN categoria ON produto.idcategoria = categoria.idcategoria
        WHERE produto.idcategoria = ? AND produto.excluido = 0 AND produto.ativo = 1
        ORDER BY produto.posicao ASC, produto.nome ASC
      `, [idcategoria]);

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
  },

  reordenarProdutos: async (produtos) => {
    try {
      if (!produtos || produtos.length === 0) {
        throw new Error('Lista de produtos vazia');
      }

      // Usar transação para garantir consistência
      await db.query('START TRANSACTION');
      
      // Primeiro, obter a categoria do primeiro produto para garantir que todos são da mesma categoria
      const [categoriaCheck] = await db.query(
        'SELECT idcategoria FROM produto WHERE idproduto = ?',
        [produtos[0].idproduto]
      );
      
      if (categoriaCheck.length === 0) {
        throw new Error('Produto não encontrado');
      }
      
      const idCategoria = categoriaCheck[0].idcategoria;
      
      // Verificar se todos os produtos são da mesma categoria
      for (const produto of produtos) {
        const [produtoCheck] = await db.query(
          'SELECT idcategoria FROM produto WHERE idproduto = ?',
          [produto.idproduto]
        );
        
        if (produtoCheck.length === 0 || produtoCheck[0].idcategoria !== idCategoria) {
          throw new Error('Todos os produtos devem ser da mesma categoria');
        }
      }
      
      // Atualizar as posições sequencialmente
      for (let i = 0; i < produtos.length; i++) {
        const produto = produtos[i];
        await db.query(
          'UPDATE produto SET posicao = ? WHERE idproduto = ?',
          [i + 1, produto.idproduto]
        );
      }
      
      await db.query('COMMIT');
      
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  },

  getOpcionaisDoProduto: async (idproduto) => {
    try {
      const [rows] = await db.query(`
        SELECT o.idopcional, o.nome, o.tipo, o.preco, o.posicao
        FROM opcional o
        INNER JOIN produtoopcional po ON o.idopcional = po.idopcional
        WHERE po.idproduto = ? AND o.ativo = 1 AND o.excluido = 0
        ORDER BY o.tipo ASC, o.posicao ASC, o.nome ASC
      `, [idproduto]);
      
      // Converter preço para número
      const opcionaisFormatados = rows.map(opcional => ({
        ...opcional,
        preco: Number(opcional.preco)
      }));
      
      return opcionaisFormatados;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Produto;
