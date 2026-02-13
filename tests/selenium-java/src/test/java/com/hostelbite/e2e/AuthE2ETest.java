package Experiment_1_Packages;

import org.openqa.selenium.By;

public class AuthE2ETest extends BaseE2ETest {

  public static void main(String[] args) throws Exception {

    AuthE2ETest test = new AuthE2ETest();

    test.startBrowser();

    try {
      System.out.println("Running register test...");
      test.registerNewUser();

      System.out.println("Running login test...");
      test.loginWithSeedUser();

      System.out.println("✅ ALL TESTS FINISHED");
    } finally {
//      test.closeBrowser();
    }
  }

  void registerNewUser() throws Exception {
    clearSession();
    openRegister();

    driver.findElement(By.id("name")).sendKeys("Selenium User");
    driver.findElement(By.id("email")).sendKeys(uniqueEmail());
    driver.findElement(By.id("phone")).sendKeys("9876543210");
    driver.findElement(By.id("room")).sendKeys("A-101");
    driver.findElement(By.id("password")).sendKeys("Pass1234");

    submitButtonByText("Create Account").click();

    Thread.sleep(3000);

    if (!driver.getCurrentUrl().contains("/products")) {
      throw new RuntimeException("❌ Register failed");
    }

    System.out.println("✅ Register passed");
  }

  void loginWithSeedUser() throws Exception {
    clearSession();
    openLogin();

    driver.findElement(By.id("email")).sendKeys(seedEmail);
    driver.findElement(By.id("password")).sendKeys(seedPassword);

    submitButtonByText("Sign In").click();

    Thread.sleep(3000);

    if (!driver.getCurrentUrl().contains("/products")) {
      throw new RuntimeException("❌ Login failed");
    }

    System.out.println("✅ Login passed");
  }
}

