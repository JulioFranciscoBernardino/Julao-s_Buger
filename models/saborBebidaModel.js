const db = require('../config/bd');

const SaborBebida = {
  getAll: async () => {
    try {
      // Tabela SaborBebida não existe, retornando array vazio
      // Se precisar desta funcionalidade, criar a tabela no banco
      return [];
    } catch (err) {
      throw err;
    }
  }
};

module.exports = SaborBebida;
