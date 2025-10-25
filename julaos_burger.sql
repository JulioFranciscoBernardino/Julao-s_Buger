-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 31/08/2025 às 21:50
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `julaos_burger`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `categoria`
--

CREATE TABLE `categoria` (
  `idcategoria` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `excluido` tinyint(1) NOT NULL DEFAULT 0,
  `posicao` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `categoria`
--

INSERT INTO `categoria` (`idcategoria`, `nome`, `ativo`, `excluido`, `posicao`) VALUES
(1, 'CLASSICOS 140G', 1, 0, 1),
(2, 'CLASSICOS C/ BACON', 1, 0, 2);

-- --------------------------------------------------------

--
-- Estrutura para tabela `opcional`
--

CREATE TABLE `opcional` (
  `idopcional` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `tipo` enum('adicionar','remover') NOT NULL,
  `preco` decimal(10,2) DEFAULT 0.00,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `excluido` tinyint(1) NOT NULL DEFAULT 0,
  `posicao` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `forma_pagamento`
--

CREATE TABLE `forma_pagamento` (
  `idforma_pagamento` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `forma_pagamento`
--

INSERT INTO `forma_pagamento` (`idforma_pagamento`, `nome`, `ativo`) VALUES
(1, 'Dinheiro', 1),
(2, 'PIX', 1),
(3, 'Cartão de Débito', 1),
(4, 'Cartão de Crédito', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedido`
--

CREATE TABLE `pedido` (
  `idpedido` int(11) NOT NULL,
  `idusuario` int(11) NOT NULL,
  `idforma_pagamento` int(11) DEFAULT NULL,
  `data_pedido` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `excluido` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedidoproduto`
--

CREATE TABLE `pedidoproduto` (
  `idpedidoproduto` int(11) NOT NULL,
  `idpedido` int(11) NOT NULL,
  `idproduto` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedidoprodutoopcional`
--

CREATE TABLE `pedidoprodutoopcional` (
  `idpedidoproduto` int(11) NOT NULL,
  `idopcional` int(11) NOT NULL,
  `quantidade` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `produto`
--

CREATE TABLE `produto` (
  `idproduto` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `preco` decimal(10,2) NOT NULL,
  `imagem` varchar(500) DEFAULT NULL,
  `idcategoria` int(11) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `excluido` tinyint(1) NOT NULL DEFAULT 0,
  `posicao` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `produto`
--

INSERT INTO `produto` (`idproduto`, `nome`, `descricao`, `preco`, `imagem`, `idcategoria`, `ativo`, `excluido`, `posicao`) VALUES
(6, 'CHEESE BURGER 140G', 'BURGER 100% CARNE BOVINA ARTESANAL SELECIONADA 140G, QUEIJO DERRETIDO, CEBOLA, PICLES,\r\nMOSTARDA, KETCHUP, MOLHO CLASSICO JULÃOS, PÃO BURGER MACIO.', 28.90, '/imgs/1752670734881.jpg', 1, 1, 0, 3),
(7, 'CHEESE SALADA 140G', 'BURGER 100% CARNE BOVINA ARTESANAL SELECIONADA 140G, QUEIJO DERRETIDO, ALFACE\r\nSELECIONADA, TOMATE RODELAS, MOLHO CLASSICO JULÃOS, PICLES, CEBOLA ROXA, PÃO BURGER\r\nMACIO.', 28.90, '/imgs/1752670791530.jpg', 1, 1, 0, 2),
(8, 'KING STAR`S', 'BURGER 100% CARNE BOVINA ARTESANAL SELECIONADA 140G, QUEIJO DERRETIDO, ALFACE\r\nSELECIONADA, TOMATE RODELA, MOLHO CLASSICO JULÃOS, CEBOLA, PICLE, MOSTARDA, KETCHUP,\r\nPÃO PARMESÃO MACIO.', 29.90, '/imgs/1752670982240.jpg', 1, 0, 1, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtoopcional`
--

CREATE TABLE `produtoopcional` (
  `idproduto` int(11) NOT NULL,
  `idopcional` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `idusuario` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo` varchar(10) NOT NULL,
  `pontos` int(11) DEFAULT 0,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `excluido` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario`
--

INSERT INTO `usuario` (`idusuario`, `nome`, `email`, `senha`, `tipo`, `pontos`, `ativo`, `excluido`) VALUES
(1, 'Julio', 'julio@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$gd/zqW+4JqIk66BgS7UJ7g$WAg4/m2PvXX5yEk/MEPU9ACZ8+Dengy3y2eVbruJmA4', 'admin', 0, 1, 0);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `categoria`
--
ALTER TABLE `categoria`
  ADD PRIMARY KEY (`idcategoria`);

--
-- Índices de tabela `opcional`
--
ALTER TABLE `opcional`
  ADD PRIMARY KEY (`idopcional`);

--
-- Índices de tabela `forma_pagamento`
--
ALTER TABLE `forma_pagamento`
  ADD PRIMARY KEY (`idforma_pagamento`);

--
-- Índices de tabela `pedido`
--
ALTER TABLE `pedido`
  ADD PRIMARY KEY (`idpedido`),
  ADD KEY `fk_pedido_usuario` (`idusuario`),
  ADD KEY `fk_pedido_forma_pagamento` (`idforma_pagamento`);

--
-- Índices de tabela `pedidoproduto`
--
ALTER TABLE `pedidoproduto`
  ADD PRIMARY KEY (`idpedidoproduto`),
  ADD KEY `fk_pp_pedido` (`idpedido`),
  ADD KEY `fk_pp_produto` (`idproduto`);

--
-- Índices de tabela `pedidoprodutoopcional`
--
ALTER TABLE `pedidoprodutoopcional`
  ADD PRIMARY KEY (`idpedidoproduto`,`idopcional`),
  ADD KEY `fk_pedprodop_opcional` (`idopcional`);

--
-- Índices de tabela `produto`
--
ALTER TABLE `produto`
  ADD PRIMARY KEY (`idproduto`),
  ADD KEY `fk_produto_categoria` (`idcategoria`);

--
-- Índices de tabela `produtoopcional`
--
ALTER TABLE `produtoopcional`
  ADD PRIMARY KEY (`idproduto`,`idopcional`),
  ADD KEY `fk_prodop_opcional` (`idopcional`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`idusuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `categoria`
--
ALTER TABLE `categoria`
  MODIFY `idcategoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `opcional`
--
ALTER TABLE `opcional`
  MODIFY `idopcional` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `forma_pagamento`
--
ALTER TABLE `forma_pagamento`
  MODIFY `idforma_pagamento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `pedido`
--
ALTER TABLE `pedido`
  MODIFY `idpedido` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pedidoproduto`
--
ALTER TABLE `pedidoproduto`
  MODIFY `idpedidoproduto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `produto`
--
ALTER TABLE `produto`
  MODIFY `idproduto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `idusuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `pedido`
--
ALTER TABLE `pedido`
  ADD CONSTRAINT `fk_pedido_usuario` FOREIGN KEY (`idusuario`) REFERENCES `usuario` (`idusuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pedido_forma_pagamento` FOREIGN KEY (`idforma_pagamento`) REFERENCES `forma_pagamento` (`idforma_pagamento`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `pedidoproduto`
--
ALTER TABLE `pedidoproduto`
  ADD CONSTRAINT `fk_pp_pedido` FOREIGN KEY (`idpedido`) REFERENCES `pedido` (`idpedido`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pp_produto` FOREIGN KEY (`idproduto`) REFERENCES `produto` (`idproduto`) ON DELETE CASCADE;

--
-- Restrições para tabelas `pedidoprodutoopcional`
--
ALTER TABLE `pedidoprodutoopcional`
  ADD CONSTRAINT `fk_pedprodop_opcional` FOREIGN KEY (`idopcional`) REFERENCES `opcional` (`idopcional`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pedprodop_pp` FOREIGN KEY (`idpedidoproduto`) REFERENCES `pedidoproduto` (`idpedidoproduto`) ON DELETE CASCADE;

--
-- Restrições para tabelas `produto`
--
ALTER TABLE `produto`
  ADD CONSTRAINT `fk_produto_categoria` FOREIGN KEY (`idcategoria`) REFERENCES `categoria` (`idcategoria`) ON DELETE CASCADE;

--
-- Restrições para tabelas `produtoopcional`
--
ALTER TABLE `produtoopcional`
  ADD CONSTRAINT `fk_prodop_opcional` FOREIGN KEY (`idopcional`) REFERENCES `opcional` (`idopcional`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_prodop_produto` FOREIGN KEY (`idproduto`) REFERENCES `produto` (`idproduto`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
