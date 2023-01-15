import { Client, Events, GatewayIntentBits } from "discord.js";
import { Command, commands, InteractiveCommand, registerCommands } from "./commands";
import cron from "node-cron";
import config from "./config";
import logger from "./logger";
import { wotd } from "./jobs/wotd";
import { send } from "./jobs/send";

cron.schedule("0 0 * * *", async () => {
  logger.info(`Starting WotD job.`);
  await wotd();
  logger.info(`Completed WotD job.`);
});

cron.schedule("* * * * *", async () => {
  logger.info(`Starting send job.`);
  await send();
  logger.info(`Completed send job.`);
});

const client = new Client({
  intents: [ GatewayIntentBits.Guilds ],
});

client
  .once(Events.ClientReady, () => {
    logger.info(`Successfully connected to Discord.`);
  })
  .on(Events.GuildCreate, async (ev) => {
    try {
      const exists = await prisma.guild.findFirst({
        where: { guildId: ev.id },
        rejectOnNotFound: false,
      });

      if (!exists) {
        await prisma.guild.create({
          data: {
            guildId: ev.id,
            name: ev.name,
          },
        });
        logger.info(`Created guild ${ev.id}`);
      } else {
        await prisma.guild.update({
          where: { guildId: ev.id },
          data: { active: true },
        });
        logger.info(`Re-enabled guild ${ev.id}`);
      }
    } catch (ex) {
      logger.error(`Guild create error`, ex);
    }
  })
  .on(Events.GuildDelete, async (ev) => {
    try {
      const exists = await prisma.guild.findFirst({
        where: { guildId: ev.id },
        rejectOnNotFound: false,
      });

      if (exists) {
        await prisma.guild.update({
          where: { guildId: ev.id },
          data: { active: false },
        });
        logger.info(`Deactivated guild ${ev.id}`);
      }
    } catch (ex) {
      logger.error(`Guild deactivation error`, ex);
    }
  })
  .on(Events.InteractionCreate, async (ev) => {
    if (ev.isChatInputCommand()) {
      logger.debug(`Received ${ev.commandName} command`);
      const command: InteractiveCommand | undefined = commands[ev.commandName as Command];
      if (command) {
        try {
          await command.execute(ev);
          logger.debug(`Executed ${ev.commandName} for ${ev.guild?.name ?? "Unknown"} (${ev.guildId})`);
        } catch (ex) {
          await ev.reply({
            ephemeral: true,
            content: `There was an error executing this command.`,
          });
          logger.error(`Error while executing ${ev.commandName} for ${ev.guild?.name ?? "Unknown"} (${ev.guildId})`, ex);
        }
      } else {
        await ev.reply({
          ephemeral: true,
          content: `${ev.commandName} is not a valid WotD command.`,
        });
        logger.debug(`Invalid command ${ev.commandName} sent by ${ev.guild?.name ?? "Unknown"} (${ev.guildId})`);
      }
    } else if (ev.isAutocomplete()) {
      try {
        const command: InteractiveCommand | undefined = commands[ev.commandName as Command];
        await command.autocomplete?.(ev);
      } catch (ex) {
        await ev.respond([]);
        logger.error(`Error while retrieving autocomplete results for ${ev.guild?.name ?? "Unknown"} (${ev.guildId})`, ex);
      }
    }
  })
  .login(config.TOKEN)