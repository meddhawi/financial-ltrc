import { credentials } from './config.local.js';

const ENCRYPTION_KEY = 'financially-secure';

function encrypt(text) {
    const encrypted = text.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
    ).join('');
    return btoa(encrypted);
}

// Encrypt credentials
const encrypted = {
    supabaseUrl: encrypt(credentials.supabaseUrl),
    supabaseAnonKey: encrypt(credentials.supabaseAnonKey)
};

console.log('Copy these encrypted values to config.js:');
console.log(JSON.stringify(encrypted, null, 2)); 