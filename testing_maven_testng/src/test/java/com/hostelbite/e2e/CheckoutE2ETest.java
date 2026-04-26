package com.hostelbite.e2e;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.testng.Assert;
import org.testng.annotations.Test;

public class CheckoutE2ETest extends BaseE2ETest {

    @Test
    public void testCheckout() throws Exception {
        clearSession();
        loginAsSeedUser();
        addFirstProductToCart();

        driver.get(baseUrl + "/cart");

        WebElement proceedButton = wait.until(ExpectedConditions.elementToBeClickable(By.linkText("Proceed to Checkout")));
        proceedButton.click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.xpath("//h1[contains(normalize-space(), 'Checkout')]")));

        WebElement roomInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("room")));
        roomInput.clear();
        roomInput.sendKeys("A-101");

        submitButtonByText("Place Order").click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.xpath("//h1[contains(normalize-space(), 'Order Confirmed!')]")));

        Assert.assertTrue(driver.getCurrentUrl().contains("/checkout"), "Checkout failed: Not on checkout confirmation page. URL: " + driver.getCurrentUrl());
    }
}
