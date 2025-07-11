-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 11, 2025 at 06:58 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `julaos_burger`
--

-- --------------------------------------------------------

--
-- Table structure for table `categoria`
--

CREATE TABLE `categoria` (
  `idcategoria` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categoria`
--

INSERT INTO `categoria` (`idcategoria`, `nome`, `ativo`) VALUES
(1, 'CLASSICOS 140G', 1);

-- --------------------------------------------------------

--
-- Table structure for table `opcional`
--

CREATE TABLE `opcional` (
  `idopcional` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `tipo` enum('adicionar','remover') NOT NULL,
  `preco` decimal(10,2) DEFAULT 0.00,
  `ativo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pedido`
--

CREATE TABLE `pedido` (
  `idpedido` int(11) NOT NULL,
  `idusuario` int(11) NOT NULL,
  `data_pedido` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pedidoproduto`
--

CREATE TABLE `pedidoproduto` (
  `idpedidoproduto` int(11) NOT NULL,
  `idpedido` int(11) NOT NULL,
  `idproduto` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pedidoprodutoopcional`
--

CREATE TABLE `pedidoprodutoopcional` (
  `idpedidoproduto` int(11) NOT NULL,
  `idopcional` int(11) NOT NULL,
  `quantidade` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produto`
--

CREATE TABLE `produto` (
  `idproduto` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `preco` decimal(10,2) NOT NULL,
  `imagem` varchar(500) DEFAULT NULL,
  `idcategoria` int(11) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produtoopcional`
--

CREATE TABLE `produtoopcional` (
  `idproduto` int(11) NOT NULL,
  `idopcional` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `usuario`
--

CREATE TABLE `usuario` (
  `idusuario` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo` varchar(10) NOT NULL,
  `pontos` int(11) DEFAULT 0,
  `ativo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `usuario`
--

INSERT INTO `usuario` (`idusuario`, `nome`, `email`, `senha`, `tipo`, `pontos`, `ativo`) VALUES
(1, 'Julio', 'julio@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$gd/zqW+4JqIk66BgS7UJ7g$WAg4/m2PvXX5yEk/MEPU9ACZ8+Dengy3y2eVbruJmA4', 'admin', 0, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categoria`
--
ALTER TABLE `categoria`
  ADD PRIMARY KEY (`idcategoria`);

--
-- Indexes for table `opcional`
--
ALTER TABLE `opcional`
  ADD PRIMARY KEY (`idopcional`);

--
-- Indexes for table `pedido`
--
ALTER TABLE `pedido`
  ADD PRIMARY KEY (`idpedido`),
  ADD KEY `fk_pedido_usuario` (`idusuario`);

--
-- Indexes for table `pedidoproduto`
--
ALTER TABLE `pedidoproduto`
  ADD PRIMARY KEY (`idpedidoproduto`),
  ADD KEY `fk_pp_pedido` (`idpedido`),
  ADD KEY `fk_pp_produto` (`idproduto`);

--
-- Indexes for table `pedidoprodutoopcional`
--
ALTER TABLE `pedidoprodutoopcional`
  ADD PRIMARY KEY (`idpedidoproduto`,`idopcional`),
  ADD KEY `fk_pedprodop_opcional` (`idopcional`);

--
-- Indexes for table `produto`
--
ALTER TABLE `produto`
  ADD PRIMARY KEY (`idproduto`),
  ADD KEY `fk_produto_categoria` (`idcategoria`);

--
-- Indexes for table `produtoopcional`
--
ALTER TABLE `produtoopcional`
  ADD PRIMARY KEY (`idproduto`,`idopcional`),
  ADD KEY `fk_prodop_opcional` (`idopcional`);

--
-- Indexes for table `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`idusuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categoria`
--
ALTER TABLE `categoria`
  MODIFY `idcategoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `opcional`
--
ALTER TABLE `opcional`
  MODIFY `idopcional` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pedido`
--
ALTER TABLE `pedido`
  MODIFY `idpedido` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pedidoproduto`
--
ALTER TABLE `pedidoproduto`
  MODIFY `idpedidoproduto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `produto`
--
ALTER TABLE `produto`
  MODIFY `idproduto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `usuario`
--
ALTER TABLE `usuario`
  MODIFY `idusuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `pedido`
--
ALTER TABLE `pedido`
  ADD CONSTRAINT `fk_pedido_usuario` FOREIGN KEY (`idusuario`) REFERENCES `usuario` (`idusuario`) ON DELETE CASCADE;

--
-- Constraints for table `pedidoproduto`
--
ALTER TABLE `pedidoproduto`
  ADD CONSTRAINT `fk_pp_pedido` FOREIGN KEY (`idpedido`) REFERENCES `pedido` (`idpedido`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pp_produto` FOREIGN KEY (`idproduto`) REFERENCES `produto` (`idproduto`) ON DELETE CASCADE;

--
-- Constraints for table `pedidoprodutoopcional`
--
ALTER TABLE `pedidoprodutoopcional`
  ADD CONSTRAINT `fk_pedprodop_opcional` FOREIGN KEY (`idopcional`) REFERENCES `opcional` (`idopcional`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pedprodop_pp` FOREIGN KEY (`idpedidoproduto`) REFERENCES `pedidoproduto` (`idpedidoproduto`) ON DELETE CASCADE;

--
-- Constraints for table `produto`
--
ALTER TABLE `produto`
  ADD CONSTRAINT `fk_produto_categoria` FOREIGN KEY (`idcategoria`) REFERENCES `categoria` (`idcategoria`) ON DELETE CASCADE;

--
-- Constraints for table `produtoopcional`
--
ALTER TABLE `produtoopcional`
  ADD CONSTRAINT `fk_prodop_opcional` FOREIGN KEY (`idopcional`) REFERENCES `opcional` (`idopcional`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_prodop_produto` FOREIGN KEY (`idproduto`) REFERENCES `produto` (`idproduto`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
