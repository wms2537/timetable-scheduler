#!/usr/bin/env python3
"""
Simple HTTP Server for testing the School Scheduler web interface.
"""

import http.server
import socketserver
import os
import webbrowser
import json
from urllib.parse import urlparse
from index import handler

# Configuration
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with directory override."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def log_message(self, format, *args):
        """Override to add color and make logs more readable."""
        if args[0].startswith('GET'):
            path = urlparse(args[1]).path
            self.log_colored(f"\033[1;32mGET\033[0m {path} - \033[1;34m{args[2]}\033[0m")
        elif args[0].startswith('POST'):
            path = urlparse(args[1]).path
            self.log_colored(f"\033[1;35mPOST\033[0m {path} - \033[1;34m{args[2]}\033[0m")
        else:
            self.log_colored(f"\033[1;33m{args[0]}\033[0m {args[1]} - \033[1;34m{args[2]}\033[0m")
    
    def log_colored(self, message):
        """Print colorized log message."""
        print(message)
    
    def do_POST(self):
        """Handle POST requests for the API endpoint."""
        if self.path == '/api/schedule':
            # Get content length from header
            content_length = int(self.headers['Content-Length'])
            # Read the data
            post_data = self.rfile.read(content_length)
            
            # Parse JSON data
            try:
                event = json.loads(post_data.decode('utf-8'))
                # Call the handler function from index.py
                result = handler(event, {})
                
                # Get status code from result or default to 200
                status_code = result.get('statusCode', 200)
                
                # Send response
                self.send_response(status_code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')  # For CORS
                self.end_headers()
                
                # Send the response body
                if isinstance(result.get('body'), str):
                    self.wfile.write(result['body'].encode('utf-8'))
                else:
                    self.wfile.write(json.dumps(result.get('body', {})).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            # Not an API endpoint, return 404
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server():
    """Start the HTTP server and open browser."""
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/"
        print(f"\033[1;36m=== School Scheduler Development Server ===\033[0m")
        print(f"\033[1;32mServer running at: \033[1;34m{url}\033[0m")
        print(f"\033[1;33mAPI endpoint: \033[1;34m{url}api/schedule\033[0m")
        print(f"\033[1;33mPress Ctrl+C to stop.\033[0m\n")
        
        # Open browser automatically
        webbrowser.open(url)
        
        # Serve until interrupted
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\033[1;33mServer stopped.\033[0m")

if __name__ == "__main__":
    run_server() 