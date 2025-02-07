import path from "path";
import fs from "fs";

export default class ShopifyAssetCreator {
  private processDir: string;
  private prefix: string;
  private sectionName: string;

  constructor(prefix: string, sectionName: string) {
    this.processDir = process.cwd();
    this.prefix = prefix;
    this.sectionName = sectionName;
  }

  createCss() {
    if (!fs.existsSync(path.join(this.processDir, "assets"))) {
      throw new Error("Missing assets directory");
    }

    const destinationPath = path.join(this.processDir, "assets", this.prefix + "-section-" + this.sectionName + ".css");

    if (!fs.existsSync(destinationPath)) {
      fs.writeFileSync(destinationPath, `.${this.prefix}-section-${this.sectionName} {\n  /* Your style here */\n}`);
    }
  }

  createJs() {
    if (!fs.existsSync(path.join(this.processDir, "assets"))) {
      throw new Error("Missing assets directory");
    }

    const destinationPath = path.join(this.processDir, "assets", this.prefix + "-section-" + this.sectionName + ".js");

    if (!fs.existsSync(destinationPath)) {
      fs.writeFileSync(destinationPath, "");
    }
  }
}
