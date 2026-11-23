import { describe, it, expect } from "vitest";
import { extractProperties, extractPropertyTypes } from "../CoreScanner.js";

describe("extractProperties", () => {
  it("extracts paths from VALID_SETTINGS constant", () => {
    const php = `
      const VALID_SETTINGS = array(
        'color' => array(
          'palette'  => null,
          'custom'   => null,
        ),
        'spacing' => array(
          'blockGap' => null,
        ),
      );
    `;

    const props = new Set<string>();
    const experimental = new Set<string>();
    extractProperties(php, props, experimental);

    expect(props.has("settings.color")).toBe(true);
    expect(props.has("settings.color.palette")).toBe(true);
    expect(props.has("settings.color.custom")).toBe(true);
    expect(props.has("settings.spacing")).toBe(true);
    expect(props.has("settings.spacing.blockGap")).toBe(true);
  });

  it("extracts paths from VALID_STYLES constant", () => {
    const php = `
      const VALID_STYLES = array(
        'typography' => array(
          'fontSize'   => null,
          'fontFamily' => null,
        ),
        'shadow' => null,
      );
    `;

    const props = new Set<string>();
    const experimental = new Set<string>();
    extractProperties(php, props, experimental);

    expect(props.has("styles.typography")).toBe(true);
    expect(props.has("styles.typography.fontSize")).toBe(true);
    expect(props.has("styles.typography.fontFamily")).toBe(true);
    expect(props.has("styles.shadow")).toBe(true);
  });

  it("extracts __experimental properties", () => {
    const php = `
      '__experimentalLayout' => true,
      '__experimentalDuotone' => '.some-selector',
    `;

    const props = new Set<string>();
    const experimental = new Set<string>();
    extractProperties(php, props, experimental);

    expect(experimental.has("__experimentalLayout")).toBe(true);
    expect(experimental.has("__experimentalDuotone")).toBe(true);
  });

  it("does not extract CSS display values from $valid_display_modes", () => {
    const php = `
      $valid_display_modes = array( 'block', 'flex', 'grid' );
    `;

    const props = new Set<string>();
    const experimental = new Set<string>();
    extractProperties(php, props, experimental);

    expect(props.has("block")).toBe(false);
    expect(props.has("flex")).toBe(false);
    expect(props.has("grid")).toBe(false);
  });

  it("does not extract bare structural keys from $theme_json access", () => {
    const php = `
      $theme_json['styles']['variations'] = $data;
      $theme_json['settings']['blocks'] = $blocks;
    `;

    const props = new Set<string>();
    const experimental = new Set<string>();
    extractProperties(php, props, experimental);

    // These patterns are no longer matched by the new scanner
    expect(props.has("styles.variations")).toBe(false);
    expect(props.has("settings.blocks")).toBe(false);
  });

  it("handles deeply nested arrays", () => {
    const php = `
      const VALID_SETTINGS = array(
        'border' => array(
          'color'  => null,
          'radius' => null,
          'style'  => null,
          'width'  => null,
        ),
      );
    `;

    const props = new Set<string>();
    const experimental = new Set<string>();
    extractProperties(php, props, experimental);

    expect(props.has("settings.border")).toBe(true);
    expect(props.has("settings.border.color")).toBe(true);
    expect(props.has("settings.border.radius")).toBe(true);
    expect(props.has("settings.border.style")).toBe(true);
    expect(props.has("settings.border.width")).toBe(true);
  });

  it("does not add nested keys to the parent level", () => {
    const php = `
      const VALID_SETTINGS = array(
        'background' => array(
          'backgroundClip'  => null,
          'backgroundImage' => null,
        ),
        'custom' => null,
      );
    `;

    const props = new Set<string>();
    const experimental = new Set<string>();
    extractProperties(php, props, experimental);

    expect(props.has("settings.background.backgroundClip")).toBe(true);
    expect(props.has("settings.background.backgroundImage")).toBe(true);
    expect(props.has("settings.custom")).toBe(true);
    expect(props.has("settings.backgroundClip")).toBe(false);
    expect(props.has("settings.backgroundImage")).toBe(false);
  });

  it("handles both VALID_SETTINGS and VALID_STYLES in same content", () => {
    const php = `
      const VALID_SETTINGS = array(
        'custom' => null,
      );
      const VALID_STYLES = array(
        'css' => null,
      );
    `;

    const props = new Set<string>();
    const experimental = new Set<string>();
    extractProperties(php, props, experimental);

    expect(props.has("settings.custom")).toBe(true);
    expect(props.has("styles.css")).toBe(true);
  });
});

describe("extractPropertyTypes", () => {
  const schema = {
    definitions: {
      settingsTransformProperties: {
        type: "object",
        properties: {
          transform: {
            type: "object",
            properties: {
              rotate: { type: "boolean", default: false },
            },
          },
        },
      },
      settingsColorProperties: {
        type: "object",
        properties: {
          color: {
            type: "object",
            properties: {
              palette: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
      settingsProperties: {
        allOf: [
          { $ref: "#/definitions/settingsTransformProperties" },
          { $ref: "#/definitions/settingsColorProperties" },
        ],
      },
      refComplete: {
        type: "object",
        properties: { ref: { type: "string" } },
      },
      stylesProperties: {
        type: "object",
        properties: {
          transform: {
            type: "object",
            properties: {
              rotate: {
                oneOf: [
                  { $ref: "#/definitions/refComplete" },
                  { type: "string" },
                ],
              },
            },
          },
          shadow: {
            oneOf: [{ $ref: "#/definitions/refComplete" }],
          },
        },
      },
    },
    properties: {
      settings: {
        allOf: [
          { $ref: "#/definitions/settingsProperties" },
          { type: "object", properties: { transform: false } },
        ],
      },
      styles: { $ref: "#/definitions/stylesProperties" },
    },
  };

  it("reads leaf types through $ref and allOf", () => {
    const types = extractPropertyTypes(schema, [
      "settings.transform",
      "settings.transform.rotate",
      "settings.color",
      "settings.color.palette",
    ]);

    expect(types).toEqual({
      "settings.transform.rotate": "boolean",
      "settings.color.palette": "array",
    });
  });

  it("uses the first non-object type of a oneOf", () => {
    const types = extractPropertyTypes(schema, [
      "styles.transform",
      "styles.transform.rotate",
    ]);

    expect(types).toEqual({ "styles.transform.rotate": "string" });
  });

  it("leaves out a oneOf whose options are all objects", () => {
    const types = extractPropertyTypes(schema, ["styles.shadow"]);

    expect(types).toEqual({});
  });

  it("leaves out paths the schema does not document", () => {
    const types = extractPropertyTypes(schema, [
      "settings.viewport",
      "settings.viewport.mobile",
    ]);

    expect(types).toEqual({});
  });
});
