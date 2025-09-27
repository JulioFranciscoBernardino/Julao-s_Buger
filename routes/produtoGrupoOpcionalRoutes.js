const express = require('express');
const router = express.Router();
const produtoGrupoOpcionalController = require('../controller/produtoGrupoOpcionalController');

// Buscar grupos de opcionais de um produto
router.get('/produto/:idproduto', produtoGrupoOpcionalController.getGruposByProduto);

// Adicionar grupo de opcionais a um produto
router.post('/produto/:idproduto', produtoGrupoOpcionalController.adicionarGrupoAoProduto);

// Remover grupo de opcionais de um produto
router.delete('/produto/:idproduto/grupo/:idgrupo_opcional', produtoGrupoOpcionalController.removerGrupoDoProduto);

// Atualizar configurações do grupo no produto
router.put('/produto/:idproduto/grupo/:idgrupo_opcional', produtoGrupoOpcionalController.atualizarGrupoNoProduto);

// Buscar produtos que usam um grupo de opcionais
router.get('/grupo/:idgrupo_opcional/produtos', produtoGrupoOpcionalController.getProdutosByGrupo);

// Buscar grupos disponíveis para adicionar a um produto
router.get('/produto/:idproduto/disponiveis', produtoGrupoOpcionalController.getGruposDisponiveisParaProduto);

// Buscar opcionais de um grupo específico de um produto
router.get('/produto/:idproduto/grupo/:idgrupo_opcional/opcionais', produtoGrupoOpcionalController.getOpcionaisDoGrupoNoProduto);

module.exports = router;
