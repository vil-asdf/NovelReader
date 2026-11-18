import sys
import json
import zipfile
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
import os

class ParagraphExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_p = False
        self.in_h = False
        self.current = []
        self.paragraphs = []
        self.headings = []

    def handle_starttag(self, tag, attrs):
        if tag == 'p':
            self.in_p = True
            self.current = []
        elif tag in ('h1', 'h2', 'h3'):
            self.in_h = True
            self.current = []

    def handle_endtag(self, tag):
        if tag == 'p' and self.in_p:
            text = ''.join(self.current).strip()
            if text:
                self.paragraphs.append(text)
            self.in_p = False
        elif tag in ('h1', 'h2', 'h3') and self.in_h:
            text = ''.join(self.current).strip()
            if text:
                self.headings.append(text)
            self.in_h = False

    def handle_data(self, data):
        if self.in_p or self.in_h:
            self.current.append(data)

def convert_epub(epub_path, output_path='data/chapters.json'):
    with zipfile.ZipFile(epub_path, 'r') as z:
        container = ET.fromstring(z.read('META-INF/container.xml'))
        opf_path = container.find('.//{*}rootfile').attrib['full-path']
        opf_dir = os.path.dirname(opf_path)
        opf = ET.fromstring(z.read(opf_path))

        title_el = opf.find('.//{*}title')
        creator_el = opf.find('.//{*}creator')
        desc_el = opf.find('.//{*}description')

        title = title_el.text.strip() if title_el is not None and title_el.text else 'Novel Title'
        author = creator_el.text.strip() if creator_el is not None and creator_el.text else 'Author Name'
        synopsis = desc_el.text.strip() if desc_el is not None and desc_el.text else ''

        manifest = {}
        for item in opf.findall('.//{*}manifest/{*}item'):
            manifest[item.attrib['id']] = item.attrib['href']

        spine_ids = [itemref.attrib['idref'] for itemref in opf.findall('.//{*}spine/{*}itemref')]

        chapters = []
        chap_num = 1
        for idref in spine_ids:
            href = manifest.get(idref)
            if not href:
                continue
            full_href = os.path.normpath(os.path.join(opf_dir, href)).replace('\\', '/')
            if full_href not in z.namelist():
                continue
            raw_html = z.read(full_href).decode('utf-8', errors='ignore')
            parser = ParagraphExtractor()
            parser.feed(raw_html)

            if len(parser.paragraphs) >= 2:
                chap_title = parser.headings[0] if parser.headings else f'Chapter {chap_num}'
                chapters.append({
                    'number': chap_num,
                    'title': chap_title,
                    'paragraphs': parser.paragraphs
                })
                chap_num += 1

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'title': title,
            'author': author,
            'synopsis': synopsis,
            'chapters': chapters
        }, f, ensure_ascii=False, indent=2)

    print(f'Successfully exported {len(chapters)} chapters to {output_path}')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python epub_to_json.py <path_to_file.epub>')
        sys.exit(1)
    convert_epub(sys.argv[1])
