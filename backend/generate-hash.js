import bcrypt from 'bcrypt';

const password = 'j11!@#$';
const saltRounds = 12;

console.log('Generating hash for password:', password);
const hash = bcrypt.hashSync(password, saltRounds);
console.log('Hashed password:', hash);

// SQL insert statement for manual entry
console.log('\nSQL Insert Statement:');
console.log(`INSERT INTO users (name, email, password, "isActive", "createdAt", "updatedAt") 
VALUES ('J11 Admin', 'admin@j11productions.com', '${hash}', true, NOW(), NOW());`);
