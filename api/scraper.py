"""
Recipe scraper for xiachufang.com and meishichina.com
Deploys as a Vercel Python serverless function.
"""
import os
import re
import json
import requests
from urllib.parse import urlparse

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://uvfdmdhepemhospjvrsy.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZmRtZGhlcGVtaG9zcGp2cnN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM2MDQxMywiZXhwIjoyMDkxOTM2NDEzfQ.Ocrpxwc8USooWXi_j6huvBkdlan3ZPdLFp0ukfjeiEY")

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def scrape_xiachufang(url):
    """Scrape recipe from xiachufang.com (m.xiachufang.com mobile version)"""
    try:
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        resp.raise_for_status()
        html = resp.text
        
        # Extract recipe name
        name_match = re.search(r'<h1[^>]*class="recipe-detail[^"]*"[^>]*>([^<]+)', html)
        if not name_match:
            name_match = re.search(r'<h1[^>]*>([^<]{2,50})</h1>', html)
        name = name_match.group(1).strip() if name_match else "下厨房菜谱"
        
        # Extract description
        desc_match = re.search(r'<p[^>]*class="desc[^"]*"[^>]*>([^<]+)</p>', html)
        description = desc_match.group(1).strip() if desc_match else ""
        
        # Extract main image
        img_match = re.search(r'"image":"([^"]+)"', html)
        if not img_match:
            img_match = re.search(r'<img[^>]*class="cover[^"]*"[^>]*src="([^"]+)"', html)
        main_image = img_match.group(1).replace("\\/", "/") if img_match else ""
        if main_image and not main_image.startswith("http"):
            main_image = "https:" + main_image
        
        # Extract ingredients
        ingredients = []
        ing_pattern = re.compile(r'<p[^>]*class="ingredient[^"]*"[^>]*>\s*<span[^>]*class="name[^"]*"[^>]*>([^<]+)</span>\s*<span[^>]*class="amount[^"]*"[^>]*>([^<]+)</span>', re.DOTALL)
        for match in ing_pattern.finditer(html):
            name = match.group(1).strip()
            amount = match.group(2).strip()
            ingredients.append({"name": name, "amount": amount})
        
        # Extract steps
        steps = []
        step_img_pattern = re.compile(r'<img[^>]*class="step-img[^"]*"[^>]*data-src="([^"]+)"', re.DOTALL)
        step_word_pattern = re.compile(r'<p[^>]*class="step-word[^"]*"[^>]*>([^<]+)</p>', re.DOTALL)
        
        step_imgs = step_img_pattern.findall(html)
        step_words = step_word_pattern.findall(html)
        
        for i, (img, word) in enumerate(zip(step_imgs[:10], step_words[:10]), 1):
            img_url = img.replace("\\/", "/") if img else ""
            if img_url and not img_url.startswith("http"):
                img_url = "https:" + img_url
            steps.append({"order": i, "instruction": word.strip(), "image": img_url})
        
        return {
            "name": name,
            "description": description,
            "main_image": main_image,
            "source_type": "link",
            "source_url": url,
            "ingredients": ingredients,
            "steps": steps
        }
    except Exception as e:
        return {"error": f"Failed to scrape xiachufang: {str(e)}"}


def scrape_meishichina(url):
    """Scrape recipe from meishichina.com"""
    try:
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        resp.raise_for_status()
        html = resp.text
        
        # Extract recipe name
        name_match = re.search(r'<h1[^>]*id="recipe_title"[^>]*>([^<]+)</h1>', html)
        name = name_match.group(1).strip() if name_match else "美食天下菜谱"
        
        # Extract main image
        img_match = re.search(r'<div[^>]*id="recipe_De_imgBox"[^>]*>\s*<img[^>]*src="([^"]+)"', html)
        if not img_match:
            img_match = re.search(r'<img[^>]*id="recipe_De[^"]*"[^>]*src="([^"]+)"', html)
        main_image = img_match.group(1).replace("\\/", "/") if img_match else ""
        if main_image and not main_image.startswith("http"):
            main_image = "https:" + main_image
        
        # Extract ingredients
        ingredients = []
        ing_blocks = re.findall(r'<fieldset[^>]*class="particulars"[^>]*>(.*?)</fieldset>', html, re.DOTALL)
        for block in ing_blocks:
            name_match = re.search(r'<span[^>]*class="category_s1"[^>]*>([^<]+)</span>', block)
            amount_match = re.search(r'<span[^>]*class="category_s2"[^>]*>([^<]+)</span>', block)
            if name_match and amount_match:
                ingredients.append({
                    "name": name_match.group(1).strip(),
                    "amount": amount_match.group(1).strip()
                })
        
        # Extract steps
        steps = []
        step_imgs = re.findall(r'<img[^>]*class="recipeStep_img"[^>]*data-src="([^"]+)"', html)
        step_words = re.findall(r'<div[^>]*class="recipeStep_word"[^>]*>\s*<p[^>]*>([^<]+)</p>', html)
        
        for i, (img, word) in enumerate(zip(step_imgs[:10], step_words[:10]), 1):
            img_url = img.replace("\\/", "/") if img else ""
            if img_url and not img_url.startswith("http"):
                img_url = "https:" + img_url
            steps.append({"order": i, "instruction": word.strip(), "image": img_url})
        
        return {
            "name": name,
            "description": "",
            "main_image": main_image,
            "source_type": "link",
            "source_url": url,
            "ingredients": ingredients,
            "steps": steps
        }
    except Exception as e:
        return {"error": f"Failed to scrape meishichina: {str(e)}"}


def scrape_recipe(url):
    """Main scraping function - dispatches to site-specific scraper"""
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    
    if 'xiachufang' in domain:
        return scrape_xiachufang(url)
    elif 'meishichina' in domain:
        return scrape_meishichina(url)
    else:
        return {"error": f"Unsupported website: {domain}. Supported: xiachufang.com, meishichina.com"}


def make_response(body, status_code=200):
    return {
        "statusCode": status_code,
        "body": json.dumps(body),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    }


def handle(request_data, context):
    """Vercel Python serverless function handler"""
    method = request_data.get("method", "GET")
    
    if method == "OPTIONS":
        return make_response({}, 200)
    
    if method != "POST":
        return make_response({"error": "Method not allowed"}, 405)
    
    try:
        body = json.loads(request_data.get("body", "{}"))
        url = body.get("url")
        
        if not url:
            return make_response({"error": "URL is required"}, 400)
        
        result = scrape_recipe(url)
        
        if "error" in result:
            return make_response(result, 400)
        
        return make_response(result, 200)
        
    except json.JSONDecodeError:
        return make_response({"error": "Invalid JSON body"}, 400)
    except Exception as e:
        return make_response({"error": str(e)}, 500)
