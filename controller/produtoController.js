const Produto = require('../models/produtoModel');
const Categoria = require('../models/categoriaModel');
const SaborBebida = require('../models/saborBebidaModel');
const ProdutoGrupoOpcional = require('../models/produtoGrupoOpcionalModel');
const fs = require('fs').promises;
const path = require('path');

// Cache simples para verificação de existência de arquivos
const imagemCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function verificarImagemExiste(imagemPath) {
    const now = Date.now();
    const cached = imagemCache.get(imagemPath);
    
    // Se existe no cache e ainda é válido, retornar resultado
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return cached.exists;
    }
    
    // Verificar arquivo
    let exists = false;
    try {
        await fs.access(imagemPath);
        exists = true;
    } catch (error) {
        // Se não encontrou, tentar normalizar o caminho
        const normalizedPath = imagemPath.replace(/\\/g, '/');
        try {
            await fs.access(normalizedPath);
            exists = true;
        } catch (err) {
            exists = false;
        }
    }
    
    // Atualizar cache
    imagemCache.set(imagemPath, { timestamp: now, exists });
    
    return exists;
}

// Função para limpar cache de imagens (útil para debug)
function limparCacheImagens() {
    imagemCache.clear();
}

const produtoController = {
  listarProdutos: async (req, res) => {
    try {
      const produtos = await Produto.getAll();
      const produtosLimpos = await Promise.all(produtos.map(async (produto) => {
        if (produto.imagem) {
          if (produto.imagem.startsWith('http://') || produto.imagem.startsWith('https://')) {
            const fileName = produto.imagem.split('/').pop().split('?')[0];
            produto.imagem = `/imgs/${fileName}`;
          } else if (!produto.imagem.startsWith('/imgs/')) {
            produto.imagem = `/imgs/${produto.imagem}`;
          }
          
          // Verificar se o arquivo realmente existe (com cache)
          const imagemPath = path.join(__dirname, '..', 'public', produto.imagem);
          const existe = await verificarImagemExiste(imagemPath);
          if (!existe) {
            console.warn(`Imagem não encontrada: ${produto.imagem}`);
            produto.imagem = null;
          }
        }
        return produto;
      }));
      res.json(produtosLimpos);
    } catch (err) {
      console.error('Erro ao buscar produtos');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  listarProdutosPorCategoria: async (req, res) => {
    try {
      const { idcategoria } = req.params;
      const produtos = await Produto.getByCategoria(idcategoria);
      res.json(produtos);
    } catch (err) {
      console.error('Erro ao buscar produtos por categoria');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  inserirProduto: async (req, res) => {
    try {
      const { nome, descricao, preco, categoria } = req.body;

      let imagemUrl = null;
      if (req.file) {
        imagemUrl = `/imgs/${req.file.filename}`;
      }

      await Produto.cadastrarProduto({ 
        nome, 
        descricao, 
        preco: parseFloat(preco), 
        imagem: imagemUrl, 
        idcategoria: parseInt(categoria) 
      });
      
      res.json({ message: 'Produto cadastrado com sucesso!', imagem: imagemUrl });
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error.message);
      res.status(500).json({ error: 'Erro ao cadastrar produto' });
    }
  },

  deleteProduto: async (req, res) => {
    try {
      await Produto.deletarProduto(req.params.idproduto);
      res.json({ mensagem: 'Produto marcado como excluído com sucesso!' });
    } catch (err) {
      console.error('Erro ao excluir produto');
      res.status(500).json({ mensagem: 'Erro ao marcar produto como excluído.' });
    }
  },

  atualizarProduto: async (req, res) => {
    try {
      const { nome, descricao, preco, categoria } = req.body;
      const idproduto = req.params.idproduto;
      
      const updateData = { 
        nome, 
        descricao, 
        preco: parseFloat(preco), 
        idcategoria: parseInt(categoria) 
      };
      
      // Só adiciona imagem se um arquivo foi enviado
      if (req.file) {
        updateData.imagem = `/imgs/${req.file.filename}`;
      }

      await Produto.atualizarProduto(idproduto, updateData);
      
      res.json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error.message);
      res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  },

  buscarProdutoPorId: async (req, res) => {
    try {
      const produto = await Produto.getById(req.params.idproduto);
      
      // Garantir que a URL da imagem está formatada corretamente
      if (produto && produto.imagem) {
        if (produto.imagem.startsWith('http://') || produto.imagem.startsWith('https://')) {
          const fileName = produto.imagem.split('/').pop().split('?')[0];
          produto.imagem = `/imgs/${fileName}`;
        } else if (!produto.imagem.startsWith('/imgs/')) {
          produto.imagem = `/imgs/${produto.imagem}`;
        }
        
        // Verificar se o arquivo realmente existe (com cache)
        const imagemPath = path.join(__dirname, '..', 'public', produto.imagem);
        const existe = await verificarImagemExiste(imagemPath);
        if (!existe) {
          console.warn(`Imagem não encontrada: ${produto.imagem}`);
          produto.imagem = null;
        }
      }
      
      res.json(produto);
    } catch (err) {
      console.error('Erro ao buscar produto');
      res.status(500).json({ error: 'Erro ao buscar produto.' });
    }
  },

  reordenarProdutos: async (req, res) => {
    try {
      const { produtos } = req.body;
      
      if (!produtos || !Array.isArray(produtos)) {
        return res.status(400).json({ error: 'Lista de produtos é obrigatória' });
      }

      await Produto.reordenarProdutos(produtos);
      res.json({ message: 'Produtos reordenados com sucesso!' });
    } catch (error) {
      console.error('Erro ao reordenar produtos');
      res.status(500).json({ error: 'Erro ao reordenar produtos' });
    }
  },

  buscarOpcionaisDoProduto: async (req, res) => {
    try {
      const { idproduto } = req.params;
      const opcionais = await Produto.getOpcionaisDoProduto(idproduto);
      res.json(opcionais);
    } catch (error) {
      console.error('Erro ao buscar opcionais do produto');
      res.status(500).json({ error: 'Erro ao buscar opcionais do produto' });
    }
  },

  buscarGruposOpcionaisDoProduto: async (req, res) => {
    try {
      const { idproduto } = req.params;
      const grupos = await ProdutoGrupoOpcional.getGruposByProduto(idproduto);
      
      // Para cada grupo, buscar os opcionais
      for (let grupo of grupos) {
        grupo.opcionais = await ProdutoGrupoOpcional.getOpcionaisDoGrupoNoProduto(idproduto, grupo.idgrupo_opcional);
      }
      
      res.json(grupos);
    } catch (error) {
      console.error('Erro ao buscar grupos de opcionais do produto');
      res.status(500).json({ error: 'Erro ao buscar grupos de opcionais do produto' });
    }
  },

  atualizarDisponibilidade: async (req, res) => {
    try {
      const { idproduto } = req.params;
      const { disponivel } = req.body;
      
      await Produto.atualizarDisponibilidade(idproduto, disponivel);
      
      res.json({ message: 'Disponibilidade atualizada com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade');
      res.status(500).json({ error: 'Erro ao atualizar disponibilidade do produto' });
    }
  }

};

module.exports = produtoController;
