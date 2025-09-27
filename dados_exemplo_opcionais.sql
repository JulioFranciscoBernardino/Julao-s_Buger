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
('Molho Especial', 'adicionar', 1.50, 1, 0, 10);

-- Associar alguns opcionais aos produtos existentes (opcional)
-- INSERT INTO produtoopcional (idproduto, idopcional) VALUES
-- (6, 1), -- Bacon Extra no Cheese Burger
-- (6, 2), -- Queijo Extra no Cheese Burger
-- (7, 3), -- Cebola Caramelizada no Cheese Salada
-- (7, 4); -- Molho Barbecue no Cheese Salada
