import { APIEmbed, EmbedBuilder } from "discord.js";
import { UdDefinition } from "../services/ud";

export const formatUdMessage = (word: string, payload: Array<UdDefinition>): string => {
  const link = `[link](<${encodeURI(`https://urbandictionary.com/define.php?term=${word}`)}>)`;
  const docs = `[docs](<https://wotd.halfmatthalfcat.com/>)`;

  const defs = payload.map((def, i) =>
    `${i + 1}: ${def.definition}\n> ${def.example}`
  ).join("\n\n");

  return `**${word}**\n\n${defs}\n\n${link} | ${docs}`;
}