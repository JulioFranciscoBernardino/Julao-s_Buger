CREATE TABLE Usuario (
    cpf CHAR(11) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(10) CHECK (tipo IN ('cliente')) NOT NULL,
    pontos INT DEFAULT 0
);

CREATE TABLE Funcionario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('admin', 'funcionario')) NOT NULL
);

CREATE TABLE Endereco (
    idendereco SERIAL PRIMARY KEY,
    cpf CHAR(11) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    cep CHAR(8) NOT NULL,
    FOREIGN KEY (cpf) REFERENCES Usuario(cpf) ON DELETE CASCADE
);

CREATE TABLE Categoria (
    idcategoria SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE Produto (
    idproduto SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    imagem VARCHAR(500), -- URL da imagem do produto
    idcategoria INT NOT NULL,
    FOREIGN KEY (idcategoria) REFERENCES Categoria(idcategoria) ON DELETE CASCADE
);

CREATE TABLE Pedido (
    idpedido SERIAL PRIMARY KEY,
    cpf CHAR(11) NOT NULL,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('pendente', 'em preparo', 'finalizado')) NOT NULL,
    idendereco INT NOT NULL,
    FOREIGN KEY (cpf) REFERENCES Usuario(cpf) ON DELETE CASCADE,
    FOREIGN KEY (idendereco) REFERENCES Endereco(idendereco) ON DELETE SET NULL
);

CREATE TABLE PedidoProduto (
    idpedidoproduto SERIAL PRIMARY KEY,
    idpedido INT NOT NULL,
    idproduto INT NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    FOREIGN KEY (idpedido) REFERENCES Pedido(idpedido) ON DELETE CASCADE,
    FOREIGN KEY (idproduto) REFERENCES Produto(idproduto) ON DELETE CASCADE
);


