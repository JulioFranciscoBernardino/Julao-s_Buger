const CategoriaModel = require('../models/cardapioAdmModel');
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

async function limparImagensProdutos(categorias) {
  for (let categoria of categorias) {
    if (categoria.produtos) {
      for (let produto of categoria.produtos) {
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
      }
    }
  }
  return categorias;
}

exports.mostrarCardapio = async (req, res) => {
  try {
    // Headers para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Agora getCategoriasComProdutos retorna um array de categorias com array produtos
    let categorias = await CategoriaModel.getCategoriasComProdutos();
    
    // Limpar URLs absolutas das imagens e verificar se existem
    categorias = await limparImagensProdutos(categorias);

    // Retorna diretamente, sem necessidade de agrupar
    res.json({ categorias });

  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar o cardápio' });
  }
};

exports.mostrarCardapioPublico = async (req, res) => {
  try {
    // Headers para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Usa a função que filtra apenas produtos disponíveis
    let categorias = await CategoriaModel.getCategoriasComProdutosDisponiveis();
    
    // Limpar URLs absolutas das imagens e verificar se existem
    categorias = await limparImagensProdutos(categorias);

    // Retorna diretamente, sem necessidade de agrupar
    res.json({ categorias });

  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar o cardápio' });
  }
};