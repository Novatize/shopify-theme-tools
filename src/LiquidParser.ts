export const LiquidParser = {
  schema(fileContent: string) {
    const regex = /\{% schema %\}([\s\S]*?)\{% endschema %\}/;
    const match = fileContent.match(regex);

    if (match) {
      const settings = JSON.parse(match[1]);
      console.log(settings);
    }
  },
};
