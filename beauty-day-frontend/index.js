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
   CONEXÃO BANCO DE DADOS (XAMPP PORTA 3308)
===================================================== */
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Teste de conexão ao iniciar
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erro ao conectar ao MySQL (Porta 3308):', err.message);
    return;
  }
  console.log('✅ Conexão com o banco MySQL estabelecida com sucesso!');
  connection.release();
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
   7.1. PROFISSIONAIS - ATUALIZAR (NOVO)
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
   7.2. PROFISSIONAIS - EXCLUIR (NOVO)
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