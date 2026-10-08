// Ported verbatim from the Claude Design artboard P43-Rubrics (DCLogic class).
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
    if (site === 'zu') { /* SEED §1/§4.1: ZU has no sub admin — platform admin Aisha covers it */
      sh.userSub = L('Platform admin · covering ZU','مسؤولة المنصة · تغطي جامعة زايد'); sh.roleLabel = L('Admin','مسؤولة'); sh.profileHref = '/admin';
    }
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


  seedCrit(){
    return [ { id:'c1', en:'Name/tagline captures the essence', ar:'الاسم والشعار يعبّران عن جوهر الفكرة', w:'15' }, { id:'c2', en:'Short description communicates the key message', ar:'الوصف المختصر ينقل الرسالة الأساسية', w:'25' }, { id:'c3', en:'Creativity and originality', ar:'الإبداع والأصالة', w:'20' }, { id:'c4', en:'Will it grab attention and drive participation', ar:'هل ستجذب الانتباه وتحفّز المشاركة', w:'40' } ];
  }
  preset(s){
    const base = { crit:this.seedCrit(), saveErr:false, tried:false };
    if (s === 'invalid') { const c = this.seedCrit(); c[3].w = '35'; return { ...base, crit:c, tried:true, saveErr:true }; }
    return base;
  }
  renderVals(){
    const scr = this._screen('locked');
    const { lang, ar, site, L, sh, fmt, siteName } = this._base('zu', 'rubrics', 'Rubrics', 'معايير التقييم');
    const st = this.state;
    const locked = scr === 'locked';
    const t = ar ? {
      spec:'معايير التقييم', ey: siteName + ' · المسابقة', h1:'معايير التقييم', sub:'معايير موزونة يقيّم بها المحكّمون كل مشاركة. يجب أن يكون مجموع الأوزان 100 %.', toRounds:'الجولات',
      lockT:'المعايير مقفلة — بدأ التقييم', lockB:'قيّمت نورة الكعبي أول مشاركة في 2 أكتوبر 2026، لذا لا يمكن تغيير المعايير والأوزان في هذه الجولة. لاستخدام معايير مختلفة أنشئ جولة جديدة.',
      saveErrT:'لم تُحفظ المعايير (422)', roundName:'تحدي 24 ساعة 2026', judging:'قيد التحكيم', total:'المجموع', qLbl:'المعيار', weight:'الوزن', add:'إضافة معيار', reset:'إعادة الضبط', save:'حفظ المعايير',
      rulesT:'القواعد', rules:['الأوزان أعداد صحيحة من 1 إلى 100 ومجموعها 100 % بالضبط.','لكل معيار سؤال بالإنجليزية والعربية؛ يرى المحكّم لغته.','لا يمكن فتح الجولة قبل أن تساوي المعايير 100 %.','تُقفل المعايير عند أول تقييم ولا تتغير بعدها.'],
      stT:'حالة التقييم', toScores:'عرض الدرجات'
    } : {
      spec:'Rubrics', ey: siteName + ' · Competition', h1:'Rubrics', sub:'Weighted criteria judges use to score every submission. Weights must add up to 100 %.', toRounds:'Rounds',
      lockT:'Rubric locked — scoring has started', lockB:'Noura Al Kaabi scored the first submission on 2 Oct 2026, so criteria and weights can’t change for this round. Create a new round to use a different rubric.',
      saveErrT:'Rubric not saved (422)', roundName:'24-Hour Challenge 2026', judging:'Judging', total:'Total', qLbl:'Criterion', weight:'Weight', add:'Add criterion', reset:'Reset', save:'Save rubric',
      rulesT:'Rules', rules:['Weights are whole numbers from 1 to 100 and add up to exactly 100 %.','Each criterion has an English and an Arabic question; judges see their language.','A round can’t open until its rubric totals 100 %.','The rubric locks at the first score and never changes after that.'],
      stT:'Scoring status', toScores:'View scores'
    };
    const COL = ['#1D1650','#CD3151','#E35E3C','#F7C337','#3B2F92','#D63539','#2FC4DB','#6D7782','#F77860','#15801A'];
    const crit = st.crit;
    const num = (v) => { const n = Number(v); return v === '' || isNaN(n) ? 0 : n; };
    const total = crit.reduce((a, c) => a + num(c.w), 0);
    const ok = total === 100;
    const rowErr = (c) => ({ q: (!c.en.trim() || !c.ar.trim()) ? L('Enter the question in English and Arabic.','أدخل السؤال بالإنجليزية والعربية.') : (c.en.length > 240 || c.ar.length > 240) ? L('Keep questions under 240 characters.','اجعل الأسئلة أقل من 240 حرفاً.') : '', w: (c.w === '' || isNaN(Number(c.w)) || Number(c.w) < 1 || Number(c.w) > 100 || Math.round(Number(c.w)) !== Number(c.w)) ? L('1–100, whole number','عدد صحيح 1–100') : '' });
    const setC = (i, patch) => this.setState({ crit: this.state.crit.map((c, k) => k === i ? { ...c, ...patch } : c), saveErr:false });
    const move = (i, d) => { const a = this.state.crit.slice(); const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; this.setState({ crit:a }); };
    const rows = crit.map((c, i) => { const e = st.tried ? rowErr(c) : { q:'', w:'' }; return {
      n:fmt(i + 1), c:COL[i % COL.length], qEn:c.en, qAr:c.ar, qMain: ar ? c.ar : c.en, qAlt: ar ? c.en : c.ar, altDir: ar ? 'ltr' : 'rtl', w:c.w, wT:fmt(num(c.w)) + ' %', wP: Math.min(100, num(c.w)) + '%', wid:'w-' + c.id,
      first: i === 0, last: i === crit.length - 1, up: () => move(i, -1), down: () => move(i, 1), upAria:L('Move criterion ' + (i + 1) + ' up','نقل المعيار ' + (i + 1) + ' لأعلى'), downAria:L('Move criterion ' + (i + 1) + ' down','نقل المعيار ' + (i + 1) + ' لأسفل'),
      onEn: (e2) => setC(i, { en:e2.target.value }), onAr: (e2) => setC(i, { ar:e2.target.value }), onW: (e2) => setC(i, { w:e2.target.value }),
      anyErr: !!(e.q || e.w), errText: [e.q, e.w ? L('Weight: ','الوزن: ') + e.w : ''].filter(Boolean).join(' · '), qErr:e.q, wErr:e.w, enEc: e.q && !c.en.trim() ? 'is-error' : '', arEc: e.q && !c.ar.trim() ? 'is-error' : '', wEc: e.w ? 'is-error' : '',
      rmAria:L('Remove criterion ' + (i + 1),'إزالة المعيار ' + (i + 1)), remove: () => { if (this.state.crit.length <= 1) return this._toast('A rubric needs at least one criterion.','تحتاج المعايير إلى معيار واحد على الأقل.'); this.setState({ crit: this.state.crit.filter((x, k) => k !== i) }); this._toast('Criterion removed — remember to rebalance the weights.','أُزيل المعيار — لا تنس إعادة توزيع الأوزان.'); }
    }; });
    const segs = crit.map((c, i) => ({ w: (total > 100 ? num(c.w) / total * 100 : num(c.w)) + '%', c:COL[i % COL.length], label: fmt(i + 1) + ' · ' + fmt(num(c.w)) + ' %' }));
    const diff = 100 - total;
    const totMsg = ok ? L('Weights add up to 100 %.','مجموع الأوزان 100 %.') : diff > 0 ? L(diff + ' % still to assign — weights must total 100 %.', 'ما زال ' + diff + ' % بلا توزيع — يجب أن يكون المجموع 100 %.') : L((-diff) + ' % over — weights must total 100 %.', 'زيادة ' + (-diff) + ' % — يجب أن يكون المجموع 100 %.');
    const save = () => {
      const anyRow = crit.some(c => { const e = rowErr(c); return e.q || e.w; });
      if (!ok || anyRow) return this.setState({ tried:true, saveErr:true });
      this.setState({ tried:false, saveErr:false }); this._toast('Rubric saved · recorded in the audit log','حُفظت المعايير · سُجّلت في سجل التدقيق');
    };
    const saveErrText = st.saveErr ? (!ok ? L('The weights total ' + total + ' %. Change them so they add up to exactly 100 %, then save again.', 'مجموع الأوزان ' + total + ' %. عدّلها لتساوي 100 % بالضبط ثم احفظ مجدداً.') : L('Some criteria are incomplete. Fix the highlighted fields.','بعض المعايير غير مكتملة. صحّح الحقول المحددة.')) : '';
    const SCR = [['locked','Locked (scoring started)'],['edit','Editable'],['invalid','Total ≠ 100']];
    return {
      lang, t, sh, ...this._common(ar), route:'/' + site + '/admin/rubrics', scrBtns:this._seg(SCR, scr, ar),
      rsTag: locked ? t.judging : L('Before scoring','قبل التقييم'), rsCls: locked ? 'warn' : 'mut',
      splitCls: locked ? '' : 'one', locked, editing: !locked, rows, segs, totText: fmt(total) + ' %', totCls: ok ? 'ok' : 'bad', totMsg: locked ? L('Locked at 100 %.','مقفلة عند 100 %.') : totMsg, totMsgCls: ok || locked ? 'ok-msg' : 'err',
      lockTag: locked ? L('Locked','مقفلة') : L('Editable','قابلة للتعديل'), lockTagCls: locked ? 'mut' : 'ok',
      saveErr: saveErrText, save, reset: () => this.setState({ crit:this.seedCrit(), tried:false, saveErr:false }),
      addRow: () => { if (crit.length >= 10) return this._toast('Up to 10 criteria per rubric.','حتى 10 معايير لكل جولة.'); this.setState({ crit:[ ...crit, { id:'n' + Date.now(), en:'', ar:'', w:'0' } ] }); },
      scTag: locked ? L('Scoring started','بدأ التقييم') : L('Not started','لم يبدأ'), scTagCls: locked ? 'warn' : 'mut', scNote: locked ? L('1 of 3 assigned scores in','1 من 3 تقييمات مستلمة') : L('Judges can score once the round is in judging.','يبدأ المحكّمون التقييم عند انتقال الجولة إلى التحكيم.')
    };
  }
}
