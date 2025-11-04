# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.


npx prisma generate
npx prisma db push


npx prisma generate
prisma db push --force-reset



model ProductBatch {
  id                      String    @id @default(cuid())
  productId               String
  batchNumber             String
  stock                   Int
  quantity                Int
  costPrice               Float?
  sellingPrice            Float
  barcode                 String?   @unique
  addedDate               DateTime
  manufactureDate         DateTime?
  expiryDate              DateTime?
  location                String?
  notes                   String?
  tax                     Float?
  taxtype                 String?
  discount                Float?
  discountType            String?
  supplierId              String?
  goodsReceivedNoteItem   GoodsReceivedNoteItem?


  product  Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  supplier Supplier? @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  lines    TransactionLine[]

  @@unique([productId, batchNumber])
}


model GoodsReceivedNoteItem {
  id             String       @id @default(cuid())
  grnId          String
  productBatchId String       @unique
  quantity       Int
  costPrice      Float
  discount       Float
  tax            Float
  total          Float

  
  discountType String?
  taxType      String?

  grn            GoodsReceivedNote @relation(fields: [grnId], references: [id], onDelete: Cascade)
  productBatch   ProductBatch      @relation(fields: [productBatchId], references: [id], onDelete: Restrict)
}