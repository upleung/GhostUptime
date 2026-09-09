export function generateUAPool(count = 10) {
  const n = Math.max(1, Math.min(Number(count) || 10, 50));

  // 2026-09 附近：Chrome 153 / Firefox 155 为最新稳定
  const chromeVers = [148, 149, 150, 151, 152, 153];
  const firefoxVers = [150, 151, 152, 153, 154, 155];

  const desktopOS = [
    "Windows NT 10.0; Win64; x64",
    "Windows NT 10.0; Win64; x64", // 加权：Win 更常见
    "Macintosh; Intel Mac OS X 10_15_7",
    "X11; Linux x86_64",
  ];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const makers = [
    // ~55% Chrome desktop
    () => {
      const ver = pick(chromeVers);
      return `Mozilla/5.0 (${pick(desktopOS)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${ver}.0.0.0 Safari/537.36`;
    },
    // ~20% Edge
    () => {
      const ver = pick(chromeVers);
      return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${ver}.0.0.0 Safari/537.36 Edg/${ver}.0.0.0`;
    },
    // ~15% Firefox desktop
    () => {
      const ver = pick(firefoxVers);
      return `Mozilla/5.0 (${pick(desktopOS)}; rv:${ver}.0) Gecko/20100101 Firefox/${ver}.0`;
    },
    // ~10% iOS Safari（系统号冻结在 18_6 是 2026 真实行为）
    () =>
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
  ];

  const weights = [0.55, 0.2, 0.15, 0.1];
  const pickMaker = () => {
    let r = Math.random();
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return makers[i];
    }
    return makers[0];
  };

  const pool = new Set();
  let guard = 0;
  while (pool.size < n && guard++ < n * 20) {
    pool.add(pickMaker()());
  }
  return Array.from(pool);
}

export const getRandomDelay = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min);