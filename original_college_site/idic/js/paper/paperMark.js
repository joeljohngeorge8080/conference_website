/*
 * What is printed on the paper: the SJ-BIESH 2027 wordmark, the conference
 * title and dates (all from the brochure) over greyed placeholder text lines.
 * Drawn once to a 2D canvas that becomes the sheet's texture. Call again once
 * web fonts have loaded.
 */
export const MARK_W = 512;
export const MARK_H = 768;   // 4 : 6, the paper's proportions

const INK = '#0d1013';
const TURMERIC = '#e0a032';
const GREY = '#cfcac0';

export function drawPaperMark(canvas) {
  canvas.width = MARK_W;
  canvas.height = MARK_H;
  const g = canvas.getContext('2d');

  g.fillStyle = '#f6f2ea';
  g.fillRect(0, 0, MARK_W, MARK_H);

  // wordmark
  g.fillStyle = INK;
  g.textBaseline = 'alphabetic';
  g.font = '800 132px "Big Shoulders Display", "Arial Narrow", sans-serif';
  g.fillText('SJ-BIESH', 40, 170);
  g.fillStyle = TURMERIC;
  g.font = '800 96px "Big Shoulders Display", "Arial Narrow", sans-serif';
  g.fillText('2027', 40, 262);

  // accent rule
  g.fillRect(40, 292, 120, 8);

  // title
  g.fillStyle = '#3a3f44';
  g.font = '600 27px "Instrument Sans", Arial, sans-serif';
  ['Silver Jubilee Multidisciplinary', 'International Conference'].forEach((l, i) => g.fillText(l, 40, 346 + i * 36));

  // placeholder body text
  g.fillStyle = GREY;
  const widths = [432, 420, 432, 380, 432, 410, 432, 300];
  widths.forEach((w, i) => g.fillRect(40, 440 + i * 30, w, 9));

  // footer
  g.fillStyle = INK;
  g.font = '600 24px "Instrument Sans", Arial, sans-serif';
  g.fillText('May 27–29, 2027', 40, 716);
}
