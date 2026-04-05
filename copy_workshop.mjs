import fs from 'fs';
import path from 'path';

const SRC = 'TEMPLATE/AWS-Workshop-Template/content/5-Workshop';
const DST = 'content/workshop';

function copyWorkshopDir(srcDir, dstDir) {
    fs.mkdirSync(dstDir, { recursive: true });
    
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name);
        let dstName = entry.name;
        
        if (entry.isDirectory()) {
            copyWorkshopDir(srcPath, path.join(dstDir, dstName));
        } else {
            if (entry.name === '_index.md') dstName = 'index.en.md';
            else if (entry.name === '_index.vi.md') dstName = 'index.vi.md';
            
            let content = fs.readFileSync(srcPath, 'utf-8');
            // Strip Hugo frontmatter (--- ... ---)
            content = content.replace(/^---[\s\S]*?---\r?\n/, '');
            
            fs.writeFileSync(path.join(dstDir, dstName), content);
            console.log(`Copied: ${path.join(dstDir, dstName)}`);
        }
    }
}

// Clear existing workshop content first
if (fs.existsSync(DST)) {
    for (const entry of fs.readdirSync(DST, { withFileTypes: true })) {
        const fullPath = path.join(DST, entry.name);
        if (entry.isDirectory()) fs.rmSync(fullPath, { recursive: true });
        else fs.unlinkSync(fullPath);
    }
}

copyWorkshopDir(SRC, DST);
console.log('\n✅ Done! All workshop files copied successfully.');
