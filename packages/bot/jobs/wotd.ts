/**
 * Pull a new WotD every day
 */

import { getWiktionaryWotd } from "../services/wiktionary";
import { getMwWord } from "../services/mw";
import { getUdWotd } from "../services/ud";
import logger from "../logger";

export const wotd = async () => {
  const wiktionaryWotd = await getWiktionaryWotd();

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