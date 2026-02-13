package Experiment_1_Packages;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class SearchAndFilterE2ETest extends BaseE2ETest {

  public static void main(String[] args) throws Exception {
    SearchAndFilterE2ETest test = new SearchAndFilterE2ETest();
    test.startBrowser();

    try {
      System.out.println("Running searchAndFilter test...");
      test.clearSession();
      test.loginAsSeedUser();
      test.waitForProductsPage();

      WebElement searchInput =
          test.wait.until(
              ExpectedConditions.visibilityOfElementLocated(
                  By.cssSelector("input[placeholder='Search products...']")));

      // Search flow: seeded dataset contains "Oreo Original".
      searchInput.sendKeys("Oreo");
      test.wait.until(
          ExpectedConditions.visibilityOfElementLocated(
              By.xpath("//h3[normalize-space()='Oreo Original']")));

      // Filter flow: clear search, then filter for drinks and expect drink items.
      searchInput.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.DELETE);
      test.wait.until(driver -> searchInput.getAttribute("value").isEmpty());


      test.clickFilter("Drink", "Beverages");

      test.wait.until(
          ExpectedConditions.visibilityOfElementLocated(
              By.xpath(
                  "//h3[normalize-space()='Coca-Cola' or normalize-space()='Pepsi' or normalize-space()='Sprite' or normalize-space()='Fanta Orange']")));

      if (!test.driver.getCurrentUrl().contains("/products")) {
        System.out.println("Current URL = " + test.driver.getCurrentUrl());
        throw new RuntimeException("❌ searchAndFilter failed: not on /products");
      }

      System.out.println("✅ searchAndFilter passed");
    } finally {
      // comment this during debugging to keep the browser open
//      test.closeBrowser();
    }
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
