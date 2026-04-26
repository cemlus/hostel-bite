package com.hostelbite.e2e;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.testng.Assert;
import org.testng.annotations.Test;

public class SearchAndFilterE2ETest extends BaseE2ETest {

    @Test
    public void testSearchAndFilter() throws Exception {
        clearSession();
        loginAsSeedUser();
        waitForProductsPage();

        WebElement searchInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.cssSelector("input[placeholder='Search products...']")));

        // Search flow: seeded dataset contains "Oreo Original".
        searchInput.sendKeys("Oreo");
        wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//h3[normalize-space()='Oreo Original']")));

        // Filter flow: clear search, then filter for drinks and expect drink items.
        searchInput.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.DELETE);
        wait.until(driver -> searchInput.getAttribute("value").isEmpty());

        clickFilter("Drink", "Beverages");

        wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath(
                                "//h3[normalize-space()='Coca-Cola' or normalize-space()='Pepsi' or normalize-space()='Sprite' or normalize-space()='Fanta Orange']")));

        Assert.assertTrue(driver.getCurrentUrl().contains("/products"), "SearchAndFilter failed: Not on /products page. URL: " + driver.getCurrentUrl());
    }

    private void clickFilter(String primaryLabel, String fallbackLabel) {
        By primary = By.xpath("//button[normalize-space()='" + primaryLabel + "']");
        By fallback = By.xpath("//button[normalize-space()='" + fallbackLabel + "']");

        if (!driver.findElements(primary).isEmpty()) {
            wait.until(ExpectedConditions.elementToBeClickable(primary)).click();
            return;
        }

        wait.until(ExpectedConditions.elementToBeClickable(fallback)).click();
    }
}
