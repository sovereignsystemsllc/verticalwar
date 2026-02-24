import requests
from bs4 import BeautifulSoup
import json

url = "https://constructamiracle.com/p/the-living-storybook-part-1-a-hundred"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

resp = requests.get(url, headers=headers)
if resp.status_code != 200:
    print(f"Failed: {resp.status_code}")
else:
    soup = BeautifulSoup(resp.text, "html.parser")
    # Substack article body is usually in div.available-content or div.body.markup
    body = soup.find("div", class_="available-content")
    if not body:
        body = soup.find("div", class_="body markup")
    
    if body:
        print("Found body with length:", len(str(body)))
        # Let's print the first 500 chars of the body
        print(str(body)[:500])
    else:
        print("Could not find article body.")
