-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "totalDiscountAmount" DOUBLE PRECISION NOT NULL,
    "finalTotal" DOUBLE PRECISION NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "totalQuantity" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "isGiftReceipt" BOOLEAN NOT NULL DEFAULT false,
    "originalTransactionId" TEXT,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "outstandingAmount" DOUBLE PRECISION NOT NULL,
    "isInstallment" BOOLEAN NOT NULL,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TransactionLine" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "batchId" TEXT,
    "batchNumber" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "displayUnit" TEXT NOT NULL,
    "displayQuantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "lineTotalBeforeDiscount" DOUBLE PRECISION NOT NULL,
    "lineDiscount" DOUBLE PRECISION NOT NULL,
    "lineTotalAfterDiscount" DOUBLE PRECISION NOT NULL,
    "customDiscountValue" DOUBLE PRECISION,
    "customDiscountType" TEXT,
    "customApplyFixedOnce" BOOLEAN,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "TransactionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AppliedDiscountLog" (
    "id" TEXT NOT NULL,
    "discountCampaignName" TEXT NOT NULL,
    "sourceRuleName" TEXT NOT NULL,
    "totalCalculatedDiscount" DOUBLE PRECISION NOT NULL,
    "ruleType" TEXT NOT NULL,
    "productIdAffected" TEXT,
    "batchIdAffected" TEXT,
    "appliedOnce" BOOLEAN,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "AppliedDiscountLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_name_key" ON "public"."Customer"("name");

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionLine" ADD CONSTRAINT "TransactionLine_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppliedDiscountLog" ADD CONSTRAINT "AppliedDiscountLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
