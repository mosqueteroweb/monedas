from playwright.sync_api import sync_playwright

def verify_homepage(page):
    page.goto("http://localhost:5173/")

    # Check that homepage loads and verify title or header
    page.wait_for_selector("text=Catálogo de Monedas")

    # Take screenshot of the homepage
    page.screenshot(path="verification/homepage_check.png")
    print("Screenshot taken: verification/homepage_check.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verify_homepage(page)
    browser.close()
