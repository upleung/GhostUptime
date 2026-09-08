export function generateUAPool(count) {
  const osList = [
    "Windows NT 10.0; Win64; x64",
    "Macintosh; Intel Mac OS X 10_15_7",
    "X11; Linux x86_64",
    "iPhone; CPU iPhone OS 17_5 like Mac OS X"
  ];
  const chromeVersions = [121, 122, 123, 124, 125];
  const firefoxVersions = [122, 123, 124, 125];
  
  const pool = new Set();
  while (pool.size < count) {
    const os = osList[Math.floor(Math.random() * osList.length)];
    const isChrome = Math.random() > 0.3;
    if (isChrome) {
      const ver = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
      pool.add(`Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${ver}.0.0.0 Safari/537.36`);
    } else {
      const ver = firefoxVersions[Math.floor(Math.random() * firefoxVersions.length)];
      pool.add(`Mozilla/5.0 (${os}; rv:${ver}.0) Gecko/20100101 Firefox/${ver}.0`);
    }
  }
  return Array.from(pool);
}

export const getRandomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);