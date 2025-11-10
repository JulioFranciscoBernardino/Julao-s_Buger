
CREATE DATABASE IF NOT EXISTS JULAOS_BURGER
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE JULAOS_BURGER;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS PedidoProdutoOpcional;
DROP TABLE IF EXISTS ProdutoOpcional;
DROP TABLE IF EXISTS PedidoProduto;
DROP TABLE IF EXISTS Pedido;
DROP TABLE IF EXISTS Produto;
DROP TABLE IF EXISTS Categoria;
DROP TABLE IF EXISTS Usuario;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Usuario (
  idusuario INT AUTO_INCREMENT PRIMARY KEY,
  nome      VARCHAR(255)          NOT NULL,
  email     VARCHAR(255) UNIQUE   NOT NULL,
  senha     VARCHAR(255)          NOT NULL,
  tipo      VARCHAR(10)           NOT NULL,
  pontos    INT DEFAULT 0
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE Categoria (
  idcategoria INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(255) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE Produto (
  idproduto   INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(255)  NOT NULL,
  descricao   TEXT          NOT NULL,
  preco       DECIMAL(10,2) NOT NULL,
  imagem      VARCHAR(500),
  idcategoria INT           NOT NULL,
  CONSTRAINT fk_produto_categoria
    FOREIGN KEY (idcategoria)
    REFERENCES Categoria(idcategoria)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;


CREATE TABLE Pedido (
  idpedido     INT AUTO_INCREMENT PRIMARY KEY,
  idusuario    INT           NOT NULL,
  data_pedido  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  status       VARCHAR(20)   NOT NULL,
  CONSTRAINT fk_pedido_usuario
    FOREIGN KEY (idusuario)
    REFERENCES Usuario(idusuario)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE PedidoProduto (
  idpedidoproduto INT AUTO_INCREMENT PRIMARY KEY,
  idpedido        INT NOT NULL,
  idproduto       INT NOT NULL,
  quantidade      INT NOT NULL,
  observacao      TEXT NULL,
  CONSTRAINT fk_pp_pedido
    FOREIGN KEY (idpedido)
    REFERENCES Pedido(idpedido)
    ON DELETE CASCADE,
  CONSTRAINT fk_pp_produto
    FOREIGN KEY (idproduto)
    REFERENCES Produto(idproduto)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE Opcional (
  idopcional INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(100)            NOT NULL,
  tipo       ENUM('adicionar','remover') NOT NULL,
  preco      DECIMAL(10,2) DEFAULT 0.00
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE ProdutoOpcional (
  idproduto  INT NOT NULL,
  idopcional INT NOT NULL,
  PRIMARY KEY (idproduto, idopcional),
  CONSTRAINT fk_prodop_produto
    FOREIGN KEY (idproduto)
    REFERENCES Produto(idproduto)
    ON DELETE CASCADE,
  CONSTRAINT fk_prodop_opcional
    FOREIGN KEY (idopcional)
    REFERENCES Opcional(idopcional)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE PedidoProdutoOpcional (
  idpedidoproduto INT NOT NULL,
  idopcional      INT NOT NULL,
  quantidade      INT DEFAULT 1,
  PRIMARY KEY (idpedidoproduto, idopcional),
  CONSTRAINT fk_pedprodop_pp
    FOREIGN KEY (idpedidoproduto)
    REFERENCES PedidoProduto(idpedidoproduto)
    ON DELETE CASCADE,
  CONSTRAINT fk_pedprodop_opcional
    FOREIGN KEY (idopcional)
    REFERENCES Opcional(idopcional)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

ALTER TABLE Usuario
ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE Categoria
ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE Produto
ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE Pedido
ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE Opcional
ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1;

