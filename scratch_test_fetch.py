import urllib.request
import re

url = "https://tntenders.gov.in/nicgep/app"
req = urllib.request.Request(
    url, 
    headers={'User-Agent': 'Mozilla/5.0'}
)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    print(f"Successfully fetched. Length: {len(html)}")
    
    # Try to find some tender titles using basic regex
    # Based on the text content seen earlier, they look like links.
    # In nicgep, active tenders are usually in a table with class 'list_table' or similar, 
    # or inside specific anchor tags. Let's just find any 'a' tags that might have tender names.
    links = re.findall(r'<a.*?>(.*?)</a>', html, re.IGNORECASE | re.DOTALL)
    for link in links[:30]:
        text = link.strip()
        if text and len(text) > 10 and not text.startswith('<'):
            print(f"Found link text: {text}")

except Exception as e:
    print(f"Error: {e}")
