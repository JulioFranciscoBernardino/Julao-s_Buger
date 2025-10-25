-- ============================================
-- TABELA: forma_pagamento
-- Descrição: Armazena as formas de pagamento disponíveis
-- ============================================

CREATE TABLE IF NOT EXISTS `forma_pagamento` (
  `idforma_pagamento` INT(11) NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL COMMENT 'Dinheiro, Débito, Crédito, PIX, etc',
  `ativo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`idforma_pagamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Inserir formas de pagamento padrão
INSERT INTO `forma_pagamento` (`nome`) VALUES
('Dinheiro'),
('PIX'),
('Cartão de Débito'),
('Cartão de Crédito');

-- ============================================
-- ALTERAÇÃO: Tabela pedido
-- Adicionar coluna idforma_pagamento
-- ============================================

ALTER TABLE `pedido` 
ADD COLUMN `idforma_pagamento` INT(11) DEFAULT NULL COMMENT 'FK para forma_pagamento',
ADD KEY `fk_pedido_forma_pagamento` (`idforma_pagamento`),
ADD CONSTRAINT `fk_pedido_forma_pagamento` FOREIGN KEY (`idforma_pagamento`) 
    REFERENCES `forma_pagamento` (`idforma_pagamento`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE; 