from playwright.sync_api import sync_playwright

def verify_ui_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # 1. Go to Settings
        print("Navigating to Settings...")
        page.goto("http://localhost:5173/#/settings")
        page.wait_for_selector("text=Configuración")

        # Verify GitHub Token label
        print("Verifying GitHub Token label...")
        if page.is_visible("text=GitHub Personal Access Token"):
            print("SUCCESS: 'GitHub Personal Access Token' label found.")
        else:
            print("FAILURE: 'GitHub Personal Access Token' label NOT found.")

        # Take screenshot of Settings
        page.screenshot(path="verification/settings_final.png")
        print("Screenshot taken: verification/settings_final.png")

        # 2. Go to Add Coin
        print("Navigating to Add Coin...")
        page.goto("http://localhost:5173/#/add")
        page.wait_for_selector("text=Añadir Moneda")

        # Take screenshot of Add Coin
        page.screenshot(path="verification/add_coin_final.png")
        print("Screenshot taken: verification/add_coin_final.png")

        browser.close()

if __name__ == "__main__":
    verify_ui_changes()
