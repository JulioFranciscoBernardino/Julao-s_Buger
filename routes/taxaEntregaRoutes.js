const express = require('express');
const router = express.Router();
const taxaEntregaController = require('../controller/taxaEntregaController');
const auth = require('../middleware/auth');

router.get('/', taxaEntregaController.listarPublico);
router.get('/admin', auth.authJWT, auth.authAdmin, taxaEntregaController.listarAdmin);
router.post('/', auth.authJWT, auth.authAdmin, taxaEntregaController.criar);
router.put('/:idtaxa', auth.authJWT, auth.authAdmin, taxaEntregaController.atualizar);
router.delete('/:idtaxa', auth.authJWT, auth.authAdmin, taxaEntregaController.excluir);

module.exports = router;

