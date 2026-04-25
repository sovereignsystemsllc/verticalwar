const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (!['dist', 'node_modules', '.git', '.agents'].includes(file)) {
                results = results.concat(walkDir(filePath));
            }
        } else {
            if (file.endsWith('.html')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const allHtml = walkDir('.');

allHtml.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Only apply to files that use the sidebar
    if (!content.includes('sidebar.js')) return;
    
    let changed = false;
    content = content.replace(/<body[\s\S]*?>/i, match => {
        let newMatch = match;
        // Remove lg:pl-72 or lg:pl-64 to avoid duplicates
        newMatch = newMatch.replace(/lg:pl-72/g, '');
        newMatch = newMatch.replace(/lg:pl-64/g, '');
        newMatch = newMatch.replace(/pl-0/g, '');
        newMatch = newMatch.replace(/transition-all duration-300/g, ''); // avoid duplicates
        
        // Normalize any weird double spaces
        newMatch = newMatch.replace(/\s+/g, ' ');
        
        // Add pl-0 lg:pl-64 transition-all duration-300
        if (newMatch.includes('class="')) {
            newMatch = newMatch.replace('class="', 'class="pl-0 lg:pl-64 transition-all duration-300 ');
        } else {
            newMatch = newMatch.replace('<body', '<body class="pl-0 lg:pl-64 transition-all duration-300"');
        }
        
        // Normalize spaces again
        newMatch = newMatch.replace(/\s+/g, ' ');
        
        if (newMatch !== match) changed = true;
        return newMatch;
    });
    
    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log("Updated", filePath);
    }
});
