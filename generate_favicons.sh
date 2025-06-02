#!/bin/bash

# Install ImageMagick if not already present
if ! command -v convert &> /dev/null
then
    echo "ImageMagick not found. Installing..."
    apt-get update && apt-get install -y imagemagick
    echo "ImageMagick installed."
else
    echo "ImageMagick is already installed."
fi

# Navigate to the public directory
# Create the directory if it doesn't exist
mkdir -p client/public
cd client/public

# Define the source image
SOURCE_IMAGE="generated-icon.png"

# Check if the source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "Error: Source image $SOURCE_IMAGE not found in client/public/"
  exit 1
fi

# Generate favicon.ico (multiple sizes)
convert "$SOURCE_IMAGE" -resize 16x16 favicon-16.png
convert "$SOURCE_IMAGE" -resize 32x32 favicon-32.png
convert "$SOURCE_IMAGE" -resize 48x48 favicon-48.png
convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
rm favicon-16.png favicon-32.png favicon-48.png

# Generate other PNG favicons
convert "$SOURCE_IMAGE" -resize 16x16 favicon-16x16.png
convert "$SOURCE_IMAGE" -resize 32x32 favicon-32x32.png
convert "$SOURCE_IMAGE" -resize 192x192 android-chrome-192x192.png
convert "$SOURCE_IMAGE" -resize 512x512 android-chrome-512x512.png
convert "$SOURCE_IMAGE" -resize 180x180 apple-touch-icon.png

echo "Favicon files generated successfully:"
ls -l favicon.ico favicon-*.png android-chrome-*.png apple-touch-icon.png
