const fs = require('fs');
let html = fs.readFileSync('about.html', 'utf8');
const regex = /<!--\s*[^\n]+?\n\s*SECTION (\d+): ([^\n]+)\n\s*[^\n]+?-->/g;
html = html.replace(regex, (match, num, title) => {
    return `<!-- ======================================================\n     SECTION ${num}: ${title.trim()}\n====================================================== -->`;
});
fs.writeFileSync('about.html', html, 'utf8');
console.log('Replaced successfully');
