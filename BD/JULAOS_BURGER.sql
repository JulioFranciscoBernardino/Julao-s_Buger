CREATE DATABASE JULAOS_BURGER;

show databases;

USE JULAOS_BURGER;

CREATE TABLE Usuario (
    cpf CHAR(11) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'funcionario', 'cliente') NOT NULL,
    pontos INT DEFAULT 0
);

CREATE TABLE Endereco (
    idendereco INT AUTO_INCREMENT PRIMARY KEY,
    cpf CHAR(11),
    endereco VARCHAR(255) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    cep CHAR(8) NOT NULL,
    FOREIGN KEY (cpf) REFERENCES Usuario(cpf)
)

CREATE TABLE Categoria (
    idcategoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE Produto (
    idproduto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    idcategoria INT,
    FOREIGN KEY (idcategoria) REFERENCES Categoria(idcategoria)
);

CREATE TABLE Pedido (
    idpedido INT AUTO_INCREMENT PRIMARY KEY,
    cpf CHAR(11) NOT NULL,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pendente', 'em preparo', 'finalizado') NOT NULL,
	idendereco INT,
    FOREIGN KEY (cpf) REFERENCES Usuario(cpf),
    FOREIGN KEY (idendereco) REFERENCES Endereco(idendereco)
);

CREATE TABLE PedidoProduto (
    idpedidoproduto INT AUTO_INCREMENT PRIMARY KEY,
    idpedido INT NOT NULL,
    idproduto INT NOT NULL,
    quantidade INT NOT NULL,
    FOREIGN KEY (idpedido) REFERENCES Pedido(idpedido),
    FOREIGN KEY (idproduto) REFERENCES Produto(idproduto)
);
