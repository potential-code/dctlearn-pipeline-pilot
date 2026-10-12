// client: hand-edited (workshops default to Past when nothing is upcoming; the section tabs are
// dropped because the sidebar already lists every hub section, so filters reset on route change)
// Ported verbatim from the Claude Design artboard P52-Hub (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, site:null, tab:null, q:'', cat:'all', st:'all', sort:'mand', mand:null, when:null, mcat:'all', type:'all', notified:{}, toast:'' }; }

  /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  flash(msg){ this.setState({ toast: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast:'' }), 2600); }
  componentDidUpdate(prev){ if (prev.tab !== this.props.tab || prev.site !== this.props.site) this.setState(this.reset()); }
  reset(){ return { q:'', cat:'all', st:'all', sort:'mand', mand:null, when:null, mcat:'all', type:'all' }; }

  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const site = this.state.site || this.props.site || 'employees';
    const L = (en, a) => ar ? a : en;
    const B = (id) => '/_blob/' + id;
    const fmt = (n) => Number(n).toLocaleString(ar ? 'ar-AE' : 'en-US');
    const ALLT = { employees:['courses','workshops','mentors','ai_coaches','ai_tools'], elevate:['mentors','workshops'], znm:['courses','resources','workshops'], zu:['courses'], museopro:['courses','resources','mentors'], nibras:['courses'] };
    const TABS = ALLT[site];
    const tab = this.state.tab || this.props.tab || TABS[0];
    const off = TABS.indexOf(tab) < 0;
    const LBL = { courses:['Courses','الدورات'], workshops:['Workshops','ورش العمل'], mentors:['Mentors','المرشدون'], ai_coaches:['AI Coaches','المدربون الأذكياء'], ai_tools:['AI Tools','أدوات الذكاء الاصطناعي'], resources:['Resources','الموارد'] };
    const OVR = { elevate:{ workshops:['Sessions','الجلسات'] }, znm:{ courses:['ZNM Courses','دورات المتحف'], workshops:['Assessments','التقييمات'] }, museopro:{ mentors:['Trainers','المدربون'] } }[site] || {};
    const tl = (k) => { const x = OVR[k] || LBL[k]; return L(x[0], x[1]); };
    const SN = { employees:['DCT Employees','موظفو الدائرة','#EE3E43'], elevate:['Elevate 2026','إرتقاء 2026','#CD3151'], znm:['Zayed National Museum','متحف زايد الوطني','#3B2F92'], zu:['ZU 24-Hour Challenge','تحدي جامعة زايد','#F7C337'], museopro:['MuseoPro','ميوزيو برو','#E35E3C'], nibras:['Nibras — AI Champions','نبراس','#2FC4DB'] }[site];
    const siteName = L(SN[0], SN[1]);
    const sh = this.shell(ar, 'learner', 'hub_' + tab, site, [ { label: siteName, href:'/'+site+'/dashboard' }, { label: tl(tab) } ]);
    const U = { employees:['Saeed Al Hammadi','سعيد الحمادي','SA','Specialist, DCT Culture','أخصائي، قطاع الثقافة'], elevate:['Saeed Al Hammadi','سعيد الحمادي','SA','Specialist, DCT Culture','أخصائي، قطاع الثقافة'], znm:['Yousef Al Zaabi','يوسف الزعابي','YZ','Gallery Host, ZNM','مضيف صالة عرض، المتحف'], zu:['Ahmed Khan','أحمد خان','AK','ZU student','طالب في جامعة زايد'], museopro:['Élise Martin','إليز مارتن','EM','Collections officer','مسؤولة مجموعات'], nibras:['Hamad Al Mazrouei','حمد المزروعي','HM','Data analyst','محلل بيانات'] }[site];
    sh.userName = L(U[0],U[1]); sh.initials = U[2]; sh.userSub = L(U[3],U[4]);

    const t = ar ? {
      spec:'مركز التعلّم', hubTabs:'أقسام المركز', offH:'هذا القسم غير مفعّل', offP:'لم يفعّل مسؤول البرنامج هذا القسم في هذا الموقع.', toDash:'العودة إلى لوحة التحكم',
      search:'ابحث في الدورات', searchPh:'ابحث بالعنوان أو الفئة…', stateL:'الحالة', sort:'الترتيب', catL:'الفئة', mandOnly:'الدورات الإلزامية', coursesShown:'دورة معروضة', noMatch:'لا توجد دورات مطابقة', noMatchP:'جرّب كلمة بحث أخرى أو أزل بعض عوامل التصفية.', reset:'إعادة ضبط التصفية',
      whenL:'التوقيت', tz:'الأوقات بتوقيت الخليج (GMT+4)', addCal:'أضف إلى التقويم', calDone:'تم تنزيل ملف التقويم (.ics)', noEvP:'سنرسل لك إشعاراً عند إضافة فعالية جديدة.',
      facilitates:'يقدّم الدورات', viewProfile:'عرض الملف', book:'احجز جلسة', signedIn:'يتطلب تسجيل الدخول',
      typeL:'النوع', resNote:'تظهر الموارد بعد مراجعتها من فريق DCT Learn.', noRes:'لا توجد موارد من هذا النوع', noResP:'جرّب نوعاً آخر.', showAll:'عرض كل الموارد', notifyOn:'سنخبرك عند إتاحة الدورة', notifyOff:'تم إلغاء التنبيه'
    } : {
      spec:'Hub', hubTabs:'Hub sections', offH:'This section is off', offP:'The programme admin hasn’t turned this section on for this microsite.', toDash:'Back to dashboard',
      search:'Search courses', searchPh:'Search by title or category…', stateL:'State', sort:'Sort', catL:'Category', mandOnly:'Mandatory courses', coursesShown:'courses shown', noMatch:'No courses match', noMatchP:'Try another search term or clear some filters.', reset:'Clear filters',
      whenL:'When', tz:'Times in Gulf Standard Time (GMT+4)', addCal:'Add to calendar', calDone:'Calendar file downloaded (.ics)', noEvP:'We’ll notify you when a new one is added.',
      facilitates:'Facilitates', viewProfile:'View profile', book:'Book a session', signedIn:'Sign-in required',
      typeL:'Type', resNote:'Resources appear once the DCT Learn team has reviewed them.', noRes:'No resources of this type', noResP:'Try another type.', showAll:'Show all resources', notifyOn:'We’ll tell you when it opens', notifyOff:'Notification turned off'
    };
    const SUB = {
      courses:L('Mandatory courses come first. Pick up where you left off or explore something new.','الدورات الإلزامية أولاً. تابع من حيث توقفت أو استكشف جديداً.'),
      workshops: site === 'elevate' ? L('Programme sessions for Elevate mentees — join on Zoom from here.','جلسات البرنامج لمتدرّبي إرتقاء — انضم عبر Zoom من هنا.') : site === 'znm' ? L('On-site assessments and briefings at Zayed National Museum.','التقييمات والإحاطات الحضورية في متحف زايد الوطني.') : L('Live workshops and recordings of past sessions.','ورش عمل مباشرة وتسجيلات الجلسات السابقة.'),
      mentors: site === 'museopro' ? L('France Muséums trainers who facilitate your MuseoPro courses.','مدربو France Muséums الذين يقدّمون دورات ميوزيو برو.') : L('Experienced DCT leaders who mentor colleagues in this programme.','قيادات ذات خبرة في الدائرة ترشد الزملاء في هذا البرنامج.'),
      ai_coaches:L('Chat with AI coaches trained on DCT knowledge. Conversations stay private to you.','تحدّث مع مدربين أذكياء مدرّبين على معرفة الدائرة. محادثاتك خاصة بك.'),
      ai_tools:L('AI tools that help you plan lessons and draft documents faster.','أدوات ذكاء اصطناعي تساعدك على تخطيط الدروس وصياغة المستندات بسرعة.'),
      resources:L('Reviewed links and documents for your programme.','روابط ومستندات معتمدة لبرنامجك.')
    };

    // ---------- courses ----------
    const IMG = { C01:B('fa500a874150b2a1769785936a6d7785'), C02:B('d99ea09adede7395461223b429f24cf4'), C04:B('592272d2d94f43d123cbcdda07b02178'), C05:B('d01461a3f6ad3ced258aac4713f94408'), C06:B('cf69d2b8596f972f4af9fc63c0137303'), C07:B('f1cfe235742010d5ac7c29f64fa633a0'), C09:B('91fa1af72d1e01df9c41fd3bfd8dc824'), C13:B('40780df486810d248ab2ca9a23d58dcb'), C14:B('403bd7970d9211d5acd7b2806550e6a7'), C17:B('17f39841203c4958a320c0442a073383'), C18:B('f53e39067997d52c15204d509b52dd30'), team:B('eb80e68b5f407df8f3c317956007a5a2'), znm:B('6a330c17598da2f1e81b82711e1c5e9a'), mp:B('2ff5095865986643708258995c8a0113'), nib:B('7430eed874cd248e04160ae211dc6b79'), emp:B('92c83a667e1befe5661dab8c7ebca349') };
    // key, slug, en, ar, catEn, catAr, level, min, units, img
    const C = {
      C01:['dct-world','DCT World','عالم الدائرة','All about DCT','كل شيء عن الدائرة','beginner',45,4,IMG.C01],
      C02:['museum-101','Museum 101','المتاحف 101','The World of Museums','عالم المتاحف','beginner',60,5,IMG.C02],
      C03:['dctlearn','DCTLEARN','منصة DCT Learn','All about DCT','كل شيء عن الدائرة','beginner',20,2,IMG.emp],
      C04:['cultural-heritage','Understanding Cultural Heritage','فهم التراث الثقافي','Cultural Heritage','التراث الثقافي','beginner',50,4,IMG.C04],
      C05:['sustainable-tourism','Sustainable Tourism','السياحة المستدامة','Tourism Management','إدارة السياحة','intermediate',60,4,IMG.C05],
      C06:['world-of-curation','The World of Curation','عالم التقييم الفني','The World of Museums','عالم المتاحف','intermediate',55,4,IMG.C06],
      C07:['creative-tourism','Creative Tourism: What is it?','السياحة الإبداعية','Creative and Cultural Industries','الصناعات الثقافية والإبداعية','beginner',40,3,IMG.C07],
      C08:['data-protection','Data Protection for People and Performance','حماية البيانات','Corporate Knowledge and Compliance','المعرفة المؤسسية والامتثال','beginner',30,3,IMG.team],
      C09:['intro-ticketing','Introduction to Ticketing','مقدمة في التذاكر','ZNM onboarding','التهيئة في المتحف','beginner',35,3,IMG.C09],
      C10:['operational-readiness-induction','Operational Readiness – Induction','الجاهزية التشغيلية – التعريف','ZNM onboarding','التهيئة في المتحف','beginner',40,3,IMG.znm],
      C11:['operational-readiness-role','Operational Readiness – Role-Specific','الجاهزية التشغيلية – حسب الدور','ZNM onboarding','التهيئة في المتحف','intermediate',45,3,IMG.team],
      C12:['vs-knowledge-assessment','VS Knowledge Assessment','تقييم المعرفة','Post-Assessment','التقييم اللاحق','beginner',15,1,IMG.C09],
      C13:['24-hour-challenge','24 Hour Challenge – Introduction to Cultural Heritage','تحدي 24 ساعة – مقدمة في التراث الثقافي','Cultural Heritage','التراث الثقافي','beginner',90,4,IMG.C13],
      C14:['condition-report','Condition Report: General Presentation','تقرير الحالة: عرض عام','Documentation of Cultural Heritage','توثيق التراث الثقافي','intermediate',50,3,IMG.C14],
      C15:['conservation-exhibition','Conservation and Exhibition of Artefacts','صون وعرض القطع','Conservation and exhibition of artefacts','صون القطع وعرضها','intermediate',60,4,IMG.mp],
      C16:['curating-exhibition','Curating an Exhibition: From Concept to Production','تنظيم المعارض: من الفكرة إلى الإنتاج','Conservation and exhibition of artefacts','صون القطع وعرضها','advanced',70,4,IMG.C14],
      C17:['interpretation-tools','Written and Oral Interpretation Tools in Heritage','أدوات التفسير المكتوبة والشفهية في التراث','Interpretation and audience management','التفسير وإدارة الجمهور','intermediate',45,3,IMG.C17],
      C18:['intro-generative-ai','Introduction to Generative AI','مقدمة في الذكاء الاصطناعي التوليدي','AI Aware','وعي بالذكاء الاصطناعي','beginner',120,1,IMG.C18],
      C19:['ethics-of-ai','Ethics of AI','أخلاقيات الذكاء الاصطناعي','AI Aware','وعي بالذكاء الاصطناعي','beginner',90,1,IMG.nib],
      C20:['prompt-engineering','Foundations of Prompt Engineering','أساسيات هندسة الأوامر','AI Practitioner','ممارس الذكاء الاصطناعي','intermediate',180,1,IMG.team],
      C21:['llmops','LLMOps','عمليات نماذج اللغة','AI Builder','مطوّر الذكاء الاصطناعي','advanced',240,1,IMG.C05]
    };
    // per site: [key, progressPct, mandatory, extra]
    const SITEC = {
      employees:[['C01',100,1],['C02',60,0],['C03',100,1],['C04',0,0],['C05',0,0],['C06',0,0],['C07',0,0],['C08',0,0]],
      znm:[['C09',100,1],['C10',100,1],['C11',40,1],['C12',100,1,{nocert:1}],['C02',0,1],['C01',0,1]],
      zu:[['C13',100,0,{prog:1}]],
      museopro:[['C14',100,1],['C15',30,1],['C16',0,0],['C17',0,0,{soon:1}]],
      nibras:[['C18',100,1,{ext:'approved'}],['C19',50,1,{ext:'none'}],['C20',0,0,{ext:'none'}],['C21',0,0,{ext:'none'}]],
      elevate:[]
    }[site];
    const LV = { beginner:L('Beginner','مبتدئ'), intermediate:L('Intermediate','متوسط'), advanced:L('Advanced','متقدم') };
    const mandDefault = site === 'museopro';
    const mandOn = this.state.mand === null ? mandDefault : this.state.mand;
    const q = this.state.q.trim().toLowerCase();
    let list = SITEC.map((x, i) => {
      const c = C[x[0]], pct = x[1], mand = !!x[2], ex = x[3] || {};
      const st = ex.soon ? 'soon' : pct >= 100 ? 'done' : pct > 0 ? 'prog' : 'new';
      return { key:x[0], i, c, pct, mand, ex, st, title:L(c[1],c[2]), catRaw:c[3], cat:L(c[3],c[4]) };
    });
    const cats = []; list.forEach(x => { if (cats.indexOf(x.catRaw) < 0) cats.push(x.catRaw); });
    const catAr = {}; list.forEach(x => { catAr[x.catRaw] = x.cat; });
    const filtered = list.filter(x => (this.state.cat === 'all' || x.catRaw === this.state.cat)
      && (this.state.st === 'all' || (this.state.st === 'in_progress' ? x.st === 'prog' : x.st === 'done'))
      && (!mandOn || x.mand)
      && (!q || (x.c[1] + ' ' + x.c[2] + ' ' + x.c[3] + ' ' + x.c[4]).toLowerCase().indexOf(q) > -1));
    const srt = this.state.sort;
    filtered.sort((a, b) => srt === 'az' ? a.title.localeCompare(b.title, ar ? 'ar' : 'en') : srt === 'short' ? a.c[6] - b.c[6] : srt === 'prog' ? b.pct - a.pct : ((b.mand - a.mand) || (a.i - b.i)));
    const notified = this.state.notified;
    const courses = filtered.map(x => {
      const c = x.c, ex = x.ex, href = '/'+site+'/learn/'+c[0];
      const tags = [];
      if (x.mand) tags.push({ l:L('Mandatory','إلزامية'), c:'red' });
      if (ex.ext) tags.push({ l:L('External certificate','شهادة خارجية'), c:'info' });
      if (ex.prog) tags.push({ l:L('Certificate programme','برنامج شهادة'), c:'yel' });
      let cta = x.st === 'done' ? L('Review','مراجعة') : x.st === 'prog' ? L('Continue','تابع') : L('Start','ابدأ');
      let ext = false, ctaHref = href;
      if (ex.ext === 'approved') ext = L('Certificate approved · 16 Sep 2026','الشهادة معتمدة · 16 سبتمبر 2026');
      if (ex.ext === 'none') { ext = x.pct > 0 ? L('Finished with the partner? Upload your certificate (PDF, PNG or JPG, max 5 MB).','أنهيت الدورة لدى الشريك؟ ارفع شهادتك (PDF أو PNG أو JPG، حتى 5 ميجابايت).') : L('Taken with our partner. Completion by certificate upload.','تُؤخذ لدى الشريك، وتكتمل برفع الشهادة.'); if (x.pct > 0) { cta = L('Upload certificate','ارفع الشهادة'); ctaHref = '/'+site+'/achievements'; } }
      const soon = x.st === 'soon', on = !!notified[x.key];
      return { title:x.title, cat:x.cat, img:c[8], href, tags, level:LV[c[5]], min:L(c[6]+' min', c[6]+' دقيقة'), units: c[7] === 1 ? L('1 unit','درس واحد') : L(c[7]+' units', c[7]+' دروس'),
        pct:x.pct+'%', pctN:String(x.pct), pctL: soon ? L('Opens soon','يتاح قريباً') : x.st === 'done' ? (ex.nocert ? L('Done · no certificate','مكتمل · بلا شهادة') : L('100% · certificate','100% · شهادة')) : x.pct + '%',
        bar: x.st === 'done' ? '#15801A' : '#D63539', rib: x.st === 'done' ? L('Completed','مكتملة') : soon ? L('Coming soon','قريباً') : false, ribCls: soon ? 'soon' : '', cls: soon ? 'soon' : '',
        ext, cta: soon ? (on ? L('We’ll notify you','سنخبرك') : L('Notify me','أبلغني')) : cta, ctaHref, btn: x.st === 'done' ? 'btn-line' : 'btn-primary', soon, go: !soon, notified: on ? 'true' : 'false',
        notify: () => { const n = Object.assign({}, notified); n[x.key] = !on; this.setState({ notified:n }); this.flash(on ? t.notifyOff : t.notifyOn); } };
    });
    const nProg = list.filter(x => x.st === 'prog').length, nDone = list.filter(x => x.st === 'done').length;
    const stateBtns = [['all',L('All','الكل'),list.length],['in_progress',L('In progress','قيد التعلّم'),nProg],['completed',L('Completed','مكتملة'),nDone]].map(x => ({ label:x[1]+' · '+fmt(x[2]), cls: this.state.st === x[0] ? 'is-on' : '', on: this.state.st === x[0] ? 'true' : 'false', pick: () => this.setState({ st:x[0] }) }));
    const catBtns = [{ label:L('All','الكل'), v:'all' }].concat(cats.map(c => ({ label:catAr[c], v:c }))).map(x => ({ label:x.label, cls: this.state.cat === x.v ? 'on' : '', on: this.state.cat === x.v ? 'true' : 'false', pick: () => this.setState({ cat:x.v }) }));
    const sortOpts = [['mand',L('Mandatory first','الإلزامية أولاً')],['az',L('Title A–Z','العنوان أ–ي')],['short',L('Shortest first','الأقصر أولاً')],['prog',L('Most progress','الأكثر تقدماً')]].map(x => ({ v:x[0], l:x[1] }));

    // ---------- workshops ----------
    const EV = {
      employees:[ { when:'past', day:'10', mon:L('Sep','سبتمبر'), title:L('Creative Economy Masterclass','الصف المتقدم في الاقتصاد الإبداعي'), cat:L('Workshops','ورش العمل'), time:L('Thu 10 Sep 2026 · 11:00–13:00 Gulf','الخميس 10 سبتمبر 2026 · 11:00–13:00 بتوقيت الخليج'), venue:L('Recording available','التسجيل متاح'), vIcon:'M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', desc:L('How Abu Dhabi’s creative industries grow audiences and revenue — with case studies from Manarat Al Saadiyat.','كيف تنمّي الصناعات الإبداعية في أبوظبي جمهورها وإيراداتها — مع دراسات حالة من منارة السعديات.'), tag:L('Recording','تسجيل'), tagCls:'mut', cta:L('Watch recording','شاهد التسجيل'), href:'https://video.example/masterclass', target:'_blank', btn:'btn-ink', hint:L('2 hours · opens in a new tab','ساعتان · يفتح في علامة تبويب جديدة'), cls:'' } ],
      elevate:[ { when:'upcoming', day:'08', mon:L('Oct','أكتوبر'), title:L('Mentoring Kick-off Session','جلسة انطلاق الإرشاد'), cat:L('Sessions','الجلسات'), time:L('Thu 8 Oct 2026 · 10:00–11:00 Gulf','الخميس 8 أكتوبر 2026 · 10:00–11:00 بتوقيت الخليج'), venue:'Zoom', vIcon:'M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', desc:L('Meet the 2026 cohort, your mentors and the programme team. We’ll walk through the GROW model and the six-session journey.','تعرّف على دفعة 2026 ومرشديك وفريق البرنامج، ونستعرض نموذج GROW ورحلة الجلسات الست.'), tag:L('Upcoming','قادمة'), tagCls:'info', cta:L('Join on Zoom','انضم عبر Zoom'), href:'https://zoom.example/kickoff', target:'_blank', btn:'btn-primary', cal:true, hint:L('Link opens 15 minutes before','يفتح الرابط قبل 15 دقيقة'), cls:'' } ],
      znm:[ { when:'upcoming', day:'06', mon:L('Oct','أكتوبر'), title:L('Museum Safety Briefing','إحاطة السلامة في المتحف'), cat:L('Assessments','التقييمات'), time:L('Today · 09:00–10:00 Gulf','اليوم · 09:00–10:00 بتوقيت الخليج'), venue:L('Zayed National Museum, Saadiyat','متحف زايد الوطني، السعديات'), vIcon:'M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', desc:L('Mandatory on-site briefing for all front-of-house staff: evacuation routes, incident reporting and visitor safety.','إحاطة حضورية إلزامية لجميع موظفي الواجهة: مسارات الإخلاء والإبلاغ عن الحوادث وسلامة الزوار.'), tag:L('Live now','مباشر الآن'), tagCls:'red', live:true, cta:L('Get directions','الاتجاهات'), href:'https://maps.example/zayed-national-museum', target:'_blank', btn:'btn-primary', hint:L('Started at 09:00 · on site','بدأت 09:00 · حضورياً'), cls:'live' } ]
    }[site] || [];
    /* default filter: Upcoming, or Past when nothing is upcoming (so the tab count never opens on an empty list) */
    const when = this.state.when || (EV.some(e => e.when === 'upcoming') ? 'upcoming' : 'past');
    const events = EV.filter(e => e.when === when).map(e => Object.assign({ cal:false, live:false }, e, { when:e.time }));
    const whenBtns = [['upcoming',L('Upcoming','القادمة')],['past',L('Past','السابقة')]].map(x => ({ label:x[1], cls: when === x[0] ? 'is-on' : '', on: when === x[0] ? 'true' : 'false', pick: () => this.setState({ when:x[0] }) }));

    // ---------- mentors ----------
    const MT = [
      { id:'hessa', sites:['elevate'], ini:'HN', c:'#CD3151', name:L('Dr. Hessa Al Nuaimi','د. حصة النعيمي'), title:L('Director, Museums Strategy','مديرة استراتيجية المتاحف'), cats:['Museums and Curation','Strategy and Planning'], bio:L('Has led museum strategy at DCT for over a decade, from collection planning to opening new galleries. Mentors emerging curators and project leads.','قادت استراتيجية المتاحف في الدائرة لأكثر من عقد، من تخطيط المجموعات إلى افتتاح صالات جديدة، وترشد القيّمين وقادة المشاريع الناشئين.'), avail:L('Sun–Thu · 10:00–13:00 Gulf','الأحد–الخميس · 10:00–13:00'), mine:true },
      { id:'rashid', sites:['elevate'], ini:'RB', c:'#3B2F92', name:L('Rashid Al Blooshi','راشد البلوشي'), title:L('Head of Visitor Experience','رئيس تجربة الزوار'), cats:['Visitor Experience and Events','Tourism and International Operations'], bio:L('Runs visitor experience across DCT’s cultural sites and major events. Helps mentees design services around people.','يدير تجربة الزوار في المواقع الثقافية والفعاليات الكبرى، ويساعد المتدرّبين على تصميم خدمات تتمحور حول الناس.'), avail:L('Mon, Wed · 14:00–17:00 Gulf','الإثنين والأربعاء · 14:00–17:00') },
      { id:'mariam', sites:['elevate','employees'], ini:'MK', c:'#E35E3C', name:L('Mariam Khoury','مريم خوري'), title:L('Senior Manager, People & Performance','مديرة أولى، الأفراد والأداء'), cats:['People and Performance','Marketing and Communications'], bio:L('Builds performance and career frameworks for DCT teams. Mentors on career moves, feedback and communication.','تبني أطر الأداء والمسار المهني لفرق الدائرة، وترشد في التنقل الوظيفي والتغذية الراجعة والتواصل.'), avail:L('Tue, Thu · 09:00–12:00 Gulf','الثلاثاء والخميس · 09:00–12:00') },
      { id:'jean-luc', sites:['museopro'], ini:'JM', c:'#E35E3C', trainer:true, name:'Jean-Luc Morel', title:L('Conservation Trainer, France Muséums','مدرّب الصون، France Muséums'), cats:['Museums and Curation'], bio:L('Conservator and trainer with France Muséums. Leads the hands-on condition reporting and artefact handling modules.','مختص صون ومدرّب في France Muséums، يقود الوحدات العملية لتقارير الحالة والتعامل مع القطع.'), avail:L('Trainer · no 1:1 booking','مدرّب · بلا حجز فردي'), courses:[['condition-report',L('Condition Report: General Presentation','تقرير الحالة: عرض عام')],['conservation-exhibition',L('Conservation and Exhibition of Artefacts','صون وعرض القطع')]] }
    ].filter(m => m.sites.indexOf(site) > -1);
    const MCAT = { 'Museums and Curation':'المتاحف والتقييم الفني', 'Strategy and Planning':'الاستراتيجية والتخطيط', 'Visitor Experience and Events':'تجربة الزوار والفعاليات', 'Tourism and International Operations':'السياحة والعمليات الدولية', 'People and Performance':'الأفراد والأداء', 'Marketing and Communications':'التسويق والاتصال' };
    const mcats = []; MT.forEach(m => m.cats.forEach(c => { if (mcats.indexOf(c) < 0) mcats.push(c); }));
    const mcat = this.state.mcat;
    const mentors = MT.filter(m => mcat === 'all' || m.cats.indexOf(mcat) > -1).map(m => ({ name:m.name, title:m.title, ini:m.ini, c:m.c, bio:m.bio, avail:m.avail, cats:m.cats.map(c => L(c, MCAT[c])),
      badge: m.trainer ? L('Trainer','مدرّب') : (m.mine && site === 'elevate') ? L('Your mentor · 87% match','مرشدتك · مطابقة 87%') : L('Mentor','مرشد'), badgeCls: (m.mine && site === 'elevate') ? 'info' : 'mut', cls: (m.mine && site === 'elevate') ? 'me' : '',
      isTrainer: !!m.trainer, courses:(m.courses || []).map(k => ({ l:k[1], href:'/'+site+'/learn/'+k[0] })), href:'/'+site+'/mentoring/mentor/'+m.id, book: !!(m.mine && site === 'elevate'), bookHref:'/elevate/mentoring/book' }));
    const mcatBtns = [{ label:L('All','الكل'), v:'all' }].concat(mcats.map(c => ({ label:L(c, MCAT[c]), v:c }))).map(x => ({ label:x.label, cls: mcat === x.v ? 'on' : '', on: mcat === x.v ? 'true' : 'false', pick: () => this.setState({ mcat:x.v }) }));

    // ---------- ai ----------
    const chatD = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5';
    const AI = {
      ai_coaches:[ { name:L('Abu Dhabi Culture Bot','روبوت ثقافة أبوظبي'), desc:L('Ask about cultural sites, history, opening hours and upcoming events across Abu Dhabi.','اسأل عن المواقع الثقافية والتاريخ ومواعيد الزيارة والفعاليات القادمة في أبوظبي.'), c:'#A39089', d:chatD, kind:L('Chat coach','مدرّب محادثة'), note:L('Answers in English or Arabic','يجيب بالعربية أو الإنجليزية'), href:'/'+site+'/ai/coach/culture-bot', cta:L('Start chat','ابدأ المحادثة') },
        { name:L('Career Coach','مدرّب المسار المهني'), desc:L('Plan your next role at DCT: map your skills, find courses that close the gap and prepare for conversations with your manager.','خطّط لدورك القادم في الدائرة: حدّد مهاراتك، واعثر على الدورات التي تسد الفجوة، واستعد للحديث مع مديرك.'), c:'#CE3F3F', d:chatD, kind:L('Chat coach','مدرّب محادثة'), note:L('Uses your profile and courses','يستخدم ملفك ودوراتك'), href:'/'+site+'/ai/coach/career-coach', cta:L('Start chat','ابدأ المحادثة') } ],
      ai_tools:[ { name:L('AI Lesson Planner','مخطِّط الدروس الذكي'), desc:L('Turn a topic into a structured lesson: objectives, activities, timings and a short quiz — ready to adapt for your team.','حوّل أي موضوع إلى درس منظّم: أهداف وأنشطة وتوقيتات واختبار قصير — جاهز للتكييف لفريقك.'), c:'#EE3E43', d:'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z', kind:L('Embedded tool','أداة مدمجة'), note:L('Export as PDF','تصدير PDF'), href:'/'+site+'/ai/lesson-planner', cta:L('Open tool','افتح الأداة') } ]
    };
    const aiItems = AI[tab] || [];

    // ---------- resources ----------
    const RS = { znm:[ { type:'pdf', ty:'PDF', cls:'', title:L('ZNM Visitor Code of Conduct','مدونة سلوك زوار المتحف'), sub:L('PDF · 1.2 MB · added 28 Sep 2026','PDF · 1.2 ميجابايت · أضيف 28 سبتمبر 2026'), href:'https://files.example/znm-visitor-code-of-conduct.pdf', cta:L('Download','تنزيل') } ],
      museopro:[ { type:'link', ty:'LINK', cls:'lk', title:L('Museum Glossary (ICOM)','مسرد مصطلحات المتاحف (ICOM)'), sub:L('Link · icom.museum · opens in a new tab','رابط · icom.museum · يفتح في علامة تبويب جديدة'), href:'https://icom.museum/', cta:L('Open link','افتح الرابط') } ] }[site] || [];
    const type = this.state.type;
    const resources = RS.filter(r => type === 'all' || r.type === type);
    const typeBtns = [['all',L('All','الكل')],['link',L('Links','روابط')],['pdf',L('PDFs','ملفات PDF')]].map(x => ({ label:x[1], cls: type === x[0] ? 'is-on' : '', on: type === x[0] ? 'true' : 'false', pick: () => this.setState({ type:x[0] }) }));

    return {
      lang, dir: ar?'rtl':'ltr', t, sh, siteName, accent:SN[2], tabLabel: off ? L(LBL[tab][0], LBL[tab][1]) : tl(tab), tabSub: SUB[tab], off, dashHref:'/'+site+'/dashboard',
      protoCls: this.props.proto ? 'proto' : '', route:'/'+site+'/hub/'+tab,
      isCourses: !off && tab === 'courses', isWorkshops: !off && tab === 'workshops', isMentors: !off && tab === 'mentors', isAi: !off && (tab === 'ai_coaches' || tab === 'ai_tools'), isRes: !off && tab === 'resources',
      q:this.state.q, onQ:(e) => this.setState({ q:e.target.value }), stateBtns, catBtns, sortOpts, sort:srt, onSort:(e) => this.setState({ sort:e.target.value }),
      hasMandFilter: list.some(x => x.mand) && list.some(x => !x.mand), mandCls: mandOn ? 'on' : '', mandOn: mandOn ? 'true' : 'false', togMand: () => this.setState({ mand: !mandOn }),
      courses, shownN: fmt(courses.length), noCourses: courses.length === 0, resetF: () => this.setState(Object.assign(this.reset(), { mand:false })),
      events, whenBtns, noEvents: events.length === 0, noEvH: when === 'upcoming' ? L('Nothing upcoming right now','لا شيء قادم حالياً') : L('No past sessions yet','لا توجد جلسات سابقة بعد'),
      otherWhenL: when === 'upcoming' ? L('See past ones','عرض السابقة') : L('See upcoming','عرض القادمة'), otherWhen: () => this.setState({ when: when === 'upcoming' ? 'past' : 'upcoming' }), addCal: () => this.flash(t.calDone),
      mentors, mcatBtns, aiItems, resources, typeBtns, noRes: resources.length === 0, allTypes: () => this.setState({ type:'all' }),
      toast: this.state.toast || false,
      siteBtns: [['employees','Employees'],['elevate','Elevate'],['znm','ZNM'],['zu','ZU'],['museopro','MuseoPro'],['nibras','Nibras']].map(x => ({ label:x[1], cls: x[0] === site ? 'is-on' : '', pick: () => this.setState(Object.assign(this.reset(), { site:x[0], tab:ALLT[x[0]][0], notified:{} })) })),
      tabBtns: TABS.map(k => ({ label:tl(k), cls: k === tab ? 'is-on' : '', pick: () => this.setState(Object.assign(this.reset(), { tab:k })) })),
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' })
    };
  }
}
