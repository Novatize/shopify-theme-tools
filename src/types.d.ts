export type ShopifySectionBlock = {
  type: string;
  name: string;
  limit?: number;
  settings?: ShopifySectionSetting[];
};

export type ShopifySectionSetting = {
  type: string;
  id: string;
  label: string;
  default?: string | number | boolean;
  info?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: SectionSettingOption[];
  placeholder?: string;
};

export type ShopifySettingOption = {
  value: string | number;
  label: string;
};
