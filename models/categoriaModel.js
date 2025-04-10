const db = require('../config/bd');

const Categoria = {
  getAll: async () => {
    try {
      const [rows] = await db.query('SELECT * FROM Categoria');
      return rows;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Categoria;
