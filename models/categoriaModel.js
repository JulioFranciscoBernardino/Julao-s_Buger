const db = require('../config/bd');

const Categoria = {
  getAll: async () => {
    try {
      const [rows] = await db.query('SELECT * FROM categoria WHERE excluido = 0 AND ativo = 1 ORDER BY posicao ASC');
      return rows;
    } catch (err) {
      throw err;
    }
  },

  cadastrarCategoria: async ({ nome }) => {
    try {
      await db.query('INSERT INTO categoria (nome) VALUES (?)', [nome]);
    } catch (err) {
      throw err;
    }
  },

  deletarCategoria: async (idcategoria) => {
    try {
      await db.query('UPDATE categoria SET excluido = 1, ativo = 0 WHERE idcategoria = ?', [idcategoria]);
    } catch (err) {
      throw err;
    }
  },

  atualizarCategoria: async (idcategoria, { nome }) => {
    try {
      await db.query('UPDATE categoria SET nome = ? WHERE idcategoria = ?', [nome, idcategoria]);
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Categoria;
