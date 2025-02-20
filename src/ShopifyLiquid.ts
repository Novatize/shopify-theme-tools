import path from "path";
import fs from "fs";
import htmlCreator from "html-creator";

export default class ShopifyLiquid {
  private processDir: string;
  private prefix: string;
  private sectionName: string;
  private liquid: string;
  private destinationPath: string;

  constructor(prefix: string, sectionName: string) {
    this.processDir = process.cwd();
    this.prefix = prefix;
    this.sectionName = sectionName;
    this.destinationPath = path.join(
      this.processDir,
      "sections",
      this.prefix + "-" + this.sectionName + ".liquid"
    );
    this.liquid = "";

    //this.init();
  }

  from(sectionName: string): ShopifyLiquid {
    const sourcePath = path.join(
      this.processDir,
      "sections",
      sectionName + ".liquid"
    );

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Section file ${this.sectionName} does not exist.`);
    }

    try {
      this.liquid = fs.readFileSync(sourcePath, "utf-8");
    } catch (e) {
      console.log(e);
    }

    return this;
  }

  save(): ShopifyLiquid {
    fs.writeFileSync(this.destinationPath, this.liquid);

    return this;
  }

  createSection(
    hasBaseSetting: boolean,
    hasPaddingSetting: boolean
  ): ShopifyLiquid {
    const settings = [];

    if (hasPaddingSetting) {
      this.liquid += this.getLiquidPaddingStyle() + "\n\n";
    }

    this.liquid += this.getHtmlString(hasBaseSetting, hasPaddingSetting);
    this.liquid += "\n\n";
    this.liquid += this.getSchemaString(hasBaseSetting, hasPaddingSetting);

    return this;
  }

  addStyleSheetImport(): ShopifyLiquid {
    const searchString =
      this.sectionName + ".css' | asset_url | stylesheet_tag }}";
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

  addJsImport(): ShopifyLiquid {
    this.liquid = `<script src="{{ '${this.prefix}-${this.sectionName}.js' | asset_url }}" defer="defer"></script>\n${this.liquid}`;

    return this;
  }

  scopeStyle(): ShopifyLiquid {
    const regex =
      /{% schema %}([\s\S]*?)"class":\s*"([^"]+)"([\s\S]*?){% endschema %}/;
    const matchs = this.liquid.match(regex);

    if (matchs && matchs[2]) {
      this.liquid = this.liquid.replace(
        regex,
        (match, beforeClass, classValue, afterClass) => {
          return `{% schema %}${beforeClass}"class": "${classValue} ${this.prefix}-${this.sectionName}"${afterClass}{% endschema %}`;
        }
      );
    } else {
      const search = 'class="';
      const classIndex = this.liquid.indexOf(search) + search.length;
      this.liquid = `${this.liquid.slice(0, classIndex)}${this.prefix}-${
        this.sectionName
      } ${this.liquid.slice(classIndex)}`;
    }

    return this;
  }

  prefixTranslation(): ShopifyLiquid {
    const snakeSectionName = this.sectionName.replaceAll("-", "_");
    this.liquid = this.liquid.replaceAll(
      `sections.${snakeSectionName}`,
      `sections.${this.prefix}_${snakeSectionName}`
    );

    return this;
  }

  prefixSettingsTranslation(): ShopifyLiquid {
    this.liquid = this.liquid.replaceAll(
      "t:sections." + this.sectionName,
      "t:sections." + this.prefix + "-" + this.sectionName
    );

    return this;
  }

  indentHtml(html: string) {
    const indentSize = 2;
    let formatted = "";
    let indentLevel = 0;

    html = html.replace(/\s*(<[^>]+>)\s*/g, "$1"); // Remove unnecessary spaces around tags
    const tokens = html.split(/(?=<)|(?<=>)/g); // Split at opening and closing tags

    tokens.forEach((token: string) => {
      if (token.match(/^<\/\w/)) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }

      formatted += " ".repeat(indentLevel * indentSize) + token + "\n";

      if (token.match(/^<\w/) && !token.match(/\/>$/)) {
        indentLevel++;
      }
    });

    return formatted.trim();
  }

  private getLiquidPaddingStyle(): string {
    return `\n{%- style -%}
  .section-{{ section.id }}-padding {
    padding-top: {{ section.settings.padding_top | times: 0.75 | round: 0 }}px;
    padding-bottom: {{ section.settings.padding_bottom | times: 0.75 | round: 0 }}px;
  }

  @media screen and (min-width: 750px) {
    .section-{{ section.id }}-padding {
      padding-top: {{ section.settings.padding_top }}px;
      padding-bottom: {{ section.settings.padding_bottom }}px;
    }
  }
{%- endstyle -%}`;
  }

  private getHtmlString(
    hasBaseSetting: boolean,
    hasPaddingSetting: boolean
  ): string {
    let htmlString = `<div ${
      hasPaddingSetting ? 'class="section-{{ section.id }}-padding"' : ""
    }>`;
    if (hasBaseSetting) {
      htmlString += "<p>{{ section.settings.heading }}</p>";
      htmlString += "<p>{{ section.settings.content}}</p>";
    }
    htmlString += "</div>";

    return this.indentHtml(htmlString);
  }

  private getSchemaString(
    hasBaseSetting: boolean,
    hasPaddingSetting: boolean
  ): string {
    const settings = [];

    if (hasPaddingSetting) {
      settings.push({
        type: "range",
        id: "padding_top",
        min: 0,
        max: 100,
        step: 4,
        unit: "px",
        label: "t:sections.all.padding.padding_top",
        default: 40,
      });

      settings.push({
        type: "range",
        id: "padding_bottom",
        min: 0,
        max: 100,
        step: 4,
        unit: "px",
        label: "t:sections.all.padding.padding_bottom",
        default: 40,
      });
    }

    if (hasBaseSetting) {
      settings.push({
        type: "richtext",
        id: "heading",
        label: "t:sections.all.heading.label",
        default: "t:sections.all.heading.label",
      });

      settings.push({
        type: "richtext",
        id: "content",
        label: "t:sections.all.content.label",
        default: "t:sections.all.content.label",
      });
    }

    this.liquid += this.getHtmlString(hasBaseSetting, hasPaddingSetting);

    const schema = {
      name: `t:sections.${this.prefix}-${this.sectionName}.name`,
      tag: "section",
      class: `section ${this.prefix}-${this.sectionName}`,
      settings: settings,
      presets: [
        { name: `t:sections.${this.prefix}-${this.sectionName}.presets.name` },
      ],
    };

    let schemaString = "{% schema %}\n";
    schemaString += JSON.stringify(schema, null, 2) + "\n";
    schemaString += "{% endschema %}\n";

    return schemaString;
  }

  private init() {
    if (fs.existsSync(this.destinationPath)) {
      throw new Error(
        `Prefixed Section file ${this.prefix}-${this.sectionName} already exist`
      );
    }
  }
}
