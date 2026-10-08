// Ported verbatim from the Claude Design artboard P60-Translations (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = {"locale": null}; }

  /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  renderVals(){
    
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const L = (en, a) => ar ? a : en;
    const B = (id) => '/_blob/' + id;
    const fmt = (n) => Number(n).toLocaleString(ar ? 'ar-AE' : 'en-US');
    const S = (o) => this.setState(o);
    const st = (k) => (this.state[k] !== undefined && this.state[k] !== null) ? this.state[k] : this.props[k];
    const seg = (label, key, opts) => ({ label, btns: opts.map(o => ({ label:o[1], cls: st(key) === o[0] ? 'is-on' : '', pick: () => S(Object.assign({ [key]: o[0] }, o[2] || {})) })) });
    const flash = (msg) => { S({ toast: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast: null }), 3600); };
    const base = { toast: this.state.toast || false, lang, dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '', enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => S({ locale:'en' }), setAr: () => S({ locale:'ar' }), toggleLang: () => S({ locale: ar ? 'en' : 'ar' }) };

    const t = ar ? {
      spec:'الترجمات', ey:'الإعدادات · الترجمات', h1:'ترجمة المحتوى', sub:'حرّر النص العربي بجانب النص الإنجليزي للدورات والصفحات والأسئلة الشائعة والمواقع المصغّرة. لا تظهر الترجمة الآلية للمتعلّمين قبل مراجعتها.', machine:'ترجمة آلية للنصوص الناقصة',
      areasLbl:'التقدّم حسب المجال', areas:{ course:'الدورات', unit:'الدروس والكتل', page:'الصفحات', faq:'الأسئلة الشائعة', microsite:'المواقع المصغّرة' }, ofRev:'%r من %t تمت مراجعتها',
      search:'ابحث في النصوص', stLbl:'الحالة', st:{ all:'الكل', missing:'ناقصة', machine:'آلية', reviewed:'تمت مراجعتها' }, of:'من', strW:'نص', allStrings:'كل النصوص', allAreas:'كل المجالات',
      thStr:'النص', thEn:'الإنجليزية (المصدر)', thAr:'العربية', ph:'اكتب الترجمة العربية…', req:'أدخل النص العربي', save:'حفظ واعتماد', saveR:'حفظ', reviewedL:'تمت المراجعة', stL:{ missing:'ناقصة', machine:'آلية — تحتاج مراجعة', reviewed:'تمت مراجعتها' },
      npH:'لا يوجد مزوّد ترجمة', npP:'الترجمة الآلية معطّلة لأن متغيّر TRANSLATION_PROVIDER غير مضبوط. يمكنك الترجمة يدوياً.', saved:'تم حفظ الترجمة واعتمادها', mt:'تمت ترجمة %n نصوص آلياً — راجعها قبل اعتمادها', mtNone:'لا توجد نصوص ناقصة', mtOff:'الترجمة الآلية غير متاحة: لا يوجد مزوّد', noRes:'لا توجد نصوص مطابقة', noResB:'جرّب حالة أو مجالاً آخر.'
    } : {
      spec:'Translations', ey:'Settings · Translations', h1:'Content translations', sub:'Edit Arabic side by side with English for courses, pages, FAQ and microsites. Machine translations never reach learners until reviewed.', machine:'Machine-translate missing',
      areasLbl:'Progress by area', areas:{ course:'Courses', unit:'Units & blocks', page:'Pages', faq:'FAQ', microsite:'Microsites' }, ofRev:'%r of %t reviewed',
      search:'Search strings', stLbl:'Status', st:{ all:'All', missing:'Missing', machine:'Machine', reviewed:'Reviewed' }, of:'of', strW:'strings', allStrings:'All strings', allAreas:'All areas',
      thStr:'String', thEn:'English (source)', thAr:'Arabic', ph:'Type the Arabic translation…', req:'Enter the Arabic text', save:'Save & approve', saveR:'Save', reviewedL:'Reviewed', stL:{ missing:'Missing', machine:'Machine — needs review', reviewed:'Reviewed' },
      npH:'No translation provider', npP:'Machine translation is off because TRANSLATION_PROVIDER is not set. You can still translate by hand.', saved:'Translation saved and approved', mt:'%n strings machine-translated — review them before approving', mtNone:'Nothing missing to translate', mtOff:'Machine translation unavailable: no provider configured', noRes:'No strings match', noResB:'Try another status or area.'
    };
    const R = [
      { id:'s1', e:'course', ref:'C01', f:'title', en:'DCT World', ar:'عالم الدائرة', st:'reviewed' },
      { id:'s2', e:'course', ref:'C01', f:'card.overview', en:'Get to know DCT Abu Dhabi: who we are, our sectors, our cultural sites and your part in every visitor’s journey.', ar:'تعرّف إلى دائرة الثقافة والسياحة – أبوظبي: من نحن، وقطاعاتنا، ومواقعنا الثقافية، ودورك في رحلة كل زائر.', st:'reviewed' },
      { id:'s3', e:'course', ref:'C17', f:'card.overview', en:'How to interpret heritage for visitors, in writing and in person.', ar:'', mt:'كيفية تفسير التراث للزوار، كتابةً وشخصياً.', st:'missing' },
      { id:'s4', e:'course', ref:'C22', f:'title', en:'UNESCO: Implementation of the Convention on Diversity of Cultural Expressions', ar:'اتفاقية اليونسكو', st:'reviewed' },
      { id:'s5', e:'unit', ref:'C01 · U3', f:'title', en:'Abu Dhabi’s cultural sites', ar:'المواقع الثقافية في أبوظبي', st:'reviewed' },
      { id:'s6', e:'unit', ref:'C01 · U4 · action_plan', f:'questions[1]', en:'In 3 years, on the professional side, I want to have done…', ar:'', mt:'في 3 سنوات، على الجانب المهني، أريد أن أكون قد فعلت…', st:'missing' },
      { id:'s7', e:'unit', ref:'C01 · U2 · audio', f:'title', en:'DCT Flow — Our sectors', ar:'تدفق DCT — قطاعاتنا', st:'machine' },
      { id:'s8', e:'unit', ref:'C01 · U1 · quotes', f:'quotes[1].text', en:'Every visitor should leave with a story they want to tell.', ar:'يجب أن يغادر كل زائر ومعه قصة يرغب في روايتها.', st:'reviewed' },
      { id:'s9', e:'page', ref:'P02 /professionals', f:'hero.heading', en:'Grow your career at DCT', ar:'طوّر مسيرتك المهنية في الدائرة', st:'reviewed' },
      { id:'s10', e:'page', ref:'P03 /students', f:'hero.subheading', en:'Courses and challenges for university students', ar:'', mt:'دورات وتحديات لطلاب الجامعة', st:'missing' },
      { id:'s11', e:'faq', ref:'FAQ #3', f:'question', en:'How do I reset my password?', ar:'كيف أقوم بإعادة تعيين كلمة المرور الخاصة بي؟', st:'machine' },
      { id:'s12', e:'faq', ref:'FAQ #3', f:'answer', en:'Use “Forgot password” on the sign-in page. We e-mail you a link that works for 60 minutes.', ar:'', mt:'استخدم «نسيت كلمة المرور» في صفحة تسجيل الدخول. نرسل لك بريداً إلكترونياً برابط يعمل لمدة 60 دقيقة.', st:'missing' },
      { id:'s13', e:'microsite', ref:'elevate', f:'landing.popup.title', en:'Mentee registration is open', ar:'التسجيل للمتدرّبين مفتوح', st:'reviewed' },
      { id:'s14', e:'microsite', ref:'znm', f:'landing.heading', en:'Welcome to the onboarding programme of Zayed National Museum', ar:'مرحبا بكم في برنامج التأهيل لمتحف زايد الوطني', st:'machine' }
    ];
    const HID = { course:[44,44], unit:[176,180], page:[58,60], faq:[10,10], microsite:[30,34] };
    const screen = st('screen') || 'all';
    const noProv = screen === 'noprovider';
    const mods = this.state.mods || {};
    const ed = this.state.ed || {};
    const errs = this.state.errs || {};
    const rowsAll = R.map(r => Object.assign({}, r, mods[r.id] || {}));
    const area = this.state.area || null;
    const sf = this.state.sf || (screen === 'missing' ? 'missing' : 'all');
    const q = (this.state.q || '').toLowerCase();
    const list = rowsAll.filter(r => (!area || r.e === area) && (sf === 'all' || r.st === sf) && (!q || (r.en + ' ' + r.ar + ' ' + r.ref).toLowerCase().indexOf(q) >= 0));
    const ECLS = { course:'red', unit:'info', page:'mut', faq:'warn', microsite:'yel' };
    const SCLS = { missing:'bad', machine:'warn', reviewed:'ok' };
    const rows = list.map(r => { const v = ed[r.id] !== undefined ? ed[r.id] : r.ar; const dirty = v !== r.ar;
      return { rows: String(Math.max(2, Math.ceil(Math.max(String(v).length, r.en.length) / 48))), id:'tr-' + r.id, ent: t.areas[r.e], eCls: ECLS[r.e], ref: r.ref, field: r.f, en: r.en, ar: v, aria: t.thAr + ': ' + r.en, cls: r.st === 'missing' ? 'miss' : '',
        on: (e) => S({ ed: Object.assign({}, ed, { [r.id]: e.target.value }), errs: Object.assign({}, errs, { [r.id]: false }) }),
        err: !!errs[r.id], errCls: errs[r.id] ? 'is-error' : '', sL: t.stL[r.st], sCls: SCLS[r.st],
        showBtn: r.st !== 'reviewed' || dirty, btn: r.st === 'reviewed' ? t.saveR : t.save, done: r.st === 'reviewed' && !dirty, doneL: t.reviewedL,
        save: () => { if (!String(v).trim()) { S({ errs: Object.assign({}, errs, { [r.id]: true }) }); return; } const ne = Object.assign({}, ed); delete ne[r.id]; S({ mods: Object.assign({}, mods, { [r.id]: { ar: String(v).trim(), st:'reviewed' } }), ed: ne }); flash(t.saved); } }; });
    const KI = { course:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5', unit:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', page:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6', faq:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01', microsite:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z' };
    const KC = { course:'k-ink', unit:'k-rasp', page:'k-red', faq:'k-coral', microsite:'k-yel' };
    const areas = Object.keys(HID).map(k => { const rs = rowsAll.filter(r => r.e === k); const tot = HID[k][1] + rs.length; const rev = HID[k][0] + rs.filter(r => r.st === 'reviewed').length; const pct = Math.floor(rev / tot * 100);
      return { l: t.areas[k], v: fmt(pct), pct: pct + '%', n: t.ofRev.replace('%r', fmt(rev)).replace('%t', fmt(tot)), cls: KC[k], d: KI[k], on: area === k ? 'true' : 'false', pick: () => S({ area: area === k ? null : k }) }; });
    const stSeg = ['all','missing','machine','reviewed'].map(k => { const n = rowsAll.filter(r => (!area || r.e === area) && (k === 'all' || r.st === k)).length; return { l: t.st[k] + ' · ' + fmt(n), cls: sf === k ? 'is-on' : '', on: sf === k ? 'true' : 'false', pick: () => S({ sf:k }) }; });
    const missing = rowsAll.filter(r => r.st === 'missing');
    const machine = () => { if (noProv) { flash(t.mtOff); return; } if (!missing.length) { flash(t.mtNone); return; } const m2 = Object.assign({}, mods); missing.forEach(r => { m2[r.id] = { ar: r.mt, st:'machine' }; }); S({ mods: m2 }); flash(t.mt.replace('%n', fmt(missing.length))); };
    const sh = this.shell(ar, 'admin', 'translations', null, [ { label: L('Admin','الإدارة'), href:'/admin' }, { label: L('Translations','الترجمات') } ]);
    return Object.assign(base, {
      t, sh, route:'/admin/translations', areas, stSeg, rows, noProv, machine, machineLbl: t.machine + (missing.length ? ' (' + fmt(missing.length) + ')' : ''),
      q: this.state.q || '', onQ: (e) => S({ q: e.target.value }), countTxt: fmt(list.length) + ' ' + t.of + ' ' + fmt(rowsAll.length) + ' ' + t.strW, noRes: list.length === 0,
      areaTitle: area ? t.areas[area] : t.allStrings, hasArea: !!area, clearArea: () => S({ area:null }),
      specSegs: [ seg('State','screen',[['all','All strings',{ sf:undefined }],['missing','Missing filter',{ sf:undefined }],['noprovider','Provider off',{ sf:undefined }]]) ]
    });
  }

}
