package com.hostelbite.e2e;

import java.time.Duration;
import java.util.UUID;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;

import io.github.bonigarcia.wdm.WebDriverManager;

public class BaseE2ETest {
    protected WebDriver driver;
    protected WebDriverWait wait;

    protected String baseUrl;
    protected String seedEmail;
    protected String seedPassword;

    @BeforeClass
    public void setup() {
        this.baseUrl = getConfig("baseUrl", "http://localhost:5173");
        this.seedEmail = getConfig("seedEmail", "seed-shop@hostelbite.demo");
        this.seedPassword = getConfig("seedPassword", "SeedPass123!");

        boolean headless = Boolean.parseBoolean(getConfig("headless", "false"));

        // Using WebDriverManager for automatic driver management
        WebDriverManager.chromedriver().setup();

        ChromeOptions options = new ChromeOptions();
        if (headless) {
            options.addArguments("--headless=new");
        }
        options.addArguments("--window-size=1440,900");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");

        this.driver = new ChromeDriver(options);
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(12));
        this.driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(1));
    }

    @AfterClass
    public void teardown() {
        if (driver != null) {
            driver.quit();
        }
    }

    protected String uniqueEmail() {
        return "e2e+" + UUID.randomUUID() + "@hostelbite.test";
    }

    protected void clearSession() {
        driver.manage().deleteAllCookies();
        driver.get(baseUrl + "/auth/login");
        ((JavascriptExecutor) driver)
                .executeScript(
                        "window.localStorage.removeItem('hostelbite_token');"
                                + "window.localStorage.removeItem('hostelbite_user');"
                                + "window.localStorage.removeItem('hostelbite_cart');");
    }

    protected void openLogin() {
        driver.get(baseUrl + "/auth/login");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email")));
    }

    protected void openRegister() {
        driver.get(baseUrl + "/auth/register");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("name")));
    }

    protected WebElement submitButtonByText(String text) {
        String xpath = "//button[normalize-space()='" + text + "']";
        return wait.until(ExpectedConditions.elementToBeClickable(By.xpath(xpath)));
    }

    protected void loginAsSeedUser() {
        openLogin();
        driver.findElement(By.id("email")).sendKeys(seedEmail);
        driver.findElement(By.id("password")).sendKeys(seedPassword);
        submitButtonByText("Sign In").click();
        waitForProductsPage();
    }

    protected void waitForProductsPage() {
        wait.until(ExpectedConditions.urlContains("/products"));
        wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//h1[contains(normalize-space(), 'Browse Menu')]")));
    }

    protected void addFirstProductToCart() {
        waitForProductsPage();
        WebElement addButton =
                wait.until(ExpectedConditions.elementToBeClickable(By.xpath("(//button[normalize-space()='Add'])[1]")));
        addButton.click();
    }

    private String getConfig(String key, String defaultValue) {
        String systemValue = System.getProperty(key);
        if (systemValue != null && !systemValue.isBlank()) {
            return systemValue;
        }

        String envKey = key.replaceAll("([a-z])([A-Z]+)", "$1_$2").toUpperCase();
        String envValue = System.getenv(envKey);
        if (envValue != null && !envValue.isBlank()) {
            return envValue;
        }

        return defaultValue;
    }
}
