/*
  Warnings:

  - Added the required column `payload` to the `Word` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "payload" JSONB NOT NULL;
