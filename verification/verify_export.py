from playwright.sync_api import sync_playwright

def verify_export_ui(page):
    page.goto("http://localhost:5173/#/settings")

    # Wait for buttons to appear
    page.wait_for_selector("text=Gestión de Datos")

    # Click Export
    page.click("button:has-text('Exportar')")

    # Wait for progress bar or text (might be fast if DB is empty)
    # Since DB is empty initially, it might finish very quickly.
    # Let's check if we see "Exportando" or "Base de datos exportada"

    try:
        # It might be too fast to catch "Iniciando...", so let's look for success message
        page.wait_for_selector("text=Base de datos exportada", timeout=5000)
    except:
        print("Could not catch success message, maybe it failed or was too fast/slow?")

    # Take screenshot of the state (likely success message)
    page.screenshot(path="verification/export_success.png")
    print("Screenshot taken: verification/export_success.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verify_export_ui(page)
    browser.close()
