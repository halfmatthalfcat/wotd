import { MWResult } from "../services/mw";

export const formatMwMessage = ({ meta, hwi, fl, shortdef }: MWResult) => {
  const subrow = [
    ...(fl ? [`_${fl}_`] : []),
    ...(hwi?.hw ? [hwi.hw.replaceAll("*", "•")] : []),
    ...(hwi?.prs?.[0]?.mw ? [`_${hwi?.prs?.[0]?.mw}_`] : []),
  ].join(" | ");
  const defs = shortdef
    .map((def, i) => `${i + 1}. ${def}`)
    .join("\n");
  const link = `[link](https://merriam-webster.com/dictionary/${meta.id})`;
  const docs = `[docs](https://wotd.halfmatthalfcat.com/)`;

  return `
**${meta.id}**
${subrow}

${defs}

${link} | ${docs}
`.trim();
}