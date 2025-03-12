export type SectionSetting = {
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

export type SectionSettingOption = {
  value: string | number;
  label: string;
};
