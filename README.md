# AWS Services UI

Interface web moderna para gerenciamento de serviços AWS (S3, SQS, DynamoDB) em emuladores locais como **LocalStack** e **Ministack**.

![AWS Services UI](public/favicon.svg)

## ✨ Funcionalidades

### 🎯 **Configuração Flexível**
- **Tela de configuração inicial** - Configure o endpoint do emulador AWS sem variáveis de ambiente
- **Suporte a múltiplos emuladores**: LocalStack, Ministack, AWS real
- **Teste de conexão** - Verifique se o emulador está respondendo
- **Configuração salva no localStorage** - Persistente entre sessões

### 📦 **S3 Manager**
- Navegação hierárquica por pastas (estilo file explorer)
- Upload/download de arquivos
- Criação/remoção de buckets
- Visualização de metadados
- Organização automática por pastas

### 📨 **SQS Manager**
- Criação/remoção de filas
- Envio/recebimento de mensagens
- Polling automático de mensagens
- Visualização de atributos da fila
- Limpeza de filas

### 🗄️ **DynamoDB Manager**
- CRUD completo de tabelas e itens
- Sistema de **diff entre registros** (estilo GitHub)
- Filtros dinâmicos e ordenação
- Syntax highlighting de JSON
- Modal unificada para inserção/edição
- Navegação por rotas com persistência de estado

### 🎨 **Interface Moderna**
- Design com **Ant Design**
- **Favicon SVG personalizado** com símbolos dos serviços AWS
- **JsonHighlighter** com tema claro e wrap de texto
- **JsonDiffViewer** simples e intuitivo
- Modais com margens otimizadas
- Status de conexão visual no menu lateral
- **100% desktop-focused** (sem mobile)

## 🚀 Como Usar

### 1. Iniciar Emulador AWS

#### Opção A: Ministack (leve)
```bash
docker-compose up -d
```

#### Opção B: LocalStack 2.3 (completo)
```bash
docker-compose -f docker-compose-localstack.yaml up -d
```

### 2. Inicializar Serviços (opcional)
```bash
./init-aws-services.sh
```

### 3. Iniciar Frontend
```bash
npm install
npm start
```

Acesse: http://localhost:3000

## 🐳 Docker

### Build da Imagem
```bash
./build-docker.sh
# ou
docker build -t flrossetto/aws-services-ui:latest .
```

### Executar Container
```bash
docker run -p 8080:8080 flrossetto/aws-services-ui:latest
```

### Docker Compose (Produção)
```bash
docker-compose -f docker-compose.prod.yaml up -d
```

## ⚙️ Configuração

### Fluxo de Configuração
1. **Primeiro acesso**: Tela de configuração pede endpoint AWS
2. **Valores padrão**: `http://localhost:4566` (LocalStack/Ministack)
3. **Teste de conexão**: Verifica se o emulador está respondendo
4. **Salvar no localStorage**: Configuração persistente
5. **Acesso aos serviços**: Redirecionamento automático

### Endpoints Suportados
- **LocalStack/Ministack padrão**: `http://localhost:4566`
- **Ministack alternativo**: `http://localhost:4566`
- **Docker em rede bridge**: `http://host.docker.internal:4566`
- **AWS real**: `https://s3.amazonaws.com` (com credenciais AWS)

### Credenciais
- **Emuladores locais**: Use `dummy`/`dummy`
- **AWS real**: Use suas credenciais AWS IAM

## 🛠️ Tecnologias

- **Frontend**: React 19 + TypeScript
- **UI Framework**: Ant Design 6
- **Roteamento**: React Router DOM 7
- **AWS SDK**: AWS SDK v3 para JavaScript
- **Build**: Create React App
- **Container**: Docker + Nginx Alpine
- **Emuladores**: LocalStack 2.3, Ministack

## 📁 Estrutura do Projeto

```
aws-ui/
├── src/
│   ├── components/
│   │   ├── ConfigScreen.tsx      # Tela de configuração inicial
│   │   ├── S3Manager.tsx         # Gerenciador S3
│   │   ├── SQSManager.tsx        # Gerenciador SQS
│   │   ├── DynamoDBManager.tsx   # Gerenciador DynamoDB (CRUD + diff)
│   │   ├── JsonHighlighter.tsx   # Syntax highlighting de JSON
│   │   ├── JsonDiffViewer.tsx    # Diff entre registros (GitHub style)
│   │   ├── JsonEditor.tsx        # Editor de JSON
│   │   └── JsonTextEditor.tsx    # Editor de texto com highlighting
│   ├── config/
│   │   └── awsConfig.ts          # Configuração AWS (localStorage)
│   ├── services/
│   │   └── ministackServices.ts  # Serviços otimizados para emuladores
│   ├── utils/
│   │   └── corsProxy.ts          # Utilitário para problemas CORS
│   ├── App.tsx                   # App principal com roteamento
│   └── index.tsx                 # Ponto de entrada
├── docker/
│   └── nginx.conf                # Configuração Nginx otimizada
├── public/
│   ├── favicon.svg              # Favicon SVG personalizado
│   └── index.html               # Template HTML
├── docker-compose.yaml          # Ministack
├── docker-compose-localstack.yaml # LocalStack 2.3
├── docker-compose.prod.yaml     # Produção
├── Dockerfile                   # Multi-stage build otimizado
├── init-aws-services.sh         # Script de inicialização
└── build-docker.sh              # Script de build Docker
```

## 🔧 Recursos Técnicos

### JsonHighlighter
- Syntax highlighting com cores Ant Design
- Wrap de texto automático (sem scroll horizontal)
- Suporte a null/undefined (mostra "null" em cinza/itálico)
- Indentação preservada do JSON
- 100% altura do container

### JsonDiffViewer
- Diff lado a lado estilo GitHub
- Cores: verde (adições), vermelho (remoções), amarelo (modificações)
- Numeração de linhas
- Legenda explicativa
- Altura fixa (600px)

### DynamoDB Manager
- **Coluna "Sel." fixa à esquerda** para seleção de diff
- **Botão "ver/editar"** com tamanho fixo (85px)
- **Modal unificada** com toggle "Editar/Salvar"
- **Modo "incluir"** sempre em edição
- **Query params** para persistência de estado
- **Sub-rotas** para estado granular (`/dynamodb/tables/:tableName`)

### Modais
- Margens iguais top/bottom (`top: 40px, bottom: 40px`)
- Sem borda no JsonHighlighter
- Editor de texto com syntax coloring
- Altura fixa para DiffViewer (não estoura modal)

## 🐛 Problemas Conhecidos & Soluções

### Ministack
- **Erro DynamoDB "unhashable type: 'dict'"**: Workaround implementado
- **Endpoint de health diferente**: Suporte a múltiplos endpoints
- **Bugs no DynamoDB**: Otimizações específicas

### LocalStack
- **CORS issues**: Configuração `EXTRA_CORS_ALLOWED_ORIGINS`
- **LocalStack Pro requer licença**: Usar versão 2.3 (community)

### AWS SDK
- **DynamoDB com BillingMode PAY_PER_REQUEST**: Não especificar ProvisionedThroughput
- **SQS protocolo de query**: Configuração específica para evitar erro "Missing Action"

## 👤 Atribuição e Créditos

### Autor Principal
- **Fabio Rossetto** - [@flrossetto](https://github.com/flrossetto)
- GitHub: [flrossetto](https://github.com/flrossetto)
- Docker Hub: [flrossetto](https://hub.docker.com/u/flrossetto)

### Tecnologias e Bibliotecas
Este projeto utiliza várias tecnologias de código aberto. Agradecimentos especiais aos mantenedores de:

- **React** - Biblioteca JavaScript para interfaces de usuário (Facebook)
- **TypeScript** - Superset tipado de JavaScript (Microsoft)
- **Ant Design** - Sistema de design e biblioteca de componentes React
- **AWS SDK for JavaScript v3** - SDK oficial da AWS
- **LocalStack** - Emulador AWS local (LocalStack GmbH)
- **Ministack** - Emulador AWS leve e minimalista
- **Create React App** - Ferramenta de bootstrapping para React (Facebook)

### Licenças de Dependências
Todas as dependências deste projeto são de código aberto e estão licenciadas sob suas respectivas licenças MIT, Apache 2.0, ou compatíveis. Consulte o arquivo `package.json` para detalhes específicos de cada dependência.

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes completos.

### Direitos de Atribuição
De acordo com a licença MIT, você é livre para usar, modificar e distribuir este software, desde que inclua uma cópia da licença MIT e mantenha o aviso de direitos autorais original.

**Exemplo de atribuição:**
```
AWS Services UI
Copyright (c) 2025 Fabio Rossetto
Licenciado sob a MIT License
```

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

- Reportar issues: [GitHub Issues](https://github.com/flrossetto/aws-ui/issues)
- Docker Hub: `flrossetto/aws-services-ui`

---

**Desenvolvido com ❤️ para desenvolvedores AWS**
