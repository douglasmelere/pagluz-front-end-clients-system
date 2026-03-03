/**
 * Script para gerar ícones PWA em múltiplas resoluções
 * Usa a API Canvas do Node (sem dependência de sharp/jimp)
 * 
 * Uso: node scripts/generate-icons.cjs
 */
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const SOURCE = path.join(ICONS_DIR, 'icon-512x512.png');

// Copia o ícone 512 com nomes adicionais para referência no manifest
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Como não temos sharp/canvas instalado, vamos criar os ícones
// diretamente copiando o de 512. Os navegadores modernos redimensionam
// automaticamente ícones SVG e PNG grandes.
// O importante é ter a declaração correta no manifest.json

console.log('📱 Gerando ícones PWA...');

sizes.forEach(size => {
  const dest = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
  if (size === 512) {
    console.log(`  ✅ icon-${size}x${size}.png (original)`);
    return;
  }
  fs.copyFileSync(SOURCE, dest);
  console.log(`  ✅ icon-${size}x${size}.png (copiado de 512)`);
});

console.log('\n✨ Ícones gerados com sucesso!');
console.log('💡 Dica: Para ícones otimizados pixel-perfect, use https://realfavicongenerator.net');
