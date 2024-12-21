// Simple encryption key (change this to your own random string)
const ENCRYPTION_KEY = 'financially-secure';

// Function to decrypt the credentials
function decrypt(encryptedText) {
    const decrypted = atob(encryptedText);
    return decrypted.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
    ).join('');
}

// Encrypted credentials (you'll need to encrypt your actual credentials)
const encryptedCredentials = {
    "supabaseUrl": "Dh0aER1ZRk4JHw1IAwsPAAUdAx0YDAkMBgAeHldeBhUCFxMWA0cNDg==",
    "supabaseAnonKey": "AxAkCQwkCggjBTNkJh8qRDwMLxonDzxWCiIlWjBGAz01NjhcSAwXKx4AWiwFIxBnCQE7Nxo8Cy8UOz0qGigCJhV3GixVPB8zHA0pNxkBBBldCEpFHwErLwY/VFAYODYpECgFGxBOHlwQLyEsUCADJxsBW1UFIDpnAzw7JBsqDCxdLBQyWywoB0hgNzQQPB8zUgotKFguAyBdIT1oRys3IAUrLllALAIvMDEJAzZbPgEJTSoEBwYxAhoILhI5JE9XN1UAIRhdKSJdEgpVDlUvVA=="
  }

const config = {
    supabaseUrl: decrypt(encryptedCredentials.supabaseUrl),
    supabaseAnonKey: decrypt(encryptedCredentials.supabaseAnonKey)
};

export default config; 