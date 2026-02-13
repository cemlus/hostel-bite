# HostelBite End-to-End (E2E) Tests

This folder contains Selenium-based end-to-end tests for the HostelBite web application.

The tests simulate real user behaviour in a browser:

- user authentication
- browsing products
- adding items to cart
- checkout & order placement

These are **UI-level integration tests** that verify frontend + backend + routing together.

---

## 🧰 Tech Stack

- Java
- Selenium WebDriver
- ChromeDriver
- Executed from Eclipse
- Run as **Java Applications** (not JUnit)

---

## 📁 Structure

Base class:
BaseE2ETest.java


Contains:
- browser setup / teardown
- waits
- login helpers
- session clearing
- reusable flows like add-to-cart

Test files:
AuthE2ETest.java
AddToCartE2ETest.java
CheckoutE2ETest.java


Each test has a `main()` method and can be run independently.

---

## ▶️ How to Run a Test

### From Eclipse:
Right click the file → **Run As → Java Application**

Example:
Run AuthE2ETest.java


---

## 🌐 Requirements Before Running

You MUST have:

✅ Frontend running → `http://localhost:5173`  
✅ Backend running  
✅ Database connected  
✅ Seed user present  

Default seed user:
email: seed-shop@hostelbite.demo
password: SeedPass123!


---

## 👀 Headless vs Visible Browser

By default tests run **headless** (no UI).

If you want to see the browser:

### Run Configuration → VM Arguments
-Dheadless=false


Now Chrome will open.

---

## 🚗 ChromeDriver Setup

By default we use:
C:\Chrome-Driver\chromedriver_1.exe


If your path is different, either:

### Option 1 – change inside BaseE2ETest  
or  
### Option 2 – pass VM argument:
-Dwebdriver.chrome.driver="C:\path\to\chromedriver.exe"


---

## 🧪 Available Test Flows

### AuthE2ETest
- Register new user
- Login with seed user
- Verify redirect to products

### AddToCartE2ETest
- Login
- Add first product
- Verify item exists in cart

### CheckoutE2ETest
- Login
- Add product
- Proceed to checkout
- Place order
- Verify success screen

---

## ❌ If a Test Fails

### Step 1  
Run with:
-Dheadless=false


### Step 2  
Comment the `closeBrowser()` call to keep window open.

### Step 3  
Observe:
- validation errors
- disabled buttons
- wrong redirects

---

## ⏳ Why waits are important

React loads data asynchronously.

Humans wait.  
Selenium does not.

So we use explicit waits like:
wait.until(...)


instead of relying on sleep.

---

## ⚠ CDP Version Warning

You may see:

Unable to find exact CDP version


This is normal when Chrome updated.
Tests usually still run.

Update Selenium & ChromeDriver together to remove it.

---

## 🎯 Purpose of These Tests

These tests protect critical business flows:

- Can users login?
- Can they order food?
- Can checkout complete?

If these break → production is broken.

---

## 🚀 Future Improvements (planned)

- screenshot on failure
- HTML report
- CI/CD execution
- parallel runs
- auto test data seeding

---

## 🧠 Author Note

Tests are written to be easy to run locally for development learning.

Later they can be migrated to JUnit/TestNG for CI pipelines.