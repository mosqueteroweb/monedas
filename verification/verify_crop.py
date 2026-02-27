from playwright.sync_api import sync_playwright

def verify_auto_crop_ui(page):
    page.goto("http://localhost:5173/#/add")

    # Check if UI loads
    page.wait_for_selector("text=Añadir Moneda")

    # We can't easily simulate image upload and API response in this headless environment without mocking API.
    # But we can verify the structure of the page hasn't broken.

    page.wait_for_selector("text=Anverso (Cara)")
    page.wait_for_selector("text=Reverso (Cruz)")

    # Take screenshot of the Add Coin page
    page.screenshot(path="verification/add_coin_ui.png")
    print("Screenshot taken: verification/add_coin_ui.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verify_auto_crop_ui(page)
    browser.close()
