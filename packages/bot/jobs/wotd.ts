/**
 * Pull a new WotD every day
 */

import { getMwWord, getMwWotd } from "../services/mw";
import { getUdWotd } from "../services/ud";
import logger from "../logger";

export const wotd = async () => {
  const wiktionaryWotd = await getMwWotd();

  if (wiktionaryWotd) {
    await Promise.all([
      getMwWord(wiktionaryWotd),
      getUdWotd(),
    ]);
    logger.info(`Successfully pulled MW and UD WotDs.`);
  } else {
    logger.warn(`Could not pull Wiktionary word, skipping.`);
  }
};