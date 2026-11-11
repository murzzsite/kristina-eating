const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/FP9E3PLEF2';

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* header */
  const header = $('#header');
  const burger = $('#burger');
  const nav = $('#nav');
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  /* hero title: split by words */
  const title = $('[data-split]');
  if (title) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', words.join(' '));
    title.innerHTML = words.map((w, i) =>
      `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  }

  /* phone mask */
  $$('input[type="tel"]').forEach(input => {
    input.addEventListener('input', e => {
      const raw = e.target.value;
      if (/[a-zA-Zа-яА-Я@]/.test(raw)) return; // Telegram-ник оставляем как есть
      let v = raw.replace(/\D/g, '');
      if (!v) { e.target.value = ''; return; }
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1, 4);
      if (v.length >= 4) out += ') ' + v.slice(4, 7);
      if (v.length >= 7) out += '-' + v.slice(7, 9);
      if (v.length >= 9) out += '-' + v.slice(9, 11);
      e.target.value = out;
    });
  });

  /* smooth anchors */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const t = $(href);
    if (!t) return;
    e.preventDefault();
    const top = t.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---- reveal + scroll scenes: one rAF check on scroll ---- */
  const revealEls = $$('[data-reveal]');
  const parents = new Map();
  revealEls.forEach(el => {
    const p = el.parentElement;
    const n = parents.get(p) || 0;
    el.style.setProperty('--d', Math.min(n, 5) * 80 + 'ms');
    parents.set(p, n + 1);
  });

  const countUp = el => {
    const target = parseInt(el.dataset.target, 10);
    if (reduce || Number.isNaN(target)) { el.textContent = target; return; }
    const dur = 1500, t0 = performance.now();
    const from = target > 1000 ? target - 60 : 0;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* struck-out rules: line is drawn while the row crosses the screen */
  const rules = $$('.rule');
  const updateRules = () => {
    const vh = window.innerHeight;
    rules.forEach(r => {
      const rect = r.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.72 - mid) / (vh * 0.22)));
      r.style.setProperty('--p', p.toFixed(3));
      r.classList.toggle('is-done', p > 0.96);
    });
  };

  /* cycle scene */
  const ring = $('#ring');
  const steps = $$('.cycle__step');
  const stageEl = $('.cycle__stage');
  const nowEl = $('#cycleNow');
  const mid = $('#ringMid'), mid2 = $('#ringMid2');
  let shown = -1;
  const MID = ['Замкнутый круг', 'Замкнутый круг', 'Замкнутый круг', 'Замкнутый круг', 'Новый цикл'];
  const updateCycle = () => {
    if (!stageEl || !ring) return;
    const vh = window.innerHeight;
    let best = 0, bd = 1e9;
    steps.forEach((s, i) => {
      const sr = s.getBoundingClientRect();
      const d = Math.abs(sr.top + sr.height / 2 - vh * 0.5);
      if (d < bd) { bd = d; best = i; }
    });
    // before the first step arrives keep stage 0
    const first = steps[0].getBoundingClientRect();
    if (first.top > vh * 0.9) best = 0;
    if (best !== shown) {
      shown = best;
      steps.forEach((s, i) => s.classList.toggle('is-active', i === best));
      ring.setAttribute('data-stage', best);
      nowEl.textContent = steps[best].dataset.label;
      mid.textContent = MID[best];
      mid2.textContent = best === 4 ? 'без наказания' : '';
      const dm = $('#dotMotion');
      if (dm) dm.setAttribute('dur', best === 4 ? '14s' : '6s');
    }
  };
  if (reduce) { $('#dotMotion')?.remove(); }

  let ticking = false;
  const check = () => {
    ticking = false;
    const vh = window.innerHeight;
    header?.classList.toggle('scrolled', window.scrollY > 8);
    revealEls.forEach(el => {
      if (el.classList.contains('is-in')) return;
      if (el.getBoundingClientRect().top < vh * 0.94) {
        el.classList.add('is-in');
        $$('[data-target]', el).forEach(countUp);
      }
    });
    updateRules();
    updateCycle();
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  window.addEventListener('load', req);
  req();
  setTimeout(req, 400);

  /* ---- magnetic button + 3D tilt of labels (mouse only) ---- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px, ${(e.clientY - r.top - r.height / 2) * .25}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    $$('[data-tilt]').forEach(box => {
      const t = $('.tilt', box);
      box.addEventListener('pointermove', e => {
        const r = box.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        t.classList.add('is-live');
        t.style.setProperty('--ry', (x * 22).toFixed(1) + 'deg');
        t.style.setProperty('--rx', (-y * 16).toFixed(1) + 'deg');
      });
      box.addEventListener('pointerleave', () => {
        t.classList.remove('is-live');
        t.style.setProperty('--ry', '0deg');
        t.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ---- live label: ingredients → composition → what to start with ---- */
  const chips = $$('#ingredients input');
  const rec = $('#rec');
  let recTimer;
  const REC = {
    empty: {
      kicker: 'Пока пусто',
      title: 'Отметьте, что узнаёте',
      why: 'Выберите справа всё, что бывает в вашем составе. Если не узнаёте ничего, но хочется разобраться, начните с сессии.',
      sum: '5 000 ₽', note: 'сессия, 50 минут', fmt: 'Сессия, 50 минут, 5 000 ₽'
    },
    hunger: {
      kicker: 'Хорошая новость',
      title: 'Тогда это просто еда',
      why: 'Голод — нормальный сигнал, и поесть, когда голодно, нормально. Если после еды всё равно приходят вина и самокритика, приходите, разберём.',
      sum: '5 000 ₽', note: 'сессия, 50 минут', fmt: 'Сессия, 50 минут, 5 000 ₽'
    },
    few: {
      kicker: 'С чего начать',
      title: 'Сессия, 50 минут',
      why: 'Разберём, из чего складывается ваш круг, и решим, что дальше. Если хочется начать совсем мягко, есть стартовый формат за 1 000 ₽.',
      sum: '5 000 ₽', note: 'за сессию, 50 минут', fmt: 'Сессия, 50 минут, 5 000 ₽'
    },
    many: {
      kicker: 'С чего начать',
      title: 'Три месяца: группа и индивидуальные сессии',
      why: 'Когда причин в составе много, лучше работает регулярная поддержка. Можно сначала прийти на сессию за 5 000 ₽ и решить уже после знакомства.',
      sum: '72 000 ₽', note: '24 000 ₽ в месяц, три месяца', fmt: 'Три месяца: группа и сессии, 72 000 ₽'
    }
  };
  let currentFmt = REC.few.fmt;
  let currentReq = null;
  const REQ_BY_KIND = { rule: 'Жёсткие запреты и диеты по кругу', emo: 'Заедание эмоций', shame: 'Вина и стыд после еды' };

  const renderLive = animate => {
    const on = chips.filter(c => c.checked);
    const count = k => on.filter(c => c.dataset.k === k).length;
    const emo = count('emo'), rule = count('rule'), sit = count('sit');
    const hunger = count('hunger') > 0;
    const n = emo + rule + sit;
    $('#tHunger').textContent = hunger ? 'есть' : 'не обнаружен';
    $('#tEmo').textContent = emo;
    $('#tRule').textContent = rule;
    $('#tSit').textContent = sit;
    $('#tFine').textContent = on.length
      ? 'Состав: ' + on.map(c => c.dataset.s).join(', ') + '.'
      : 'Состав не указан.';
    const key = n === 0 ? (hunger ? 'hunger' : 'empty') : n <= 2 ? 'few' : 'many';
    const r = REC[key];
    currentFmt = r.fmt;
    const shame = on.some(c => c.value === 'shame');
    currentReq = shame ? REQ_BY_KIND.shame : rule ? REQ_BY_KIND.rule : emo ? REQ_BY_KIND.emo : null;
    $('#sostavField').value = on.map(c => c.dataset.s).join('; ');
    const apply = () => {
      $('#recKicker').textContent = r.kicker;
      $('#recTitle').textContent = r.title;
      $('#recWhy').textContent = r.why;
      $('#recSum').textContent = r.sum;
      $('#recNote').textContent = r.note;
      rec.classList.remove('is-swap');
    };
    if (animate && !reduce) {
      rec.classList.add('is-swap');
      clearTimeout(recTimer);
      recTimer = setTimeout(apply, 240);
    } else apply();
  };
  chips.forEach(c => c.addEventListener('change', () => renderLive(true)));
  renderLive(false);

  $('#recGo')?.addEventListener('click', () => {
    const fs = $('#fmtSelect'), rs = $('#reqSelect');
    if (fs) [...fs.options].forEach(o => { if (o.text === currentFmt) fs.value = o.value; });
    if (rs && currentReq) [...rs.options].forEach(o => { if (o.text === currentReq) rs.value = o.value; });
  });

  /* ---- form → Cloudflare Worker → Telegram ---- */
  const form = $('#leadForm');
  const note = $('#formNote');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone) { note.textContent = 'Заполните имя и телефон или Telegram'; return; }
    if (!form.consent.checked) { note.textContent = 'Нужно согласие на обработку данных'; return; }
    delete payload.consent;
    if (!payload.sostav) delete payload.sostav;
    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    note.textContent = '';
    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена';
      note.textContent = 'Спасибо! Кристина свяжется с вами и предложит время.';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Ошибка, попробуйте ещё раз';
      note.textContent = 'Не удалось отправить. Напишите в Telegram: @KristyRyabukha27';
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3500);
    }
  });
})();
