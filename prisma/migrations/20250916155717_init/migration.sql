-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionDate" DATETIME NOT NULL,
    "subtotal" REAL NOT NULL,
    "totalDiscountAmount" REAL NOT NULL,
    "finalTotal" REAL NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "totalQuantity" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "isGiftReceipt" BOOLEAN NOT NULL DEFAULT false,
    "originalTransactionId" TEXT,
    "customerId" TEXT NOT NULL,
    CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_originalTransactionId_fkey" FOREIGN KEY ("originalTransactionId") REFERENCES "Transaction" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "TransactionLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "batchId" TEXT,
    "batchNumber" TEXT,
    "quantity" REAL NOT NULL,
    "displayUnit" TEXT NOT NULL,
    "displayQuantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "lineTotalBeforeDiscount" REAL NOT NULL,
    "lineDiscount" REAL NOT NULL,
    "lineTotalAfterDiscount" REAL NOT NULL,
    "customDiscountValue" REAL,
    "customDiscountType" TEXT,
    "customApplyFixedOnce" BOOLEAN,
    "transactionId" TEXT NOT NULL,
    CONSTRAINT "TransactionLine_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppliedDiscount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discountCampaignName" TEXT NOT NULL,
    "sourceRuleName" TEXT NOT NULL,
    "totalCalculatedDiscount" REAL NOT NULL,
    "ruleType" TEXT NOT NULL,
    "productIdAffected" TEXT,
    "batchIdAffected" TEXT,
    "appliedOnce" BOOLEAN,
    "transactionId" TEXT NOT NULL,
    CONSTRAINT "AppliedDiscount_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paidAmount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "outstandingAmount" REAL NOT NULL,
    "isInstallment" BOOLEAN NOT NULL,
    "transactionId" TEXT NOT NULL,
    CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Transaction_originalTransactionId_idx" ON "Transaction"("originalTransactionId");

-- CreateIndex
CREATE INDEX "TransactionLine_transactionId_idx" ON "TransactionLine"("transactionId");

-- CreateIndex
CREATE INDEX "AppliedDiscount_transactionId_idx" ON "AppliedDiscount"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");
