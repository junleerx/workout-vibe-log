const apiKey = "AIzaSyBoR2FZpL1fYne3_QIWlUQyGk2P6ZRHetI";
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: [{ parts: [{ text: "test" }] }] })
}).then(r => r.json()).then(console.log).catch(console.error);
