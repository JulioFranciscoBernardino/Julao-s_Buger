const pool = require('../config/bd');

class GrupoOpcionalModel {
  // Listar todos os grupos de opcionais
  async getAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM grupo_opcional WHERE excluido = 0 ORDER BY posicao ASC, nome ASC'
      );
      return rows;
    } catch (error) {
      console.error('Erro ao buscar grupos de opcionais:', error);
      throw error;
    }
  }

  // Buscar grupo por ID
  async getById(idgrupo_opcional) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM grupo_opcional WHERE idgrupo_opcional = ? AND excluido = 0',
        [idgrupo_opcional]
      );
      return rows[0];
    } catch (error) {
      console.error('Erro ao buscar grupo de opcional:', error);
      throw error;
    }
  }

  // Cadastrar novo grupo
  async cadastrarGrupo(dados) {
    try {
      const { nome, descricao, posicao } = dados;
      const [result] = await pool.execute(
        'INSERT INTO grupo_opcional (nome, descricao, posicao) VALUES (?, ?, ?)',
        [nome, descricao || null, posicao || 0]
      );
      return result.insertId;
    } catch (error) {
      console.error('Erro ao cadastrar grupo de opcional:', error);
      throw error;
    }
  }

  // Atualizar grupo
  async atualizarGrupo(idgrupo_opcional, dados) {
    try {
      const { nome, descricao, posicao } = dados;
      const [result] = await pool.execute(
        'UPDATE grupo_opcional SET nome = ?, descricao = ?, posicao = ? WHERE idgrupo_opcional = ? AND excluido = 0',
        [nome, descricao || null, posicao || 0, idgrupo_opcional]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao atualizar grupo de opcional:', error);
      throw error;
    }
  }

  // Deletar grupo (soft delete)
  async deletarGrupo(idgrupo_opcional) {
    try {
      const [result] = await pool.execute(
        'UPDATE grupo_opcional SET excluido = 1 WHERE idgrupo_opcional = ?',
        [idgrupo_opcional]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao deletar grupo de opcional:', error);
      throw error;
    }
  }

  // Buscar opcionais de um grupo
  async getOpcionaisByGrupo(idgrupo_opcional) {
    try {
      const [rows] = await pool.execute(
        `SELECT o.*, go.nome as grupo_nome 
         FROM opcional o 
         LEFT JOIN grupo_opcional go ON o.idgrupo_opcional = go.idgrupo_opcional 
         WHERE o.idgrupo_opcional = ? AND o.excluido = 0 
         ORDER BY o.posicao ASC, o.nome ASC`,
        [idgrupo_opcional]
      );
      return rows;
    } catch (error) {
      console.error('Erro ao buscar opcionais do grupo:', error);
      throw error;
    }
  }

  // Buscar grupos com contagem de opcionais
  async getGruposComContagem() {
    try {
      const [rows] = await pool.execute(
        `SELECT go.*, COUNT(o.idopcional) as total_opcionais
         FROM grupo_opcional go
         LEFT JOIN opcional o ON go.idgrupo_opcional = o.idgrupo_opcional AND o.excluido = 0
         WHERE go.excluido = 0
         GROUP BY go.idgrupo_opcional
         ORDER BY go.posicao ASC, go.nome ASC`
      );
      return rows;
    } catch (error) {
      console.error('Erro ao buscar grupos com contagem:', error);
      throw error;
    }
  }
}

module.exports = new GrupoOpcionalModel();
