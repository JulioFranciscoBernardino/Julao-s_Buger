const db = require('../config/bd');

const Produto = {
  getAll: async () => {
    try {
      const [rows] = await db.query('SELECT * FROM Produto');
      const produtos = rows.map(p => ({
        ...p,
        preco: Number(p.preco)
      }));
      return produtos;
    } catch (err) {
      throw err;
    }
  }
  // Outras funções relacionadas ao Produto podem ser adicionadas aqui
};

module.exports = Produto;
