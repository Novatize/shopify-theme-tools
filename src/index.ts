import inquirer from "inquirer";
import * as fs from "fs";
import * as path from "path";
import {LiquidParser} from "./LiquidParser";

async function run() {
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
        default: "collection-list.liquid",
      },
      /*{
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
      }*/
    ])
    .then(answers => {
      if (!answers.prefix) {
        throw new Error("Prefix can't be empty");
      }

      if (!answers.sectionFileName) {
        throw new Error("Section filename can't be empty");
      }

      const processDir = process.cwd();
      const sourcePath = path.join(processDir, "sections", answers.sectionFileName);
      const destinationPath = path.join(processDir, "sections", answers.prefix + "-" + answers.sectionFileName);

      if (fs.existsSync(sourcePath)) {
        try {
          fs.copyFileSync(sourcePath, destinationPath);
        } catch (e) {
          console.log(e);
        }
      } else {
        console.log("section file" + answers.sectionFileName + "does not exist.");
      }

      if (fs.existsSync(destinationPath)) {
        const data = fs.readFileSync(destinationPath, "utf-8");
        LiquidParser.schema(data);
      }
    })
    .catch((error: Error) => {
      if (error.name !== "ExitPromptError") {
        console.log(error);
      }
    });

  console.log("Processus terminé !");
}

run();
