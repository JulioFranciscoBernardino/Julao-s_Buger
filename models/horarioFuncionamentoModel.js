const db = require('../config/bd');

const HorarioFuncionamento = {
  getAll: async () => {
    try {
      const [rows] = await db.query(`
        SELECT * FROM horario_funcionamento 
        ORDER BY dia_semana ASC
      `);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  getByDiaSemana: async (diaSemana) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM horario_funcionamento WHERE dia_semana = ?',
        [diaSemana]
      );
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  criarOuAtualizar: async ({ dia_semana, horario_inicio, horario_fim, ativo }) => {
    try {
      // Verificar se já existe horário para este dia
      const [existing] = await db.query(
        'SELECT idhorario FROM horario_funcionamento WHERE dia_semana = ?',
        [dia_semana]
      );

      if (existing.length > 0) {
        // Atualizar existente
        await db.query(
          'UPDATE horario_funcionamento SET horario_inicio = ?, horario_fim = ?, ativo = ? WHERE dia_semana = ?',
          [horario_inicio, horario_fim, ativo ? 1 : 0, dia_semana]
        );
        return existing[0].idhorario;
      } else {
        // Criar novo
        const [result] = await db.query(
          'INSERT INTO horario_funcionamento (dia_semana, horario_inicio, horario_fim, ativo) VALUES (?, ?, ?, ?)',
          [dia_semana, horario_inicio, horario_fim, ativo ? 1 : 0]
        );
        return result.insertId;
      }
    } catch (err) {
      throw err;
    }
  },

  atualizarTodos: async (horarios) => {
    try {
      await db.query('START TRANSACTION');
      
      for (const horario of horarios) {
        await db.query(
          'UPDATE horario_funcionamento SET horario_inicio = ?, horario_fim = ?, ativo = ? WHERE dia_semana = ?',
          [
            horario.horario_inicio,
            horario.horario_fim,
            horario.ativo ? 1 : 0,
            horario.dia_semana
          ]
        );
      }
      
      await db.query('COMMIT');
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  },

  deletar: async (idhorario) => {
    try {
      await db.query('DELETE FROM horario_funcionamento WHERE idhorario = ?', [idhorario]);
    } catch (err) {
      throw err;
    }
  }
};

module.exports = HorarioFuncionamento;

