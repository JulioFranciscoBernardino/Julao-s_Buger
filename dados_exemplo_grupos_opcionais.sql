-- Dados de exemplo para grupos de opcionais
-- Execute estes comandos no seu banco de dados MySQL

-- 1. Primeiro, execute os scripts de criação das tabelas:
-- - grupos_opcionais.sql
-- - produto_grupo_opcional.sql

-- 2. Inserir grupos de opcionais
INSERT INTO grupo_opcional (nome, descricao, posicao) VALUES
('Ponto da Carne', 'Escolha o ponto de cozimento da carne', 1),
('Extras', 'Ingredientes adicionais para o seu burger', 2),
('Remover', 'Ingredientes que podem ser removidos', 3),
('Molhos', 'Molhos e temperos especiais', 4);

-- 3. Inserir opcionais e associá-los aos grupos
INSERT INTO opcional (nome, tipo, preco, ativo, excluido, posicao, idgrupo_opcional) VALUES
-- Grupo: Ponto da Carne
('Ao Ponto (Rosado ao Meio)', 'adicionar', 0.00, 1, 0, 1, 1),
('Ao Ponto Mais (Levemente Rosado)', 'adicionar', 0.00, 1, 0, 2, 1),
('Bem Passado (Sem Rosado)', 'adicionar', 0.00, 1, 0, 3, 1),

-- Grupo: Extras
('Bacon Extra', 'adicionar', 3.50, 1, 0, 1, 2),
('Queijo Extra', 'adicionar', 2.00, 1, 0, 2, 2),
('Cebola Caramelizada', 'adicionar', 1.50, 1, 0, 3, 2),
('Pão Sem Glúten', 'adicionar', 2.50, 1, 0, 4, 2),

-- Grupo: Remover
('Sem Cebola', 'remover', 0.00, 1, 0, 1, 3),
('Sem Picles', 'remover', 0.00, 1, 0, 2, 3),
('Sem Tomate', 'remover', 0.00, 1, 0, 3, 3),
('Sem Alface', 'remover', 0.00, 1, 0, 4, 3),

-- Grupo: Molhos
('Molho Barbecue', 'adicionar', 1.00, 1, 0, 1, 4),
('Molho Especial', 'adicionar', 1.50, 1, 0, 2, 4),
('Molho Picante', 'adicionar', 1.00, 1, 0, 3, 4),
('Maionese Artesanal', 'adicionar', 1.20, 1, 0, 4, 4);

-- 4. Adicionar grupo de Bebidas para testar
INSERT INTO grupo_opcional (nome, descricao, posicao) VALUES
('Bebidas', 'Refrigerantes e bebidas em geral', 5);

-- 5. Inserir opcionais de bebidas
INSERT INTO opcional (nome, tipo, preco, ativo, excluido, posicao, idgrupo_opcional) VALUES
-- Grupo: Bebidas (ID: 5)
('Coca-Cola 350ml', 'adicionar', 4.50, 1, 0, 1, 5),
('Fanta 350ml', 'adicionar', 4.50, 1, 0, 2, 5),
('Guaraná 350ml', 'adicionar', 4.50, 1, 0, 3, 5);

-- 6. Associar grupos aos produtos existentes
INSERT INTO produto_grupo_opcional (idproduto, idgrupo_opcional, obrigatorio, maximo_escolhas, minimo_escolhas, nome_exibicao, instrucoes) VALUES
-- Cheese Burger (ID: 6)
(6, 1, 1, 1, 1, 'PONTO DA CARNE', 'Escolha 1 opção'),
(6, 2, 0, 3, 0, 'Adicionar Extras', 'Escolha até 3 ingredientes'),
(6, 3, 0, 4, 0, 'Remover Ingredientes', 'Remova os ingredientes que não deseja'),
(6, 4, 1, 2, 1, 'Molhos Especiais', 'Escolha pelo menos 1 molho (até 2)'),
(6, 5, 0, 1, 0, 'BEBIDAS', 'Escolha 1 bebida'),

-- Cheese Salada (ID: 7)
(7, 1, 1, 1, 1, 'PONTO DA CARNE', 'Escolha 1 opção'),
(7, 2, 0, 2, 0, 'Adicionar Extras', 'Escolha até 2 ingredientes'),
(7, 3, 0, 3, 0, 'Remover Ingredientes', 'Remova os ingredientes que não deseja'),
(7, 4, 1, 1, 1, 'Molhos Especiais', 'Escolha 1 molho'),
(7, 5, 0, 1, 0, 'BEBIDAS', 'Escolha 1 bebida'),

-- King Star's (ID: 8)
(8, 1, 1, 1, 1, 'PONTO DA CARNE', 'Escolha 1 opção'),
(8, 2, 0, 4, 0, 'Adicionar Extras', 'Escolha até 4 ingredientes'),
(8, 3, 0, 2, 0, 'Remover Ingredientes', 'Remova os ingredientes que não deseja'),
(8, 4, 1, 3, 1, 'Molhos Especiais', 'Escolha pelo menos 1 molho (até 3)'),
(8, 5, 0, 1, 0, 'BEBIDAS', 'Escolha 1 bebida');
