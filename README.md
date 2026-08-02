# 💇‍♀️ Beauty Day

Sistema de gestão para salões de beleza, desenvolvido para facilitar o controle de agendamentos, profissionais e serviços.

O projeto possui uma arquitetura separada entre Frontend e Backend, organizados no mesmo repositório.

## 🌐 Pré-visualização

🚀 **Acesse a aplicação online:**

👉 https://beauty-day-app.vercel.app/

A aplicação está disponível em ambiente de produção e permite visualizar o painel de gestão, consultar agendamentos, profissionais e serviços, além de realizar operações de gerenciamento.

### 🖥️ Demonstração

O Beauty Day possui uma interface moderna e responsiva para gerenciamento de:

- 📅 Agenda de atendimentos
- <img width="1348" height="630" alt="image" src="https://github.com/user-attachments/assets/93493cf4-57d9-4efd-bf74-03aaed857c57" />

- 👥 Profissionais
- <img width="1349" height="643" alt="image" src="https://github.com/user-attachments/assets/c121656f-533f-4a4f-a786-28d3af0faa91" />

- 💇 Serviços
- <img width="1355" height="643" alt="image" src="https://github.com/user-attachments/assets/f4eb03d5-d24e-44f6-a77c-bd4e4f11208e" />

- 📊 Painel de gestão
- <img width="1364" height="639" alt="image" src="https://github.com/user-attachments/assets/c09c3dd4-6d6d-4903-8002-df6b3f082101" />


> 💡 **Dica:** Para uma melhor experiência, acesse a demonstração online pelo navegador em um computador ou dispositivo móvel.

---

## 🚀 Funcionalidades

- 📅 Gerenciamento de agendamentos
- ✅ Concluir atendimentos
- ❌ Cancelar agendamentos
- 🔄 Reagendar atendimentos
- 👥 Cadastro e gerenciamento de profissionais
- ✏️ Edição de profissionais
- 🗑️ Exclusão de profissionais
- 💇 Gerenciamento de serviços
- ✏️ Edição de serviços
- 🗑️ Exclusão de serviços
- 💰 Controle de valores dos serviços
- 📊 Painel de gestão
- 🔌 API REST para comunicação entre Frontend e Backend
- 🗄️ Integração com banco de dados

---

## 🏗️ Estrutura do Projeto

```text
beauty-day/
│
├── beauty-day-frontend/
│   ├── app/
│   ├── components/
│   ├── services/
│   ├── types/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── beauty-day-backend/
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   └── ...
│
└── README.md
🖥️ Frontend

Desenvolvido com:

Next.js
React
TypeScript
Tailwind CSS
React Query
ESLint

O Frontend é responsável pela interface de gerenciamento do sistema e pela comunicação com a API REST.

🚀 Deploy

O Frontend está publicado na:

Vercel

URL de produção:

https://beauty-day-app.vercel.app/

⚙️ Backend

Desenvolvido com:

Node.js
Express
MySQL / mysql2
CORS
dotenv

O Backend disponibiliza uma API REST para gerenciamento dos dados do sistema.

🚀 Deploy

O Backend está publicado na:

Render

API de produção:

https://beauty-day-api.onrender.com/

🔌 Principais endpoints
GET    /api/status

GET    /api/agendamentos
POST   /api/agendamentos
PATCH  /api/agendamentos/:id
DELETE /api/agendamentos/:id

GET    /api/profissionais
POST   /api/profissionais
PUT    /api/profissionais/:id
DELETE /api/profissionais/:id

GET    /api/servicos
POST   /api/servicos
PUT    /api/servicos/:id
DELETE /api/servicos/:id
🗄️ Banco de Dados

O sistema utiliza banco de dados relacional para armazenamento dos dados.

Ambiente de desenvolvimento

Durante o desenvolvimento local, o projeto foi configurado para utilizar:

MySQL
XAMPP

Banco utilizado localmente:

beauty day

A conexão local pode ser configurada através das variáveis de ambiente.

Ambiente de produção

Em produção, a aplicação utiliza:

TiDB Cloud

A API publicada no Render se conecta ao banco de dados de produção através das variáveis de ambiente configuradas no serviço.

🔐 Variáveis de Ambiente

O Backend possui um arquivo .env.example como modelo de configuração.

Crie um arquivo .env dentro de:

beauty-day-backend/
Exemplo para desenvolvimento local
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=root
DB_PASSWORD=
DB_NAME=beauty day

⚠️ Nunca publique o arquivo .env com credenciais reais no GitHub.

▶️ Como executar o projeto
1. Clonar o repositório
git clone https://github.com/awaldige/beauty-day.git
cd beauty-day
2. Executar o Backend

Entre na pasta:

cd beauty-day-backend

Instale as dependências:

npm install

Configure o arquivo .env com os dados do banco de dados.

Inicie o servidor:

npm run dev

A API estará disponível em:

http://localhost:3001

Para verificar o status da API:

http://localhost:3001/api/status
3. Executar o Frontend

Abra outro terminal e entre na pasta:

cd beauty-day-frontend

Instale as dependências:

npm install

Configure a URL da API no arquivo .env.local:

NEXT_PUBLIC_API_URL=http://localhost:3001/api

Inicie o Frontend:

npm run dev

O sistema estará disponível em:

http://localhost:3000
🔗 Comunicação entre Frontend e Backend

O Frontend utiliza a variável de ambiente:

NEXT_PUBLIC_API_URL

para definir o endereço da API.

Ambiente local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
Ambiente de produção
NEXT_PUBLIC_API_URL=https://beauty-day-api.onrender.com/api

A aplicação em produção está hospedada na Vercel e utiliza a API publicada no Render.

🛠️ Tecnologias
Camada	Tecnologias
Frontend	Next.js, React, TypeScript
Estilização	Tailwind CSS
Gerenciamento de dados	React Query
Backend	Node.js, Express
Banco local	MySQL
Banco de produção	TiDB Cloud
API	REST
Deploy Frontend	Vercel
Deploy Backend	Render
Controle de versão	Git e GitHub
📌 Status do Projeto

🟢 Em produção

O Beauty Day está disponível online para demonstração.

Novas funcionalidades, melhorias de interface e evoluções técnicas poderão ser adicionadas futuramente.

## 🏢 Desenvolvido por

**AW TECHNOLOGY**

Soluções inteligentes em software para negócios.

Desenvolvido por **André Waldige — Desenvolvedor Full Stack**

- 🌐 Portfólio: https://andre-waldige.vercel.app/
- 💻 GitHub: https://github.com/awaldige
- 💼 LinkedIn: https://www.linkedin.com/in/andre-waldige-dev
- 📱 Instagram: https://www.instagram.com/awtechnologybr/

 📄 Licença

Este projeto foi desenvolvido para fins de estudo, portfólio e demonstração de habilidades em desenvolvimento Full Stack.
