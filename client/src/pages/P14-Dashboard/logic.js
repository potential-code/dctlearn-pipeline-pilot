// Ported verbatim from the Claude Design artboard P14-Dashboard (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, site:null, tour:null, svDlg:false, svDone:false, svRate:0, svText:'', svErr:false, toast:'' }; }

  /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  flash(msg){ this.setState({ toast: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast:'' }), 2800); }

  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const site = this.state.site || this.props.site || 'employees';
    const L = (en, a) => ar ? a : en;
    const B = (id) => '/_blob/' + id;
    const fmt = (n) => Number(n).toLocaleString(ar ? 'ar-AE' : 'en-US');
    const IMG = { C01:B('fa500a874150b2a1769785936a6d7785'), C02:B('d99ea09adede7395461223b429f24cf4'), C04:B('592272d2d94f43d123cbcdda07b02178'), C05:B('d01461a3f6ad3ced258aac4713f94408'), C07:B('f1cfe235742010d5ac7c29f64fa633a0'), C09:B('91fa1af72d1e01df9c41fd3bfd8dc824'), C13:B('40780df486810d248ab2ca9a23d58dcb'), C14:B('403bd7970d9211d5acd7b2806550e6a7'), C17:B('17f39841203c4958a320c0442a073383'), C18:B('f53e39067997d52c15204d509b52dd30'),
      team:B('eb80e68b5f407df8f3c317956007a5a2'), elev:B('9842ff4b5522772462642e07bfb6d8c1'), znm:B('6a330c17598da2f1e81b82711e1c5e9a'), zu:B('006f6b748b68e46ce2d045fcc3d92aea'), museopro:B('2ff5095865986643708258995c8a0113'), nibras:B('7430eed874cd248e04160ae211dc6b79') };
    const t = ar ? {
      spec:'لوحة التحكم', clEy:'تابع التعلّم', allCourses:'كل الدورات', mtTitle:'مرشدتك', mtProfile:'عرض الملف', mtMatched:'تمت المطابقة · 87%', mtName:'د. حصة النعيمي', mtRole:'مديرة استراتيجية المتاحف', mtCats:'المتاحف والتقييم الفني · الاستراتيجية والتخطيط', oct:'أكتوبر', nxtTitle:'الجلسة 2 مع د. حصة', nxtWhen:'الإثنين 12 أكتوبر · 11:00–12:00 بتوقيت الخليج · Zoom', nxtJoin:'غرفة الجلسة',
      evAll:'عرض الكل', evNone:'لا توجد فعاليات مجدولة', evNoneSub:'سنرسل لك إشعاراً عند إضافة فعالية جديدة.', mdTitle:'الدورات الإلزامية', mdAll:'مكتملة', mdLeft:(n)=>'متبقٍ '+n, cert:'الشهادة', lbTitle:'لوحة المتصدرين', lbAll:'الإنجازات', aiTitle:'المدربون الأذكياء', pts:'نقطة',
      kp:['قيد التعلّم','مكتملة','الشهادات','النقاط'],
      cpTitle:'تحدي 24 ساعة 2026', cpStatus:'قيد التحكيم', cpDays:'14', cpDaysL:'يوماً حتى إغلاق الجولة', cpRoundK:'الجولة', cpRound:'الجولة 1 · قيد التحكيم', cpDeadK:'الموعد النهائي', cpDead:'الثلاثاء 20 أكتوبر 2026', cpSubK:'مشاركتك', cpSub:'تم الإرسال', cpSubAt:'30 سبتمبر', cpNote:'تُنشر الدرجات والترتيب بعد إغلاق الجولة. خطة العمل مقفلة بعد الإرسال.', cpDash:'لوحة المسابقة', cpRules:'تفاصيل المسابقة',
      trTitle:'مدرّبك', trAll:'كل المدربين', trKind:'مدرّب', trRole:'مدرّب الصون، France Muséums', trCourses:'يقدّم: تقرير الحالة · صون وعرض القطع',
      svTitle:'استبيانات مفتوحة', svName:'تقييم ورشة: الصف المتقدم في الاقتصاد الإبداعي', svDue:'آخر موعد: الثلاثاء 13 أكتوبر · دقيقتان', svStart:'ابدأ الاستبيان', svThanks:'شكراً، تم إرسال إجابتك', svQ1:'ما مدى فائدة الورشة لعملك؟ (1 = قليلة، 5 = كبيرة)', svQ2:'ما الذي نحسّنه في الورشة القادمة؟', opt:'(اختياري)', svReq:'اختر تقييماً من 1 إلى 5.', svSubmit:'إرسال', cancel:'إلغاء', close:'إغلاق', svOpenTag:'مفتوح', svDoneTag:'مكتمل', svSent:'تم إرسال الاستبيان',
      rsTitle:'موارد إضافية', grTitle:'ملاحظات GROW', grWhen:'الجلسة 1 · 28 سبتمبر', ceTitle:'أحدث شهادة', ceAll:'كل الشهادات', ceOf:'شهادة إتمام', back:'السابق', skip:'تخطَّ الجولة', next:'التالي', finish:'لنبدأ', tourDone:'انتهت الجولة — يمكنك إعادتها من ملفك الشخصي'
    } : {
      spec:'Dashboard', clEy:'Continue learning', allCourses:'All courses', mtTitle:'Your mentor', mtProfile:'View profile', mtMatched:'Matched · 87%', mtName:'Dr. Hessa Al Nuaimi', mtRole:'Director, Museums Strategy', mtCats:'Museums and Curation · Strategy and Planning', oct:'Oct', nxtTitle:'Session 2 with Dr. Hessa', nxtWhen:'Monday 12 Oct · 11:00–12:00 Gulf · Zoom', nxtJoin:'Session room',
      evAll:'See all', evNone:'No events scheduled', evNoneSub:'We’ll notify you when a new event is added.', mdTitle:'Mandatory courses', mdAll:'All done', mdLeft:(n)=>n+' to finish', cert:'Certificate', lbTitle:'Leaderboard', lbAll:'Achievements', aiTitle:'AI Coaches', pts:'pts',
      kp:['In progress','Completed','Certificates','Points'],
      cpTitle:'24-Hour Challenge 2026', cpStatus:'Judging', cpDays:'14', cpDaysL:'days until the round closes', cpRoundK:'Round', cpRound:'Round 1 · judging', cpDeadK:'Deadline', cpDead:'Tue 20 Oct 2026', cpSubK:'Your submission', cpSub:'Submitted', cpSubAt:'30 Sep', cpNote:'Scores and ranks are published when the round closes. Your action plan is locked after submission.', cpDash:'Competition dashboard', cpRules:'Competition details',
      trTitle:'Your trainer', trAll:'All trainers', trKind:'Trainer', trRole:'Conservation Trainer, France Muséums', trCourses:'Facilitates: Condition Report · Conservation and Exhibition of Artefacts',
      svTitle:'Open surveys', svName:'Workshop feedback: Creative Economy Masterclass', svDue:'Due Tue 13 Oct · 2 minutes', svStart:'Start survey', svThanks:'Thank you — your answers were sent', svQ1:'How useful was the masterclass for your work? (1 = not much, 5 = very)', svQ2:'What should we improve next time?', opt:'(optional)', svReq:'Choose a rating from 1 to 5.', svSubmit:'Send answers', cancel:'Cancel', close:'Close', svOpenTag:'Open', svDoneTag:'Done', svSent:'Survey sent',
      rsTitle:'Additional resources', grTitle:'GROW notes', grWhen:'Session 1 · 28 Sep', ceTitle:'Latest certificate', ceAll:'All certificates', ceOf:'Certificate of completion', back:'Back', skip:'Skip tour', next:'Next', finish:'Let’s go', tourDone:'Tour finished — replay it any time from your profile'
    };
    const site2 = { employees:L('DCT Employees','موظفو الدائرة'), elevate:L('Elevate 2026','إرتقاء 2026'), znm:L('Zayed National Museum','متحف زايد الوطني'), zu:L('ZU 24-Hour Challenge','تحدي جامعة زايد'), museopro:L('MuseoPro','ميوزيو برو'), nibras:L('Nibras — AI Champions','نبراس') }[site];
    const sh = this.shell(ar, 'learner', 'dashboard', site, [ { label: site2, href:'/platforms' }, { label: L('Dashboard','لوحة التحكم') } ]);
    // matching SEED learner per microsite
    const U = {
      employees:['Saeed Al Hammadi','سعيد الحمادي','SA','Specialist, DCT Culture','أخصائي، قطاع الثقافة','Saeed','سعيد'],
      elevate:['Saeed Al Hammadi','سعيد الحمادي','SA','Specialist, DCT Culture','أخصائي، قطاع الثقافة','Saeed','سعيد'],
      znm:['Yousef Al Zaabi','يوسف الزعابي','YZ','Gallery Host, ZNM','مضيف صالة عرض، المتحف','Yousef','يوسف'],
      zu:['Ahmed Khan','أحمد خان','AK','ZU student','طالب في جامعة زايد','Ahmed','أحمد'],
      museopro:['Élise Martin','إليز مارتن','EM','Collections officer','مسؤولة مجموعات','Élise','إليز'],
      nibras:['Hamad Al Mazrouei','حمد المزروعي','HM','Data analyst','محلل بيانات','Hamad','حمد']
    }[site];
    sh.userName = L(U[0],U[1]); sh.initials = U[2]; sh.userSub = L(U[3],U[4]);
    const first = L(U[5],U[6]);
    const KI = { cal:'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 14h3v3H8z', book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5M9 7h7M9 11h5', done:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', award:'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 23l5-3 5 3-1.2-9.1M12 6.5l1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6 2.2-.3z', star:'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z' };
    const P = (pct) => pct + '%';
    const cc = (slug, en, a, catEn, catA, img, pct, stEn, stA, min, extra) => Object.assign({ title:L(en,a), cat:L(catEn,catA), img, pct:P(pct), bar:'#D63539', state:L(stEn,stA), min:L(min+' min', min+' د'), href:'/'+site+'/learn/'+slug, tag:false, tagCls:'' }, extra || {});
    const notStarted = ['Not started','لم تبدأ'];
    const greet = L('Good morning, ','صباح الخير، ') + first;

    const D = {
      employees: {
        ey:L('DCT Employees','موظفو الدائرة'), sub:L('Pick up your courses, see what’s coming up and earn points along the way.','تابع دوراتك، وشاهد ما هو قادم، واكسب نقاطاً خلال رحلتك.'), continueBtn:L('Continue learning','تابع التعلّم'), continueHref:'/employees/learn/museum-101',
        clTitle:L('Your courses','دوراتك'), evTitle:L('Workshops','ورش العمل'),
        w:{ ey:L('Welcome back','مرحباً بعودتك'), h:greet, p:L('You’re 2 units away from finishing Museum 101 and earning your third certificate.','أنت على بُعد درسين من إكمال «المتاحف 101» والحصول على شهادتك الثالثة.'), cta:L('Resume Museum 101','تابع «المتاحف 101»'), href:'/employees/learn/museum-101', prog:L('Museum 101 · 60%','المتاحف 101 · 60%'), pct:'60%', img:IMG.team },
        kpis:[1,2,2,280], kn:[L('1 course','دورة واحدة'), L('since March 2024','منذ مارس 2024'), L('ready to download','قابلة للتنزيل'), L('#1 in DCT Employees','الأول في موظفي الدائرة')],
        courses:[ cc('museum-101','Museum 101','المتاحف 101','The World of Museums','عالم المتاحف',IMG.C02,60,'60% · Unit 3 of 5','60% · الدرس 3 من 5',60),
          cc('cultural-heritage','Understanding Cultural Heritage','فهم التراث الثقافي','Cultural Heritage','التراث الثقافي',IMG.C04,0,notStarted[0],notStarted[1],50),
          cc('sustainable-tourism','Sustainable Tourism','السياحة المستدامة','Tourism Management','إدارة السياحة',IMG.C05,0,notStarted[0],notStarted[1],60),
          cc('creative-tourism','Creative Tourism: What is it?','السياحة الإبداعية','Creative and Cultural Industries','الصناعات الثقافية والإبداعية',IMG.C07,0,notStarted[0],notStarted[1],40) ],
        mandatory:[ { en:'DCT World', a:'عالم الدائرة', done:true }, { en:'DCTLEARN', a:'منصة DCT Learn', done:true } ],
        events:[ { day:'10', mon:L('Sep','سبتمبر'), title:L('Creative Economy Masterclass','الصف المتقدم في الاقتصاد الإبداعي'), when:L('Recorded · 2 hours','مسجّل · ساعتان'), tag:L('Recording','تسجيل'), tagCls:'mut', cta:L('Watch','شاهد'), href:'/employees/hub/workshops' } ],
        leaders:[ ['Saeed Al Hammadi','سعيد الحمادي','SA',280,'#D63539','me'], ['Reem Al Shamsi','ريم الشامسي','RS',200,'#3B2F92',''], ['Hamad Al Mazrouei','حمد المزروعي','HM',150,'#CD3151',''], ['Mona Al Ameri','منى العامري','MA',40,'#E35E3C',''] ],
        ai:['culture-bot','career-coach'], surveys:true, resources:[]
      },
      elevate: {
        ey:L('Elevate 2026','إرتقاء 2026'), sub:L('Your mentor, your next session and programme updates in one place.','إرشادك وجلساتك القادمة في مكان واحد.'), continueBtn:L('Your next session','جلستك القادمة'), continueHref:'/mentoring/session/B2',
        clTitle:'', evTitle:L('Sessions','الجلسات'),
        w:{ ey:L('Mentee · Session 2 of 6','متدرّب · الجلسة 2 من 6'), h:greet, p:L('Your GROW goal: lead a small exhibition project by Q2 2027. Dr. Hessa added notes from session 1.','هدفك: قيادة مشروع معرض صغير بحلول الربع الثاني 2027. أضافت د. حصة ملاحظات الجلسة الأولى.'), cta:L('Read session 1 notes','اقرأ ملاحظات الجلسة 1'), href:'/elevate/mentoring', prog:L('Programme progress · 1 of 6 sessions','تقدّم البرنامج · جلسة من 6'), pct:'17%', img:IMG.elev },
        kpis:[1,2,2,280], kn:[L('1 course','دورة واحدة'), L('since March 2024','منذ مارس 2024'), L('ready to download','قابلة للتنزيل'), L('across your hubs','في كل مراكزك')],
        kpiAlt:[ [L('Sessions done','جلسات مكتملة'),1,L('of 6 in the programme','من 6 في البرنامج'),'k-ink','done'], [L('Next session','الجلسة القادمة'),12,L('October · Dr. Hessa','أكتوبر · د. حصة'),'k-rasp','cal'], [L('Match score','نسبة المطابقة'),'87',L('Museums and Curation','المتاحف والتقييم الفني'),'k-yel','award'], [L('Points','النقاط'),280,L('across your hubs','في كل مراكزك'),'k-red','star'] ],
        courses:[], mandatory:[],
        events:[ { day:'08', mon:L('Oct','أكتوبر'), title:L('Mentoring Kick-off Session','جلسة انطلاق الإرشاد'), when:L('Thursday · 10:00–11:00 Gulf · Zoom','الخميس · 10:00–11:00 بتوقيت الخليج · Zoom'), tag:L('Upcoming','قادمة'), tagCls:'info', cta:L('Details','التفاصيل'), href:'/elevate/hub/workshops' } ],
        leaders:[], ai:['career-coach'], surveys:false, resources:[]
      },
      znm: {
        ey:L('Zayed National Museum','متحف زايد الوطني'), sub:L('Your onboarding programme: courses, assessments and museum resources.','برنامج التهيئة الخاص بك: الدورات والتقييمات وموارد المتحف.'), continueBtn:L('Continue learning','تابع التعلّم'), continueHref:'/znm/learn/operational-readiness-role',
        clTitle:L('Your ZNM courses','دورات المتحف'), evTitle:L('Assessments','التقييمات'),
        w:{ ey:L('Onboarding programme','برنامج التهيئة'), h:greet, p:L('The Museum Safety Briefing is on now at the museum. After it, pick up Operational Readiness – Role-Specific.','إحاطة السلامة في المتحف جارية الآن. بعدها تابع «الجاهزية التشغيلية – حسب الدور».'), cta:L('Resume Role-Specific','تابع «حسب الدور»'), href:'/znm/learn/operational-readiness-role', prog:L('Onboarding · 3 of 6 courses','التهيئة · 3 من 6 دورات'), pct:'50%', img:IMG.znm },
        kpis:[1,3,2,310], kn:[L('1 course','دورة واحدة'), L('incl. VS Knowledge Assessment','منها تقييم المعرفة'), L('ready to download','قابلة للتنزيل'), L('#1 in Zayed National Museum','الأول في متحف زايد الوطني')],
        courses:[ cc('operational-readiness-role','Operational Readiness – Role-Specific','الجاهزية التشغيلية – حسب الدور','ZNM onboarding','التهيئة في المتحف',IMG.team,40,'40% · Unit 2 of 3','40% · الدرس 2 من 3',45,{ tag:L('Mandatory','إلزامية'), tagCls:'red' }),
          cc('museum-101','Museum 101','المتاحف 101','The World of Museums','عالم المتاحف',IMG.C02,0,notStarted[0],notStarted[1],60,{ tag:L('Mandatory','إلزامية'), tagCls:'red' }),
          cc('dct-world','DCT World','عالم الدائرة','All about DCT','كل شيء عن الدائرة',IMG.C01,0,notStarted[0],notStarted[1],45,{ tag:L('Mandatory','إلزامية'), tagCls:'red' }) ],
        mandatory:[ { en:'Introduction to Ticketing', a:'مقدمة في التذاكر', done:true }, { en:'Operational Readiness – Induction', a:'الجاهزية التشغيلية – التعريف', done:true }, { en:'Operational Readiness – Role-Specific', a:'الجاهزية التشغيلية – حسب الدور', pct:40, slug:'operational-readiness-role' }, { en:'Museum 101', a:'المتاحف 101', pct:0, slug:'museum-101' }, { en:'DCT World', a:'عالم الدائرة', pct:0, slug:'dct-world' } ],
        events:[ { day:'06', mon:L('Oct','أكتوبر'), title:L('Museum Safety Briefing','إحاطة السلامة في المتحف'), when:L('Today · 09:00–10:00 Gulf · Zayed National Museum, Saadiyat','اليوم · 09:00–10:00 بتوقيت الخليج · متحف زايد الوطني، السعديات'), tag:L('Live now','مباشر الآن'), tagCls:'red', cta:L('Details','التفاصيل'), href:'/znm/hub/workshops' } ],
        leaders:[ ['Yousef Al Zaabi','يوسف الزعابي','YZ',310,'#D63539','me'], ['Reem Al Shamsi','ريم الشامسي','RS',200,'#3B2F92',''] ],
        ai:[], surveys:false,
        resources:[ { ty:'PDF', cls:'', title:L('ZNM Visitor Code of Conduct','مدونة سلوك زوار المتحف'), sub:L('PDF · Zayed National Museum','PDF · متحف زايد الوطني') } ]
      },
      zu: {
        ey:L('ZU 24-Hour Challenge','تحدي جامعة زايد'), sub:L('Your challenge course, your submission and the round timeline.','دورة التحدي ومشاركتك والجدول الزمني للجولة.'), continueBtn:L('Competition dashboard','لوحة المسابقة'), continueHref:'/zu/competition/dashboard',
        clTitle:L('Your challenge course','دورة التحدي'), evTitle:L('Events','الفعاليات'),
        w:{ ey:L('Submission received','تم استلام مشاركتك'), h:L('Well done, ','أحسنت يا ') + first, p:L('Your pitch is in and the judges are scoring it now. Results are published after the round closes on 20 October.','وصلت مشاركتك ويقيّمها المحكّمون الآن. تُعلن النتائج بعد إغلاق الجولة في 20 أكتوبر.'), cta:L('View my submission','عرض مشاركتي'), href:'/zu/competition/dashboard', prog:L('24 Hour Challenge course · 100%','دورة التحدي · 100%'), pct:'100%', img:IMG.zu },
        kpis:[0,1,1,130], kn:[L('all caught up','لا شيء متبقٍ'), L('24 Hour Challenge','تحدي 24 ساعة'), L('ready to download','قابلة للتنزيل'), L('#1 in ZU 24-Hour Challenge','الأول في تحدي جامعة زايد')],
        courses:[ cc('24-hour-challenge','24 Hour Challenge – Introduction to Cultural Heritage','تحدي 24 ساعة – مقدمة في التراث الثقافي','Cultural Heritage','التراث الثقافي',IMG.C13,100,'Completed · 4 of 4 units','مكتملة · 4 من 4 دروس',90,{ bar:'#15801A', tag:L('Completed','مكتملة'), tagCls:'ok' }) ],
        mandatory:[], events:[],
        leaders:[ ['Ahmed Khan','أحمد خان','AK',130,'#D63539','me'], ['Sara Haddad','سارة حداد','SH',90,'#3B2F92',''] ],
        ai:[], surveys:false, resources:[]
      },
      museopro: {
        ey:L('MuseoPro','ميوزيو برو'), sub:L('Professional museum training with France Muséums — mandatory courses first.','تدريب متحفي احترافي مع France Muséums — الدورات الإلزامية أولاً.'), continueBtn:L('Continue learning','تابع التعلّم'), continueHref:'/museopro/learn/conservation-exhibition',
        clTitle:L('Your courses','دوراتك'), evTitle:L('Events','الفعاليات'),
        w:{ ey:L('Welcome back','مرحباً بعودتك'), h:greet, p:L('Conservation and Exhibition of Artefacts is 30% done — finish it to complete your mandatory MuseoPro track.','أنجزتِ 30% من «صون وعرض القطع» — أكمليها لإنهاء المسار الإلزامي.'), cta:L('Resume Conservation','تابعي «صون وعرض القطع»'), href:'/museopro/learn/conservation-exhibition', prog:L('Conservation and Exhibition · 30%','صون وعرض القطع · 30%'), pct:'30%', img:IMG.museopro },
        kpis:[1,1,1,140], kn:[L('1 course','دورة واحدة'), L('Condition Report','تقرير الحالة'), L('ready to download','قابلة للتنزيل'), L('#1 in MuseoPro','الأولى في ميوزيو برو')],
        courses:[ cc('conservation-exhibition','Conservation and Exhibition of Artefacts','صون وعرض القطع','Conservation and exhibition','صون القطع وعرضها',IMG.museopro,30,'30% · Unit 2 of 4','30% · الدرس 2 من 4',60,{ tag:L('Mandatory','إلزامية'), tagCls:'red' }),
          cc('curating-exhibition','Curating an Exhibition: From Concept to Production','تنظيم المعارض: من الفكرة إلى الإنتاج','Conservation and exhibition','صون القطع وعرضها',IMG.C14,0,notStarted[0],notStarted[1],70),
          cc('interpretation-tools','Written and Oral Interpretation Tools in Heritage','أدوات التفسير المكتوبة والشفهية في التراث','Interpretation and audience','التفسير وإدارة الجمهور',IMG.C17,0,'Opens soon','يتاح قريباً',45,{ tag:L('Coming soon','قريباً'), tagCls:'yel', href:'/museopro/hub/courses' }) ],
        mandatory:[ { en:'Condition Report: General Presentation', a:'تقرير الحالة: عرض عام', done:true }, { en:'Conservation and Exhibition of Artefacts', a:'صون وعرض القطع', pct:30, slug:'conservation-exhibition' } ],
        events:[], leaders:[ ['Élise Martin','إليز مارتن','EM',140,'#D63539','me'] ],
        ai:[], surveys:false, trainer:true,
        resources:[ { ty:'LINK', cls:'lk', title:L('Museum Glossary (ICOM)','مسرد مصطلحات المتاحف (ICOM)'), sub:L('Link · icom.museum','رابط · icom.museum') } ]
      },
      nibras: {
        ey:L('Nibras — DCT AI Champions','نبراس — أبطال الذكاء الاصطناعي'), sub:L('Your AI Aware track: take each course with our partner, then upload your certificate.','مسار «وعي بالذكاء الاصطناعي»: أكمل كل دورة لدى الشريك ثم ارفع شهادتك.'), continueBtn:L('Upload a certificate','ارفع شهادة'), continueHref:'/nibras/achievements',
        clTitle:L('Your AI courses','دورات الذكاء الاصطناعي'), evTitle:L('Events','الفعاليات'),
        w:{ ey:L('Track · AI Aware','المسار · وعي بالذكاء الاصطناعي'), h:greet, p:L('Introduction to Generative AI is approved. Upload your Ethics of AI certificate to finish the AI Aware track.','تمت الموافقة على «مقدمة في الذكاء الاصطناعي التوليدي». ارفع شهادة «أخلاقيات الذكاء الاصطناعي» لإكمال المسار.'), cta:L('Upload Ethics of AI certificate','ارفع شهادة أخلاقيات الذكاء الاصطناعي'), href:'/nibras/achievements', prog:L('AI Aware track · 1 of 2 courses','مسار الوعي · 1 من 2'), pct:'50%', img:IMG.nibras },
        kpis:[1,1,1,150], kn:[L('Ethics of AI','أخلاقيات الذكاء الاصطناعي'), L('Introduction to Generative AI','مقدمة في الذكاء الاصطناعي التوليدي'), L('external · approved','خارجية · معتمدة'), L('#1 in Nibras','الأول في نبراس')],
        courses:[ cc('ethics-of-ai','Ethics of AI','أخلاقيات الذكاء الاصطناعي','AI Aware','وعي بالذكاء الاصطناعي',IMG.C18,50,'Awaiting your certificate','بانتظار شهادتك',90,{ tag:L('External certificate','شهادة خارجية'), tagCls:'info' }),
          cc('prompt-engineering','Foundations of Prompt Engineering','أساسيات هندسة الأوامر','AI Practitioner','ممارس الذكاء الاصطناعي',IMG.nibras,0,notStarted[0],notStarted[1],180,{ tag:L('External certificate','شهادة خارجية'), tagCls:'info' }),
          cc('llmops','LLMOps','عمليات نماذج اللغة','AI Builder','مطوّر الذكاء الاصطناعي',IMG.team,0,notStarted[0],notStarted[1],240,{ tag:L('External certificate','شهادة خارجية'), tagCls:'info' }) ],
        mandatory:[ { en:'Introduction to Generative AI', a:'مقدمة في الذكاء الاصطناعي التوليدي', done:true, certHref:'/nibras/achievements' }, { en:'Ethics of AI', a:'أخلاقيات الذكاء الاصطناعي', pct:50, slug:'ethics-of-ai', ctaEn:'Upload', ctaA:'ارفع', href:'/nibras/achievements' } ],
        events:[], leaders:[ ['Hamad Al Mazrouei','حمد المزروعي','HM',150,'#D63539','me'] ],
        ai:[], surveys:false, resources:[]
      }
    };
    const CERT = { zu:{ title:L('24 Hour Challenge – Introduction to Cultural Heritage','تحدي 24 ساعة – مقدمة في التراث الثقافي'), date:'29/09/2026', meta:L('Issued 29 Sep 2026 · DCT-2026-C13-000041','صدرت 29 سبتمبر 2026 · DCT-2026-C13-000041'), tag:L('Issued','صادرة') },
      museopro:{ title:L('Condition Report: General Presentation','تقرير الحالة: عرض عام'), date:'18/09/2026', meta:L('Issued 18 Sep 2026 · DCT-2026-C14-000012','صدرت 18 سبتمبر 2026 · DCT-2026-C14-000012'), tag:L('Issued','صادرة') },
      nibras:{ title:L('Introduction to Generative AI','مقدمة في الذكاء الاصطناعي التوليدي'), date:'16/09/2026', meta:L('External certificate · approved 16 Sep 2026','شهادة خارجية · اعتُمدت 16 سبتمبر 2026'), tag:L('Approved','معتمدة') } };
    const d = D[site];
    const el = site === 'elevate';
    const kpis = (d.kpiAlt ? d.kpiAlt.map(x => ({ l:x[0], v:fmt(x[1]), u: x[4] === 'star' ? t.pts : (x[4] === 'award' ? '%' : ''), n:x[2], cls:x[3], d:KI[x[4]] }))
      : [ ['k-ink',KI.book], ['k-rasp',KI.done], ['k-yel',KI.award], ['k-red',KI.star] ].map((x, i) => ({ l:t.kp[i], v:fmt(d.kpis[i]), u: i === 3 ? t.pts : '', n:d.kn[i], cls:x[0], d:x[1] })));
    const mandatory = d.mandatory.map(m => m.done
      ? { title:L(m.en,m.a), done:true, todo:false, cls:'done', cta:t.cert, href: m.certHref || '/'+site+'/achievements', pct:'100%' }
      : { title:L(m.en,m.a), done:false, todo:true, cls:'todo', cta: m.ctaEn ? L(m.ctaEn,m.ctaA) : (m.pct > 0 ? L('Continue','تابع') : L('Start','ابدأ')), href: m.href || '/'+site+'/learn/'+m.slug, pct:m.pct+'%' });
    const left = mandatory.filter(m => m.todo).length;
    const leaders = d.leaders.map((x, i) => ({ rk:fmt(i+1), name: L(x[0],x[1]) + (x[5] ? L(' (you)',' (أنت)') : ''), ini:x[2], pts:fmt(x[3]), c:x[4], cls:x[5] }));
    const AIX = { 'culture-bot':{ name:L('Abu Dhabi Culture Bot','روبوت ثقافة أبوظبي'), desc:L('Ask about sites, history and events','اسأل عن المواقع والتاريخ والفعاليات'), c:'#A39089' }, 'career-coach':{ name:L('Career Coach','مدرّب المسار المهني'), desc: el ? L('Prepare for your next mentoring session','استعد لجلسة الإرشاد القادمة') : L('Plan your next role at DCT','خطّط لدورك القادم في الدائرة'), c:'#CE3F3F' } };
    const ai = d.ai.map(k => Object.assign({ href:'/'+site+'/ai/coach/'+k }, AIX[k]));
    const lbNoteMap = { museopro:L('You are the only ranked member so far — points come from completed units and courses.','أنتِ العضو الوحيد في الترتيب حتى الآن — تأتي النقاط من الدروس والدورات المكتملة.'), nibras:L('Points for external courses are added when your certificate is approved.','تُضاف نقاط الدورات الخارجية عند اعتماد شهادتك.') };
    const SITE_TABS = { employees:['courses','workshops'], elevate:['workshops'], znm:['courses','resources','workshops'], zu:['courses'], museopro:['courses','resources'], nibras:['courses'] }[site];

    // tour
    const step = this.state.tour === null ? (this.props.tour ? 1 : 0) : this.state.tour;
    const TS = [null,
      { h:L('Your learning hub','مركز التعلّم الخاص بك'), p:L('Everything for this programme lives in the sidebar. Use the hub switcher at the top to move between your microsites — no second sign-in.','كل ما يخص هذا البرنامج في الشريط الجانبي. استخدم مبدّل المراكز في الأعلى للتنقل بين مواقعك دون تسجيل دخول جديد.') },
      { h:L('Progress at a glance','تقدّمك بلمحة'), p:L('Courses in progress, completed courses, certificates and points update as you learn. Points place you on the leaderboard.','تتحدّث الدورات الجارية والمكتملة والشهادات والنقاط أثناء تعلّمك، والنقاط تحدد ترتيبك في لوحة المتصدرين.') },
      { h:L('Language, alerts and profile','اللغة والتنبيهات والملف'), p:L('Switch between English and Arabic, see reminders for sessions and certificates, and manage your profile here.','بدّل بين العربية والإنجليزية، واطّلع على تذكيرات الجلسات والشهادات، وأدِر ملفك الشخصي من هنا.') } ];
    const tour = step ? { step:L('Quick tour · ','جولة سريعة · ') + fmt(step) + L(' of 3',' من 3'), h:TS[step].h, p:TS[step].p, cls:'s'+step, next: step === 3 ? t.finish : t.next, canBack: step > 1, first: step === 1, dots:[1,2,3].map(n => ({ cls: n === step ? 'on' : '' })) } : { step:'', h:'', p:'', cls:'', next:'', canBack:false, first:false, dots:[] };

    const rates = [1,2,3,4,5].map(n => ({ n:fmt(n), on: this.state.svRate === n, pick: () => this.setState({ svRate:n, svErr:false }) }));
    const svDone = this.state.svDone;
    return {
      lang, dir: ar?'rtl':'ltr', t, d, sh, kpis, courses:d.courses, w:d.w, events:d.events, mandatory, leaders, ai, resources:d.resources, rates, tour,
      protoCls: this.props.proto ? 'proto' : '', route: '/'+site+'/dashboard',
      tourCls: step ? 'touring tour'+step : '', tourOn: step > 0, tour2: step === 2, tourTop: step === 1 || step === 3,
      retCls: step ? '' : 'is-on', firstCls: step ? 'is-on' : '',
      greet: L('Your learning dashboard','لوحة التعلّم الخاصة بك'),
      hasCourses: d.courses.length > 0, clCls: d.courses.length === 3 ? 'c3' : (d.courses.length === 1 ? 'c1' : ''),
      hasMentoring: el, hasTrainer: !!d.trainer, hasComp: site === 'zu',
      hasMandatory: mandatory.length > 0, mdTag: left ? t.mdLeft(fmt(left)) : t.mdAll, mdTagCls: left ? 'warn' : 'ok',
      hasSurveys: d.surveys, svOpen: !svDone, svDone, svTag: svDone ? t.svDoneTag : t.svOpenTag, svTagCls: svDone ? 'ok' : 'info',
      hasResources: d.resources.length > 0, resHref:'/'+site+'/hub/resources',
      noEvents: d.events.length === 0, hasEventsTab: SITE_TABS.indexOf('workshops') > -1,
      hasAi: ai.length > 0, hasLeaders: leaders.length > 0, hasGrow: el,
      grow: [ ['G',L('Goal','الهدف'),L('Lead a small exhibition project by Q2 2027','قيادة مشروع معرض صغير بحلول الربع الثاني 2027')], ['R',L('Reality','الواقع'),L('Strong content skills, limited budget experience','مهارات قوية في المحتوى وخبرة محدودة في الميزانيات')], ['O',L('Options','الخيارات'),L('Shadow the finance lead; take C16 Curating an Exhibition','مرافقة مسؤول المالية؛ الالتحاق بدورة تنظيم المعارض')], ['W',L('Way forward','الخطوة التالية'),L('Enrol in C16 this week; draft a one-page project brief before session 2','التسجيل في الدورة هذا الأسبوع وكتابة موجز للمشروع من صفحة واحدة قبل الجلسة 2')] ].map(x => ({ k:x[0], l:x[1], v:x[2] })), hasCert: !!CERT[site], cert: CERT[site] || { title:'', meta:'', tag:'', date:'' }, lbNote: lbNoteMap[site] || false,
      coursesHref:'/'+site+'/hub/courses', eventsHref:'/'+site+'/hub/workshops', mentorHref:'/elevate/mentoring/mentor/hessa', achHref:'/'+site+'/achievements',
      svDlg: this.state.svDlg, svErr: this.state.svErr, svText: this.state.svText, svCount: fmt(this.state.svText.length) + ' / ' + fmt(500),
      openSurvey: () => this.setState({ svDlg:true }), closeSurvey: () => this.setState({ svDlg:false, svErr:false }),
      onSvText: (e) => this.setState({ svText: e.target.value.slice(0,500) }),
      submitSurvey: () => { if (!this.state.svRate) { this.setState({ svErr:true }); return; } this.setState({ svDlg:false, svDone:true }); this.flash(t.svSent); },
      toast: this.state.toast || false,
      tourStart: () => this.setState({ tour:1 }), tourOff: () => this.setState({ tour:0 }),
      tourNext: () => { if (step >= 3) { this.setState({ tour:0 }); this.flash(t.tourDone); } else this.setState({ tour: step + 1 }); },
      tourBack: () => this.setState({ tour: Math.max(1, step - 1) }),
      siteBtns: [['employees','Employees'],['elevate','Elevate'],['znm','ZNM'],['zu','ZU'],['museopro','MuseoPro'],['nibras','Nibras']].map(x => ({ label:x[1], cls: x[0] === site ? 'is-on' : '', on: x[0] === site ? 'true' : 'false', pick: () => this.setState({ site:x[0], svDone:false, svRate:0, svText:'' }) })),
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' })
    };
  }
}
