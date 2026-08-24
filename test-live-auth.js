const https = require('https');

function request(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'ai-powered-personalized-learning-path-do6n.onrender.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://learning-path-recommender-ebon.vercel.app',
      },
    };

    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: body }));
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function run() {
  const testEmail = 'aether_user_' + Date.now() + '@example.com';
  const testPassword = 'Password123!';
  const testName = 'Alex Vance';

  console.log('Testing Registration with unique email:', testEmail);
  const regRes = await request('/api/auth/register', 'POST', {
    fullName: testName,
    email: testEmail,
    password: testPassword,
  });
  console.log('Registration Status:', regRes.status);
  console.log('Registration Body:', regRes.body);

  let token = null;
  try {
    const parsed = JSON.parse(regRes.body);
    token = parsed.token;
  } catch (e) {}

  console.log('\nTesting Login with same credentials...');
  const loginRes = await request('/api/auth/login', 'POST', {
    email: testEmail,
    password: testPassword,
  });
  console.log('Login Status:', loginRes.status);
  console.log('Login Body:', loginRes.body);

  if (token) {
    console.log('\nTesting Protected /api/profile endpoint with JWT...');
    const profRes = await request('/api/profile', 'GET', null, token);
    console.log('Profile Status:', profRes.status);
    console.log('Profile Body:', profRes.body);
  }
}

run().catch(console.error);
