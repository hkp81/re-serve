fetch('https://project-code-pqip.onrender.com/css/glassshade.css')
  .then(r => r.text())
  .then(css => {
    require('fs').writeFileSync('remote_glassshade.css', css, 'utf8');
    console.log('Saved remote_glassshade.css, length: ' + css.length);
  })
  .catch(err => console.error('Fetch error:', err));