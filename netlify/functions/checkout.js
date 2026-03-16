const CLIENT_ID = '8650d6eb-0fc4-4038-b37c-0a21260ec974';
const CLIENT_SECRET = '571443fa-ba18-404a-8e95-09dc4dc72bfe';
const API_BASE = 'https://api.syncpayments.com.br/api/partner/v1';

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount } = JSON.parse(event.body);

    // 1. Get Auth Token
    const authRes = await fetch(`${API_BASE}/auth-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
    });
    
    if (!authRes.ok) throw new Error("Falha na autenticação da api");
    const authData = await authRes.json();
    const token = authData.access_token;

    // 2. Create Cash-In
    const cashInRes = await fetch(`${API_BASE}/cash-in`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        description: "Acesso VIP",
        client: {
          name: "Cliente",
          cpf: "12345678900",
          email: "cliente@email.com",
          phone: "11999999999"
        }
      })
    });
    
    if (!cashInRes.ok) throw new Error("Falha na criação do PIX");
    const cashInData = await cashInRes.json();

    // 3. Responde com os dados pro frontend (mantendo token em segredo)
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        pix_code: cashInData.pix_code,
        identifier: cashInData.identifier || cashInData.id
      })
    };
  } catch (error) {
    console.error("Netlify Function Checkout Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process checkout API' })
    };
  }
};
