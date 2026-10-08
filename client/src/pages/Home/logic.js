// Ported verbatim from the Claude Design artboard Home (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, panel:0, step:0, k:0, tick:0, paused:false, fq:'', fcat:'all', open:0 }; }
  componentDidMount(){
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { this.setState({ k:1 }); return; }
    const t0 = performance.now(); const dur = 1800;
    const run = (now) => { const p = Math.min(1, (now - t0 - 500) / dur); this.setState({ k: p < 0 ? 0 : 1 - Math.pow(1 - p, 3) }); if (p < 1) this.raf = requestAnimationFrame(run); };
    this.raf = requestAnimationFrame(run);
    this.timer = setInterval(() => this.setState({ tick: this.state.tick + 1 }), 3600);
  }
  componentWillUnmount(){ cancelAnimationFrame(this.raf); clearInterval(this.timer); }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const EN = { spec:'Main home', skip:'Skip to content', navProg:'Programmes', navHow:'How it works', navCourses:'Courses', navFaq:'FAQ', navEmp:'Employees', navStu:'Students', signIn:'Sign in', register:'DCT employee? Register', forgot:'Reset password',
      kNew:'New', kicker:'Elevate 2026 mentee registration is open',
      h1:'Learn the culture you help create', hlWords:[3,4,5],
      sub:'DCT Learn is the Department of Culture and Tourism – Abu Dhabi’s home for courses, mentoring and programmes — for colleagues, museum teams, partners and students, in Arabic and English.',
      explore:'Explore programmes', hf1:'programmes', hf2:'courses', hf3:'Arabic and English',
      statsEy:'DCT Learn in numbers', statsTitle:'One platform for the people behind Abu Dhabi’s culture', statsSub:'From a first day at DCT to a museum shift on Saadiyat, every programme lives in one place — with one sign-in.',
      s:['Programmes, each with its own hub','Courses in English and Arabic','Mentors from DCT leadership','Certificates issued this year'], sTag:['Hubs','Catalogue','Elevate','2026'],
      progEy:'Programmes', progTitle:'Find your learning hub', progSub:'Every programme has its own courses, sessions and community. Hover or tap to explore — one sign-in reaches every hub you belong to.', prev:'Previous programme', next:'Next programme', invite:'Invite only', interest:'Register interest', enter:'Enter programme', regInt:'Register interest',
      howEy:'How it works', howTitle:'From sign-in to certificate', howSub:'Four steps, the same on desktop and mobile. Hover the preview to pause.',
      st:[['Sign in once','Use your @dctabudhabi.ae e-mail, or the link in your programme invitation.',['Single sign-in for every programme','Invitation links activate your account','Arabic or English from the first screen']],['Choose your hub','Members of several programmes pick one; everyone else goes straight to their dashboard.',['See progress for each programme','Switch hubs at any time','Mandatory courses flagged first']],['Learn your way','Short units with video, audio and case studies. Progress saves on every device.',['Units of 10–15 minutes','Pick up where you left off','Quizzes check what you learnt']],['Earn and share','Points and badges along the way, and a certificate when you finish.',['Certificates with your name and date','Points on the leaderboard','Download or share to your profile']]],
      urls:['learn.dctabudhabi.ae/login','learn.dctabudhabi.ae/hubs','learn.dctabudhabi.ae/dct-world/unit-3','learn.dctabudhabi.ae/certificates'],
      stepK:'Step',
      ph0t:'Welcome back', ph0s:'Sign in with your DCT e-mail', ph1t:'Choose your learning hub', ph2u:'Module 2 · Unit 3', ph2t:'Abu Dhabi’s cultural sites', pts:'points', complete:'complete', outline:['Who we are','Our sectors','Abu Dhabi’s cultural sites','Quiz'],
      cEy:'Featured courses', cTitle:'Where colleagues start', cSub:'Real courses from the DCT Learn catalogue — sign in to see the ones assigned to you.', cAll:'Browse after sign-in', mandatory:'Mandatory',
      audEy:'Who it’s for', audTitle:'Two ways into DCT Learn', empChip:'For DCT employees', empT:'Grow at DCT', empB:'Onboarding, mandatory compliance and courses on culture, heritage and tourism — registered with your @dctabudhabi.ae e-mail.', empL:['Mandatory courses','Mentoring','AI coaches and tools'], empCta:'Employee registration', stuChip:'For students', stuT:'Challenge yourself', stuB:'Competitions and introductory courses with Abu Dhabi’s universities, like the Zayed University 24-Hour Challenge.', stuL:['24-Hour Challenge','Cultural heritage','Judged pitches'], stuCta:'Learn more',
      evEy:'Live and upcoming', evTitle:'Sessions across DCT Learn', evSub:'Workshops, briefings and kick-offs from every programme, in Gulf time.', liveNow:'Live now',
      partEy:'In partnership with', partTitle:'Built with Abu Dhabi’s cultural institutions', partSub:'Programmes are designed and delivered with leading museum and heritage partners.',
      affEy:'Also from Abu Dhabi', affTitle:'More places to learn', affSub:'Two sister platforms. Both open on their own sites in a new tab.', visit:'Visit', preview:'Preview',
      vxEy:'Visitor experience', vx:'Visitor experience training for front-line teams at Abu Dhabi’s museums, sites and attractions.', vxL:['Guest service','Accessibility','Cultural awareness'], vxH:'Deliver world-class visitor experiences',
      adEy:'Licensing', adtg:'Abu Dhabi Tourist Guide', adShort:'Tourist Guide', adtgB:'Licensing courses and renewals for tourist guides showing visitors the emirate.', adL:['Licensing','Heritage sites','Renewals'], adH:'Become a licensed Abu Dhabi tourist guide',
      faqEy:'FAQ', faqTitle:'Before you start', faqSub:'Quick answers to the questions colleagues ask most.', fqPh:'Search questions', fqNone:'No questions match. Try another word or write to us.', fc:['All','Getting started','Programmes','Language and access'],
      helpT:'Still stuck?', helpB:'The DCT Learn team replies within one working day.',
      fEy:'Ready when you are', fTitle:'Your next course is one sign-in away', fSub:'Pick up where you left off on any device, in Arabic or English.', word:'Learn',
      ftrBlurb:'DCT Learn is the learning platform of the Department of Culture and Tourism – Abu Dhabi for employees, partners and the wider cultural community.', ftrExplore:'Explore', ftrAccount:'Account', ftrContact:'Contact', privacy:'Privacy', access:'Accessibility', copyright:'Department of Culture and Tourism – Abu Dhabi. All rights reserved.', powered:'Powered by' };
    const AR = { spec:'الصفحة الرئيسية', skip:'انتقل إلى المحتوى', navProg:'البرامج', navHow:'كيف تعمل', navCourses:'الدورات', navFaq:'الأسئلة الشائعة', navEmp:'الموظفون', navStu:'الطلاب', signIn:'تسجيل الدخول', register:'موظف في الدائرة؟ سجّل', forgot:'إعادة تعيين كلمة المرور',
      kNew:'جديد', kicker:'التسجيل للمتدربين في إرتقاء 2026 مفتوح',
      h1:'تعلّم الثقافة التي تساهم في صنعها', hlWords:[1,2],
      sub:'DCT Learn هي منصة دائرة الثقافة والسياحة – أبوظبي للدورات والإرشاد والبرامج — للزملاء وفرق المتاحف والشركاء والطلاب، بالعربية والإنجليزية.',
      explore:'استكشف البرامج', hf1:'برامج', hf2:'دورة', hf3:'العربية والإنجليزية',
      statsEy:'DCT Learn بالأرقام', statsTitle:'منصة واحدة لمن يصنعون ثقافة أبوظبي', statsSub:'من اليوم الأول في الدائرة إلى مناوبة في متحف بالسعديات، كل البرامج في مكان واحد — بتسجيل دخول واحد.',
      s:['برامج، لكل منها مركزه','دورة بالعربية والإنجليزية','مرشدين من قيادات الدائرة','شهادة صدرت هذا العام'], sTag:['المراكز','الكتالوج','إرتقاء','2026'],
      progEy:'البرامج', progTitle:'اختر مركز التعلم الخاص بك', progSub:'لكل برنامج دوراته وجلساته ومجتمعه. مرّر أو اضغط للاستكشاف — تسجيل دخول واحد يوصلك إلى كل مراكزك.', prev:'البرنامج السابق', next:'البرنامج التالي', invite:'بالدعوة فقط', interest:'سجّل اهتمامك', enter:'ادخل إلى البرنامج', regInt:'سجّل اهتمامك',
      howEy:'كيف تعمل', howTitle:'من تسجيل الدخول إلى الشهادة', howSub:'أربع خطوات، هي نفسها على الحاسوب والجوال. مرّر فوق المعاينة لإيقافها.',
      st:[['سجّل الدخول مرة واحدة','استخدم بريدك @dctabudhabi.ae أو رابط دعوة البرنامج.',['دخول واحد لكل البرامج','روابط الدعوة تفعّل حسابك','العربية أو الإنجليزية من الشاشة الأولى']],['اختر مركزك','يختار أعضاء أكثر من برنامج واحداً؛ ويذهب الباقون مباشرة إلى لوحتهم.',['تقدّمك في كل برنامج','بدّل بين المراكز في أي وقت','الدورات الإلزامية أولاً']],['تعلّم بطريقتك','دروس قصيرة بالفيديو والصوت ودراسات الحالة. يُحفظ تقدمك على كل الأجهزة.',['دروس من 10 إلى 15 دقيقة','تابع من حيث توقفت','اختبارات قصيرة لما تعلمته']],['اكسب وشارك','نقاط وشارات خلال الرحلة، وشهادة عند الإكمال.',['شهادات باسمك وتاريخ الإكمال','نقاط في لوحة المتصدرين','نزّلها أو شاركها في ملفك']]],
      urls:['learn.dctabudhabi.ae/login','learn.dctabudhabi.ae/hubs','learn.dctabudhabi.ae/dct-world/unit-3','learn.dctabudhabi.ae/certificates'],
      stepK:'الخطوة',
      ph0t:'مرحباً بعودتك', ph0s:'سجّل الدخول ببريد الدائرة', ph1t:'اختر مركز التعلم', ph2u:'الوحدة 2 · الدرس 3', ph2t:'المواقع الثقافية في أبوظبي', pts:'نقطة', complete:'مكتمل', outline:['من نحن','قطاعاتنا','المواقع الثقافية في أبوظبي','اختبار'],
      cEy:'دورات مختارة', cTitle:'من هنا يبدأ الزملاء', cSub:'دورات حقيقية من كتالوج DCT Learn — سجّل الدخول لترى الدورات المخصصة لك.', cAll:'تصفح بعد تسجيل الدخول', mandatory:'إلزامية',
      audEy:'لمن المنصة', audTitle:'طريقان إلى DCT Learn', empChip:'لموظفي الدائرة', empT:'انمُ في الدائرة', empB:'التهيئة والامتثال الإلزامي ودورات في الثقافة والتراث والسياحة — بالتسجيل ببريدك @dctabudhabi.ae.', empL:['دورات إلزامية','إرشاد','مدربون وأدوات ذكية'], empCta:'تسجيل الموظفين', stuChip:'للطلاب', stuT:'تحدَّ نفسك', stuB:'مسابقات ودورات تمهيدية مع جامعات أبوظبي، مثل تحدي جامعة زايد لـ24 ساعة.', stuL:['تحدي 24 ساعة','التراث الثقافي','عروض محكَّمة'], stuCta:'اعرف المزيد',
      evEy:'مباشر وقادم', evTitle:'جلسات في DCT Learn', evSub:'ورش عمل وإحاطات وجلسات انطلاق من كل البرامج، بتوقيت الخليج.', liveNow:'مباشر الآن',
      partEy:'بالشراكة مع', partTitle:'بالتعاون مع مؤسسات أبوظبي الثقافية', partSub:'تُصمَّم البرامج وتُقدَّم مع شركاء رائدين في المتاحف والتراث.',
      affEy:'أيضاً من أبوظبي', affTitle:'أماكن أخرى للتعلم', affSub:'منصتان شقيقتان، تُفتح كل منهما في نافذة جديدة.', visit:'زيارة', preview:'معاينة',
      vxEy:'تجربة الزائر', vx:'تدريب تجربة الزائر لفرق الخطوط الأمامية في متاحف أبوظبي ومواقعها ووجهاتها.', vxL:['خدمة الضيوف','إمكانية الوصول','الوعي الثقافي'], vxH:'قدّم تجربة زائر بمستوى عالمي',
      adEy:'الترخيص', adtg:'دليل أبوظبي السياحي', adShort:'الدليل السياحي', adtgB:'دورات الترخيص والتجديد للمرشدين السياحيين الذين يعرّفون الزوار بالإمارة.', adL:['الترخيص','المواقع التراثية','التجديد'], adH:'كن مرشداً سياحياً مرخّصاً في أبوظبي',
      faqEy:'أسئلة شائعة', faqTitle:'قبل أن تبدأ', faqSub:'إجابات سريعة لأكثر ما يسأله الزملاء.', fqPh:'ابحث في الأسئلة', fqNone:'لا توجد أسئلة مطابقة. جرّب كلمة أخرى أو راسلنا.', fc:['الكل','البداية','البرامج','اللغة والوصول'],
      helpT:'ما زلت تحتاج مساعدة؟', helpB:'يرد فريق DCT Learn خلال يوم عمل واحد.',
      fEy:'جاهزون متى كنت جاهزاً', fTitle:'دورتك التالية على بُعد تسجيل دخول واحد', fSub:'تابع من حيث توقفت على أي جهاز، بالعربية أو الإنجليزية.', word:'تعلّم',
      ftrBlurb:'DCT Learn هي منصة التعلم التابعة لدائرة الثقافة والسياحة – أبوظبي للموظفين والشركاء والمجتمع الثقافي الأوسع.', ftrExplore:'استكشف', ftrAccount:'الحساب', ftrContact:'تواصل معنا', privacy:'الخصوصية', access:'إمكانية الوصول', copyright:'دائرة الثقافة والسياحة – أبوظبي. جميع الحقوق محفوظة.', powered:'بدعم من' };
    const t = ar ? AR : EN;
    const B = (id) => '/_blob/' + id;
    const IM = { home:B('1309cd48586ad6e5374578ed63abc172'), emp:B('92c83a667e1befe5661dab8c7ebca349'), elev:B('9842ff4b5522772462642e07bfb6d8c1'), znm:B('6a330c17598da2f1e81b82711e1c5e9a'), zu:B('006f6b748b68e46ce2d045fcc3d92aea'), museo:B('2ff5095865986643708258995c8a0113'), nibras:B('7430eed874cd248e04160ae211dc6b79'), ruwaad:B('3e5eadfa4450ed50cc8f8900fdc8e3e3'), csmd:B('a39ca3b3c0fdaf9dcd07000a3da4c090'), C01:B('fa500a874150b2a1769785936a6d7785'), C02:B('d99ea09adede7395461223b429f24cf4'), C04:B('592272d2d94f43d123cbcdda07b02178'), C05:B('d01461a3f6ad3ced258aac4713f94408'), C06:B('cf69d2b8596f972f4af9fc63c0137303'), C07:B('f1cfe235742010d5ac7c29f64fa633a0'), C13:B('40780df486810d248ab2ca9a23d58dcb'), C14:B('403bd7970d9211d5acd7b2806550e6a7'), C18:B('f53e39067997d52c15204d509b52dd30'), badge:B('bb705401394f18f4059a3d2fb23a902e'), cert:B('470b14c6b2877a4912c03c8b902044b2') };
    const tk = this.state.tick;
    const set = (arr, off) => arr.map((src, i) => ({ src, cls: ((tk + off) % arr.length) === i ? 'on' : '' }));
    const words = t.h1.split(' ').map((w, i) => ({ t:w, cls: t.hlWords.indexOf(i) >= 0 ? 'hl' : '', d:(0.25 + i*0.09)+'s' }));
    const k = this.state.k;
    const fmt = (n) => Math.round(n).toLocaleString(ar ? 'ar-AE' : 'en-US');
    const stats = [9,23,3,1284].map((x, i) => ({ v: fmt(x*k), plus: i === 3 ? '+' : '', l:t.s[i], tag:t.sTag[i], ix:'0'+(i+1), dl:(0.15 + i*0.15)+'s' }));
    const progImgs = [IM.emp, IM.elev, IM.znm, IM.zu, IM.museo, IM.nibras, B('d87a92b0c7b42fcdfdc06b70145ff332'), IM.ruwaad, IM.csmd].map((src, i) => ({ src, i }));
    const courseImgs = [IM.C01, IM.C07, IM.C14, B('17f39841203c4958a320c0442a073383'), IM.C18].map((src, i) => ({ src, i, r: [-9,-4,1,5,9][i] + 'deg' }));
    const P = [
      ['employees', ar?'موظفو الدائرة':'DCT Employees', ar?'التعلم الأساسي':'Core learning', ar?'التهيئة والامتثال ودورات في الثقافة والتراث والسياحة لكل زملاء الدائرة.':'Onboarding, compliance and culture, heritage and tourism courses for every DCT colleague.', IM.emp, '#EE3E43', 'invite', ar?['الدورات','ورش العمل','أدوات الذكاء الاصطناعي']:['Courses','Workshops','AI tools']],
      ['elevate', ar?'إرتقاء 2026':'Elevate 2026', ar?'برنامج الإرشاد':'Mentorship', ar?'جلسات فردية منظمة مع مرشد أول من قيادات الدائرة، وأهداف GROW واضحة.':'Structured one-to-one sessions with a senior DCT mentor and clear GROW goals.', IM.elev, '#F77860', 'invite', ar?['المرشدون','الجلسات','المطابقة الذكية']:['Mentors','Sessions','AI matching']],
      ['znm', ar?'متحف زايد الوطني':'Zayed National Museum', ar?'برنامج التهيئة':'Onboarding', ar?'ست دورات إلزامية وإحاطة سلامة قبل مناوبتك الأولى في السعديات.':'Six mandatory courses and a safety briefing before your first shift on Saadiyat.', IM.znm, '#F7C337', 'invite', ar?['دورات إلزامية','الموارد','التقييمات']:['Mandatory courses','Resources','Assessments']],
      ['zu', ar?'تحدي جامعة زايد':'ZU 24-Hour Challenge', ar?'مسابقة طلابية':'Student competition', ar?'دورة في التراث الثقافي تنتهي بعرض فكرتك أمام لجنة تحكيم.':'A cultural heritage course that ends with your pitch in front of a judging panel.', IM.zu, '#F7C337', 'invite', ar?['مسابقة','لجنة تحكيم','خطة عمل']:['Competition','Judges','Action plan']],
      ['museopro', 'MuseoPro', ar?'مع فرانس ميوزيمز':'With France Muséums', ar?'تطوير مهارات المتخصصين في المتاحف والتراث: التوثيق والصون والمعارض.':'Upskilling museum and heritage professionals in documentation, conservation and exhibitions.', IM.museo, '#F77860', 'invite', ar?['الصون','المعارض','المدربون']:['Conservation','Exhibitions','Trainers']],
      ['nibras', ar?'نبراس':'Nibras', ar?'أبطال الذكاء الاصطناعي':'DCT AI Champions', ar?'ثلاثة مسارات — الوعي والممارسة والبناء — بشهادات خارجية معتمدة.':'Three tracks — Aware, Practitioner and Builder — with recognised external certificates.', IM.nibras, '#2FC4DB', 'invite', ar?['وعي','ممارس','بنّاء']:['AI Aware','Practitioner','Builder']],
      ['ruwaad', ar?'رواد':'Ruwaad', ar?'مهن في الضيافة':'Careers in Hospitality', ar?'يعرّف المواهب الإماراتية بالمهن في الفنادق والمطاعم وتجربة الضيوف.':'Introducing Emirati talent to careers in hotels, restaurants and guest experience.', IM.ruwaad, '#EE3E43', 'interest', ar?['الاستقبال','الأطعمة والمشروبات','الفعاليات']:['Front office','F&B','Events']]
    ];
    const pi = this.state.panel;
    const panels = P.map((x, i) => ({ n: String(i+1).padStart(2,'0'), name:x[1], sub:x[2], desc:x[3], img:x[4], accent:x[5], mode: x[6] === 'interest' ? t.interest : t.invite, tags:x[7], cls: i === pi ? 'on' : '', exp: i === pi ? 'true' : 'false', cta: x[6] === 'interest' ? t.regInt : t.enter, pick: () => { if (this.state.panel !== i) this.setState({ panel:i }); } }));
    const st = this.state.step;
    const steps = t.st.map((x, i) => ({ n: '0'+(i+1), t:x[0], cls: i === st ? 'on' : '', on: i === st ? 'true' : 'false', active: i === st, pick: () => this.setState({ step:i }) }));
    const cur = t.st[st];
    const curStep = [{ k: t.stepK + ' 0' + (st+1), t:cur[0], b:cur[1], l:cur[2] }];
    const hubs = [ { n: ar?'موظفو الدائرة':'DCT Employees', img:IM.emp, p:'68%', pl:'68% '+t.complete, c:'#EE3E43', st:'box-shadow:0 0 0 2px #D63539' }, { n: ar?'إرتقاء 2026':'Elevate 2026', img:IM.elev, p:'40%', pl:'40% '+t.complete, c:'#F77860', st:'' }, { n: ar?'متحف زايد الوطني':'Zayed National Museum', img:IM.znm, p:'85%', pl:'85% '+t.complete, c:'#3B2F92', st:'' } ];
    const outline = t.outline.map((o, i) => ({ t:o, st: i === 2 ? 'background:#FFF5F5;color:#BF2E32;font-weight:700' : '', dot: i < 2 ? 'background:#2FBF71' : (i === 2 ? 'border:2px solid #D63539' : 'border:2px solid #D5D9DE') }));
    const C = [
      { title: ar?'عالم الدائرة':'DCT World', cat: ar?'كل ما يخص الدائرة':'All about DCT', level: ar?'مبتدئ':'Beginner', min: ar?'45 د':'45 min', units: ar?'4 دروس':'4 units', img:IM.C01, desc: ar?'من نحن وقطاعاتنا ودورك في رحلة الزائر. أول دورة لكل زميل جديد.':'Who we are, our sectors and your role in the visitor journey. The first course for every new colleague.', where: ar?'موظفو الدائرة':'DCT Employees', mand:true, cls:'big' },
      { title: ar?'السياحة الإبداعية':'Creative Tourism: What is it?', cat: ar?'الصناعات الإبداعية':'Creative industries', level: ar?'مبتدئ':'Beginner', min: ar?'40 د':'40 min', units: ar?'3 دروس':'3 units', img:IM.C07, desc: ar?'كيف تصنع الثقافة تجارب سياحية لا تُنسى.':'How culture turns a visit into an experience people remember.', where: ar?'موظفو الدائرة':'DCT Employees', mand:false, cls:'' },
      { title: ar?'مدخل إلى المتاحف':'Museum 101', cat: ar?'المتاحف':'Museums', level: ar?'مبتدئ':'Beginner', min: ar?'35 د':'35 min', units: ar?'3 دروس':'3 units', img:IM.C02, desc: ar?'كيف تعمل المتاحف من المجموعات إلى تجربة الزائر.':'How museums work, from collections to the visitor experience.', where: ar?'متحف زايد الوطني':'Zayed National Museum', mand:true, cls:'' },
      { title: ar?'توثيق التراث الثقافي':'Documentation of Cultural Heritage', cat: ar?'التوثيق':'Documentation', level: ar?'متوسط':'Intermediate', min: ar?'50 د':'50 min', units: ar?'3 دروس':'3 units', img:IM.C14, desc: ar?'أساسيات توثيق حالة القطع الأثرية.':'The fundamentals of documenting an artefact’s condition.', where:'MuseoPro', mand:false, cls:'' },
      { title: ar?'مقدمة في الذكاء الاصطناعي التوليدي':'Introduction to Generative AI', cat: ar?'وعي':'AI Aware', level: ar?'مبتدئ':'Beginner', min: ar?'120 د':'120 min', units: ar?'شهادة خارجية':'External cert', img:IM.C18, desc: ar?'المسار الأول في نبراس.':'The first track in Nibras.', where: ar?'نبراس':'Nibras', mand:false, cls:'' }
    ].map((c, i) => ({ ...c, dl:(i*0.12)+'s' }));
    const events = (ar ? [
      { mon:'أكتوبر', day:'06', cat:'التقييمات', title:'إحاطة السلامة في المتحف', desc:'جولة ميدانية على المخارج ونقاط التجمع والإبلاغ عن الحوادث.', time:'اليوم · 09:00–10:00 بتوقيت الخليج', where:'متحف زايد الوطني، السعديات', cta:'لأعضاء متحف زايد', live:true },
      { mon:'أكتوبر', day:'08', cat:'الجلسات', title:'جلسة انطلاق الإرشاد', desc:'تعرّف على دفعتك واتفقوا على طريقة الجلسات وحدّد هدف GROW الأول.', time:'الأربعاء · 10:00–11:00 بتوقيت الخليج', where:'Zoom · إرتقاء 2026', cta:'سجّل في إرتقاء', live:false },
      { mon:'سبتمبر', day:'10', cat:'ورش العمل', title:'الصف المتقدم في الاقتصاد الإبداعي', desc:'كيف تنمو الصناعات الإبداعية في أبوظبي وأين تقع الدائرة منها.', time:'متاح كتسجيل', where:'موظفو الدائرة', cta:'شاهد التسجيل', live:false }
    ] : [
      { mon:'Oct', day:'06', cat:'Assessments', title:'Museum Safety Briefing', desc:'On-site walk-through of exits, assembly points and incident reporting.', time:'Today · 09:00–10:00 Gulf', where:'Zayed National Museum, Saadiyat', cta:'For ZNM members', live:true },
      { mon:'Oct', day:'08', cat:'Sessions', title:'Mentoring Kick-off Session', desc:'Meet your cohort, agree how sessions run and set your first GROW goal.', time:'Wednesday · 10:00–11:00 Gulf', where:'Zoom · Elevate 2026', cta:'Join Elevate', live:false },
      { mon:'Sep', day:'10', cat:'Workshops', title:'Creative Economy Masterclass', desc:'How Abu Dhabi’s creative industries are growing, and where DCT fits in.', time:'Available as a recording', where:'DCT Employees', cta:'Watch recording', live:false }
    ]).map((e, i) => ({ ...e, img:[IM.znm, IM.elev, IM.C06][i], cls: e.live ? 'live' : '' }));
    const partners = [
      { src:B('dc0ae6d896d4a402350748dffd80b8f1'), n: ar?'دائرة الثقافة والسياحة – أبوظبي':'Department of Culture and Tourism – Abu Dhabi' },
      { src:B('2b3254a011d37f2dc8ba5fadf6ce98c7'), n: ar?'أبوظبي للثقافة':'Abu Dhabi Culture' },
      { src:B('eee73c9704c8c5b98897e4e5e08055cd'), n:'France Muséums' },
      { src:B('6d0f8fa77d9e90d93ff89e579a1ea0f7'), n:'Réunion des Musées Nationaux' },
      { src:B('ac08204f06196439c00888e3dca1d62d'), n:'Institut national du patrimoine' }
    ];
    const FQ = ar ? [
      ['start','كيف أسجّل الدخول؟','يدخل موظفو الدائرة ببريدهم @dctabudhabi.ae. أما البرامج الأخرى فتصلك دعوة بالبريد الإلكتروني تتضمن رابط تفعيل الحساب.'],
      ['start','أنا موظف جديد في الدائرة. من أين أبدأ؟','سجّل من صفحة تسجيل الموظفين، وأكّد بريدك، ثم ابدأ بالدورتين الإلزاميتين «عالم الدائرة» و«منصة DCT Learn».'],
      ['prog','هل أحتاج إلى حساب منفصل لكل برنامج؟','لا. حساب واحد يوصلك إلى كل البرامج التي تنتمي إليها، وتختار بينها بعد تسجيل الدخول.'],
      ['prog','لم تصلني دعوة. ماذا أفعل؟','تواصل مع منسّق البرنامج أو راسلنا على learn@dctabudhabi.ae مع اسم البرنامج.'],
      ['prog','كيف أحصل على شهادتي؟','تصدر الشهادة تلقائياً عند إكمال كل دروس الدورة واجتياز الاختبار، وتجدها في صفحة الشهادات.'],
      ['lang','هل المنصة متاحة بالعربية؟','نعم. كل الصفحات والدورات متاحة بالعربية والإنجليزية، ويمكنك التبديل في أي وقت.'],
      ['lang','هل يمكنني التعلم من الجوال؟','نعم. تعمل المنصة على الجوال والحاسوب، ويُحفظ تقدّمك تلقائياً لتتابع من أي جهاز.']
    ] : [
      ['start','How do I sign in?','DCT employees sign in with their @dctabudhabi.ae e-mail. For other programmes you receive an e-mail invitation with a link to activate your account.'],
      ['start','I’m new at DCT. Where do I start?','Register on the employee registration page, verify your e-mail, then start with the two mandatory courses: DCT World and DCTLEARN.'],
      ['prog','Do I need a separate account for each programme?','No. One account reaches every programme you belong to — you choose between them after signing in.'],
      ['prog','I didn’t get an invitation. What should I do?','Contact your programme coordinator, or write to learn@dctabudhabi.ae with the programme name.'],
      ['prog','How do I get my certificate?','Your certificate is issued automatically when you finish every unit in a course and pass its quiz. You’ll find it on your Certificates page.'],
      ['lang','Is the platform available in Arabic?','Yes. Every page and course is available in Arabic and English, and you can switch at any time.'],
      ['lang','Can I learn on my phone?','Yes. DCT Learn works on mobile and desktop, and your progress saves automatically so you can continue on any device.']
    ];
    const catKeys = ['all','start','prog','lang'];
    const catName = { start:t.fc[1], prog:t.fc[2], lang:t.fc[3] };
    const fcat = this.state.fcat, q = (this.state.fq || '').trim().toLowerCase();
    const fcats = catKeys.map((c, i) => ({ l:t.fc[i], cls: c === fcat ? 'on' : '', on: c === fcat ? 'true' : 'false', pick: () => this.setState({ fcat:c, open:-1 }) }));
    const faqs = FQ.map((x, i) => ({ i, c:x[0], q:x[1], a:x[2] })).filter(x => (fcat === 'all' || x.c === fcat) && (!q || (x.q + ' ' + x.a).toLowerCase().indexOf(q) >= 0)).map((x, j) => ({ n: String(j+1).padStart(2,'0'), q:x.q, a:x.a, cat:catName[x.c], cls: x.i === this.state.open ? 'on' : '', exp: x.i === this.state.open ? 'true' : 'false', pick: () => this.setState({ open: this.state.open === x.i ? -1 : x.i }) }));
    return {
      protoCls: this.props.proto ? 'proto' : '',
      lang, dir: ar?'rtl':'ltr', t, words, s0:stats[0], s1:stats[1], s2:stats[2], s3:stats[3], progImgs, courseImgs, panels, steps, curStep, hubs, outline, courses: C, events, partners, faqs, fcats,
      noFaq: faqs.length === 0,
      tA: set([IM.csmd, IM.C13, IM.C05], 0), tB: set([IM.elev, IM.ruwaad, IM.C06], 1), tC: set([IM.C02, IM.C14, IM.C13], 2), tD: set([IM.nibras, IM.znm, IM.zu], 0),
      pIdx: String(pi+1).padStart(2,'0'), pTot: String(P.length).padStart(2,'0'),
      url: t.urls[st], bv0: st === 0 ? 'on' : '', bv1: st === 1 ? 'on' : '', bv2: st === 2 ? 'on' : '', bv3: st === 3 ? 'on' : '',
      howCls: this.state.paused ? 'paused' : '',
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }), langLabel: ar ? 'EN' : 'عربي',
      prevP: () => this.setState({ panel: (this.state.panel + P.length - 1) % P.length }),
      nextP: () => this.setState({ panel: (this.state.panel + 1) % P.length }),
      nextStep: (e) => { if (e && e.target !== e.currentTarget) return; this.setState({ step: (this.state.step + 1) % 4 }); },
      pauseHow: () => this.setState({ paused:true }), resumeHow: () => this.setState({ paused:false }),
      onFq: (e) => this.setState({ fq: e.target.value, open:-1 }),
      heroMove: (e) => { const el = e.currentTarget, cx = e.clientX, cy = e.clientY; if (this.hraf) return; this.hraf = requestAnimationFrame(() => { this.hraf = 0; const r = el.getBoundingClientRect(); const x = Math.round(((cx - r.left) / r.width - .5) * 20) / 20, y = Math.round(((cy - r.top) / r.height - .5) * 20) / 20; if (x === this.hpx && y === this.hpy) return; this.hpx = x; this.hpy = y; el.style.setProperty('--px', x); el.style.setProperty('--py', y); }); },
      heroLeave: (e) => { const el = e.currentTarget; cancelAnimationFrame(this.hraf); this.hraf = 0; this.hpx = this.hpy = 0; el.style.setProperty('--px', 0); el.style.setProperty('--py', 0); },
      tiltB: (e) => { const el = e.currentTarget; const r = el.getBoundingClientRect(); el.style.setProperty('--bx', ((e.clientX - r.left) / r.width - .5).toFixed(3)); el.style.setProperty('--by', ((e.clientY - r.top) / r.height - .5).toFixed(3)); },
      untiltB: (e) => { const el = e.currentTarget; el.style.setProperty('--bx', 0); el.style.setProperty('--by', 0); }
    };
  }
}
