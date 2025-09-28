import fetch from 'node-fetch';

async function testDelete() {
  try {
    // First, let's test a simple request to see if the server is running
    console.log('Testing server connection...');
    const healthResponse = await fetch('http://localhost:3001/health');
    console.log('Health check:', healthResponse.status, await healthResponse.text());

    // Test without auth token to see the specific error
    console.log('\nTesting delete without auth...');
    const deleteResponse1 = await fetch('http://localhost:3001/api/clients/999', {
      method: 'DELETE',
    });
    console.log('Delete without auth:', deleteResponse1.status, await deleteResponse1.json());

    // Test with a fake auth token to see permission error
    console.log('\nTesting delete with fake token...');
    const deleteResponse2 = await fetch('http://localhost:3001/api/clients/999', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer fake-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('Delete with fake token:', deleteResponse2.status, await deleteResponse2.json());

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testDelete();