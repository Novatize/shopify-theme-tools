import { settings } from "../settings";

const url = settings.translationServiceUrl;
const apiKey = settings.translationServiceApiKey;
const defaultLanguage = settings.defaultLanguage;
const supportedLanguages = settings.supportedLanguages;
let _isAvailable = true;

const translate = async (
  text: string,
  targetLanguage: string
): Promise<string> => {
  if (!supportedLanguages.includes(targetLanguage)) {
    throw new Error(`Language ${targetLanguage} is not supported`);
  }

  if (!_isAvailable) {
    return text;
  }

  try {
    const res = await fetch(`${url}/translate`, {
      method: "POST",
      body: JSON.stringify({
        q: text,
        source: defaultLanguage,
        target: targetLanguage,
        format: "text",
        alternatives: 0,
        api_key: apiKey,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    _isAvailable = true;
    return data.translatedText;
  } catch (e) {
    _isAvailable = false;
    return "";
  }
};

const isAvailable = async (): Promise<boolean> => {
  await translate("", defaultLanguage);
  return _isAvailable;
};

export const libreTranslateClient = {
  translate,
  isAvailable,
};
