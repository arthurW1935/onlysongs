const clientId = 'abd347443ecd45e29093fbdd39992028';
const clientSecret = 'b2666e4ad4274c3cb5845c29c427784d';
const tokenEndpoint = 'https://accounts.spotify.com/api/token';

async function generateAuthToken(clientId, clientSecret){
    console.log('generateAuthToken');

    localStorage.clear();
    
    const generateRandomString = (length) => {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }
      
    const codeVerifier  = generateRandomString(64);

    const sha256 = async (plain) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(plain)
        return window.crypto.subtle.digest('SHA-256', data)
    }
      
    const base64encode = (input) => {
        return btoa(String.fromCharCode(...new Uint8Array(input)))
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
    }
      
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);
    const redirectUri = 'http://localhost:5500/main.html';
    
    const scope = 'streaming user-read-playback-state user-modify-playback-state user-read-currently-playing';
    const authUrl = new URL("https://accounts.spotify.com/authorize")
    
    window.localStorage.setItem('code_verifier', codeVerifier);
    
    const params =  {
        response_type: 'code',
        client_id: clientId,
        scope,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: redirectUri,
    }
    
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
}

document.getElementById('login').addEventListener('click', () => {
    generateAuthToken(clientId, clientSecret);
});

