package com.hostelbite.e2e;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.testng.Assert;
import org.testng.annotations.Test;

import java.util.List;
import java.util.Random;

/**
 * Combined end-to-end test covering both journeys in sequence:
 *
 *  OWNER JOURNEY  (priority 1–5)
 *    1. Register as Shop Owner
 *    2. Logout
 *    3. Login
 *    4. Update Shop Settings
 *    5. Create Products (with AI description)
 *
 *  CUSTOMER JOURNEY  (priority 6–16)
 *    6.  Register as Customer
 *    7.  Logout
 *    8.  Login with same credentials
 *    9.  Search & add Oreo
 *    10. Search & add Kit Kat
 *    11. Filter Chips/Snacks & add random item
 *    12. Verify cart has all items (≥ 3)
 *    13. Proceed to Checkout
 *    14. Select Cash on Delivery
 *    15. Place Order
 *    16. Verify Order in My Orders
 */
public class CombinedJourneyE2ETest extends BaseE2ETest {

    // ═══════════════════════════════════════════════════════════════════════════
    //  OWNER JOURNEY STATE
    // ═══════════════════════════════════════════════════════════════════════════

    private static String ownerEmail;
    private static final String OWNER_PASSWORD = "OwnerPass123!";
    private static final String SHOP_NAME = "Automated Shop " + System.currentTimeMillis();

    private static final String[] PRODUCT_NAMES = {
        "Amul Fresh Milk", "Brown Eggs (6 pack)", "Alphonso Mangoes", "Ripe Bananas", "Red Apples",
        "Classic Maggi Noodles", "Bourbon Biscuits", "Potato Chips", "Greek Yogurt", "Whole Wheat Bread",
        "Orange Juice", "Dark Chocolate Bar", "Roasted Almonds", "Green Tea Bags", "Peanut Butter"
    };

    // ═══════════════════════════════════════════════════════════════════════════
    //  CUSTOMER JOURNEY STATE
    // ═══════════════════════════════════════════════════════════════════════════

    private static final String ROOM_NUMBER = "B-202";
    private static String customerEmail;

    // ═══════════════════════════════════════════════════════════════════════════
    //  OWNER JOURNEY — TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    @Test(priority = 1)
    public void testOwnerRegistration() {
        clearSession();
        openRegister();

        ownerEmail = uniqueEmail();

        WebElement ownerRoleBtn = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[normalize-space()='Shop Owner']")));
        ownerRoleBtn.click();

        driver.findElement(By.id("name")).sendKeys("Test Owner");
        driver.findElement(By.id("email")).sendKeys(ownerEmail);

        new Select(driver.findElement(By.id("hostel"))).selectByIndex(1);

        driver.findElement(By.id("phone")).sendKeys("9988776655");
        driver.findElement(By.id("password")).sendKeys(OWNER_PASSWORD);

        submitButtonByText("Create Account").click();

        wait.until(ExpectedConditions.urlContains("/owner"));
        Assert.assertTrue(driver.getCurrentUrl().contains("/owner"),
                "Owner registration failed: Not redirected to /owner");
        System.out.println("[Owner] Registration successful: " + ownerEmail);
    }

    @Test(priority = 2, dependsOnMethods = "testOwnerRegistration")
    public void testOwnerLogout() {
        WebElement logoutButton;
        try {
            logoutButton = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//header//button[contains(., 'Logout')]")));
            jsClick(logoutButton);
        } catch (Exception e) {
            System.out.println("[Owner] Desktop logout not clickable, trying mobile menu...");
            WebElement menuToggle = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//button[@aria-label='Toggle menu']")));
            jsClick(menuToggle);

            logoutButton = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//div[contains(@class, 'md:hidden')]//button[contains(., 'Logout')]")));
            jsClick(logoutButton);
        }

        wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//a[normalize-space()='Login']")));
        System.out.println("[Owner] Logout successful.");
    }

    @Test(priority = 3, dependsOnMethods = "testOwnerLogout")
    public void testOwnerLogin() {
        driver.get(baseUrl + "/auth/login");

        WebElement loginEmail = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("email")));
        loginEmail.sendKeys(ownerEmail);
        driver.findElement(By.id("password")).sendKeys(OWNER_PASSWORD);

        submitButtonByText("Sign In").click();

        wait.until(ExpectedConditions.or(
                ExpectedConditions.urlContains("/owner"),
                ExpectedConditions.urlContains("/products")));

        if (!driver.getCurrentUrl().contains("/owner")) {
            System.out.println("[Owner] Redirected to " + driver.getCurrentUrl() + ". Navigating to Owner Dashboard via Navbar.");
            WebElement dashboardLink = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//header//a[normalize-space()='Dashboard']")));
            jsClick(dashboardLink);
            wait.until(ExpectedConditions.urlContains("/owner"));
        }

        Assert.assertTrue(driver.getCurrentUrl().contains("/owner"),
                "Owner login failed: Not redirected to /owner");
        System.out.println("[Owner] Login successful, reached dashboard: " + ownerEmail);
    }

    @Test(priority = 4, dependsOnMethods = "testOwnerLogin")
    public void testUpdateShopSettings() {
        WebElement settingsLink = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//h3[normalize-space()='Shop Settings']/ancestor::a")));
        scrollIntoView(settingsLink);
        jsClick(settingsLink);

        wait.until(ExpectedConditions.urlContains("/owner/settings"));

        WebElement shopNameInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("shopName")));
        shopNameInput.clear();
        shopNameInput.sendKeys(SHOP_NAME);

        WebElement descriptionInput = driver.findElement(By.id("description"));
        descriptionInput.clear();
        descriptionInput.sendKeys("This is an automated shop description.");

        WebElement upiInput = driver.findElement(By.id("upiId"));
        upiInput.clear();
        upiInput.sendKeys("owner@upi");

        submitButtonByText("Save Settings").click();

        wait.until(ExpectedConditions.textToBePresentInElementValue(By.id("shopName"), SHOP_NAME));
        System.out.println("[Owner] Shop settings updated: " + SHOP_NAME);
    }

    @Test(priority = 5, dependsOnMethods = "testUpdateShopSettings")
    public void testCreateProducts() {
        driver.get(baseUrl + "/owner");
        Random random = new Random();

        for (int i = 1; i <= 2; i++) {
            WebElement addProductBtn = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//a[contains(@href, '/owner/products/new')]")));
            jsClick(addProductBtn);

            wait.until(ExpectedConditions.urlContains("/owner/products/new"));

            String productName = PRODUCT_NAMES[random.nextInt(PRODUCT_NAMES.length)] + " " + System.currentTimeMillis();
            driver.findElement(By.id("name")).sendKeys(productName);

            WebElement generateAiBtn = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//button[contains(., 'Generate with AI')]")));
            jsClick(generateAiBtn);

            WebElement descriptionArea = driver.findElement(By.id("description"));
            wait.until(d -> !descriptionArea.getAttribute("value").isEmpty());

            driver.findElement(By.id("price")).sendKeys(String.valueOf(20 + random.nextInt(100)));
            driver.findElement(By.id("stock")).sendKeys("50");

            WebElement tagBtn = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//button[normalize-space()='Quick' or normalize-space()='Snacks' or normalize-space()='Vegetarian']")));
            tagBtn.click();

            submitButtonByText("Create Product").click();

            wait.until(ExpectedConditions.urlContains("/owner/products"));
            wait.until(ExpectedConditions.visibilityOfElementLocated(
                    By.xpath("//h3[contains(normalize-space(), '" + productName.split(" ")[0] + "')]")));

            System.out.println("[Owner] Created product with AI description: " + productName);

            if (i < 2) {
                driver.get(baseUrl + "/owner");
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  CUSTOMER JOURNEY — TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    @Test(priority = 6, dependsOnMethods = "testCreateProducts")
    public void step01_register() {
        clearSession();
        openRegister();

        customerEmail = uniqueEmail();

        driver.findElement(By.id("name")).sendKeys("Journey User");
        driver.findElement(By.id("email")).sendKeys(customerEmail);

        new Select(driver.findElement(By.id("hostel"))).selectByIndex(1);

        driver.findElement(By.id("phone")).sendKeys("9998887776");
        driver.findElement(By.id("room")).sendKeys(ROOM_NUMBER);
        driver.findElement(By.id("password")).sendKeys("Journey123");

        submitButtonByText("Create Account").click();
        waitForProductsPage();
        System.out.println("[Customer] Registration successful: " + customerEmail);
    }

    @Test(priority = 7, dependsOnMethods = "step01_register")
    public void step02_logout() {
        WebElement logoutButton;
        try {
            logoutButton = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//button[normalize-space()='Logout' or .//span[normalize-space()='Logout']]")));
        } catch (Exception e) {
            WebElement menuToggle = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//button[@aria-label='Toggle menu']")));
            jsClick(menuToggle);
            logoutButton = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//button[normalize-space()='Logout']")));
        }
        jsClick(logoutButton);

        wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//a[normalize-space()='Login']")));
        System.out.println("[Customer] Logout successful.");
    }

    @Test(priority = 8, dependsOnMethods = "step02_logout")
    public void step03_loginWithSameCredentials() {
        driver.get(baseUrl + "/auth/login");

        WebElement loginEmail = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("email")));
        loginEmail.sendKeys(customerEmail);
        driver.findElement(By.id("password")).sendKeys("Journey123");

        submitButtonByText("Sign In").click();
        waitForProductsPage();
        System.out.println("[Customer] Login successful: " + customerEmail);
    }

    @Test(priority = 9, dependsOnMethods = "step03_loginWithSameCredentials")
    public void step04_searchAndAddOreo() {
        WebElement searchInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.cssSelector("input[placeholder='Search products...']")));
        searchInput.sendKeys("Oreo");

        WebElement oreoAddButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("(//h3[contains(normalize-space(), 'Oreo')]" +
                         "/ancestor::div[contains(@class,'bg-card')]" +
                         "//button[normalize-space()='Add'])[1]")));
        scrollIntoView(oreoAddButton);
        oreoAddButton = wait.until(ExpectedConditions.elementToBeClickable(oreoAddButton));
        jsClick(oreoAddButton);
        System.out.println("[Customer] Added Oreo to cart.");
    }

    @Test(priority = 10, dependsOnMethods = "step04_searchAndAddOreo")
    public void step05_searchAndAddKitKat() {
        driver.get(baseUrl + "/products");
        waitForProductsPage();

        WebElement searchInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.cssSelector("input[placeholder='Search products...']")));
        searchInput.sendKeys("Kit Kat");

        WebElement kitKatAddButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("(//h3[contains(normalize-space(), 'Kit Kat') or contains(normalize-space(), 'KitKat')]" +
                         "/ancestor::div[contains(@class,'bg-card')]" +
                         "//button[normalize-space()='Add'])[1]")));
        scrollIntoView(kitKatAddButton);
        kitKatAddButton = wait.until(ExpectedConditions.elementToBeClickable(kitKatAddButton));
        jsClick(kitKatAddButton);
        System.out.println("[Customer] Added Kit Kat to cart.");
    }

    @Test(priority = 11, dependsOnMethods = "step05_searchAndAddKitKat")
    public void step06_filterChipsAndAddRandomItem() {
        driver.get(baseUrl + "/products");
        waitForProductsPage();

        WebElement chipsFilterBtn = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(normalize-space(), 'Chip')]")));
        chipsFilterBtn.click();

        wait.until(ExpectedConditions.invisibilityOfElementLocated(
                By.cssSelector(".animate-pulse")));

        List<WebElement> chipsAddButtons = wait.until(
                ExpectedConditions.visibilityOfAllElementsLocatedBy(
                        By.xpath("//div[contains(@class,'bg-card')]//button[normalize-space()='Add']")));
        Assert.assertTrue(chipsAddButtons.size() >= 3,
                "Expected at least 3 chips items after filter, but found: " + chipsAddButtons.size());

        WebElement thirdChipButton = chipsAddButtons.get(2); // 3rd item (0-indexed)
        scrollIntoView(thirdChipButton);
        thirdChipButton = wait.until(ExpectedConditions.elementToBeClickable(thirdChipButton));
        jsClick(thirdChipButton);
        System.out.println("[Customer] Added 3rd chips/snack item to cart.");
    }

    @Test(priority = 12, dependsOnMethods = "step06_filterChipsAndAddRandomItem")
    public void step07_verifyCartHasAllItems() {
        driver.get(baseUrl + "/cart");
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h1[contains(normalize-space(), 'Cart')" +
                         " or contains(normalize-space(), 'Your Cart')]")));

        List<WebElement> cartItems =
                driver.findElements(By.cssSelector(".rounded-xl.border.bg-card, [data-testid='cart-item']"));
        Assert.assertTrue(cartItems.size() >= 3,
                "Expected at least 3 items in cart, but found: " + cartItems.size());
        System.out.println("[Customer] Cart verified: " + cartItems.size() + " items found.");
    }

    @Test(priority = 13, dependsOnMethods = "step07_verifyCartHasAllItems")
    public void step08_proceedToCheckout() {
        // Already on /cart from step07
        WebElement proceedButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.linkText("Proceed to Checkout")));
        proceedButton.click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h1[contains(normalize-space(), 'Checkout')]")));

        WebElement roomInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("room")));
        if (roomInput.getAttribute("value").isEmpty()) {
            roomInput.sendKeys(ROOM_NUMBER);
        }
        System.out.println("[Customer] Reached checkout page.");
    }

    @Test(priority = 14, dependsOnMethods = "step08_proceedToCheckout")
    public void step09_selectCashOnDelivery() {
        WebElement codButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//p[contains(normalize-space(text()), 'Cash on Delivery')]" +
                         "/ancestor::button")));
        scrollIntoView(codButton);
        codButton = wait.until(ExpectedConditions.elementToBeClickable(codButton));
        codButton.click();
        System.out.println("[Customer] Selected Cash on Delivery.");
    }

    @Test(priority = 15, dependsOnMethods = "step09_selectCashOnDelivery")
    public void step10_placeOrder() {
        submitButtonByText("Place Order").click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h1[contains(normalize-space(), 'Order Confirmed!')]")));
        System.out.println("[Customer] Order placed successfully.");
    }

    @Test(priority = 16, dependsOnMethods = "step10_placeOrder")
    public void step11_verifyOrderInMyOrders() {
        WebElement viewOrdersBtn = wait.until(
                ExpectedConditions.elementToBeClickable(By.linkText("View Orders")));
        viewOrdersBtn.click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h1[contains(normalize-space(), 'My Orders')]")));

        List<WebElement> orderCards =
                driver.findElements(By.cssSelector(".rounded-xl.border.bg-card"));
        Assert.assertTrue(orderCards.size() > 0,
                "Expected at least 1 order card on 'My Orders' page, but found: " + orderCards.size());
        System.out.println("[Customer] Order verified in My Orders. Total orders: " + orderCards.size());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SHARED HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private void scrollIntoView(WebElement element) {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({block:'center',inline:'nearest'});", element);
    }

    private void jsClick(WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }

    protected void clickFilter(String primaryLabel, String fallbackLabel) {
        By primary  = By.xpath("//button[normalize-space()='" + primaryLabel  + "']");
        By fallback = By.xpath("//button[normalize-space()='" + fallbackLabel + "']");

        if (!driver.findElements(primary).isEmpty()) {
            wait.until(ExpectedConditions.elementToBeClickable(primary)).click();
        } else {
            wait.until(ExpectedConditions.elementToBeClickable(fallback)).click();
        }
    }
}