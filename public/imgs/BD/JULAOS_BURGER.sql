-- Criação do banco
CREATE DATABASE JULAOS_BURGER;
USE JULAOS_BURGER;
SHOW TABLES;

-- Desabilita as verificações temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Remove tabelas se existirem
DROP TABLE IF EXISTS PedidoProduto;
DROP TABLE IF EXISTS Pedido;
DROP TABLE IF EXISTS SaborBebida;
DROP TABLE IF EXISTS Produto;
DROP TABLE IF EXISTS Categoria;
DROP TABLE IF EXISTS Endereco;
DROP TABLE IF EXISTS Funcionario;
DROP TABLE IF EXISTS Usuario;

-- Reabilita as verificações
SET FOREIGN_KEY_CHECKS = 1;

-- Criação da tabela Usuario
CREATE TABLE Usuario (
    cpf CHAR(11) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(10) NOT NULL,
    pontos INT DEFAULT 0
);

-- Criação da tabela Funcionario
CREATE TABLE Funcionario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL
);

-- Criação da tabela Categoria
CREATE TABLE Categoria (
    idcategoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

-- Criação da tabela Endereco
CREATE TABLE Endereco (
    idendereco INT AUTO_INCREMENT PRIMARY KEY,
    cpf CHAR(11) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    cep CHAR(8) NOT NULL,
    FOREIGN KEY (cpf) REFERENCES Usuario(cpf) ON DELETE CASCADE
);

-- Criação da tabela Produto
CREATE TABLE Produto (
    idproduto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    imagem VARCHAR(500),
    idcategoria INT NOT NULL,
    FOREIGN KEY (idcategoria) REFERENCES Categoria(idcategoria) ON DELETE CASCADE
);

-- Criação da tabela SaborBebida
CREATE TABLE SaborBebida (
    idsaborbebida INT AUTO_INCREMENT PRIMARY KEY,
    idproduto INT NOT NULL,
    sabor VARCHAR(100) NOT NULL,
    FOREIGN KEY (idproduto) REFERENCES Produto(idproduto)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Criação da tabela Pedido
CREATE TABLE Pedido (
    idpedido INT AUTO_INCREMENT PRIMARY KEY,
    cpf CHAR(11) NOT NULL,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    idendereco INT NOT NULL,
    FOREIGN KEY (cpf) REFERENCES Usuario(cpf) ON DELETE CASCADE,
    FOREIGN KEY (idendereco) REFERENCES Endereco(idendereco) ON DELETE CASCADE
);

-- Criação da tabela PedidoProduto
CREATE TABLE PedidoProduto (
    idpedidoproduto INT AUTO_INCREMENT PRIMARY KEY,
    idpedido INT NOT NULL,
    idproduto INT NOT NULL,
    quantidade INT NOT NULL,
    FOREIGN KEY (idpedido) REFERENCES Pedido(idpedido) ON DELETE CASCADE,
    FOREIGN KEY (idproduto) REFERENCES Produto(idproduto) ON DELETE CASCADE
);
