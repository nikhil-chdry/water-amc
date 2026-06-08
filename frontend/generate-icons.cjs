const sharp = require('sharp');
const fs    = require('fs');

if (!fs.existsSync('public/icons')) {
  fs.mkdirSync('public/icons', { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1e40af"/>
  <text x="256" y="340" font-size="300" text-anchor="middle" fill="white">💧</text>
</svg>
`);

sizes.forEach(size => {
  sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`)
    .then(() => console.log(`✅ icon-${size}x${size}.png created`))
    .catch(err => console.error(`❌ ${size}:`, err.message));
});