#!/usr/bin/env node

import path from "path";
import fs from "fs";
import inquirer from "inquirer";
import ShopifyLiquid from "./ShopifyLiquid";
import ShopifyTrans from "./ShopifyTrans";
import ShopifyAssetCreator from "./ShopifyAssetCreator";

async function run() {
  validateDevDependency();

  const commands: Record<string, () => void> = {
    "duplicate:section": duplicateSection,
    "create:section": createSection,
  };

  try {
    const command =
      process.argv[2] ||
      (
        await inquirer.prompt([
          {
            type: "list",
            name: "command",
            message: "Command:",
            default: "create:section",
            choices: ["create:section", "duplicate:section"],
          },
        ])
      ).command;

    commands[command]();
  } catch (error) {}
}

function validateDevDependency() {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const packageName = "shopify-theme-tools";
  const data = fs.readFileSync(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(data);

  if (
    !packageJson.devDependencies ||
    !packageJson.devDependencies[packageName]
  ) {
    console.log(
      "\x1b[33m",
      `Warning: ${packageName} should be install as devDependencie. Run: npm i --save-dev ${packageName}\n`
    );
  }
}

function createSection() {
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

      trans.addSectionSettings();
    })
    .catch((error: Error) => {
      if (error.name !== "ExitPromptError") {
        console.log(error);
      }
    });
}

function duplicateSection() {
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
        type: "input",
        name: "locales",
        message: "Translation locales :",
        default: "en,fr",
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

      if (!answers.locales) {
        throw new Error("Locales can't be empty");
      }

      const liquid = new ShopifyLiquid(answers.prefix, answers.sectionFileName);
      const assetCreator = new ShopifyAssetCreator(
        answers.prefix,
        answers.sectionFileName
      );
      const trans = new ShopifyTrans(
        answers.prefix,
        answers.sectionFileName,
        answers.locales.split(",")
      );

      liquid
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

run();
