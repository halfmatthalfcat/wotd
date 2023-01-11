import { UdDefinition } from "../services/ud";

export const formatUdMessage = (word: string, payload: Array<UdDefinition>) => {
  const defs = payload.map((def, i) => [
    `${i + 1}. ${def.definition}`,
    `   > ${def.example}`
  ].join("\n")).join("\n");

  const link = `[link](${encodeURI(`https://urbandictionary.com/define.php?term=${word}`)})`;
  const docs = `[docs](https://wotd.halfmatthalfcat.com/)`;

  return `
**${word}**

${defs}

${link} | ${docs}
`.trim();
}