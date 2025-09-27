-- Script para criar sistema de grupos de opcionais
-- Execute este script no seu banco de dados

-- 1. Criar tabela de grupos de opcionais
CREATE TABLE `grupo_opcional` (
  `idgrupo_opcional` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `descricao` text,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `excluido` tinyint(1) NOT NULL DEFAULT 0,
  `posicao` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idgrupo_opcional`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Adicionar coluna idgrupo_opcional na tabela opcional
ALTER TABLE `opcional` 
ADD COLUMN `idgrupo_opcional` int(11) DEFAULT NULL AFTER `posicao`,
ADD KEY `fk_opcional_grupo` (`idgrupo_opcional`),
ADD CONSTRAINT `fk_opcional_grupo` FOREIGN KEY (`idgrupo_opcional`) REFERENCES `grupo_opcional` (`idgrupo_opcional`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Inserir grupos de exemplo
INSERT INTO `grupo_opcional` (`nome`, `descricao`, `posicao`) VALUES
('Bebidas', 'Refrigerantes, sucos e bebidas em geral', 1),
('Acompanhamentos', 'Batata frita, onion rings, etc.', 2),
('Molhos', 'Ketchup, mostarda, maionese, etc.', 3),
('Extras', 'Bacon extra, queijo extra, etc.', 4);

-- 4. Atualizar opcionais existentes para o grupo de Bebidas (assumindo que são bebidas)
UPDATE `opcional` SET `idgrupo_opcional` = 1 WHERE `nome` LIKE '%COCA%' OR `nome` LIKE '%GUARANA%' OR `nome` LIKE '%FANTA%' OR `nome` LIKE '%SPRITE%' OR `nome` LIKE '%H2O%' OR `nome` LIKE '%SCHWEPPS%';

-- 5. Criar índices para melhor performance
CREATE INDEX `idx_grupo_opcional_ativo` ON `grupo_opcional` (`ativo`, `excluido`);
CREATE INDEX `idx_opcional_grupo_ativo` ON `opcional` (`idgrupo_opcional`, `ativo`, `excluido`);
