import fs from "fs";
import path from "path";

export default class ShopifyTransDuplicator {
  prefix: string;
  key: string;
  locales: string[];
  paths: {base: string[]; schema: string[]};

  constructor(prefix: string, sectionName: string, locales: string[]) {
    this.prefix = prefix;
    this.key = sectionName;
    this.locales = locales;
    this.paths = {base: [], schema: []};

    this.init();
  }

  duplicateBase(): ShopifyTransDuplicator {
    this.paths.base.forEach(path => {
      const snakeKey = this.key.replace("-", "_");
      const prefixedSnakeKey = this.prefix + "_" + snakeKey;

      this.duplicate(path, snakeKey, prefixedSnakeKey);
    });

    return this;
  }

  duplicateSchema(): ShopifyTransDuplicator {
    this.paths.schema.forEach(path => {
      this.duplicate(path, this.key, this.prefix + "-" + this.key);
    });

    return this;
  }

  private duplicate(path: string, key: string, prefixedKey: string) {
    let jsonString = fs.readFileSync(path, "utf-8");

    let keyIndex = -1;

    do {
      keyIndex = jsonString.indexOf(`"${key}"`, keyIndex === -1 ? undefined : keyIndex + 1);

      if (keyIndex !== -1) {
        const parentOpeningBracketIndex = this.getParentBracketIndex(jsonString, keyIndex);
        const parentClosingBracketIndex = this.getClosingBracketIndex(jsonString, parentOpeningBracketIndex);
        const prefixedKeyIndex = jsonString.indexOf(`"${prefixedKey}"`, parentOpeningBracketIndex);

        if (prefixedKeyIndex > -1 && prefixedKeyIndex < parentClosingBracketIndex) {
          continue;
        }

        const previousSpacingIndex = this.getPreviousSpacingIndex(jsonString, keyIndex);
        const subJsonString = jsonString.slice(previousSpacingIndex);
        const closingBracketIndex = this.getClosingBracketIndex(subJsonString);
        const keyValueString = subJsonString.substring(0, closingBracketIndex + 1);
        const prefixedKeyValueString = keyValueString.replace(`"${key}"`, `"${prefixedKey}"`);
        jsonString = jsonString.replace(keyValueString, keyValueString + "," + prefixedKeyValueString);
      }
    } while (keyIndex !== -1);

    fs.writeFileSync(path, jsonString);
  }

  private getPreviousSpacingIndex(string: string, index: number) {
    for (let i = index - 1; i >= 0; i--) {
      if (!/\s/.test(string[i])) {
        return i + 1;
      }
    }

    return -1;
  }

  private getParentBracketIndex(string: string, startAt: number) {
    let closingBracketCount = 1;

    for (let i = startAt; i >= 0; i--) {
      if (string[i] === "}") {
        closingBracketCount++;
      } else if (string[i] === "{") {
        closingBracketCount--;

        if (closingBracketCount === 0) {
          return i;
        }
      }
    }
  }

  private getClosingBracketIndex(string: string, startAt = 0) {
    let openBracketCount = 0;

    for (let i = startAt; i < string.length; i++) {
      if (string[i] === "{") {
        openBracketCount++;
      } else if (string[i] === "}") {
        openBracketCount--;

        if (openBracketCount === 0) {
          return i;
        }
      }
    }

    return -1;
  }

  private init() {
    const processDir = process.cwd();
    const localesDir = path.join(processDir, "locales");
    const files = fs.readdirSync(localesDir);

    if (!files) {
      throw new Error("Locales directory is missing.");
    }

    files.forEach(file => {
      const locale = file.split(".")[0];

      if (this.locales.includes(locale)) {
        this.paths[file.includes(".schema") ? "schema" : "base"].push(path.join(localesDir, file));
      }
    });
  }
}
