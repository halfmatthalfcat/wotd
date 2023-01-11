/**
 * MW Service
 */

import fetch from "node-fetch";
import config from "../config";
import logger from "../logger";
import { prisma } from "../db";
import { WordSource } from "@prisma/client";

interface MWMeta {
  id: string;
  uuid: string;
  sort: string;
  src: string;
  section: string;
  stems: Array<string>;
  offensive: boolean;
}

interface MWPronunciation {
  hw: string;
  prs: Array<{ mw: string; }>;
}

export interface MWResult {
  meta: MWMeta;
  hwi: MWPronunciation;
  // part of speech
  fl: string;
  shortdef: Array<string>;
}

export const getMwWord = async (word: string) => {
  logger.debug(`Pulling ${word} from MW.`);
  const response = await fetch(
    `https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${config.MW_KEY}`
  );

  if (response.ok) {
    logger.debug(`Successfully pulled ${word} from MW.`);
    const [{ meta, hwi, fl, shortdef }] = await response.json();
    return await prisma.word.create({
      data: {
        word,
        source: WordSource.MW,
        payload: {
          meta,
          hwi,
          fl,
          shortdef,
        },
      }
    })
  } else {
    logger.warn(`Failed to pull ${word} from MW.`);
    return null;
  }
}