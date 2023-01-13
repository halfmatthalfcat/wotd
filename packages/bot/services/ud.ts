/**
 * Urban Dictionary Service
 */

import { WordSource } from "@prisma/client";
import { prisma } from "../db";
import fetch from "node-fetch";
import logger from "../logger";

export interface UdDefinition {
  word: string;
  definition: string;
  example: string;
  thumbs_up: number;
  thumbs_down: number;
}

export interface UdResponse {
  list: Array<UdDefinition>;
}

const cleanStrings = (str: string) =>
  str
    .replaceAll(/\\r/g, "")
    .replaceAll(/\s+/g, " ")
    .replaceAll(/[\[\]]/g, "")
    .trim()

export const getUdWotd = async () => {
  logger.debug(`Pulling UD WotD.`);
  const possibleWotd = (await Promise.all(
    Array.from({ length: 5 }, () => fetch(
      `https://api.urbandictionary.com/v0/random`
    ).then<UdResponse>(response => response.json())
    .then(response => response.list))
  ))
    .flat()
    .filter(def => def.definition.length + def.example.length < 600)
    .sort((
      { thumbs_up: tu1, thumbs_down: td1 },
      { thumbs_up: tu2, thumbs_down: td2 }
    ) => {
      const sum1 = tu1 + td1;
      const sum2 = tu2 + td2;
      return sum1 > sum2 ? -1 : sum2 > sum1 ? 1 : 0;
    })

  logger.debug(`Successfully pulled ${possibleWotd.length} potential WotD candidates from UD.`);

  for (const { word } of possibleWotd) {
    const exists = await prisma.word.findFirst({
      where: {
        source: WordSource.UD,
        word,
      },
      rejectOnNotFound: false,
    });

    if (!exists) {
      logger.debug(`UD WotD candidate ${word} doesn't exist, pulling definitions.`);
      try {
        const defs = await fetch(
          `https://api.urbandictionary.com/v0/define?term=${word}`,
        )
          .then<UdResponse>(response => response.json())
          .then(response =>
            response
              .list
              .sort(({ thumbs_up: tu1 }, { thumbs_up: tu2 }) => tu1 > tu2 ? -1 : tu2 > tu1 ? 1 : 0)
              .slice(0, 3)
              .map(({ definition, example, ...rest }) => ({
                ...rest,
                example: cleanStrings(example),
                definition: cleanStrings(definition),
              }))
          );

        return await prisma.word.create({
          data: {
            word,
            source: WordSource.UD,
            payload: defs,
          },
        });
      } catch (ex) {
        logger.warn(`Failed to add UD WotD for ${word}.`, ex);
        return null;
      }
    }
  }

  return null;
}