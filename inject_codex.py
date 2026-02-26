import os
import requests
from bs4 import BeautifulSoup
import json
import time
import base64

# Load .env file manually to avoid pip dependencies
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                key, val = line.split('=', 1)
                os.environ[key] = val.strip(' "\'')

# Configuration
SUPABASE_URL = "https://zazzwdaexhkeusfjdphv.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_KEY:
    print("CRITICAL ERROR: SUPABASE_KEY is missing. Create a .env file and add your secret key.")
    exit(1)

AUTHOR_UUID = "5abcdeb3-0d75-4201-ba36-2f0c9d7a41ff"

urls_and_series = [
    # THE LIVING STORYBOOK (Doctrine)
    ("https://constructamiracle.com/p/the-living-storybook-part-1-a-hundred", "Doctrine"),
    ("https://constructamiracle.com/p/the-living-storybook-part-15-my-constructed", "Doctrine"),
    ("https://constructamiracle.com/p/the-flint-indictment-a-blueprint", "Doctrine"),
    ("https://constructamiracle.com/p/the-living-storybook-part-2-the-gears", "Doctrine"),
    ("https://constructamiracle.com/p/the-brand-shield-indictment", "Doctrine"),
    ("https://constructamiracle.com/p/the-living-storybook-part-3-the-three", "Doctrine"),
    ("https://constructamiracle.com/p/the-prison-schematic-an-indictment", "Doctrine"),
    ("https://constructamiracle.com/p/members-only-inside-the-forge-5-the", "Doctrine"),
    ("https://constructamiracle.com/p/re-educating-the-imagination-notes", "Doctrine"),
    ("https://constructamiracle.com/p/the-dreamspace-indictment", "Doctrine"),
    ("https://constructamiracle.com/p/the-collapse-of-shared-reality", "Doctrine"),
    ("https://constructamiracle.com/p/a-century-old-nazi-operation-became", "Doctrine"),

    # THE SHADOW ARC (Dispatch)
    ("https://constructamiracle.com/p/the-financial-coup-we-mistook-for", "Dispatch"),
    ("https://constructamiracle.com/p/911-solved-a-trillion-dollar-problem", "Dispatch"),
    ("https://constructamiracle.com/p/the-system-switch", "Dispatch"),
    ("https://constructamiracle.com/p/how-crime-became-a-business-expense", "Dispatch"),
    ("https://constructamiracle.com/p/the-empires-captured-wheel-breaking", "Dispatch"),
    ("https://commonsenserebel.substack.com/p/the-exposure-the-suicide-of-the-system", "Dispatch"),
    ("https://commonsenserebel.substack.com/p/fuck-the-culture-war", "Dispatch"),
    ("https://commonsenserebel.substack.com/p/they-will-leave-us-to-die-and-we", "Dispatch"),

    # WAR ON ILLUSION (Dispatch)
    ("https://constructamiracle.com/p/the-illusion-index", "Dispatch"),
    ("https://constructamiracle.com/p/how-they-turned-your-home-into-a", "Dispatch"),
    ("https://constructamiracle.com/p/how-they-turned-starvation-into-a", "Dispatch"),
    ("https://constructamiracle.com/p/the-liquid-siege-the-financialization", "Dispatch"),
    ("https://constructamiracle.com/p/why-your-electric-bill-is-a-bank", "Dispatch"),
    ("https://constructamiracle.com/p/no-incentive-to-heal", "Dispatch"),
    ("https://constructamiracle.com/p/the-financial-siege-the-war-on-illusion", "Dispatch"),
    ("https://constructamiracle.com/p/watch-the-war-on-illusion-i-want", "Dispatch"),

    # INSIDE THE FORGE (Inside the Forge)
    ("https://constructamiracle.com/p/members-only-inside-the-forge-a-lesson", "Inside the Forge"),
    ("https://constructamiracle.com/p/members-only-inside-the-forge-2-the", "Inside the Forge"),
    ("https://constructamiracle.com/p/members-only-inside-the-forge-3-the", "Inside the Forge"),
    ("https://constructamiracle.com/p/members-only-inside-the-forge-4-planting", "Inside the Forge"),
    ("https://constructamiracle.com/p/members-only-inside-the-forge-6-from", "Inside the Forge"),
    ("https://constructamiracle.com/p/members-only-inside-the-forge-7-the", "Inside the Forge"),
    ("https://constructamiracle.com/p/members-only-inside-the-forge-8-the", "Inside the Forge"),
    ("https://constructamiracle.com/p/members-only-inside-the-forge-9-state", "Inside the Forge"),
    ("https://constructamiracle.com/p/members-only-inside-the-forge-10", "Inside the Forge"),
    ("https://constructamiracle.com/p/members-only-inside-the-forge-11", "Inside the Forge"),
    ("https://constructamiracle.com/p/inside-the-forge-12-the-2025-war", "Inside the Forge"),
    ("https://constructamiracle.com/p/inside-the-forge-13-the-leash-is", "Inside the Forge"),
    ("https://constructamiracle.com/p/members-only-inside-the-forge-14", "Inside the Forge"),
    ("https://constructamiracle.com/p/inside-the-forge-15-stop-circling", "Inside the Forge")
]

req_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

supa_headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

total = len(urls_and_series)
success_count = 0

print(f"Starting direct injection to {SUPABASE_URL}/rest/v1/articles for {total} articles...")

for i, (url, series) in enumerate(urls_and_series):
    print(f"[{i+1}/{total}] Scraping: {url}")
    try:
        resp = requests.get(url, headers=req_headers)
        if resp.status_code != 200:
            print(f"  -> Failed: {resp.status_code}")
            continue

        soup = BeautifulSoup(resp.text, "html.parser")
        
        # 1. Get Title
        title_element = soup.find("h1", class_="post-title")
        title = title_element.get_text(strip=True) if title_element else "UNTITLED DISPATCH"

        # 2. Get Body
        body = soup.find("div", class_="available-content")
        if not body:
            body = soup.find("div", class_="body markup")
        
        if not body:
            print("  -> Could not find article body.")
            continue
            
        # Clean the body
        for trash in body.find_all("div", class_=["subscription-widget-wrap", "share-dialog", "button-wrapper"]):
            trash.decompose()

        # Process all images: Download and convert to Base64
        images = body.find_all("img")
        for img in images:
            img_url = img.get("src")
            if img_url and img_url.startswith("http"):
                try:
                    img_resp = requests.get(img_url, headers=req_headers)
                    if img_resp.status_code == 200:
                        content_type = img_resp.headers.get('content-type', 'image/jpeg')
                        b64_data = base64.b64encode(img_resp.content).decode('utf-8')
                        new_src = f"data:{content_type};base64,{b64_data}"
                        img['src'] = new_src
                        if img.has_attr('srcset'):
                            del img['srcset']
                except Exception as img_err:
                    print(f"    - Failed to download image {img_url}: {img_err}")
            
        # Extract inner HTML
        html_content = "".join([str(tag) for tag in body.contents]).strip()
        
        # 3. Direct Injection via API
        payload = {
            "title": title,
            "content_html": html_content,
            "series": series,
            "status": "published",
            "published": True,
            "author_id": AUTHOR_UUID,
            "author_name": "ETHAN FAULKNER"
        }
        
        supa_req = requests.post(f"{SUPABASE_URL}/rest/v1/articles", headers=supa_headers, json=payload)
        
        if supa_req.status_code in (201, 204):
            print(f"  -> Injected successfully: {title}")
            success_count += 1
        else:
            print(f"  -> API Error ({supa_req.status_code}): {supa_req.text}")
            
    except Exception as e:
        print(f"  -> Exception: {str(e)}")
        
    time.sleep(1) # Be nice to substack

print(f"\nInjection Complete! Processed {success_count}/{total} articles successfully.")
