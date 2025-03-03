import fs from "fs";
import path from "path";
import stripJsonComments from "strip-json-comments";

export default class ShopifyTrans {
  prefix: string;
  key: string;
  locales: string[];
  paths: { base: string[]; schema: string[] };

  constructor(prefix: string, sectionName: string, locales: string[]) {
    this.prefix = prefix;
    this.key = sectionName;
    this.locales = locales;
    this.paths = { base: [], schema: [] };

    this.init();
  }

  addSectionSettings() {
    this.paths.schema.forEach((path) => {
      let jsonString = stripJsonComments(fs.readFileSync(path).toString());
      const settings = JSON.parse(jsonString);

      if (settings?.sections) {
        const transKey = this.prefix + "-" + this.key;

        if (!settings.sections[transKey]) {
          const name = "# " + this.key.replaceAll("-", " ");
          settings.sections[transKey] = {
            name,
            presets: {
              name,
            },
          };
        }
      }

      if (settings?.sections?.all) {
        if (!settings.sections.all.heading) {
          settings.sections.all.heading = {
            label: "Heading",
          };
        }

        if (!settings.sections.all.content) {
          settings.sections.all.content = {
            label: "Content",
          };
        }
      }

      fs.writeFileSync(
        path,
        this.getComment() + "\n" + JSON.stringify(settings, null, 2)
      );
    });
  }

  duplicateBase(): ShopifyTrans {
    this.paths.base.forEach((path) => {
      this.duplicateSection(path, this.key, this.prefix + "-" + this.key);
    });

    return this;
  }

  duplicateSchema(): ShopifyTrans {
    this.paths.schema.forEach((path) => {
      this.duplicateSection(path, this.key, this.prefix + "-" + this.key);
    });

    return this;
  }

  private duplicateSection(path: string, key: string, prefixedKey: string) {
    let jsonString = stripJsonComments(fs.readFileSync(path, "utf-8"));

    if (jsonString.indexOf(`"${key}"`) === -1) {
      if (key.includes("_")) {
        key = key.replaceAll("_", "-");
        prefixedKey = prefixedKey.replaceAll("_", "-");
      } else {
        key = key.replaceAll("-", "_");
        prefixedKey = prefixedKey.replaceAll("-", "_");
      }
    }

    const trans = JSON.parse(jsonString);

    if (trans.sections[key] && !trans.sections[prefixedKey]) {
      trans.sections[prefixedKey] = trans.sections[key];

      if (trans.sections[key].name) {
        trans.sections[prefixedKey].name = "# " + trans.sections[key].name;
      }

      if (trans.sections[key].presets) {
        trans.sections[prefixedKey].presets.name =
          "# " + trans.sections[key].presets.name;
      }

      fs.writeFileSync(
        path,
        this.getComment() + "\n" + JSON.stringify(trans, null, 2)
      );
    }
  }

  private getComment() {
    return `/*
 * ------------------------------------------------------------
 * IMPORTANT: The contents of this file are auto-generated.
 *
 * This file may be updated by the Shopify admin language editor
 * or related systems. Please exercise caution as any changes
 * made to this file may be overwritten.
 * ------------------------------------------------------------
 */`;
  }

  private init() {
    const processDir = process.cwd();
    const localesDir = path.join(processDir, "locales");
    const files = fs.readdirSync(localesDir);

    if (!files) {
      throw new Error("Locales directory is missing.");
    }

    files.forEach((file) => {
      const locale = file.split(".")[0];

      if (this.locales.includes(locale)) {
        this.paths[file.includes(".schema") ? "schema" : "base"].push(
          path.join(localesDir, file)
        );
      }
    });
  }
}
