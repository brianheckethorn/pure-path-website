"""Read-only public question inventory. Never executes site JS or submits data."""
import hashlib
import html
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from pathlib import Path

SOURCE = 'https://yourpurepath.com/health-age-assessment.html'

class AttributeReader(HTMLParser):
    def handle_starttag(self, tag, attributes):
        self.attributes = dict(attributes)

def attributes(raw):
    reader = AttributeReader()
    reader.feed('<input ' + raw + '>')
    return reader.attributes

def text(raw):
    return html.unescape(re.sub('<[^>]+>', '', raw)).strip()

request = Request(SOURCE, headers={'User-Agent': 'YourPurePath read-only question inventory'})
with urlopen(request, timeout=20) as response:
    source_bytes = response.read()
source = source_bytes.decode('utf-8')
form = re.search(r'<form\b[^>]*\bid="health-age-form"[^>]*>([\s\S]*?)</form>', source).group(1)
sections = []
for match in re.finditer(r'<section\b[^>]*>([\s\S]*?)</section>', form):
    section_html = match.group(1)
    title = text(re.search(r'<h3[^>]*>([\s\S]*?)</h3>', section_html).group(1))
    fields = []
    for field in re.finditer(r'<label class="field">\s*<span>([\s\S]*?)</span>\s*<input\b([^>]*)>', section_html):
        attr = attributes(field.group(2))
        fields.append((field.start(), {
            'id': attr['name'], 'label': text(field.group(1)), 'kind': attr['type'],
            'source_min': attr.get('min'), 'source_max': attr.get('max'),
            'source_default': attr.get('value'), 'source_required': 'required' in attr
        }))
    for field in re.finditer(r'<fieldset\b[^>]*>([\s\S]*?)</fieldset>', section_html):
        field_html = field.group(1)
        label = text(re.search(r'<legend[^>]*>([\s\S]*?)</legend>', field_html).group(1))
        choices = []
        field_id = None
        for option in re.finditer(r'<input\b([^>]*)>\s*<span>([\s\S]*?)</span>', field_html):
            attr = attributes(option.group(1))
            field_id = attr['name']
            choices.append({'value': attr['value'], 'label': text(option.group(2)), 'source_selected': 'checked' in attr})
        fields.append((field.start(), {'id': field_id, 'label': label, 'kind': 'radio', 'choices': choices}))
    sections.append({'title': title, 'questions': [field for _, field in sorted(fields)]})

inventory = {
    'source_url': SOURCE,
    'retrieved_at_utc': datetime.now(timezone.utc).isoformat(),
    'source_html_sha256': hashlib.sha256(source_bytes).hexdigest(),
    'purpose': 'Question inventory and mapping only; original defaults are source metadata, never real responses or proposed defaults.',
    'question_count': sum(len(section['questions']) for section in sections),
    'sections': sections
}
if inventory['question_count'] != 22:
    raise RuntimeError('Source inventory differs from the inspected 22-input page; review before replacing inventory.')
destination = Path(__file__).resolve().parents[1] / 'ORIGINAL-ASSESSMENT-INVENTORY.json'
destination.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'inventory_file': str(destination), 'question_count': inventory['question_count'], 'sections': [section['title'] for section in sections]}, ensure_ascii=False))
