/**
 * MW Service
 */

import nf from "node-fetch";
import frt from "fetch-retry";
const fetch = frt(nf as any);
import ua from "random-useragent";
import config from "../config";
import logger from "../logger";
import { prisma } from "../db";
import { WordSource } from "@prisma/client";
import { load } from "cheerio";

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

type TextSense = [
  "text",
  string,
];

type VisSense = [
  "vis",
  Array<{ t: string; }>
]

interface MWSenseDetail {
  sn: string;
  sls: Array<string>;
  dt: Array<TextSense | VisSense>;
}

type MWSense = [
  "sense",
  MWSenseDetail,
];

interface MWDef {
  sseq: Array<Array<MWSense>>;
}

export interface MWResult {
  meta: MWMeta;
  hwi: MWPronunciation;
  // part of speech
  fl: string;
  shortdef: Array<string>;
  def: Array<MWDef>;
}

type RegexReplace = [
  RegExp, (groups: Record<string, string>) => string
];

const mwLink = (word: string) => `https://www.merriam-webster.com/dictionary/${word}`;
const mwArtLink = (id: string) => `https://www.merriam-webster.com/art/dict/${id}.htm`;
const mwTableLink = (id: string) => `https://www.merriam-webster.com/table/collegiate/${id}.htm`;
const tokenMdReplacements: Array<RegexReplace> = [
  // 2.29.1 - formatting and punctuation
  [/\{\/?b\}/g, () => `*`],
  [/\{bc\}/g, () => `*:* `],
  [/\{\/?it\}/g, () => `_`],
  [/\{ldquo\}/g, () => `"`],
  [/\{lrquo\}/g, () => `"`],
  [/\{\/?sc\}/g, () => ""],
  [/\{\/?sup\}/g, () => ""],
  // 2.29.2 - word-marking and gloss
  [/\{gloss\}/g, () => `[`],
  [/\{\/gloss\}/g, () => `]`],
  [/\{\/?parahw\}/g, () => `*`],
  [/\{phrase\}/g, () => `_*`],
  [/\{\/phrase\}/g, () => `*_`],
  [/\{\/?qword\}/g, () => `_`],
  [/\{\/?wi\}/g, () => `_`],
  // 2.29.3 - cross-reference grouping
  [/\{dx\}/g, () => `— `],
  [/\{\/dx\}/g, () => ""],
  [/\{dx_def\}/g, () => "("],
  [/\{\/dx_def\}/g, () => ")"],
  [/\{dx_ety\}/g, ({ words }) => `— `],
  [/\{\/dx_ety\}/g, () => ""],
  [/\{ma\}/g, ({ words }) => `— more at `],
  [/\{\/ma\}/g, () => ""],
];

const groupMdReplacements: Array<RegexReplace> = [
  // 2.29.4 cross-reference
  [/\{a_link\|(?<link>.+)\}/g, ({ link }) => `[${link}](<${mwLink(link)}>)`],
  [/\{(?:d_link|et_link|mat)\|(?<link>.+)\|(?<id>.+)?\}/g, ({ link, id }) =>
    `[${link}](<${mwLink(id ?? link)}>)`
  ],
  [/\{i_link\|(?<link>.+)\|(?<id>.+)?\}/g, ({ link, id }) =>
    `_[${link}](<${mwLink(id ?? link)}>)_`
  ],
  [/\{sx\|(?<link>.+)\|(?<id>.+)?\|(?<sense>.+)?\}/g, ({ link, id }) =>
    `[${link}](<${mwLink(id ?? link)}>)`
  ],
  [/\{dxt\|(?<link>.+)\|(?<id>.+)?\|(?<sense>.+)?\}/g, ({ link, id, sense }) => {
    switch (sense) {
      case "illustration":
        return `[${link}](<${mwArtLink(id)}>)`;
      case "table":
        return `[${link}](<${mwTableLink(id)}>)`;
      default:
        return `[${link}](<${mwLink(id ?? link)}>)`;
    }
  }],
];

const mwToMd = (text: string): string => {
  text = tokenMdReplacements.reduce((acc, [regex, matchFn]) => {
    const valid = regex.exec(acc);
    if (valid) {
      return acc.replaceAll(regex, (...args) => {
        const groups: Record<string, string> = args[args.length - 1];
        return matchFn(groups);
      }).trim();
    } else {
      return acc;
    }
  }, text);

  text = groupMdReplacements.reduce((acc, [regex, matchFn]) =>
    acc
      .split(" ")
      // there could be multi-word tokens in links, so need to account for those
      .reduce((acc, curr, i, arr) => {
        const whole = curr.startsWith("{") && curr.endsWith("}");
        const inBracket = arr[i - 1]?.startsWith("{") && !arr[i - 1]?.endsWith("}");
        if ((inBracket || curr.endsWith("}")) && !whole) {
          return [...acc.slice(0, acc.length - 1), acc[acc.length - 1] + " " + curr];
        } else {
          return [...acc, curr];
        }
      }, [] as Array<string>)
      .map(word => {
        const valid = regex.exec(word);
        if (valid) {
          return word.replaceAll(regex, (...args) => {
            const groups: Record<string, string> = args[args.length - 1];
            return matchFn(groups);
          });
        } else {
          return word;
        }
      }).join(" ").trim()
    , text);

  return text;
};

interface MWEntryDef {
  num: string;
  def: string;
  context: Array<string>;
  examples: Array<string>;
}

export interface MWEntry {
  pronunciation?: MWPronunciation;
  pos: string;
  defs: Array<MWEntryDef>;
}
const mwToMwEntries = (response: Array<MWResult>): Array<MWEntry> =>
  response
    .filter(({ hwi, fl, def }) => hwi && fl && def)
    .map(({ meta, hwi, fl , def }) => {
      const defs = def.flatMap(mwdef => mwdef.sseq.flatMap((sseq, i, arr) => sseq.flatMap(
        ([, { dt, sls }], i2, arr2) => {
          const def = dt?.find(([ tpe ]) => tpe === "text");
          if (!def) {
            return [];
          } else {
            let [, text ] = def as TextSense;
            text = mwToMd(text);
            const examples = (dt
              .filter(([ tpe ]) => tpe === "vis") as Array<VisSense>)
              .flatMap(([, exs ]) => exs.map(({ t }) => mwToMd(t)));
            return [{
              num: arr2.length > 1 ? `${i + 1}${String.fromCharCode(97 + i2)}` : `${i + 1}`,
              def: text,
              examples,
              context: sls ?? [],
            } as MWEntryDef];
          }
      })));
      return {
        pronunciation: hwi,
        pos: fl,
        defs,
      };
    });

export const getMwWotd = async (): Promise<string | null> => {
  logger.debug(`Pulling MW WotD.`);
  // Have to set wotd here because node-fetch is buggy when cloning reponses
  // We read the body in retryOn and subsequent reads (even when the response is cloned) hang
  let wotd: string | undefined;
  const response = await fetch(
    "https://www.merriam-webster.com/word-of-the-day", {
      headers: {
        "user-agent": ua.getRandom(),
      },
      retries: Number.MAX_SAFE_INTEGER,
      retryDelay: (attempt, error, response) => {
        logger.warn(`Got ${error?.name ?? response?.status ?? "unknown"} from MW getting wotd, retrying.`);
        return 1000 + (Math.random() * 3000);
      },
      retryOn: async (attempt, error, response) => {
        if (response && ![400, 500, 503].includes(response.status)) {
          const body = await response.text();
          const $ = load(body);
          const localWotd = $(".word-and-pronunciation h1").text();
          if (localWotd) {
            wotd = localWotd;
            return false;
          } else {
            return true;
          }
        } else if ([400, 500, 503].includes(response?.status ?? 200) || error !== null) {
          logger.warn(`Retrying call to MW: ${error?.message ?? response?.status ?? "unknown"}`);
          return true;
        }
        return false;
      }
    }
  );

  if (wotd) {
    logger.debug(`Successfully pulled MW: ${wotd}`);
    return wotd;
  } else {
    logger.warn(`Failed to pull MW: ${response.status}`);
    return null;
  }
}

export const getMwWord = async (word: string) => {
  logger.debug(`Pulling ${word} from MW.`);
  const response = await fetch(
    `https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${config.MW_KEY}`, {
      retryOn: [400, 500, 503],
      retries: Number.MAX_SAFE_INTEGER,
      retryDelay: (attempt, error, response) => {
        logger.warn(`Got ${error?.name ?? response?.status ?? "unknown"} from MW getting wotd details, retrying.`);
        return 1000 + Math.random() * 3000;
      },
    }
  );

  if (response.ok) {
    logger.debug(`Successfully pulled ${word} from MW.`);
    const definitions = await response.json();
    return await prisma.word.create({
      data: {
        word,
        source: WordSource.MW,
        payload: mwToMwEntries(definitions) as any,
      }
    })
  } else {
    logger.warn(`Failed to pull ${word} from MW.`);
    return null;
  }
}