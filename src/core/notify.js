export async function sendNotification(site, statusCode, eventType) {
  if (!site.notify_configs) return;
  const config = JSON.parse(site.notify_configs);
  
  const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const isUp = eventType === 'UP';
  const title = isUp ? `✅ [恢复] ${site.name} 重新上线` : `❌ [宕机] ${site.name} 访问失败`;
  const content = `站点: ${site.name}\nURL: ${site.url}\n状态码: ${statusCode}\n时间: ${time}`;

  const promises = [];

  // 1. Telegram
  if (config.tg_token && config.tg_chat) {
    const text = `*${title}*\n\`\`\`\n${content}\n\`\`\``;
    promises.push(fetch(`https://api.telegram.org/bot${config.tg_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: config.tg_chat, text: text, parse_mode: 'MarkdownV2' })
    }).catch(()=>{}));
  }
  // 2. 钉钉 DingTalk
  if (config.dingtalk) {
    promises.push(fetch(config.dingtalk, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msgtype: 'text', text: { content: `${title}\n${content}` } })
    }).catch(()=>{}));
  }
  // 3. 飞书 Feishu
  if (config.feishu) {
    promises.push(fetch(config.feishu, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg_type: 'text', content: { text: `${title}\n${content}` } })
    }).catch(()=>{}));
  }
  // 4. 企业微信 WeCom
  if (config.wecom) {
    promises.push(fetch(config.wecom, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msgtype: 'text', text: { content: `${title}\n${content}` } })
    }).catch(()=>{}));
  }
  // 5. Server酱 (涵盖微信/邮件推送)
  if (config.serverchan) {
    promises.push(fetch(`https://sctapi.ftqq.com/${config.serverchan}.send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `title=${encodeURIComponent(title)}&desp=${encodeURIComponent(content)}`
    }).catch(()=>{}));
  }
  // 6. 自定义 Email / Webhook
  if (config.email_webhook) {
    promises.push(fetch(config.email_webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: title, body: content })
    }).catch(()=>{}));
  }

  await Promise.allSettled(promises);
}