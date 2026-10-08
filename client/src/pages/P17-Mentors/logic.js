// Ported verbatim from the Claude Design artboard P17-Mentors (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, screen:null, q:'', cat:'all' }; }

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
    const screen = this.state.screen || this.props.screen || 'matched';
    const reg = screen === 'matched';
    const t = {
      spec: L('Mentoring','الإرشاد'), ey: L('Elevate 2026 · Mentoring','إرتقاء 2026 · الإرشاد'), h1: L('Mentoring','الإرشاد'),
      sub: L('Find the right mentor, book 60-minute sessions and grow with a clear goal.','اعثر على المرشد المناسب، واحجز جلسات مدتها 60 دقيقة، وتقدّم نحو هدف واضح.'),
      reviewMatch: L('Review my match','مراجعة المطابقة'), book: L('Book a session','احجز جلسة'), register: L('Register as a mentee','سجّل كمتدرّب'),
      stripLabel: L('Your mentoring progress','تقدّمك في الإرشاد'),
      dirEy: L('3 mentors in Elevate','3 مرشدين في إرتقاء'), dirTitle: L('Mentor directory','دليل المرشدين'), searchLbl: L('Search mentors','ابحث عن مرشد'), searchPh: L('Search by name, role or area','ابحث بالاسم أو المنصب أو المجال'), catLbl: L('Filter by category','التصفية حسب المجال'),
      yours: L('Your mentor','مرشدتك'), rating: L('Rating','التقييم'), sessions: L('Sessions held','الجلسات المنعقدة'), nextFree: L('Next free slot','أقرب موعد متاح'), profile: L('View profile','عرض الملف'), bookShort: L('Book','احجز'),
      emptyH: L('No mentors match these filters','لا يوجد مرشدون يطابقون هذه التصفية'), emptyP: L('Try another category or clear the search.','جرّب مجالاً آخر أو امسح البحث.'), clear: L('Clear filters','مسح التصفية'),
      howTitle: L('How mentoring works','كيف يعمل الإرشاد'), howSub: L('6 sessions · 60 min each','6 جلسات · 60 دقيقة لكل جلسة'),
      psTitle: L('Programme calendar','تقويم البرنامج'), psAll: L('All sessions','كل الجلسات'), oct: L('Oct','أكتوبر'), upcoming: L('Upcoming','قادمة'),
      koTitle: L('Mentoring Kick-off Session','جلسة انطلاق الإرشاد'), koWhen: L('Thursday · 10:00–11:00 Gulf · Zoom','الخميس · 10:00–11:00 بتوقيت الخليج · Zoom'),
      s2Title: L('Session 2 with Dr. Hessa','الجلسة 2 مع د. حصة'), s2When: L('Monday · 11:00–12:00 Gulf · Session room','الإثنين · 11:00–12:00 بتوقيت الخليج · غرفة الجلسة'), room: L('Session room','غرفة الجلسة'),
      privacy: L('Mentors see your name, goals and session notes only — never your e-mail or phone number.','يرى المرشدون اسمك وأهدافك وملاحظات الجلسات فقط، ولا يرون بريدك الإلكتروني أو رقم هاتفك أبداً.')
    };
    const sh = this.shell(ar, 'learner', 'mentoring', 'elevate', [ { label: L('Elevate 2026','إرتقاء 2026'), href:'/elevate/dashboard' }, { label: L('Mentoring','الإرشاد') } ]);
    const steps = reg ? [
      { k:L('Step 1 · Registered','الخطوة 1 · التسجيل'), sr:L(' (done)',' (مكتملة)'), h:L('Mentee profile complete','ملف المتدرّب مكتمل'), s:L('Submitted 20 Sep 2026 · goals, areas, language','أُرسل في 20 سبتمبر 2026 · الأهداف والمجالات واللغة'), cta:L('Edit answers','تعديل الإجابات'), href:'/elevate/mentoring/register', cls:'done', done:true, cur:'false' },
      { k:L('Step 2 · Matched','الخطوة 2 · المطابقة'), sr:L(' (done)',' (مكتملة)'), h:L('Matched with Dr. Hessa','تمت مطابقتك مع د. حصة'), s:L('87 % match · ranked by AI · Museums and Curation','تطابق 87% · ترتيب بالذكاء الاصطناعي · المتاحف والتقييم الفني'), cta:L('Mentor profile','ملف المرشدة'), href:'/elevate/mentoring/mentor/hessa', cls:'done', done:true, cur:'false' },
      { k:L('Next session','الجلسة القادمة'), sr:'', h:L('Mon 12 Oct · 11:00–12:00 Gulf','الإثنين 12 أكتوبر · 11:00–12:00 بتوقيت الخليج'), s:L('Session 2 of 6 · confirmed · room opens 10:50','الجلسة 2 من 6 · مؤكدة · تفتح الغرفة 10:50'), cta:L('Open session room','افتح غرفة الجلسة'), href:'/mentoring/session/B2', cls:'cur', done:false, cur:'step' }
    ] : [
      { k:L('Step 1 · Register','الخطوة 1 · التسجيل'), sr:'', h:L('Tell us about your goals','أخبرنا عن أهدافك'), s:L('4 questions · about 3 minutes','4 أسئلة · نحو 3 دقائق'), cta:L('Start registration','ابدأ التسجيل'), href:'/elevate/mentoring/register', cls:'cur', done:false, cur:'step' },
      { k:L('Step 2 · Match','الخطوة 2 · المطابقة'), sr:L(' (locked)',' (مقفلة)'), h:L('Get your mentor match','احصل على مرشدك'), s:L('AI suggests mentors with a score and reasons','يقترح الذكاء الاصطناعي مرشدين مع نسبة التطابق وأسبابها'), cta:'', href:'', cls:'lock', done:false, cur:'false' },
      { k:L('Step 3 · Book','الخطوة 3 · الحجز'), sr:L(' (locked)',' (مقفلة)'), h:L('Book your first session','احجز جلستك الأولى'), s:L('60-minute slots from your mentor’s calendar','مواعيد مدتها 60 دقيقة من تقويم مرشدك'), cta:'', href:'', cls:'lock', done:false, cur:'false' }
    ];
    const q = (this.state.q || '').trim().toLowerCase();
    const cat = this.state.cat;
    const allCats = [];
    MIDS.forEach(id => MENTORS[id].cats.forEach(c => { if (allCats.indexOf(c) < 0) allCats.push(c); }));
    const match = (m, c) => (c === 'all' || m.cats.indexOf(c) >= 0) && (!q || [m.name[0], m.name[1], m.title[0], m.title[1]].concat(m.cats, m.cats.map(x => CAT[x])).join(' ').toLowerCase().indexOf(q) >= 0);
    const chips = [['all', L('All areas','كل المجالات')]].concat(allCats.map(c => [c, catL(c)])).map(x => {
      const n = MIDS.filter(id => match(MENTORS[id], x[0])).length;
      return { label:x[1], n: String(n), cls: cat === x[0] ? 'on' : '', on: cat === x[0] ? 'true' : 'false', pick: () => this.setState({ cat:x[0] }) };
    });
    const shown = MIDS.map(id => MENTORS[id]).filter(m => match(m, cat)).map(m => ({
      hid:'m-'+m.id, ini:m.ini, c:m.c, name:L(m.name[0], m.name[1]), title:L(m.title[0], m.title[1]), mine: reg && m.id === 'hessa',
      cats: m.cats.map(c => ({ l:catL(c) })), hasRating: !!m.rating, rating: m.rating ? m.rating + L(' · 1 review',' · تقييم واحد') : L('New mentor','مرشد جديد'),
      sessions: fmt(m.sessions), next: L(m.next[0], m.next[1]), href:'/elevate/mentoring/mentor/' + m.id
    }));
    const how = [
      { h:L('Register','سجّل'), p:L('Share your goals, years at DCT, preferred areas and language.','شارك أهدافك وسنوات خدمتك والمجالات المفضلة واللغة.'), cta:L('Registration form','نموذج التسجيل'), href:'/elevate/mentoring/register' },
      { h:L('Get matched','احصل على المطابقة'), p:L('AI ranks mentors and explains why; you choose and you’re allocated at once.','يرتّب الذكاء الاصطناعي المرشدين ويشرح السبب، فتختار ويتم التخصيص فوراً.'), cta:L('Mentor match','مطابقة المرشد'), href:'/elevate/mentoring/match' },
      { h:L('Book 60-minute sessions','احجز جلسات من 60 دقيقة'), p:L('Pick a free slot from your mentor’s weekly availability.','اختر موعداً متاحاً من جدول مرشدك الأسبوعي.'), cta:L('Book a session','احجز جلسة'), href:'/elevate/mentoring/book' },
      { h:L('Meet and reflect','التقِ وتأمّل'), p:L('Join the video room, then rate the session. Your mentor keeps a GROW log.','انضم إلى غرفة الفيديو ثم قيّم الجلسة، ويحتفظ مرشدك بسجل GROW.'), cta:L('Session room','غرفة الجلسة'), href:'/mentoring/session/B2' }
    ];
    return { ...base, t, sh, steps, chips, shown, how, reg, notReg: !reg,
      specName: t.spec, route: '/elevate/mentoring',
      hasShown: shown.length > 0, noneShown: shown.length === 0,
      countMsg: L('Showing ' + shown.length + ' of 3 mentors', 'عرض ' + shown.length + ' من 3 مرشدين'),
      q: this.state.q, onQ: (e) => this.setState({ q: e.target.value }), clear: () => this.setState({ q:'', cat:'all' }),
      segs: [ this.seg('State', screen, [['matched','Registered + matched'],['new','Not registered']], v => this.setState({ screen:v })) ]
    };
  }
}
