export function getHtmlDashboard() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GhostUptime - 智能隐匿保活面板</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans">
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <header class="flex justify-between items-center pb-6 border-b border-slate-800">
      <div class="flex items-center gap-3">
        <div class="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <h1 class="text-xl font-bold tracking-tight">GhostUptime 智能保活面板</h1>
      </div>
      <div class="flex gap-2">
        <button onclick="openUAModal()" class="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">UA 池生成器</button>
        <button onclick="openAddModal()" class="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded">+ 添加保活站点</button>
      </div>
    </header>

    <!-- 站点表格 -->
    <div class="mt-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-800/60 text-slate-400 text-xs uppercase">
          <tr>
            <th class="py-3.5 px-4">站点名称 / 目标地址</th>
            <th class="py-3.5 px-4">访问策略</th>
            <th class="py-3.5 px-4">上次状态</th>
            <th class="py-3.5 px-4">延时</th>
            <th class="py-3.5 px-4">下次预定执行</th>
            <th class="py-3.5 px-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody id="siteList" class="divide-y divide-slate-800/60">
          <tr><td colspan="6" class="text-center py-8 text-slate-500">正在载入数据...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- 新增站点 Modal -->
  <div id="addModal" class="hidden fixed inset-0 bg-black/70 flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6">
      <h3 class="text-lg font-bold mb-4">添加需要保活的站点</h3>
      <div class="space-y-4 text-sm">
        <div>
          <label class="block text-slate-400 mb-1">站点名称</label>
          <input id="siteName" type="text" placeholder="例如：Render 后端" class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-500">
        </div>
        <div>
          <label class="block text-slate-400 mb-1">目标 URL</label>
          <input id="siteUrl" type="url" placeholder="https://..." class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-500">
        </div>
        <div>
          <label class="block text-slate-400 mb-1">基础周期 (分钟)</label>
          <input id="baseInterval" type="number" value="240" class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-500">
          <span class="text-xs text-slate-500">4小时填 240，1小时填 60</span>
        </div>
        <div>
          <label class="block text-slate-400 mb-1">随机提前窗口 (分钟)</label>
          <input id="randomWindow" type="number" value="21" class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-500">
          <span class="text-xs text-slate-500">填 21 则会在基础周期前 0~21 分钟随机抽取时间发包</span>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button onclick="closeAddModal()" class="px-4 py-2 text-xs text-slate-400 hover:text-white">取消</button>
        <button onclick="submitSite()" class="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 font-medium rounded text-white">确认添加</button>
      </div>
    </div>
  </div>

  <!-- UA 池生成器 Modal -->
  <div id="uaModal" class="hidden fixed inset-0 bg-black/70 flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">UA 池实时模拟</h3>
        <button onclick="refreshUA()" class="text-xs text-emerald-400 hover:underline">重新抽取 5 条</button>
      </div>
      <div id="uaContainer" class="space-y-2 text-xs font-mono text-slate-400 max-h-60 overflow-y-auto"></div>
      <div class="flex justify-end mt-6">
        <button onclick="closeUAModal()" class="px-4 py-2 text-xs bg-slate-800 rounded">关闭</button>
      </div>
    </div>
  </div>

  <script>
    async function loadSites() {
      const res = await fetch('/api/sites');
      const sites = await res.json();
      const tbody = document.getElementById('siteList');
      if (!sites || sites.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-500">暂无保活站点，点击右上角添加。</td></tr>';
        return;
      }
      tbody.innerHTML = sites.map(s => {
        const statusBadge = s.last_status >= 200 && s.last_status < 400
          ? '<span class="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">' + s.last_status + ' OK</span>'
          : (s.last_status === 0 ? '<span class="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">等待初次运行</span>' : '<span class="px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/20">' + s.last_status + ' ERR</span>');
        
        const nextTime = new Date(s.next_run_at).toLocaleTimeString();
        return \`
          <tr class="hover:bg-slate-800/30">
            <td class="py-3 px-4">
              <div class="font-medium text-slate-200">\${s.name}</div>
              <div class="text-xs text-slate-500 truncate max-w-xs">\${s.url}</div>
            </td>
            <td class="py-3 px-4 text-xs text-slate-400">
              每 \${s.base_interval_minutes}m (提前 0~\${s.random_window_minutes}m 随机)
            </td>
            <td class="py-3 px-4">\${statusBadge}</td>
            <td class="py-3 px-4 text-xs font-mono text-slate-400">\${s.last_latency}ms</td>
            <td class="py-3 px-4 text-xs font-mono text-slate-300">\${nextTime}</td>
            <td class="py-3 px-4 text-right space-x-2">
              <button onclick="testSite(\${s.id})" class="text-xs text-emerald-400 hover:underline">立即探测</button>
              <button onclick="deleteSite(\${s.id})" class="text-xs text-red-400 hover:underline">删除</button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    async function submitSite() {
      const name = document.getElementById('siteName').value;
      const url = document.getElementById('siteUrl').value;
      const base_interval_minutes = document.getElementById('baseInterval').value;
      const random_window_minutes = document.getElementById('randomWindow').value;
      if (!name || !url) return alert('请完整填写名称和网址');

      await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, base_interval_minutes, random_window_minutes })
      });
      closeAddModal();
      loadSites();
    }

    async function deleteSite(id) {
      if (!confirm('确认删除此站点的保活任务？')) return;
      await fetch('/api/sites?id=' + id, { method: 'DELETE' });
      loadSites();
    }

    async function testSite(id) {
      await fetch('/api/sites/test?id=' + id, { method: 'POST' });
      alert('已触发后台唤醒，15秒后自动刷新数据');
      setTimeout(loadSites, 15000);
    }

    async function refreshUA() {
      const res = await fetch('/api/ua/generate?count=5');
      const list = await res.json();
      document.getElementById('uaContainer').innerHTML = list.map(ua => \`<div class="p-2 bg-slate-950 rounded border border-slate-800 break-all">\${ua}</div>\`).join('');
    }

    function openAddModal() { document.getElementById('addModal').classList.remove('hidden'); }
    function closeAddModal() { document.getElementById('addModal').classList.add('hidden'); }
    function openUAModal() { document.getElementById('uaModal').classList.remove('hidden'); refreshUA(); }
    function closeUAModal() { document.getElementById('uaModal').classList.add('hidden'); }

    loadSites();
    setInterval(loadSites, 30000); 
  </script>
</body>
</html>`;
}