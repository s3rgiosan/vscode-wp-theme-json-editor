import { describe, it, expect } from "vitest";
import {
  BLOCK_STYLE_VARIATION_ONLY_FLAG,
  isFieldVisible,
} from "./fieldVisibility";

const hidden = { showExperimental: false, isBlockStyleVariation: false };

describe("isFieldVisible", () => {
  it("shows a plain property", () => {
    expect(isFieldVisible({ type: "string" }, hidden)).toBe(true);
  });

  it("hides experimental and undocumented properties until they are shown", () => {
    const experimental = { "x-wpthemejsoneditor-experimental": true };
    const undocumented = { "x-wpthemejsoneditor-undocumented": true };
    const shown = { ...hidden, showExperimental: true };

    expect(isFieldVisible(experimental, hidden)).toBe(false);
    expect(isFieldVisible(undocumented, hidden)).toBe(false);
    expect(isFieldVisible(experimental, shown)).toBe(true);
    expect(isFieldVisible(undocumented, shown)).toBe(true);
  });

  it("shows a block style variation only property only in a partial", () => {
    const node = { [BLOCK_STYLE_VARIATION_ONLY_FLAG]: true };

    expect(isFieldVisible(node, hidden)).toBe(false);
    expect(
      isFieldVisible(node, { ...hidden, isBlockStyleVariation: true }),
    ).toBe(true);
  });

  it("keeps an undocumented block-only property hidden in a partial until shown", () => {
    const node = {
      [BLOCK_STYLE_VARIATION_ONLY_FLAG]: true,
      "x-wpthemejsoneditor-undocumented": true,
    };

    expect(
      isFieldVisible(node, { ...hidden, isBlockStyleVariation: true }),
    ).toBe(false);
    expect(
      isFieldVisible(node, {
        showExperimental: true,
        isBlockStyleVariation: true,
      }),
    ).toBe(true);
  });
});
