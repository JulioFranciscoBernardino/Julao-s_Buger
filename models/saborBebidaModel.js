const db = require('../config/bd');

const SaborBebida = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM SaborBebida', (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
};

module.exports = SaborBebida;
