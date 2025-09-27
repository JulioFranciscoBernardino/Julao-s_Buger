const express = require('express');
const router = express.Router();
const opcionalController = require('../controller/opcionalController');

router.get('/', opcionalController.listarOpcionais);
router.get('/:idopcional', opcionalController.buscarOpcionalPorId);
router.post('/inserir', opcionalController.inserirOpcional);
router.put('/atualizar/:idopcional', opcionalController.atualizarOpcional);
router.delete('/deletar/:idopcional', opcionalController.deletarOpcional);
router.get('/produto/:idproduto', opcionalController.getOpcionaisByProduto);
router.post('/produto/adicionar', opcionalController.adicionarOpcionalAoProduto);
router.delete('/produto/remover', opcionalController.removerOpcionalDoProduto);

module.exports = router;
