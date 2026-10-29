/* Instituto Imprinting — interações do site */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Menu mobile ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("menu");
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); }
  });

  document.getElementById("ano").textContent = new Date().getFullYear();

  /* ---------- Ilustração do hero: o "imprint" ---------- */
  (function drawImprint() {
    var svg = document.getElementById("imprint");
    if (!svg) return;
    var NS = "http://www.w3.org/2000/svg";
    var cx = 260, cy = 260, rings = 15;
    var colors = ["#3FD1B5", "#0B7A6B", "#5B4BC4", "#2B2E5C"];
    // semente fixa: o desenho é sempre o mesmo
    var seed = 7;
    function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var phases = [rand() * 6.28, rand() * 6.28, rand() * 6.28];

    for (var i = 0; i < rings; i++) {
      var base = 22 + i * 15.5;
      var amp = 3 + i * 1.15;
      // cada anel tem uma abertura, como as linhas de uma digital
      var gapStart = rand() * Math.PI * 2;
      var gapSize = i < 2 ? 0.6 : 0.25 + rand() * 0.5;
      var steps = 160, d = "";
      for (var s = 0; s <= steps; s++) {
        var t = gapStart + gapSize + (Math.PI * 2 - gapSize) * (s / steps);
        var r = base
          + amp * Math.sin(3 * t + phases[0] + i * 0.18)
          + amp * 0.55 * Math.sin(5 * t + phases[1] - i * 0.12)
          + amp * 0.3 * Math.sin(2 * t + phases[2]);
        var x = cx + r * Math.cos(t) * 1.04;
        var y = cy + r * Math.sin(t) * 0.96;
        d += (s === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      }
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("stroke", colors[Math.min(colors.length - 1, Math.floor(i / (rings / colors.length)))]);
      p.setAttribute("stroke-width", (2.6 - i * 0.08).toFixed(2));
      p.setAttribute("opacity", (1 - i * 0.03).toFixed(2));
      svg.appendChild(p);
      if (!reduceMotion) {
        var len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        p.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.3,.6,.2,1) " + (i * 0.07).toFixed(2) + "s";
      }
    }
    // ponto central
    var dot = document.createElementNS(NS, "circle");
    dot.setAttribute("cx", cx); dot.setAttribute("cy", cy); dot.setAttribute("r", 7);
    dot.setAttribute("fill", "#5B4BC4");
    svg.appendChild(dot);

    if (!reduceMotion) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          svg.querySelectorAll("path").forEach(function (p) { p.style.strokeDashoffset = "0"; });
        });
      });
    }
  })();

  /* ---------- Revelação das etapas do fundo ---------- */
  var etapas = document.querySelector(".etapas");
  if (etapas && "IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("reveal-ready");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { etapas.classList.add("is-visible"); io.disconnect(); }
      });
    }, { threshold: 0.2 });
    io.observe(etapas);
  }

  /* ---------- Formulário em etapas ---------- */
  var form = document.getElementById("form");
  var steps = Array.prototype.slice.call(form.querySelectorAll(".step"));
  var total = steps.length;
  var current = 1;
  var bar = form.querySelector(".progress__bar");
  var label = document.getElementById("progress-label");
  var btnVoltar = document.getElementById("voltar");
  var btnProximo = document.getElementById("proximo");
  var btnEnviar = document.getElementById("enviar");
  var statusEl = document.getElementById("form-status");
  var saudeBox = form.querySelector(".check--saude");

  var legends = {
    investidor: "Seu perfil de investidor",
    pesquisador: "Sobre sua pesquisa",
    medico: "Sobre sua atuação",
    paciente: "Como podemos falar com você"
  };
  var agradecimentos = {
    investidor: "Vamos enviar a apresentação do projeto e agendar uma conversa com o time em até 5 dias úteis.",
    pesquisador: "Nossa equipe de pesquisa vai analisar seu perfil e responder em até 5 dias úteis.",
    medico: "Vamos entrar em contato em até 5 dias úteis para explicar como funciona a atuação na rede.",
    paciente: "Vamos entrar em contato pelo canal que você escolheu em até 5 dias úteis. Se precisar de ajuda agora, ligue 188 (CVV)."
  };

  function perfil() {
    var el = form.querySelector('input[name="perfil"]:checked');
    return el ? el.value : "";
  }
  function val(name) {
    var el = form.elements[name];
    if (!el) return "";
    if (el instanceof RadioNodeList) return el.value || "";
    return (el.value || "").trim();
  }
  function checked(name) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }

  function setError(name, msg) {
    var p = form.querySelector('[data-error-for="' + name + '"]');
    if (p) p.textContent = msg || "";
    var input = form.querySelector('[name="' + name + '"]');
    if (input && input.matches("input:not([type=radio]):not([type=checkbox]), select, textarea")) {
      input.classList.toggle("is-invalid", !!msg);
      input.classList.toggle("is-valid", !msg && !!input.value);
      if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
      if (p) { p.id = p.id || "err-" + name; input.setAttribute("aria-describedby", p.id); }
    }
    return !msg;
  }

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var rules = {
    perfil: function () { return perfil() ? "" : "Escolha uma das opções para continuar."; },
    nome: function () { var v = val("nome"); return v.length < 3 ? "Digite seu nome completo." : (v.split(/\s+/).length < 2 ? "Inclua também o sobrenome." : ""); },
    email: function () { return emailRe.test(val("email")) ? "" : "Digite um e-mail válido, como nome@exemplo.com."; },
    telefone: function () { var d = val("telefone").replace(/\D/g, ""); return (d.length === 10 || d.length === 11) ? "" : "Digite o celular com DDD, como (11) 98765-4321."; },
    cidade: function () { return val("cidade").length >= 2 ? "" : "Digite sua cidade."; },
    uf: function () { return val("uf") ? "" : "Escolha a UF."; },
    inv_tipo: function () { return val("inv_tipo") ? "" : "Escolha pessoa física ou jurídica."; },
    inv_faixa: function () { return val("inv_faixa") ? "" : "Escolha uma faixa — pode ser \"Ainda não sei\"."; },
    inv_area: function () { return val("inv_area") ? "" : "Escolha a frente que mais interessa."; },
    pes_inst: function () { return val("pes_inst").length >= 2 ? "" : "Digite sua instituição."; },
    pes_area: function () { return val("pes_area").length >= 2 ? "" : "Digite sua área de pesquisa."; },
    pes_lattes: function () { var v = val("pes_lattes"); return !v || /^https?:\/\/\S+\.\S+/.test(v) ? "" : "O link precisa começar com http:// ou https://."; },
    pes_tipo: function () { return val("pes_tipo") ? "" : "Escolha o tipo de parceria."; },
    med_esp: function () { return val("med_esp").length >= 2 ? "" : "Digite sua especialidade."; },
    med_reg: function () { return val("med_reg").length >= 4 ? "" : "Digite seu registro, como CRM-SP 123456."; },
    med_int: function () { return checked("med_int").length ? "" : "Marque ao menos uma opção."; },
    pac_idade: function () {
      var v = val("pac_idade");
      if (!v) return "Escolha sua faixa etária.";
      if (v === "menor") return "O programa é para maiores de 18 anos. Peça a um responsável para entrar em contato pelo e-mail contact@institutoimprinting.com.br.";
      return "";
    },
    pac_contato: function () { return val("pac_contato") ? "" : "Escolha como prefere ser contatado."; },
    lgpd: function () { return form.elements.lgpd.checked ? "" : "Para enviar, autorize o uso dos dados para contato."; },
    saude: function () { return perfil() !== "paciente" || form.elements.saude.checked ? "" : "Para pacientes, esta autorização é obrigatória."; }
  };

  var fieldsByStep = {
    1: ["perfil"],
    2: ["nome", "email", "telefone", "cidade", "uf"],
    3: function () {
      return {
        investidor: ["inv_tipo", "inv_faixa", "inv_area"],
        pesquisador: ["pes_inst", "pes_area", "pes_lattes", "pes_tipo"],
        medico: ["med_esp", "med_reg", "med_int"],
        paciente: ["pac_idade", "pac_contato"]
      }[perfil()] || [];
    },
    4: ["lgpd", "saude"]
  };
  function fieldsOf(n) { var f = fieldsByStep[n]; return typeof f === "function" ? f() : f; }

  function validateStep(n) {
    var firstBad = null;
    fieldsOf(n).forEach(function (name) {
      var ok = setError(name, rules[name]());
      if (!ok && !firstBad) firstBad = name;
    });
    if (firstBad) {
      var el = form.querySelector('[name="' + firstBad + '"]');
      if (el) el.focus();
    }
    return !firstBad;
  }

  function show(n) {
    current = n;
    steps.forEach(function (s) { s.hidden = Number(s.dataset.step) !== n; });
    bar.style.width = (n / total * 100) + "%";
    label.textContent = "Etapa " + n + " de " + total;
    btnVoltar.hidden = n === 1;
    btnProximo.hidden = n === total;
    btnEnviar.hidden = n !== total;
    statusEl.textContent = ""; statusEl.classList.remove("is-error");
    if (n === 3) applyBranch();
    if (n === 4) saudeBox.hidden = perfil() !== "paciente";
  }

  function applyBranch() {
    var p = perfil();
    form.querySelectorAll(".branch").forEach(function (b) { b.classList.toggle("is-active", b.dataset.branch === p); });
    document.getElementById("step3-legend").textContent = legends[p] || "Sobre seu interesse";
  }

  function focusStep() {
    var legend = steps[current - 1].querySelector("legend");
    legend.setAttribute("tabindex", "-1");
    legend.focus({ preventScroll: true });
    var top = form.getBoundingClientRect().top + window.scrollY - 90;
    if (form.getBoundingClientRect().top < 70) window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
  }

  btnProximo.addEventListener("click", function () {
    if (!validateStep(current)) return;
    show(current + 1); focusStep();
  });
  btnVoltar.addEventListener("click", function () { show(current - 1); focusStep(); });

  // Enter avança em vez de enviar antes da hora
  form.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && current < total) {
      e.preventDefault(); btnProximo.click();
    }
  });

  // validação em tempo real
  form.addEventListener("input", function (e) {
    var name = e.target.name;
    if (name === "telefone") e.target.value = maskPhone(e.target.value);
    if (name === "mensagem") document.getElementById("counter").textContent = e.target.value.length + " / 1500";
    if (rules[name] && (e.target.classList.contains("is-invalid") || e.target.type === "radio" || e.target.type === "checkbox" || e.target.tagName === "SELECT")) {
      setError(name, rules[name]());
    }
  });
  form.addEventListener("focusout", function (e) {
    var name = e.target.name;
    if (rules[name] && e.target.value && e.target.matches("input:not([type=radio]):not([type=checkbox])")) setError(name, rules[name]());
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "perfil") setError("perfil", "");
  });

  function maskPhone(v) {
    var d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  // Botões e links que já escolhem o perfil
  document.querySelectorAll("[data-perfil]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      var p = el.dataset.perfil;
      var radio = form.querySelector('input[name="perfil"][value="' + p + '"]');
      if (radio) { radio.checked = true; setError("perfil", ""); }
      if (el.tagName === "BUTTON") {
        e.preventDefault();
        document.getElementById("interesse").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      }
      if (!form.classList.contains("is-done") && current === 1) {
        setTimeout(function () { show(2); var n = document.getElementById("nome"); n && n.focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
      }
    });
  });

  function payload() {
    var p = perfil();
    var respostas = {
      investidor: { tipo: val("inv_tipo"), experiencia: checked("inv_exp"), faixa: val("inv_faixa"), area: val("inv_area") },
      pesquisador: { instituicao: val("pes_inst"), area: val("pes_area"), lattes: val("pes_lattes"), parceria: val("pes_tipo") },
      medico: { especialidade: val("med_esp"), registro: val("med_reg"), interesse: checked("med_int") },
      paciente: { faixa_etaria: val("pac_idade"), contato_preferido: val("pac_contato") }
    }[p];
    return {
      perfil: p,
      nome: val("nome"),
      email: val("email").toLowerCase(),
      telefone: val("telefone"),
      cidade: val("cidade"),
      uf: val("uf"),
      respostas: respostas,
      mensagem: val("mensagem") || null,
      consentimento_lgpd: form.elements.lgpd.checked,
      consentimento_saude: p === "paciente" ? form.elements.saude.checked : false,
      origem: new URLSearchParams(location.search).get("utm_source") || "site"
    };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    for (var n = 1; n <= total; n++) {
      if (!validateStep(n)) { show(n); return; }
    }
    // armadilha para robôs: humanos não veem este campo
    if (form.elements.website.value) { done(); return; }

    var cfg = window.IMPRINTING_CONFIG || {};
    btnEnviar.disabled = true; btnEnviar.textContent = "Enviando…";
    statusEl.textContent = ""; statusEl.classList.remove("is-error");

    fetch(cfg.supabaseUrl + "/rest/v1/" + cfg.tabela, {
      method: "POST",
      headers: {
        "apikey": cfg.supabaseKey,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload())
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      done();
    }).catch(function () {
      statusEl.classList.add("is-error");
      statusEl.textContent = "Não foi possível enviar agora. Verifique sua conexão e tente de novo, ou escreva para contact@institutoimprinting.com.br.";
    }).then(function () {
      btnEnviar.disabled = false; btnEnviar.textContent = "Enviar manifestação";
    });
  });

  function done() {
    document.getElementById("sucesso-texto").textContent = agradecimentos[perfil()] || agradecimentos.investidor;
    form.classList.add("is-done");
    var s = document.getElementById("sucesso");
    s.hidden = false; s.focus();
  }

  document.getElementById("novo").addEventListener("click", function () {
    form.reset();
    form.querySelectorAll(".is-valid, .is-invalid").forEach(function (el) { el.classList.remove("is-valid", "is-invalid"); });
    form.querySelectorAll(".error").forEach(function (el) { el.textContent = ""; });
    document.getElementById("counter").textContent = "0 / 1500";
    form.classList.remove("is-done");
    document.getElementById("sucesso").hidden = true;
    show(1); focusStep();
  });

  show(1);
})();
