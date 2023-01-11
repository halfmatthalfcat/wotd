import {
  REST,
  Routes,
  ChannelType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  AutocompleteInteraction,
} from "discord.js";
import { prisma } from "./db";
import config from "./config";
import { timeZonesNames } from "@vvo/tzdb";
import logger from "./logger";
import { WordSource } from "@prisma/client";
import { formatMwMessage } from "./utils/mw";
import { MWResult } from "./services/mw";
import { formatUdMessage } from "./utils/ud";
import { UdDefinition } from "./services/ud";

const tzLower = timeZonesNames.map(tz => ({
  tz,
  lower: tz.toLowerCase(),
}));

const rest = new REST({ version: "10" }).setToken(config.TOKEN);

type SlashCommandTypes =
  SlashCommandBuilder |
  ReturnType<InstanceType<typeof SlashCommandBuilder>["addStringOption"]> |
  ReturnType<InstanceType<typeof SlashCommandBuilder>["addChannelOption"]> |
  ReturnType<InstanceType<typeof SlashCommandBuilder>["addAttachmentOption"]> |
  ReturnType<InstanceType<typeof SlashCommandBuilder>["addBooleanOption"]> |
  ReturnType<InstanceType<typeof SlashCommandBuilder>["addSubcommand"]> |
  ReturnType<InstanceType<typeof SlashCommandBuilder>["addIntegerOption"]> |
  ReturnType<InstanceType<typeof SlashCommandBuilder>["addMentionableOption"]> |
  ReturnType<InstanceType<typeof SlashCommandBuilder>["addNumberOption"]> |
  ReturnType<InstanceType<typeof SlashCommandBuilder>["addRoleOption"]> |
  ReturnType<InstanceType<typeof SlashCommandBuilder>["addSubcommandGroup"]> |
  ReturnType<InstanceType<typeof SlashCommandBuilder>["addUserOption"]>;

export interface InteractiveCommand {
  data: SlashCommandTypes;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export enum Command {
  setup = "setup",
  channel = "target",
  time = "schedule",
  dictionary = "dictionary",
  wotd = "wotd"
}

export enum CommandOption {
  channel = "channel",
  time = "time",
  tz = "tz",
  dictionary = "dictionary"
}

export const commands: Record<Command, InteractiveCommand> = {
  [Command.setup]: {
    data: new SlashCommandBuilder()
      .setName(Command.setup)
      .setDescription("Setup the WotD bot.")
      .addChannelOption(option =>
        option
          .setName(CommandOption.channel)
          .setDescription("The channel to send the WotD.")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
      .addNumberOption(option =>
        option
          .setName(CommandOption.time)
          .setDescription("The hour (0-23) to send the WotD.")
          .setRequired(true)
          .setMaxValue(23)
          .setMinValue(0)
      )
      .addStringOption(option =>
        option
          .setName(CommandOption.tz)
          .setDescription("The timezone to send the WotD.")
          .setAutocomplete(true)
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName(CommandOption.dictionary)
          .setDescription("The dictionary to use for WotD.")
          .setRequired(true)
          .addChoices(
            { name: "Merriam-Webster", value: WordSource.MW },
            { name: "Urban Dictionary", value: WordSource.UD },
          )
      ),
    execute: async (interaction) => {
      const guild = interaction.guild;

      if (guild) {
        const guildExists = await prisma.guild.findFirst({
          where: {
            guildId: guild.id,
            active: true,
          },
          rejectOnNotFound: false,
        });

        if (!guildExists) {
          await interaction.reply({
            ephemeral: true,
            content: `WotD is deactivated or kicked from the guild.`,
          });
          return;
        }

        const channel = interaction.options.getChannel(CommandOption.channel);
        const hour = interaction.options.getNumber(CommandOption.time);
        const tz = interaction.options.getString(CommandOption.tz);
        const dictionary = interaction.options.getString(CommandOption.dictionary);

        if (!channel) {
          await interaction.reply({
            ephemeral: true,
            content: `Failed to find that channel. Either try again or a different channel.`,
          });
          return;
        } else if (hour == null) {
          await interaction.reply({
            ephemeral: true,
            content: `Failed to retrieve hour. Try adding hour again.`,
          });
          return;
        } else if (tz == null) {
          await interaction.reply({
            ephemeral: true,
            content: `Failed to retrieve tz. Try adding hour tz.`,
          });
          return;
        } else if (!timeZonesNames.some((tzn) => tz === tzn)) {
          await interaction.reply({
            ephemeral: true,
            content: `${tz} is not a valid timezone. Try adding tz again.`,
          });
          return;
        } else if (!WordSource[dictionary as WordSource]) {
          await interaction.reply({
            ephemeral: true,
            content: `${dictionary} is not a valid dictionary.`,
          });
          return;
        }

        try {
          await prisma.guildChannel.upsert({
            where: { guildId: guild.id },
            update: { channelId: channel.id },
            create: {
              guildId: guild.id,
              channelId: channel.id,
            },
          });

          await prisma.guildSchedule.upsert({
            where: { guildId: guild.id },
            update: {
              scheduledAtHour: hour,
              scheduledAtZone: tz,
            },
            create: {
              guildId: guild.id,
              scheduledAtHour: hour,
              scheduledAtZone: tz,
            },
          });

          await prisma.guildDictionary.upsert({
            where: { guildId: guild.id },
            update: { dictionary: dictionary as WordSource },
            create: {
              guildId: guild.id,
              dictionary: dictionary as WordSource,
            },
          })

          await interaction.reply({
            ephemeral: true,
            content: `Successfully setup WotD bot!`,
          });
        } catch (ex) {
          await interaction.reply({
            ephemeral: true,
            content: `Something went wrong during WotD bot setup. Try again.`,
          });
          logger.error(`Failed to setup WotD bot.`, ex);
        }
      }
    },
    autocomplete: async (interaction) => {
      const focusedValue = interaction.options.getFocused();
      const options = tzLower.filter(({ lower }) => lower.includes(focusedValue.toLowerCase())).slice(0, 20);
      await interaction.respond(
        options.map(({ tz }) => ({
          name: tz,
          value: tz,
        })),
      );
    },
  },
  [Command.channel]: {
    data: new SlashCommandBuilder()
      .setName(Command.channel)
      .setDescription("Set the channel to send the WotD.")
      .addChannelOption(option =>
        option
          .setName(CommandOption.channel)
          .setDescription("The channel to send the WotD.")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      ),
    execute: async (interaction) => {
      const guild = interaction.guild;
      const channel = interaction.options.getChannel(CommandOption.channel);
      if (guild) {
        const guildExists = await prisma.guild.findFirst({
          where: {
            guildId: guild.id,
            active: true,
          },
          rejectOnNotFound: false,
        });

        if (!guildExists) {
          await interaction.reply({
            ephemeral: true,
            content: `WotD is deactivated or kicked from the guild.`,
          });
          return;
        }

        if (channel) {
          try {
            await prisma.guildChannel.upsert({
              where: { guildId: guild.id },
              update: { channelId: channel.id },
              create: {
                guildId: guild.id,
                channelId: channel.id,
              },
            });
            await interaction.reply({
              ephemeral: true,
              content: `Successfully set ${channel.name} as the target channel.`
            });
          } catch (ex) {
            await interaction.reply({
              ephemeral: true,
              content: `Failed to set ${channel.name} as the target channel.`,
            });
            logger.error(`Failed to set ${channel.name} as the target channel for ${guild.name}.`, ex);
          }
        } else {
          await interaction.reply({
            ephemeral: true,
            content: `Failed to find that channel. Either try again or a different channel.`,
          });
        }
      } else {
        await interaction.reply({
          ephemeral: true,
          content: `Failed to retrieve guild. Try adding channel again.`,
        });
      }
    },
  },
  [Command.time]: {
    data: new SlashCommandBuilder()
      .setName(Command.time)
      .setDescription("Set the time to send the WotD.")
      .addNumberOption(option =>
        option
          .setName(CommandOption.time)
          .setDescription("The hour (0-23) to send the WotD.")
          .setRequired(true)
          .setMaxValue(23)
          .setMinValue(0)
      )
      .addStringOption(option =>
        option
          .setName(CommandOption.tz)
          .setDescription("The timezone to send the WotD.")
          .setAutocomplete(true)
          .setRequired(true)
      ),
    execute: async (interaction) => {
      const guild = interaction.guild;
      const hour = interaction.options.getNumber(CommandOption.time);
      const tz = interaction.options.getString(CommandOption.tz);

      if (guild) {
        const guildExists = await prisma.guild.findFirst({
          where: {
            guildId: guild.id,
            active: true,
          },
          rejectOnNotFound: false,
        });

        if (!guildExists) {
          await interaction.reply({
            ephemeral: true,
            content: `WotD is deactivated or kicked from the guild.`,
          });
          return;
        }

        if (!timeZonesNames.some((tzn) => tz === tzn)) {
          await interaction.reply({
            ephemeral: true,
            content: `${tz} is not a valid timezone. Try adding tz again.`,
          });
          return;
        }

        if (hour != null && tz != null) {
          try {
            await prisma.guildSchedule.upsert({
              where: { guildId: guild.id },
              update: {
                scheduledAtHour: hour,
                scheduledAtZone: tz,
              },
              create: {
                guildId: guild.id,
                scheduledAtHour: hour,
                scheduledAtZone: tz,
              },
            });
            await interaction.reply({
              ephemeral: true,
              content: `Successfully set WotD schedule to ${hour}/${tz}.`
            });
          } catch (ex) {
            await interaction.reply({
              ephemeral: true,
              content: `Failed to set WotD schedule to ${hour}/${tz}.`,
            });
            logger.error(`Failed to set WotD schedule to ${hour}/${tz} for ${guild.name}.`);
          }
        } else {
          await interaction.reply({
            ephemeral: true,
            content: `Failed to retrieve time and/or tz. Try adding time and/or tz again.`,
          });
        }
      } else {
        await interaction.reply({
          ephemeral: true,
          content: `Failed to retrieve guild. Try adding time and/or tz again.`,
        });
      }
    },
    autocomplete: async (interaction) => {
      const focusedValue = interaction.options.getFocused();
      const options = tzLower.filter(({ lower }) => lower.includes(focusedValue.toLowerCase())).slice(0, 20);
      await interaction.respond(
        options.map(({ tz }) => ({
          name: tz,
          value: tz,
        })),
      );
    }
  },
  [Command.dictionary]: {
    data: new SlashCommandBuilder()
      .setName(Command.dictionary)
      .setDescription("Set the dictionary to use for WotD.")
      .addStringOption(option =>
        option
          .setName(CommandOption.dictionary)
          .setDescription("The dictionary to use for WotD.")
          .setRequired(true)
          .addChoices(
            { name: "Merriam-Webster", value: WordSource.MW },
            { name: "Urban Dictionary", value: WordSource.UD },
          )
      ),
    execute: async (interaction) => {
      const guild = interaction.guild;
      const dictionary = interaction.options.getString(CommandOption.dictionary);

      if (guild) {
        const guildExists = await prisma.guild.findFirst({
          where: {
            guildId: guild.id,
            active: true,
          },
          rejectOnNotFound: false,
        });

        if (!guildExists) {
          await interaction.reply({
            ephemeral: true,
            content: `WotD is deactivated or kicked from the guild.`,
          });
          return;
        }

        if (dictionary && WordSource[dictionary as WordSource]) {
          try {
            await prisma.guildDictionary.upsert({
              where: { guildId: guild.id },
              update: { dictionary: dictionary as WordSource },
              create: {
                guildId: guild.id,
                dictionary: dictionary as WordSource,
              },
            })
            await interaction.reply({
              ephemeral: true,
              content: `Successfully set ${
                dictionary === WordSource.MW
                  ? "Merriam-Webster"
                  : "Urban Dictionary"
              } as the dictionary.`
            });
          } catch (ex) {
            await interaction.reply({
              ephemeral: true,
              content: `Failed to set ${
                dictionary === WordSource.MW
                  ? "Merriam-Webster"
                  : "Urban Dictionary"
              } as the dictionary.`,
            });
            logger.error(`Failed to set ${
              dictionary === WordSource.MW
                ? "Merriam-Webster"
                : "Urban Dictionary"
            } as the dictionary for ${guild.id}.`, ex);
          }
        } else {
          await interaction.reply({
            ephemeral: true,
            content: `${dictionary} is not a valid dictionary. Try adding dictionary again.`,
          });
        }
      } else {
        await interaction.reply({
          ephemeral: true,
          content: `Failed to retrieve guild. Try adding dictionary again.`,
        });
      }
    },
  },
  [Command.wotd]: {
    data: new SlashCommandBuilder()
      .setName(Command.wotd)
      .setDescription("Send the WotD to the enabled channel manually."),
    execute: async (interaction) => {
      const guild = interaction.guild;

      if (guild) {
        const guildExists = await prisma.guild.findFirst({
          where: {
            guildId: guild.id,
            active: true,
          },
          rejectOnNotFound: false,
        });

        if (!guildExists) {
          await interaction.reply({
            ephemeral: true,
            content: `WotD is deactivated or kicked from the guild.`,
          });
          return;
        }

        try {
          const channel = await prisma.guild.findFirst({
            where: { guildId: guild.id },
            select: { dictionary: true },
          });

          if (channel?.dictionary) {
            const word = await prisma.word.findFirst({
              where: { source: channel.dictionary.dictionary },
              orderBy: [{ date: "desc" }],
              rejectOnNotFound: false,
            });

            if (word && word.source === WordSource.MW) {
              await interaction.reply({
                embeds: [{
                  color: 0,
                  description: formatMwMessage(word.payload as unknown as MWResult),
                }],
              });
            } else if (word && word.source === WordSource.UD) {
              await interaction.reply({
                embeds: [{
                  color: 0,
                  description: formatUdMessage(word.word, word.payload as unknown as Array<UdDefinition>),
                }]
              });
            } else {
              await interaction.reply({
                ephemeral: true,
                content: `We couldn't find the latest WotD, yikes! Something is wrong on our end.`,
              });
              return;
            }
          } else {
            await interaction.reply({
              ephemeral: true,
              content: `Dictionary not setup for this guild. Did you run /setup or /dictionary?`,
            });
            return;
          }
        } catch (ex) {
          await interaction.reply({
            ephemeral: true,
            content: `Failed to send WotD manually.`,
          });
          logger.error(`Failed to send WotD manually for ${guild.id}`, ex);
        }
      } else {
        await interaction.reply({
          ephemeral: true,
          content: `Failed to retrieve guild. Try adding dictionary again.`,
        });
      }
    },
  }
};

export const registerCommands = async (guildId: string): Promise<boolean> => {
  try {
    const body = Object.values(commands).map(c => c.data.toJSON());
    const data = (await rest.put(
      Routes.applicationGuildCommands(config.CLIENT_ID, guildId),
      { body },
    )) as Array<unknown>;

    return body.length === data.length;
  } catch (ex) {
    logger.error(`Failed to register commands`, ex);
    return false;
  }
};