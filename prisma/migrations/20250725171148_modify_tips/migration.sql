/*
  Warnings:

  - Added the required column `userId` to the `Tips` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tips" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Tips" ADD CONSTRAINT "Tips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
