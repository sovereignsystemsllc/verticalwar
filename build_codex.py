import requests
from bs4 import BeautifulSoup
import json
import time
import base64
from io import BytesIO

# This script generates a massive SQL file to insert all legacy Substack articles 
# as native HTML into the Sovereign V3 Supabase database.
# It actively downloads all images and converts them to base64 to ensure 100% platform independence.

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
    # URL duplicated in user's list, skipping the second "how crime became a business expense"
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
    # "members-only-inside-the-forge-5-the" is already in Doctrine, but user included it here. We'll include it here too.
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

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

sql_statements = []
sql_statements.append("-- SOVEREIGN V3 // AUTOMATED SUBSTACK IMPORT")
sql_statements.append("-- PLEASE REPLACE 'YOUR_AUTHOR_UUID' WITH YOUR ACTUAL SUPABASE USER ID BEFORE RUNNING")
sql_statements.append("")

for url, series in urls_and_series:
    print(f"Scraping {url}...")
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            print(f"  -> Failed: {resp.status_code}")
            continue

        soup = BeautifulSoup(resp.text, "html.parser")
        
        # 1. Get Title
        title_element = soup.find("h1", class_="post-title")
        title = title_element.get_text(strip=True) if title_element else "UNTITLED DISPATCH"
        # Escape quotes for SQL
        title_sql = title.replace("'", "''")

        # 2. Get Body
        body = soup.find("div", class_="available-content")
        if not body:
            body = soup.find("div", class_="body markup")
        
        if not body:
            print("  -> Could not find article body.")
            continue
            
        # Clean the body
        # Remove buttons, share wrappers, etc
        for trash in body.find_all("div", class_=["subscription-widget-wrap", "share-dialog", "button-wrapper"]):
            trash.decompose()

        # Process all images: Download and convert to Base64
        images = body.find_all("img")
        for img in images:
            img_url = img.get("src")
            if img_url and img_url.startswith("http"):
                try:
                    # Fetch image
                    img_resp = requests.get(img_url, headers=headers)
                    if img_resp.status_code == 200:
                        content_type = img_resp.headers.get('content-type', 'image/jpeg')
                        # Convert to base64
                        b64_data = base64.b64encode(img_resp.content).decode('utf-8')
                        new_src = f"data:{content_type};base64,{b64_data}"
                        # Replace the src attribute in the HTML
                        img['src'] = new_src
                        # Substack uses srcset for optimization, we need to remove it so it falls back to our base64 src
                        if img.has_attr('srcset'):
                            del img['srcset']
                        print("    - Downloaded and converted image to base64.")
                except Exception as img_err:
                    print(f"    - Failed to download image {img_url}: {img_err}")
            
        # Extract inner HTML
        html_content = "".join([str(tag) for tag in body.contents]).strip()
        html_content_sql = html_content.replace("'", "''")
        
        # Construct SQL
        sql = f"""
INSERT INTO public.articles (title, content_html, series, status, published, author_id, author_name) 
VALUES ('{title_sql}', '{html_content_sql}', '{series}', 'published', true, 'YOUR_AUTHOR_UUID', 'ETHAN FAULKNER');
"""
        sql_statements.append(sql.strip())
        print(f"  -> Success: {title}")
        
    except Exception as e:
        print(f"  -> Error: {str(e)}")
        
    time.sleep(1) # Be nice to substack

with open("seed_articles.sql", "w", encoding="utf-8") as f:
    f.write("\n\n".join(sql_statements))
    
print("\nExtraction complete! Generated seed_articles.sql")
