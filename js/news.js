(function(){
  const statusEl = document.getElementById('news-status');
  const listEl = document.getElementById('news-list');
  const reloadBtn = document.getElementById('reloadBtn');
  const filterInput = document.getElementById('filterInput');

  const DEFAULT_KEYWORDS = ['open','source','open source','opensource','software'];

  async function loadSources(){
    try{
      const res = await fetch('/js/news-sources.json');
      if(!res.ok) throw new Error('Failed to load sources ('+res.status+')');
      return (await res.json()).sources || [];
    }catch(e){
      console.warn('Failed to load news-sources.json', e);
      if(statusEl) statusEl.textContent = 'Failed to load feed sources. See console for details.';
      return [];
    }
  }

  function matchesKeywords(text, keywords){
    if(!text) return false;
    const t = text.toLowerCase();
    return keywords.some(k => t.indexOf(k.toLowerCase()) !== -1);
  }

  async function fetchFeed(url){
    const proxy = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    try{
      const res = await fetch(proxy);
      if(!res.ok) throw new Error('Network response not ok');
      const txt = await res.text();
      return parseFeedXml(txt);
    }catch(e){
      console.warn('Failed to fetch feed', url, e);
      return {items:[]};
    }
  }

  function parseFeedXml(xmlString){
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const items = [];
    const rssItems = Array.from(doc.querySelectorAll('item'));
    if(rssItems.length){
      rssItems.forEach(it=>{
        items.push({
          title: textOf(it.querySelector('title')),
          link: textOf(it.querySelector('link')) || (it.querySelector('guid') ? textOf(it.querySelector('guid')) : null),
          pubDate: textOf(it.querySelector('pubDate')),
          content: textOf(it.querySelector('description'))
        });
      });
    } else {
      const atomItems = Array.from(doc.querySelectorAll('entry'));
      atomItems.forEach(it=>{
        items.push({
          title: textOf(it.querySelector('title')),
          link: textOf(it.querySelector('link') ? it.querySelector('link').getAttribute('href') : null),
          pubDate: textOf(it.querySelector('updated')) || textOf(it.querySelector('published')),
          content: textOf(it.querySelector('summary')) || textOf(it.querySelector('content'))
        });
      });
    }
    return {items};
  }

  function textOf(node){
    if(!node) return null;
    return node.textContent ? node.textContent.trim() : (node.nodeValue || '').trim();
  }

  function renderItems(items){
    listEl.innerHTML = '';
    if(!items.length){
      statusEl.textContent = 'No matching items found.';
      return;
    }
    statusEl.textContent = '';
    items.forEach(it=>{
      const li = document.createElement('li');
      li.className = 'news-item';
      const a = document.createElement('a');
      a.href = it.link || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = it.title || 'Untitled';
      const meta = document.createElement('div');
      meta.className = 'news-meta';
      const src = document.createElement('span'); src.className='news-source'; src.textContent = it.source || '';
      const date = document.createElement('span'); date.textContent = it.pubDate ? formatDate(it.pubDate) : '';
      meta.appendChild(src); meta.appendChild(date);
      li.appendChild(a); li.appendChild(meta);
      listEl.appendChild(li);
    });
  }

  function formatDate(d){
    try{ const dt = new Date(d); return dt.toLocaleString(); }catch(e){ return d; }
  }

  async function loadAndRender(){
    statusEl.textContent = 'Loading feeds…';
    const sources = await loadSources();
    const keywords = getKeywords();
    const fetches = sources.map(async s => {
      const res = await fetchFeed(s.url);
      return (res.items || []).map(it=>Object.assign({}, it, {source: s.name}));
    });
    const results = await Promise.all(fetches);
    const all = results.flat();
    const filtered = all.filter(it => matchesKeywords(it.title, keywords) || matchesKeywords(it.content, keywords));
    filtered.sort((a,b)=>{
      const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
      const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
      return (tb||0)-(ta||0);
    });
    renderItems(filtered.slice(0, 60));
    if(filtered.length) statusEl.textContent = `${filtered.length} items — filtered by keywords: ${keywords.join(', ')}`;
    else statusEl.textContent = 'No matching items found.';
  }

  function getKeywords(){
    const v = (filterInput && filterInput.value && filterInput.value.trim());
    if(v) return v.split(',').map(s=>s.trim()).filter(Boolean);
    return DEFAULT_KEYWORDS;
  }

  reloadBtn.addEventListener('click', ()=>{ loadAndRender(); });
  filterInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ loadAndRender(); } });

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadAndRender);
  else loadAndRender();

})();
