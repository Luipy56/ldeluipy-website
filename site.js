(function(){
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function smoothMarquee(id, pxPerSec){
    var track = document.getElementById(id);
    if(!track) return;
    var box = track.parentElement;
    var seed = track.innerHTML;
    var unit = 0, pos = 0, vel = 1, target = 1, lastT = -1, running = false;
    function layout(){
      track.innerHTML = seed;
      unit = track.scrollWidth;
      var guard = 0;
      while(box.clientWidth && track.scrollWidth < box.clientWidth * 2 + unit && guard < 8){
        track.insertAdjacentHTML("beforeend", seed);
        guard++;
      }
    }
    if(reduce){ layout(); return; }
    function tick(now){
      if(lastT < 0) lastT = now;
      var dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
      vel += (target - vel) * Math.min(1, dt * 2.6);
      pos -= pxPerSec * dt * vel;
      if(unit > 0 && -pos >= unit) pos += unit;
      track.style.transform = "translate3d(" + pos + "px,0,0)";
      requestAnimationFrame(tick);
    }
    function kickoff(){
      layout();
      if(!running){ running = true; requestAnimationFrame(tick); }
    }
    box.addEventListener("mouseenter", function(){ target = 0.28; });
    box.addEventListener("mouseleave", function(){ target = 1; });
    addEventListener("resize", function(){ requestAnimationFrame(function(){ layout(); }); });
    requestAnimationFrame(function(){ requestAnimationFrame(kickoff); });
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ requestAnimationFrame(layout); });
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

  function bindEcoMapMotion(){
    var maps = Array.prototype.slice.call(document.querySelectorAll(".map"));
    if(!maps.length) return;

    function play(map){
      if(!map.querySelector(".diagram.eco")) return;
      map.classList.remove("eco-play");
      void map.offsetWidth;
      map.classList.add("eco-play");
    }

    function clearFocus(svg){
      svg.removeAttribute("data-focus-active");
      Array.prototype.forEach.call(svg.querySelectorAll("[data-focus-match], [data-focus-selected]"), function(el){
        el.removeAttribute("data-focus-match");
        el.removeAttribute("data-focus-selected");
      });
      Array.prototype.forEach.call(svg.querySelectorAll(".eco-flow-pulse"), function(el){ el.remove(); });
    }

    function focusNode(svg, id){
      clearFocus(svg);
      var node = svg.querySelector('[data-node-id="' + id + '"]');
      if(!node) return;
      svg.setAttribute("data-focus-active", id);
      node.setAttribute("data-focus-match", "");
      node.setAttribute("data-focus-selected", "");

      var edges = Array.prototype.slice.call(svg.querySelectorAll(
        '[data-edge-from="' + id + '"], [data-edge-to="' + id + '"]'
      ));
      var neighbors = {};
      neighbors[id] = true;
      edges.forEach(function(edge){
        edge.setAttribute("data-focus-match", "");
        var a = edge.getAttribute("data-edge-from");
        var b = edge.getAttribute("data-edge-to");
        if(a) neighbors[a] = true;
        if(b) neighbors[b] = true;
        /* Archify-like traveling pulse on connected routes */
        if(edge.tagName && edge.tagName.toLowerCase() === "path" && edge.getAttribute("d")){
          var pulse = edge.cloneNode(false);
          pulse.removeAttribute("data-animate");
          pulse.removeAttribute("marker-end");
          pulse.removeAttribute("class");
          pulse.setAttribute("class", "eco-flow-pulse" + (edge.classList.contains("a-emphasis") ? " is-emphasis" : ""));
          pulse.setAttribute("d", edge.getAttribute("d"));
          edge.parentNode.appendChild(pulse);
        }
      });
      Object.keys(neighbors).forEach(function(nid){
        var n = svg.querySelector('[data-node-id="' + nid + '"]');
        if(n) n.setAttribute("data-focus-match", "");
      });
    }

    function bindFocus(svg){
      var nodes = Array.prototype.slice.call(svg.querySelectorAll("[data-node-id]"));
      nodes.forEach(function(node){
        var id = node.getAttribute("data-node-id");
        if(!id) return;
        node.addEventListener("pointerenter", function(){ focusNode(svg, id); });
        node.addEventListener("pointerleave", function(ev){
          /* keep focus if moving to another node inside svg */
          var to = ev.relatedTarget;
          if(to && svg.contains(to) && to.closest && to.closest("[data-node-id]")) return;
          clearFocus(svg);
        });
        node.addEventListener("focus", function(){ focusNode(svg, id); });
        node.addEventListener("blur", function(){ clearFocus(svg); });
      });
      svg.addEventListener("pointerleave", function(){ clearFocus(svg); });
    }

    maps.forEach(function(map){
      var svg = map.querySelector(".diagram.eco");
      if(svg) bindFocus(svg);
      if(map.classList.contains("in")) play(map);
      var mo = new MutationObserver(function(){
        if(map.classList.contains("in")){ play(map); mo.disconnect(); }
      });
      mo.observe(map, { attributes: true, attributeFilter: ["class"] });
    });
  }
  bindEcoMapMotion();

})();
