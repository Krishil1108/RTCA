const fs = require('fs');
const path = require('path');

// Create SVG logo with letter "A"
function createSVGLogo(size) {
    return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1976d2;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1565c0;stop-opacity:1" />
        </linearGradient>
    </defs>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#grad)" />
    <text x="${size/2}" y="${size/2}" 
          text-anchor="middle" 
          dominant-baseline="central" 
          font-family="Arial, sans-serif" 
          font-weight="bold" 
          font-size="${size * 0.6}" 
          fill="white">A</text>
</svg>`;
}

// Create favicon ICO content (simplified)
function createFaviconSVG() {
    return `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1976d2;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1565c0;stop-opacity:1" />
        </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="16" fill="url(#grad)" />
    <text x="16" y="16" 
          text-anchor="middle" 
          dominant-baseline="central" 
          font-family="Arial, sans-serif" 
          font-weight="bold" 
          font-size="20" 
          fill="white">A</text>
</svg>`;
}

// Save logos
const clientPublicPath = path.join(__dirname, 'client', 'public');

// Create logo192.svg
fs.writeFileSync(path.join(clientPublicPath, 'logo192.svg'), createSVGLogo(192));
console.log('✅ Created logo192.svg');

// Create logo512.svg  
fs.writeFileSync(path.join(clientPublicPath, 'logo512.svg'), createSVGLogo(512));
console.log('✅ Created logo512.svg');

// Create favicon.svg
fs.writeFileSync(path.join(clientPublicPath, 'favicon.svg'), createFaviconSVG());
console.log('✅ Created favicon.svg');

console.log('🎉 All logos created successfully!');
console.log('Note: SVG logos will work perfectly for PWA. For better compatibility, you can convert them to PNG using an online converter.');
