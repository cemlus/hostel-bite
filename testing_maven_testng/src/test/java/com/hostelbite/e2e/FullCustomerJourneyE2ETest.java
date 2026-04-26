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

public class FullCustomerJourneyE2ETest extends BaseE2ETest {

    // ── Shared state across all test methods (same instance, same session) ──────
    private static final String ROOM_NUMBER = "B-202";
    private String email; // captured at registration, reused at login

    // ── Step 1 ──────────────────────────────────────────────────────────────────
    @Test
    public void step01_register() {
        clearSession();
        openRegister();

        email = uniqueEmail();

        driver.findElement(By.id("name")).sendKeys("Journey User");
        driver.findElement(By.id("email")).sendKeys(email);

        new Select(driver.findElement(By.id("hostel"))).selectByIndex(1);

        driver.findElement(By.id("phone")).sendKeys("9998887776");
        driver.findElement(By.id("room")).sendKeys(ROOM_NUMBER);
        driver.findElement(By.id("password")).sendKeys("Journey123");

        submitButtonByText("Create Account").click();
        waitForProductsPage();
    }

    // ── Step 2 ──────────────────────────────────────────────────────────────────
    @Test(dependsOnMethods = "step01_register")
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
    }

    // ── Step 3 ──────────────────────────────────────────────────────────────────
    @Test(dependsOnMethods = "step02_logout")
    public void step03_loginWithSameCredentials() {
        driver.get(baseUrl + "/auth/login");

        WebElement loginEmail = wait.until(
            ExpectedConditions.visibilityOfElementLocated(By.id("email")));
        loginEmail.sendKeys(email);
        driver.findElement(By.id("password")).sendKeys("Journey123");

        submitButtonByText("Sign In").click();
        waitForProductsPage();
    }

    // ── Step 4 ──────────────────────────────────────────────────────────────────
    @Test(dependsOnMethods = "step03_loginWithSameCredentials")
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
    }

    // ── Step 5 ──────────────────────────────────────────────────────────────────
    @Test(dependsOnMethods = "step04_searchAndAddOreo")
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
    }

    // ── Step 6 ──────────────────────────────────────────────────────────────────
    @Test(dependsOnMethods = "step05_searchAndAddKitKat")
    public void step06_filterChipsAndAddRandomItem() {
        driver.get(baseUrl + "/products");
        waitForProductsPage();

        WebElement chipsFilterBtn = wait.until(ExpectedConditions.elementToBeClickable(
            By.xpath("//button[contains(normalize-space(), 'Chip')" +
                     " or contains(normalize-space(), 'Snack')]")));
        chipsFilterBtn.click();

        wait.until(ExpectedConditions.invisibilityOfElementLocated(
            By.cssSelector(".animate-pulse")));

        List<WebElement> chipsAddButtons = wait.until(
            ExpectedConditions.visibilityOfAllElementsLocatedBy(
                By.xpath("//div[contains(@class,'bg-card')]//button[normalize-space()='Add']")));
        Assert.assertTrue(chipsAddButtons.size() > 0, "No chips items found after applying Chips filter.");

        WebElement randomChipButton = chipsAddButtons.get(new Random().nextInt(chipsAddButtons.size()));
        scrollIntoView(randomChipButton);
        randomChipButton = wait.until(ExpectedConditions.elementToBeClickable(randomChipButton));
        jsClick(randomChipButton);
    }

    // ── Step 7 ──────────────────────────────────────────────────────────────────
    @Test(dependsOnMethods = "step06_filterChipsAndAddRandomItem")
    public void step07_verifyCartHasAllItems() {
        driver.get(baseUrl + "/cart");
        wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.xpath("//h1[contains(normalize-space(), 'Cart')" +
                     " or contains(normalize-space(), 'Your Cart')]")));

        List<WebElement> cartItems =
            driver.findElements(By.cssSelector(".rounded-xl.border.bg-card, [data-testid='cart-item']"));
        Assert.assertTrue(
            cartItems.size() >= 3,
            "Expected at least 3 items in cart, but found: " + cartItems.size());
    }

    // ── Step 8 ──────────────────────────────────────────────────────────────────
    @Test(dependsOnMethods = "step07_verifyCartHasAllItems")
    public void step08_proceedToCheckout() {
        // Already on /cart from step07 — no navigation needed
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
    }

    // ── Step 9 ──────────────────────────────────────────────────────────────────
    @Test(dependsOnMethods = "step08_proceedToCheckout")
    public void step09_selectCashOnDelivery() {
        WebElement codButton = wait.until(ExpectedConditions.elementToBeClickable(
            By.xpath("//p[contains(normalize-space(text()), 'Cash on Delivery')]" +
                     "/ancestor::button")));
        scrollIntoView(codButton);
        codButton = wait.until(ExpectedConditions.elementToBeClickable(codButton));
        codButton.click();
    }

    // ── Step 10 ─────────────────────────────────────────────────────────────────
    @Test(dependsOnMethods = "step09_selectCashOnDelivery")
    public void step10_placeOrder() {
        submitButtonByText("Place Order").click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.xpath("//h1[contains(normalize-space(), 'Order Confirmed!')]")));
    }

    // ── Step 11 ─────────────────────────────────────────────────────────────────
    @Test(dependsOnMethods = "step10_placeOrder")
    public void step11_verifyOrderInMyOrders() {
        WebElement viewOrdersBtn = wait.until(
            ExpectedConditions.elementToBeClickable(By.linkText("View Orders")));
        viewOrdersBtn.click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.xpath("//h1[contains(normalize-space(), 'My Orders')]")));

        List<WebElement> orderCards =
            driver.findElements(By.cssSelector(".rounded-xl.border.bg-card"));
        Assert.assertTrue(
            orderCards.size() > 0,
            "Expected at least 1 order card on 'My Orders' page, but found: " + orderCards.size());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────
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