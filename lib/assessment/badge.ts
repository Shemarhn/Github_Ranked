import { getTheme, type ThemeName } from '@/lib/renderer/themes';
import type { Assessment } from './types';

const escape = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (char) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[char]!
  );

/** Self-contained SVG: no remote fonts, scripts, avatar requests, or HTML. */
export function assessmentBadge(
  assessment: Assessment,
  theme: ThemeName = 'default'
): string {
  const colors = getTheme(theme);
  const { contribution, snapshot } = assessment;
  const score =
    contribution.score === null
      ? 'More evidence needed'
      : `${contribution.score.toFixed(1)} / 100`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="170" viewBox="0 0 495 170" role="img" aria-labelledby="title desc">
<title id="title">${escape(snapshot.username)}: ${escape(contribution.tier)} public contribution rating</title>
<desc id="desc">${escape(score)}. Public activity evidence, not an overall skill rating. Algorithm ${escape(assessment.version)}.</desc>
<rect x="1" y="1" width="493" height="168" rx="14" fill="${colors.background.primary}" stroke="${colors.background.border}"/>
<g font-family="Arial, sans-serif" fill="${colors.text.primary}">
<text x="22" y="31" font-size="14">GitHub Ranked · Public contributions</text>
<text x="22" y="67" font-size="24" font-weight="bold">${escape(contribution.tier)} · ${escape(score)}</text>
<text x="22" y="94" font-size="14">@${escape(snapshot.username)}</text>
<text x="22" y="121" font-size="12" fill="${colors.text.secondary}">${snapshot.from.slice(0, 10)} to ${snapshot.to.slice(0, 10)} · ${escape(contribution.evidenceStatus)} evidence</text>
<text x="22" y="148" font-size="12" fill="${colors.text.secondary}">v${escape(assessment.version)} · Engineering quality assessed separately</text>
</g></svg>`;
}
