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
      // Buscar a última posição para adicionar a nova categoria no final
      const [rows] = await db.query('SELECT MAX(posicao) as maxPosicao FROM categoria WHERE excluido = 0');
      const proximaPosicao = (rows[0]?.maxPosicao || 0) + 1;
      
      await db.query('INSERT INTO categoria (nome, posicao) VALUES (?, ?)', [nome, proximaPosicao]);
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
  },

  reordenarCategorias: async (categorias) => {
    try {
      if (!categorias || categorias.length === 0) {
        throw new Error('Lista de categorias vazia');
      }

      // Usar transação para garantir consistência
      await db.query('START TRANSACTION');
      
      // Atualizar as posições sequencialmente
      for (let i = 0; i < categorias.length; i++) {
        const categoria = categorias[i];
        await db.query(
          'UPDATE categoria SET posicao = ? WHERE idcategoria = ?',
          [i + 1, categoria.idcategoria]
        );
      }
      
      await db.query('COMMIT');
      
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  }
};

module.exports = Categoria;
