CREATE DATABASE JULAOS_BURGER;

USE JULAOS_BURGER; 

SET FOREIGN_KEY_CHECKS = 0;

SET FOREIGN_KEY_CHECKS = 1;

-- Derruba todas as tabelas
DROP TABLE IF EXISTS PedidoProduto;
DROP TABLE IF EXISTS Pedido;
DROP TABLE IF EXISTS Produto;
DROP TABLE IF EXISTS Categoria;
DROP TABLE IF EXISTS Endereco;
DROP TABLE IF EXISTS Funcionario;
DROP TABLE IF EXISTS Usuario;


TRUNCATE TABLE Usuario;

-- Cria a tabela Usuario
CREATE TABLE Usuario (
    cpf CHAR(11) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(10) NOT NULL, -- Removido o CHECK
    pontos INT DEFAULT 0
);

SELECT * FROM Usuario;
-- DELETE FROM Usuario;

-- Cria a tabela Funcionario
CREATE TABLE Funcionario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL 
);

SELECT * FROM Funcionario;
-- DELETE FROM Funcionario;

INSERT INTO Funcionario(nome, email, senha, tipo) VALUES ('Julio Francisco Bernardino', 'juliofranciscobernardino@gmail.com', 'julio310705', 'admin');

-- Cria a tabela Categoria
CREATE TABLE Categoria (
    idcategoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

SET SQL_SAFE_UPDATES = 0;
DELETE FROM Categoria;
ALTER TABLE Categoria AUTO_INCREMENT = 1;
SET SQL_SAFE_UPDATES = 1;

select * from categoria;

-- INSERT INTO Categoria (nome) VALUES 
-- ('CLASSICOS 140'),
-- ('CLASSICOS C/BACON 140G'),
-- ('MEGA LANCHES 140G'),
-- ('MEGA LANCHES GOURMET 140G'),
-- ('BEIRUTES'),
-- ('MEGA HOT DOGS'),
-- ('PETISCOS'), ('BEBIDAS');

-- INSERT INTO Categoria (nome) VALUES
-- ('PROMOÇÃO DOIS POR');

-- Cria a tabela Endereco
CREATE TABLE Endereco (
    idendereco INT AUTO_INCREMENT PRIMARY KEY,
    cpf CHAR(11) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    cep CHAR(8) NOT NULL,
    FOREIGN KEY (cpf) REFERENCES Usuario(cpf) ON DELETE CASCADE
);

-- Cria a tabela Produto
CREATE TABLE Produto (
    idproduto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    preco DECIMAL(10 , 2 ) NOT NULL,
    imagem VARCHAR(500),
    idcategoria INT NOT NULL,
    FOREIGN KEY (idcategoria)
        REFERENCES Categoria (idcategoria)
        ON DELETE CASCADE
);

SET SQL_SAFE_UPDATES = 0;
DELETE FROM Produto;
ALTER TABLE Produto AUTO_INCREMENT = 1;
SET SQL_SAFE_UPDATES = 1;

-- Inserção dos lanches: Las Vegas, Rock Star e Liverpool
INSERT INTO Produto (nome, descricao, preco, imagem, idcategoria) VALUES
('Beirute Americano', 'Presunto Tostado, Queijo Derretido, Cheddar, Ovo, Requeijão Cremoso, Bacon, Alface Selecionada, Tomate Rodelas, Molho Classico Julãos, Mega Pão Sirio.', 44.90, '/assets/imgs/beirute.jpg', 5);


SELECT * FROM Produto
where nome = 'Cheddar Melt 140G';

UPDATE Produto
SET imagem = '/imgs/cheddar_melt.jpg'
WHERE idproduto = 4;

-- Cria a tabela Pedido
CREATE TABLE Pedido (
    idpedido INT AUTO_INCREMENT PRIMARY KEY,
    cpf CHAR(11) NOT NULL,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL, -- Removido o CHECK
    idendereco INT NOT NULL,
    FOREIGN KEY (cpf) REFERENCES Usuario(cpf) ON DELETE CASCADE,
    FOREIGN KEY (idendereco) REFERENCES Endereco(idendereco) ON DELETE CASCADE -- Alterado para CASCADE
);

-- Cria a tabela PedidoProduto
CREATE TABLE PedidoProduto (
    idpedidoproduto INT AUTO_INCREMENT PRIMARY KEY,
    idpedido INT NOT NULL,
    idproduto INT NOT NULL,
    quantidade INT NOT NULL,
    FOREIGN KEY (idpedido) REFERENCES Pedido(idpedido) ON DELETE CASCADE,
    FOREIGN KEY (idproduto) REFERENCES Produto(idproduto) ON DELETE CASCADE
);


