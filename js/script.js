/**
 * ═══════════════════════════════════════════════════════════════
 * AMILTON CONTABILIDADE — SCRIPTS v3.0
 * Calculadora tributária + utilidades do site
 * ═══════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', function () {

  /* ── AOS ── */
  if (window.AOS) {
    AOS.init({ once: true, offset: 80, duration: 700, easing: 'ease-out-cubic' });
  }

  /* ── Navbar scrolled ── */
  const nav = document.getElementById('mainNav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Scroll Top ── */
  const btnTop = document.getElementById('btnScrollTop');
  if (btnTop) {
    window.addEventListener('scroll', () => {
      btnTop.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });
    btnTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── Contadores animados ── */
  const counters = document.querySelectorAll('[data-target]');

  const animateCounter = (el) => {
    const target = +el.getAttribute('data-target');
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = prefix + Math.floor(current) + suffix;

      if (current >= target) clearInterval(timer);
    }, 16);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); }
    });
  }, { threshold: 0.4 });

  counters.forEach(c => counterObserver.observe(c));

  /* ── Smooth scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = document.getElementById('mainNav')?.offsetHeight || 0;
      window.scrollTo({ top: target.offsetTop - navH - 8, behavior: 'smooth' });
      const collapse = document.getElementById('navbarNav');
      if (collapse?.classList.contains('show')) {
        bootstrap.Collapse.getInstance(collapse)?.hide();
      }
    });
  });

  /* ── Active nav link ── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 120;
    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
        navLinks.forEach(l => {
          l.classList.remove('active');
          if (l.getAttribute('href') === '#' + sec.id) l.classList.add('active');
        });
      }
    });
  }, { passive: true });


  /* ═══════════════════════════════════════════════════════════════
     CALCULADORA DE REGIMES TRIBUTÁRIOS v2
     Alíquotas progressivas reais (LC 123/2006 — 2024)
  ═══════════════════════════════════════════════════════════════ */

  const form            = document.getElementById('tax-comparator-form');
  if (!form) return;

  const resultHolder    = document.getElementById('result-placeholder');
  const resultContainer = document.getElementById('result-container');
  const tableBody       = document.getElementById('comparison-table-body');
  const bestName        = document.getElementById('best-regime-name');
  const bestReason      = document.getElementById('best-regime-reason');
  const savingsText     = document.getElementById('savings-text');
  const savingsYearly   = document.getElementById('savings-yearly');
  const whatsappCta     = document.getElementById('whatsapp-cta');
  const submitBtn       = form.querySelector('.btn-calc');
  const btnText         = submitBtn?.querySelector('.btn-text');
  const spinner         = submitBtn?.querySelector('.spinner-border');
  const simplesAlert    = document.getElementById('simples-alert');
  const eligNotes       = document.getElementById('eligibility-notes');
  const revenueInput    = document.getElementById('revenue');

  // Máscara de moeda
  revenueInput?.addEventListener('input', function () {
    let raw = this.value.replace(/\D/g, '');
    if (!raw) { this.value = ''; return; }
    this.value = parseInt(raw, 10).toLocaleString('pt-BR');
  });

  // Alerta em tempo real de elegibilidade
  revenueInput?.addEventListener('input', function () {
    const val = parseRevenue(this.value);
    if (simplesAlert) {
      simplesAlert.style.display = val > 400000 ? 'flex' : 'none';
    }
  });

  // Submit
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const revenue      = parseRevenue(revenueInput?.value || '0');
    const activity     = document.getElementById('activity')?.value || '';
    const employees    = document.getElementById('employees')?.value || 'nao';
    const profitMargin = parseFloat(document.getElementById('profit-margin')?.value) || 20;

    if (!activity) { alert('Selecione o tipo de atividade.'); return; }
    if (isNaN(revenue) || revenue <= 0) { alert('Informe um faturamento válido.'); return; }

    // Loading
    if (btnText) btnText.classList.add('d-none');
    if (spinner) spinner.classList.remove('d-none');
    if (submitBtn) submitBtn.disabled = true;

    setTimeout(() => {
      runCalc(revenue, activity, employees, profitMargin);
      if (resultHolder) resultHolder.classList.add('d-none');
      if (resultContainer) {
        resultContainer.classList.remove('d-none');
        resultContainer.classList.add('animate-in');
      }
      if (btnText) btnText.classList.remove('d-none');
      if (spinner) spinner.classList.add('d-none');
      if (submitBtn) submitBtn.disabled = false;
      if (window.innerWidth < 992) {
        resultContainer?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 750);
  });

  /* ── Cálculo principal ── */
  function runCalc(revenue, activity, employees, profitMarginPct) {
    const annual = revenue * 12;
    const simplesEligible = annual <= 4800000;
    const lpEligible = annual <= 78000000;

    let simplesRate = 0, simplesTotalTax = 0, simplesNote = '';
    if (simplesEligible) {
      const s = calcSimples(annual, activity, employees);
      simplesRate = s.effectiveRate;
      simplesTotalTax = revenue * simplesRate;
      simplesNote = s.note;
    }

    const lp = calcLP(revenue, activity);
    const lr = calcLR(revenue, activity, profitMarginPct / 100);

    const regimes = [
      { id: 'simples', name: 'Simples Nacional', tax: simplesTotalTax, rate: simplesRate, eligible: simplesEligible, note: simplesEligible ? simplesNote : 'Faturamento acima de R$ 4,8M/ano.' },
      { id: 'presumido', name: 'Lucro Presumido', tax: lp.totalTax, rate: lp.rate, eligible: lpEligible, note: lp.note },
      { id: 'real', name: 'Lucro Real', tax: lr.totalTax, rate: lr.rate, eligible: true, note: lr.note },
    ];

    const eligible   = regimes.filter(r => r.eligible).sort((a, b) => a.tax - b.tax);
    const ineligible = regimes.filter(r => !r.eligible);
    const sorted     = [...eligible, ...ineligible];
    const best       = sorted[0];

    renderTable(sorted, best);
    renderHeader(best);
    renderSavings(eligible);
    renderEligNotes(sorted);
    updateWA(best, revenue, activity);
  }

  /* ── Simples Nacional — tabelas progressivas 2024 ── */
  const SIMPLES = {
    I:  [{max:180000,rate:.04,pd:0},{max:360000,rate:.073,pd:5940},{max:720000,rate:.095,pd:13860},{max:1800000,rate:.107,pd:22500},{max:3600000,rate:.143,pd:87300},{max:4800000,rate:.19,pd:378000}],
    II: [{max:180000,rate:.045,pd:0},{max:360000,rate:.078,pd:5940},{max:720000,rate:.10,pd:13860},{max:1800000,rate:.112,pd:22500},{max:3600000,rate:.147,pd:85500},{max:4800000,rate:.30,pd:720000}],
    III:[{max:180000,rate:.06,pd:0},{max:360000,rate:.112,pd:9360},{max:720000,rate:.135,pd:17640},{max:1800000,rate:.16,pd:35640},{max:3600000,rate:.21,pd:125640},{max:4800000,rate:.33,pd:648000}],
    V:  [{max:180000,rate:.155,pd:0},{max:360000,rate:.18,pd:4500},{max:720000,rate:.195,pd:9900},{max:1800000,rate:.205,pd:17100},{max:3600000,rate:.23,pd:62100},{max:4800000,rate:.305,pd:540000}],
  };
  const ANNEX_LABEL = { I:'Comércio – Anexo I', II:'Indústria – Anexo II', III:'Serviços – Anexo III (menor carga)', V:'Serviços – Anexo V (maior carga)' };

  function getAnnex(activity, employees) {
    if (activity === 'comercio') return 'I';
    if (activity === 'industria') return 'II';
    if (activity === 'servicos_simples') return 'III';
    if (activity === 'servicos_alta') return 'V';
    if (activity === 'servicos_fator_r') return employees === 'alta' ? 'III' : 'V';
    return 'III';
  }

  function calcSimples(annual, activity, employees) {
    const annex = getAnnex(activity, employees);
    const table = SIMPLES[annex];
    let faixa = table[table.length - 1];
    for (const f of table) { if (annual <= f.max) { faixa = f; break; } }
    const effectiveRate = Math.max((annual * faixa.rate - faixa.pd) / annual, 0);
    return { effectiveRate, note: ANNEX_LABEL[annex] };
  }

  /* ── Lucro Presumido ── */
  function calcLP(revenue, activity) {
    const isServ = activity.startsWith('servicos');
    const presumIRPJ = isServ ? 0.32 : 0.08;
    const presumCSLL = isServ ? 0.32 : 0.12;
    const irpj = revenue * presumIRPJ * 0.15;
    const csll = revenue * presumCSLL * 0.09;
    const pisCofins = revenue * 0.0365;
    const iss = isServ ? revenue * 0.03 : 0;
    const total = irpj + csll + pisCofins + iss;
    return {
      totalTax: total,
      rate: total / revenue,
      note: `Presunção ${(presumIRPJ*100).toFixed(0)}% p/ IRPJ + CSLL + PIS/COFINS${isServ ? ' + ISS 3%' : ''}`
    };
  }

  /* ── Lucro Real ── */
  function calcLR(revenue, activity, profitMargin) {
    const isServ = activity.startsWith('servicos');
    const profit = revenue * profitMargin;
    const irpj = profit * 0.15 + Math.max(0, profit - 20000) * 0.10;
    const csll = profit * 0.09;
    const creditRate = isServ ? 0.40 : 0.60;
    const pisCofins = revenue * 0.0925 * (1 - creditRate);
    const iss = isServ ? revenue * 0.03 : 0;
    const total = irpj + csll + pisCofins + iss;
    return {
      totalTax: Math.max(total, 0),
      rate: Math.max(total / revenue, 0),
      note: `IRPJ+Adicional + CSLL sobre lucro real (${(profitMargin*100).toFixed(0)}%) + PIS/COFINS não-cumulativo${isServ ? ' + ISS' : ''}`
    };
  }

  /* ── Renderização ── */
  function renderTable(sorted, best) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const maxTax = Math.max(...sorted.filter(r => r.eligible).map(r => r.tax), 1);

    sorted.forEach((r, i) => {
      const isBest = r.id === best.id && r.eligible;
      const barPct = Math.round((r.tax / maxTax) * 100);
      const barColor = isBest ? 'var(--g-400)' : i === 1 ? 'var(--a-400)' : 'var(--r-400)';
      const tr = document.createElement('tr');
      tr.className = `regime-row${isBest ? ' best' : ''}${!r.eligible ? ' not-eligible' : ''}`;
      tr.innerHTML = `
        <td style="min-width:140px">
          <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap">
            <span>${r.name}</span>
            ${isBest ? `<span class="badge" style="background:var(--p-600)">MELHOR</span>` : ''}
            ${!r.eligible ? `<span class="badge" style="background:rgba(248,113,113,.15);color:var(--r-400)">INELEGÍVEL</span>` : ''}
          </div>
          ${r.eligible ? `<div class="tax-bar-wrap"><div class="tax-bar-fill" style="width:${barPct}%;background:${barColor}"></div></div>` : ''}
        </td>
        <td class="text-end text-secondary" style="white-space:nowrap">${r.eligible ? (r.rate*100).toFixed(2)+'%' : '—'}</td>
        <td class="text-end fw-bold${isBest ? ' text-success' : ''}" style="white-space:nowrap">${r.eligible ? 'R$ '+fmt(r.tax) : '—'}</td>`;
      tableBody.appendChild(tr);
    });
  }

  function renderHeader(best) {
    if (bestName) bestName.textContent = best.name;
    if (!bestReason) return;
    const reasons = {
      simples: 'Regime simplificado com uma guia única (DAS). Menor burocracia e carga para o seu perfil.',
      presumido: 'Para o seu faturamento e atividade, a presunção de lucro resulta em carga menor.',
      real: 'Com a margem informada, tributar o lucro efetivo gera economia real — especialmente com despesas dedutíveis.',
    };
    bestReason.textContent = reasons[best.id] || '';
  }

  function renderSavings(eligible) {
    if (eligible.length < 2) {
      if (savingsText) savingsText.innerHTML = 'Apenas um regime elegível para o seu perfil.';
      if (savingsYearly) savingsYearly.textContent = '';
      return;
    }
    const diff   = eligible[1].tax - eligible[0].tax;
    const yearly = diff * 12;
    if (savingsText) savingsText.innerHTML = `No regime ideal, você pode economizar até <strong style="color:var(--g-400)">R$ ${fmt(diff)}</strong>/mês.`;
    if (savingsYearly) savingsYearly.textContent = `Equivalente a R$ ${fmt(yearly)} ao ano — capital que pode ser reinvestido no negócio.`;
  }

  function renderEligNotes(sorted) {
    if (!eligNotes) return;
    const ineligible = sorted.filter(r => !r.eligible);
    if (!ineligible.length) { eligNotes.style.display = 'none'; eligNotes.innerHTML = ''; return; }
    eligNotes.style.display = 'block';
    eligNotes.innerHTML = ineligible.map(r => `
      <div style="display:flex;align-items:flex-start;gap:.4rem;font-size:var(--text-xs);color:var(--a-400);margin-bottom:.35rem">
        <i class="bi bi-exclamation-circle-fill" style="flex-shrink:0;margin-top:2px"></i>
        <span><strong>${r.name}</strong>: ${r.note}</span>
      </div>`).join('');
  }

  function updateWA(best, revenue, activity) {
    if (!whatsappCta) return;
    const acts = { comercio:'Comércio', industria:'Indústria', servicos_simples:'Serviços (Anexo III)', servicos_fator_r:'Serviços (Fator R)', servicos_alta:'Serviços (Anexo V)' };
    const msg = encodeURIComponent(
      `Olá! Fiz a simulação no site da Amilton Contabilidade.\n\n` +
      `📊 Faturamento mensal: R$ ${fmt(revenue)}\n` +
      `🏢 Atividade: ${acts[activity] || activity}\n` +
      `✅ Regime recomendado: ${best.name}\n` +
      `💰 Imposto estimado: R$ ${fmt(best.tax)}/mês\n\n` +
      `Gostaria de validar esses dados e fazer o planejamento tributário.`
    );
    whatsappCta.href = `https://wa.me/5547991597258?text=${msg}`;
  }

  /* ── Helpers ── */
  function parseRevenue(val) {
    return parseFloat(String(val).replace(/\./g,'').replace(',','.').replace(/[^\d.]/g,''));
  }

  function fmt(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

});