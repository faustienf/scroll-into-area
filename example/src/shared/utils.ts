// 👀 https://easings.net/#easeOutCubic
export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
