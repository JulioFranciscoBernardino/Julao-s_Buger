const express = require('express');
const router = express.Router();
const grupoOpcionalController = require('../controller/grupoOpcionalController');

// Listar todos os grupos de opcionais
router.get('/', grupoOpcionalController.listarGrupos);

// Buscar grupo por ID
router.get('/:idgrupo_opcional', grupoOpcionalController.buscarGrupoPorId);

// Cadastrar novo grupo
router.post('/', grupoOpcionalController.inserirGrupo);

// Atualizar grupo
router.put('/atualizar/:idgrupo_opcional', grupoOpcionalController.atualizarGrupo);

// Deletar grupo
router.delete('/deletar/:idgrupo_opcional', grupoOpcionalController.deletarGrupo);

// Buscar opcionais de um grupo
router.get('/:idgrupo_opcional/opcionais', grupoOpcionalController.getOpcionaisByGrupo);

module.exports = router;
