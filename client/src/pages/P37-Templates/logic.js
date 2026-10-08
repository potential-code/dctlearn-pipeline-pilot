// Ported verbatim from the Claude Design artboard P37-Templates (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = {"locale": null, "preview": null, "cat": "all", "dev": "desktop", "toastMsg": ""}; }

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

    const pvId = st('preview') || 'none';
    const cat = this.state.cat || 'all';
    const dev = this.state.dev || 'desktop';
    const t = ar ? {
      spec:'قوالب الصفحات التعريفية', ey:'المنصة', h1:'قوالب الصفحات التعريفية', sub:'نقطة البداية لكل موقع مصغّر جديد. يختار المسؤول القالب، ثم يحرّر المشرف الفرعي النصوص والصور وينشر.', ms:'المواقع المصغّرة', create:'إنشاء موقع مصغّر',
      catLbl:'النوع', usedBy:'مستخدم في:', none:'لا يوجد بعد', preview:'معاينة', use:'استخدم القالب', tplPrev:'معاينة القالب', device:'الجهاز', close:'إغلاق', sections:'الأقسام', editable:'كل الأقسام قابلة للتحرير بالعربية والإنجليزية ويمكن إخفاؤها.', useThis:'استخدم هذا القالب'
    } : {
      spec:'Landing templates', ey:'Platform', h1:'Landing templates', sub:'The starting point for every new microsite. The admin picks a template; the sub admin edits copy and images, then publishes.', ms:'Microsites', create:'Create microsite',
      catLbl:'Type', usedBy:'Used by', none:'Not used yet', preview:'Preview', use:'Use template', tplPrev:'Template preview', device:'Device', close:'Close', sections:'Sections', editable:'Every section is editable in English and Arabic and can be hidden.', useThis:'Use this template'
    };
    const SEC = { hero:[L('Hero','الواجهة'),L('Image, heading, subheading, call to action','صورة وعنوان ونص ودعوة لاتخاذ إجراء')], popup:[L('Popup','نافذة منبثقة'),L('Image, text and a button — e.g. registration open','صورة ونص وزر — مثل فتح التسجيل')], cards:[L('Course cards','بطاقات الدورات'),L('Featured courses from the microsite','دورات مختارة من الموقع')],
      path:[L('Learning path','المسار التعليمي'),L('Numbered mandatory steps','خطوات إلزامية مرقّمة')], ment:[L('Mentors','المرشدون'),L('Mentor pool highlights','أبرز المرشدين')], cd:[L('Countdown & rules','العدّ التنازلي والقواعد'),L('Round deadline and how to take part','موعد الجولة وطريقة المشاركة')],
      story:[L('Story','القصة'),L('Image with a short text block','صورة مع نص قصير')], form:[L('Form','نموذج'),L('Register interest or sign up','تسجيل الاهتمام أو الانضمام')], ptn:[L('Partners','الشركاء'),L('Partner logos','شعارات الشركاء')] };
    const C = (k, img) => ({ t:crs(k), img:B(img) });
    const TP = [
      { id:'programme', cat:'learn', n:L('Programme','برنامج'), d:L('A learning programme with featured courses and partner logos.','برنامج تعليمي مع دورات مختارة وشعارات الشركاء.'), secs:['hero','cards','ptn'], used:['employees','nibras'], ac:'#EE3E43', img:'92c83a667e1befe5661dab8c7ebca349',
        ey:L('DCT Employees','موظفو الدائرة'), h:L('Learn, grow and lead at DCT','تعلّم وتطوّر وكن قائداً في الدائرة'), p:L('Courses built for every sector of the department.','دورات مصمّمة لكل قطاعات الدائرة.'), cta:L('Sign in','تسجيل الدخول'), cl:[C('C01','fa500a874150b2a1769785936a6d7785'),C('C02','d99ea09adede7395461223b429f24cf4'),C('C04','592272d2d94f43d123cbcdda07b02178')] },
      { id:'mentorship', cat:'engage', n:L('Mentorship','إرشاد'), d:L('A mentoring programme: popup for registration, mentor highlights and partners.','برنامج إرشاد: نافذة للتسجيل وأبرز المرشدين والشركاء.'), secs:['hero','popup','ment','ptn'], used:['elevate'], ac:'#CD3151', img:'9842ff4b5522772462642e07bfb6d8c1',
        ey:L('Elevate 2026','إرتقاء 2026'), h:L('Are you ready to accelerate your growth and career at DCT Abu Dhabi?','هل أنت مستعد لتسريع نموك ومسيرتك المهنية في دائرة الثقافة والسياحة؟'), p:L('Six sessions with a mentor matched to your goals.','ست جلسات مع مرشد يناسب أهدافك.'), cta:L('Sign in','تسجيل الدخول') },
      { id:'onboarding', cat:'learn', n:L('Onboarding','تأهيل'), d:L('A mandatory path for new staff, with courses and resources.','مسار إلزامي للموظفين الجدد مع الدورات والموارد.'), secs:['hero','path','cards'], used:['znm','museopro'], ac:'#3B2F92', img:'6a330c17598da2f1e81b82711e1c5e9a',
        ey:L('Zayed National Museum','متحف زايد الوطني'), h:L('Welcome to the onboarding programme of Zayed National Museum','مرحباً بك في برنامج التأهيل لمتحف زايد الوطني'), p:L('Four steps before your first day on the floor.','أربع خطوات قبل يومك الأول.'), cta:L('Start onboarding','ابدأ التأهيل'), cl:[C('C09','91fa1af72d1e01df9c41fd3bfd8dc824'),C('C02','d99ea09adede7395461223b429f24cf4'),C('C01','fa500a874150b2a1769785936a6d7785')] },
      { id:'competition', cat:'engage', n:L('Competition','مسابقة'), d:L('A challenge with a countdown, rules and the competition course.','تحدٍّ مع عدّ تنازلي وقواعد ودورة المسابقة.'), secs:['hero','cd','cards'], used:['zu'], ac:'#F7C337', acf:'#1D1650', img:'006f6b748b68e46ce2d045fcc3d92aea',
        ey:L('Zayed University','جامعة زايد'), h:L('The 24-Hour Challenge','تحدي 24 ساعة'), p:L('Pitch a heritage idea in one day. Judged by DCT experts.','قدّم فكرة تراثية في يوم واحد يحكّمها خبراء الدائرة.'), cta:L('Sign in to take part','سجّل الدخول للمشاركة'), cl:[C('C13','f53e39067997d52c15204d509b52dd30'),C('C04','592272d2d94f43d123cbcdda07b02178'),C('C22','d87a92b0c7b42fcdfdc06b70145ff332')] },
      { id:'forum', cat:'engage', n:L('Open forum','منتدى مفتوح'), d:L('An open community anyone can join, with a short programme of courses.','مجتمع مفتوح للجميع مع برنامج قصير من الدورات.'), secs:['hero','cards','form'], used:['chkforum'], ac:'#6D7782', img:'a39ca3b3c0fdaf9dcd07000a3da4c090',
        ey:L('Heritage Forum','منتدى التراث'), h:L('Cultural Heritage & Knowledge Development Forum','منتدى التراث الثقافي وتطوير المعرفة'), p:L('Open to everyone working in heritage.','مفتوح لكل العاملين في التراث.'), cta:L('Join the forum','انضم إلى المنتدى'), cl:[C('C22','d87a92b0c7b42fcdfdc06b70145ff332'),C('C04','592272d2d94f43d123cbcdda07b02178'),C('C07','f1cfe235742010d5ac7c29f64fa633a0')] },
      { id:'interest', cat:'lo', n:L('Landing-only interest','اهتمام — صفحة فقط'), d:L('A single page with a story and a register-interest form. No learner area.','صفحة واحدة مع قصة ونموذج تسجيل اهتمام، بلا مساحة للمتعلّمين.'), secs:['hero','story','form'], used:['ruwaad','csmd'], ac:'#F77860', acf:'#1D1650', img:'3e5eadfa4450ed50cc8f8900fdc8e3e3',
        ey:L('Ruwaad','رواد'), h:L('Careers in Hospitality','مسارات مهنية في الضيافة'), p:L('Tell us you’re interested and we’ll be in touch.','سجّل اهتمامك وسنتواصل معك.'), cta:L('Register interest','سجّل اهتمامك') }
    ];
    const comp = (x) => ({ ac:x.ac, acf:x.acf || '#FFFFFF', img:B(x.img), img2:B('880a72d5794fad0ac73793c03f37c852'), ey:x.ey, h:x.h, p:x.p, cta:x.cta,
      popup: x.secs.includes('popup'), popT:L('Mentee registration is open','تسجيل المتدرّبين مفتوح'), popB:L('Register','سجّل الآن'),
      path: x.secs.includes('path'), pathT:L('Your onboarding path','مسار التأهيل'), steps:[L('Ticketing','التذاكر'),L('Induction','التعريف'),L('Your role','دورك'),L('Assessment','التقييم')],
      cards: x.secs.includes('cards'), cardsT:L('Featured courses','دورات مختارة'), cl: x.cl || [],
      ment: x.secs.includes('ment'), mentT:L('Meet the mentors','تعرّف على المرشدين'), ml:[L('Dr. Hessa Al Nuaimi','د. حصة النعيمي'),L('Rashid Al Blooshi','راشد البلوشي'),L('Mariam Khoury','مريم خوري')],
      cd: x.secs.includes('cd'), cdT:L('Round closes 20 Oct','تُغلق الجولة في 20 أكتوبر'), cdl:[{ v:'14', u:L('days','يوماً') },{ v:'06', u:L('hours','ساعات') },{ v:'22', u:L('min','دقيقة') }],
      story: x.secs.includes('story'), storyT:L('Build a career in Abu Dhabi’s hotels','ابنِ مسيرتك في فنادق أبوظبي'),
      form: x.secs.includes('form'), formT: x.id === 'forum' ? L('Join in two minutes','انضم في دقيقتين') : L('Register your interest','سجّل اهتمامك'), f1:L('Full name','الاسم الكامل'), f2:L('E-mail','البريد الإلكتروني'), formB: x.id === 'forum' ? L('Join','انضم') : L('Send','إرسال'),
      ptn: x.secs.includes('ptn') });
    const list = TP.filter(x => cat === 'all' || x.cat === cat);
    const cards = list.map(x => ({ hid:'tp-' + x.id, n:x.n, d:x.d, v:comp(x), secs: x.secs.map(s => SEC[s][0]), used: x.used.map(u => ({ n:msShort(u), c:MSI[u].c, bd: u === 'csmd' ? 'edge' : '' })), unused: x.used.length === 0,
      useTag: x.used.length ? fmt(x.used.length) + L(' in use',' قيد الاستخدام') : L('Unused','غير مستخدم'), useCls: x.used.length ? 'ok' : 'mut', open: () => S({ preview:x.id, dev:'desktop' }), prevL: t.preview + ': ' + x.n, useL: t.use + ': ' + x.n }));
    const px = TP.find(x => x.id === pvId);
    const p = px ? { n:px.n, d:px.d, v:comp(px), secD: px.secs.map(s => ({ n:SEC[s][0], d:SEC[s][1] })) } : { n:'', d:'', v:comp(TP[0]), secD:[] };
    const sh = this.shell(ar, 'admin', 'templates', null, [ { label:L('Admin','الإدارة'), href:'/admin' }, { label:L('Landing templates','قوالب الصفحات') } ]);
    const closePv = () => S({ preview:'none' });
    return Object.assign(base, {
      t, sh, route:'/admin/templates', cards, p, hasPv: !!px, closePv, bgClose: (e) => { if (e.target === e.currentTarget) closePv(); },
      countTxt: fmt(list.length) + L(' templates',' قوالب'),
      cats: [['all',L('All','الكل')],['learn',L('Learning programmes','برامج تعليمية')],['engage',L('Mentoring & competitions','إرشاد ومسابقات')],['lo',L('Landing-only','صفحة تعريفية فقط')]].map(c => ({ label:c[1], cls: c[0] === cat ? 'on' : '', on: c[0] === cat, pick: () => S({ cat:c[0] }) })),
      devs: [['desktop',L('Desktop','سطح المكتب')],['mobile',L('Mobile','الجوال')]].map(d => ({ l:d[1], on: d[0] === dev, pick: () => S({ dev:d[0] }) })), stageCls: dev === 'mobile' ? 'mob' : '',
      specSegs: [ seg('Preview','preview',[['none','Gallery'],['mentorship','Preview: Mentorship'],['competition','Preview: Competition']], { dev:'desktop' }) ]
    });
  }

}
