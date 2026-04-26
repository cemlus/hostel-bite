package com.hostelbite.e2e;

import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.Select;
import org.testng.Assert;
import org.testng.annotations.Test;

public class AuthE2ETest extends BaseE2ETest {

    @Test
    public void testRegisterNewUser() throws Exception {
        clearSession();
        openRegister();

        driver.findElement(By.id("name")).sendKeys("Selenium User");
        driver.findElement(By.id("email")).sendKeys(uniqueEmail());
        
        // Select hostel from dropdown
        Select hostelSelect = new Select(driver.findElement(By.id("hostel")));
        // Select the first available hostel after "Select your hostel"
        hostelSelect.selectByIndex(1);

        driver.findElement(By.id("phone")).sendKeys("9876543210");
        driver.findElement(By.id("room")).sendKeys("A-101");
        driver.findElement(By.id("password")).sendKeys("Pass1234");

        submitButtonByText("Create Account").click();

        // Wait for redirect to products page
        wait.until(org.openqa.selenium.support.ui.ExpectedConditions.urlContains("/products"));
        
        Assert.assertTrue(driver.getCurrentUrl().contains("/products"), "Register failed: Not redirected to products page");
    }

    @Test
    public void testLoginWithSeedUser() throws Exception {
        clearSession();
        openLogin();

        driver.findElement(By.id("email")).sendKeys(seedEmail);
        driver.findElement(By.id("password")).sendKeys(seedPassword);

        submitButtonByText("Sign In").click();

        // Wait for redirect to products page
        wait.until(org.openqa.selenium.support.ui.ExpectedConditions.urlContains("/products"));

        Assert.assertTrue(driver.getCurrentUrl().contains("/products"), "Login failed: Not redirected to products page");
    }
}
