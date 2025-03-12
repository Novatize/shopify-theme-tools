import path from "path";
import fs from "fs";
import { _ } from "inquirer/dist/commonjs/ui/prompt";

let hasRead = false;
let _settings: {
  translationServiceUrl: string;
  translationServiceApiKey: string;
  supportedLanguages: string[];
  defaultLanguage: string;
} = {
  translationServiceUrl: "http://localhost:5000",
  translationServiceApiKey: "",
  supportedLanguages: ["en", "fr"],
  defaultLanguage: "en",
};

function getAppSettings() {
  try {
    const configPath = path.resolve(
      process.cwd(),
      "shopify-theme-tools.config.json"
    );
    const data = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

export const settings = (() => {
  if (!hasRead) {
    _settings = {
      ..._settings,
      ...getAppSettings(),
    };
  }

  return _settings;
})();
