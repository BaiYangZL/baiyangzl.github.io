// Runs before Cocos startup. Diagnostics stay on this device until copied.
(() => {
  // Prepare the same GLSL programs while room files download. Linking all
  // programs before checking completion lets the browser compile in parallel.
  // The engine still creates/validates its own programs with its original GLSL.
  const shaderWarmup = {started: false, completed: false, programs: 0, failed: 0, milliseconds: 0};
  const textureTransfers = fetch(new URL('texture-transfer.json?v=loading-20261027', document.baseURI)).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  const shaderData = typeof DecompressionStream === 'undefined' ? Promise.resolve(null) : fetch(new URL('tavern-shader-warmup.bin?v=loading-20261027', document.baseURI)).then(async r => {
    if (!r.ok) return null;
    const data = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();
    const stages = data.stages.map(stage => ({type: stage.type, source: stage.lines.map(n => data.lines[n]).join('\n')}));
    return {programs: data.programs.map(program => ({webgl2: program.webgl2, sources: program.stages.map(n => stages[n])}))};
  }).catch(() => null);
  const gameCanvas = document.getElementById('GameCanvas');
  if (gameCanvas) {
    const getContext = gameCanvas.getContext;
    gameCanvas.getContext = function (kind, ...args) {
      const context = getContext.call(this, kind, ...args);
      if (context && /^(webgl2?|experimental-webgl)$/.test(kind) && !shaderWarmup.started) {
        shaderWarmup.started = true;
        this.getContext = getContext;
        void shaderData.then(data => warmShaders(context, data));
      }
      return context;
    };
  }
  async function warmShaders(gl, data) {
    if (!data?.programs?.length || gl.isContextLost()) return;
    const ext = gl.getExtension('KHR_parallel_shader_compile');
    if (!ext) return; // Unsupported devices keep the engine's normal path.
    const startedAt = performance.now(), shaders = new Map(), programs = [];
    try {
      for (const item of data.programs) {
        if (item.webgl2 !== (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext)) continue;
        const program = gl.createProgram();
        if (!program) continue;
        for (const stage of item.sources) {
          let shader = shaders.get(stage.source);
          if (!shader) { shader = gl.createShader(stage.type); if (!shader) continue; gl.shaderSource(shader, stage.source); gl.compileShader(shader); shaders.set(stage.source, shader); }
          gl.attachShader(program, shader);
        }
        gl.linkProgram(program); programs.push(program);
      }
      shaderWarmup.programs = programs.length;
      let pendingPrograms = programs.slice();
      while (pendingPrograms.length && !gl.isContextLost()) {
        pendingPrograms = pendingPrograms.filter(program => !gl.getProgramParameter(program, ext.COMPLETION_STATUS_KHR));
        if (pendingPrograms.length) await new Promise(resolve => setTimeout(resolve, 16));
      }
      shaderWarmup.failed = programs.filter(program => !gl.getProgramParameter(program, gl.LINK_STATUS)).length;
      shaderWarmup.completed = true;
      shaderWarmup.milliseconds = performance.now() - startedAt;
    } catch { /* Warmup is optional; the unchanged engine reports real failures. */ }
    finally {
      for (const program of programs) gl.deleteProgram(program);
      for (const shader of shaders.values()) gl.deleteShader(shader);
    }
  }
  const pending = new Map(), errors = [], repairs = [], started = performance.now();
  let installed = false, button, panel, lastProgress = started;
  const record = error => { errors.push(String(error?.stack || error).slice(0, 2400)); if (errors.length > 12) errors.shift(); };
  // Tavern.start catches construction failures and only logs them. These do
  // not dispatch window.error or unhandledrejection, so preserve that evidence.
  const originalError = console.error;
  console.error = function (...args) { args.forEach(record); return originalError.apply(console, args); };
  addEventListener('error', event => record(event.message || 'Resource failed'));
  addEventListener('unhandledrejection', event => record(event.reason));
  const report = () => ({version: 'loading-20261027', url: location.href, repairs, shaderWarmup,
    elapsedMs: Math.round(performance.now() - started), pending: [...pending.keys()], errors,
    status: document.querySelector('#tavern-ui .status')?.textContent,
    note: document.querySelector('#tavern-ui .note')?.textContent,
    state: window.__tavern?.state(), online: navigator.onLine,
    cacheController: navigator.serviceWorker?.controller?.scriptURL || '',
    viewport: [innerWidth, innerHeight, devicePixelRatio]});
  function showReport() {
    let doc = document; try { doc = parent.document; } catch {}
    if (panel) { panel.remove(); panel = null; return; }
    panel = doc.createElement('div');
    panel.style.cssText = 'position:fixed;inset:8% 4%;z-index:40000;background:#efe0c2;color:#302216;padding:18px;overflow:auto;border:2px solid #a67a40;font:16px/1.5 system-ui';
    const title = doc.createElement('p'); title.textContent = '加载未完成。可以重试，或复制诊断结果发给白羊。';
    const text = doc.createElement('textarea'); text.readOnly = true; text.value = JSON.stringify(report(), null, 2); text.style.cssText = 'width:100%;height:55%;font:12px monospace';
    const copy = doc.createElement('button'); copy.textContent = '复制诊断'; copy.onclick = () => { text.focus(); text.select(); doc.execCommand('copy'); };
    const retry = doc.createElement('button'); retry.textContent = '重新下载当前房间'; retry.onclick = () => {
      const url = new URL(location.href); url.searchParams.set('repairCache', '1');
      url.searchParams.set('retry', String(Date.now())); location.replace(url.href);
    };
    const close = doc.createElement('button'); close.textContent = '关闭'; close.onclick = showReport;
    panel.append(title, text, copy, retry, close); doc.body.append(panel);
  }
  window.__tavernLoad = {report, install(engine) {
    if (installed) return; installed = true;
    const resources = engine.resources, load = resources.load;
    let startupWarmed = false;
    function warmStartingRoom(layout) {
      const rooms = layout?.json?.levels;
      if (!Array.isArray(rooms)) return;
      let selected = rooms.find(room => room.id === 'upper');
      try {
        const saved = JSON.parse(localStorage.getItem('belvedere-position-v1-rooms') || 'null');
        const room = rooms.find(room => room.id === saved?.room), b = room?.bounds;
        if (saved?.version === 1 && b && Number.isFinite(saved.x) && Number.isFinite(saved.z) &&
            saved.x >= b[0] + .18 && saved.x <= b[1] - .18 && saved.z >= b[2] + .18 && saved.z <= b[3] - .18) selected = room;
      } catch { /* Same fallback room as Tavern.readPosition. */ }
      if (selected) resources.preload([...new Set(selected.items.map(item => 'models/' + item.model + '/' + item.model))], engine.Prefab, () => {});
    }
    resources.load = function (...args) {
      const name = String(args[0]), index = args.length - 1, complete = args[index];
      // Start independent downloads together; construction still follows the
      // original scene code. No other room's furniture enters this queue.
      if (!startupWarmed && name === 'layout-rooms') {
        startupWarmed = true;
        resources.preload(['materials/tavern-surface', 'surface-data', 'textures/window-view-forest/texture', 'materials/visitor-palette', 'guard/visitor/texture', 'guard/visitor-atlas'], () => {});
      }
      if (typeof complete === 'function') {
        pending.set(name, performance.now());
        args[index] = function (error, ...rest) {
          pending.delete(name); lastProgress = performance.now(); if (error) record(error);
          if (!error && name === 'layout-rooms') warmStartingRoom(rest[0]);
          return complete.call(this, error, ...rest);
        };
      }
      return load.apply(this, args);
    };
    // Creator's DOM image downloader has no timeout. Bound stalled images;
    // the engine's existing retry mechanism retries failures without lowering quality.
    const imageDownload = (url, options, complete) => {
      const img = new Image(); img.crossOrigin = 'anonymous'; let done = false, alternate = false;
      const finish = error => {
        if (done) return; done = true; clearTimeout(timer); img.onload = img.onerror = null;
        if (error) { img.src = ''; record(error); }
        complete(error, error ? null : img);
      };
      const timer = setTimeout(() => finish(new Error('图片下载超时: ' + url)), 20000);
      img.onload = () => finish(null);
      img.onerror = () => { if (alternate) { alternate = false; img.src = url; } else finish(new Error('图片下载失败: ' + url)); };
      textureTransfers.then(transfers => {
        if (done) return;
        const full = new URL(url, document.baseURI), root = new URL('./', document.baseURI), replacement = transfers[full.pathname.slice(root.pathname.length)];
        alternate = !!replacement; img.src = replacement ? new URL(replacement, root).href : url;
      });
      return img;
    };
    engine.assetManager.downloader.register({'.png': imageDownload, '.jpg': imageDownload, '.jpeg': imageDownload, '.webp': imageDownload});
    // Mesh descriptors contain byte offsets into native .bin files. An HTTP 200
    // is not proof that a cached body is the matching, decoded model buffer.
    const base = new URL('./', location.href);
    let manifestTask;
    async function getBytes(url) {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 25000);
      try { const response = await fetch(url, {signal: controller.signal}); if (!response.ok) throw Error('模型下载失败 HTTP '+response.status); return await response.arrayBuffer(); }
      finally { clearTimeout(timer); }
    }
    async function verified(buffer, expected) {
      if (buffer.byteLength !== expected.size) return false;
      if (!crypto.subtle) return true; // LAN HTTP lacks SubtleCrypto; public HTTPS verifies SHA256.
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('') === expected.sha256;
    }
    async function validate(buffer, expected) {
      if (await verified(buffer, expected)) return buffer;
      const magic = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength));
      if (magic[0] === 31 && magic[1] === 139 && typeof DecompressionStream !== 'undefined') {
        const decoded = await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        if (await verified(decoded, expected)) return decoded;
      }
      return null;
    }
    const checkedDownload = (url, options, complete) => {
      (async () => {
        if (!manifestTask) manifestTask = fetch(new URL('mesh-integrity.json?v=mesh-integrity-D4-20261025',base)).then(r => {if(!r.ok)throw Error('模型校验清单不可用');return r.json();}).catch(e => {manifestTask=null;throw e;});
        const full = new URL(url,base), key = full.pathname.slice(base.pathname.length);
        const [manifest, bytes] = await Promise.all([manifestTask, getBytes(full.href)]), expected = manifest[key];
        if (!expected) return bytes;
        let valid = await validate(bytes, expected);
        if (valid) {if(valid !== bytes) repairs.push({file:key,reason:'gzip-body-decoded'});return valid;}
        repairs.push({file:key,reason:'integrity-mismatch',received:bytes.byteLength,expected:expected.size});
        full.searchParams.set('meshIntegrity',expected.sha256);
        valid = await validate(await getBytes(full.href), expected);
        if (!valid) throw Error('模型数据校验失败，未使用损坏文件: '+key);
        return valid;
      })().then(data => new URL(url,base).pathname.endsWith('.json') ? JSON.parse(new TextDecoder().decode(data)) : data)
        .then(data => complete(null,data), error => {record(error);complete(error);});
    };
    engine.assetManager.downloader.register({'.bin': checkedDownload, '.json': checkedDownload});
  }};
  const poll = setInterval(() => {
    if (window.__tavern?.state().firstFrameReady) {
      clearInterval(poll); button?.remove(); panel?.remove(); return;
    }
    if (performance.now() - lastProgress < 25000 && !errors.length) return;
    if (!button) {
      let doc = document; try { doc = parent.document; } catch {}
      button = doc.createElement('button'); button.textContent = new URLSearchParams(location.search).get('diagnose')==='1'?'加载遇到等待 · 重试 / 诊断':'重新进入';
      button.style.cssText = 'position:fixed;bottom:calc(20px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:40000;padding:12px;background:#efe0c2;color:#302216;border:1px solid #ac804c;border-radius:8px';
      button.onclick = new URLSearchParams(location.search).get('diagnose')==='1'?showReport:()=>{const target=new URL(location.href);target.searchParams.set('repairCache','1');location.replace(target.href);}; doc.body.append(button);
    }
  }, 1000);
  addEventListener('pagehide', () => { button?.remove(); panel?.remove(); clearInterval(poll); });
})();
