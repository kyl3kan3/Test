#!/bin/bash

# Simple script to download zip files using curl or wget
# Usage: ./download.sh <URL> [output_filename]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <URL> [output_filename]"
    echo "Example: $0 https://example.com/file.zip"
    echo "Example: $0 https://example.com/file.zip myfile.zip"
    exit 1
fi

URL="$1"
OUTPUT_FILE="$2"

# Extract filename from URL if not provided
if [ -z "$OUTPUT_FILE" ]; then
    OUTPUT_FILE=$(basename "$URL")
    if [[ "$OUTPUT_FILE" != *.zip ]]; then
        OUTPUT_FILE="$OUTPUT_FILE.zip"
    fi
fi

echo "Downloading: $URL"
echo "Saving to: $OUTPUT_FILE"

# Try curl first, then wget
if command -v curl &> /dev/null; then
    curl -L -o "$OUTPUT_FILE" "$URL"
    RESULT=$?
elif command -v wget &> /dev/null; then
    wget -O "$OUTPUT_FILE" "$URL"
    RESULT=$?
else
    echo "Error: Neither curl nor wget is available. Please install one of them or use the Python script."
    exit 1
fi

if [ $RESULT -eq 0 ]; then
    echo "Download completed successfully!"
    echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
else
    echo "Download failed!"
    exit 1
fi