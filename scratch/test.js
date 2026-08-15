const html = "<table><tr><td>Patient Name:</td><td>John Doe</td><td>Age:</td><td>30</td></tr></table><p>Observation:</p><p>Normal.</p>";
let text = html.replace(/<br\s*\/?>/gi, '\n')
               .replace(/<\/p>/gi, '\n\n')
               .replace(/<\/tr>/gi, '\n')
               .replace(/<\/td>/gi, '    ')
               .replace(/<\/th>/gi, '    ')
               .replace(/<\/h[1-6]>/gi, '\n\n')
               .replace(/<[^>]+>/g, '')
               .replace(/&nbsp;/g, ' ')
               .replace(/\n\s*\n\s*\n+/g, '\n\n');
console.log(text.trim());
