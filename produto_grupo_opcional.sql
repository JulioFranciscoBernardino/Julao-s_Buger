-- Script para modificar a lógica de opcionais para grupos
-- Execute este script no seu banco de dados

-- 1. Criar tabela para relacionar produtos com grupos de opcionais
CREATE TABLE `produto_grupo_opcional` (
  `idproduto` int(11) NOT NULL,
  `idgrupo_opcional` int(11) NOT NULL,
  `obrigatorio` tinyint(1) NOT NULL DEFAULT 0,
  `maximo_escolhas` int(11) DEFAULT NULL,
  `minimo_escolhas` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idproduto`, `idgrupo_opcional`),
  KEY `fk_produto_grupo_produto` (`idproduto`),
  KEY `fk_produto_grupo_grupo` (`idgrupo_opcional`),
  CONSTRAINT `fk_produto_grupo_produto` FOREIGN KEY (`idproduto`) REFERENCES `produto` (`idproduto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_produto_grupo_grupo` FOREIGN KEY (`idgrupo_opcional`) REFERENCES `grupo_opcional` (`idgrupo_opcional`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Migrar dados existentes (se houver)
-- Assumindo que você quer manter os opcionais existentes atrelados aos produtos
-- Vamos criar grupos para os opcionais existentes e migrar os relacionamentos

-- Primeiro, vamos verificar se existem relacionamentos na tabela produtoopcional
-- e criar grupos baseados nos opcionais existentes

-- 3. Adicionar colunas para controlar o comportamento do grupo no produto
ALTER TABLE `produto_grupo_opcional` 
ADD COLUMN `nome_exibicao` varchar(100) DEFAULT NULL COMMENT 'Nome personalizado para exibição no produto',
ADD COLUMN `instrucoes` text DEFAULT NULL COMMENT 'Instruções específicas para este grupo neste produto';

-- 4. Criar índices para melhor performance
CREATE INDEX `idx_produto_grupo_obrigatorio` ON `produto_grupo_opcional` (`obrigatorio`);
CREATE INDEX `idx_produto_grupo_maximo` ON `produto_grupo_opcional` (`maximo_escolhas`);

-- 5. Inserir alguns exemplos de relacionamentos
-- (Execute apenas se quiser dados de exemplo)
-- INSERT INTO `produto_grupo_opcional` (`idproduto`, `idgrupo_opcional`, `obrigatorio`, `maximo_escolhas`, `minimo_escolhas`) VALUES
-- (1, 1, 0, 1, 0), -- Produto 1 com grupo Bebidas (opcional, máximo 1)
-- (1, 2, 0, 2, 0), -- Produto 1 com grupo Acompanhamentos (opcional, máximo 2)
-- (2, 1, 1, 1, 1); -- Produto 2 com grupo Bebidas (obrigatório, exatamente 1)
