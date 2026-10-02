(function () {
  var nodes = document.querySelectorAll("[data-visit-count]");

  function formatN(n) {
    try {
      var lang = document.documentElement.getAttribute("lang") || "es";
      return new Intl.NumberFormat(lang === "en" ? "en" : "es").format(n);
    } catch (e) {
      return String(n);
    }
  }

  function paint(n) {
    var text = formatN(n);
    nodes.forEach(function (el) {
      el.textContent = text;
      el.setAttribute("data-ready", "1");
    });
  }

  // Site-wide ldeluipy.es counter (/, /en/, /maestro/, …). Cookie path=/.
  fetch("/api/hit.php", { credentials: "same-origin", cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && typeof data.n === "number" && nodes.length) paint(data.n);
    })
    .catch(function () {});
})();
