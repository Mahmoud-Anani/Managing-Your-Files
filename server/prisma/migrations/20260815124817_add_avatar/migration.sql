-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('VIEW', 'EDIT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT;

-- CreateTable
CREATE TABLE "file_shares" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "permission" "Permission" NOT NULL DEFAULT 'VIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "file_shares_sharedWithId_idx" ON "file_shares"("sharedWithId");

-- CreateIndex
CREATE INDEX "file_shares_sharedById_idx" ON "file_shares"("sharedById");

-- CreateIndex
CREATE UNIQUE INDEX "file_shares_fileId_sharedWithId_key" ON "file_shares"("fileId", "sharedWithId");

-- AddForeignKey
ALTER TABLE "file_shares" ADD CONSTRAINT "file_shares_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_shares" ADD CONSTRAINT "file_shares_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_shares" ADD CONSTRAINT "file_shares_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
