const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();

/* =====================================================
   MIDDLEWARES
===================================================== */
app.use(cors());
app.use(express.json());

/* =====================================================
   CONEXÃO BANCO DE DADOS (TiDB Cloud)
===================================================== */
// Comentamos a propriedade 'database' para permitir conectar no servidor
// mesmo se a base 'beauty-day-db' ainda não tiver sido criada no TiDB Cloud.
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // database: process.env.DB_NAME, 
  ssl: {
    rejectUnauthorized: true // Exigido para conexão segura no TiDB Cloud
  },
  multipleStatements: true, // Permite executar múltiplos comandos SQL na inicialização
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Teste de conexão e Inicialização do Banco
db.getConnection(async (err, connection) => {
  if (err) {
    console.error('❌ Erro ao conectar ao TiDB Cloud:', err.message);
    return;
  }
  console.log('✅ Conexão com o cluster TiDB Cloud estabelecida!');
  connection.release();
  
  // Executa a criação do banco, tabelas e carga inicial
  await inicializarBanco();
});

/* =====================================================
   INICIALIZAÇÃO DO BANCO DE DADOS
===================================================== */
const inicializarBanco = async () => {
  const dbName = process.env.DB_NAME || 'beauty-day-db';

  const sqlScript = `
    CREATE DATABASE IF NOT EXISTS \`${dbName}\`;
    USE \`${dbName}\`;

    SET FOREIGN_KEY_CHECKS = 0;

    CREATE TABLE IF NOT EXISTS \`usuarios\` (
      \`id\` varchar(36) NOT NULL,
      \`nome\` varchar(100) NOT NULL,
      \`email\` varchar(100) NOT NULL,
      \`senha_hash\` varchar(255) NOT NULL DEFAULT '',
      \`telefone\` varchar(20) DEFAULT NULL,
      \`role\` varchar(20) NOT NULL DEFAULT 'profissional',
      \`criado_em\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`cargo\` varchar(255) NOT NULL DEFAULT 'profissional',
      \`senha\` varchar(255) NOT NULL DEFAULT '123456',
      \`status\` varchar(20) NOT NULL DEFAULT 'ativo',
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`email\` (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    INSERT INTO \`usuarios\` (\`id\`, \`nome\`, \`email\`, \`senha_hash\`, \`telefone\`, \`role\`, \`criado_em\`, \`cargo\`, \`senha\`, \`status\`) VALUES
    ('prof-uuid-teste-123', 'Carlos Bigode', 'carlos@beautyday.com', 'senha_hash_aqui', '11999999999', 'profissional', '2026-07-12 22:25:01', 'cabeleireiro', '123456', 'ativo'),
    ('user-1784312113003', 'Gisele Martins', 'giselemartins@beautyday.com', '', NULL, '', '2026-07-17 18:15:13', 'esteticista', '123456', 'ativo'),
    ('user-1784312137384', 'Roberta Medeiros', 'robertamedeiros@beautyday.com', '', NULL, '', '2026-07-17 18:15:37', 'esteticista', '123456', 'ativo'),
    ('user-1784468334401', 'Monique de Jesus', 'moniquedejesus@beautyday.com', '', NULL, '', '2026-07-19 13:38:54', 'manicure', '123456', 'ativo'),
    ('user-1784655762715', 'Juliana Mendes', 'julianamendes@beautyday.com', '', NULL, '', '2026-07-21 17:42:42', 'cabeleireiro', '123456', 'ativo'),
    ('user-1784655778687', 'Camila Rocha', 'camilarocha@beautyday.com', '', NULL, '', '2026-07-21 17:42:58', 'cabeleireiro', '123456', 'ativo'),
    ('user-1784655803612', 'Matheus Lima', 'matheuslima@beautyday.com', '', NULL, '', '2026-07-21 17:43:23', 'barbeiro', '123456', 'ativo'),
    ('user-1784655820273', 'Felipe Barbosa', 'felipebarbosa@beautyday.com', '', NULL, '', '2026-07-21 17:43:40', 'barbeiro', '123456', 'ativo'),
    ('user-1784655840022', 'Beatriz Souza', 'beatrizsouza@beautyday.com', '', NULL, '', '2026-07-21 17:44:00', 'manicure', '123456', 'ativo'),
    ('user-1784655857371', 'Fernanda Oliveira', 'fernandaoliveira@beautyday.com', '', NULL, '', '2026-07-21 17:44:17', 'manicure', '123456', 'ativo'),
    ('user-1784655879312', 'Aline Martins', 'alinemartins@beautyday.com', '', NULL, '', '2026-07-21 17:44:39', 'manicure', '123456', 'ativo'),
    ('user-1784655895566', 'Drª Vanessa Costa', 'drªvanessacosta@beautyday.com', '', NULL, '', '2026-07-21 17:44:55', 'esteticista', '123456', 'ativo'),
    ('user-1784655909793', 'Mariana Almeida', 'marianaalmeida@beautyday.com', '', NULL, '', '2026-07-21 17:45:09', 'esteticista', '123456', 'ativo'),
    ('user-1784655921856', 'Isabela Ribeiro', 'isabelaribeiro@beautyday.com', '', NULL, '', '2026-07-21 17:45:21', 'esteticista', '123456', 'ativo')
    ON DUPLICATE KEY UPDATE \`nome\` = VALUES(\`nome\`);

    CREATE TABLE IF NOT EXISTS \`servicos\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`nome\` varchar(100) NOT NULL,
      \`preco\` decimal(10,2) NOT NULL,
      \`duracao_minutos\` int(11) NOT NULL,
      \`comissao_percentual\` decimal(5,2) NOT NULL,
      \`preco_base\` decimal(10,2) NOT NULL DEFAULT 0.00,
      \`duracao_estimada\` int(11) NOT NULL DEFAULT 30,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    INSERT INTO \`servicos\` (\`id\`, \`nome\`, \`preco\`, \`duracao_minutos\`, \`comissao_percentual\`, \`preco_base\`, \`duracao_estimada\`) VALUES
    (1, 'Corte de Cabelo Masculino', 80.00, 45, 40.00, 80.00, 45),
    (3, 'Escova Progressiva', 170.00, 90, 0.00, 170.00, 90),
    (4, 'Corte Feminino (Lavar e Escovar)', 120.00, 60, 0.00, 120.00, 60),
    (5, 'Escova Modeladora', 65.00, 45, 0.00, 65.00, 45),
    (6, 'Hidratação Profunda / Nutrição', 110.00, 45, 0.00, 110.00, 45),
    (7, 'Coloração / Tintura Completa', 180.00, 90, 0.00, 180.00, 90),
    (8, 'Mechas / Loiras / Balayage', 350.00, 120, 0.00, 350.00, 120),
    (9, 'Progressiva / Selagem Térmica', 220.00, 120, 0.00, 220.00, 120),
    (10, 'Manicure Tradicional', 35.00, 30, 0.00, 35.00, 30),
    (11, 'Pedicure Tradicional', 40.00, 45, 0.00, 40.00, 45),
    (12, 'Combo Mão e Pé', 70.00, 60, 0.00, 70.00, 60),
    (13, 'Esmaltação em Gel', 80.00, 45, 0.00, 80.00, 45),
    (14, 'Alongamento em Fibra de Vidro', 180.00, 120, 0.00, 180.00, 120),
    (15, 'Manutenção Fibra de Vidro', 110.00, 90, 0.00, 110.00, 90),
    (16, 'Design de Sobrancelhas', 45.00, 30, 0.00, 45.00, 30),
    (17, 'Design com Henna', 65.00, 45, 0.00, 65.00, 45),
    (18, 'Lash Lifting / Cílios', 130.00, 60, 0.00, 130.00, 60),
    (19, 'Limpeza de Pele Profunda', 160.00, 90, 0.00, 160.00, 90),
    (20, 'Massagem Relaxante', 140.00, 60, 0.00, 140.00, 60),
    (21, 'Drenagem Linfática', 130.00, 60, 0.00, 130.00, 60)
    ON DUPLICATE KEY UPDATE \`nome\` = VALUES(\`nome\`);

    CREATE TABLE IF NOT EXISTS \`profissionais_servicos\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`profissional_id\` varchar(36) NOT NULL,
      \`servico_id\` int(11) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_profissional_servico\` (\`profissional_id\`,\`servico_id\`),
      KEY \`servico_id\` (\`servico_id\`),
      CONSTRAINT \`profissionais_servicos_ibfk_1\` FOREIGN KEY (\`profissional_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`profissionais_servicos_ibfk_2\` FOREIGN KEY (\`servico_id\`) REFERENCES \`servicos\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS \`agendamentos\` (
      \`id\` varchar(36) NOT NULL,
      \`cliente_id\` varchar(36) DEFAULT NULL,
      \`profissional_id\` varchar(36) NOT NULL,
      \`servico_id\` int(11) NOT NULL,
      \`data_hora_inicio\` datetime NOT NULL,
      \`data_hora_fim\` datetime DEFAULT NULL,
      \`status\` varchar(20) NOT NULL DEFAULT 'pendente',
      \`valor_cobrado\` decimal(10,2) NOT NULL,
      \`criado_em\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`cliente_id\` (\`cliente_id\`),
      KEY \`servico_id\` (\`servico_id\`),
      KEY \`idx_agendamentos_profissional_data\` (\`profissional_id\`,\`data_hora_inicio\`,\`data_hora_fim\`),
      KEY \`idx_agendamentos_status\` (\`status\`),
      CONSTRAINT \`agendamentos_ibfk_1\` FOREIGN KEY (\`cliente_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`agendamentos_ibfk_2\` FOREIGN KEY (\`profissional_id\`) REFERENCES \`usuarios\` (\`id\`),
      CONSTRAINT \`agendamentos_ibfk_3\` FOREIGN KEY (\`servico_id\`) REFERENCES \`servicos\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    INSERT INTO \`agendamentos\` (\`id\`, \`cliente_id\`, \`profissional_id\`, \`servico_id\`, \`data_hora_inicio\`, \`data_hora_fim\`, \`status\`, \`valor_cobrado\`, \`criado_em\`) VALUES
    ('agend-1784654761901', NULL, 'prof-uuid-teste-123', 1, '2026-07-21 16:00:00', NULL, 'concluido', 80.00, '2026-07-21 17:26:01'),
    ('agend-1784656039542', NULL, 'user-1784655762715', 5, '2026-07-21 16:50:00', NULL, 'concluido', 65.00, '2026-07-21 17:47:19'),
    ('agend-1784656461547', NULL, 'user-1784655840022', 12, '2026-07-25 20:00:00', NULL, 'concluido', 70.00, '2026-07-21 17:54:21'),
    ('agend-1784656509212', NULL, 'user-1784655909793', 17, '2026-07-16 12:54:00', NULL, 'concluido', 65.00, '2026-07-21 17:55:09'),
    ('agend-1784656900937', NULL, 'user-1784655762715', 6, '2026-07-22 19:50:00', NULL, 'cancelado', 110.00, '2026-07-21 18:01:40'),
    ('agend-1784657367597', NULL, 'user-1784655857371', 13, '2026-07-26 11:00:00', NULL, 'concluido', 80.00, '2026-07-21 18:09:27'),
    ('agend-1784661134525', NULL, 'user-1784312113003', 20, '2026-07-16 17:13:00', NULL, 'concluido', 140.00, '2026-07-21 19:12:14'),
    ('agend-uuid-teste-999', NULL, 'prof-uuid-teste-123', 1, '2026-07-15 05:00:00', NULL, 'cancelado', 50.00, '2026-07-12 22:25:01')
    ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);

    SET FOREIGN_KEY_CHECKS = 1;
  `;

  try {
    const promiseDb = db.promise();
    await promiseDb.query(sqlScript);
    console.log(`✅ Base de dados '${dbName}', tabelas e dados iniciais verificados/carregados no TiDB Cloud com sucesso!`);
  } catch (err) {
    console.error('❌ Erro ao inicializar tabelas:', err.message);
  }
};

/* Middleware auxiliar para garantir o contexto do banco de dados em cada requisição das rotas */
app.use((req, res, next) => {
  const dbName = process.env.DB_NAME || 'beauty-day-db';
  db.query(`USE \`${dbName}\`;`, (err) => {
    if (err) {
      console.error('❌ Erro ao selecionar o banco de dados:', err.message);
      return res.status(500).json({ error: 'Erro ao conectar com a base de dados.' });
    }
    next();
  });
});

/* =====================================================
   1. STATUS DA API
===================================================== */
app.get('/api/status', (req, res) => {
  res.json({ status: 'Online', message: 'API do Beauty Day funcionando!' });
});

/* =====================================================
   2. AGENDAMENTOS - LISTAR TODOS
===================================================== */
app.get('/api/agendamentos', (req, res) => {
  const query = `
    SELECT 
      a.id, 
      a.profissional_id,
      a.servico_id,
      a.data_hora_inicio, 
      a.status, 
      a.valor_cobrado,
      u.nome AS profissional_nome,
      s.nome AS servico_nome
    FROM agendamentos a
    JOIN usuarios u ON a.profissional_id = u.id
    JOIN servicos s ON a.servico_id = s.id
    ORDER BY a.data_hora_inicio ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar agendamentos:', err);
      return res.status(500).json({ error: 'Erro interno ao buscar a agenda.', detalhe: err.message });
    }
    res.json(results);
  });
});

/* =====================================================
   3. AGENDAMENTOS - CRIAR NOVO
===================================================== */
app.post('/api/agendamentos', (req, res) => {
  const profissional_id = req.body.profissional_id || req.body.profesional_id;
  const { servico_id, data_hora_inicio, valor_cobrado, status } = req.body;

  if (!profissional_id || !servico_id || !data_hora_inicio || valor_cobrado === undefined || valor_cobrado === null) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios para realizar o agendamento.' });
  }

  const query = `
    INSERT INTO agendamentos (id, profissional_id, servico_id, data_hora_inicio, valor_cobrado, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const novoId = `agend-${Date.now()}`;
  const valores = [novoId, profissional_id, servico_id, data_hora_inicio, valor_cobrado, status || 'confirmado'];

  db.query(query, valores, (err, result) => {
    if (err) {
      console.error('❌ Erro ao criar agendamento:', err);
      return res.status(500).json({ error: 'Erro ao salvar o agendamento no banco de dados.', detalhe: err.message });
    }
    res.status(201).json({ success: true, message: 'Agendamento criado com sucesso!', id: novoId });
  });
});

/* =====================================================
   4. AGENDAMENTOS - ATUALIZAR (CONCLUIR / CANCELAR / REAGENDAR)
===================================================== */
app.patch('/api/agendamentos/:id', (req, res) => {
  const { id } = req.params;
  const { status, data_hora_inicio } = req.body;

  const fields = [];
  const values = [];

  if (status !== undefined && status !== null) {
    fields.push('status = ?');
    values.push(status);
  }

  if (data_hora_inicio !== undefined && data_hora_inicio !== null) {
    fields.push('data_hora_inicio = ?');
    values.push(data_hora_inicio);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo válido fornecido para atualização.' });
  }

  values.push(id);
  const query = `UPDATE agendamentos SET ${fields.join(', ')} WHERE id = ?`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('❌ Erro ao atualizar agendamento:', err);
      return res.status(500).json({ error: 'Erro ao atualizar agendamento no banco de dados.', detalhe: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado.', id });
    }

    res.json({ success: true, message: 'Agendamento atualizado com sucesso!', id });
  });
});

/* Suporte retrocompatível para requisições PUT */
app.put('/api/agendamentos/:id', (req, res) => {
  req.url = `/api/agendamentos/${req.params.id}`;
  app.handle(req, res);
});

/* =====================================================
   5. AGENDAMENTOS - DELETAR
===================================================== */
app.delete('/api/agendamentos/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM agendamentos WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('❌ Erro ao deletar agendamento:', err);
      return res.status(500).json({ error: 'Erro ao remover o agendamento do banco de dados.', detalhe: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    res.json({ success: true, message: 'Agendamento removido com sucesso!' });
  });
});

/* =====================================================
   6. PROFISSIONAIS - LISTAR
===================================================== */
app.get('/api/profissionais', (req, res) => {
  db.query('SELECT id, nome, cargo, email, status FROM usuarios', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/* =====================================================
   7. PROFISSIONAIS - CADASTRAR
===================================================== */
app.post('/api/profissionais', (req, res) => {
  const nome = req.body.nome || req.body.nome_profissional;
  const cargo = req.body.cargo || req.body.cargo_profissional;
  const { email, senha, status } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'O nome do profissional é obrigatório.' });
  }

  const novoId = req.body.id || `user-${Date.now()}`;
  const query = `
    INSERT INTO usuarios (id, nome, email, senha, cargo, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const valores = [
    novoId, 
    nome, 
    email || `${nome.toLowerCase().replace(/\s+/g, '')}@beautyday.com`, 
    senha || '123456', 
    cargo || 'profissional',
    status || 'ativo'
  ];

  db.query(query, valores, (err, result) => {
    if (err) {
      console.error('❌ Erro ao cadastrar profissional:', err);
      return res.status(500).json({ error: 'Erro ao salvar profissional no banco de dados.', detalhe: err.message });
    }
    res.status(201).json({ success: true, message: 'Profissional cadastrado com sucesso!', id: novoId });
  });
});

/* =====================================================
   7.1. PROFISSIONAIS - ATUALIZAR
===================================================== */
const handleUpdateProfissional = (req, res) => {
  const { id } = req.params;
  const nome = req.body.nome || req.body.nome_profissional;
  const cargo = req.body.cargo || req.body.cargo_profissional;
  const { email, status } = req.body;

  const fields = [];
  const values = [];

  if (nome) {
    fields.push('nome = ?');
    values.push(nome);
  }
  if (cargo) {
    fields.push('cargo = ?');
    values.push(cargo);
  }
  if (email) {
    fields.push('email = ?');
    values.push(email);
  }
  if (status) {
    fields.push('status = ?');
    values.push(status);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização.' });
  }

  values.push(id);
  const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('❌ Erro ao atualizar profissional:', err);
      return res.status(500).json({ error: 'Erro ao atualizar no banco de dados.', detalhe: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Profissional não encontrado.', id });
    }

    res.json({ success: true, message: 'Profissional atualizado com sucesso!', id });
  });
};

app.put('/api/profissionais/:id', handleUpdateProfissional);
app.patch('/api/profissionais/:id', handleUpdateProfissional);

/* =====================================================
   7.2. PROFISSIONAIS - EXCLUIR
===================================================== */
app.delete('/api/profissionais/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('❌ Erro ao deletar profissional:', err);
      return res.status(500).json({ error: 'Erro ao remover profissional do banco de dados.', detalhe: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Profissional não encontrado.' });
    }

    res.json({ success: true, message: 'Profissional deletado com sucesso!' });
  });
});

/* =====================================================
   8. SERVIÇOS - LISTAR
===================================================== */
app.get('/api/servicos', (req, res) => {
  db.query('SELECT id, nome, preco_base, duracao_estimada FROM servicos', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/* =====================================================
   9. SERVIÇOS - CADASTRAR
===================================================== */
app.post('/api/servicos', (req, res) => {
  const nome = req.body.nome || req.body.nome_servico;
  const preco = req.body.preco ?? req.body.preco_base ?? req.body.valor ?? req.body.preco_servico;
  const duracao = req.body.duracao ?? req.body.duracao_estimada ?? req.body.duracao_minutos ?? 30;
  const comissao = req.body.comissao_percentual ?? 0;

  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
  if (preco == null) return res.status(400).json({ error: 'Preço é obrigatório.' });

  const sql = `
    INSERT INTO servicos (nome, preco, preco_base, duracao_minutos, duracao_estimada, comissao_percentual)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nome, preco, preco, duracao, duracao, comissao], (err, result) => {
    if (err) {
      console.error('❌ Erro ao cadastrar serviço:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ success: true, message: 'Serviço cadastrado com sucesso!', id: result.insertId });
  });
});

/* =====================================================
   INICIALIZAÇÃO DO SERVIDOR
===================================================== */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Beauty Day rodando na porta ${PORT}`);
});