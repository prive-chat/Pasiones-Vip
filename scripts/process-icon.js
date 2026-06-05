import Jimp from 'jimp';
import path from 'path';
import fs from 'fs';

async function processIcon() {
  try {
    const inputPath = 'icon.jpg';
    console.log(`Loading image from: ${inputPath}...`);
    const image = await Jimp.read(inputPath);
    
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    console.log(`Original dimensions: ${width}x${height} (Aspect Ratio: ${(width / height).toFixed(4)})`);
    
    // Sample the corner color to detect background
    const cornerColorInt = image.getPixelColor(0, 0);
    const bgR = (cornerColorInt >> 24) & 0xFF;
    const bgG = (cornerColorInt >> 16) & 0xFF;
    const bgB = (cornerColorInt >> 8) & 0xFF;
    const bgHex = `#${bgR.toString(16).padStart(2,'0')}${bgG.toString(16).padStart(2,'0')}${bgB.toString(16).padStart(2,'0')}`;
    console.log(`Detected background color at 0,0: ${bgHex} (R:${bgR}, G:${bgG}, B:${bgB})`);

    // We will scan the image and set pixels close to the background color as transparent.
    // Since some icons might have anti-aliased edges, we design a smooth transparency falloff or 
    // simply a strict threshold with high tolerance.
    const tolerance = 45; // Adjust tolerance as needed (0 to 255)
    
    console.log(`Scanning image and removing background color with tolerance of ${tolerance}...`);
    
    // Ensure the image has an alpha channel enabled
    image.rgba(true);
    
    image.scan(0, 0, width, height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // Calculate Euclidean distance in RGB space
      const distance = Math.sqrt(
        Math.pow(r - bgR, 2) +
        Math.pow(g - bgG, 2) +
        Math.pow(b - bgB, 2)
      );
      
      if (distance < tolerance) {
        // Set completely transparent
        this.bitmap.data[idx + 3] = 0;
      } else if (distance < tolerance + 15) {
        // Semi-transparent transition for anti-aliasing smoothing
        const factor = (distance - tolerance) / 15;
        this.bitmap.data[idx + 3] = Math.round(factor * 255);
      }
    });

    const isSquare = width === height;
    
    const SIZES = [
      { name: 'apple-touch-icon.png', size: 180 },
      { name: 'icon-192.png', size: 192 },
      { name: 'icon-512.png', size: 512 },
      { name: 'favicon-32.png', size: 32 },
      { name: 'favicon-16.png', size: 16 },
      { name: 'icon.png', size: 512 }
    ];

    for (const asset of SIZES) {
      console.log(`Generating ${asset.name} (${asset.size}x${asset.size})...`);
      let resizedImage;
      
      if (isSquare) {
        resizedImage = image.clone().resize(asset.size, asset.size);
      } else {
        resizedImage = image.clone();
        const aspect = width / height;
        let newW, newH;
        if (aspect > 1) {
          newW = asset.size;
          newH = Math.round(asset.size / aspect);
        } else {
          newH = asset.size;
          newW = Math.round(asset.size * aspect);
        }
        
        resizedImage.resize(newW, newH);
        
        // Background canvas is completely transparent (alpha = 0)
        const canvas = new Jimp(asset.size, asset.size, 0x00000000);
        const xOffset = Math.round((asset.size - newW) / 2);
        const yOffset = Math.round((asset.size - newH) / 2);
        canvas.composite(resizedImage, xOffset, yOffset);
        resizedImage = canvas;
      }
      
      const outputPath = path.join('public', asset.name);
      
      // Prevent UTF-8 binary corruption by writing raw Buffer via native fs.writeFileSync
      const buffer = await resizedImage.getBufferAsync(Jimp.MIME_PNG);
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`Successfully wrote: ${outputPath}`);
    }
    
    console.log('--- ALL BRAND ASSETS SUCCESSFULLY GENERATED AND BACKGROUND REMOVED ---');
  } catch (error) {
    console.error('Error generating assets:', error);
    process.exit(1);
  }
}

processIcon();
