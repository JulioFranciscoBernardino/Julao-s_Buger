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
  },

  verificarStatusAtual: async (req, res) => {
    try {
      // Obter data/hora atual no fuso de Brasília (UTC-3)
      const agora = new Date();
      const utc = agora.getTime() + (agora.getTimezoneOffset() * 60000);
      const brasilia = new Date(utc + (-3 * 3600000)); // UTC-3
      
      // Obter dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
      // Converter para formato do banco (1=Segunda, 2=Terça, ..., 7=Domingo)
      let diaSemana = brasilia.getDay();
      if (diaSemana === 0) {
        diaSemana = 7; // Domingo
      }
      
      // Obter horário atual (HH:MM:SS)
      const horaAtual = brasilia.getHours();
      const minutoAtual = brasilia.getMinutes();
      const segundoAtual = brasilia.getSeconds();
      const horaAtualFormatada = `${String(horaAtual).padStart(2, '0')}:${String(minutoAtual).padStart(2, '0')}:${String(segundoAtual).padStart(2, '0')}`;
      
      // Buscar horário do dia atual
      const horario = await HorarioFuncionamento.getByDiaSemana(diaSemana);
      
      if (!horario) {
        return res.json({ 
          aberto: false, 
          mensagem: 'Horário não configurado para este dia' 
        });
      }
      
      // Verificar se está ativo
      if (!horario.ativo) {
        return res.json({ 
          aberto: false, 
          mensagem: 'Estabelecimento fechado hoje' 
        });
      }
      
      // Converter horários para comparar
      const [horaInicio, minutoInicio] = horario.horario_inicio.split(':').map(Number);
      const [horaFim, minutoFim] = horario.horario_fim.split(':').map(Number);
      
      const horaAtualMinutos = horaAtual * 60 + minutoAtual;
      const horaInicioMinutos = horaInicio * 60 + minutoInicio;
      const horaFimMinutos = horaFim * 60 + minutoFim;
      
      // Verificar se está dentro do horário de funcionamento
      const aberto = horaAtualMinutos >= horaInicioMinutos && horaAtualMinutos < horaFimMinutos;
      
      if (aberto) {
        return res.json({ 
          aberto: true, 
          mensagem: 'Estabelecimento aberto',
          horarioAbertura: horario.horario_inicio,
          horarioFechamento: horario.horario_fim
        });
      } else {
        return res.json({ 
          aberto: false, 
          mensagem: horaAtualMinutos < horaInicioMinutos 
            ? `Abre às ${horario.horario_inicio.substring(0, 5)}`
            : `Fechou às ${horario.horario_fim.substring(0, 5)}`,
          horarioAbertura: horario.horario_inicio,
          horarioFechamento: horario.horario_fim
        });
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
      res.status(500).json({ error: 'Erro ao verificar status de funcionamento' });
    }
  }
};

module.exports = horarioFuncionamentoController;

