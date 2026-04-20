const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === 'dist' || file === '.git' || file === 'dist-backup') continue;
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findHtmlFiles(filePath, fileList);
        } else if (filePath.endsWith('.html')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const htmlFiles = findHtmlFiles(__dirname);
let totalLinks = 0;
let deadLinks = [];

const hrefRegex = /href="([^"]+)"/g;
const srcRegex = /src="([^"]+)"/g;

for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    
    const checkRegex = (regex, prefix) => {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const link = match[1];
            totalLinks++;
            
            // Skip external links, mailto, tel, anchors
            if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('#')) {
                continue;
            }
            
            // For root absolute paths
            let targetPath = '';
            if (link.startsWith('/')) {
                targetPath = path.join(__dirname, link);
            } else {
                targetPath = path.join(path.dirname(file), link);
            }
            
            // Clean up query params / hashes if any
            targetPath = targetPath.split('?')[0].split('#')[0];
            
            // If it's a directory link (e.g. /series/ghost/), assume index.html
            if (targetPath.endsWith('/') || targetPath.endsWith('\\') || fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
                targetPath = path.join(targetPath, 'index.html');
            }
            
            if (!fs.existsSync(targetPath)) {
                deadLinks.push({ file: path.relative(__dirname, file), link });
            }
        }
    };
    
    checkRegex(hrefRegex, 'href');
    checkRegex(srcRegex, 'src');
}

console.log(`Total HTML files scanned: ${htmlFiles.length}`);
console.log(`Total links checked: ${totalLinks}`);
if (deadLinks.length > 0) {
    console.log('\n--- DEAD LINKS FOUND ---');
    deadLinks.forEach(dl => console.log(`[${dl.file}] -> ${dl.link}`));
} else {
    console.log('\nAll internal links are valid!');
}
