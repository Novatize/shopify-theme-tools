import inquirer from "inquirer";
import ShopifyLiquid from "../writers/ShopifyLiquid";
import ShopifyAssetCreator from "../writers/ShopifyAssetCreator";
import ShopifyTrans from "../writers/ShopifyTrans";

export default function sectionCreate() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "prefix",
        message: "Prefix:",
        default: "nova",
      },
      {
        type: "input",
        name: "sectionFileName",
        message: "Section filename to create:",
        default: "your-section-name",
      },
      {
        type: "confirm",
        name: "generateCss",
        message: "Do you want to generate CSS file?",
        default: true,
      },
      {
        type: "confirm",
        name: "generateJs",
        message: "Do you want to generate JS file?",
        default: false,
      },
      {
        type: "confirm",
        name: "hasBaseSetting",
        message: "Do you want to add base settings (Header & content)?",
        default: true,
      },
      {
        type: "confirm",
        name: "hasPaddingSetting",
        message: "Do you want to add padding settings?",
        default: true,
      },
    ])
    .then((answers) => {
      if (!answers.prefix) {
        throw new Error("Prefix can't be empty");
      }

      if (!answers.sectionFileName) {
        throw new Error("Section filename can't be empty");
      }

      const liquid = new ShopifyLiquid(answers.prefix, answers.sectionFileName);
      const assetCreator = new ShopifyAssetCreator(
        answers.prefix,
        answers.sectionFileName
      );
      const trans = new ShopifyTrans(answers.prefix, answers.sectionFileName, [
        "en",
      ]);

      liquid.validateDestinationNotExists();

      if (answers.generateJs) {
        liquid.addJsImport();
        assetCreator.createJs();
      }

      if (answers.generateCss) {
        liquid.addStyleSheetImport();
        assetCreator.createCss();
      }

      liquid
        .createSection(answers.hasBaseSetting, answers.hasPaddingSetting)
        .save();

      trans.addDefaultSectionSettings();
    })
    .catch((error: Error) => {
      if (error.name !== "ExitPromptError") {
        console.log(error);
      }
    });
}
