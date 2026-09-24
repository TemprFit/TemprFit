const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '..', 'app')).concat(walk(path.join(__dirname, '..', 'components'))).concat(walk(path.join(__dirname, '..', 'lib')));

let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace alert
  content = content.replace(/(?<!\w)alert\(/g, 'window.appAlert(');
  content = content.replace(/window\.window\.appAlert\(/g, 'window.appAlert('); // clean up window.alert

  // Replace confirm
  content = content.replace(/(?<!\w)confirm\(/g, 'await window.appConfirm(');
  content = content.replace(/window\.await window\.appConfirm\(/g, 'await window.appConfirm(');

  // Replace prompt
  content = content.replace(/(?<!\w)prompt\(/g, 'await window.appPrompt(');
  content = content.replace(/window\.await window\.appPrompt\(/g, 'await window.appPrompt(');

  // Quick fix: if an arrow function doesn't have async but uses await window.appConfirm
  // We'd have to find it, but maybe most are already async! Let's just apply it and we will manually fix any build errors.

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});

console.log(`Updated ${changedCount} files.`);
