package com.hostelbite.e2e;

import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.testng.Assert;
import org.testng.annotations.Test;

public class AddToCartE2ETest extends BaseE2ETest {

    @Test
    public void testAddToCart() throws Exception {
        clearSession();
        loginAsSeedUser();
        addFirstProductToCart();

        driver.get(baseUrl + "/cart");

        // wait for cart page header and at least one remove button
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h1[contains(normalize-space(), 'Your Cart')]")));
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("button[aria-label='Remove item']")));

        boolean inCartUrl = driver.getCurrentUrl().contains("/cart");
        int removeButtons = driver.findElements(By.cssSelector("button[aria-label='Remove item']")).size();

        Assert.assertTrue(inCartUrl, "Not on cart page. Current URL: " + driver.getCurrentUrl());
        Assert.assertTrue(removeButtons > 0, "No items found in cart");
    }
}
