import path from "path";
import fs from "fs";

export default class ShopifyLiquidDuplicator {
  private prefix: string;
  private sectionName: string;
  private liquid: string;
  private sourcePath: string;
  private destinationPath: string;

  constructor(prefix: string, sectionName: string) {
    const processDir = process.cwd();
    this.prefix = prefix;
    this.sectionName = sectionName;
    this.sourcePath = path.join(processDir, "sections", this.sectionName + ".liquid");
    this.destinationPath = path.join(processDir, "sections", this.prefix + "-" + this.sectionName + ".liquid");
    this.liquid = "";

    this.init();
  }

  save(): ShopifyLiquidDuplicator {
    fs.writeFileSync(this.destinationPath, this.liquid);

    return this;
  }

  addStyleSheetImport(): ShopifyLiquidDuplicator {
    const searchString = this.sectionName + ".css' | asset_url | stylesheet_tag }}";
    const cssImportIndex = this.liquid.indexOf(searchString);
    const cssImportString = `{{ '${this.prefix}-${this.sectionName}.css' | asset_url | stylesheet_tag }}`;

    if (cssImportIndex > -1) {
      this.liquid =
        this.liquid.slice(0, cssImportIndex + searchString.length) +
        "\n" +
        cssImportString +
        this.liquid.slice(cssImportIndex + searchString.length);
    } else {
      this.liquid = `${cssImportString}\n${this.liquid}`;
    }

    return this;
  }

  addJsImport(): ShopifyLiquidDuplicator {
    this.liquid = `<script src="{{ '${this.prefix}-${this.sectionName}.js' | asset_url }}" defer="defer"></script>\n${this.liquid}`;

    return this;
  }

  scopeStyle(): ShopifyLiquidDuplicator {
    const regex = /{% schema %}([\s\S]*?)"class":\s*"([^"]+)"([\s\S]*?){% endschema %}/;
    const matchs = this.liquid.match(regex);

    if (matchs && matchs[2]) {
      this.liquid = this.liquid.replace(regex, (match, beforeClass, classValue, afterClass) => {
        return `{% schema %}${beforeClass}"class": "${classValue} ${this.prefix}-${this.sectionName}"${afterClass}{% endschema %}`;
      });
    } else {
      const search = 'class="';
      const classIndex = this.liquid.indexOf(search) + search.length;
      this.liquid = `${this.liquid.slice(0, classIndex)}${this.prefix}-${this.sectionName} ${this.liquid.slice(classIndex)}`;
    }

    return this;
  }

  prefixTranslation(): ShopifyLiquidDuplicator {
    const snakeSectionName = this.sectionName.replaceAll("-", "_");
    this.liquid = this.liquid.replaceAll(`sections.${snakeSectionName}`, `sections.${this.prefix}_${snakeSectionName}`);

    return this;
  }

  prefixSettingsTranslation(): ShopifyLiquidDuplicator {
    this.liquid = this.liquid.replaceAll(
      "t:sections." + this.sectionName,
      "t:sections." + this.prefix + "-" + this.sectionName,
    );

    return this;
  }

  private init() {
    if (!fs.existsSync(this.sourcePath)) {
      throw new Error(`Section file ${this.sectionName} does not exist.`);
    }

    if (fs.existsSync(this.destinationPath)) {
      throw new Error(`Prefixed Section file ${this.prefix}-${this.sectionName} already exist`);
    }

    try {
      this.liquid = fs.readFileSync(this.sourcePath, "utf-8");
    } catch (e) {
      console.log(e);
    }
  }
}
