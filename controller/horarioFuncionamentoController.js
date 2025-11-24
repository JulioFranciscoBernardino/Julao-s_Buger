const HorarioFuncionamento = require('../models/horarioFuncionamentoModel');

const horarioFuncionamentoController = {
  listarHorarios: async (req, res) => {
    try {
      const horarios = await HorarioFuncionamento.getAll();
      res.json(horarios);
    } catch (err) {
      console.error('Erro ao buscar horários');
      res.status(500).json({ error: 'Erro ao buscar horários' });
    }
  },

  buscarHorarioPorDia: async (req, res) => {
    try {
      const { diaSemana } = req.params;
      const horario = await HorarioFuncionamento.getByDiaSemana(diaSemana);
      
      if (!horario) {
        return res.status(404).json({ error: 'Horário não encontrado para este dia' });
      }
      
      res.json(horario);
    } catch (err) {
      console.error('Erro ao buscar horário');
      res.status(500).json({ error: 'Erro ao buscar horário' });
    }
  },

  criarOuAtualizarHorario: async (req, res) => {
    try {
      const { dia_semana, horario_inicio, horario_fim, ativo } = req.body;

      if (!dia_semana || !horario_inicio || !horario_fim) {
        return res.status(400).json({ error: 'Dia da semana, horário de início e fim são obrigatórios' });
      }

      if (dia_semana < 1 || dia_semana > 7) {
        return res.status(400).json({ error: 'Dia da semana deve ser entre 1 (Segunda) e 7 (Domingo)' });
      }

      const idhorario = await HorarioFuncionamento.criarOuAtualizar({
        dia_semana,
        horario_inicio,
        horario_fim,
        ativo: ativo !== undefined ? ativo : true
      });

      res.json({ 
        message: 'Horário salvo com sucesso!',
        idhorario 
      });
    } catch (error) {
      console.error('Erro ao salvar horário');
      res.status(500).json({ error: 'Erro ao salvar horário' });
    }
  },

  atualizarTodosHorarios: async (req, res) => {
    try {
      const { horarios } = req.body;

      if (!horarios || !Array.isArray(horarios)) {
        return res.status(400).json({ error: 'Lista de horários é obrigatória' });
      }

      await HorarioFuncionamento.atualizarTodos(horarios);
      res.json({ message: 'Horários atualizados com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar horários');
      res.status(500).json({ error: 'Erro ao atualizar horários' });
    }
  },

  deletarHorario: async (req, res) => {
    try {
      await HorarioFuncionamento.deletar(req.params.idhorario);
      res.json({ message: 'Horário deletado com sucesso!' });
    } catch (err) {
      console.error('Erro ao deletar horário');
      res.status(500).json({ error: 'Erro ao deletar horário' });
    }
  }
};

module.exports = horarioFuncionamentoController;

