const apiKey = process.env.GEMINI_API_KEY || require('fs').readFileSync('.env', 'utf8').split('\n').find(l => l.startsWith('GEMINI_API_KEY')).split('=')[1].replace(/"/g, '');
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(r => r.json())
  .then(d => d.models.filter(m => m.supportedGenerationMethods.includes("generateContent")).map(m => m.name).forEach(m => console.log(m)))
  .catch(console.error);
