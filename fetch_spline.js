fetch('https://project-code-pqip.onrender.com/js/spline-3d.js')
  .then(r => r.text())
  .then(js => {
    require('fs').writeFileSync('remote_spline_3d.js', js, 'utf8');
    console.log('Saved remote_spline_3d.js, length: ' + js.length);
  })
  .catch(err => console.error('Fetch error:', err));