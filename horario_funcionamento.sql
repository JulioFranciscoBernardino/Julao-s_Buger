-- Configurar timezone para Brasília (UTC-3)
SET time_zone = '-03:00';

-- Tabela para horário de funcionamento da loja
-- NOTA: Todos os horários são considerados no fuso horário de Brasília, Brasil (UTC-3)
CREATE TABLE IF NOT EXISTS `horario_funcionamento` (
  `idhorario` int(11) NOT NULL AUTO_INCREMENT,
  `dia_semana` tinyint(1) NOT NULL COMMENT '1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado, 7=Domingo',
  `horario_inicio` time NOT NULL COMMENT 'Horário de início no fuso de Brasília (UTC-3)',
  `horario_fim` time NOT NULL COMMENT 'Horário de fim no fuso de Brasília (UTC-3)',
  `ativo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=Aberto, 0=Fechado',
  PRIMARY KEY (`idhorario`),
  UNIQUE KEY `dia_semana` (`dia_semana`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Inserir horários padrão (todos fechados inicialmente)
INSERT INTO `horario_funcionamento` (`dia_semana`, `horario_inicio`, `horario_fim`, `ativo`) VALUES
(1, '17:00:00', '22:00:00', 0), -- Segunda
(2, '17:00:00', '22:00:00', 0), -- Terça
(3, '17:00:00', '22:00:00', 0), -- Quarta
(4, '17:00:00', '22:00:00', 0), -- Quinta
(5, '17:00:00', '22:00:00', 0), -- Sexta
(6, '17:00:00', '22:00:00', 0), -- Sábado
(7, '17:00:00', '22:00:00', 0); -- Domingo

