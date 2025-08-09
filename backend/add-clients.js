const API_URL = 'http://localhost:3001';

const clients = [
  {
    name: 'ACME Corp',
    company: 'ACME Corporation',
    email: 'info@acmecorp.com.au',
    phone: '02 9123 4567',
    address: '123 Business Street, Sydney NSW 2000',
    contactPerson: 'John Smith'
  },
  {
    name: 'Metro Builds',
    company: 'Metropolitan Builders Pty Ltd',
    email: 'projects@metrobuilds.com.au',
    phone: '03 8765 4321',
    address: '456 Construction Ave, Melbourne VIC 3000',
    contactPerson: 'Sarah Johnson'
  },
  {
    name: 'Coast Homes',
    company: 'Coastal Home Developments',
    email: 'hello@coasthomes.com.au',
    phone: '07 5555 1234',
    address: '789 Beachside Blvd, Gold Coast QLD 4217',
    contactPerson: 'Mike Wilson'
  },
  {
    name: 'Urban Living',
    company: 'Urban Living Solutions',
    email: 'contact@urbanliving.com.au',
    phone: '08 9876 5432',
    address: '321 City Plaza, Perth WA 6000',
    contactPerson: 'Emma Davis'
  },
  {
    name: 'Heritage Builders',
    company: 'Heritage Construction Group',
    email: 'admin@heritage.com.au',
    phone: '02 6789 1234',
    address: '654 Historic Lane, Canberra ACT 2600',
    contactPerson: 'David Brown'
  }
];

async function addClients() {
  console.log('🏢 Adding sample clients to J11 Production Manager...\n');
  
  // First, get an auth token
  const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'craig@digitalconnections.au',
      password: 'Fish-ball%9'
    }),
  });

  if (!loginResponse.ok) {
    console.error('❌ Failed to login. Please check credentials.');
    return;
  }

  const { token } = await loginResponse.json();
  console.log('✅ Logged in successfully\n');
  
  for (const client of clients) {
    try {
      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(client),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Successfully added: ${client.name}`);
        console.log(`   Company: ${client.company}`);
        console.log(`   Contact: ${client.contactPerson}`);
        console.log(`   Email: ${client.email}`);
        console.log('');
      } else {
        console.error(`❌ Failed to add ${client.name}:`, result.error);
        if (result.details) {
          console.error('   Details:', result.details);
        }
        console.log('');
      }
    } catch (error) {
      console.error(`❌ Network error adding ${client.name}:`, error.message);
      console.log('');
    }
  }
  
  console.log('📋 Sample Clients Added Successfully!');
  console.log('Now you can test the Add Project modal with real client data.');
}

addClients().catch(console.error);
