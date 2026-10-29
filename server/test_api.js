const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n=== ${options.method} ${options.path} ===`);
        try { console.log(JSON.stringify(JSON.parse(data), null, 2)); } catch { console.log(data); }
        resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  // Test 1: Health check
  await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });

  // Test 2: Simulate a high-value transaction (should trigger fraud alert)
  const txBody = JSON.stringify({ account_id: 1, amount: 75000, transaction_type: 'DEPOSIT', description: 'Test fraud detection' });
  const txRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/transactions', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(txBody) }
  }, txBody);
  console.log('\nFraud alerts generated:', txRes.fraudAlertsGenerated);

  // Test 3: Dashboard stats
  await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/stats', method: 'GET' });

  // Test 4: Audit logs (auto-created by triggers)
  await request({ hostname: 'localhost', port: 5000, path: '/api/audit-logs?limit=5', method: 'GET' });

  // Test 5: Update alert status
  const statusBody = JSON.stringify({ status: 'UNDER_REVIEW' });
  await request({
    hostname: 'localhost', port: 5000, path: '/api/fraud-alerts/1/status', method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(statusBody) }
  }, statusBody);

  // Test 6: Invalid status (should return 400)
  const badBody = JSON.stringify({ status: 'INVALID_STATUS' });
  await request({
    hostname: 'localhost', port: 5000, path: '/api/fraud-alerts/1/status', method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(badBody) }
  }, badBody);

  console.log('\n✅ All tests completed');
}

runTests().catch(err => { console.error('Test failed:', err.message); process.exit(1); });
