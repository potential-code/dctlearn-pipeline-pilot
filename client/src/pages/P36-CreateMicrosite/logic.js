// client: hand-edited (step synced to ?step= for Back/Forward, error summary scrolled into view and
// focused, future stepper steps disabled).
// Ported verbatim from the Claude Design artboard P36-CreateMicrosite (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'
import { lenis } from '@/lib/motion/SmoothScroll'

// client: the wizard step lives in the URL (?step=N), so browser Back/Forward move between steps.
// The page remounts on every URL change, so the answers so far ride along in `draft`.
let draft = null;

export default class Component extends DCLogic {
  constructor(p){ super(p);
    const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (q && !q.has('step')) {
      // A fresh visit: start over, and give this history entry an explicit step so Back returns to it.
      draft = null;
      q.set('step', '1');
      window.history.replaceState(window.history.state, '', window.location.pathname + '?' + q + window.location.hash);
    }
    this.state = {"locale": draft ? draft.locale : null, "step": null, "f": draft ? draft.f : null, "errs": null, "busy": false, "upNote": false, "toastMsg": ""}; }

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
    const seg = (label, key, opts) => ({ label, btns: opts.map(o => ({ label:o[1], cls: String(st(key)) === String(o[0]) ? 'is-on' : '', pick: () => S(Object.assign({ [key]: o[0] }, o[2] || {})) })) });
    const toast = (msg) => { S({ toastMsg: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toastMsg: '' }), 4200); };
    const base = { lang, dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '', enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => S({ locale:'en' }), setAr: () => S({ locale:'ar' }), toggleLang: () => S({ locale: ar ? 'en' : 'ar' }),
      toastMsg: this.state.toastMsg || '', hasToast: !!this.state.toastMsg, closeToast: () => S({ toastMsg:'' }) };

    /* ---- SEED (SEED.md §1, §4) ---- */
    const MS = [
      { id:'employees', en:'DCT Employees', ar:'موظفو الدائرة', short:['Employees','الموظفون'], c:'#EE3E43', hero:'92c83a667e1befe5661dab8c7ebca349', mode:'invite_only', domain:'dctabudhabi.ae', lo:false, tabs:['courses','workshops','mentors','ai_coaches','ai_tools'], labels:{}, courses:['C01','C02','C03','C04','C05','C06','C07','C08'], mand:['C01','C03'], mentoring:false, competition:false, sa:'Omar Al Mansoori', saAr:'عمر المنصوري', saIni:'OM', members:2964, tpl:'programme', popup:false },
      { id:'elevate', en:'Elevate 2026 Mentorship Programme', ar:'برنامج إرتقاء 2026', short:['Elevate','إرتقاء'], c:'#CD3151', hero:'9842ff4b5522772462642e07bfb6d8c1', mode:'invite_only', domain:'', lo:false, tabs:['mentors','workshops'], labels:{ workshops:['Sessions','الجلسات'] }, courses:[], mand:[], mentoring:true, competition:false, sa:'Layla Haddad', saAr:'ليلى حداد', saIni:'LH', members:46, tpl:'mentorship', popup:true },
      { id:'znm', en:'Zayed National Museum', ar:'متحف زايد الوطني', short:['ZNM','المتحف'], c:'#3B2F92', hero:'6a330c17598da2f1e81b82711e1c5e9a', mode:'invite_only', domain:'', lo:false, tabs:['courses','resources','workshops'], labels:{ courses:['ZNM Courses','دورات المتحف'], workshops:['Assessments','التقييمات'] }, courses:['C09','C10','C11','C12','C02','C01'], mand:['C09','C10','C11','C12','C02','C01'], mentoring:false, competition:false, sa:'Khalid Al Dhaheri', saAr:'خالد الظاهري', saIni:'KD', members:418, tpl:'onboarding', popup:false },
      { id:'zu', en:'Zayed University 24-Hour Challenge', ar:'تحدي جامعة زايد', short:['ZU','جامعة زايد'], c:'#F7C337', hero:'006f6b748b68e46ce2d045fcc3d92aea', mode:'invite_only', domain:'', lo:false, tabs:['courses'], labels:{}, courses:['C13'], mand:[], mentoring:false, competition:true, sa:'', saAr:'', saIni:'', members:58, tpl:'competition', popup:false },
      { id:'museopro', en:'MuseoPro', ar:'ميوزيو برو', short:['MuseoPro','ميوزيو برو'], c:'#E35E3C', hero:'2ff5095865986643708258995c8a0113', mode:'invite_only', domain:'', lo:false, tabs:['courses','resources','mentors'], labels:{ mentors:['Trainers','المدربون'] }, courses:['C14','C15','C16','C17'], mand:['C14','C15'], mentoring:false, competition:false, sa:'Camille Rousseau', saAr:'كاميل روسو', saIni:'CR', members:74, tpl:'onboarding', popup:false },
      { id:'nibras', en:'Nibras — DCT AI Champions', ar:'نبراس', short:['Nibras','نبراس'], c:'#2FC4DB', hero:'7430eed874cd248e04160ae211dc6b79', mode:'invite_only', domain:'', lo:false, tabs:['courses'], labels:{}, courses:['C18','C19','C20','C21'], mand:[], mentoring:false, competition:false, sa:'Fatima Al Suwaidi', saAr:'فاطمة السويدي', saIni:'FS', members:126, tpl:'programme', popup:false },
      { id:'chkforum', en:'Cultural Heritage & Knowledge Development Forum', ar:'منتدى التراث الثقافي', short:['Heritage Forum','منتدى التراث'], c:'#6D7782', hero:'a39ca3b3c0fdaf9dcd07000a3da4c090', mode:'open', domain:'', lo:false, tabs:['courses'], labels:{}, courses:['C22','C23'], mand:[], mentoring:false, competition:false, sa:'', saAr:'', saIni:'', members:163, tpl:'forum', popup:false },
      { id:'ruwaad', en:'Ruwaad — Careers in Hospitality', ar:'رواد', short:['Ruwaad','رواد'], c:'#F77860', hero:'3e5eadfa4450ed50cc8f8900fdc8e3e3', mode:'landing_only', domain:'', lo:true, tabs:[], labels:{}, courses:[], mand:[], mentoring:false, competition:false, sa:'', saAr:'', saIni:'', members:0, interest:38, tpl:'interest', popup:false },
      { id:'csmd', en:'Cultural Sites Management Department', ar:'إدارة المواقع الثقافية', short:['CSMD','المواقع الثقافية'], c:'#E3DCD3', hero:'a39ca3b3c0fdaf9dcd07000a3da4c090', mode:'landing_only', domain:'', lo:true, tabs:[], labels:{}, courses:[], mand:[], mentoring:false, competition:false, sa:'', saAr:'', saIni:'', members:0, interest:12, tpl:'interest', popup:false }
    ];
    const MSI = {}; MS.forEach(m => { MSI[m.id] = m; });
    const msName = (id) => { const m = MSI[id]; return m ? (ar ? m.ar : m.en) : id; };
    const msShort = (id) => { const m = MSI[id]; return m ? (ar ? m.short[1] : m.short[0]) : id; };
    const TABN = { courses:['Courses','الدورات'], workshops:['Workshops','ورش العمل'], mentors:['Mentors','المرشدون'], ai_coaches:['AI Coaches','المدربون الأذكياء'], ai_tools:['AI Tools','أدوات الذكاء الاصطناعي'], resources:['Resources','الموارد'] };
    const TABKEYS = ['courses','workshops','mentors','ai_coaches','ai_tools','resources'];
    const MODE = { open:['Open','مفتوح'], invite_only:['Invite-only','بالدعوة فقط'], landing_only:['Landing-only','صفحة تعريفية فقط'] };
    const CRS = {
      C01:['DCT World','عالم الدائرة'], C02:['Museum 101','المتاحف 101'], C03:['DCTLEARN','منصة DCT Learn'], C04:['Understanding Cultural Heritage','فهم التراث الثقافي'],
      C05:['Sustainable Tourism','السياحة المستدامة'], C06:['The World of Curation','عالم التقييم الفني'], C07:['Creative Tourism: What is it?','السياحة الإبداعية'], C08:['Data Protection for People and Performance','حماية البيانات'],
      C09:['Introduction to Ticketing','مقدمة في التذاكر'], C10:['Operational Readiness – Induction','الجاهزية التشغيلية – التعريف'], C11:['Operational Readiness – Role-Specific','الجاهزية التشغيلية – حسب الدور'], C12:['VS Knowledge Assessment','تقييم المعرفة'],
      C13:['24 Hour Challenge – Introduction to Cultural Heritage','تحدي 24 ساعة'], C14:['Condition Report: General Presentation','تقرير الحالة'], C15:['Conservation and Exhibition of Artefacts','صون وعرض القطع'], C16:['Curating an Exhibition: From Concept to Production','تنظيم المعارض'],
      C17:['Written and Oral Interpretation Tools in Heritage','أدوات التفسير'], C18:['Introduction to Generative AI','مقدمة في الذكاء الاصطناعي التوليدي'], C19:['Ethics of AI','أخلاقيات الذكاء الاصطناعي'], C20:['Foundations of Prompt Engineering','أساسيات هندسة الأوامر'],
      C21:['LLMOps','عمليات نماذج اللغة'], C22:['UNESCO: Implementation of the Convention on Diversity of Cultural Expressions','اتفاقية اليونسكو'], C23:['Abu Dhabi Creative City and Its Cooperation with Other Cities','أبوظبي مدينة مبدعة']
    };
    const crs = (k) => CRS[k] ? (ar ? CRS[k][1] : CRS[k][0]) : k;
    const MON = ar ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dt = (s) => { if (!s) return '—'; const p = s.split('-'); return fmt(+p[2]) + ' ' + MON[+p[1]-1] + ' ' + (ar ? fmt(+p[0]).replace(/[٬,]/g,'') : p[0]); };
    const dts = (s) => { const p = s.split('-'); return fmt(+p[2]) + ' ' + MON[+p[1]-1]; };

    const sp = String(st('step') || '1');
    const errMode = sp === 'errors';
    const DEF = { tpl:'mentorship', nameEn:'Elevate Alumni', nameAr:'خريجو إرتقاء', slug:'elevate-alumni', slugTouched:true, accent:'#3B2F92', logo:'dct', hero:'9842ff4b5522772462642e07bfb6d8c1', mode:'invite_only', domain:'',
      tabs:{ mentors:{ on:true, en:'Mentors', ar:'المرشدون' }, workshops:{ on:true, en:'Sessions', ar:'الجلسات' }, courses:{ on:true, en:'Courses', ar:'الدورات' } }, courses:['C06','C16'], mand:[], mentoring:true, competition:false, interest:true,
      saMode:'invite', saName:'Maitha Al Shamsi', saEmail:'maitha.s@dctlearn.example' };
    const EMPTY = Object.assign({}, DEF, { nameEn:'', nameAr:'', slug:'Elevate Alumni!', slugTouched:true, accent:'#3B2F92' });
    const f = this.state.f || (errMode ? EMPTY : DEF);
    const step = errMode ? 2 : sp === 'done' ? 6 : (+sp || 1);
    const setF = (o) => S({ f: Object.assign({}, f, o) });
    const t = ar ? {
      spec:'إنشاء موقع مصغّر', ey:'المواقع المصغّرة', h1:'إنشاء موقع مصغّر', sub:'خمس خطوات: القالب، والهوية، والميزات والتبويبات، والمشرف الفرعي، ثم المراجعة. يُنشأ الموقع كمسودة.', cancelAll:'إلغاء والعودة', progress:'خطوات الإنشاء',
      s1:'القالب', s2:'الهوية', s3:'الميزات والتبويبات', s4:'المشرف الفرعي', s5:'المراجعة والإنشاء',
      tplNote:'يمكن تغيير القالب لاحقاً من إعدادات الصفحة.', browse:'تصفّح القوالب', nameEn:'الاسم بالإنجليزية', nameAr:'الاسم بالعربية', reqName:'هذا الحقل مطلوب.', slug:'المعرّف (رابط الموقع)', slugH:'أحرف إنجليزية صغيرة وأرقام وشرطات، من 2 إلى 40 حرفاً. لا يمكن تغييره بعد النشر.',
      accent:'لون الهوية', custom:'لون مخصّص (HEX)', hexE:'أدخل لوناً بصيغة #RRGGBB.', logo:'الشعار', upload:'رفع شعار', upNote:'PNG أو JPG أو WebP، حتى 5 ميغابايت. الرفع غير متاح في النموذج التجريبي — اختر شعاراً من المكتبة.', hero:'صورة الواجهة', mode:'وضع الدخول', domain:'قاعدة نطاق البريد', optional:'اختياري', domE:'أدخل نطاقاً صحيحاً مثل dctabudhabi.ae',
      loT:'صفحة تعريفية فقط', loP:'لن تتوفر مساحة للمتعلّمين؛ كل روابط الموقع تُحوَّل إلى الصفحة التعريفية.', interest:'نموذج التسجيل في الاهتمام', interestD:'يستقبل الطلبات المشرف الفرعي أو مسؤول المنصة',
      tabsH:'تبويبات المتعلّم', coursesH:'الدورات', mand:'إلزامية', mentoring:'الإرشاد', mentoringD:'المطابقة والحجز وسجلات GROW', competition:'المسابقة', competitionD:'الجولات ومعايير التقييم والمحكّمون',
      saName:'الاسم الكامل', saEmail:'البريد الإلكتروني', invT:'تُرسل الدعوة عند الإنشاء', invP:'تنتهي صلاحية الرابط بعد 14 يوماً. المشرف الفرعي يملك موقعاً واحداً فقط.', noneP:'يدير مسؤول المنصة هذا الموقع حتى تعيّن مشرفاً فرعياً.',
      editL:'تعديل', draftT:'يُنشأ كمسودة', draftP:'لن يراه أحد حتى تنشر صفحته وتنقله إلى «منشور». يُسجَّل الإنشاء في سجل التدقيق.', back:'السابق', next:'التالي', create:'إنشاء الموقع', creating:'جارٍ الإنشاء…',
      pvL:'معاينة مباشرة', draft:'مسودة', pvNote:'تتغير المعاينة مع كل حقل. الصفحة النهائية تُصمَّم من القالب.',
      doneEy:'تم الإنشاء', doneTag:'تم', n1:'إنشاء المسودة', n2:'تصميم الصفحة التعريفية', n2s:'اختر قالباً وأضف النصوص والصور', n2c:'قوالب الصفحات', n3:'النشر', n3s:'بعد نشر الصفحة وتفعيل تبويب واحد على الأقل', n3c:'المواقع المصغّرة', backList:'العودة إلى المواقع', again:'إنشاء موقع آخر', close:'إغلاق'
    } : {
      spec:'Create microsite', ey:'Microsites', h1:'Create a microsite', sub:'Five steps — template, branding, features and tabs, sub admin, then review. The microsite is created as a draft.', cancelAll:'Cancel and go back', progress:'Creation steps',
      s1:'Template', s2:'Branding', s3:'Features & tabs', s4:'Sub admin', s5:'Review & create',
      tplNote:'You can change the template later in the landing settings.', browse:'Browse templates', nameEn:'Name in English', nameAr:'Name in Arabic', reqName:'This field is required.', slug:'Id (URL slug)', slugH:'Lower-case letters, numbers and hyphens, 2–40 characters. It can’t change after publishing.',
      accent:'Accent colour', custom:'Custom colour (HEX)', hexE:'Enter a colour as #RRGGBB.', logo:'Logo', upload:'Upload logo', upNote:'PNG, JPG or WebP up to 5 MB. Uploading is off in this prototype — pick a logo from the library.', hero:'Hero image', mode:'Sign-in mode', domain:'E-mail domain rule', optional:'optional', domE:'Enter a valid domain, e.g. dctabudhabi.ae',
      loT:'Landing page only', loP:'There is no learner area; every microsite link redirects to the landing page.', interest:'Register-interest form', interestD:'Submissions go to the sub admin or the platform admin',
      tabsH:'Learner tabs', coursesH:'Courses', mand:'Mandatory', mentoring:'Mentoring', mentoringD:'Matching, booking and GROW logs', competition:'Competition', competitionD:'Rounds, rubrics and judges',
      saName:'Full name', saEmail:'E-mail', invT:'The invitation is sent when you create the microsite', invP:'The link expires after 14 days. A sub admin owns exactly one microsite.', noneP:'The platform admin manages this microsite until you assign a sub admin.',
      editL:'Edit', draftT:'Created as a draft', draftP:'Nobody can see it until you publish its landing and set it live. Creation is recorded in the audit log.', back:'Back', next:'Next', create:'Create microsite', creating:'Creating…',
      pvL:'Live preview', draft:'Draft', pvNote:'The preview follows every field. The final landing is designed from the template.',
      doneEy:'Created', doneTag:'Done', n1:'Draft created', n2:'Design the landing page', n2s:'Pick a template, then add copy and images', n2c:'Landing templates', n3:'Publish', n3s:'Once the landing is published and at least one tab is on', n3c:'Microsites', backList:'Back to microsites', again:'Create another', close:'Close'
    };
    const STEPN = [t.s1, t.s2, t.s3, t.s4, t.s5];
    const SUBS = ar ? ['اختر بنية الصفحة التعريفية. المعاينة على اليمين تتغير فوراً.','الاسم والرابط والألوان والصور ووضع الدخول.','ما يراه المتعلّمون بعد تسجيل الدخول.','الشخص الذي يدير الصفحة والأعضاء والموارد.','تحقق من كل شيء قبل الإنشاء.'] : ['Choose the landing structure. The preview on the right updates instantly.','Name, address, colours, images and how people get in.','What learners see once they sign in.','The person who runs the landing, members and resources.','Check everything before you create it.'];
    const TPL = [ ['programme',L('Programme','برنامج'),L('Hero, courses, partners','واجهة ودورات وشركاء'),'#1D1650','#EE3E43'], ['mentorship',L('Mentorship','إرشاد'),L('Hero, popup, mentors, sessions','واجهة ونافذة ومرشدون وجلسات'),'#CD3151','#F7C337'], ['onboarding',L('Onboarding','تأهيل'),L('Hero, mandatory path, resources','واجهة ومسار إلزامي وموارد'),'#3B2F92','#F77860'],
      ['competition',L('Competition','مسابقة'),L('Hero, countdown, rules, apply','واجهة وعدّ تنازلي وقواعد'),'#F7C337','#1D1650'], ['forum',L('Open forum','منتدى مفتوح'),L('Hero, sign up, programme','واجهة وتسجيل وبرنامج'),'#6D7782','#EE3E43'], ['interest',L('Landing-only interest','اهتمام — صفحة فقط'),L('Hero, story, interest form','واجهة وقصة ونموذج اهتمام'),'#F77860','#1D1650'] ];
    /* validation */
    const slugTaken = !!MSI[f.slug];
    const v = {
      2: { nameEn: !f.nameEn.trim(), nameAr: !f.nameAr.trim(), slug: !/^[a-z0-9-]{2,40}$/.test(f.slug) || slugTaken, hex: !/^#[0-9a-fA-F]{6}$/.test(f.accent), dom: f.mode !== 'landing_only' && !!f.domain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(f.domain) },
      3: { tabs: f.mode !== 'landing_only' && (!Object.keys(f.tabs).some(k => f.tabs[k].on) || Object.keys(f.tabs).some(k => f.tabs[k].on && (!f.tabs[k].en.trim() || !f.tabs[k].ar.trim()))) },
      4: { saName: f.saMode === 'invite' && !f.saName.trim(), saEmail: f.saMode === 'invite' && (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(f.saEmail) || /^(layla\.h|omar\.m|khalid\.d|camille\.r|fatima\.s)@/i.test(f.saEmail)) }
    };
    const errsOn = this.state.errs || (errMode ? { 2:true } : {});
    const cur = (k) => errsOn[step] && v[step] && v[step][k];
    const saTaken = /^(layla\.h|omar\.m|khalid\.d|camille\.r|fatima\.s)@/i.test(f.saEmail);
    const e = {
      nameEn: cur('nameEn'), nameEnCls: cur('nameEn') ? 'is-error' : '', nameAr: cur('nameAr'), nameArCls: cur('nameAr') ? 'is-error' : '',
      slugBad: cur('slug'), slugCls: cur('slug') ? 'is-error' : '', slugMsg: slugTaken ? L('“' + f.slug + '” is already used by another microsite.','المعرّف «' + f.slug + '» مستخدم لموقع آخر.') : L('Use 2–40 lower-case letters, numbers or hyphens — e.g. elevate-alumni.','استخدم من 2 إلى 40 حرفاً صغيراً أو رقماً أو شرطة — مثل elevate-alumni.'),
      hex: cur('hex'), hexCls: cur('hex') ? 'is-error' : '', dom: cur('dom'), domCls: cur('dom') ? 'is-error' : '',
      tabs: cur('tabs'), tabsMsg: !Object.keys(f.tabs).some(k => f.tabs[k].on) ? L('Turn on at least one tab, or go back and choose landing-only.','فعّل تبويباً واحداً على الأقل، أو اختر «صفحة تعريفية فقط».') : L('Every enabled tab needs an English and an Arabic label.','كل تبويب مفعّل يحتاج تسمية بالإنجليزية والعربية.'),
      saName: cur('saName'), saNameCls: cur('saName') ? 'is-error' : '', saEmail: cur('saEmail'), saEmailCls: cur('saEmail') ? 'is-error' : '',
      saEmailMsg: saTaken ? L('This person already manages another microsite. A sub admin owns one microsite — invite someone else or let the platform admin cover it.','هذا الشخص يدير موقعاً آخر. المشرف الفرعي يملك موقعاً واحداً — ادعُ شخصاً آخر أو دع مسؤول المنصة يغطيه.') : L('Enter a valid e-mail address.','أدخل بريداً إلكترونياً صحيحاً.')
    };
    const LBL = { nameEn:t.nameEn, nameAr:t.nameAr, slug:t.slug, hex:t.accent, dom:t.domain, tabs:t.tabsH, saName:t.saName, saEmail:t.saEmail };
    const bad = v[step] ? Object.keys(v[step]).filter(k => v[step][k]) : [];
    const hasErrs = !!errsOn[step] && bad.length > 0;
    const go = (n) => {
      draft = { f, locale: this.state.locale };
      const q = new URLSearchParams(window.location.search); q.set('step', String(n));
      window.dispatchEvent(new CustomEvent('dct-nav', { detail: window.location.pathname + '?' + q }));
    };
    const showErrs = () => setTimeout(() => {
      const el = document.querySelector('.pgs-P36-CreateMicrosite .errsum');
      if (!el) return;
      el.setAttribute('tabindex', '-1');
      const l = lenis();
      if (l) l.scrollTo(el, { offset: -140, immediate: true }); else el.scrollIntoView({ block:'center' });
      el.focus({ preventScroll:true });
    }, 30);
    const next = () => {
      if (this.state.busy) return;
      if (bad.length) { S({ errs: Object.assign({}, errsOn, { [step]:true }), step:String(step) }); showErrs(); return; }
      if (step < 5) { go(step + 1); return; }
      S({ busy:true }); clearTimeout(this._ct); this._ct = setTimeout(() => this.setState({ busy:false, step:'done' }), 900);
    };
    const steps = STEPN.map((l, i) => { const n = i + 1; const dn = n < step; return { l, no: dn ? '✓' : fmt(n), cls: n === step ? 'on' : dn ? 'dn' : '', cur: n === step ? 'step' : 'false', go: () => { if (n < step) go(n); else if (n === step + 1) next(); }, dis: n > step + 1, hasLn: n < 5, lnCls: dn ? 'dn' : '' }; });
    const lo = f.mode === 'landing_only';
    const ACC = [['#EE3E43','Red'],['#CD3151','Raspberry'],['#3B2F92','Indigo'],['#1D1650','Deep indigo'],['#F7C337','Yellow'],['#E35E3C','Orange'],['#F77860','Coral'],['#2FC4DB','Turquoise'],['#6D7782','Slate']];
    const HER = [['9842ff4b5522772462642e07bfb6d8c1','Elevate'],['eb80e68b5f407df8f3c317956007a5a2','Team'],['6a330c17598da2f1e81b82711e1c5e9a','Zayed National Museum'],['2ff5095865986643708258995c8a0113','MuseoPro'],['7430eed874cd248e04160ae211dc6b79','Nibras'],['880a72d5794fad0ac73793c03f37c852','Al Ayyala'],['264f666208d2eea0e4d02dbad77c468f','Students'],['3e5eadfa4450ed50cc8f8900fdc8e3e3','Ruwaad']];
    const tabsArr = TABKEYS.map(k => { const x = f.tabs[k] || { on:false, en:TABN[k][0], ar:TABN[k][1] }; return Object.assign({ k }, x); });
    const setTab = (k, o) => setF({ tabs: Object.assign({}, f.tabs, { [k]: Object.assign({ on:false, en:TABN[k][0], ar:TABN[k][1] }, f.tabs[k] || {}, o) }) });
    const light = ['#F7C337','#2FC4DB','#F77860','#E3DCD3'].includes(f.accent.toUpperCase());
    const accOk = /^#[0-9a-fA-F]{6}$/.test(f.accent);
    const ctaTxt = lo ? L('Register interest','سجّل اهتمامك') : f.mode === 'open' ? L('Sign in / Join','دخول / انضمام') : L('Sign in','تسجيل الدخول');
    const pv = { c: accOk ? f.accent : '#3B2F92', fg: light ? '#1D1650' : '#FFFFFF', slug: f.slug || '…', logo: B(f.logo === 'adc' ? '2b3254a011d37f2dc8ba5fadf6ce98c7' : 'b9eccf73abbba8b88c76e30f5d924545'), lang: ar ? 'EN' : 'عربي',
      hero: B(f.hero), name: (ar ? f.nameAr : f.nameEn) || L('Microsite name','اسم الموقع'), tag: (TPL.find(x => x[0] === f.tpl) || TPL[0])[1] + ' · ' + (ar ? MODE[f.mode][1] : MODE[f.mode][0]), cta: ctaTxt,
      popup: f.tpl === 'mentorship' && !lo, popTxt: L('Mentee registration is open','تسجيل المتدرّبين مفتوح'),
      area: !lo, lo, nav: [{ l:L('Dashboard','لوحة التحكم'), cls:'on' }].concat(tabsArr.filter(x => x.on).map(x => ({ l: ar ? x.ar : x.en, cls:'' })), f.mentoring ? [{ l:L('Mentoring','الإرشاد'), cls:'' }] : [], f.competition ? [{ l:L('Competition','المسابقة'), cls:'' }] : []) };
    const tplName = (TPL.find(x => x[0] === f.tpl) || TPL[0])[1];
    const review = [
      { h:t.s1, items:[tplName], n:1 },
      { h:t.s2, items:[f.nameEn + ' · ' + f.nameAr, 'dctlearn.dct.gov.ae/' + f.slug, L('Accent ','اللون ') + f.accent + ' · ' + (ar ? MODE[f.mode][1] : MODE[f.mode][0]) + (f.domain && !lo ? ' · @' + f.domain : '')], n:2 },
      { h:t.s3, items: lo ? [t.loT, f.interest ? t.interest : ''] : [L('Tabs: ','التبويبات: ') + tabsArr.filter(x => x.on).map(x => ar ? x.ar : x.en).join(' · '), L('Courses: ','الدورات: ') + (f.courses.length ? f.courses.map(k => crs(k)).join(' · ') : L('none','لا شيء')), t.mentoring + ': ' + (f.mentoring ? L('on','مفعّل') : L('off','متوقف')) + ' · ' + t.competition + ': ' + (f.competition ? L('on','مفعّلة') : L('off','متوقفة'))], n:3 },
      { h:t.s4, items: f.saMode === 'invite' ? [f.saName, f.saEmail] : [L('Platform admin covers','يغطيه مسؤول المنصة')], n:4 }
    ].map(r => ({ h:r.h, items:r.items.filter(Boolean), go: () => go(r.n), aria: t.editL + ' ' + r.h }));
    const sh = this.shell(ar, 'admin', 'microsites', null, [ { label:L('Admin','الإدارة'), href:'/admin' }, { label:L('Microsites','المواقع المصغّرة'), href:'/admin/platforms' }, { label:L('Create','إنشاء') } ]);
    return Object.assign(base, {
      t, sh, route:'/admin/platforms/new', f, e, steps, isWizard: step <= 5, isDone: step === 6,
      s1: step === 1, s2: step === 2, s3: step === 3, s4: step === 4, s5: step === 5,
      stepEy: L('Step ','الخطوة ') + fmt(Math.min(step,5)) + L(' of 5',' من 5'), stepTitle: STEPN[Math.min(step,5) - 1], stepSub: SUBS[Math.min(step,5) - 1], stepOf: fmt(Math.min(step,5)) + ' / ' + fmt(5),
      hasErrs, errTitle: L('Fix ' + bad.length + ' field' + (bad.length > 1 ? 's' : '') + ' to continue','صحّح ' + fmt(bad.length) + ' من الحقول للمتابعة'), errList: bad.map(k => LBL[k]).join(' · '),
      hasBack: step > 1 && step <= 5, noBack: step === 1, back: () => go(step - 1), next, nextL: step === 5 ? (this.state.busy ? t.creating : t.create) : t.next, nextCls: this.state.busy ? 'is-loading' : '', busy: !!this.state.busy,
      tpls: TPL.map(x => ({ n:x[1], d:x[2], tc:x[3], ta:x[4], on: f.tpl === x[0], pick: () => setF(Object.assign({ tpl:x[0] }, x[0] === 'interest' ? { mode:'landing_only' } : (f.mode === 'landing_only' ? { mode:'invite_only' } : {}), x[0] === 'competition' ? { competition:true } : {}, x[0] === 'mentorship' ? { mentoring:true } : {})) })),
      onNameEn: (ev) => { const val = ev.target.value; const o = { nameEn: val }; if (!f.slugTouched) o.slug = val.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40); setF(o); },
      onNameAr: (ev) => setF({ nameAr: ev.target.value }), onSlug: (ev) => setF({ slug: ev.target.value.trim(), slugTouched:true }),
      accents: ACC.map(a => ({ c:a[0], n:a[1] + ' ' + a[0], on: f.accent.toUpperCase() === a[0], pick: () => setF({ accent:a[0] }) })), onHex: (ev) => setF({ accent: ev.target.value.trim() }),
      logos: [['dct','DCT Learn','b9eccf73abbba8b88c76e30f5d924545'],['adc','Abu Dhabi Culture','2b3254a011d37f2dc8ba5fadf6ce98c7']].map(l => ({ n:l[1], src:B(l[2]), on: f.logo === l[0], pick: () => setF({ logo:l[0] }) })),
      upload: () => S({ upNote:true }), upNote: !!this.state.upNote,
      heroes: HER.map(h => ({ src:B(h[0]), n:h[1], on: f.hero === h[0], pick: () => setF({ hero:h[0] }) })),
      modes: ['open','invite_only','landing_only'].map(k => ({ l: ar ? MODE[k][1] : MODE[k][0], d: k === 'open' ? L('Anyone may sign up on the microsite','يمكن لأي شخص التسجيل') : k === 'invite_only' ? L('Members join by invitation','الانضمام بدعوة') : L('Only a landing with an interest form','صفحة تعريفية مع نموذج اهتمام'), on: f.mode === k, pick: () => setF({ mode:k }) })),
      notLo: !lo, isLo: lo, onDom: (ev) => setF({ domain: ev.target.value.trim() }), togInterest: () => setF({ interest: !f.interest }),
      tabs: tabsArr.map(x => ({ name: ar ? TABN[x.k][1] : TABN[x.k][0], on: x.on, cls: x.on ? 'on' : '', en:x.en, ar:x.ar, errCls: e.tabs && x.on && (!x.en.trim() || !x.ar.trim()) ? 'is-error' : '', aEn: (ar ? TABN[x.k][1] : TABN[x.k][0]) + ' — EN', aAr: (ar ? TABN[x.k][1] : TABN[x.k][0]) + ' — AR', tog: () => setTab(x.k, { on: !x.on }), onEn: (ev) => setTab(x.k, { en: ev.target.value }), onAr: (ev) => setTab(x.k, { ar: ev.target.value }) })),
      clist: Object.keys(CRS).map(k => ({ k, title: crs(k), on: f.courses.includes(k), mand: f.mand.includes(k), tog: () => setF({ courses: f.courses.includes(k) ? f.courses.filter(x => x !== k) : f.courses.concat([k]), mand: f.mand.filter(x => x !== k) }), togM: () => setF({ mand: f.mand.includes(k) ? f.mand.filter(x => x !== k) : f.mand.concat([k]) }) })),
      cSum: fmt(f.courses.length) + L(' selected · ',' مختارة · ') + fmt(f.mand.length) + L(' mandatory',' إلزامية'), togMent: () => setF({ mentoring: !f.mentoring }), togComp: () => setF({ competition: !f.competition }),
      saModes: [['invite',L('Invite a sub admin','دعوة مشرف فرعي'),L('They receive an invitation e-mail','يتلقى رسالة دعوة')],['none',L('Platform admin covers','يغطيه مسؤول المنصة'),L('Assign someone later','عيّن شخصاً لاحقاً')]].map(o => ({ l:o[1], d:o[2], on: f.saMode === o[0], pick: () => setF({ saMode:o[0] }) })),
      saInvite: f.saMode === 'invite', saNone: f.saMode !== 'invite', onSaName: (ev) => setF({ saName: ev.target.value }), onSaEmail: (ev) => setF({ saEmail: ev.target.value.trim() }),
      review, pv,
      doneH: L((f.nameEn || 'Microsite') + ' is ready as a draft','«' + (f.nameAr || f.nameEn) + '» جاهز كمسودة'), doneP: L('Created by Aisha Al Marzouqi on 6 Oct 2026 · recorded in the audit log.','أنشأته عائشة المرزوقي في 6 أكتوبر 2026 · سُجّل في سجل التدقيق.'),
      n1s: f.saMode === 'invite' ? L('/' + f.slug + ' · invitation sent to ' + f.saEmail + ' (expires 20 Oct 2026)','/' + f.slug + ' · أُرسلت الدعوة إلى ' + f.saEmail + ' (تنتهي في 20 أكتوبر 2026)') : '/' + f.slug,
      again: () => { draft = null; window.dispatchEvent(new CustomEvent('dct-nav', { detail: window.location.pathname })); },
      specSegs: [ seg('Step','step',[['1','1 Template'],['2','2 Branding'],['3','3 Features'],['4','4 Sub admin'],['5','5 Review'],['done','Success'],['errors','Errors']], { f:null, errs:null, busy:false }) ]
    });
  }

}
