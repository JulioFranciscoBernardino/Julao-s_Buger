-- Dados de exemplo para testar a funcionalidade de opcionais
-- Execute estes comandos no seu banco de dados MySQL

-- Inserir opcionais de exemplo
INSERT INTO opcional (nome, tipo, preco, ativo, excluido, posicao) VALUES
('Bacon Extra', 'adicionar', 3.50, 1, 0, 1),
('Queijo Extra', 'adicionar', 2.00, 1, 0, 2),
('Cebola Caramelizada', 'adicionar', 1.50, 1, 0, 3),
('Molho Barbecue', 'adicionar', 1.00, 1, 0, 4),
('Sem Cebola', 'remover', 0.00, 1, 0, 5),
('Sem Picles', 'remover', 0.00, 1, 0, 6),
('Sem Tomate', 'remover', 0.00, 1, 0, 7),
('Pão Sem Glúten', 'adicionar', 2.50, 1, 0, 8),
('Cebola Roxa', 'adicionar', 1.00, 1, 0, 9),
('Molho Especial', 'adicionar', 1.50, 1, 0, 10),
('Ao Ponto (Rosado ao Meio)', 'adicionar', 0.00, 1, 0, 11),
('Ao Ponto Mais (Levemente Rosado)', 'adicionar', 0.00, 1, 0, 12),
('Bem Passado (Sem Rosado)', 'adicionar', 0.00, 1, 0, 13);

-- Associar alguns opcionais aos produtos existentes
INSERT INTO produtoopcional (idproduto, idopcional) VALUES
(6, 1), -- Bacon Extra no Cheese Burger
(6, 2), -- Queijo Extra no Cheese Burger
(6, 5), -- Sem Cebola no Cheese Burger
(6, 6), -- Sem Picles no Cheese Burger
(7, 3), -- Cebola Caramelizada no Cheese Salada
(7, 4), -- Molho Barbecue no Cheese Salada
(7, 5), -- Sem Cebola no Cheese Salada
(7, 7), -- Sem Tomate no Cheese Salada
(8, 1), -- Bacon Extra no King Star's
(8, 8), -- Pão Sem Glúten no King Star's
(8, 9), -- Cebola Roxa no King Star's
(8, 10), -- Molho Especial no King Star's
(6, 11), -- Ao Ponto no Cheese Burger
(6, 12), -- Ao Ponto Mais no Cheese Burger
(6, 13), -- Bem Passado no Cheese Burger
(7, 11), -- Ao Ponto no Cheese Salada
(7, 12), -- Ao Ponto Mais no Cheese Salada
(7, 13); -- Bem Passado no Cheese Salada
