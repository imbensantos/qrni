import { test, expect } from "@playwright/test";
import { BulkPage } from "./pages/bulk.page";

test.describe("Bulk Mode", () => {
  let bulk: BulkPage;

  test.beforeEach(async ({ page }) => {
    bulk = new BulkPage(page);
    await bulk.goto();
    await bulk.switchToBulk();
  });

  test("switches to bulk mode and shows textarea", async () => {
    await expect(bulk.home.bulkModeBtn).toHaveAttribute("aria-pressed", "true");
    await expect(bulk.textarea).toBeVisible();
    await expect(bulk.textarea).toHaveAttribute(
      "placeholder",
      "Homepage, https://example.com\nGoogle, https://google.com",
    );
  });

  test("shows empty state in preview panel", async () => {
    await expect(bulk.bulkPreview).toBeVisible();
    await expect(bulk.bulkEmpty).toBeVisible();
    await expect(bulk.bulkEmpty).toContainText("Upload a CSV or JSON file to get started");
  });

  test("shows file upload button", async () => {
    await expect(bulk.fileUploadBtn).toBeVisible();
    await expect(bulk.fileUploadBtn).toContainText("or Upload a CSV / JSON");
  });

  test("parses pasted CSV data and shows table", async () => {
    const csvData = "Homepage, https://example.com\nGoogle, https://google.com";
    await bulk.textarea.fill(csvData);

    // Wait for debounced parse (400ms + buffer)
    await bulk.bulkTable.waitFor({ state: "visible", timeout: 2000 });

    await expect(bulk.tableRows).toHaveCount(2);
    await expect(bulk.validCount).toContainText("2 valid");
    await expect(bulk.totalCount).toContainText("2 total");
  });

  test("shows invalid entries for bad URLs", async () => {
    const csvData = "Good, https://example.com\nBad, not-a-url";
    await bulk.textarea.fill(csvData);

    await bulk.bulkTable.waitFor({ state: "visible", timeout: 2000 });

    await expect(bulk.tableRows).toHaveCount(2);
    await expect(bulk.validCount).toContainText("1 valid");
    await expect(bulk.invalidCount).toContainText("1 invalid");
    await expect(bulk.totalCount).toContainText("2 total");
  });

  test("can edit entries inline", async () => {
    const csvData = "Test, https://example.com";
    await bulk.textarea.fill(csvData);

    await bulk.bulkTable.waitFor({ state: "visible", timeout: 2000 });

    // Edit label of row 1
    const labelInput = bulk.labelInput(1);
    await expect(labelInput).toBeVisible();
    await labelInput.fill("Updated Label");
    await expect(labelInput).toHaveValue("Updated Label");

    // Edit URL of row 1
    const urlInput = bulk.urlInput(1);
    await urlInput.fill("https://updated.com");
    await expect(urlInput).toHaveValue("https://updated.com");
  });

  test("add row button adds an empty entry", async () => {
    const csvData = "Test, https://example.com";
    await bulk.textarea.fill(csvData);

    await bulk.bulkTable.waitFor({ state: "visible", timeout: 2000 });
    await expect(bulk.tableRows).toHaveCount(1);

    await bulk.addRowBtn.click();
    await expect(bulk.tableRows).toHaveCount(2);
  });

  test("shows export buttons when entries exist", async () => {
    const csvData = "Test, https://example.com";
    await bulk.textarea.fill(csvData);

    await bulk.bulkTable.waitFor({ state: "visible", timeout: 2000 });

    await expect(bulk.downloadZipBtn).toBeVisible();
    await expect(bulk.downloadZipBtn).toBeEnabled();
    await expect(bulk.downloadPdfBtn).toBeVisible();
    await expect(bulk.downloadPdfBtn).toBeEnabled();
  });

  test("export buttons are disabled when no valid entries", async () => {
    const csvData = "Bad, not-a-url";
    await bulk.textarea.fill(csvData);

    await bulk.bulkTable.waitFor({ state: "visible", timeout: 2000 });

    await expect(bulk.downloadZipBtn).toBeDisabled();
    await expect(bulk.downloadPdfBtn).toBeDisabled();
  });

  test("bulk mode has its own format selector", async () => {
    await expect(bulk.bulkFormatGroup).toBeVisible();
    await expect(bulk.bulkFormatOption("PNG")).toBeVisible();
    await expect(bulk.bulkFormatOption("SVG")).toBeVisible();
    await expect(bulk.bulkFormatOption("WEBP")).toBeVisible();
  });

  test("format selector works in bulk mode", async () => {
    await expect(bulk.bulkFormatOption("PNG")).toHaveAttribute("aria-checked", "true");

    await bulk.bulkFormatOption("SVG").click();
    await expect(bulk.bulkFormatOption("SVG")).toHaveAttribute("aria-checked", "true");
    await expect(bulk.bulkFormatOption("PNG")).toHaveAttribute("aria-checked", "false");
  });

  test("clearing textarea returns to empty state", async () => {
    const csvData = "Test, https://example.com";
    await bulk.textarea.fill(csvData);
    await bulk.bulkTable.waitFor({ state: "visible", timeout: 2000 });

    // Clear
    await bulk.textarea.fill("");
    await bulk.bulkEmpty.waitFor({ state: "visible", timeout: 2000 });
    await expect(bulk.bulkEmpty).toBeVisible();
  });

  test("switching back to single mode preserves URL input", async ({ page }) => {
    // Switch back to single
    await bulk.home.singleModeBtn.click();
    await expect(bulk.home.urlInput).toBeVisible();
    await expect(bulk.home.generateBtn).toBeVisible();
  });
});
