import inquirer from "inquirer";
import {
  type ShopifySectionSetting,
  type ShopifySettingOption,
} from "../types";
import ShopifyLiquid from "../writers/ShopifyLiquid";

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
  async build(
    liquid?: ShopifyLiquid | null | undefined
  ): Promise<ShopifySectionSetting | undefined> {
    const settingType = await this.getSettingType();
    const settingBaseInfo = await this.getSettingBaseInfo(liquid);
    const settingDefaultValue = await this.getSettingDefaultValue(settingType);
    const settingInfo = await this.getSettingInfo();
    const settingExtraInfo = await this.getSettingExtraInfo(settingType);

    const setting: ShopifySectionSetting = {
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

  async getSettingBaseInfo(
    liquid: ShopifyLiquid | null | undefined
  ): Promise<{ id: string; label: string }> {
    const baseAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "settingId",
        message: "Setting ID *:",
        default: "your_setting_id",
        validate: (value) => {
          if (!value) {
            return "Setting ID can't be empty";
          }

          if (liquid && liquid.validateSectionSettingExists(value)) {
            return "Setting ID already exists";
          }

          return true;
        },
      },
      {
        type: "input",
        name: "settingLabel",
        default: "Your setting label",
        message: "Setting label *:",
        validate: (value) => {
          return value ? true : "Setting label can't be empty";
        },
      },
    ]);

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
            message: "Setting default value:",
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
            message: "Setting default value:",
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
  ): Promise<Partial<ShopifySectionSetting> | undefined> {
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
            validate: (value) => {
              return value ? true : "Min can't be empty";
            },
          },
          {
            type: "number",
            name: "max",
            message: "Setting max *:",
            validate: (value) => {
              return value ? true : "Max can't be empty";
            },
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

        return {
          min: rangeAnswer.min,
          max: rangeAnswer.max,
          step: rangeAnswer.step,
          unit: rangeAnswer.unit,
        };
      case ShopifySectionSettingTypes.radio:
      case ShopifySectionSettingTypes.select:
        let addMoreOption = true;
        const options: ShopifySettingOption[] = [];

        while (addMoreOption) {
          const optionAnswer = await inquirer.prompt([
            {
              type: "input",
              name: "optionLabel",
              message: "Option label *:",
              validate: (value) => {
                return value ? true : "Option label can't be empty";
              },
            },
            {
              type: "input",
              name: "optionValue",
              message: "Option value *:",
              validate: (value) => {
                return value ? true : "Option value can't be empty";
              },
            },
          ]);

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
