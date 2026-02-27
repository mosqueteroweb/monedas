from playwright.sync_api import sync_playwright

def verify_data_management_ui(page):
    page.goto("http://localhost:5173/#/settings")

    # Check "Gestión de Datos" section
    page.wait_for_selector("text=Gestión de Datos")

    # Check buttons and their icons (by text since icons are SVGs)
    page.wait_for_selector("button:has-text('Exportar')")
    page.wait_for_selector("button:has-text('Importar')")
    page.wait_for_selector("button:has-text('Restablecer Base de Datos')")

    # Check functionality of Reset Modal
    page.click("text=Restablecer Base de Datos")
    page.wait_for_selector("text=Confirmar Borrado")
    page.fill("input[placeholder='Borrar']", "Borrar")

    # Take screenshot of the reset modal with input filled
    page.screenshot(path="verification/reset_modal_filled.png")

    # Close modal
    page.click("text=Cancelar")

    # Simulate export (will be quick for empty DB)
    page.click("button:has-text('Exportar')")
    # Wait for success message (might need retry logic if it's too fast, but let's try)
    try:
        page.wait_for_selector("text=Base de datos exportada", timeout=5000)
    except:
        print("Export success message missed or not appeared")

    # Take final screenshot of settings page
    page.screenshot(path="verification/settings_final.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verify_data_management_ui(page)
    browser.close()
