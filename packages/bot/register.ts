/**
 * Standalone Script to Install Slash Commands
 */

import { registerCommands } from "./commands";

(async () => {
  try {
    await registerCommands('1062603591111671828');
  } catch (ex) {
    console.error(ex);
  }
})();