#!/usr/bin/env python
"""
HTTPS server for Event Matcher application with self-signed certificates
For Auth0 development that requires HTTPS
"""

import sys
import os
import ssl
import tempfile
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

class CORSRequestHandler(SimpleHTTPRequestHandler):
    """HTTP request handler with CORS headers."""
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def guess_type(self, path):
        mimetype = super().guess_type(path)
        if path.endswith('.js'):
            mimetype = 'application/javascript'
        elif path.endswith('.mjs'):
            mimetype = 'application/javascript'
        return mimetype

def create_self_signed_cert():
    """Create self-signed certificate for local development."""
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        import datetime
        
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        
        # Certificate details
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Development"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Localhost"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Event Matcher Dev"),
            x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
        ])
        
        # Create certificate
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.utcnow()
        ).not_valid_after(
            datetime.datetime.utcnow() + datetime.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName("localhost"),
                x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
            ]),
            critical=False,
        ).sign(private_key, hashes.SHA256())
        
        # Write certificate and key to temporary files
        cert_dir = Path(tempfile.gettempdir()) / "event-matcher-ssl"
        cert_dir.mkdir(exist_ok=True)
        
        cert_file = cert_dir / "cert.pem"
        key_file = cert_dir / "key.pem"
        
        with open(cert_file, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        with open(key_file, "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        return str(cert_file), str(key_file)
        
    except ImportError:
        print("❌ cryptography package not installed.")
        print("Install with: pip install cryptography")
        print("Or use simple self-signed cert generation below...")
        return None, None

def create_simple_cert():
    """Create self-signed certificate using openssl command."""
    cert_dir = Path(tempfile.gettempdir()) / "event-matcher-ssl"
    cert_dir.mkdir(exist_ok=True)
    
    cert_file = cert_dir / "cert.pem"
    key_file = cert_dir / "key.pem"
    
    # Generate certificate using openssl
    import subprocess
    try:
        subprocess.run([
            'openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-keyout', str(key_file),
            '-out', str(cert_file), '-days', '365', '-nodes', '-subj',
            '/C=US/ST=Development/L=Localhost/O=Event Matcher Dev/CN=localhost'
        ], check=True, capture_output=True)
        
        return str(cert_file), str(key_file)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ OpenSSL not available or failed.")
        return None, None

def run_https(port=8443):
    """Start the HTTPS server."""
    # Try to create certificates
    cert_file, key_file = create_self_signed_cert()
    if not cert_file:
        cert_file, key_file = create_simple_cert()
    
    if not cert_file or not key_file:
        print("❌ Could not create SSL certificates.")
        print("Please install 'cryptography' package or 'openssl' command.")
        print("Fallback: Use regular HTTP server instead.")
        return False
    
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    
    # Create SSL context
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(cert_file, key_file)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print(f"🔒 Event Matcher HTTPS Server")
    print(f"=============================")
    print(f"Server running on https://localhost:{port}")
    print(f"Open https://localhost:{port}/public/ in your browser")
    print(f"")
    print(f"⚠️  You'll see a security warning - click 'Advanced' → 'Proceed to localhost'")
    print(f"   This is normal for self-signed certificates in development.")
    print(f"")
    print(f"🔧 For Auth0, use these URLs:")
    print(f"   Callback URL: https://localhost:{port}/public/index.html")
    print(f"   Logout URL: https://localhost:{port}/public/index.html")
    print(f"   Web Origin: https://localhost:{port}")
    print(f"")
    print(f"Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.shutdown()
    
    return True

def run_http(port=8080):
    """Fallback to HTTP server."""
    print("Falling back to HTTP server...")
    from server import run
    run(port)

if __name__ == '__main__':
    port = 8443  # Standard HTTPS development port
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port number: {sys.argv[1]}")
            sys.exit(1)
    
    # Add cryptography import check
    try:
        import ipaddress
    except ImportError:
        print("Installing required package...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "cryptography"])
        import ipaddress
    
    success = run_https(port)
    if not success:
        run_http(8080) 