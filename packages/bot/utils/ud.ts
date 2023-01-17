import {
  ActionRowBuilder,
  APIEmbed,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { UdDefinition } from "../services/ud";

export const formatUdMessage = (word: string, payload: Array<UdDefinition>): BaseMessageOptions => {
  const defs = payload.map((def, i) =>
    `${i + 1}: ${def.definition}\n> ${def.example}`
  ).join("\n\n");

  const embed = new EmbedBuilder()
    .setTitle(word)
    .setDescription(defs);

  const components = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel("link")
        .setURL(encodeURI(`https://urbandictionary.com/define.php?term=${word}`))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel("docs")
        .setURL("https://wotd.halfmatthalfcat.com/")
        .setStyle(ButtonStyle.Secondary),
    );

  return {
    embeds: [embed],
    components: [components],
  };
}