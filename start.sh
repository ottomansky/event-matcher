#!/bin/bash

# Event Matcher Start Script
# This script starts the local server for the Event Matcher application

echo "Starting Event Matcher..."
echo "========================="

# Check if Python 3 is available
if command -v python3 &> /dev/null
then
    echo "Using Python 3"
    python3 server.py
# Check if Python 2 is available
elif command -v python &> /dev/null
then
    echo "Using Python 2"
    python server.py
else
    echo "Python is not installed. Please install Python to run the server."
    echo "Alternatively, you can use any other local web server."
    exit 1
fi 