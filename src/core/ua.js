export function generateUAPool(count = 10) {
  // 增加数量上限保护，防止恶意调用导致资源耗尽死循环
  const n = Math.max(1, Math.min(Number(count) || 10, 50));

  // 匹配 2026-09 最新稳定大版本区间
  const chromeVers = [148, 149, 150, 151, 152, 153];
  const firefoxVers = [150, 151, 152, 153, 154, 155];

  const desktopOS = [
    "Windows NT 10.0; Win64; x64",
    "Windows NT 10.0; Win64; x64", // Win 权重加倍，符合真实市占率
    "Macintosh; Intel Mac OS X 10_15_7",
    "X11; Linux x86_64",
  ];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // 严格隔离各平台的真实 UA 组装模板
  const makers = [
    // 1. Chrome Desktop (~55% 流量)
    () => {
      const ver = pick(chromeVers);
      return `Mozilla/5.0 (${pick(desktopOS)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${ver}.0.0.0 Safari/537.36`;
    },
    // 2. Edge Desktop (~20% 流量)
    () => {
      const ver = pick(chromeVers);
      return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${ver}.0.0.0 Safari/537.36 Edg/${ver}.0.0.0`;
    },
    // 3. Firefox Desktop (~15% 流量)
    () => {
      const ver = pick(firefoxVers);
      return `Mozilla/5.0 (${pick(desktopOS)}; rv:${ver}.0) Gecko/20100101 Firefox/${ver}.0`;
    },
    // 4. iOS Safari (~10% 流量，冻结在真实存在的 18_6)
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