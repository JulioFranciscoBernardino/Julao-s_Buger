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

class Categorias {
  static async cadastrarCategoria({nome}) {
     await pool.query(
            'INSERT INTO Categoria (nome) VALUES (?)',
            [nome]
        );
  }
};


module.exports = Categorias;

module.exports = Categoria;
