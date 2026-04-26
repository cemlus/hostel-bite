package com.hostelbite.e2e;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Full end-to-end owner journey:
 * Register as Owner → Logout → Login → Update Shop Settings → Create Products
 */
public class OwnerJourneyE2ETest extends BaseE2ETest {

    private static String ownerEmail;
    private static final String OWNER_PASSWORD = "OwnerPass123!";
    private static final String SHOP_NAME = "Automated Shop " + System.currentTimeMillis();

    @Test(priority = 1)
    public void testOwnerRegistration() {
        clearSession();
        openRegister();

        ownerEmail = uniqueEmail();

        // Select "Shop Owner" role
        WebElement ownerRoleBtn = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[normalize-space()='Shop Owner']")));
        ownerRoleBtn.click();

        driver.findElement(By.id("name")).sendKeys("Test Owner");
        driver.findElement(By.id("email")).sendKeys(ownerEmail);

        Select hostelSelect = new Select(driver.findElement(By.id("hostel")));
        hostelSelect.selectByIndex(1);

        driver.findElement(By.id("phone")).sendKeys("9988776655");
        driver.findElement(By.id("password")).sendKeys(OWNER_PASSWORD);

        submitButtonByText("Create Account").click();

        // Wait for redirect to owner dashboard
        wait.until(ExpectedConditions.urlContains("/owner"));
        Assert.assertTrue(driver.getCurrentUrl().contains("/owner"), "Owner registration failed: Not redirected to /owner");
        System.out.println("Owner registration successful: " + ownerEmail);
    }

    @Test(priority = 2, dependsOnMethods = "testOwnerRegistration")
    public void testOwnerLogout() {
        // Registration should have landed us on /owner.
        // We try to find the logout button in the desktop navbar first.
        WebElement logoutButton;
        try {
            // Desktop logout button has text inside a span, or is a button with Logout text
            logoutButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//header//button[contains(., 'Logout')]")));
            jsClick(logoutButton);
        } catch (Exception e) {
            System.out.println("Desktop logout button not clickable, trying mobile menu...");
            // Fallback for mobile/collapsed menu
            WebElement menuToggle = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[@aria-label='Toggle menu']")));
            jsClick(menuToggle);
            
            logoutButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class, 'md:hidden')]//button[contains(., 'Logout')]")));
            jsClick(logoutButton);
        }

        // After logout the app redirects to home page which shows Login button
        wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//a[normalize-space()='Login']")));
        System.out.println("Owner logout successful.");
    }

    @Test(priority = 3, dependsOnMethods = "testOwnerLogout")
    public void testOwnerLogin() {
        driver.get(baseUrl + "/auth/login");

        WebElement loginEmail = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("email")));
        loginEmail.sendKeys(ownerEmail);
        driver.findElement(By.id("password")).sendKeys(OWNER_PASSWORD);

        submitButtonByText("Sign In").click();

        // The app might redirect to /products by default for all users.
        // Owners should see a 'Dashboard' link in the navbar to get to /owner.
        wait.until(ExpectedConditions.or(
            ExpectedConditions.urlContains("/owner"),
            ExpectedConditions.urlContains("/products")
        ));
        
        if (!driver.getCurrentUrl().contains("/owner")) {
            System.out.println("Redirected to " + driver.getCurrentUrl() + ". Navigating to Owner Dashboard via Navbar.");
            WebElement dashboardLink = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//header//a[normalize-space()='Dashboard']")));
            jsClick(dashboardLink);
            wait.until(ExpectedConditions.urlContains("/owner"));
        }

        Assert.assertTrue(driver.getCurrentUrl().contains("/owner"), "Owner login failed: Not redirected to /owner");
        System.out.println("Owner login successful and reached dashboard: " + ownerEmail);
    }

    @Test(priority = 4, dependsOnMethods = "testOwnerLogin")
    public void testUpdateShopSettings() {
        // Navigate to shop settings via quick link
        WebElement settingsLink = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//h3[normalize-space()='Shop Settings']/ancestor::a")));
        scrollIntoView(settingsLink);
        jsClick(settingsLink);

        wait.until(ExpectedConditions.urlContains("/owner/settings"));

        WebElement shopNameInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("shopName")));
        shopNameInput.clear();
        shopNameInput.sendKeys(SHOP_NAME);

        WebElement descriptionInput = driver.findElement(By.id("description"));
        descriptionInput.clear();
        descriptionInput.sendKeys("This is an automated shop description.");

        WebElement upiInput = driver.findElement(By.id("upiId"));
        upiInput.clear();
        upiInput.sendKeys("owner@upi");

        submitButtonByText("Save Settings").click();

        // Verify toast or success state (the toast might be too fast, check if we stay on page and values persist)
        wait.until(ExpectedConditions.textToBePresentInElementValue(By.id("shopName"), SHOP_NAME));
        System.out.println("Shop settings updated: " + SHOP_NAME);
    }

    private static final String[] PRODUCT_NAMES = {
        "Amul Fresh Milk", "Brown Eggs (6 pack)", "Alphonso Mangoes", "Ripe Bananas", "Red Apples",
        "Classic Maggi Noodles", "Bourbon Biscuits", "Potato Chips", "Greek Yogurt", "Whole Wheat Bread",
        "Orange Juice", "Dark Chocolate Bar", "Roasted Almonds", "Green Tea Bags", "Peanut Butter"
    };

    @Test(priority = 5, dependsOnMethods = "testUpdateShopSettings")
    public void testCreateProducts() {
        // Go back to dashboard to use the "Add Product" button
        driver.get(baseUrl + "/owner");
        java.util.Random random = new java.util.Random();

        for (int i = 1; i <= 2; i++) {
            WebElement addProductBtn = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//a[contains(@href, '/owner/products/new')]")));
            jsClick(addProductBtn);

            wait.until(ExpectedConditions.urlContains("/owner/products/new"));

            String productName = PRODUCT_NAMES[random.nextInt(PRODUCT_NAMES.length)] + " " + System.currentTimeMillis();
            driver.findElement(By.id("name")).sendKeys(productName);
            
            // Click "Generate with AI" button
            WebElement generateAiBtn = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//button[contains(., 'Generate with AI')]")));
            jsClick(generateAiBtn);
            
            // Wait for description textarea to be non-empty (AI generation finish)
            WebElement descriptionArea = driver.findElement(By.id("description"));
            wait.until(d -> !descriptionArea.getAttribute("value").isEmpty());

            driver.findElement(By.id("price")).sendKeys(String.valueOf(20 + random.nextInt(100)));
            driver.findElement(By.id("stock")).sendKeys("50");

            // Add a tag
            WebElement tagBtn = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//button[normalize-space()='Quick' or normalize-space()='Snacks' or normalize-space()='Vegetarian']")));
            tagBtn.click();

            submitButtonByText("Create Product").click();

            // Wait for redirect to product list
            wait.until(ExpectedConditions.urlContains("/owner/products"));
            
            // Verify product exists in list
            wait.until(ExpectedConditions.visibilityOfElementLocated(
                    By.xpath("//h3[contains(normalize-space(), '" + productName.split(" ")[0] + "')]")));
            
            System.out.println("Created product with AI description: " + productName);

            if (i < 2) {
                driver.get(baseUrl + "/owner");
            }
        }
    }

    private void scrollIntoView(WebElement element) {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({block:'center',inline:'nearest'});", element);
    }

    private void jsClick(WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }
}
