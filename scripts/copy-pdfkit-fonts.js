#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'node_modules', 'pdfkit', 'js', 'data');
const targetDir = path.join(__dirname, '..', '.next', 'server', 'pdfkit-fonts');

console.log('📋 Copiando fuentes de PDFKit...');
console.log(`   Desde: ${sourceDir}`);
console.log(`   Hacia: ${targetDir}`);

// Verificar que el directorio fuente existe
if (!fs.existsSync(sourceDir)) {
  console.error(`❌ Error: No se encontró el directorio fuente: ${sourceDir}`);
  process.exit(1);
}

// Asegurar que el directorio padre existe
const targetParentDir = path.dirname(targetDir);
if (!fs.existsSync(targetParentDir)) {
  fs.mkdirSync(targetParentDir, { recursive: true });
  console.log(`✅ Directorio padre creado: ${targetParentDir}`);
}

// Crear el directorio de destino si no existe
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`✅ Directorio de destino creado: ${targetDir}`);
}

// Copiar todos los archivos .afm e .icc
const files = fs.readdirSync(sourceDir);
let copied = 0;
let errors = 0;

files.forEach(file => {
  if (file.endsWith('.afm') || file.endsWith('.icc')) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    try {
      fs.copyFileSync(sourcePath, targetPath);
      copied++;
    } catch (error) {
      console.error(`⚠️  Error copiando ${file}:`, error.message);
      errors++;
    }
  }
});

if (copied > 0) {
  console.log(`✅ ${copied} archivos de fuentes copiados exitosamente`);
}

if (errors > 0) {
  console.error(`❌ ${errors} errores al copiar archivos`);
  process.exit(1);
}

console.log('✅ Fuentes de PDFKit copiadas correctamente');

