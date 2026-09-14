const fs = require('fs');
fetch('https://project-code-pqip.onrender.com')
  .then(r => r.text())
  .then(html => {
    fs.writeFileSync('remote.html', html, 'utf8');
    console.log('Saved remote.html, length: ' + html.length);
  })
  .catch(err => console.error('Fetch error:', err));