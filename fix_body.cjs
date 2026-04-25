const fs = require('fs');

const dir = './admin';
fs.readdirSync(dir).forEach(file => {
    if (!file.endsWith('.html')) return;
    const path = dir + '/' + file;
    let content = fs.readFileSync(path, 'utf8');
    
    let changed = false;
    content = content.replace(/<body[\s\S]*?>/i, match => {
        let newMatch = match;
        // Remove lg:pl-72 if it exists
        newMatch = newMatch.replace(/lg:pl-72/g, '');
        // Add lg:pl-64 if missing
        if (!newMatch.includes('lg:pl-64')) {
            if (newMatch.includes('class="')) {
                newMatch = newMatch.replace('class="', 'class="pl-0 lg:pl-64 transition-all duration-300 ');
            } else {
                newMatch = newMatch.replace('<body', '<body class="pl-0 lg:pl-64 transition-all duration-300"');
            }
        }
        
        // Normalize any weird double spaces
        newMatch = newMatch.replace(/\s+/g, ' ');
        
        // Add a newline at the end if the original had one or just return the match
        if (newMatch !== match) changed = true;
        return newMatch;
    });
    
    if (changed) {
        fs.writeFileSync(path, content);
        console.log("Updated", path);
    }
});
