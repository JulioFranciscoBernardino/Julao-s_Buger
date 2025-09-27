const db = require('../config/bd');

const Opcional = {
  getAll: async () => {
    try {
      const [rows] = await db.query(`
        SELECT o.*, go.nome as grupo_nome, go.idgrupo_opcional 
        FROM opcional o 
        LEFT JOIN grupo_opcional go ON o.idgrupo_opcional = go.idgrupo_opcional 
        WHERE o.excluido = 0 AND o.ativo = 1 
        ORDER BY go.posicao ASC, o.posicao ASC, o.nome ASC
      `);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  cadastrarOpcional: async ({ nome, tipo, preco, idgrupo_opcional }) => {
    try {
      await db.query('INSERT INTO opcional (nome, tipo, preco, idgrupo_opcional) VALUES (?,?,?,?)', [nome, tipo, preco, idgrupo_opcional]);
    } catch (err) {
      throw err;
    }
  },

  deletarOpcional: async (idopcional) => {
    try {
      await db.query('UPDATE opcional SET excluido = 1, ativo = 0 WHERE idopcional = ?', [idopcional]);
    } catch (err) {
      throw err;
    }
  },

  atualizarOpcional: async (idopcional, { nome, tipo, preco }) => {
    try {
      await db.query('UPDATE opcional SET nome = ?, tipo = ?, preco = ? WHERE idopcional = ?', [nome, tipo, preco, idopcional]);
    } catch (err) {
      throw err;
    }
  },

  // Buscar opcionais de um produto específico
  getOpcionaisByProduto: async (idproduto) => {
    try {
      const [rows] = await db.query(`
        SELECT o.*, po.idproduto
        FROM opcional o
        JOIN produtoopcional po ON o.idopcional = po.idopcional
        WHERE po.idproduto = ? AND o.excluido = 0 AND o.ativo = 1
        ORDER BY o.posicao ASC
      `, [idproduto]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  // Adicionar opcional a um produto
  adicionarOpcionalAoProduto: async (idproduto, idopcional) => {
    try {
      await db.query('INSERT INTO produtoopcional (idproduto, idopcional) VALUES (?,?)', [idproduto, idopcional]);
    } catch (err) {
      throw err;
    }
  },

  // Remover opcional de um produto
  removerOpcionalDoProduto: async (idproduto, idopcional) => {
    try {
      await db.query('DELETE FROM produtoopcional WHERE idproduto = ? AND idopcional = ?', [idproduto, idopcional]);
    } catch (err) {
      throw err;
    }
  },

  getById: async (idopcional) => {
    try {
      const [rows] = await db.query('SELECT * FROM opcional WHERE idopcional = ? AND excluido = 0', [idopcional]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const opcional = rows[0];
      opcional.preco = Number(opcional.preco);
      return opcional;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Opcional;
