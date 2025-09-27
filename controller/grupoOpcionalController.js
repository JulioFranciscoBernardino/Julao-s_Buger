const grupoOpcionalModel = require('../models/grupoOpcionalModel');

class GrupoOpcionalController {
  // Listar todos os grupos de opcionais
  async listarGrupos(req, res) {
    try {
      const grupos = await grupoOpcionalModel.getGruposComContagem();
      res.json(grupos);
    } catch (error) {
      console.error('Erro ao listar grupos de opcionais:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar grupo por ID
  async buscarGrupoPorId(req, res) {
    try {
      const { idgrupo_opcional } = req.params;
      const grupo = await grupoOpcionalModel.getById(idgrupo_opcional);
      
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }
      
      res.json(grupo);
    } catch (error) {
      console.error('Erro ao buscar grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Cadastrar novo grupo
  async inserirGrupo(req, res) {
    try {
      const { nome, descricao, posicao } = req.body;
      
      if (!nome || nome.trim() === '') {
        return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
      }
      
      const idgrupo = await grupoOpcionalModel.cadastrarGrupo({
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        posicao: parseInt(posicao) || 0
      });
      
      res.status(201).json({ 
        message: 'Grupo cadastrado com sucesso',
        idgrupo_opcional: idgrupo
      });
    } catch (error) {
      console.error('Erro ao cadastrar grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Atualizar grupo
  async atualizarGrupo(req, res) {
    try {
      const { idgrupo_opcional } = req.params;
      const { nome, descricao, posicao } = req.body;
      
      if (!nome || nome.trim() === '') {
        return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
      }
      
      const sucesso = await grupoOpcionalModel.atualizarGrupo(idgrupo_opcional, {
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        posicao: parseInt(posicao) || 0
      });
      
      if (!sucesso) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }
      
      res.json({ message: 'Grupo atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Deletar grupo
  async deletarGrupo(req, res) {
    try {
      const { idgrupo_opcional } = req.params;
      
      const sucesso = await grupoOpcionalModel.deletarGrupo(idgrupo_opcional);
      
      if (!sucesso) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }
      
      res.json({ message: 'Grupo deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar opcionais de um grupo
  async getOpcionaisByGrupo(req, res) {
    try {
      const { idgrupo_opcional } = req.params;
      const opcionais = await grupoOpcionalModel.getOpcionaisByGrupo(idgrupo_opcional);
      res.json(opcionais);
    } catch (error) {
      console.error('Erro ao buscar opcionais do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new GrupoOpcionalController();
