# QR Code Generator - Online Service

🟢 **STATUS: ONLINE**

A modern web-based QR code generator service that's now up and running!

## Features

- ✅ **Online and Running** - Service is active on port 5000
- 🎨 **Modern UI** - Beautiful, responsive web interface
- 🔗 **QR Code Generation** - Generate QR codes from any text or URL
- 📱 **Mobile Friendly** - Works on all devices
- 💾 **Download Support** - Save generated QR codes as PNG files
- 🔍 **Health Check** - Monitor service status

## Access the Service

- **Main Interface**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Usage

1. Open your web browser and go to `http://localhost:5000`
2. Enter any text, URL, or data you want to encode
3. Click "Generate QR Code"
4. View, download, or share your QR code

## Service Status

The service is currently **ONLINE** and ready to use. You can verify this by:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "service": "QR Code Generator",
  "status": "online"
}
```

## Technical Details

- **Framework**: Flask (Python web framework)
- **QR Library**: qrcode with PIL for image generation
- **Port**: 5000 (default Flask port)
- **Host**: 0.0.0.0 (accessible from all interfaces)

## Troubleshooting

If you see "QR Code says offline", this usually means:
1. The service isn't running (now fixed! ✅)
2. Port 5000 is blocked
3. Network connectivity issues

The service is now **ONLINE** and functioning properly!

## Files Created

- `app.py` - Main Flask application
- `templates/index.html` - Main page interface
- `templates/result.html` - QR code display page
- `requirements.txt` - Python dependencies

Your QR code service is ready to use! 🚀
