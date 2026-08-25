# 🤖 CorrigeAI

> **Correção inteligente de provas por imagem, potencializada por Inteligência Artificial.**

O **CorrigeAI** é uma aplicação web desenvolvida para automatizar a correção de provas de múltipla escolha a partir de imagens.

A plataforma permite que professores cadastrem suas avaliações, definam o gabarito oficial e enviem uma foto da folha de respostas de um aluno. A partir dessa imagem, a Inteligência Artificial identifica as respostas marcadas, compara com o gabarito e gera automaticamente o resultado da avaliação.

O objetivo é transformar um processo manual, repetitivo e suscetível a erros em uma experiência **rápida, automatizada e centralizada**.

---

## 📌 Sobre o Projeto

Corrigir provas manualmente pode consumir uma quantidade significativa de tempo, principalmente quando o professor precisa lidar com várias turmas e muitos alunos.

O **CorrigeAI** foi criado para solucionar esse problema utilizando **visão computacional e Inteligência Artificial** para interpretar folhas de respostas fotografadas.

### 🎯 Problema

O processo tradicional de correção envolve:

* Conferir individualmente cada questão;
* Comparar as respostas com o gabarito;
* Calcular a nota;
* Registrar os resultados;
* Repetir o processo para cada aluno.

Além de consumir tempo, esse processo pode estar sujeito a erros humanos.

### 💡 Solução

O CorrigeAI automatiza esse fluxo:

```text
Professor
   │
   ▼
Seleciona a avaliação
   │
   ▼
Informa o aluno
   │
   ▼
Fotografa ou envia a folha de respostas
   │
   ▼
🤖 Inteligência Artificial
   │
   ▼
Identificação das respostas
   │
   ▼
Comparação com o gabarito
   │
   ▼
📊 Resultado da correção
```

---

## ✨ Principais Funcionalidades

### 📝 Gerenciamento de avaliações

* Criação de avaliações;
* Definição do número de questões;
* Cadastro do gabarito oficial;
* Associação da avaliação a uma turma;
* Organização das avaliações por contexto acadêmico.

### 📸 Correção por imagem

* Upload de imagens da folha de respostas;
* Captura de fotos diretamente pelo dispositivo;
* Suporte a câmera em dispositivos móveis;
* Seleção de imagens diretamente da galeria;
* Compressão e otimização da imagem antes do processamento.

### 🤖 Correção utilizando IA

A imagem da prova é processada por um modelo de Inteligência Artificial responsável por identificar as respostas marcadas.

O sistema então:

1. Analisa a imagem;
2. Identifica as questões;
3. Identifica as alternativas selecionadas;
4. Compara as respostas com o gabarito;
5. Calcula o resultado da avaliação;
6. Armazena as informações da correção.

### 👨‍🎓 Gerenciamento de alunos

* Identificação do aluno durante a correção;
* Associação do aluno ao resultado;
* Histórico das correções realizadas.

### 📊 Resultados

A aplicação apresenta os dados da correção de forma estruturada, permitindo visualizar informações como:

* Nota obtida;
* Quantidade de acertos;
* Quantidade de erros;
* Respostas identificadas;
* Gabarito esperado;
* Resultado por questão.

---

## 🧠 Inteligência Artificial

Um dos principais diferenciais do CorrigeAI é a utilização de **IA para interpretação das imagens**.

Em vez de depender exclusivamente de regras fixas de processamento de imagem, a aplicação utiliza um modelo multimodal capaz de analisar a folha de respostas e retornar as alternativas identificadas.

O fluxo pode ser representado da seguinte maneira:

```text
Imagem
   │
   ▼
Pré-processamento
   │
   ├── Compressão
   ├── Redimensionamento
   └── Conversão para formato adequado
   │
   ▼
Modelo de IA
   │
   ▼
Respostas identificadas
   │
   ▼
Validação dos dados
   │
   ▼
Comparação com gabarito
   │
   ▼
Resultado
```

A resposta retornada pela IA passa por validações antes de ser utilizada pela aplicação, reduzindo o risco de dados inconsistentes no fluxo de correção.

---

## 🏗️ Arquitetura

O projeto foi estruturado buscando aplicar princípios de **separação de responsabilidades**, organização por domínio e facilidade de evolução.

A aplicação utiliza uma estrutura baseada em funcionalidades, mantendo componentes, modelos, ações e regras relacionados ao mesmo domínio próximos entre si.

Uma representação simplificada:

```text
┌─────────────────────────────────────────────┐
│                  Frontend                   │
│                                             │
│        Next.js + React + TypeScript         │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              Application Layer              │
│                                             │
│              Server Actions                 │
│                                             │
│  ┌─────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Exams   │ │Students  │ │ Corrections │ │
│  └─────────┘ └──────────┘ └─────────────┘ │
└──────────────────────┬──────────────────────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      ┌─────────────┐     ┌──────────────┐
      │   MongoDB   │     │  Gemini API  │
      │             │     │              │
      │ Persistência│     │      IA      │
      └─────────────┘     └──────────────┘
```

### 🔹 Server Actions

O projeto utiliza **Server Actions** para executar operações no servidor, reduzindo a necessidade de criação de endpoints REST para operações internas da aplicação.

Isso permite manter parte significativa da lógica de negócio próxima às funcionalidades que a utilizam.

### 🔹 Validação

Os dados recebidos pela aplicação são validados antes de serem processados, evitando que informações inválidas avancem pelo fluxo da aplicação.

### 🔹 Persistência

O **MongoDB** é utilizado como banco de dados principal, com **Mongoose** como camada de modelagem e acesso aos documentos.

---

## 🛠️ Stack Tecnológica

| Categoria                   | Tecnologia                |
| :-------------------------- | :------------------------ |
| **Frontend**                | Next.js                   |
| **UI**                      | React                     |
| **Linguagem**               | TypeScript                |
| **Estilização**             | Tailwind CSS              |
| **Backend**                 | Next.js Server Actions    |
| **Runtime**                 | Node.js                   |
| **Banco de Dados**          | MongoDB                   |
| **ODM**                     | Mongoose                  |
| **Inteligência Artificial** | Google Gemini             |
| **Validação**               | Zod                       |
| **Autenticação**            | NextAuth                  |
| **Ícones**                  | Lucide React              |
| **Processamento de imagem** | browser-image-compression |
| **Controle de versão**      | Git / GitHub              |

---

## 📂 Estrutura do Projeto

A estrutura segue uma organização orientada às funcionalidades da aplicação:

```text
src/
├── app/
│   ├── auth/
│   ├── correct/
│   ├── corrections/
│   ├── dashboard/
│   ├── exams/
│   └── ...
│
├── components/
│   ├── landing/
│   ├── ...
│   └── ...
│
├── features/
│   ├── corrections/
│   ├── exams/
│   ├── students/
│   └── ...
│
├── lib/
│   ├── database/
│   ├── session/
│   └── ...
│
└── ...
```

Essa abordagem facilita a manutenção e permite que novas funcionalidades sejam adicionadas sem concentrar toda a lógica em uma única camada da aplicação.

---

## 🔐 Segurança e Validação

O projeto possui algumas preocupações voltadas à segurança e consistência dos dados:

* Autenticação de usuários;
* Proteção das áreas privadas da aplicação;
* Validação de dados utilizando **Zod**;
* Validação dos dados persistidos através dos schemas do **Mongoose**;
* Variáveis sensíveis mantidas através de variáveis de ambiente;
* Chaves de APIs externas não expostas no cliente;
* Operações sensíveis executadas no servidor.

As credenciais utilizadas para serviços externos devem permanecer exclusivamente no ambiente do servidor.

---

## 📱 Experiência em Dispositivos Móveis

O CorrigeAI foi pensado para funcionar também no contexto real de utilização de um professor.

Por isso, o fluxo de correção permite utilizar a câmera do dispositivo:

```text
📱 Celular
   │
   ├── 📷 Tirar foto
   │
   └── 🖼️ Selecionar da galeria
             │
             ▼
        Compressão
             │
             ▼
        Envio da imagem
             │
             ▼
        🤖 Processamento
```

As imagens são comprimidas e redimensionadas antes do envio para reduzir o tamanho do payload e melhorar a experiência em dispositivos móveis.

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
MONGODB_URI=

AUTH_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GEMINI_API_KEY=
```

> ⚠️ **Nunca versione arquivos `.env`, chaves de API ou outras credenciais no Git.**

Caso exista um arquivo `.env.example`, utilize-o como referência para configurar o ambiente local.

---

## 🚀 Executando o Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/SEU-USUARIO/corrige-ai.git

cd corrige-ai
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie o arquivo:

```text
.env.local
```

e configure as variáveis necessárias.

### 4. Execute em desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em:

```text
http://localhost:3000
```

### 5. Build de produção

```bash
npm run build
```

### 6. Execute a versão de produção

```bash
npm start
```

---

## 🧪 Qualidade e Validação

O projeto busca manter a confiabilidade do fluxo de correção através de validações em diferentes pontos da aplicação.

Entre elas:

* Validação dos dados recebidos pelo formulário;
* Validação dos parâmetros das Server Actions;
* Validação dos documentos persistidos;
* Validação da resposta retornada pela IA;
* Tratamento de erros durante o processamento;
* Validação das informações antes da persistência.

O objetivo é evitar que uma resposta inesperada do modelo de IA ou uma entrada inválida comprometa o resultado final da correção.

---

## 🗺️ Roadmap

O CorrigeAI está em evolução e algumas funcionalidades planejadas incluem:

* [ ] Dashboard com indicadores gerais;
* [ ] Relatórios de desempenho por aluno;
* [ ] Relatórios por turma;
* [ ] Estatísticas por questão;
* [ ] Histórico completo de correções;
* [ ] Exportação de resultados;
* [ ] Melhorias no reconhecimento das folhas de respostas;
* [ ] Suporte a diferentes modelos de folhas de resposta;
* [ ] Correção de questões discursivas;
* [ ] Melhorias na experiência mobile;
* [ ] Melhorias no processamento e validação das respostas da IA.

---

## 🎯 Objetivos Técnicos

Além de resolver um problema real, o CorrigeAI também foi desenvolvido como um projeto para explorar conceitos modernos de desenvolvimento de software.

Entre os principais objetivos técnicos estão:

* Aplicação de princípios de arquitetura de software;
* Separação de responsabilidades;
* Desenvolvimento full-stack com TypeScript;
* Integração com serviços de Inteligência Artificial;
* Processamento de imagens;
* Persistência de dados utilizando MongoDB;
* Desenvolvimento de aplicações modernas com Next.js;
* Construção de uma experiência responsiva;
* Validação e tratamento de dados;
* Desenvolvimento orientado a funcionalidades.

---

## 💭 Desafios do Projeto

Um dos principais desafios do CorrigeAI é transformar uma **imagem não estruturada** em informações confiáveis que possam ser utilizadas pela aplicação.

O processo envolve lidar com diferentes condições de captura:

* Diferentes ângulos;
* Iluminação;
* Qualidade da câmera;
* Resolução;
* Compressão;
* Posicionamento da folha;
* Diferentes formas de marcação das respostas.

Isso torna a integração com Inteligência Artificial especialmente interessante, pois o sistema precisa considerar que a entrada recebida não é um conjunto de dados perfeitamente estruturado.

Outro desafio importante é garantir que a resposta gerada pela IA seja transformada em dados previsíveis e seguros para o restante da aplicação.

---

## 📸 Fluxo Principal da Aplicação

```text
┌───────────────────┐
│      Professor    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Seleciona avaliação│
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Informa o aluno   │
└─────────┬─────────┘
          │
          ▼
┌────────────────────────┐
│ Foto ou upload da prova│
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│ Compressão da imagem   │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│     Inteligência IA    │
│   Reconhecimento das   │
│       respostas        │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│ Comparação com gabarito│
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│       Resultado         │
│                         │
│   ✓ Acertos             │
│   ✗ Erros               │
│   📊 Nota               │
└────────────────────────┘
```

---

## 🔮 Visão de Futuro

A ideia do CorrigeAI vai além de simplesmente automatizar a correção de uma prova.

A visão é transformar a plataforma em uma ferramenta capaz de ajudar professores a **economizar tempo e obter informações mais úteis sobre o desempenho dos alunos**.

No futuro, os dados coletados pelas correções poderão permitir análises como:

> **Quais questões apresentam maior índice de erro?**

> **Quais conteúdos precisam ser reforçados?**

> **Como está o desempenho de uma determinada turma?**

> **Quais alunos precisam de maior atenção?**

Dessa forma, a Inteligência Artificial deixa de ser apenas uma ferramenta de correção e passa a fazer parte de um processo maior de **análise e apoio à tomada de decisão pedagógica**.

---

## 🤝 Contribuindo

Contribuições são bem-vindas.

Para contribuir:

```bash
# Fork do projeto

# Crie uma branch
git checkout -b feature/minha-feature

# Faça suas alterações

# Commit
git commit -m "feat: adiciona nova funcionalidade"

# Push
git push origin feature/minha-feature
```

Depois, abra um **Pull Request** descrevendo as alterações realizadas.

### Padrão de commits

O projeto utiliza uma convenção baseada em **Conventional Commits**:

```text
feat: nova funcionalidade

fix: correção de bug

refactor: refatoração

docs: alteração na documentação

style: alterações de estilo

chore: tarefas de manutenção

test: criação ou alteração de testes
```

---

## 📄 Licença

Este projeto está distribuído sob a licença **MIT**.

Consulte o arquivo [`LICENSE`](LICENSE) para mais informações.

---

## 👨‍💻 Autor

Desenvolvido por **João Vitor Clavilho**.

> Desenvolvido com ☕, TypeScript e um pouco de Inteligência Artificial. 🤖

---

## ⭐ Gostou do projeto?

Se o CorrigeAI despertou seu interesse, considere deixar uma ⭐ no repositório.

Feedbacks, sugestões e contribuições também são muito bem-vindos.
