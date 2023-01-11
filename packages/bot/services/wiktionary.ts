/**
 * Get the WotD from Wiktionary
 */

import fetch from "node-fetch";
import { load } from "cheerio";
import logger from "../logger";

export const getWiktionaryWotd = async (): Promise<string | null> => {
  logger.debug(`Pulling Wiktionary WotD.`);
  const response = await fetch("https://en.wiktionary.org/wiki/Wiktionary:Main_Page");
  if (response.ok) {
    const body = await response.text();
    const $ = load(body);
    const wotd = $("#WOTD-rss-title").text();

    logger.debug(`Successfully pulled Wiktionary: ${wotd}`);

    return wotd;
  } else {
    logger.warn(`Failed to pull Wiktionary: ${response.status}`);
    return null;
  }
}