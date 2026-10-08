// Ported verbatim from the Claude Design artboard P18-MentorProfile (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, mentor:null, dlg:false }; }

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
    const id = this.state.mentor || this.props.mentor || 'hessa';
    const M = MENTORS[id] || MENTORS.hessa;
    const mine = M.id === 'hessa';
    const DESC = {
      'Museums and Curation':['Collections, exhibitions and interpretation.','المقتنيات والمعارض والتفسير.'], 'Strategy and Planning':['Long-term plans, priorities and business cases.','الخطط طويلة المدى والأولويات ودراسات الجدوى.'],
      'Visitor Experience and Events':['Journeys, service design and seasonal events.','رحلة الزائر وتصميم الخدمة والفعاليات الموسمية.'], 'Tourism and International Operations':['Destination partners and global guest operations.','شركاء الوجهة وعمليات الضيوف الدولية.'],
      'People and Performance':['Feedback, goals and growing as a team lead.','الملاحظات والأهداف والنمو كقائد فريق.'], 'Marketing and Communications':['Clear messages for staff and audiences.','رسائل واضحة للموظفين والجمهور.']
    };
    const t = {
      spec: L('Mentor profile','ملف المرشد'), ey: L('Mentor · Elevate 2026','مرشد · إرتقاء 2026'), matched: L('Your mentor · 87 % match','مرشدتك · تطابق 87%'),
      linkedin: L('LinkedIn','لينكدإن'), linkedinFull: L('View LinkedIn profile','عرض الملف على لينكدإن'), newTab: L(' (opens in a new tab)',' (يفتح في علامة تبويب جديدة)'), book: L('Book a session','احجز جلسة'),
      about: L('About','نبذة'), bioLang: L('Bio in English and Arabic','نبذة بالعربية والإنجليزية'), otherBio: L('بالعربية:','In English:'), areas: L('Mentoring areas','مجالات الإرشاد'),
      coEy: L('Recommended by this mentor','يوصي بها المرشد'), courses: L('Related courses','دورات ذات صلة'), avail: L('Availability','أوقات التوفر'), weekly: L('Weekly, Gulf time (UTC+4)','أسبوعياً، بتوقيت الخليج (UTC+4)'),
      nextFree: L('Next free slot','أقرب موعد متاح'), slotNote: L('Sessions are 60 minutes on Zoom inside DCT Learn. Cancel up to 2 hours before the start.','الجلسات مدتها 60 دقيقة عبر Zoom داخل DCT Learn، ويمكن الإلغاء حتى ساعتين قبل البدء.'),
      glance: L('At a glance','لمحة سريعة'), rating: L('Rating','التقييم'), sessions: L('Sessions held','الجلسات المنعقدة'), langs: L('Languages','اللغات'), programme: L('Programmes','البرامج'),
      privacy: L('E-mail and phone stay private. You meet your mentor in booked sessions and the session room.','يبقى البريد الإلكتروني والهاتف خاصّين، وتلتقي بمرشدك في الجلسات المحجوزة وغرفة الجلسة.'),
      back: L('Back to mentoring','العودة إلى الإرشاد'), dlgEy: L('Booking','الحجز'), dlgH: L('Sessions are booked with your matched mentor','تُحجز الجلسات مع المرشد الذي تمت مطابقتك معه'),
      dlgNote: L('Want a different mentor? Review your AI match — choosing someone else reallocates you at once.','تريد مرشداً آخر؟ راجع نتائج المطابقة، فاختيار مرشد آخر يعيد التخصيص فوراً.'), close: L('Close','إغلاق'), reviewMatch: L('Review my match','مراجعة المطابقة')
    };
    const sh = this.shell(ar, 'learner', 'mentoring', 'elevate', [ { label: L('Elevate 2026','إرتقاء 2026'), href:'/elevate/dashboard' }, { label: L('Mentoring','الإرشاد'), href:'/elevate/mentoring' }, { label: L(M.name[0], M.name[1]) } ]);
    const m = { c:M.c, ini:M.ini, name:L(M.name[0], M.name[1]), title:L(M.title[0], M.title[1]), linkedin:M.linkedin,
      cats: M.cats.map(c => ({ l:catL(c), d: L(DESC[c][0], DESC[c][1]) })), bio: L(M.bio[0], M.bio[1]), bioOther: ar ? M.bio[0] : M.bio[1],
      avail: L(M.avail[0], M.avail[1]), next: L(M.next[0], M.next[1]), rating: M.rating ? M.rating + L(' / 5 · 1 review',' / 5 · تقييم واحد') : L('New — no reviews yet','جديد — لا تقييمات بعد'),
      sessions: fmt(M.sessions), langs: L(M.langs[0], M.langs[1]), sites: M.id === 'mariam' ? L('Elevate 2026, DCT Employees','إرتقاء 2026، موظفو الدائرة') : L('Elevate 2026','إرتقاء 2026') };
    const DAYS = [['Sun','الأحد'],['Mon','الإثنين'],['Tue','الثلاثاء'],['Wed','الأربعاء'],['Thu','الخميس'],['Fri','الجمعة'],['Sat','السبت']];
    const week = DAYS.map((d, i) => { const on = M.days.indexOf(i) >= 0; return { l: L(d[0], d[1]), on, cls: on ? '' : 'off', s: ((M.from - 8) * 10) + '%', w: ((M.to - M.from) * 10) + '%' }; });
    const courses = M.courses.map(k => { const c = COURSE[k]; return { title:L(c.t[0], c.t[1]), cat:L(c.cat[0], c.cat[1]), min: L(c.min + ' min', c.min + ' دقيقة'), cert: L('Certificate','شهادة'), img:B(c.img), href:'/employees/learn/' + c.slug }; });
    return { ...base, t, sh, m, week, courses, mine, notMine: !mine,
      specName: t.spec + ' · ' + L(M.name[0], M.name[1]), route: '/elevate/mentoring/mentor/' + M.id,
      otherLang: ar ? 'en' : 'ar', otherDir: ar ? 'ltr' : 'rtl',
      wkAria: L('Available ' + M.avail[0], 'متاح ' + M.avail[1]),
      dlgP: L('You’re matched with Dr. Hessa Al Nuaimi, so your sessions are booked from her calendar. ' + M.name[0] + ' isn’t your mentor in Elevate 2026.', 'تمت مطابقتك مع د. حصة النعيمي، لذا تُحجز جلساتك من تقويمها. ' + M.name[1] + (M.id === 'mariam' ? ' ليست مرشدتك في إرتقاء 2026.' : ' ليس مرشدك في إرتقاء 2026.')),
      dlg: this.state.dlg, openDlg: () => this.setState({ dlg:true }), closeDlg: () => this.setState({ dlg:false }), stop: (e) => e.stopPropagation(),
      segs: [ this.seg('Mentor', M.id, [['hessa','Hessa'],['rashid','Rashid'],['mariam','Mariam']], v => this.setState({ mentor:v, dlg:false })), this.seg('Dialog', this.state.dlg ? 'on' : 'off', [['off','—'],['on','Book (not matched)']], v => this.setState({ dlg: v === 'on', mentor: v === 'on' && M.id === 'hessa' ? 'rashid' : this.state.mentor })) ]
    };
  }
}
