// ABOUTME: Converts browser-supported CSS colors into color-input values.
// ABOUTME: Keeps profile and project color controls aligned with user identity colors.

export function colorToHex(color: string): string | null {
  if (/^#[\dA-Fa-f]{6}$/.test(color)) {
    return color.toLowerCase();
  }

  // Color inputs only accept #rrggbb, while PlayHTML identities may use any
  // browser-supported CSS color such as an auto-generated hsl() value.
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return null;

  // Invalid colors leave fillStyle unchanged. Trying the value against two
  // sentinels distinguishes a parsed color from an unchanged sentinel.
  context.fillStyle = '#000000';
  context.fillStyle = color;
  const first = context.fillStyle;
  context.fillStyle = '#ffffff';
  context.fillStyle = color;
  const second = context.fillStyle;

  if (first !== second) return null;

  return /^#[\da-f]{6}$/.test(first) ? first : null;
}
