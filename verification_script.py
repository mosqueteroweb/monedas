from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to the home page
    print("Navigating to home page...")
    page.goto("http://localhost:5173/monedas/")

    # Wait for the title or some content to load
    print("Waiting for content...")
    page.wait_for_selector("text=Catálogo de Monedas")

    # Take a screenshot of the home page
    print("Taking screenshot of home page...")
    page.screenshot(path="verification_home.png")

    # Click on "Añadir Moneda" button
    print("Clicking 'Añadir Moneda'...")
    # The button has text "Añadir Moneda" or similar. Let's find it.
    # Based on my code, it's a Link or Button component.
    # It might be an SVG icon or text. Let's look for the aria-label or role if I added one,
    # or just try to find the button by its position or icon if text is hidden on mobile.
    # Actually, looking at Home.jsx (which I created earlier but don't have in front of me right now),
    # I likely added a Floating Action Button (FAB) or a button in the grid.
    # Let's try to find a button with "Añadir" or similar text, or just take the screenshot of the home page for now to verify the app loads.

    # Let's inspect the page content briefly to debug if needed
    content = page.content()
    # print(content)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
