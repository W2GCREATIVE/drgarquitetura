import { describe, expect, it } from "vitest";
import { calculate } from "@/lib/drg";
import configCode from "@/drg-legacy/config.js?raw";
import calculatorCode from "@/drg-legacy/calculator.js?raw";

const scope: { DRG_CONFIG?: unknown; DRG_CALCULATOR?: { calculate: typeof calculate } } = {};
new Function("globalThis", configCode)(scope);
new Function("globalThis", calculatorCode)(scope);

const prices = [
  ["casa", "normal", [70, 90], [30, 60]],
  ["casa", "alto", [95, 110], [30, 60]],
  ["casa", "luxo", [140, 170], [50, 80]],
  ["apto_novo", "normal", [90, 100], [30, 60]],
  ["apto_novo", "alto", [110, 150], [40, 70]],
  ["apto_novo", "luxo", [170, 200], [80, 100]],
  ["reforma", "normal", [90, 100], [30, 60]],
  ["reforma", "alto", [110, 150], [40, 70]],
  ["reforma", "luxo", [170, 200], [80, 100]],
] as const;

describe("Final ZIP estimate prices", () => {
  for (const [type, standard, project, management] of prices) {
    const input = { type, standard, area: 100, city: "Itajaí", management: true };
    it(`${type}/${standard} project rate`, () => {
      expect(calculate(input).project).toEqual(project.map(n => n * 100));
    });
    it(`${type}/${standard} follow-up rate`, () => {
      expect(calculate(input).management).toEqual(management.map(n => n * 100));
    });
    it(`${type}/${standard} browser/server parity`, () => {
      expect(scope.DRG_CALCULATOR?.calculate(input)).toEqual(calculate(input));
    });
  }
  it("does not apply the former project minimum", () => {
    expect(calculate({ type: "casa", standard: "normal", area: 10, city: "Itajaí", management: false }).project).toEqual([700, 900]);
  });
  it("excludes optional follow-up from total while retaining its reference", () => {
    const result = calculate({ type: "apto_novo", standard: "alto", area: 120, city: "Itajaí", management: false });
    expect(result.management).toEqual([0, 0]);
    expect(result.managementReference).toEqual([4800, 8400]);
    expect(result.total).toEqual([349200, 522000]);
  });
  it("rejects inherited project keys", () => {
    expect(() => calculate({ type: "constructor", standard: "alto", area: 120, city: "Itajaí", management: false })).toThrow();
  });
  it.each([9, 5001])("rejects area %s outside 10–5000", area => {
    expect(() => calculate({ type: "casa", standard: "alto", area, city: "Itajaí", management: false })).toThrow();
  });
});