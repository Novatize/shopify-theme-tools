import fs from "fs";
import path from "path";
import stripJsonComments from "strip-json-comments";
import { SectionSetting, SectionSettingOption } from "../types";
import { ShopifySectionSettingTypes } from "../factories/ShopifySectionSettingFactory";
import { libreTranslateClient } from "../clients/libreTranslateClient";

export default class ShopifyTrans {
  prefix: string;
  key: string;
  locales: string[];
  paths: { base: string[]; schema: string[] };
  defaultLocale: string;

  constructor(
    prefix: string,
    sectionName: string,
    locales: string[] = ["en", "fr"],
    defaultLocale: string = "en"
  ) {
    this.prefix = prefix;
    this.key = sectionName;
    this.locales = locales;
    this.paths = { base: [], schema: [] };
    this.defaultLocale = defaultLocale;

    this.init();
  }

  async addSectionSettings(
    sectionSettings: SectionSetting[]
  ): Promise<ShopifyTrans> {
    for (const path of this.paths.schema) {
      let jsonString = stripJsonComments(fs.readFileSync(path).toString());
      const settings = JSON.parse(jsonString);

      if (!settings?.sections) {
        return this;
      }

      const transKey = this.prefix ? this.prefix + "-" + this.key : this.key;

      if (!settings.sections[transKey]) {
        return this;
      }

      settings.sections[transKey].settings =
        settings.sections[transKey].settings || {};

      for (const setting of sectionSettings) {
        const settingProperties = {
          label: setting.label,
          default: [
            ShopifySectionSettingTypes.checkbox,
            ShopifySectionSettingTypes.number,
            ShopifySectionSettingTypes.range,
            ShopifySectionSettingTypes.select,
            ShopifySectionSettingTypes.radio,
          ].includes(setting.type as ShopifySectionSettingTypes)
            ? undefined
            : setting.default,
          info: setting.info,
          placeholder: setting.placeholder,
          options: setting.options,
        };

        if (settings.sections[transKey].settings[setting.id]) {
          throw new Error(`Setting with id ${setting.id} already exists.`);
        }

        settings.sections[transKey].settings[setting.id] = {};

        for (const [key, value] of Object.entries(settingProperties)) {
          if (value) {
            const currentLocale =
              path.split("/").pop()?.split(".")[0] || this.defaultLocale;

            if (key === "options") {
              const options = value as SectionSettingOption[];
              for (let i = 0; i < options.length; i++) {
                const option = options[i];
                settings.sections[transKey].settings[setting.id][
                  "options__" + (i + 1)
                ] = {
                  label: path.includes(`${this.defaultLocale}.default`)
                    ? option.label
                    : await libreTranslateClient.translate(
                        option.label,
                        currentLocale
                      ),
                };
              }
            } else {
              settings.sections[transKey].settings[setting.id][key] =
                path.includes(`${this.defaultLocale}.default`)
                  ? value
                  : await libreTranslateClient.translate(
                      value.toString(),
                      currentLocale
                    );
            }
          }
        }
      }

      fs.writeFileSync(
        path,
        this.getComment() + "\n" + JSON.stringify(settings, null, 2)
      );
    }

    return this;
  }

  addDefaultSectionSettings(): ShopifyTrans {
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

    return this;
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
