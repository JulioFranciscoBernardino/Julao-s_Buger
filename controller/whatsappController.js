/**
 * Controller para gerenciar integração com WhatsApp
 */

const whatsappService = require('../services/whatsappService');

class WhatsAppController {
    /**
     * Inicializa o cliente do WhatsApp
     */
    static async inicializar(req, res) {
        try {
            await whatsappService.initialize();
            const qrCode = whatsappService.getQRCode();
            
            res.json({ 
                mensagem: 'WhatsApp inicializado com sucesso',
                qrCode: qrCode || null
            });
        } catch (error) {
            console.error('Erro ao inicializar WhatsApp:', error);
            res.status(500).json({ erro: 'Erro ao inicializar WhatsApp' });
        }
    }

    /**
     * Obtém o QR Code para autenticação
     */
    static async obterQRCode(req, res) {
        try {
            const qrCode = whatsappService.getQRCode();
            if (qrCode) {
                res.json({ qrCode: qrCode });
            } else {
                if (whatsappService.isClientReady()) {
                    res.json({ mensagem: 'WhatsApp já está conectado' });
                } else {
                    // Inicializar se ainda não foi inicializado
                    await whatsappService.initialize();
                    const novoQrCode = whatsappService.getQRCode();
                    res.json({ 
                        mensagem: 'QR Code sendo gerado, tente novamente em alguns segundos',
                        qrCode: novoQrCode || null
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao obter QR Code:', error);
            res.status(500).json({ erro: 'Erro ao obter QR Code' });
        }
    }

    /**
     * Verifica status da conexão
     */
    static async status(req, res) {
        try {
            const isReady = Boolean(whatsappService.isClientReady());
            const qrCode = whatsappService.getQRCode();
            
            // Retornar apenas dados simples, sem objetos complexos
            // Garantir que são valores primitivos
            const response = {
                conectado: isReady,
                qrCode: qrCode ? String(qrCode) : null
            };
            
            res.json(response);
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            res.status(500).json({ erro: 'Erro ao verificar status' });
        }
    }

    /**
     * Envia mensagem de teste
     */
    static async enviarTeste(req, res) {
        try {
            const { telefone, mensagem } = req.body;
            
            if (!telefone) {
                return res.status(400).json({ erro: 'Telefone é obrigatório' });
            }

            if (!whatsappService.isClientReady()) {
                return res.status(503).json({ erro: 'WhatsApp não está conectado' });
            }

            const resultado = await whatsappService.sendMessage(
                telefone, 
                mensagem || 'Mensagem de teste do Julão\'s Burger! 🍔'
            );

            res.json({ 
                mensagem: 'Mensagem enviada com sucesso',
                messageId: resultado.messageId
            });
        } catch (error) {
            console.error('Erro ao enviar mensagem de teste:', error);
            res.status(500).json({ erro: error.message || 'Erro ao enviar mensagem' });
        }
    }
}

module.exports = WhatsAppController;

