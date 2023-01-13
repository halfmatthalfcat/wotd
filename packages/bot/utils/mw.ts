import { MWEntry } from "../services/mw";

export const formatMwMessage = (word: string, results: Array<MWEntry>): string => {
  const link = `[link](<${encodeURI(`https://merriam-webster.com/dictionary/${word}`)}>)`;
  const docs = `[docs](<https://wotd.halfmatthalfcat.com/>)`;

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
  }).join("\n---");

  return `**${word}**\n${rows}\n\n${link} | ${docs}`;
}