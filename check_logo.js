const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = html.match(/LOGO_SRC = "(data:image\/jpeg;base64,[^"]+)"/);
if (match) {
  const b64 = match[1].replace('data:image/jpeg;base64,', '');
  const buf = Buffer.from(b64, 'base64');
  fs.writeFileSync('public/logo.jpg', buf);
  console.log('Saved public/logo.jpg, length:', buf.length);
} else {
  console.log('No match found');
}
