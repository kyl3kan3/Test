#!/usr/bin/env python3
"""
Simple script to download zip files from URLs
"""

import sys
import requests
import os
from urllib.parse import urlparse
from pathlib import Path

def download_zip(url, output_path=None):
    """
    Download a zip file from the given URL
    
    Args:
        url (str): The URL of the zip file to download
        output_path (str): Optional path to save the file (defaults to filename from URL)
    """
    try:
        # Parse the URL to get filename
        parsed_url = urlparse(url)
        if not output_path:
            output_path = os.path.basename(parsed_url.path)
            if not output_path.endswith('.zip'):
                output_path += '.zip'
        
        print(f"Downloading {url}...")
        print(f"Saving to: {output_path}")
        
        # Download the file
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Get file size for progress
        total_size = int(response.headers.get('content-length', 0))
        
        with open(output_path, 'wb') as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        print(f"\rProgress: {progress:.1f}%", end='', flush=True)
        
        print(f"\nDownload completed: {output_path}")
        print(f"File size: {os.path.getsize(output_path)} bytes")
        
    except requests.exceptions.RequestException as e:
        print(f"Error downloading file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("Usage: python download_zip.py <URL> [output_filename]")
        print("Example: python download_zip.py https://example.com/file.zip")
        sys.exit(1)
    
    url = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    download_zip(url, output_path)

if __name__ == "__main__":
    main()