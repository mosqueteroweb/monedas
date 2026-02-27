from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 1. Navigate to Add Coin page
        page.goto("http://localhost:3000/#/add")

        # Wait for page to load
        page.wait_for_selector("text=Añadir Moneda")

        # 2. Upload Front Image
        # We need a dummy image. Let's create a simple SVG or use a data URL if possible,
        # but file input usually requires a real file path.
        # Since 'convert' failed, let's create a text file as a dummy image (might fail validation)
        # or better, use a known existing image or download one.
        # Let's try to find an image in the repo or create a simple one using python.

        import base64

        # Create a simple red square PNG in python
        img_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x64\x00\x00\x00\x64\x08\x02\x00\x00\x00\xff\x80\x02\x03\x00\x00\x00\x01sRGB\x00\xae\xce\x1c\xe9\x00\x00\x00\x04gAMA\x00\x00\xb1\x8f\x0b\xfca\x05\x00\x00\x00\x09pHYs\x00\x00\x0e\xc3\x00\x00\x0e\xc3\x01\xc7o\xa8d\x00\x00\x00\x1bIDATW\x19\xed\xc1\x01\x01\x00\x00\x00\x82 \xff\xafnH\x40\x01\x00\x00\x00\x00\x00\x00\x00\x08\x00\x03\x00\x64\x00\x00\x64\x00\x01\x92\x87\x1b\x06\x00\x00\x00\x00IEND\xaeB`\x82'

        with open("/tmp/test_coin.png", "wb") as f:
            f.write(img_data)

        # Upload the file
        file_input = page.locator('input[type="file"]').first
        file_input.set_input_files("/tmp/test_coin.png")

        # 3. Verify Crop Modal Opens
        # Wait for the modal header "Recortar Anverso"
        try:
            page.wait_for_selector("text=Recortar Anverso", timeout=5000)
            print("Crop modal opened successfully")
        except:
            print("Crop modal did not open")
            page.screenshot(path="verification/failed_modal.png")
            return

        # Take screenshot of the modal
        page.screenshot(path="verification/crop_modal.png")

        # 4. Interact with Modal (Zoom)
        slider = page.get_by_label("Zoom")
        if slider.is_visible():
            slider.fill("2") # Set zoom to 2

        # 5. Save Crop
        save_button = page.locator("button:has(svg.lucide-check)") # The checkmark button
        save_button.click()

        # 6. Verify Image is set in the main view
        # The modal should close
        page.wait_for_selector("text=Recortar Anverso", state="hidden")

        # The "remove image" button (X) should be visible on the front image card
        page.wait_for_selector("text=✕")

        page.screenshot(path="verification/after_crop.png")

        browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    run()
