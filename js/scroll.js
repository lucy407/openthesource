(function(){

  function initObservers(){
    const sections = document.querySelectorAll('.panel');
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('in-view');
        } else {
          e.target.classList.remove('in-view');
        }
      });
    },{threshold:0.22});
    sections.forEach(s=>io.observe(s));
  }

  function initKeyNav(){
    let isScrolling = false;
    function getSections(){return Array.from(document.querySelectorAll('.panel'))}
    function scrollToIndex(i){
      const secs = getSections();
      const idx = Math.max(0, Math.min(secs.length-1, i));
      isScrolling = true;
      secs[idx].scrollIntoView({behavior:'smooth',block:'start'});
      setTimeout(()=>isScrolling=false,600);
    }
    document.addEventListener('keydown', (ev)=>{
      if(isScrolling) return;
      if(ev.key === 'ArrowDown'){
        ev.preventDefault();
        const cur = getSections().findIndex(s => isElementMostlyVisible(s));
        scrollToIndex(Math.max(0, cur+1));
      } else if(ev.key === 'ArrowUp'){
        ev.preventDefault();
        const cur = getSections().findIndex(s => isElementMostlyVisible(s));
        scrollToIndex(Math.max(0, cur-1));
      }
    }, {passive:false});
  }

  function isElementMostlyVisible(el){
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return (r.top >= -0.2*vh && r.top < 0.6*vh);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>{ initObservers(); initKeyNav(); });
  else { initObservers(); initKeyNav(); }

})();
