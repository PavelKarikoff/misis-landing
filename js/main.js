/* ============================================================
   Кафедра ИЯКТ НИТУ «МИСИС» — интерактив лендинга
   ============================================================ */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Шапка: тень при скролле ---------- */
  var header = document.getElementById("header");
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");

  function closeMenu() {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
    document.body.classList.remove("nav-locked");
  }

  burger.addEventListener("click", function () {
    var isOpen = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(isOpen));
    burger.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    document.body.classList.toggle("nav-locked", isOpen);
  });

  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) closeMenu();
  });

  /* ---------- Scroll-spy: подсветка активного пункта меню ---------- */
  var spyLinks = Array.prototype.slice.call(nav.querySelectorAll('.nav__link[href^="#"]'));
  var spySections = spyLinks
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && spySections.length) {
    var spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = "#" + entry.target.id;
          spyLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === id);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    spySections.forEach(function (section) { spyObserver.observe(section); });
  }

  /* ---------- Появление блоков при скролле ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    // лёгкая лесенка для карточек внутри одной сетки
    var grids = new Map();
    revealEls.forEach(function (el) {
      var parent = el.parentElement;
      if (!grids.has(parent)) grids.set(parent, 0);
      var index = grids.get(parent);
      el.style.setProperty("--reveal-delay", (index % 3) * 0.09 + "s");
      grids.set(parent, index + 1);
    });

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Фильтр курсов ---------- */
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter__btn"));
  var courseCards = Array.prototype.slice.call(document.querySelectorAll(".course-card"));
  var coursesEmpty = document.getElementById("coursesEmpty");

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterButtons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      var filter = btn.dataset.filter;
      var visible = 0;

      courseCards.forEach(function (card) {
        var show = filter === "all" || card.dataset.cat === filter;
        card.classList.toggle("is-hidden", !show);
        if (show) {
          visible++;
          // переигрываем анимацию появления для отфильтрованных карточек
          if (!prefersReducedMotion) {
            card.classList.remove("is-visible");
            void card.offsetWidth;
            card.classList.add("is-visible");
          }
        }
      });

      if (coursesEmpty) coursesEmpty.hidden = visible !== 0;
    });
  });

  /* ---------- «Записаться» с карточки → форма с выбранным курсом ---------- */
  var courseSelect = document.getElementById("fCourse");

  function selectCourse(name) {
    if (!courseSelect || !name) return false;
    var options = Array.prototype.slice.call(courseSelect.options);
    for (var i = 0; i < options.length; i++) {
      if (options[i].text === name) {
        courseSelect.value = options[i].value || options[i].text;
        courseSelect.closest(".field").classList.remove("has-error");
        var err = document.getElementById("errCourse");
        if (err) err.hidden = true;
        courseSelect.setAttribute("aria-invalid", "false");
        return true;
      }
    }
    return false;
  }

  Array.prototype.slice.call(document.querySelectorAll(".course-card__cta")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectCourse(btn.dataset.course);
      var target = document.getElementById("lead");
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      window.setTimeout(function () {
        var nameInput = document.getElementById("fName");
        if (nameInput) nameInput.focus({ preventScroll: true });
      }, prefersReducedMotion ? 0 : 600);
    });
  });

  /* ---------- FAQ: раскрываем только один вопрос ---------- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq__item"));
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- Маска телефона +7 (___) ___-__-__ ---------- */
  var phoneInput = document.getElementById("fPhone");

  function formatPhone(raw) {
    var digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    if (digits[0] === "8") digits = "7" + digits.slice(1);
    if (digits[0] !== "7") digits = "7" + digits;
    digits = digits.slice(0, 11);

    var out = "+7";
    if (digits.length > 1) out += " (" + digits.slice(1, 4);
    if (digits.length >= 4) out += ")";
    if (digits.length > 4) out += " " + digits.slice(4, 7);
    if (digits.length > 7) out += "-" + digits.slice(7, 9);
    if (digits.length > 9) out += "-" + digits.slice(9, 11);
    return out;
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      phoneInput.value = formatPhone(phoneInput.value);
    });
    phoneInput.addEventListener("focus", function () {
      if (!phoneInput.value) phoneInput.value = "+7 (";
    });
  }

  /* ---------- Валидация и отправка заявки (демо-режим) ---------- */
  var form = document.getElementById("leadForm");
  var successBlock = document.getElementById("leadSuccess");
  var submitBtn = document.getElementById("submitBtn");

  // ============================================================
  // ТОЧКА ПОДКЛЮЧЕНИЯ РЕАЛЬНОЙ ОТПРАВКИ.
  // Демо: сохраняем заявку в localStorage и имитируем запрос.
  // Чтобы подключить реальный бекенд (Formspree, Telegram-бот,
  // Битрикс24 и т.п.), замените тело функции на fetch(...).
  // ============================================================
  function submitLead(payload) {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        try {
          var key = "misis_leads";
          var leads = JSON.parse(localStorage.getItem(key) || "[]");
          leads.push(payload);
          localStorage.setItem(key, JSON.stringify(leads));
        } catch (e) {
          console.warn("Не удалось сохранить заявку в localStorage:", e);
        }
        console.info("Заявка (демо-режим):", payload);
        resolve({ ok: true });
      }, 600);
    });
  }

  function setError(input, errId, hasError) {
    var err = document.getElementById(errId);
    var field = input.closest(".field");
    if (err) err.hidden = !hasError;
    if (field) field.classList.toggle("has-error", hasError);
    input.setAttribute("aria-invalid", hasError ? "true" : "false");
  }

  function validate() {
    var name = document.getElementById("fName");
    var phone = document.getElementById("fPhone");
    var email = document.getElementById("fEmail");
    var agree = document.getElementById("fAgree");

    var valid = true;
    var firstInvalid = null;

    var nameBad = name.value.trim().length < 3;
    setError(name, "errName", nameBad);
    if (nameBad) { valid = false; firstInvalid = firstInvalid || name; }

    var phoneBad = phone.value.replace(/\D/g, "").length !== 11;
    setError(phone, "errPhone", phoneBad);
    if (phoneBad) { valid = false; firstInvalid = firstInvalid || phone; }

    var emailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    setError(email, "errEmail", emailBad);
    if (emailBad) { valid = false; firstInvalid = firstInvalid || email; }

    var courseBad = !courseSelect.value;
    setError(courseSelect, "errCourse", courseBad);
    if (courseBad) { valid = false; firstInvalid = firstInvalid || courseSelect; }

    var agreeBad = !agree.checked;
    setError(agree, "errAgree", agreeBad);
    if (agreeBad) { valid = false; firstInvalid = firstInvalid || agree; }

    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  ["fName", "fPhone", "fEmail", "fCourse", "fAgree"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", function () {
      setError(el, "err" + id.slice(1), false);
    });
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "Отправляем…";

      var payload = {
        name: document.getElementById("fName").value.trim(),
        phone: document.getElementById("fPhone").value.trim(),
        email: document.getElementById("fEmail").value.trim(),
        course: courseSelect.value,
        comment: document.getElementById("fComment").value.trim(),
        sentAt: new Date().toISOString(),
        page: window.location.href
      };

      submitLead(payload)
        .then(function () {
          form.hidden = true;
          successBlock.hidden = false;
          var firstName = payload.name.split(/\s+/)[1] || payload.name.split(/\s+/)[0] || "";
          document.getElementById("successName").textContent = firstName;
          successBlock.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = "Отправить заявку";
          window.alert("Не удалось отправить заявку. Попробуйте ещё раз или напишите нам на english@misis.ru.");
        });
    });
  }

  var resetBtn = document.getElementById("resetForm");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      form.reset();
      ["errName", "errPhone", "errEmail", "errCourse", "errAgree"].forEach(function (id) {
        var err = document.getElementById(id);
        if (err) err.hidden = true;
      });
      Array.prototype.slice.call(form.querySelectorAll(".has-error")).forEach(function (f) {
        f.classList.remove("has-error");
      });
      submitBtn.disabled = false;
      submitBtn.textContent = "Отправить заявку";
      successBlock.hidden = true;
      form.hidden = false;
      document.getElementById("fName").focus();
    });
  }

  /* ---------- Год в подвале ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
