// Ported verbatim from the Claude Design artboard P41-Rounds (DCLogic class).
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


  seedRounds(){
    return [ { id:'r1', code:'R1', nEn:'24-Hour Challenge 2026', nAr:'تحدي 24 ساعة 2026', dEn:'Complete “24 Hour Challenge – Introduction to Cultural Heritage”, then pitch an idea that brings heritage to a new audience.', dAr:'أكمل دورة «تحدي 24 ساعة – مقدمة في التراث الثقافي» ثم قدّم فكرة تقرّب التراث من جمهور جديد.', status:'judging', opens:'2026-09-15', closes:'2026-10-20', course:'C13', elig:80, rubric:100, sub:1, inprog:1, judges:2, scored:1, assigned:3 } ];
  }
  preset(s){
    const base = { rounds:this.seedRounds(), dlg:null, form:null, fErr:false, cf:null, errs:{} };
    if (s === 'create') return { ...base, dlg:'form', form:{ mode:'create', nEn:'', nAr:'', dEn:'', dAr:'', opens:'', closes:'', course:'C13', elig:'80', copy:true } };
    if (s === 'edit') { const r = base.rounds[0]; return { ...base, dlg:'form', form:{ mode:'edit', id:r.id, nEn:r.nEn, nAr:r.nAr, dEn:r.dEn, dAr:r.dAr, opens:r.opens, closes:r.closes, course:r.course, elig:String(r.elig) } }; }
    if (s === 'conflict') {
      const rr = [ ...base.rounds,
        { id:'r2', code:'R2', nEn:'24-Hour Challenge – Practice round', nAr:'تحدي 24 ساعة – جولة تجريبية', dEn:'A short warm-up round so new students can try the action plan before the spring edition.', dAr:'جولة تمهيدية قصيرة ليجرب الطلاب الجدد خطة العمل قبل نسخة الربيع.', status:'open', opens:'2026-10-06', closes:'2026-10-13', course:'C13', elig:80, rubric:100, sub:0, inprog:0, judges:0, scored:0, assigned:0 },
        { id:'r3', code:'R3', nEn:'24-Hour Challenge – Spring 2027', nAr:'تحدي 24 ساعة – ربيع 2027', dEn:'Spring edition for the 2027 intake.', dAr:'نسخة الربيع لدفعة 2027.', status:'draft', opens:'2027-02-01', closes:'2027-02-28', course:'C13', elig:80, rubric:100, sub:0, inprog:0, judges:0, scored:0, assigned:0 } ];
      return { ...base, rounds:rr, errs:{ r3:'conflict' } };
    }
    if (s === 'closeConfirm') return { ...base, dlg:'confirm', cf:{ id:'r1', to:'closed' } };
    if (s === 'closed') return { ...base, rounds: base.rounds.map(r => ({ ...r, status:'closed' })) };
    return base;
  }
  renderVals(){
    const scr = this._screen('list');
    const { lang, ar, site, L, sh, fmt, siteName } = this._base('zu', 'rounds', 'Rounds', 'الجولات');
    const st = this.state;
    const MON = ar ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const D = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MON[m-1] + ' ' + y; };
    const t = ar ? {
      spec:'الجولات', ey: siteName + ' · المسابقة', h1:'الجولات', sub:'أنشئ جولات المسابقة وانقلها من مسودة إلى مفتوحة ثم التحكيم ثم الإغلاق.', newRound:'جولة جديدة',
      r1:'جولة مفتوحة واحدة', r1b:'في كل مرة لكل موقع.', r2:'المعايير = 100 %', r2b:'قبل فتح الجولة.', r3:'الأهلية', r3b:'نسبة التقدم الدنيا في الدورة للتقديم.',
      flowAria:'مراحل الجولة', fOpens:'تاريخ الفتح', fCloses:'آخر موعد للتقديم', fCourse:'الدورة', fRubric:'المعايير', fSubs:'المشاركات', fJudges:'المحكّمون', fScored:'التقييمات', fResults:'النتائج',
      aOpen:'فتح الجولة', aJudge:'إغلاق التقديم وبدء التحكيم', aClose:'إغلاق الجولة ونشر النتائج', aResults:'عرض النتائج', aEdit:'تعديل', aDelete:'حذف المسودة', toScores:'الدرجات',
      name:'اسم الجولة', desc:'الوصف', tzHint:'تُغلق عند 23:59 بتوقيت الخليج.', c13:'C13 · تحدي 24 ساعة – مقدمة في التراث الثقافي', courseHint:'دورات هذا الموقع فقط.', eligL:'الحد الأدنى للتقدم (%)', eligHint:'الافتراضي 80 %.', copyRubric:'انسخ المعايير من R1 (4 معايير · 100 %)', cancel:'إلغاء',
      lockedNote:'الجولة في مرحلة التحكيم: لا يمكن تغيير التواريخ والدورة والأهلية. يمكنك تعديل الاسم والوصف.', auditNote:'يُسجَّل هذا التغيير في سجل التدقيق.'
    } : {
      spec:'Rounds', ey: siteName + ' · Competition', h1:'Rounds', sub:'Create competition rounds and move them from draft to open, judging and closed.', newRound:'New round',
      r1:'One open round', r1b:'at a time per microsite.', r2:'Rubric = 100 %', r2b:'before a round can open.', r3:'Eligibility', r3b:'minimum course progress to submit.',
      flowAria:'Round stages', fOpens:'Opens', fCloses:'Submission deadline', fCourse:'Course', fRubric:'Rubric', fSubs:'Submissions', fJudges:'Judges', fScored:'Scores', fResults:'Results',
      aOpen:'Open round', aJudge:'Close submissions and start judging', aClose:'Close round and publish results', aResults:'View results', aEdit:'Edit', aDelete:'Delete draft', toScores:'Scores',
      name:'Round name', desc:'Description', tzHint:'Closes at 23:59 Gulf time.', c13:'C13 · 24 Hour Challenge – Introduction to Cultural Heritage', courseHint:'Only this microsite’s courses.', eligL:'Minimum progress (%)', eligHint:'Default 80 %.', copyRubric:'Copy the rubric from R1 (4 criteria · 100 %)', cancel:'Cancel',
      lockedNote:'This round is in judging: dates, course and eligibility can’t change. You can still edit the name and description.', auditNote:'This change is recorded in the audit log.'
    };
    const STN = { draft:[L('Draft','مسودة'),'mut'], open:[L('Open','مفتوحة'),'ok'], judging:[L('Judging','قيد التحكيم'),'warn'], closed:[L('Closed','مغلقة'),'info'] };
    const ORDER = ['draft','open','judging','closed'];
    const rounds = st.rounds;
    const upd = (id, patch) => this.setState({ rounds: this.state.rounds.map(r => r.id === id ? { ...r, ...patch } : r), errs:{ ...this.state.errs, [id]:null }, dlg:null, cf:null });
    const tryOpen = (r) => {
      if (r.rubric !== 100) return this.setState({ errs:{ ...st.errs, [r.id]:'rubric' } });
      const other = rounds.find(x => x.status === 'open' && x.id !== r.id);
      if (other) return this.setState({ errs:{ ...st.errs, [r.id]:'conflict' } });
      this.setState({ dlg:'confirm', cf:{ id:r.id, to:'open' } });
    };
    const list = rounds.map(r => {
      const i = ORDER.indexOf(r.status);
      const other = rounds.find(x => x.status === 'open' && x.id !== r.id);
      const e = st.errs[r.id];
      return {
        hid:'rd-' + r.id, code:r.code, name:L(r.nEn, r.nAr) || '—', desc:L(r.dEn, r.dAr), st:STN[r.status][0], stCls:STN[r.status][1],
        stNote: r.status === 'judging' ? L('Submissions closed · judges are scoring','أُغلق التقديم · المحكّمون يقيّمون') : r.status === 'open' ? L('Accepting submissions','تستقبل المشاركات') : r.status === 'draft' ? L('Not visible to learners','غير ظاهرة للمتعلمين') : L('Results visible to learners','النتائج ظاهرة للمتعلمين'),
        flow: ORDER.map((s, k) => ({ label:STN[s][0], cls: k < i ? 'done' : k === i ? 'cur' : '', cur: k === i ? 'step' : 'false', ln: k < 3, lnCls: k < i ? 'done' : '' })),
        opens:D(r.opens), opensT: r.status === 'draft' ? L('planned','مخطط') : L('09:00 Gulf','09:00 بتوقيت الخليج'), closes:D(r.closes), closesT:L('23:59 Gulf','23:59 بتوقيت الخليج'),
        course:'C13', elig:L('Eligible at ≥ ' + r.elig + ' % progress', 'مؤهل عند تقدم ≥ ' + r.elig + ' %'),
        rubric: r.rubric === 100 ? L('4 criteria · 100 %','4 معايير · 100 %') : L('Not set · ' + r.rubric + ' %','غير محددة · ' + r.rubric + ' %'), rubricNote: r.scored ? L('Locked — scoring started','مقفلة — بدأ التقييم') : r.rubric === 100 ? L('Editable','قابلة للتعديل') : L('Must total 100 %','يجب أن تساوي 100 %'),
        subs: L(r.sub + ' submitted', r.sub + ' مقدّمة'), subsNote: r.inprog ? L(r.inprog + ' in progress (Sara Haddad)', r.inprog + ' قيد الإعداد (سارة حداد)') : L('none yet','لا شيء بعد'),
        judges: L(r.judges + ' assigned', r.judges + ' معيّنون'), judgesNote: r.judges ? L('Noura active · Daniel invited','نورة نشطة · دانيال مدعو') : L('assign on Judges','عيّنهم في صفحة المحكّمين'),
        scored: L(r.scored + ' of ' + r.assigned + ' scores', r.scored + ' من ' + r.assigned + ' تقييمات'), scoredNote: r.assigned ? L('Daniel’s score pending','تقييم دانيال معلّق') : '—',
        results: r.status === 'closed' ? L('Published','منشورة') : L('Hidden','مخفية'), resultsNote: r.status === 'closed' ? L('Ranks visible on P29','الترتيب ظاهر للمتعلمين') : L('until the round closes','حتى إغلاق الجولة'),
        err: e === 'conflict' ? L('Another round is already open: “' + (other ? other.nEn : '') + '”. Close its submissions before opening this one. (409 conflict)', 'هناك جولة مفتوحة بالفعل: «' + (other ? other.nAr : '') + '». أغلق التقديم فيها قبل فتح هذه الجولة. (409 تعارض)') : e === 'rubric' ? L('The rubric totals ' + r.rubric + ' %. Set criteria that add up to 100 % on Rubrics, then try again. (422)', 'مجموع المعايير ' + r.rubric + ' %. حدّد معايير مجموعها 100 % في صفحة المعايير ثم أعد المحاولة. (422)') : '',
        errT: e === 'conflict' ? L('Can’t open this round','تعذّر فتح هذه الجولة') : L('Rubric incomplete','المعايير غير مكتملة'),
        canOpen: r.status === 'draft', canJudge: r.status === 'open', canClose: r.status === 'judging', isClosed: r.status === 'closed', canDelete: r.status === 'draft',
        open: () => tryOpen(r), judge: () => this.setState({ dlg:'confirm', cf:{ id:r.id, to:'judging' } }), close: () => this.setState({ dlg:'confirm', cf:{ id:r.id, to:'closed' } }),
        edit: () => this.setState({ dlg:'form', fErr:false, form:{ mode:'edit', id:r.id, nEn:r.nEn, nAr:r.nAr, dEn:r.dEn, dAr:r.dAr, opens:r.opens, closes:r.closes, course:r.course, elig:String(r.elig) } }),
        del: () => { this.setState({ rounds: rounds.filter(x => x.id !== r.id) }); this._toast('Draft round deleted', 'حُذفت مسودة الجولة'); }
      };
    });
    /* form */
    const f = st.form || {};
    const editing = f.mode === 'edit' ? rounds.find(r => r.id === f.id) : null;
    const locked = !!(editing && (editing.status === 'judging' || editing.status === 'closed'));
    const fe = {};
    ['nEn','nAr'].forEach(k => { const v = (f[k] || '').trim(); if (!v) fe[k] = L('Enter a name in ' + (k === 'nEn' ? 'English' : 'Arabic') + '.', 'أدخل الاسم ' + (k === 'nEn' ? 'بالإنجليزية' : 'بالعربية') + '.'); else if (v.length > 160) fe[k] = L('Keep it under 160 characters.','اجعله أقل من 160 حرفاً.'); });
    if (!f.opens) fe.opens = L('Choose an opening date.','اختر تاريخ الفتح.');
    if (!f.closes) fe.closes = L('Choose a deadline.','اختر آخر موعد.');
    else if (f.opens && f.closes <= f.opens) fe.closes = L('The deadline must be after the opening date.','يجب أن يكون آخر موعد بعد تاريخ الفتح.');
    const el = Number(f.elig); if (f.elig === '' || isNaN(el) || el < 0 || el > 100 || Math.round(el) !== el) fe.elig = L('Enter a whole number from 0 to 100.','أدخل عدداً صحيحاً من 0 إلى 100.');
    const G = {};
    [['nEn',160],['nAr',160],['dEn',20000],['dAr',20000],['opens',0],['closes',0],['course',0],['elig',0]].forEach(([k, max]) => { const v = f[k] == null ? '' : String(f[k]); const e = st.fErr && fe[k] && !(locked && ['opens','closes','elig'].includes(k)) ? fe[k] : ''; G[k] = { v, n: fmt(v.length) + ' / ' + fmt(max), cc: v.length > max ? 'over' : '', err:e, ec: e ? 'is-error' : '', on: (ev) => this.setState({ form:{ ...this.state.form, [k]:ev.target.value } }) }; });
    const saveRound = () => {
      const blocking = Object.keys(fe).filter(k => !(locked && ['opens','closes','elig'].includes(k)));
      if (blocking.length) return this.setState({ fErr:true });
      if (f.mode === 'create') {
        const n = rounds.length + 1;
        this.setState({ dlg:null, fErr:false, rounds:[ ...rounds, { id:'r' + n + Date.now(), code:'R' + n, nEn:f.nEn.trim(), nAr:f.nAr.trim(), dEn:f.dEn, dAr:f.dAr, status:'draft', opens:f.opens, closes:f.closes, course:f.course, elig:el, rubric: f.copy ? 100 : 0, sub:0, inprog:0, judges:0, scored:0, assigned:0 } ] });
        this._toast('Draft round created · open it when you are ready', 'أُنشئت مسودة الجولة · افتحها عندما تكون جاهزاً');
      } else {
        upd(f.id, locked ? { nEn:f.nEn.trim(), nAr:f.nAr.trim(), dEn:f.dEn, dAr:f.dAr } : { nEn:f.nEn.trim(), nAr:f.nAr.trim(), dEn:f.dEn, dAr:f.dAr, opens:f.opens, closes:f.closes, course:f.course, elig:el });
        this.setState({ fErr:false }); this._toast('Round saved · recorded in the audit log', 'حُفظت الجولة · سُجّلت في سجل التدقيق');
      }
    };
    /* confirm */
    const c = st.cf; const cr = c ? rounds.find(r => r.id === c.id) : null;
    const cf = c && cr ? ({
      open: { title:L('Open “' + cr.nEn + '”?', 'فتح «' + cr.nAr + '»؟'), sub:D(cr.opens) + ' – ' + D(cr.closes), body:L('Eligible learners (≥ ' + cr.elig + ' % in C13) can submit their action plan until the deadline.', 'يستطيع المتعلمون المؤهلون (≥ ' + cr.elig + ' % في C13) تقديم خطة العمل حتى آخر موعد.'), warn:'', warnT:'', btn:L('Open round','فتح الجولة'), btnCls:'btn-primary', to:'open', msg:['Round opened · recorded in the audit log','فُتحت الجولة · سُجّلت في سجل التدقيق'] },
      judging: { title:L('Close submissions now?','إغلاق التقديم الآن؟'), sub:L('Normally this happens automatically on ' + D(cr.closes) + '.', 'يحدث هذا تلقائياً عادةً في ' + D(cr.closes) + '.'), body:L('Learners can no longer submit. Judges can start scoring their assigned submissions.', 'لن يتمكن المتعلمون من التقديم. يبدأ المحكّمون تقييم المشاركات المعيّنة لهم.'), warn: cr.inprog ? L(cr.inprog + ' learner still has a draft in progress and will not be able to submit.', 'لدى ' + cr.inprog + ' متعلم مسودة قيد الإعداد ولن يتمكن من التقديم.') : '', warnT:L('Unfinished drafts','مسودات غير مكتملة'), btn:L('Close submissions','إغلاق التقديم'), btnCls:'btn-ink', to:'judging', msg:['Submissions closed · judging started','أُغلق التقديم · بدأ التحكيم'] },
      closed: { title:L('Close round and publish results?','إغلاق الجولة ونشر النتائج؟'), sub:L(cr.nEn, cr.nAr), body:L('Final scores and ranks become visible to learners on their competition dashboard. This can’t be undone.', 'تصبح الدرجات النهائية والترتيب ظاهرة للمتعلمين في لوحة المسابقة. لا يمكن التراجع عن ذلك.'), warn: cr.scored < cr.assigned ? L((cr.assigned - cr.scored) + ' assigned score is still missing (Daniel Osei · Ahmed Khan). Results will use the scores received so far.', 'ما زال ' + (cr.assigned - cr.scored) + ' تقييم معيّن مفقوداً (دانيال أوسي · أحمد خان). ستُحسب النتائج من التقييمات المستلمة.') : '', warnT:L('Scoring not complete','التقييم غير مكتمل'), btn:L('Close and publish','إغلاق ونشر'), btnCls:'btn-primary', to:'closed', msg:['Round closed · results published to learners','أُغلقت الجولة · نُشرت النتائج للمتعلمين'] }
    })[c.to] : { title:'', sub:'', body:'', warn:'', warnT:'', btn:'', btnCls:'', msg:['',''] };
    cf.go = () => { if (!c) return; upd(c.id, { status:c.to }); this._toast(cf.msg[0], cf.msg[1]); };
    const SCR = [['list','List'],['create','Create'],['edit','Edit R1'],['conflict','409 conflict'],['closeConfirm','Close confirm'],['closed','Closed']];
    return {
      lang, t, sh, ...this._common(ar), route:'/' + site + '/admin/rounds', scrBtns:this._seg(SCR, scr, ar),
      rounds:list,
      openCreate: () => this.setState({ dlg:'form', fErr:false, form:{ mode:'create', nEn:'', nAr:'', dEn:'', dAr:'', opens:'', closes:'', course:'C13', elig:'80', copy:true } }),
      dForm: st.dlg === 'form', isCreate: f.mode === 'create', locked, G, copyRubric: !!f.copy, togCopy: () => this.setState({ form:{ ...f, copy:!f.copy } }),
      formTitle: f.mode === 'create' ? L('New round','جولة جديدة') : L('Edit round','تعديل الجولة'), formSub: f.mode === 'create' ? L('New rounds start as drafts.','تبدأ الجولات الجديدة كمسودات.') : (editing ? editing.code + ' · ' + STN[editing.status][0] : ''),
      formBtn: f.mode === 'create' ? L('Create draft','إنشاء مسودة') : L('Save changes','حفظ التغييرات'), saveRound,
      dConfirm: st.dlg === 'confirm' && !!cr, cf,
      closeDlg: () => this.setState({ dlg:null, fErr:false }), stop: (e) => e.stopPropagation()
    };
  }
}
