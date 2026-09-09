export function getHtmlDashboard() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GhostUptime - Edge Monitor</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Kuma Style Uptime Bar */
    .uptime-bar { display: flex; gap: 2px; align-items: flex-end; height: 40px; margin-top: 10px; }
    .uptime-pill { flex: 1; min-width: 4px; border-radius: 2px; background-color: #22c55e; transition: all 0.2s; cursor: pointer; }
    .uptime-pill.down { background-color: #ef4444; }
    .uptime-pill.empty { background-color: #334155; }
    .uptime-pill:hover { opacity: 0.7; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
  </style>
</head>
<body class="bg-[#0f172a] text-slate-200 h-screen overflow-hidden flex font-sans">
  
  <!-- 左侧栏 (站点列表) -->
  <div class="w-1/3 md:w-1/4 max-w-sm border-r border-slate-800 bg-[#1e293b] flex flex-col z-10 shadow-xl">
    <div class="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0f172a]">
      <div class="font-bold text-emerald-400 flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
        GhostUptime
      </div>
    </div>
    <div class="p-3 grid grid-cols-2 gap-2 border-b border-slate-800">
      <button onclick="openFormModal()" class="py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold">+ 新增监控</button>
      <button onclick="openUAModal()" class="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs">UA 工具</button>
    </div>
    <div id="sidebarList" class="flex-1 overflow-y-auto">
      <div class="p-6 text-center text-slate-500 text-sm">载入中...</div>
    </div>
  </div>

  <!-- 右侧主内容 (详情面板) -->
  <div class="flex-1 flex flex-col relative overflow-y-auto bg-[#0f172a]" id="mainPanel">
    <div class="p-8 flex flex-col items-center justify-center h-full text-slate-500" id="welcomeState">
      👈 请在左侧选择一个监控节点，或创建新监控。
    </div>
    
    <div id="detailState" class="hidden max-w-5xl mx-auto w-full p-6 md:p-10">
      <div class="flex justify-between items-start mb-6">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2" id="detailName">Loading...</h1>
          <a href="#" target="_blank" id="detailUrl" class="text-sm text-emerald-400 hover:underline">url</a>
        </div>
        <div class="flex gap-2">
          <button id="btnForceTest" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm">立即探测</button>
          <button id="btnEdit" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm">编辑策略</button>
          <button id="btnDelete" class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm text-white">删除</button>
        </div>
      </div>

      <!-- Kuma 卡片列阵 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-[#1e293b] p-4 rounded-xl border border-slate-800">
          <div class="text-xs text-slate-400 mb-1">当前状态</div>
          <div class="text-xl font-bold" id="detailStatusBadge">-</div>
        </div>
        <div class="bg-[#1e293b] p-4 rounded-xl border border-slate-800">
          <div class="text-xs text-slate-400 mb-1">最新延时</div>
          <div class="text-xl font-bold font-mono text-slate-200" id="detailLatency">- ms</div>
        </div>
        <div class="bg-[#1e293b] p-4 rounded-xl border border-slate-800">
          <div class="text-xs text-slate-400 mb-1">检测频率</div>
          <div class="text-xl font-bold font-mono text-slate-200" id="detailStrategy">-</div>
        </div>
        <div class="bg-[#1e293b] p-4 rounded-xl border border-slate-800">
          <div class="text-xs text-slate-400 mb-1">下次检测</div>
          <div class="text-xl font-bold font-mono text-slate-200" id="detailNext">-</div>
        </div>
      </div>

      <div class="bg-[#1e293b] p-6 rounded-xl border border-slate-800 mb-6">
        <h3 class="font-bold text-slate-300 mb-2">最近 50 次监控记录 (Uptime Bar)</h3>
        <div class="uptime-bar" id="uptimeBarContainer"></div>
      </div>
      
      <div class="bg-[#1e293b] p-6 rounded-xl border border-slate-800">
        <h3 class="font-bold text-slate-300 mb-4">详细日志</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-slate-500 text-xs uppercase border-b border-slate-700">
              <tr><th class="py-2">时间</th><th class="py-2">状态码</th><th class="py-2">延时</th><th class="py-2">命中 UA 特征</th></tr>
            </thead>
            <tbody id="logTableBody" class="divide-y divide-slate-800 text-slate-400 font-mono text-xs"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- 新增/编辑 Modal -->
  <div id="formModal" class="hidden fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="bg-[#1e293b] border border-slate-700 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
      <h3 class="text-xl font-bold mb-4 border-b border-slate-700 pb-2" id="modalTitle">添加保活监控</h3>
      <input type="hidden" id="editSiteId">
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 基础配置 -->
        <div class="space-y-4">
          <h4 class="font-bold text-emerald-400 text-sm">基础探测设定</h4>
          <div><label class="block text-slate-400 text-xs mb-1">站点名称</label><input id="f_name" type="text" class="w-full bg-[#0f172a] border border-slate-700 rounded p-2 outline-none text-sm"></div>
          <div><label class="block text-slate-400 text-xs mb-1">目标 URL</label><input id="f_url" type="url" class="w-full bg-[#0f172a] border border-slate-700 rounded p-2 outline-none text-sm"></div>
          <div class="flex gap-2">
            <div class="flex-1"><label class="block text-slate-400 text-xs mb-1">基础周期 (min)</label><input id="f_base" type="number" class="w-full bg-[#0f172a] border border-slate-700 rounded p-2 outline-none text-sm" placeholder="240"></div>
            <div class="flex-1"><label class="block text-slate-400 text-xs mb-1">随机提前 (min)</label><input id="f_win" type="number" class="w-full bg-[#0f172a] border border-slate-700 rounded p-2 outline-none text-sm" placeholder="21"></div>
          </div>
          <div>
            <label class="block text-slate-400 text-xs mb-1">固定请求头 User-Agent (留空则每次随机提取)</label>
            <textarea id="f_ua" rows="2" class="w-full bg-[#0f172a] border border-slate-700 rounded p-2 outline-none text-xs font-mono"></textarea>
          </div>
        </div>

        <!-- 通知配置 -->
        <div class="space-y-4">
          <h4 class="font-bold text-blue-400 text-sm">告警通知 (选填)</h4>
          <div><label class="block text-slate-400 text-xs mb-1">Server酱 SendKey (微信/邮件)</label><input id="n_serverchan" type="text" class="w-full bg-[#0f172a] border border-slate-700 rounded p-2 outline-none text-sm"></div>
          <div class="flex gap-2">
            <div class="flex-1"><label class="block text-slate-400 text-xs mb-1">TG Bot Token</label><input id="n_tg_token" type="text" class="w-full bg-[#0f172a] border border-slate-700 rounded p-2 outline-none text-sm"></div>
            <div class="flex-1"><label class="block text-slate-400 text-xs mb-1">TG Chat ID</label><input id="n_tg_chat" type="text" class="w-full bg-[#0f172a] border border-slate-700 rounded p-2 outline-none text-sm"></div>
          </div>
          <div><label class="block text-slate-400 text-xs mb-1">钉钉 Webhook</label><input id="n_ding" type="text" class="w-full bg-[#0f172a] border border-slate-700 rounded p-2 outline-none text-sm"></div>
          <div><label class="block text-slate-400 text-xs mb-1">飞书 Webhook</label><input id="n_feishu" type="text" class="w-full bg-[#0f172a] border border-slate-700 rounded p-2 outline-none text-sm"></div>
          <div><label class="block text-slate-400 text-xs mb-1">企业微信 Webhook</label><input id="n_wecom" type="text" class="w-full bg-[#0f172a] border border-slate-700 rounded p-2 outline-none text-sm"></div>
        </div>
      </div>
      
      <div class="flex justify-end gap-3 mt-6 border-t border-slate-700 pt-4">
        <button onclick="closeFormModal()" class="px-4 py-2 text-sm text-slate-400 hover:text-white">取消</button>
        <button onclick="submitSite()" class="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 rounded font-bold text-white shadow-lg">保存配置</button>
      </div>
    </div>
  </div>

  <!-- UA 池工具 Modal -->
  <div id="uaModal" class="hidden fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="bg-[#1e293b] border border-slate-700 rounded-xl max-w-lg w-full p-6">
      <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
        <h3 class="text-lg font-bold text-slate-200">引擎 UA 伪装池测试</h3>
      </div>
      <div class="flex gap-2 mb-4">
        <input type="number" id="uaCountInput" value="10" class="w-20 bg-[#0f172a] border border-slate-700 rounded px-2 outline-none text-sm" placeholder="数量">
        <button onclick="refreshUA()" class="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm">实时生成新库</button>
      </div>
      <div id="uaContainer" class="space-y-2 text-xs font-mono text-emerald-400 max-h-64 overflow-y-auto bg-[#0f172a] p-3 rounded"></div>
      <div class="flex justify-end mt-4"><button onclick="closeUAModal()" class="px-4 py-2 text-sm bg-slate-700 rounded">关闭</button></div>
    </div>
  </div>

  <script>
    let globalSites = [];
    let currentSiteId = null;

    async function fetchData() {
      const res = await fetch('/api/sites');
      globalSites = await res.json();
      renderSidebar();
      if(currentSiteId) loadDetail(currentSiteId);
    }

    function renderSidebar() {
      const list = document.getElementById('sidebarList');
      if (globalSites.length === 0) return list.innerHTML = '<div class="p-6 text-center text-slate-500 text-xs">暂无数据</div>';
      
      list.innerHTML = globalSites.map(s => {
        const isUp = s.last_status >= 200 && s.last_status < 400;
        const isWait = s.last_status === 0;
        const dotColor = isWait ? 'bg-slate-500' : (isUp ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]');
        const activeClass = currentSiteId === s.id ? 'bg-[#0f172a] border-l-4 border-emerald-500' : 'hover:bg-[#334155] border-l-4 border-transparent';
        
        return \`
          <div onclick="loadDetail(\${s.id})" class="p-3 border-b border-slate-800 cursor-pointer transition-colors flex items-center gap-3 \${activeClass}">
            <div class="w-2.5 h-2.5 rounded-full \${dotColor}"></div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold truncate text-slate-200">\${s.name}</div>
              <div class="text-xs text-slate-500 truncate">\${s.url}</div>
            </div>
          </div>
        \`;
      }).join('');
    }

    async function loadDetail(id) {
      currentSiteId = id;
      renderSidebar(); 
      document.getElementById('welcomeState').classList.add('hidden');
      const panel = document.getElementById('detailState');
      panel.classList.remove('hidden');

      const site = globalSites.find(s => s.id === id);
      if(!site) return;

      document.getElementById('detailName').innerText = site.name;
      document.getElementById('detailUrl').innerText = site.url;
      document.getElementById('detailUrl').href = site.url;
      
      const isUp = site.last_status >= 200 && site.last_status < 400;
      document.getElementById('detailStatusBadge').innerHTML = site.last_status === 0 ? '<span class="text-slate-400">等待发包</span>' : (isUp ? \`<span class="text-emerald-400">\${site.last_status} OK</span>\` : \`<span class="text-red-400">\${site.last_status} ERR</span>\`);
      document.getElementById('detailLatency').innerText = site.last_latency + ' ms';
      document.getElementById('detailStrategy').innerText = \`每 \${site.base_interval_minutes} min\`;
      document.getElementById('detailNext').innerText = new Date(site.next_run_at).toLocaleTimeString();

      // Button binding
      document.getElementById('btnForceTest').onclick = () => testSite(site.id);
      document.getElementById('btnDelete').onclick = () => deleteSite(site.id);
      document.getElementById('btnEdit').onclick = () => openFormModal(site);

      // Fetch logs for Uptime Bar & Table
      const res = await fetch('/api/logs?site_id=' + id);
      const logs = await res.json();
      
      // Render Kuma Uptime Bar
      const barContainer = document.getElementById('uptimeBarContainer');
      const maxBars = 50;
      let barsHtml = '';
      for(let i=0; i<maxBars; i++) {
        const log = logs[maxBars - 1 - i]; // Reverse for chron order Left -> Right
        if(!log) {
           barsHtml += '<div class="uptime-pill empty" title="无数据"></div>';
        } else {
           const ok = log.status_code >= 200 && log.status_code < 400;
           const clz = ok ? '' : 'down';
           const timeStr = new Date(log.executed_at).toLocaleString();
           barsHtml += \`<div class="uptime-pill \${clz}" title="\${timeStr} | \${log.status_code} | \${log.response_time}ms"></div>\`;
        }
      }
      barContainer.innerHTML = barsHtml;

      // Render Table
      document.getElementById('logTableBody').innerHTML = logs.slice(0, 15).map(l => {
        const ok = l.status_code >= 200 && l.status_code < 400;
        return \`<tr>
          <td class="py-2">\${new Date(l.executed_at).toLocaleString()}</td>
          <td class="py-2 \${ok?'text-emerald-400':'text-red-400'}">\${l.status_code}</td>
          <td class="py-2">\${l.response_time}ms</td>
          <td class="py-2 truncate max-w-[200px]" title="\${l.used_ua}">\${l.used_ua}</td>
        </tr>\`;
      }).join('');
    }

    function openFormModal(site = null) {
      document.getElementById('formModal').classList.remove('hidden');
      if (site) {
        document.getElementById('modalTitle').innerText = '编辑监控策略';
        document.getElementById('editSiteId').value = site.id;
        document.getElementById('f_name').value = site.name;
        document.getElementById('f_url').value = site.url;
        document.getElementById('f_base').value = site.base_interval_minutes;
        document.getElementById('f_win').value = site.random_window_minutes;
        document.getElementById('f_ua').value = site.custom_ua || '';
        
        let n = {};
        try { n = JSON.parse(site.notify_configs || '{}'); } catch(e){}
        document.getElementById('n_serverchan').value = n.serverchan || '';
        document.getElementById('n_tg_token').value = n.tg_token || '';
        document.getElementById('n_tg_chat').value = n.tg_chat || '';
        document.getElementById('n_ding').value = n.dingtalk || '';
        document.getElementById('n_feishu').value = n.feishu || '';
        document.getElementById('n_wecom').value = n.wecom || '';
      } else {
        document.getElementById('modalTitle').innerText = '新增保活监控';
        document.getElementById('editSiteId').value = '';
        document.querySelectorAll('#formModal input, #formModal textarea').forEach(el => el.value = '');
        document.getElementById('f_base').value = 240;
        document.getElementById('f_win').value = 21;
      }
    }
    function closeFormModal() { document.getElementById('formModal').classList.add('hidden'); }

    async function submitSite() {
      const payload = {
        id: document.getElementById('editSiteId').value || undefined,
        name: document.getElementById('f_name').value,
        url: document.getElementById('f_url').value,
        base_interval_minutes: document.getElementById('f_base').value,
        random_window_minutes: document.getElementById('f_win').value,
        custom_ua: document.getElementById('f_ua').value,
        notify: {
          serverchan: document.getElementById('n_serverchan').value,
          tg_token: document.getElementById('n_tg_token').value,
          tg_chat: document.getElementById('n_tg_chat').value,
          dingtalk: document.getElementById('n_ding').value,
          feishu: document.getElementById('n_feishu').value,
          wecom: document.getElementById('n_wecom').value
        }
      };
      if (!payload.name || !payload.url) return alert('必填项不完整');

      await fetch('/api/sites', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
      closeFormModal();
      fetchData();
    }

    async function deleteSite(id) {
      if(!confirm('警报：确认永久删除该站点的监控任务与日志？')) return;
      await fetch('/api/sites?id=' + id, { method: 'DELETE' });
      currentSiteId = null;
      document.getElementById('detailState').classList.add('hidden');
      document.getElementById('welcomeState').classList.remove('hidden');
      fetchData();
    }

    async function testSite(id) {
      document.getElementById('btnForceTest').innerText = '探测中...';
      await fetch('/api/sites/test?id=' + id, { method: 'POST' });
      setTimeout(() => { document.getElementById('btnForceTest').innerText = '立即探测'; fetchData(); }, 2000);
    }

    async function refreshUA() {
      const c = document.getElementById('uaCountInput').value || 10;
      const res = await fetch('/api/ua/generate?count=' + c);
      const list = await res.json();
      document.getElementById('uaContainer').innerHTML = list.map(ua => \`<div class="border-b border-slate-800 pb-1 break-all">\${ua}</div>\`).join('');
    }

    function openUAModal() { document.getElementById('uaModal').classList.remove('hidden'); refreshUA(); }
    function closeUAModal() { document.getElementById('uaModal').classList.add('hidden'); }

    fetchData();
    setInterval(fetchData, 60000); 
  </script>
</body>
</html>`;
}