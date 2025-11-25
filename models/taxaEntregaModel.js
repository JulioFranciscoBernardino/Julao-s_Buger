const db = require('../config/bd');

const TaxaEntregaModel = {
  async getAll({ apenasAtivas = false } = {}) {
    const where = apenasAtivas ? 'WHERE ativo = 1' : '';
    const [rows] = await db.query(
      `SELECT idtaxa_entrega AS id, distancia_km, valor, ativo, observacao, criado_em
         FROM taxa_entrega
         ${where}
         ORDER BY distancia_km ASC`
    );
    return rows.map((row) => ({
      id: row.id,
      distancia_km: Number(row.distancia_km),
      valor: Number(row.valor),
      ativo: !!row.ativo,
      observacao: row.observacao || null,
      criado_em: row.criado_em,
    }));
  },

  async criar({ distancia_km, valor, observacao, ativo = true }) {
    const [result] = await db.query(
      `INSERT INTO taxa_entrega (distancia_km, valor, observacao, ativo)
       VALUES (?, ?, ?, ?)`,
      [distancia_km, valor, observacao || null, ativo ? 1 : 0]
    );
    return { id: result.insertId };
  },

  async atualizar(id, { distancia_km, valor, observacao, ativo }) {
    const campos = [];
    const valores = [];

    if (distancia_km !== undefined) {
      campos.push('distancia_km = ?');
      valores.push(distancia_km);
    }
    if (valor !== undefined) {
      campos.push('valor = ?');
      valores.push(valor);
    }
    if (observacao !== undefined) {
      campos.push('observacao = ?');
      valores.push(observacao || null);
    }
    if (ativo !== undefined) {
      campos.push('ativo = ?');
      valores.push(ativo ? 1 : 0);
    }

    if (!campos.length) {
      return false;
    }

    valores.push(id);

    const [resultado] = await db.query(
      `UPDATE taxa_entrega SET ${campos.join(', ')} WHERE idtaxa_entrega = ?`,
      valores
    );

    return resultado.affectedRows > 0;
  },

  async excluir(id) {
    const [resultado] = await db.query(
      'DELETE FROM taxa_entrega WHERE idtaxa_entrega = ?',
      [id]
    );
    return resultado.affectedRows > 0;
  },
};

module.exports = TaxaEntregaModel;

