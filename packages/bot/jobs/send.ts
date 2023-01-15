/**
 * Run every minute to see where to send the WotD
 */

import { APIEmbed, REST, Routes } from "discord.js";
import { prisma } from "../db";
import { DateTime } from "luxon";
import { WordSource } from "@prisma/client";
import { formatUdMessage } from "../utils/ud";
import config from "../config";
import { UdDefinition } from "../services/ud";
import { formatMwMessage } from "../utils/mw";
import { MWEntry } from "../services/mw";
import { batchedPromisePause } from "../utils/promise";
import logger from "../logger";

const rest = new REST({ version: "10" }).setToken(config.TOKEN);

export const send = async () => {
  const now = DateTime.utc().set({
    second: 0,
    millisecond: 0,
  });

  let udContent: string | null = null;
  const udWotd = await prisma.word.findFirst({
    where: { source: WordSource.UD },
    orderBy: [{ date: "desc" }],
    rejectOnNotFound: false,
  });
  if (udWotd) {
    udContent = formatUdMessage(
      udWotd.word,
      udWotd.payload as unknown as Array<UdDefinition>,
    );
  }

  let mwContent: string | null = null;
  const mwWotd = await prisma.word.findFirst({
    where: { source: WordSource.MW },
    orderBy: [{ date: "desc" }],
    rejectOnNotFound: false,
  });
  if (mwWotd) {
    mwContent = formatMwMessage(
      mwWotd.word, mwWotd.payload as unknown as Array<MWEntry>
    );
  }

  let guilds = await prisma.guild.findMany({
    select: {
      guildId: true,
      channel: true,
      schedule: true,
      dictionary: true,
    },
    where: {
      active: true,
      channel: {
        isNot: null,
      },
      schedule: {
        isNot: null,
      },
      dictionary: {
        isNot: null,
      },
    },
  });

  guilds = guilds.filter(guild => {
    if (guild.channel && guild.schedule && guild.dictionary) {
      const schedule = DateTime.fromObject({
        hour: guild.schedule.scheduledAtHour,
        second: 0,
        millisecond: 0,
      }).setZone(guild.schedule.scheduledAtZone).toUTC();

      return now.equals(schedule);
    } else {
      return false;
    }
  });

  const chunks = guilds.reduce((acc, curr) => {
    if (curr.dictionary) {
      const body = JSON.stringify({
        content: curr.dictionary.dictionary === WordSource.MW
          ? mwContent
          : udContent
      })
      if (acc[acc.length - 1].length === 40) {
        acc.push([
          () => rest.post(
            Routes.channelMessages(curr.channel!.channelId), {
              passThroughBody: true, body, headers: {
                "Content-Type": "application/json",
              },
            },
          ),
        ]);
      } else {
        acc[acc.length - 1].push(
          () => rest.post(
            Routes.channelMessages(curr.channel!.channelId), {
              passThroughBody: true, body, headers: {
                "Content-Type": "application/json",
              },
            },
          ),
        );
      }
    }

    return acc;
  }, [[]] as Array<Array<() => Promise<unknown>>>);

  if (mwContent && udContent) {
    logger.info(`Sending to ${guilds.length} guilds (${chunks.length} chunks)`);
    await batchedPromisePause(chunks, 1100);
    logger.info(`Successfully sent chunks.`);
  }
}