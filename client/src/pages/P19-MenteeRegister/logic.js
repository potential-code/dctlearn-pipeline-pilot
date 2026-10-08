// Ported verbatim from the Claude Design artboard P19-MenteeRegister (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, screen:null, f:null, tried:false, busy:false, done:false }; }
  init(scr){
    const SAEED = { goals:'Lead a small exhibition project by Q2 2027 and build the budgeting and planning skills to run it well.', years:'1-3', areas:['Museums and Curation','Strategy and Planning','Visitor Experience and Events'], lang:'both' };
    const EMPTY = { goals:'', years:'', areas:[], lang:'' };
    if (scr === 'prefilled' || scr === 'success') return { f: { ...SAEED, areas: SAEED.areas.slice() }, tried:false, done: scr === 'success', busy:false };
    return { f: { ...EMPTY, areas:[] }, tried: scr === 'errors', done:false, busy:false };
  }
  /* spec-bar segment helper (mockup chrome only) */
  seg(label, cur, opts, fn){ return { label, btns: opts.map(o => ({ label:o[1], cls: o[0] === cur ? 'is-on' : '', pick: () => fn(o[0]) })) }; }

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
    const fmt = (n) => Number(n).toLocaleString('en-US');
    const base = { lang, dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '', enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }) };
    /* ---- seed: mentor categories (SEED §3) and mentors (SEED §4.2) ---- */
    const CAT = { 'Strategy and Planning':'الاستراتيجية والتخطيط', 'Culture and Heritage':'الثقافة والتراث', 'Museums and Curation':'المتاحف والتقييم الفني', 'Marketing and Communications':'التسويق والاتصال', 'People and Performance':'الأفراد والأداء', 'Finance and Revenue':'المالية والإيرادات', 'Visitor Experience and Events':'تجربة الزوار والفعاليات', 'Libraries and Publishing':'المكتبات والنشر', 'Tourism and International Operations':'السياحة والعمليات الدولية', 'Legal and Governance':'الشؤون القانونية والحوكمة', 'Sustainability':'الاستدامة', 'Business Excellence and Quality':'التميز المؤسسي والجودة', 'Youth and Community Engagement':'إشراك الشباب والمجتمع', 'Research':'البحث' };
    const catL = (c) => ar ? CAT[c] : c;
    const COURSE = {
      C06:{ t:['The World of Curation','عالم التقييم الفني'], cat:['The World of Museums','عالم المتاحف'], min:55, img:'cf69d2b8596f972f4af9fc63c0137303', slug:'the-world-of-curation' },
      C16:{ t:['Curating an Exhibition: From Concept to Production','تنظيم المعارض: من الفكرة إلى التنفيذ'], cat:['Conservation and exhibition of artefacts','صون القطع وعرضها'], min:70, img:'403bd7970d9211d5acd7b2806550e6a7', slug:'curating-an-exhibition' },
      C05:{ t:['Sustainable Tourism','السياحة المستدامة'], cat:['Tourism Management','إدارة السياحة'], min:60, img:'d01461a3f6ad3ced258aac4713f94408', slug:'sustainable-tourism' },
      C07:{ t:['Creative Tourism: What is it?','السياحة الإبداعية'], cat:['Creative and Cultural Industries','الصناعات الثقافية والإبداعية'], min:40, img:'f1cfe235742010d5ac7c29f64fa633a0', slug:'creative-tourism' },
      C08:{ t:['Data Protection for People and Performance','حماية البيانات'], cat:['Corporate Knowledge and Compliance','المعرفة المؤسسية والامتثال'], min:30, img:'f53e39067997d52c15204d509b52dd30', slug:'data-protection' },
      C01:{ t:['DCT World','عالم الدائرة'], cat:['All about DCT','كل ما يخص الدائرة'], min:45, img:'fa500a874150b2a1769785936a6d7785', slug:'dct-world' }
    };
    const MENTORS = {
      hessa:{ id:'hessa', fem:true, ini:'HN', c:'#CD3151', name:['Dr. Hessa Al Nuaimi','د. حصة النعيمي'], first:['Dr. Hessa','د. حصة'], title:['Director, Museums Strategy','مديرة استراتيجية المتاحف'],
        cats:['Museums and Curation','Strategy and Planning'], rating:'5.0', reviews:1, sessions:1,
        next:['Wed 7 Oct · 10:00 Gulf','الأربعاء 7 أكتوبر · 10:00 بتوقيت الخليج'], avail:['Sun–Thu · 10:00–13:00 Gulf','الأحد–الخميس · 10:00–13:00 بتوقيت الخليج'], days:[0,1,2,3,4], from:10, to:13,
        langs:['Arabic, English','العربية، الإنجليزية'], linkedin:'https://www.linkedin.com/in/hessa-alnuaimi-example', courses:['C06','C16'],
        bio:['Dr. Hessa leads museum strategy at DCT Abu Dhabi, guiding how the emirate’s museums plan their collections, programmes and audiences for the long term. Over fifteen years in curation she has opened exhibitions across the region, and she enjoys helping emerging leaders turn a good idea into a well-run project.',
             'تقود د. حصة استراتيجية المتاحف في دائرة الثقافة والسياحة – أبوظبي، وتوجّه طريقة تخطيط متاحف الإمارة لمقتنياتها وبرامجها وجماهيرها على المدى الطويل. وخلال خمسة عشر عاماً في التقييم الفني أشرفت على افتتاح معارض في أنحاء المنطقة، وتحرص على مساعدة القادة الناشئين في تحويل الفكرة الجيدة إلى مشروع ناجح.'] },
      rashid:{ id:'rashid', fem:false, ini:'RB', c:'#3B2F92', name:['Rashid Al Blooshi','راشد البلوشي'], first:['Rashid','راشد'], title:['Head of Visitor Experience','رئيس تجربة الزوار'],
        cats:['Visitor Experience and Events','Tourism and International Operations'], rating:'', reviews:0, sessions:0,
        next:['Wed 7 Oct · 14:00 Gulf','الأربعاء 7 أكتوبر · 14:00 بتوقيت الخليج'], avail:['Mon, Wed · 14:00–17:00 Gulf','الإثنين، الأربعاء · 14:00–17:00 بتوقيت الخليج'], days:[1,3], from:14, to:17,
        langs:['Arabic, English','العربية، الإنجليزية'], linkedin:'https://www.linkedin.com/in/rashid-alblooshi-example', courses:['C05','C07'],
        bio:['Rashid heads visitor experience across DCT Abu Dhabi’s cultural sites, from ticketing and wayfinding to the major seasonal events. He previously ran international guest operations in hospitality and mentors colleagues who want to design experiences around what visitors really need.',
             'يرأس راشد تجربة الزوار في المواقع الثقافية التابعة لدائرة الثقافة والسياحة – أبوظبي، بدءاً من التذاكر والإرشاد داخل المواقع وصولاً إلى الفعاليات الموسمية الكبرى. وقد أدار سابقاً عمليات الضيوف الدولية في قطاع الضيافة، ويرشد الزملاء الراغبين في تصميم تجارب تنطلق من احتياجات الزوار الفعلية.'] },
      mariam:{ id:'mariam', fem:true, ini:'MK', c:'#E35E3C', name:['Mariam Khoury','مريم خوري'], first:['Mariam','مريم'], title:['Senior Manager, People & Performance','مديرة أولى، الأفراد والأداء'],
        cats:['People and Performance','Marketing and Communications'], rating:'', reviews:0, sessions:0,
        next:['Thu 8 Oct · 09:00 Gulf','الخميس 8 أكتوبر · 09:00 بتوقيت الخليج'], avail:['Tue, Thu · 09:00–12:00 Gulf','الثلاثاء، الخميس · 09:00–12:00 بتوقيت الخليج'], days:[2,4], from:9, to:12,
        langs:['Arabic, English, French','العربية، الإنجليزية، الفرنسية'], linkedin:'https://www.linkedin.com/in/mariam-khoury-example', courses:['C08','C01'],
        bio:['Mariam leads the people and performance programmes at DCT Abu Dhabi, including leadership development and internal communications. She coaches managers on giving clear, useful feedback and helps first-time team leads build confident, well-organised teams.',
             'تقود مريم برامج الأفراد والأداء في دائرة الثقافة والسياحة – أبوظبي، ومنها تطوير القيادات والاتصال الداخلي. وتدرّب المديرين على تقديم ملاحظات واضحة ومفيدة، وتساعد قادة الفرق الجدد على بناء فرق واثقة ومنظّمة.'] }
    };
    const MIDS = ['hessa','rashid','mariam'];
    const scr = this.state.screen || this.props.screen || 'form';
    if (!this.state.f) { Object.assign(this.state, this.init(scr)); }
    const f = this.state.f;
    const tried = this.state.tried;
    const setF = (o) => this.setState({ f: { ...f, ...o } });
    const t = {
      spec: L('Mentee registration','تسجيل المتدرّب'), ey: L('Elevate 2026 · Mentoring','إرتقاء 2026 · الإرشاد'), h1: L('Mentee registration','تسجيل المتدرّب'),
      sub: L('Four questions so we can match you with the right mentor. It takes about 3 minutes.','أربعة أسئلة لنطابقك مع المرشد المناسب، وتستغرق نحو 3 دقائق.'), progress: L('Mentoring steps','خطوات الإرشاد'),
      s1: L('Register','التسجيل'), s2: L('Match','المطابقة'), s3: L('Book','الحجز'),
      formTitle: L('About you','عنك'), reqNote: L('* required','* حقل مطلوب'),
      preH: L('You registered on 20 Sep 2026','سجّلت في 20 سبتمبر 2026'), preP: L('Update your answers any time — your match stays the same unless you re-run matching.','يمكنك تحديث إجاباتك في أي وقت، وتبقى المطابقة كما هي ما لم تُعد تشغيلها.'),
      goals: L('What do you want to achieve in Elevate 2026?','ما الذي تريد تحقيقه في إرتقاء 2026؟'), goalsHint: L('One or two goals for the next 6 months. Your mentor will see this.','هدف أو هدفان للأشهر الستة القادمة، وسيطّلع عليه مرشدك.'),
      goalsPh: L('e.g. Lead a small exhibition project by Q2 2027','مثال: قيادة مشروع معرض صغير بحلول الربع الثاني 2027'),
      years: L('How long have you worked at DCT Abu Dhabi?','منذ متى تعمل في دائرة الثقافة والسياحة – أبوظبي؟'), yErr: L('Choose how long you have worked at DCT.','اختر مدة عملك في الدائرة.'),
      areas: L('Which areas would you like mentoring in?','في أي المجالات تريد الإرشاد؟'), lang: L('Preferred session language','لغة الجلسات المفضلة'), lErr: L('Choose a session language.','اختر لغة الجلسات.'),
      cancel: L('Cancel','إلغاء'), okTitle: L('Registration','التسجيل'), complete: L('Complete','مكتمل'),
      okH: L('You’re registered as a mentee','تم تسجيلك كمتدرّب'), okP: L('Next, see which mentors fit your answers best. Matching takes a few seconds.','الخطوة التالية: اعرف أي المرشدين يناسبون إجاباتك، وتستغرق المطابقة ثوانيَ معدودة.'),
      sumGoals: L('Goals','الأهداف'), sumYears: L('Years at DCT','سنوات الخدمة'), sumAreas: L('Preferred areas','المجالات المفضلة'), sumLang: L('Language','اللغة'),
      findMatch: L('Find my mentor match','اعثر على مرشدي'), edit: L('Edit answers','تعديل الإجابات'),
      nxTitle: L('What happens next','ماذا بعد'), toast: L('Registration saved','تم حفظ التسجيل'),
      privacy: L('Your answers are shared with the matching service and your chosen mentor only. Contact details are never shown to mentors.','تُشارك إجاباتك مع خدمة المطابقة والمرشد الذي تختاره فقط، ولا تظهر بيانات التواصل للمرشدين أبداً.')
    };
    const sh = this.shell(ar, 'learner', 'mentoring', 'elevate', [ { label: L('Elevate 2026','إرتقاء 2026'), href:'/elevate/dashboard' }, { label: L('Mentoring','الإرشاد'), href:'/elevate/mentoring' }, { label: L('Registration','التسجيل') } ]);
    const YEARS = [['', 'Choose…','اختر…'], ['lt1','Less than 1 year','أقل من سنة'], ['1-3','1–3 years','1–3 سنوات'], ['3-5','3–5 years','3–5 سنوات'], ['5-10','5–10 years','5–10 سنوات'], ['10+','More than 10 years','أكثر من 10 سنوات']];
    const LANGS = [['en','English','الإنجليزية','Sessions in English','الجلسات بالإنجليزية'], ['ar','Arabic','العربية','Sessions in Arabic','الجلسات بالعربية'], ['both','Both','كلتاهما','Arabic and English','العربية والإنجليزية']];
    const gLen = f.goals.trim().length;
    const gBad = tried && gLen < 20;
    const yBad = tried && !f.years;
    const aBad = (tried && f.areas.length === 0) || f.areas.length > 3;
    const lBad = tried && !f.lang;
    const gMsg = gLen === 0 ? L('Tell us at least one goal.','اكتب هدفاً واحداً على الأقل.') : L('Add a little more detail (at least 20 characters).','أضف مزيداً من التفاصيل (20 حرفاً على الأقل).');
    const aMsg = f.areas.length > 3 ? L('Choose up to 3 areas — untick one to continue.','اختر 3 مجالات كحدّ أقصى، وألغِ تحديد واحد للمتابعة.') : L('Choose at least one area.','اختر مجالاً واحداً على الأقل.');
    const errs = [];
    if (gBad) errs.push({ msg: gMsg, href:'#f-goals' });
    if (yBad) errs.push({ msg: t.yErr, href:'#f-years' });
    if (aBad) errs.push({ msg: aMsg, href:'#f-areas' });
    if (lBad) errs.push({ msg: t.lErr, href:'#f-lang' });
    const valid = gLen >= 20 && f.years && f.areas.length >= 1 && f.areas.length <= 3 && f.lang;
    const areaOpts = Object.keys(CAT).map(c => ({ l: catL(c), on: f.areas.indexOf(c) >= 0, tog: () => setF({ areas: f.areas.indexOf(c) >= 0 ? f.areas.filter(x => x !== c) : f.areas.concat([c]) }) }));
    const submit = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!valid) { this.setState({ tried:true }); return; }
      this.setState({ busy:true, tried:true });
      clearTimeout(this.tm); this.tm = setTimeout(() => { this.setState({ busy:false, done:true, toast:true }); clearTimeout(this.tt); this.tt = setTimeout(() => this.setState({ toast:false }), 2600); }, 1100);
    };
    const yearsLabel = (YEARS.filter(y => y[0] === f.years)[0] || YEARS[0]);
    const langLabel = (LANGS.filter(x => x[0] === f.lang)[0] || LANGS[2]);
    const nx = [
      { h:L('AI suggests mentors','يقترح الذكاء الاصطناعي مرشدين'), p:L('Ranked by area overlap, language and availability, with reasons.','مرتّبون حسب تطابق المجالات واللغة والتوفر، مع ذكر الأسباب.') },
      { h:L('You choose — allocated at once','تختار أنت، ويتم التخصيص فوراً'), p:L('No waiting for approval; your mentor is notified by e-mail.','لا حاجة لانتظار الموافقة، ويُبلَّغ مرشدك بالبريد الإلكتروني.') },
      { h:L('Book your first 60-minute session','احجز جلستك الأولى (60 دقيقة)'), p:L('Pick a free slot from your mentor’s weekly calendar.','اختر موعداً متاحاً من تقويم مرشدك الأسبوعي.') }
    ];
    const pick = (v) => { clearTimeout(this.tm); this.setState({ screen:v, ...this.init(v), toast:false }); };
    return { ...base, t, sh, f, nx,
      specName: t.spec, route: '/elevate/mentoring/register',
      showForm: !this.state.done, done: this.state.done, prefilled: scr === 'prefilled' && !this.state.done,
      gBad, yBad, aBad, lBad, gMsg, aMsg, gCls: gBad ? 'is-error' : (gLen >= 20 ? 'is-valid' : ''), yCls: yBad ? 'is-error' : '', aCls: aBad ? 'bad' : '',
      gCount: fmt(f.goals.length) + ' / 1,000', areasHint: L('Choose 1 to 3 · ' + f.areas.length + ' selected','اختر من 1 إلى 3 · المحدد ' + f.areas.length),
      hasErr: errs.length > 0 && tried, errList: errs, errTitle: L('Please fix ' + errs.length + (errs.length === 1 ? ' answer' : ' answers') + ' before you submit','يرجى تصحيح ' + errs.length + ' من الإجابات قبل الإرسال'),
      yearOpts: YEARS.map(y => ({ v:y[0], l:L(y[1], y[2]) })), langOpts: LANGS.map(x => ({ l:L(x[1], x[2]), d:L(x[3], x[4]), on: f.lang === x[0], pick: () => setF({ lang:x[0] }) })), areaOpts,
      onGoals: (e) => setF({ goals: e.target.value }), onYears: (e) => setF({ years: e.target.value }),
      submit, busyCls: this.state.busy ? 'is-loading' : '', busyAria: this.state.busy ? 'true' : 'false', submitLbl: scr === 'prefilled' ? L('Save answers','حفظ الإجابات') : L('Submit registration','إرسال التسجيل'),
      yearsLabel: L(yearsLabel[1], yearsLabel[2]), langLabel: L(langLabel[3], langLabel[4]), areasLabel: f.areas.map(catL).join(ar ? '، ' : ', '),
      edit: () => this.setState({ done:false, screen:'prefilled' }), toast: !!this.state.toast,
      segs: [ this.seg('State', scr, [['form','Empty'],['errors','Errors'],['prefilled','Prefilled (Saeed)'],['success','Success']], pick) ]
    };
  }
}
