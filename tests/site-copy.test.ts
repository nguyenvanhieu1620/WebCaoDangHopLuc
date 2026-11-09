import test from "node:test";
import assert from "node:assert/strict";
import { siteDayMonth, formatSiteDate, programDuration, programCountLabel, admissionStepsLabel } from "../src/lib/site-copy";

test("calendar labels follow language and retain Vietnam time across a month boundary", () => {
  const time = "2026-10-31T18:30:00Z";
  assert.deepEqual(siteDayMonth(time, "vi"), { day: "01", month: "Th11" });
  assert.deepEqual(siteDayMonth(time, "en"), { day: "01", month: "Nov" });
  assert.equal(formatSiteDate(time, "en", true), "1 Nov 2026 · 01:30");
  assert.equal(formatSiteDate(time, "vi", true), "1/11/2026 · 01:30");
});

test("missing or invalid calendar data has no visible placeholder dates", () => {
  for (const value of [null, "", "invalid"]) {
    assert.equal(siteDayMonth(value, "en"), null);
    assert.equal(formatSiteDate(value, "en"), "");
  }
});

test("duration converts known numeric units without translating arbitrary CMS content", () => {
  assert.equal(programDuration("3 năm", "en"), "3 years");
  assert.equal(programDuration("1 năm", "en"), "1 year");
  assert.equal(programDuration("18 tháng", "en"), "18 months");
  assert.equal(programDuration("2–3 năm", "en"), "2–3 years");
  assert.equal(programDuration("1,5 năm", "en"), "1.5 years");
  assert.equal(programDuration("Theo kế hoạch đào tạo", "en"), "Theo kế hoạch đào tạo");
  assert.equal(programDuration("3 năm", "vi"), "3 năm");
});

test("dynamic English section labels handle one and multiple items", () => {
  assert.equal(programCountLabel(1, "en"), "1 healthcare program");
  assert.equal(programCountLabel(6, "en"), "6 healthcare programs");
  assert.equal(admissionStepsLabel(1, "en"), "Process · 1 admission step");
  assert.equal(admissionStepsLabel(4, "en"), "Process · 4 admission steps");
});
