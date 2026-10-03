(function(){
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function smoothMarquee(id, pxPerSec){
    var track = document.getElementById(id);
    if(!track) return;
    track.insertAdjacentHTML("beforeend", track.innerHTML);
    if(reduce) return;
    var half = 0, pos = 0, vel = 1, target = 1, lastT = -1, running = false;
    var box = track.parentElement;
    function measure(){ half = track.scrollWidth / 2; }
    function tick(now){
      if(lastT < 0) lastT = now;
      var dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
      vel += (target - vel) * Math.min(1, dt * 2.6);
      pos -= pxPerSec * dt * vel;
      if(half > 0 && -pos >= half) pos += half;
      track.style.transform = "translate3d(" + pos + "px,0,0)";
      requestAnimationFrame(tick);
    }
    function kickoff(){
      measure();
      if(!running){ running = true; requestAnimationFrame(tick); }
    }
    box.addEventListener("mouseenter", function(){ target = 0; });
    box.addEventListener("mouseleave", function(){ target = 1; });
    addEventListener("resize", function(){ requestAnimationFrame(measure); });
    /* Separate DOM write from geometry read (avoids forced reflow) */
    requestAnimationFrame(function(){ requestAnimationFrame(kickoff); });
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ requestAnimationFrame(measure); });
  }

  var io;
  function observeReveal(){
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal:not(.in)"));
    if(reduce || !("IntersectionObserver" in window)){ items.forEach(function(x){x.classList.add("in");}); return; }
    if(!io) io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach(function(x){ io.observe(x); });
  }

  var frames = Array.prototype.slice.call(document.querySelectorAll(".frame"));
  frames.forEach(function(x, i){ x.style.setProperty("--i", i); });
  if(reduce || !("IntersectionObserver" in window)){ frames.forEach(function(x){x.classList.add("in");}); }
  else{
    var io2 = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); io2.unobserve(en.target); } });
    }, { rootMargin: "0px 0px 18% 0px", threshold: 0.01 });
    frames.forEach(function(x){ io2.observe(x); });
  }

  var ban = document.getElementById("banner"), last = 0;
  addEventListener("scroll", function(){ var y = scrollY; ban.classList.toggle("hide", y > last && y > 120); last = y; }, { passive: true });

  smoothMarquee("marq", 85);
  smoothMarquee("fmarq", 65);

  function bindCopy(id, attr){
    var el = document.getElementById(id);
    if(!el) return;
    var label = el.getAttribute("data-label") || el.textContent.trim();
    el.addEventListener("click", function(){
      var text = el.getAttribute(attr);
      if(!text) return;
      function done(){
        el.textContent = el.getAttribute("data-done") || "Copiado ✓";
        setTimeout(function(){ el.textContent = label; }, 1600);
      }
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var i = document.createElement("input"); i.value = text; document.body.appendChild(i);
        i.select(); try{ document.execCommand("copy"); }catch(e){} document.body.removeChild(i); done();
      }
    });
  }
  bindCopy("copymail", "data-mail");
  bindCopy("copydiscord", "data-nick");

  observeReveal();
})();
