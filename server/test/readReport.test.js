// Unit tests for reading lab report text (what OCR or a PDF gives us).
//   node --test test/readReport.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readReport } from '../src/services/labs/readReport.js';

const byName = (r) => Object.fromEntries(r.results.map((x) => [x.name, x]));

test('a typical Pakistani lab report table', () => {
  const r = readReport(`
    CHUGHTAI LAB
    Patient: Fatima Rahman   Age/Sex: 72 Y / F
    Reported: 26-Sep-2026
    Test                         Result     Unit      Reference Range
    Glucose Fasting              118        mg/dL     70 - 99
    HbA1c                        6.4        %         4.0 - 5.6
    Vitamin D (25-OH)            18.2       ng/mL     30 - 100
    Vitamin B12                  410        pg/mL     200 - 900
    Hemoglobin (Hb)              11.6       g/dL      12.0 - 15.5
    LDL Cholesterol              112        mg/dL     < 130
    HDL Cholesterol              48         mg/dL     > 40
    Cholesterol/HDL Ratio        3.9
    Triglycerides                142        mg/dL     < 150
    Serum Creatinine             0.9        mg/dL     0.5 - 1.1
  `);
  const x = byName(r);
  assert.equal(r.lab, 'Chughtai Lab');
  assert.equal(r.date, '26 Sep 2026');
  assert.equal(x['Fasting blood sugar'].value, '118');
  assert.equal(x['Fasting blood sugar'].status, 'watch');
  assert.equal(x.HbA1c.value, '6.4');
  assert.equal(x['Vitamin D'].value, '18.2');
  assert.equal(x['Vitamin D'].status, 'attention');
  assert.equal(x['Vitamin B12'].value, '410');
  assert.equal(x.Hemoglobin.value, '11.6');
  assert.equal(x['LDL cholesterol'].value, '112');
  assert.equal(x['HDL cholesterol'].value, '48');
  assert.equal(x.Triglycerides.value, '142');
  assert.equal(x.Creatinine.value, '0.9');
  assert.ok(!r.results.some((y) => y.line.includes('Ratio')), 'ratio lines are ignored');
});

test('SI units from a report abroad are converted', () => {
  const r = readReport(`
    Fasting plasma glucose  7.9 mmol/L
    HbA1c   55 mmol/mol
    25-hydroxy vitamin D   45 nmol/L
    Vitamin B12   180 pmol/L
    Haemoglobin   128 g/L
    LDL-C   3.4 mmol/L
    Creatinine   97 umol/L
  `);
  const x = byName(r);
  assert.equal(x['Fasting blood sugar'].value, '142');
  assert.equal(x['Fasting blood sugar'].from, 'mmol/L');
  assert.equal(x.HbA1c.value, '7.2');
  assert.equal(x['Vitamin D'].value, '18');
  assert.equal(x['Vitamin B12'].value, '244');
  assert.equal(x.Hemoglobin.value, '12.8');
  assert.equal(x['LDL cholesterol'].value, '131');
  assert.equal(x.Creatinine.value, '1.1');
});

test('common OCR slips are corrected and misreads rejected', () => {
  const r = readReport(`
    Glucose (Fasting)   1O8 mg/dL   70-99
    Vitamin D3 Total    2l,5 ng/mL
    Hemoglobin          115 g/dL
  `);
  const x = byName(r);
  assert.equal(x['Fasting blood sugar'].value, '108');
  assert.equal(x['Vitamin D'].value, '21.5');
  // "115 g/dL" is impossible for hemoglobin; 115 treated as g/L becomes 11.5
  assert.equal(x.Hemoglobin.value, '11.5');
  assert.equal(x.Hemoglobin.confidence, 'decimal');
});

test('a value pushed onto the next line by a table is still found', () => {
  const r = readReport('Vitamin B12\n220 pg/mL 200-900\nTSH\n6.2 mIU/L 0.4-4.5');
  const x = byName(r);
  assert.equal(x['Vitamin B12'].value, '220');
  assert.equal(x['Vitamin B12'].status, 'watch');
  assert.equal(x.TSH.value, '6.2');
  assert.equal(x.TSH.status, 'watch');
});

test('HbA1c is not mistaken for hemoglobin, and dates in d/m/y are read', () => {
  const r = readReport('Excel Labs   Date: 03/08/2026\nHb A1c 7.1 %\nHb 13.4 g/dL');
  const x = byName(r);
  assert.equal(x.HbA1c.value, '7.1');
  assert.equal(x.Hemoglobin.value, '13.4');
  assert.equal(r.lab, 'Excel Labs');
  assert.equal(r.date, '3 Aug 2026');
});

test('text with no lab results gives nothing', () => {
  const r = readReport('Dear patient, thank you for visiting. Your appointment is on 12 Oct.');
  assert.equal(r.results.length, 0);
});

test('a test whose number was misread is kept, empty, for the family to type in', () => {
  const r = readReport('Hemoglobin (Hb)   1.6 g/dL   12.0-15.5\nLDL Cholesterol 112 mg/dL');
  const x = byName(r);
  assert.equal(x.Hemoglobin.value, '');
  assert.equal(x.Hemoglobin.confidence, 'unclear');
  assert.equal(x.Hemoglobin.raw, '1.6 g/dL');
  assert.equal(x['LDL cholesterol'].value, '112');
});

test('the plausible reading wins over an earlier misread of the same test', () => {
  const r = readReport('Hb 1.6 g/dL\nHemoglobin 11.6 g/dL');
  assert.equal(byName(r).Hemoglobin.value, '11.6');
  assert.equal(r.results.length, 1);
});

test('decimal points OCR dropped are put back when the reference range shows it', () => {
  const r = readReport(`EXCEL LABS
    Hemoglobin (Hb)    16     gldL    120-155
    Vitamin D Total    14.0   ng/mL   30 - 100
    HbA1c              74     %       <57
    Serum Creatinine   09     mg/dL   05-11`);
  const x = byName(r);
  assert.equal(x.HbA1c.value, '7.4', '"%" is our unit: 74 is not mmol/mol');
  assert.equal(x.HbA1c.confidence, 'decimal');
  assert.equal(x.Creatinine.value, '0.9');
  assert.equal(x.Hemoglobin.value, '', '1.6 g/dL is impossible: ask the family');
  assert.equal(x.Hemoglobin.confidence, 'unclear');
  assert.equal(x['Vitamin D'].value, '14.0');
  assert.equal(x['Vitamin D'].confidence, 'high');
});

test('a value that kept its decimal point is not rescaled', () => {
  const x = byName(readReport('Hemoglobin (Hb) 11.6 g/dL 120-155\nHbA1c 6.4 % 40-56\nHaemoglobin 128 g/L 120-160'));
  assert.equal(x.Hemoglobin.value, '11.6');
  assert.equal(x.HbA1c.value, '6.4');
});

test('real Tesseract output from a small screenshot', () => {
  const x = byName(readReport('HbA1lc 64 % 4.0-56\nHemoglobin (Hb) 11.6 g/dL 12.0-155\nSerum Creatinine 0.9 mg/dL 0.5-1.1\nTSH 2.35 mlU/L 04-45'));
  assert.equal(x.HbA1c.value, '6.4');
  assert.equal(x.HbA1c.confidence, 'decimal');
  assert.equal(x.Hemoglobin.value, '11.6');
  assert.equal(x.Creatinine.value, '0.9');
  assert.equal(x.TSH.value, '2.35');
  assert.equal(x.TSH.confidence, 'high');
  assert.equal(byName(readReport('HbA1lc 74 % <5.7')).HbA1c.value, '7.4');
});

test('a dropped digit that makes a result impossible is not trusted', () => {
  const x = byName(readReport('LDL Cholesterol 12 mg/dL < 130'));
  assert.equal(x['LDL cholesterol'].value, '');
  assert.equal(x['LDL cholesterol'].confidence, 'unclear');
});
