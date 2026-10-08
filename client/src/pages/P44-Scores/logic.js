// client: hand-edited (shell identity from the session, not a hard-coded ZU override)
// Ported verbatim from the Claude Design artboard P44-Scores (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, site:null, screen:null, toast:null }; }

  /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  /* ===== builder-E helpers (sub-admin pages) ===== */
  _base(defSite, active, crumbEn, crumbAr){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const site = this.state.site || this.props.site || defSite;
    const L = (en, a) => ar ? a : en;
    const SN = { employees:['DCT Employees','موظفو الدائرة'], elevate:['Elevate 2026','إرتقاء 2026'], znm:['Zayed National Museum','متحف زايد الوطني'], zu:['ZU 24-Hour Challenge','تحدي جامعة زايد'], museopro:['MuseoPro','ميوزيو برو'], nibras:['Nibras','نبراس'] }[site] || ['Elevate 2026','إرتقاء 2026'];
    const crumbs = active === 'dashboard'
      ? [ { label: L(SN[0], SN[1]), href:'/platforms' }, { label: L(crumbEn, crumbAr) } ]
      : [ { label: L(SN[0], SN[1]), href:'/'+site+'/admin' }, { label: L(crumbEn, crumbAr) } ];
    const sh = this.shell(ar, 'sub_admin', active, site, crumbs);
    /* client: the shell identity comes from the signed-in session in shellHelper (a platform admin
       viewing a microsite admin, e.g. ZU which has no sub admin, shows as "Platform admin · covering …"). */
    const fmt = (n, d) => Number(n).toLocaleString('en-US', d == null ? {} : { minimumFractionDigits:d, maximumFractionDigits:d });
    return { lang, ar, site, L, sh, fmt, siteName: L(SN[0], SN[1]) };
  }
  _common(ar){
    const tt = this.state.toast;
    return {
      dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '',
      enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }),
      hasToast: !!tt, toastText: tt ? (ar ? tt[1] : tt[0]) : '', closeToast: () => this.setState({ toast:null }),
      t0: { close: ar ? 'إغلاق' : 'Close' }
    };
  }
  _toast(en, a){ this.setState({ toast:[en, a] }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast:null }), 5000); }
  _screen(def){ /* specbar / prop driven presets */
    const ps = this.props.screen || def;
    if (this._ps !== ps) { this._ps = ps; Object.assign(this.state, this.preset(ps)); }
    return this.state.screen || ps;
  }
  _go(s){ this.setState({ toast:null, ...this.preset(s), screen:s }); }
  _seg(list, cur, ar){ return list.map(x => ({ label: x[1], cls: x[0] === cur ? 'is-on' : '', pick: () => this._go(x[0]) })); }
  _ltr(s){ return '\u2066' + s + '\u2069'; }
  _isEmail(e){ return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e) && e.length <= 254; }
  _isHttps(u){ return /^https:\/\/[^\s/$.?#][^\s]*\.[^\s]{2,}/i.test(u); }
  /* ===== end builder-E helpers ===== */


  preset(s){
    const base = { agg:'mean', open:{}, flt:'all' };
    if (s === 'median') return { ...base, agg:'median' };
    if (s === 'expanded') return { ...base, open:{ ahmed:true } };
    if (s === 'exported') return { ...base, toast:['scores-zu-R1-2026-10-06.csv downloaded · export recorded in the audit log','تم تنزيل scores-zu-R1-2026-10-06.csv · سُجّل التصدير في سجل التدقيق'] };
    return base;
  }
  renderVals(){
    const scr = this._screen('mean');
    const { lang, ar, site, L, sh, fmt, siteName } = this._base('zu', 'scores', 'Scores', 'الدرجات');
    const st = this.state;
    const t = ar ? {
      spec:'الدرجات', ey: siteName + ' · المسابقة', h1:'الدرجات والترتيب', sub:'درجات كل محكّم لكل معيار، والدرجة النهائية والترتيب. تبقى النتائج مخفية عن المتعلمين حتى إغلاق الجولة.', export:'تصدير CSV',
      roundName:'تحدي 24 ساعة 2026', roundNote:'قيد التحكيم · النتائج مخفية', agg:'الدرجة النهائية', mean:'المتوسط', median:'الوسيط', filter:'تصفية',
      cRank:'الترتيب', cApp:'المشارك', cStatus:'الحالة', cDetails:'التفاصيل', perCrit:'حسب المعيار (من 10)', crit:'المعيار', judgeTotal:'المجموع (من 100)',
      critNote:'يقيّم المحكّمون كل معيار من 10؛ والمجموع من 100 وفق أوزان المعايير المقفلة.', noneT:'لا توجد مشاركات بهذه الحالة', showAll:'عرض الكل',
      privacy:'يتضمن الملف الأسماء والدرجات فقط — دون بريد إلكتروني أو هاتف — ويُسجَّل كل تصدير في سجل التدقيق.'
    } : {
      spec:'Scores', ey: siteName + ' · Competition', h1:'Scores & ranking', sub:'Every judge’s score per criterion, the final score and the rank. Results stay hidden from learners until the round closes.', export:'Export CSV',
      roundName:'24-Hour Challenge 2026', roundNote:'Judging · results hidden', agg:'Final score', mean:'Mean', median:'Median', filter:'Filter',
      cRank:'Rank', cApp:'Applicant', cStatus:'Status', cDetails:'Details', perCrit:'Per criterion (out of 10)', crit:'Criterion', judgeTotal:'Total (out of 100)',
      critNote:'Judges score each criterion out of 10; the total is out of 100 using the locked rubric weights.', noneT:'No submissions with this status', showAll:'Show all',
      privacy:'The export holds names and scores only — no e-mail or phone — and every export is recorded in the audit log.'
    };
    const CR = [ ['Name/tagline captures the essence','الاسم والشعار يعبّران عن جوهر الفكرة',15], ['Short description communicates the key message','الوصف المختصر ينقل الرسالة الأساسية',25], ['Creativity and originality','الإبداع والأصالة',20], ['Will it grab attention and drive participation','هل ستجذب الانتباه وتحفّز المشاركة',40] ];
    const J = [ ['noura','Noura Al Kaabi','نورة الكعبي'], ['daniel','Daniel Osei','دانيال أوسي'] ];
    /* SEED §6: Ahmed scored by Noura 8, 8, 6, 7 → 72.0 (SEED listed 7,8,7,7 which sums to 72.5); Daniel pending; Sara in progress */
    const DATA = [
      { id:'ahmed', en:'Ahmed Khan', ar:'أحمد خان', ini:'AK', c:'#1D1650', status:'submitted', at:L('Submitted 30 Sep 2026','قُدّمت 30 سبتمبر 2026'), j:{ noura:{ total:72.0, per:[8,8,6,7] }, daniel:{ pending:true } } },
      { id:'sara', en:'Sara Haddad', ar:'سارة حداد', ini:'SH', c:'#E35E3C', status:'in_progress', at:L('Draft · C13 at 75 %','مسودة · C13 عند 75 %'), j:{ noura:{ notSub:true }, daniel:{ none:true } } }
    ];
    const agg = st.agg;
    const median = (a) => { const s = a.slice().sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
    const calc = (d) => { const tots = J.map(j => d.j[j[0]]).filter(x => x && x.total != null).map(x => x.total); if (!tots.length) return null; return { v: agg === 'mean' ? tots.reduce((a, b) => a + b, 0) / tots.length : median(tots), n:tots.length, of: J.filter(j => d.j[j[0]] && !d.j[j[0]].none && !d.j[j[0]].notSub).length }; };
    const ranked = DATA.map(d => ({ d, f:calc(d) })).filter(x => x.f).sort((a, b) => b.f.v - a.f.v);
    const rankOf = (id) => { const i = ranked.findIndex(x => x.d.id === id); return i < 0 ? null : i + 1; };
    const flt = st.flt;
    const show = DATA.filter(d => flt === 'all' || (flt === 'scored' && calc(d)) || (flt === 'waiting' && !calc(d)));
    const rows = show.map(d => { const f = calc(d), rk = rankOf(d.id), open = !!st.open[d.id]; return {
      rank: rk ? fmt(rk) : '—', rkCls: rk ? '' : 'none', name:L(d.en, d.ar), ini:d.ini, c:d.c, when:d.at,
      st: d.status === 'submitted' ? (f && f.n < f.of ? L('Partly scored','مُقيّمة جزئياً') : L('Scored','مُقيّمة')) : L('In progress','قيد الإعداد'), stCls: d.status === 'submitted' ? 'warn' : 'mut',
      js: J.map(j => { const x = d.j[j[0]]; if (x.total != null) return { has:true, no:false, v:fmt(x.total, 1), sub:L('scored 2 Oct','قُيّمت 2 أكتوبر'), cls:'' };
        if (x.pending) return { has:false, no:true, v:L('Pending','معلّق'), cls:'warn', sub:L('invite not accepted','الدعوة لم تُقبل') };
        if (x.notSub) return { has:false, no:true, v:L('Assigned','معيّن'), cls:'info', sub:L('nothing to score yet','لا شيء للتقييم بعد') };
        return { has:false, no:true, v:L('Not assigned','غير معيّن'), cls:'mut', sub:'' }; }),
      final: f ? fmt(f.v, 1) : '—', finalNote: f ? (f.n < f.of ? L('provisional · ' + f.n + ' of ' + f.of + ' judges', 'مؤقتة · ' + f.n + ' من ' + f.of + ' محكّمين') : L('final','نهائية')) : L('not submitted · not ranked','لم تُقدّم · بلا ترتيب'),
      canX: !!f, ex: open ? 'true' : 'false', open, did:'dt-' + d.id, xAria: L((open ? 'Hide' : 'Show') + ' criterion scores for ' + d.en, (open ? 'إخفاء' : 'عرض') + ' درجات المعايير لـ ' + d.ar),
      tog: () => this.setState({ open:{ ...this.state.open, [d.id]:!open } }),
      crit: CR.map((c, i) => ({ q:L(c[0], c[1]), w:c[2] + ' %', s: J.map(j => { const x = d.j[j[0]]; return x.per ? this._ltr(fmt(x.per[i]) + ' / 10') : '—'; }) })),
      totals: J.map(j => { const x = d.j[j[0]]; return x.total != null ? fmt(x.total, 1) : '—'; })
    }; });
    const chips = [['all',L('All','الكل')],['scored',L('Scored','مُقيّمة')],['waiting',L('Not scored yet','لم تُقيّم بعد')]].map(c => ({ label:c[1], cls: flt === c[0] ? 'on' : '', pr: flt === c[0] ? 'true' : 'false', pick: () => this.setState({ flt:c[0] }) }));
    const KI = { file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15l2 2 4-4', chart:'M3 3v18h18M7 15v2M11 11v6M15 7v10M19 13v4', trophy:'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3' };
    const top = ranked[0];
    const kpis = [
      { l:L('Submissions','المشاركات'), v:fmt(1), n:L('1 more in progress','1 أخرى قيد الإعداد'), cls:'k-ink', d:KI.file },
      { l:L('Scores received','التقييمات المستلمة'), v:this._ltr(fmt(1) + ' / ' + fmt(3)), n:L('Daniel Osei pending','دانيال أوسي معلّق'), cls:'k-rasp', d:KI.chart },
      { l:L('Leading score','أعلى درجة'), v: top ? fmt(top.f.v, 1) : '—', n: top ? L(top.d.en + ' · provisional', top.d.ar + ' · مؤقتة') : '', cls:'k-yel', d:KI.trophy }
    ];
    const exportCsv = () => {
      const lines = [['rank','applicant','status','judge','criterion','weight_pct','score_out_of_10','judge_total','final_score','aggregation']];
      DATA.forEach(d => { const f = calc(d), rk = rankOf(d.id); J.forEach(j => { const x = d.j[j[0]]; CR.forEach((c, i) => lines.push([rk || '', d.en, d.status, j[1], c[0], c[2], x.per ? x.per[i] : '', x.total != null ? x.total.toFixed(1) : '', f ? f.v.toFixed(1) : '', agg])); }); });
      const csv = lines.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
      try { const u = URL.createObjectURL(new Blob(['﻿' + csv], { type:'text/csv' })); const a = document.createElement('a'); a.href = u; a.download = 'scores-zu-R1-2026-10-06.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) {}
      this._toast('scores-zu-R1-2026-10-06.csv downloaded · export recorded in the audit log', 'تم تنزيل scores-zu-R1-2026-10-06.csv · سُجّل التصدير في سجل التدقيق');
    };
    const SCR = [['mean','Mean'],['median','Median'],['expanded','Expanded'],['exported','Exported']];
    return {
      lang, t, sh, ...this._common(ar), route:'/' + site + '/admin/scores', scrBtns:this._seg(SCR, scr, ar),
      kpis, rows, noRows: rows.length === 0, chips, clearF: () => this.setState({ flt:'all' }), jcols: J.map(j => L(j[1], j[2])), ncols:'7',
      meanCls: agg === 'mean' ? 'is-on' : '', medCls: agg === 'median' ? 'is-on' : '', meanPr: agg === 'mean' ? 'true' : 'false', medPr: agg === 'median' ? 'true' : 'false',
      setMean: () => this.setState({ agg:'mean' }), setMedian: () => this.setState({ agg:'median' }),
      finalHead: agg === 'mean' ? L('Final · mean','النهائية · المتوسط') : L('Final · median','النهائية · الوسيط'),
      aggNote: agg === 'mean' ? L('Average of the judges’ totals. With one score in, mean and median match.','متوسط مجاميع المحكّمين. مع تقييم واحد يتساوى المتوسط والوسيط.') : L('Middle value of the judges’ totals — less sensitive to one outlier judge.','القيمة الوسطى لمجاميع المحكّمين — أقل تأثراً بمحكّم متطرف.'),
      exportCsv
    };
  }
}
