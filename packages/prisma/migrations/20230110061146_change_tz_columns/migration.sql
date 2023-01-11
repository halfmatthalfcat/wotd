/*
  Warnings:

  - You are about to drop the column `scheduledAt` on the `GuildSchedule` table. All the data in the column will be lost.
  - Added the required column `scheduledAtHour` to the `GuildSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledAtZone` to the `GuildSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GuildSchedule" DROP COLUMN "scheduledAt",
ADD COLUMN     "scheduledAtHour" INTEGER NOT NULL,
ADD COLUMN     "scheduledAtZone" TEXT NOT NULL;
