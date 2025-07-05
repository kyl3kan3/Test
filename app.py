from flask import Flask, render_template, request, send_file
import qrcode
import io
import base64
from PIL import Image

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_qr():
    data = request.form.get('data', '')
    if not data:
        return "No data provided", 400
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64 for display
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    img_str = base64.b64encode(img_buffer.getvalue()).decode()
    
    return render_template('result.html', qr_code=img_str, data=data)

@app.route('/health')
def health_check():
    return {'status': 'online', 'service': 'QR Code Generator'}, 200

if __name__ == '__main__':
    print("QR Code Generator is starting...")
    print("Service will be available at http://localhost:5000")
    print("Health check available at http://localhost:5000/health")
    app.run(host='0.0.0.0', port=5000, debug=True)