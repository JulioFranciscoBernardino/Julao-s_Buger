const db = require('../config/bd');

class FormaPagamentoController {
    // Listar todas as formas de pagamento ativas
    static async listar(req, res) {
        try {
            const query = `SELECT * FROM forma_pagamento WHERE ativo = 1 ORDER BY idforma_pagamento ASC`;
            const [formas] = await db.execute(query);
            res.json(formas);
        } catch (error) {
            console.error('Erro ao listar formas de pagamento:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    // Buscar forma de pagamento por ID
    static async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            const query = `SELECT * FROM forma_pagamento WHERE idforma_pagamento = ?`;
            const [formas] = await db.execute(query, [id]);
            
            if (formas.length === 0) {
                return res.status(404).json({ erro: 'Forma de pagamento não encontrada' });
            }
            
            res.json(formas[0]);
        } catch (error) {
            console.error('Erro ao buscar forma de pagamento:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }
}

module.exports = FormaPagamentoController; 