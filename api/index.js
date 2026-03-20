const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors()); // Libera CORS para o frontend HTML
app.use(express.json());

// CREDENCIAIS SEGURAS NO BACKEND (Não visíveis para o usuário final)
// É necessário configurar estas variáveis no painel da Vercel (Project Settings -> Environment Variables)
const CLIENT_ID = process.env.CLIENT_ID || '8650d6eb-0fc4-4038-b37c-0a21260ec974'; // Fallback para dev local
const CLIENT_SECRET = process.env.CLIENT_SECRET || '571443fa-ba18-404a-8e95-09dc4dc72bfe'; // Fallback para dev local
const API_BASE = 'https://api.syncpayments.com.br/api/partner/v1';

// Função para gerar o Bearer Token
async function getAuthToken() {
  const response = await axios.post(`${API_BASE}/auth-token`, {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
  return response.data.access_token;
}

// 1. Rota unificada de Checkout (Gera token interno e cria o Pixx)
app.post('/api/checkout', async (req, res) => {
  try {
    const { amount } = req.body;

    // Etapa oculta: pegar o token de autorização
    const token = await getAuthToken();

    // Criar requisição de cash-in
    const cashInRes = await axios.post(`${API_BASE}/cash-in`, {
      amount: amount,
      description: "Acesso VIP",
      client: {
        name: "Cliente",
        cpf: "12345678900", // Pode ser gerado ou coletado depois
        email: "cliente@email.com",
        phone: "11999999999"
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Retorna para o HTML apenas os dados vitais para exibir o PIX (sem token)
    res.json({
      success: true,
      pix_code: cashInRes.data.pix_code,
      identifier: cashInRes.data.identifier || cashInRes.data.id
    });

  } catch (error) {
    console.error('Erro no Checkout API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Falha ao processar o PIX.' });
  }
});

// 2. Rota para checar se foi pago (Polling)
app.get('/api/status/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;

    // Etapa oculta: pegar o token de autorização
    const token = await getAuthToken();

    // Checar status
    const statusRes = await axios.get(`${API_BASE}/transaction/${identifier}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    // Retorna status limpo pro front
    res.json({
      status: statusRes.data?.data?.status || 'pending'
    });

  } catch (error) {
    console.error('Erro no Polling API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Falha ao checar o status.' });
  }
});

// Exportar o app é necessário para rodar na Vercel Serverless
module.exports = app;
