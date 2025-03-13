#!/usr/bin/env node

import path from "path";
import fs from "fs";
import inquirer from "inquirer";
import sectionCreate from "./commands/sectionCreate";
import sectionDuplicate from "./commands/sectionDuplicate";
import sectionSettingAdd from "./commands/sectionSettingAdd";
import sectionBlockAdd from "./commands/sectionBlockAdd";
import { libreTranslateClient } from "./clients/libreTranslateClient";
import { settings } from "./settings";

async function run() {
  validateDevDependency();
  await validateTranslationService();

  const commands: Record<string, () => void> = {
    "section:create": sectionCreate,
    "section:duplicate": sectionDuplicate,
    "section:setting:add": sectionSettingAdd,
    "section:block:add": sectionBlockAdd,
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
            default: "section:create",
            choices: Object.keys(commands),
          },
        ])
      ).command;

    commands[command]();
  } catch (error) {}
}

async function validateTranslationService() {
  if (!(await libreTranslateClient.isAvailable())) {
    console.log(
      "\x1b[33m",
      `Warning: translation service is unavaiable. Run: docker run -tid --rm -p 5000:5000 libretranslate/libretranslate --load-only=${settings.supportedLanguages.join(
        ","
      )}\n`
    );
  }
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

run();
