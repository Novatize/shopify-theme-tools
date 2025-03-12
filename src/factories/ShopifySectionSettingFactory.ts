import inquirer from "inquirer";
import { SectionSetting, SectionSettingOption } from "../types";

export enum ShopifySectionSettingTypes {
  checkbox = "checkbox",
  number = "number",
  radio = "radio",
  range = "range",
  select = "select",
  text = "text",
  textarea = "textarea",
  article = "article",
  blog = "blog",
  collection = "collection",
  collection_list = "collection_list",
  color = "color",
  color_background = "color_background",
  color_scheme = "color_scheme",
  color_scheme_group = "color_scheme_group",
  font_picker = "font_picker",
  html = "html",
  image_picker = "image_picker",
  inline_richtext = "inline_richtext",
  link_list = "link_list",
  liquid = "liquid",
  metaobject = "metaobject",
  metaobject_list = "metaobject_list",
  page = "page",
  product = "product",
  product_list = "product_list",
  richtext = "richtext",
  text_alignment = "text_alignment",
  url = "url",
  video = "video",
  video_url = "video_url",
}

class ShopifySectionSettingFactoryClass {
  async build(): Promise<SectionSetting | undefined> {
    const settingType = await this.getSettingType();
    const settingBaseInfo = await this.getSettingBaseInfo();

    if (!settingBaseInfo) {
      return;
    }

    const settingDefaultValue = await this.getSettingDefaultValue(settingType);
    const settingInfo = await this.getSettingInfo();
    const settingExtraInfo = await this.getSettingExtraInfo(settingType);

    const setting: SectionSetting = {
      type: settingType,
      id: settingBaseInfo.id,
      label: settingBaseInfo.label,
      default: settingDefaultValue,
      info: settingInfo,
      ...settingExtraInfo,
    };

    return setting;
  }

  async getSettingType(): Promise<keyof typeof ShopifySectionSettingTypes> {
    const typeAnswers = await inquirer.prompt([
      {
        type: "list",
        name: "settingType",
        message: "Setting type *:",
        default: "create:section",
        choices: Object.keys(ShopifySectionSettingTypes),
      },
    ]);

    return typeAnswers.settingType;
  }

  async getSettingBaseInfo(): Promise<
    { id: string; label: string } | undefined
  > {
    const baseAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "settingId",
        message: "Setting ID *:",
      },
      {
        type: "input",
        name: "settingLabel",
        message: "Setting label *:",
      },
    ]);

    if (!baseAnswers.settingId) {
      console.log("\x1b[31m", "Setting ID can't be empty \n");
      return;
    }

    if (!baseAnswers.settingLabel) {
      console.log("\x1b[31m", "Setting label can't be empty \n");
      return;
    }

    return { id: baseAnswers.settingId, label: baseAnswers.settingLabel };
  }

  async getSettingDefaultValue(
    type: keyof typeof ShopifySectionSettingTypes
  ): Promise<string | number | boolean | undefined> {
    switch (type) {
      case ShopifySectionSettingTypes.number:
      case ShopifySectionSettingTypes.range:
        const defaultAnswersNumber = await inquirer.prompt([
          {
            type: "number",
            name: "settingDefault",
            message: "Default value:",
          },
        ]);

        if (defaultAnswersNumber.settingDefault) {
          return defaultAnswersNumber.settingDefault;
        }
        break;
      case ShopifySectionSettingTypes.checkbox:
        const defaultAnswersBool = await inquirer.prompt([
          {
            type: "confirm",
            name: "settingDefault",
            message: "Default checked:",
            default: false,
          },
        ]);
        if (defaultAnswersBool.settingDefault) {
          return defaultAnswersBool.settingDefault;
        }
        break;
      case ShopifySectionSettingTypes.text:
      case ShopifySectionSettingTypes.textarea:
      case ShopifySectionSettingTypes.select:
      case ShopifySectionSettingTypes.radio:
        const defaultAnswersString = await inquirer.prompt([
          {
            type: "input",
            name: "settingDefault",
            message: "Default value:",
          },
        ]);

        if (defaultAnswersString.settingDefault) {
          return defaultAnswersString.settingDefault;
        }
        break;
    }
  }

  async getSettingInfo(): Promise<string | undefined> {
    const infoAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "settingInfo",
        message: "Setting info:",
      },
    ]);

    if (infoAnswers.settingInfo) {
      return infoAnswers.settingInfo;
    }
  }

  async getSettingExtraInfo(
    type: keyof typeof ShopifySectionSettingTypes
  ): Promise<Partial<SectionSetting> | undefined> {
    switch (type) {
      case ShopifySectionSettingTypes.text:
      case ShopifySectionSettingTypes.textarea:
        const textAnswer = await inquirer.prompt([
          {
            type: "input",
            name: "placeholder",
            message: "Setting placeholder:",
          },
        ]);

        return textAnswer.placeholder
          ? { placeholder: textAnswer.placeholder }
          : undefined;
      case ShopifySectionSettingTypes.range:
        const rangeAnswer = await inquirer.prompt([
          {
            type: "number",
            name: "min",
            message: "Setting min *:",
          },
          {
            type: "number",
            name: "max",
            message: "Setting max *:",
          },
          {
            type: "number",
            name: "step",
            message: "Setting step:",
          },
          {
            type: "input",
            name: "unit",
            message: "Setting unit:",
          },
        ]);

        if (!rangeAnswer.min === null || rangeAnswer.min === undefined) {
          console.log("\x1b[31m", "Range min can't be empty \n");
          return;
        }

        if (!rangeAnswer.max) {
          console.log("\x1b[31m", "Range max can't be empty \n");
          return;
        }

        return {
          min: rangeAnswer.min,
          max: rangeAnswer.max,
          step: rangeAnswer.step,
          unit: rangeAnswer.unit,
        };
      case ShopifySectionSettingTypes.radio:
      case ShopifySectionSettingTypes.select:
        let addMoreOption = true;
        const options: SectionSettingOption[] = [];

        while (addMoreOption) {
          const optionAnswer = await inquirer.prompt([
            {
              type: "input",
              name: "optionLabel",
              message: "Setting option label *:",
            },
            {
              type: "input",
              name: "optionValue",
              message: "Setting option value *:",
            },
          ]);

          if (!optionAnswer.optionLabel) {
            console.log("\x1b[31m", "Option label can't be empty \n");
            continue;
          }

          if (!optionAnswer.optionLabel) {
            console.log("\x1b[31m", "Option value can't be empty \n");
            continue;
          }

          options.push({
            label: optionAnswer.optionLabel,
            value: optionAnswer.optionValue,
          });

          addMoreOption = (
            await inquirer.prompt([
              {
                type: "confirm",
                name: "addMoreOption",
                message: "Do you want to add another option?",
                default: false,
              },
            ])
          ).addMoreOption;
        }

        return { options };
    }

    return {};
  }
}

let factory: ShopifySectionSettingFactoryClass | null = null;

export const ShopifySectionSettingFactory = (() => {
  if (!factory) {
    factory = new ShopifySectionSettingFactoryClass();
  }

  return factory;
})();
