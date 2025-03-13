import { type ShopifySectionSetting } from "../types";

export const headingSetting: ShopifySectionSetting = {
  type: "richtext",
  id: "heading",
  label: "t:sections.all.heading.label",
  default: "t:sections.all.heading.label",
} as const;

export const contentSetting: ShopifySectionSetting = {
  type: "richtext",
  id: "content",
  label: "t:sections.all.content.label",
  default: "t:sections.all.content.label",
} as const;

export const paddingTopSetting: ShopifySectionSetting = {
  type: "range",
  id: "padding_top",
  min: 0,
  max: 100,
  step: 4,
  unit: "px",
  label: "t:sections.all.padding.padding_top",
  default: 40,
} as const;

export const paddingBottomSetting: ShopifySectionSetting = {
  type: "range",
  id: "padding_bottom",
  min: 0,
  max: 100,
  step: 4,
  unit: "px",
  label: "t:sections.all.padding.padding_bottom",
  default: 40,
} as const;
