from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 412, 'height': 915}) # Mobile viewport
    page = context.new_page()

    try:
        # 1. Navigate to Home page
        print("Navigating to /monedas/")
        page.goto("http://localhost:3000/monedas/")

        # 2. Click the + button
        print("Clicking Add button...")
        add_link = page.get_by_role("link", name="Add Coin").first
        if not add_link.count():
            add_link = page.locator("a[href$='/add']").first
        if not add_link.count():
            add_link = page.locator(".lucide-plus-circle").locator("xpath=..").first

        if add_link.count():
             add_link.click()
        else:
             page.goto("http://localhost:3000/monedas/add")

        # 3. Wait for Add Coin page
        print("Waiting for 'Añadir Moneda' page...")
        page.get_by_text("Añadir Moneda").wait_for(state="visible", timeout=10000)

        # 4. Upload Image
        print("Uploading image...")
        file_input = page.locator("input[type='file']").first
        file_input.wait_for(state="attached")
        file_input.set_input_files("test_image.png")

        # 5. Check what happened
        print("Waiting for response (Modal or Main Page)...")

        # We race two conditions:
        # A) Crop Modal appears (Fallback triggered or AI failed)
        # B) Scissors button appears (AI succeeded)

        try:
            # Wait for either the modal title OR the scissors button
            # Note: modal title is "Recortar Anverso"
            # Scissors button is "button[title='Recortar Manualmente']"

            # Let's check for modal first since it seems to be what happened
            modal_title = page.get_by_text("Recortar Anverso")
            scissors_btn = page.locator("button[title='Recortar Manualmente']")

            # Poll for visibility
            found_modal = False
            for _ in range(60): # 60 seconds
                if modal_title.is_visible():
                    found_modal = True
                    break
                if scissors_btn.is_visible():
                    break
                page.wait_for_timeout(1000)

            if found_modal:
                print("Crop Modal opened automatically (Fallback triggered).")
                page.screenshot(path="verification_manual_crop.png")
                print("Success: Fallback works.")
            elif scissors_btn.is_visible():
                print("AI removal succeeded. Clicking manual crop to verify button.")
                scissors_btn.click()
                modal_title.wait_for(state="visible", timeout=5000)
                page.screenshot(path="verification_manual_crop.png")
                print("Success: AI works and Manual button works.")
            else:
                print("Timeout waiting for processing.")
                page.screenshot(path="debug_timeout.png")
                raise Exception("Timeout")

        except Exception as e:
            print(f"Error checking state: {e}")
            raise e

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
