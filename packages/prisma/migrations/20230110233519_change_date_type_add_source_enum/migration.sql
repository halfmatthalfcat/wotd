/*
  Warnings:

  - You are about to drop the column `addedAt` on the `Word` table. All the data in the column will be lost.
  - Added the required column `source` to the `Word` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WordSource" AS ENUM ('MW', 'UD');

-- AlterTable
ALTER TABLE "Word" DROP COLUMN "addedAt",
ADD COLUMN     "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "source" "WordSource" NOT NULL;
