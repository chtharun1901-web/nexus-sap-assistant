const https = require('https');

const url = 'https://dribbble.com/shots/25690168-Full-Flow-of-AI-Crypto-Chat-Platform';

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
}, res => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const ogImg = (html.match(/property="og:image"\s+content="([^"]+)"/) || [])[1];
    const ogTitle = (html.match(/property="og:title"\s+content="([^"]+)"/) || [])[1];
    const ogDesc = (html.match(/property="og:description"\s+content="([^"]+)"/) || [])[1];
    console.log('STATUS:' + res.statusCode);
    console.log('TITLE:' + ogTitle);
    console.log('DESC:' + ogDesc);
    console.log('IMG:' + ogImg);
  });
}).on('error', err => console.error(err));
