# Cardápio Público - Julão's Burger

## Visão Geral

Foi criado um sistema de cardápio público inspirado no layout do Goomer, mas mantendo a identidade visual única do Julão's Burger. O sistema está integrado na página inicial (index) e permite que clientes visualizem o cardápio de forma atrativa e moderna.

## Funcionalidades Implementadas

### 🎨 Interface Visual
- **Header do Restaurante**: Logo, nome, categoria e status (Aberto/Fechado)
- **Informações de Entrega**: Pedido mínimo e promoções
- **Navegação por Categorias**: Tabs horizontais e sidebar
- **Layout Responsivo**: Adaptável para desktop, tablet e mobile

### 🔍 Funcionalidades de Busca
- **Modal de Busca**: Acesso rápido aos produtos
- **Busca em Tempo Real**: Pesquisa por nome e descrição
- **Resultados Visuais**: Cards com imagem, preço e descrição

### 📱 Navegação e Interação
- **Modal de Produto**: Visualização detalhada com imagem ampliada
- **Navegação por URL**: Links diretos para categorias e produtos
- **Footer Navigation**: Menu inferior com acesso rápido
- **Status Dinâmico**: Atualização automática do horário de funcionamento

### 🎯 Características Técnicas
- **Carregamento Dinâmico**: Produtos carregados via API
- **Lazy Loading**: Imagens carregadas sob demanda
- **Animações Suaves**: Transições e efeitos visuais
- **Acessibilidade**: Suporte a teclado e leitores de tela

## Como Acessar

### URL Principal
```
http://localhost:3000/
```

### URLs com Parâmetros
```
# Navegar diretamente para uma categoria
http://localhost:3000/?categoria=1

# Abrir produto específico
http://localhost:3000/?produto=5
```

## Estrutura de Arquivos

```
├── view/
│   └── index.html                     # Página principal com cardápio integrado
├── public/
│   ├── styles/
│   │   ├── index.css                  # Estilos integrados
│   │   └── cardapio-publico.css       # Estilos específicos (referência)
│   └── js/
│       ├── index.js                   # Lógica principal
│       └── cardapio-publico.js        # Lógica do cardápio
└── routes/
    └── viewRoutes.js                  # Rotas existentes
```

## Funcionalidades Detalhadas

### 1. Header do Restaurante
- **Logo Circular**: Imagem do Julão's Burger
- **Nome em Destaque**: "JULÃO'S BURGER MEGA LANCHES"
- **Status Dinâmico**: Atualiza automaticamente (8h-22h = Aberto)
- **Promoções**: Destaque para entrega grátis acima de R$ 200

### 2. Navegação de Categorias
- **Tabs Horizontais**: Para desktop
- **Sidebar**: Lista lateral com scroll
- **Mobile**: Tabs se transformam em lista horizontal scrollável
- **Indicador Ativo**: Destaque visual da categoria selecionada

### 3. Grade de Produtos
- **Layout em Grid**: Responsivo (1-3 colunas)
- **Cards Interativos**: Hover effects e animações
- **Informações Completas**: Nome, descrição, preço e imagem
- **Modal de Detalhes**: Visualização ampliada do produto

### 4. Sistema de Busca
- **Acesso Rápido**: Botão no footer
- **Busca Inteligente**: Pesquisa em nome e descrição
- **Resultados Visuais**: Cards com preview
- **Navegação Direta**: Clique para abrir modal do produto

### 5. Modal de Produto
- **Layout em Grid**: Imagem e informações lado a lado
- **Ações Disponíveis**: Adicionar ao carrinho e favoritar
- **Design Responsivo**: Adapta para mobile
- **Fechamento Intuitivo**: ESC, clique fora ou botão X

## Personalização

### Cores e Identidade Visual
```css
/* Cores principais do Julão's Burger */
--primary-color: #ff6b35;    /* Laranja principal */
--secondary-color: #f7931e;  /* Laranja secundário */
--accent-color: #28a745;     /* Verde para preços */
```

### Horário de Funcionamento
```javascript
// Em cardapio-publico.js - linha ~400
const aberto = hora >= 8 && hora < 22; // 8h às 22h
```

### Pedido Mínimo
```html
<!-- Em cardapio-publico.html - linha ~50 -->
<p class="min-order">Pedido mínimo: R$ 25,00</p>
```

## Integração com o Sistema Existente

### API Utilizada
- **Endpoint**: `/api/cardapio/mostrarCardapio`
- **Dados**: Categorias e produtos ativos
- **Filtros**: Apenas produtos não excluídos

### Compatibilidade
- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Desktop, tablet, mobile
- **Acessibilidade**: WCAG 2.1 AA

## Próximos Passos Sugeridos

### Funcionalidades Futuras
1. **Sistema de Carrinho**: Adicionar produtos ao carrinho
2. **Favoritos**: Lista de produtos favoritos do usuário
3. **Compartilhamento**: Links para produtos específicos
4. **Filtros Avançados**: Por preço, categoria, etc.
5. **Avaliações**: Sistema de avaliação de produtos
6. **Promoções**: Destaque para ofertas especiais

### Melhorias Técnicas
1. **Cache**: Implementar cache para melhor performance
2. **PWA**: Transformar em Progressive Web App
3. **SEO**: Otimização para mecanismos de busca
4. **Analytics**: Tracking de interações do usuário

## Manutenção

### Atualização de Produtos
Os produtos são carregados automaticamente do banco de dados existente. Para adicionar novos produtos, use o sistema administrativo em `/cardapio`.

### Personalização Visual
Para alterar cores, fontes ou layout, edite o arquivo `public/styles/cardapio-publico.css`.

### Funcionalidades JavaScript
Para adicionar novas funcionalidades, edite o arquivo `public/js/cardapio-publico.js`.

## Suporte

O sistema foi desenvolvido com foco na experiência do usuário e na manutenibilidade do código. Todas as funcionalidades são responsivas e acessíveis.

---

**Desenvolvido para Julão's Burger** 🍔
