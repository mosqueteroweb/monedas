from playwright.sync_api import sync_playwright

def verify_settings(page):
    page.goto("http://localhost:5173/#/settings")

    # Check if "Gestión de Datos" section exists
    page.wait_for_selector("text=Gestión de Datos")

    # Check for Export and Import buttons
    page.wait_for_selector("text=Exportar")
    page.wait_for_selector("text=Importar")

    # Click on "Restablecer Base de Datos" to open modal
    page.click("text=Restablecer Base de Datos")

    # Check if modal is visible
    page.wait_for_selector("text=Confirmar Borrado")
    page.wait_for_selector("text=Esta acción borrará TODOS los datos")

    # Take screenshot of the modal
    page.screenshot(path="verification/settings_modal.png")
    print("Screenshot taken: verification/settings_modal.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verify_settings(page)
    browser.close()
