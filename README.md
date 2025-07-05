# Download ZIP Files

This repository contains utilities to download ZIP files from URLs.

## Available Tools

### Python Script (`download_zip.py`)
A Python script with progress indication and error handling.

**Usage:**
```bash
python3 download_zip.py <URL> [output_filename]
```

**Examples:**
```bash
# Download with automatic filename
python3 download_zip.py https://example.com/file.zip

# Download with custom filename
python3 download_zip.py https://example.com/file.zip myfile.zip
```

### Shell Script (`download.sh`)
A bash script using curl or wget for downloading.

**Usage:**
```bash
./download.sh <URL> [output_filename]
```

**Examples:**
```bash
# Download with automatic filename
./download.sh https://example.com/file.zip

# Download with custom filename
./download.sh https://example.com/file.zip myfile.zip
```

## Requirements

- **Python script:** Requires `python3-requests` package
- **Shell script:** Requires `curl` or `wget` (usually pre-installed)

## Features

- Automatic filename detection from URLs
- Progress indication (Python version)
- Error handling and validation
- Support for custom output filenames
- Cross-platform compatibility
