-- CreateTable
CREATE TABLE "GuildDictionary" (
    "guildId" TEXT NOT NULL,
    "dictionary" "WordSource" NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildDictionary_pkey" PRIMARY KEY ("guildId")
);

-- AddForeignKey
ALTER TABLE "GuildDictionary" ADD CONSTRAINT "GuildDictionary_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("guildId") ON DELETE RESTRICT ON UPDATE CASCADE;
