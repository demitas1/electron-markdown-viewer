#!/bin/bash
# Markdown Viewer Installation Script

echo "=== Markdown Viewer Setup ==="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "Error: Failed to install dependencies."
    exit 1
fi

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Usage:"
echo "  npm start <markdown-file>"
echo ""
echo "Example:"
echo "  npm start test.md"
echo "  npm start /path/to/your/document.md"
echo ""
