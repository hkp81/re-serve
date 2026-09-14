const fs = require('fs');
const files = ['discovery.js', 'checkout.js', 'partner-dashboard.js', 'ngo-dashboard.js', 'scanner-simulator.js'];
Promise.all(files.map(f => fetch('https://project-code-pqip.onrender.com/js/' + f)
  .then(r => r.text())
  .then(t => {
    fs.writeFileSync('remote_' + f, t, 'utf8');
    console.log('Saved remote_' + f + ' length: ' + t.length);
  })
)).catch(err => console.error(err));