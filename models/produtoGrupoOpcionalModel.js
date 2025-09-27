const db = require('../config/bd');

class ProdutoGrupoOpcionalModel {
  // Buscar grupos de opcionais de um produto
  async getGruposByProduto(idproduto) {
    try {
      const [rows] = await db.execute(
        `SELECT pgo.*, go.nome as grupo_nome, go.descricao as grupo_descricao,
                COUNT(o.idopcional) as total_opcionais
         FROM produto_grupo_opcional pgo
         JOIN grupo_opcional go ON pgo.idgrupo_opcional = go.idgrupo_opcional
         LEFT JOIN opcional o ON go.idgrupo_opcional = o.idgrupo_opcional AND o.excluido = 0
         WHERE pgo.idproduto = ? AND go.excluido = 0
         GROUP BY pgo.idproduto, pgo.idgrupo_opcional
         ORDER BY go.posicao ASC, go.nome ASC`,
        [idproduto]
      );
      return rows;
    } catch (error) {
      console.error('Erro ao buscar grupos de opcionais do produto:', error);
      throw error;
    }
  }

  // Adicionar grupo de opcionais a um produto
  async adicionarGrupoAoProduto(idproduto, idgrupo_opcional, dados = {}) {
    try {
      const { obrigatorio = 0, maximo_escolhas = null, minimo_escolhas = 0, nome_exibicao = null, instrucoes = null } = dados;
      
      await db.execute(
        `INSERT INTO produto_grupo_opcional 
         (idproduto, idgrupo_opcional, obrigatorio, maximo_escolhas, minimo_escolhas, nome_exibicao, instrucoes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [idproduto, idgrupo_opcional, obrigatorio, maximo_escolhas, minimo_escolhas, nome_exibicao, instrucoes]
      );
      
      return true;
    } catch (error) {
      console.error('Erro ao adicionar grupo ao produto:', error);
      throw error;
    }
  }

  // Remover grupo de opcionais de um produto
  async removerGrupoDoProduto(idproduto, idgrupo_opcional) {
    try {
      const [result] = await db.execute(
        'DELETE FROM produto_grupo_opcional WHERE idproduto = ? AND idgrupo_opcional = ?',
        [idproduto, idgrupo_opcional]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao remover grupo do produto:', error);
      throw error;
    }
  }

  // Atualizar configurações do grupo no produto
  async atualizarGrupoNoProduto(idproduto, idgrupo_opcional, dados) {
    try {
      const { obrigatorio, maximo_escolhas, minimo_escolhas, nome_exibicao, instrucoes } = dados;
      
      const [result] = await db.execute(
        `UPDATE produto_grupo_opcional 
         SET obrigatorio = ?, maximo_escolhas = ?, minimo_escolhas = ?, nome_exibicao = ?, instrucoes = ?
         WHERE idproduto = ? AND idgrupo_opcional = ?`,
        [obrigatorio, maximo_escolhas, minimo_escolhas, nome_exibicao, instrucoes, idproduto, idgrupo_opcional]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao atualizar grupo no produto:', error);
      throw error;
    }
  }

  // Buscar produtos que usam um grupo de opcionais
  async getProdutosByGrupo(idgrupo_opcional) {
    try {
      const [rows] = await db.execute(
        `SELECT pgo.*, p.nome as produto_nome, p.preco as produto_preco
         FROM produto_grupo_opcional pgo
         JOIN produto p ON pgo.idproduto = p.idproduto
         WHERE pgo.idgrupo_opcional = ? AND p.excluido = 0
         ORDER BY p.nome ASC`,
        [idgrupo_opcional]
      );
      return rows;
    } catch (error) {
      console.error('Erro ao buscar produtos do grupo:', error);
      throw error;
    }
  }

  // Buscar grupos disponíveis para adicionar a um produto
  async getGruposDisponiveisParaProduto(idproduto) {
    try {
      const [rows] = await db.execute(
        `SELECT go.*, COUNT(o.idopcional) as total_opcionais
         FROM grupo_opcional go
         LEFT JOIN opcional o ON go.idgrupo_opcional = o.idgrupo_opcional AND o.excluido = 0
         LEFT JOIN produto_grupo_opcional pgo ON go.idgrupo_opcional = pgo.idgrupo_opcional AND pgo.idproduto = ?
         WHERE go.excluido = 0 AND pgo.idgrupo_opcional IS NULL
         GROUP BY go.idgrupo_opcional
         ORDER BY go.posicao ASC, go.nome ASC`,
        [idproduto]
      );
      return rows;
    } catch (error) {
      console.error('Erro ao buscar grupos disponíveis:', error);
      throw error;
    }
  }

  // Verificar se produto já tem o grupo
  async produtoTemGrupo(idproduto, idgrupo_opcional) {
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM produto_grupo_opcional WHERE idproduto = ? AND idgrupo_opcional = ?',
        [idproduto, idgrupo_opcional]
      );
      return rows[0].count > 0;
    } catch (error) {
      console.error('Erro ao verificar se produto tem grupo:', error);
      throw error;
    }
  }

  // Buscar opcionais de um grupo específico de um produto
  async getOpcionaisDoGrupoNoProduto(idproduto, idgrupo_opcional) {
    try {
      const [rows] = await db.execute(
        `SELECT o.*, go.nome as grupo_nome
         FROM opcional o
         JOIN grupo_opcional go ON o.idgrupo_opcional = go.idgrupo_opcional
         JOIN produto_grupo_opcional pgo ON go.idgrupo_opcional = pgo.idgrupo_opcional
         WHERE pgo.idproduto = ? AND pgo.idgrupo_opcional = ? AND o.excluido = 0
         ORDER BY o.posicao ASC, o.nome ASC`,
        [idproduto, idgrupo_opcional]
      );
      return rows;
    } catch (error) {
      console.error('Erro ao buscar opcionais do grupo no produto:', error);
      throw error;
    }
  }
}

module.exports = new ProdutoGrupoOpcionalModel();
