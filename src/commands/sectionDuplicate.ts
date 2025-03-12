import inquirer from "inquirer";
import ShopifyAssetCreator from "../writers/ShopifyAssetCreator";
import ShopifyLiquid from "../writers/ShopifyLiquid";
import ShopifyTrans from "../writers/ShopifyTrans";
import { settings } from "../settings";

export default function sectionDuplicate() {
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
        message: "Section filename to duplicate:",
        default: "collection-list",
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

      const trans = new ShopifyTrans(
        answers.prefix,
        answers.sectionFileName,
        settings.supportedLanguages,
        settings.defaultLanguage
      );

      liquid
        .validateDestinationNotExists()
        .from(answers.sectionFileName)
        .scopeStyle()
        .prefixSettingsTranslation()
        .prefixTranslation();

      trans.duplicateBase().duplicateSchema();

      if (answers.generateCss) {
        liquid.addStyleSheetImport();
        assetCreator.createCss();
      }

      if (answers.generateJs) {
        liquid.addJsImport();
        assetCreator.createJs();
      }

      liquid.save();
    })
    .catch((error: Error) => {
      if (error.name !== "ExitPromptError") {
        console.log(error);
      }
    });
}
