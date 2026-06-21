import os
import xml.etree.ElementTree as ET
import requests
from flask import Flask, render_template, jsonify

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_release_notes(xml_data):
    # Atom feed uses the namespace 'http://www.w3.org/2005/Atom'
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    try:
        root = ET.fromstring(xml_data)
    except ET.ParseError as e:
        print(f"XML Parsing Error: {e}")
        return []

    entries = []
    for entry in root.findall('atom:entry', namespaces):
        title_elem = entry.find('atom:title', namespaces)
        date_text = title_elem.text if title_elem is not None else "Unknown Date"
        
        updated_elem = entry.find('atom:updated', namespaces)
        updated_text = updated_elem.text if updated_elem is not None else ""
        
        link_elem = entry.find('atom:link', namespaces)
        link_href = ""
        if link_elem is not None:
            link_href = link_elem.attrib.get('href', '')
            
        content_elem = entry.find('atom:content', namespaces)
        content_html = content_elem.text if content_elem is not None else ""
        
        entries.append({
            'date': date_text,
            'updated': updated_text,
            'link': link_href,
            'content': content_html
        })
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        # Fetch the feed
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
        notes = parse_release_notes(response.content)
        return jsonify({'success': True, 'data': notes})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    # Defaulting to port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)
