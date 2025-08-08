const fs = require('fs');
const path = require('path');
const https = require('https');

// URLs for the Face-API.js model files from the GitHub repository
const modelFiles = [
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json',
    filename: 'face_expression_model-weights_manifest.json'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1',
    filename: 'face_expression_model-shard1'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
    filename: 'face_landmark_68_model-weights_manifest.json'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
    filename: 'face_landmark_68_model-shard1'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json',
    filename: 'ssd_mobilenetv1_model-weights_manifest.json'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1',
    filename: 'ssd_mobilenetv1_model-shard1'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2',
    filename: 'ssd_mobilenetv1_model-shard2'
  }
];

// Directory to save the models
const modelsDir = path.join(__dirname, 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir);
}

// Function to download a file
function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(modelsDir, filename);
    
    console.log(`Downloading ${filename}...`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename} successfully`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file if there was an error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Download all model files
async function downloadModels() {
  console.log('Downloading Face-API.js model files...');
  
  try {
    // Download new model files
    for (const modelFile of modelFiles) {
      await downloadFile(modelFile.url, modelFile.filename);
    }
    
    console.log('All model files downloaded successfully!');
  } catch (error) {
    console.error('Error downloading model files:', error);
  }
}

// Run the download
downloadModels();