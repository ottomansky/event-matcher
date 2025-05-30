#!/bin/bash

# Start Event Matcher with HTTPS for Auth0 development
# This creates self-signed certificates for local development

echo "🔒 Starting Event Matcher with HTTPS..."
echo "======================================="

# Install cryptography package if needed
python3 -c "import cryptography" 2>/dev/null || {
    echo "📦 Installing cryptography package..."
    pip3 install cryptography
}

# Start HTTPS server
python3 https-server.py $1

echo "Done!" 