const CLIENT_ID = '8650d6eb-0fc4-4038-b37c-0a21260ec974';
const CLIENT_SECRET = '571443fa-ba18-404a-8e95-09dc4dc72bfe';
const API_BASE = 'https://api.syncpayments.com.br/api/partner/v1';

exports.handler = async (event, context) => {
  try {
    const identifier = event.queryStringParameters.id;

    const authRes = await fetch(`${API_BASE}/auth-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
    });
    
    if (!authRes.ok) throw new Error("Falha em autenticar - status api");
    const authData = await authRes.json();
    const token = authData.access_token;

    const statusRes = await fetch(`${API_BASE}/transaction/${identifier}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!statusRes.ok) throw new Error("Falha em checar transaction api");
    const statusData = await statusRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: statusData?.data?.status || 'pending'
      })
    };
  } catch (error) {
    console.error("Netlify Function Status Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch status API' })
    };
  }
};
