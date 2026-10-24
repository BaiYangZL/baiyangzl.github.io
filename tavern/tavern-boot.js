// Runs before Cocos startup. Diagnostics stay on this device until copied.
(() => {
  const pending = new Map(), errors = [], started = performance.now();
  let installed = false, button, panel, lastProgress = started;
  const record = error => { errors.push(String(error?.stack || error).slice(0, 2400)); if (errors.length > 12) errors.shift(); };
  // Tavern.start catches construction failures and only logs them. These do
  // not dispatch window.error or unhandledrejection, so preserve that evidence.
  const originalError = console.error;
  console.error = function (...args) { args.forEach(record); return originalError.apply(console, args); };
  addEventListener('error', event => record(event.message || 'Resource failed'));
  addEventListener('unhandledrejection', event => record(event.reason));
  const report = () => ({version: 'scene-error-D3-20261025', url: location.href,
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
    resources.load = function (...args) {
      const name = String(args[0]), index = args.length - 1, complete = args[index];
      if (typeof complete === 'function') {
        pending.set(name, performance.now());
        args[index] = function (error, ...rest) {
          pending.delete(name); lastProgress = performance.now(); if (error) record(error);
          return complete.call(this, error, ...rest);
        };
      }
      return load.apply(this, args);
    };
    // Creator's DOM image downloader has no timeout. Bound stalled images;
    // the engine's existing retry mechanism retries failures without lowering quality.
    const imageDownload = (url, options, complete) => {
      const img = new Image(); img.crossOrigin = 'anonymous'; let done = false;
      const finish = error => {
        if (done) return; done = true; clearTimeout(timer); img.onload = img.onerror = null;
        if (error) { img.src = ''; record(error); }
        complete(error, error ? null : img);
      };
      const timer = setTimeout(() => finish(new Error('图片下载超时: ' + url)), 20000);
      img.onload = () => finish(null); img.onerror = () => finish(new Error('图片下载失败: ' + url)); img.src = url;
      return img;
    };
    engine.assetManager.downloader.register({'.png': imageDownload, '.jpg': imageDownload, '.jpeg': imageDownload, '.webp': imageDownload});
  }};
  const poll = setInterval(() => {
    if (window.__tavern?.state().firstFrameReady) {
      clearInterval(poll); button?.remove(); panel?.remove(); return;
    }
    if (performance.now() - lastProgress < 25000 && !errors.length) return;
    if (!button) {
      let doc = document; try { doc = parent.document; } catch {}
      button = doc.createElement('button'); button.textContent = '加载遇到等待 · 重试 / 诊断';
      button.style.cssText = 'position:fixed;bottom:calc(20px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:40000;padding:12px;background:#efe0c2;color:#302216;border:1px solid #ac804c;border-radius:8px';
      button.onclick = showReport; doc.body.append(button);
    }
  }, 1000);
  addEventListener('pagehide', () => { button?.remove(); panel?.remove(); clearInterval(poll); });
})();
