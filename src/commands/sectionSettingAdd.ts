import inquirer from "inquirer";
import ShopifyLiquid from "../writers/ShopifyLiquid";
import ShopifyTrans from "../writers/ShopifyTrans";
import { ShopifySectionSettingFactory } from "../factories/ShopifySectionSettingFactory";
import { type ShopifySectionSetting } from "../types";

export default async function sectionSettingAdd() {
  let addMore = true;

  const sectionAnswers = await inquirer.prompt([
    {
      type: "input",
      name: "sectionFileName",
      message: "Section filename:",
      default: "nova-collection-list",
    },
  ]);

  if (!sectionAnswers.sectionFileName) {
    throw new Error("Section filename can't be empty");
  }

  const liquid = new ShopifyLiquid("", sectionAnswers.sectionFileName);
  const trans = new ShopifyTrans("", sectionAnswers.sectionFileName);
  const sectionSettings: ShopifySectionSetting[] = [];

  liquid.from(sectionAnswers.sectionFileName);

  while (addMore) {
    const setting = await ShopifySectionSettingFactory.build(liquid);

    if (!setting) {
      continue;
    }

    sectionSettings.push(setting);

    addMore = (
      await inquirer.prompt([
        {
          type: "confirm",
          name: "addMore",
          message: "Do you want to add another setting?",
          default: false,
        },
      ])
    ).addMore;
  }

  liquid.addSectionSettings(sectionSettings).save();
  await trans.addSectionSettings(sectionSettings);
}
