💇‍♀️ Beauty Day

Sistema de gestão para salões de beleza, desenvolvido para facilitar o controle de agendamentos, profissionais e serviços.

O projeto possui uma arquitetura separada entre Frontend e Backend, organizados no mesmo repositório.

🚀 Funcionalidades
📅 Gerenciamento de agendamentos
✅ Concluir atendimentos
❌ Cancelar agendamentos
🔄 Reagendar atendimentos
👥 Cadastro e gerenciamento de profissionais
💇 Gerenciamento de serviços
💰 Controle de valores dos serviços
📊 Painel de gestão
🔌 API REST para comunicação entre Frontend e Backend
🗄️ Integração com banco de dados MySQL
🏗️ Estrutura do Projeto
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

O Frontend é responsável pela interface de gerenciamento do sistema e comunicação com a API.

⚙️ Backend

Desenvolvido com:

Node.js
Express
MySQL
mysql2
CORS
dotenv

O Backend disponibiliza uma API REST para gerenciamento dos dados do sistema.

Principais endpoints
GET    /api/status

GET    /api/agendamentos
POST   /api/agendamentos
PATCH  /api/agendamentos/:id
DELETE /api/agendamentos/:id

GET    /api/profissionais
POST   /api/profissionais

GET    /api/servicos
POST   /api/servicos
🗄️ Banco de Dados

O sistema utiliza MySQL para armazenamento dos dados.

Durante o desenvolvimento local, o projeto foi configurado para utilizar o banco:

beauty day

e a conexão local pode ser configurada através das variáveis de ambiente.

🔐 Variáveis de Ambiente

O Backend possui um arquivo .env.example como modelo de configuração.

Crie um arquivo .env dentro de:

beauty-day-backend/

Exemplo:

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

Para verificar o status:

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

O Frontend utiliza a variável:

NEXT_PUBLIC_API_URL

para definir o endereço da API.

Em ambiente local:

NEXT_PUBLIC_API_URL=http://localhost:3001/api

Em produção, essa variável deverá apontar para a URL pública do Backend.

🛠️ Tecnologias
Camada	Tecnologias
Frontend	Next.js, React, TypeScript
Estilização	Tailwind CSS
Gerenciamento de dados	React Query
Backend	Node.js, Express
Banco de dados	MySQL
API	REST
Controle de versão	Git e GitHub
📌 Status do Projeto

🚧 Em desenvolvimento

O projeto está em evolução e novas funcionalidades e melhorias de interface serão adicionadas futuramente.

👨‍💻 Autor

André Waldige

Desenvolvedor Full Stack

GitHub: https://github.com/awaldige
LinkedIn: https://www.linkedin.com/in/andre-waldige-dev
Portfólio: https://andre-waldige.vercel.app/
📄 Licença

Este projeto foi desenvolvido para fins de estudo, portfólio e demonstração de habilidades em desenvolvimento Full Stack.
