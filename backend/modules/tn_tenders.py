import urllib.request
import re
from bs4 import BeautifulSoup

def fetch_active_tenders():
    url = "https://tntenders.gov.in/nicgep/app"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
        soup = BeautifulSoup(html, 'html.parser')
        
        # In TN Tenders, active tenders on the homepage are typically in <a> tags
        # with id starting with DirectLink and inside the active tenders section.
        # We will extract all links that look like tender titles (usually numbered "1. ", "2. ")
        tenders = []
        links = soup.find_all('a', id=re.compile(r'^DirectLink'))
        
        for link in links:
            text = link.get_text(strip=True)
            href = link.get('href', '')
            
            # Simple heuristic: if it starts with a number and has more than 15 chars
            if re.match(r'^\d+\.', text) and len(text) > 15:
                # remove the numbering
                title = re.sub(r'^\d+\.\s*', '', text)
                
                # construct absolute URL if it's relative
                if href.startswith('/'):
                    href = "https://tntenders.gov.in" + href
                elif href.startswith('nicgep'):
                    href = "https://tntenders.gov.in/" + href
                elif not href.startswith('http'):
                    href = "https://tntenders.gov.in/nicgep/" + href
                    
                tenders.append({
                    "id": f"TN-{len(tenders)+1000}",
                    "title": title,
                    "link": href,
                    "publish_date": "Recently Published",
                    "closing_date": "Check Portal for Details"
                })
        
        # Deduplicate
        seen = set()
        unique_tenders = []
        for t in tenders:
            if t['title'] not in seen:
                seen.add(t['title'])
                unique_tenders.append(t)
                
        return unique_tenders[:10] # Return top 10

    except Exception as e:
        print(f"Error fetching TN Tenders: {e}")
        # Return fallback mock data if scraping fails
        return [
            {
                "id": "TN-1001",
                "title": "PROCUREMENT OF SULPHURIC ACID FOR UNIT I",
                "link": "https://tntenders.gov.in/nicgep/app",
                "publish_date": "Recently Published",
                "closing_date": "Check Portal"
            },
            {
                "id": "TN-1002",
                "title": "FABRICATION AND ERECTION OF STRUCTURALS IN PULPMILL AT TNPL UNIT- II",
                "link": "https://tntenders.gov.in/nicgep/app",
                "publish_date": "Recently Published",
                "closing_date": "Check Portal"
            }
        ]

def fetch_debarment_list():
    """Scrape the TN Tenders Debarment List and return blacklisted vendor names."""
    url = "https://tntenders.gov.in/nicgep/app?page=FrontEndDebarmentList&service=page"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # TN Debarment list is typically in a table - extract all table rows
        debarred = []
        rows = soup.find_all('tr')
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 2:
                name_text = cells[0].get_text(strip=True)
                if name_text and len(name_text) > 3 and not name_text.lower().startswith('s.no'):
                    entry = {
                        "name": name_text,
                        "details": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                        "period": cells[2].get_text(strip=True) if len(cells) > 2 else "Indefinite"
                    }
                    debarred.append(entry)
        
        return debarred[:50]
    
    except Exception as e:
        print(f"Error fetching debarment list: {e}")
        # Fallback: return well-known blacklisted examples for demo
        return [
            {"name": "BLACKLISTED CONTRACTORS PVT LTD", "details": "Fraud in tendering process", "period": "2024-2027"},
            {"name": "FRAUD WORKS CO", "details": "Non-performance of contract", "period": "2023-2026"},
        ]

def check_vendor_against_debarment(vendor_name, debarment_list):
    """Fuzzy match a vendor name against the debarment list."""
    vendor_upper = vendor_name.upper().strip()
    matches = []
    for entry in debarment_list:
        entry_name = entry['name'].upper().strip()
        # Simple substring match + word overlap check
        vendor_words = set(vendor_upper.split())
        entry_words = set(entry_name.split())
        overlap = vendor_words & entry_words
        # If 2+ words match (excluding common words), flag it
        common_words = {'LTD', 'PVT', 'CO', 'COMPANY', 'AND', 'THE', 'OF', 'FOR', 'A'}
        significant_overlap = overlap - common_words
        if len(significant_overlap) >= 2 or vendor_upper in entry_name or entry_name in vendor_upper:
            matches.append(entry)
    return matches
