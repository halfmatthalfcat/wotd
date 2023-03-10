import { MWEntry } from "../services/mw";
import {
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

export const formatMwMessage = (word: string, results: Array<MWEntry>): BaseMessageOptions => {
  const rows = results.map(({ pos, pronunciation, defs }) => {
    const subrow = [
      ...(pos ? [`_${pos}_`] : []),
      ...(pronunciation?.hw ? [pronunciation.hw.replaceAll("*", "•").replaceAll(" ", "•")] : []),
      ...(pronunciation?.prs?.[0]?.mw ? [`_${pronunciation.prs[0].mw}_`] : []),
    ].join(" | ");
    const renderedDefs = defs.map(({ def, num, context, examples }) => {
      const fullDef: string = `${num} ${context.length ? `\`: ${context.join(", ")}\` ` : ""}${def}`;
      const fullExamples: string = examples.map(example => `"${example}"`).join("\n");
      return [
        fullDef,
        ...(fullExamples ? [fullExamples] : []),
      ].join("\n");
    }).join("\n\n");

    return `${subrow}\n\n${renderedDefs}`;
  }).join("\n\n");

  const embed = new EmbedBuilder()
    .setTitle(word)
    .setDescription(rows);

  const components = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel("link")
        .setURL(encodeURI(`https://merriam-webster.com/dictionary/${word}`))
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel("docs")
        .setURL("https://wotd.halfmatthalfcat.com/")
        .setStyle(ButtonStyle.Link),
    );

  return {
    embeds: [embed],
    components: [components],
  };
}