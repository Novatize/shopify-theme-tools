import inquirer from "inquirer";
import { ShopifySectionBlock, ShopifySectionSetting } from "../types";
import { ShopifySectionSettingFactory } from "../factories/ShopifySectionSettingFactory";
import ShopifyLiquid from "../writers/ShopifyLiquid";
import ShopifyTrans from "../writers/ShopifyTrans";

export default async function sectionBlockAdd() {
  let addMoreBlock = true;
  const sectionBlocks: ShopifySectionBlock[] = [];
  const sectionAnswers = await inquirer.prompt([
    {
      type: "input",
      name: "sectionFileName",
      message: "Section filename:",
      default: "nova-collection-list",
      validate: (value) => {
        return value ? true : "Section filename can't be empty";
      },
    },
  ]);

  const liquid = new ShopifyLiquid("", sectionAnswers.sectionFileName);
  const trans = new ShopifyTrans("", sectionAnswers.sectionFileName);

  liquid.from(sectionAnswers.sectionFileName);

  while (addMoreBlock) {
    const blockAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "blockName",
        message: "Block name *:",
        default: "Your block name ",
        validate: (value) => {
          return value ? true : "Block name can't be empty";
        },
      },
      {
        type: "input",
        name: "blockType",
        message: "Block type *:",
        default: "your_block_type",
        validate: (value) => {
          if (!value) {
            return "Block type can't be empty";
          }

          if (liquid.validateBlockTypeExists(value)) {
            return "Block type already exists";
          }

          return true;
        },
      },
      {
        type: "confirm",
        name: "addSetting",
        message: "Do you want to add block setting?",
        default: true,
      },
    ]);

    const block: ShopifySectionBlock = {
      name: blockAnswers.blockName,
      type: blockAnswers.blockType,
    };

    let addMoreSetting = blockAnswers.addSetting;

    while (addMoreSetting) {
      block.settings = (block.settings || []) as ShopifySectionSetting[];

      const setting = await ShopifySectionSettingFactory.build();

      if (setting) {
        block.settings.push(setting);
      }

      addMoreSetting = (
        await inquirer.prompt([
          {
            type: "confirm",
            name: "addMoreSetting",
            message: "Do you want to add another block setting?",
            default: false,
          },
        ])
      ).addMoreSetting;
    }

    sectionBlocks.push(block);

    addMoreBlock = (
      await inquirer.prompt([
        {
          type: "confirm",
          name: "addMoreBlock",
          message: "Do you want to add another block?",
          default: false,
        },
      ])
    ).addMoreBlock;
  }

  liquid.addSectionBlocks(sectionBlocks).save();
  await trans.addSectionBlocks(sectionBlocks);
}
