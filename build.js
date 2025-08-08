const fs = require('fs');
const path = require('path');

console.log('🚀 Building MoodTune Scanner for Netlify deployment...');

// Check if all required files exist
const requiredFiles = [
    'index.html',
    'script.js',
    'style.css',
    'netlify.toml',
    'netlify/functions/api.js',
    'netlify/functions/package.json',
    'models/face_expression_model-weights_manifest.json',
    'models/face_landmark_68_model-weights_manifest.json',
    'models/ssd_mobilenetv1_model-weights_manifest.json'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.error('❌ Some required files are missing. Please ensure all files are present.');
    process.exit(1);
}

// Check models directory
const modelsDir = 'models';
if (fs.existsSync(modelsDir)) {
    const modelFiles = fs.readdirSync(modelsDir);
    console.log(`📦 Models directory contains ${modelFiles.length} files`);
    modelFiles.forEach(file => {
        console.log(`   - ${file}`);
    });
} else {
    console.log('⚠️  Models directory not found - face detection may not work');
}

console.log('\n🎉 Build completed successfully!');
console.log('📋 Next steps:');
console.log('   1. Push your code to GitHub');
console.log('   2. Connect your repository to Netlify');
console.log('   3. Deploy!');
console.log('\n🔗 Your app will be available at: https://your-app-name.netlify.app');
