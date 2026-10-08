// Ported verbatim from the Claude Design artboard P02-Employees (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, tab:null, mail:'', res:'', fil:'all' }; }
  chrome(ar, active){
    const N = ar ? [['home','/','الرئيسية'],['professionals','/professionals','الموظفون'],['students','/students','الطلاب'],['faq','/faq','الأسئلة الشائعة']]
                 : [['home','/','Home'],['professionals','/professionals','Employees'],['students','/students','Students'],['faq','/faq','FAQ']];
    const T = ar ? { homeAria:'الصفحة الرئيسية لـ DCT Learn', navAria:'التنقل الرئيسي', langAria:'التبديل إلى الإنجليزية', signIn:'تسجيل الدخول', register:'موظف في الدائرة؟ سجّل', forgot:'إعادة تعيين كلمة المرور', skip:'انتقل إلى المحتوى',
        blurb:'DCT Learn هي منصة التعلم التابعة لدائرة الثقافة والسياحة – أبوظبي للموظفين والشركاء والمجتمع الثقافي الأوسع.', explore:'استكشف', account:'الحساب', contact:'تواصل معنا', emp:'الموظفون', stu:'الطلاب', prog:'البرامج', faq:'الأسئلة الشائعة', privacy:'الخصوصية', access:'إمكانية الوصول', copyright:'دائرة الثقافة والسياحة – أبوظبي. جميع الحقوق محفوظة.', powered:'بدعم من' }
               : { homeAria:'DCT Learn home', navAria:'Main', langAria:'Switch to Arabic', signIn:'Sign in', register:'DCT employee? Register', forgot:'Reset password', skip:'Skip to content',
        blurb:'DCT Learn is the learning platform of the Department of Culture and Tourism – Abu Dhabi for employees, partners and the wider cultural community.', explore:'Explore', account:'Account', contact:'Contact', emp:'Employees', stu:'Students', prog:'Programmes', faq:'FAQ', privacy:'Privacy', access:'Accessibility', copyright:'Department of Culture and Tourism – Abu Dhabi. All rights reserved.', powered:'Powered by' };
    T.nav = N.map((x) => ({ href:x[1], l:x[2], cur: x[0] === active ? 'page' : 'false' }));
    return T;
  }
  scrollTo(id){
    return (e) => { if (e && e.preventDefault) e.preventDefault(); const root = e && e.currentTarget && e.currentTarget.closest ? e.currentTarget.closest('.ds') : document; const el = (root || document).querySelector('#' + id); if (!el) return; const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; el.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block:'start' }); if (el.focus) { el.focus({ preventScroll:true }); } };
  }

  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const L = (e, a) => ar ? a : e;
    const B = (id) => '/_blob/' + id;
    const EN = { spec:'Employees information', kNew:'Employees', kicker:'Self-register with your @dctabudhabi.ae e-mail',
      h1:'Grow your career at DCT Abu Dhabi', hl:[2],
      sub:'One hub for every DCT colleague: mandatory onboarding, courses on culture, heritage and tourism, workshops, mentors and AI coaches — in Arabic and English.',
      ctaReg:'Register as an employee', ctaSign:'I already have an account', hf1:'courses in your hub', hf2:'mandatory to start', hf3:'AI coaches and tools',
      oEy:'What you get', oTitle:'Everything in your DCT Employees hub', oSub:'Five tabs, one sign-in. Choose a tab to see what is inside.',
      mEy:'Start here', mTitle:'Two courses every colleague completes first', mSub:'Both are assigned the moment you register. Finish them to earn your first certificates and points on the leaderboard.', mandatory:'Mandatory', cert:'Certificate',
      rEy:'How registration works', rTitle:'Register in four steps', rSub:'Only DCT work e-mails can self-register. Colleagues in other programmes join by invitation.',
      cEy:'Before you start', cTitle:'Check your e-mail can register', cSub:'We only accept addresses that end in @dctabudhabi.ae.', cLbl:'Work e-mail', cBtn:'Check',
      okT:'You can register with this e-mail.', okB:'We will send a verification link to this address.', okCta:'Continue to registration',
      warnT:'This e-mail can’t self-register.', warnB:'Only @dctabudhabi.ae addresses can. If you were invited to a programme, use the link in your invitation e-mail.',
      errEmpty:'Enter your work e-mail.', errFormat:'Enter an e-mail like name@dctabudhabi.ae.',
      needT:'You’ll need', need:['Full name','Work e-mail','A password','Your level','Time in DCT'],
      cyEy:'Featured courses', cyTitle:'Courses in your hub', cySub:'The eight courses in DCT Employees. Sign in to see your progress.', filterAria:'Filter courses', cyCta:'Sign in to start learning',
      fEy:'Ready when you are', fTitle:'Your DCT e-mail is all you need', fSub:'Register in a few minutes, verify your e-mail and start DCT World today — on desktop or mobile.', fFaq:'Questions first? Read the FAQ', word:'Grow',
      fl:['All','Mandatory','Museums','Heritage and tourism','DCT and compliance'], showing:(n, m) => 'Showing ' + n + ' of ' + m + ' courses' };
    const AR = { spec:'معلومات الموظفين', kNew:'الموظفون', kicker:'سجّل بنفسك ببريدك \u2066@dctabudhabi.ae\u2069',
      h1:'انمُ في مسيرتك المهنية مع دائرة الثقافة والسياحة', hl:[1,2,3],
      sub:'مركز واحد لكل زملاء الدائرة: تهيئة إلزامية، ودورات في الثقافة والتراث والسياحة، وورش عمل، ومرشدون، ومدربون بالذكاء الاصطناعي — بالعربية والإنجليزية.',
      ctaReg:'سجّل كموظف', ctaSign:'لدي حساب بالفعل', hf1:'دورات في مركزك', hf2:'إلزاميتان للبدء', hf3:'مدربون وأدوات ذكية',
      oEy:'ما ستحصل عليه', oTitle:'كل شيء في مركز موظفي الدائرة', oSub:'خمسة أقسام وتسجيل دخول واحد. اختر قسماً لترى محتواه.',
      mEy:'ابدأ من هنا', mTitle:'دورتان يكملهما كل زميل أولاً', mSub:'تُسندان إليك لحظة التسجيل. أكملهما لتحصل على شهاداتك الأولى ونقاطك في لوحة المتصدرين.', mandatory:'إلزامية', cert:'شهادة',
      rEy:'كيف يتم التسجيل', rTitle:'سجّل في أربع خطوات', rSub:'يمكن التسجيل الذاتي ببريد العمل في الدائرة فقط. ينضم الزملاء في البرامج الأخرى بالدعوة.',
      cEy:'قبل أن تبدأ', cTitle:'تحقق من أن بريدك يقبل التسجيل', cSub:'نقبل فقط العناوين التي تنتهي بـ \u2066@dctabudhabi.ae\u2069.', cLbl:'بريد العمل', cBtn:'تحقق',
      okT:'يمكنك التسجيل بهذا البريد.', okB:'سنرسل رابط التحقق إلى هذا العنوان.', okCta:'تابع إلى التسجيل',
      warnT:'لا يمكن التسجيل الذاتي بهذا البريد.', warnB:'يقتصر ذلك على عناوين \u2066@dctabudhabi.ae\u2069. إن وصلتك دعوة إلى برنامج، فاستخدم الرابط الوارد في رسالة الدعوة.',
      errEmpty:'أدخل بريد العمل.', errFormat:'أدخل بريداً مثل \u2066name@dctabudhabi.ae\u2069.',
      needT:'ستحتاج إلى', need:['الاسم الكامل','بريد العمل','كلمة مرور','مستواك الوظيفي','مدة عملك في الدائرة'],
      cyEy:'دورات مختارة', cyTitle:'الدورات في مركزك', cySub:'الدورات الثماني في مركز موظفي الدائرة. سجّل الدخول لترى تقدّمك.', filterAria:'تصفية الدورات', cyCta:'سجّل الدخول لتبدأ التعلم',
      fEy:'جاهزون متى كنت جاهزاً', fTitle:'بريدك في الدائرة هو كل ما تحتاجه', fSub:'سجّل في دقائق، وأكّد بريدك، وابدأ «عالم الدائرة» اليوم — على الحاسوب أو الجوال.', fFaq:'لديك أسئلة؟ اقرأ الأسئلة الشائعة', word:'انمُ',
      fl:['الكل','إلزامية','المتاحف','التراث والسياحة','الدائرة والامتثال'], showing:(n, m) => 'عرض ' + n + ' من ' + m + ' دورات' };
    const t = ar ? AR : EN;
    const words = t.h1.split(' ').map((w, i) => ({ t:w, cls: t.hl.indexOf(i) >= 0 ? 'hl' : '', d:(0.2 + i*0.08)+'s' }));

    /* offers */
    const OK = ['courses','workshops','mentors','ai_coaches','ai_tools'];
    const O = {
      courses: { t:L('Courses','الدورات'), d:L('Eight courses with certificates','ثماني دورات بشهادات'), img:B('fa500a874150b2a1769785936a6d7785'), alt:L('DCT World course cover','غلاف دورة عالم الدائرة'),
        h:L('Learn at your own pace','تعلّم بالسرعة التي تناسبك'), p:L('Courses on DCT, museums, heritage, tourism and compliance — short units with video, audio and quizzes.','دورات عن الدائرة والمتاحف والتراث والسياحة والامتثال — دروس قصيرة بالفيديو والصوت والاختبارات.'),
        l:[L('Units of 10–15 minutes that save your place','دروس من 10 إلى 15 دقيقة تحفظ موضعك'),L('A certificate for every course you finish','شهادة لكل دورة تكملها')],
        rows:[{ t:L('DCT World','عالم الدائرة'), m:L('45 min · 4 units','45 دقيقة · 4 دروس'), c:'#EE3E43', mand:true },{ t:L('Data Protection for People and Performance','حماية البيانات'), m:L('30 min · 3 units · quiz','30 دقيقة · 3 دروس · اختبار'), c:'#3B2F92', mand:false }] },
      workshops: { t:L('Workshops','ورش العمل'), d:L('Live sessions and recordings','جلسات مباشرة وتسجيلات'), img:B('cf69d2b8596f972f4af9fc63c0137303'), alt:L('Curator presenting in a gallery','قيّم فني يقدّم في قاعة عرض'),
        h:L('Learn from DCT experts','تعلّم من خبراء الدائرة'), p:L('Masterclasses and briefings from across DCT. Missed one? Watch the recording when it suits you.','صفوف متقدمة وإحاطات من مختلف قطاعات الدائرة. فاتتك جلسة؟ شاهد التسجيل في الوقت المناسب لك.'),
        l:[L('Times always shown in Gulf time','المواعيد دائماً بتوقيت الخليج'),L('Recordings stay in your hub','تبقى التسجيلات في مركزك')],
        rows:[{ t:L('Creative Economy Masterclass','الصف المتقدم في الاقتصاد الإبداعي'), m:L('Thu 10 Sep · 11:00–13:00 Gulf · recording available','الخميس 10 سبتمبر · 11:00–13:00 بتوقيت الخليج · التسجيل متاح'), c:'#CD3151', mand:false }] },
      mentors: { t:L('Mentors','المرشدون'), d:L('Advice from experienced colleagues','نصائح من زملاء ذوي خبرة'), img:B('9842ff4b5522772462642e07bfb6d8c1'), alt:L('Mentor speaking with colleagues','مرشد يتحدث مع زملاء'),
        h:L('Talk to someone who has done it','تحدّث مع من سبقك في الطريق'), p:L('Book time with senior colleagues for advice on your role, your skills and your next step at DCT.','احجز وقتاً مع زملاء ذوي خبرة للحصول على نصائح حول دورك ومهاراتك وخطوتك التالية في الدائرة.'),
        l:[L('Book a slot in Gulf time and meet on Zoom','احجز موعداً بتوقيت الخليج والتقِ عبر Zoom'),L('Share feedback after every session','شارك ملاحظاتك بعد كل جلسة')],
        rows:[{ t:L('Mariam Khoury','مريم خوري'), m:L('Senior Manager, People & Performance · Tue, Thu 09:00–12:00','مديرة أولى، الأفراد والأداء · الثلاثاء والخميس 09:00–12:00'), c:'#15801A', mand:false }] },
      ai_coaches: { t:L('AI Coaches','المدربون الأذكياء'), d:L('Chat assistants for DCT topics','مساعدون للمحادثة في مواضيع الدائرة'), img:B('7430eed874cd248e04160ae211dc6b79'), alt:L('Colleagues at an AI workshop','زملاء في ورشة للذكاء الاصطناعي'),
        h:L('Ask a coach, any time','اسأل مدرباً في أي وقت'), p:L('Coaches trained on Abu Dhabi’s culture and on careers at DCT. Answers in Arabic or English.','مدربون مدرَّبون على ثقافة أبوظبي والمسارات المهنية في الدائرة. الإجابات بالعربية أو الإنجليزية.'),
        l:[L('Available whenever you are signed in','متاحون كلما سجّلت الدخول'),L('Your conversations stay private','تبقى محادثاتك خاصة')],
        rows:[{ t:L('Abu Dhabi Culture Bot','روبوت ثقافة أبوظبي'), m:L('Ask about sites, history and events','اسأل عن المواقع والتاريخ والفعاليات'), c:'#A39089', mand:false },{ t:L('Career Coach','مدرّب المسار المهني'), m:L('Plan your next role at DCT','خطّط لدورك القادم في الدائرة'), c:'#CE3F3F', mand:false }] },
      ai_tools: { t:L('AI Tools','الأدوات الذكية'), d:L('Practical tools for everyday work','أدوات عملية للعمل اليومي'), img:B('f53e39067997d52c15204d509b52dd30'), alt:L('Generative AI illustration','رسم توضيحي للذكاء الاصطناعي التوليدي'),
        h:L('Save time on everyday tasks','وفّر الوقت في المهام اليومية'), p:L('Tools that help you prepare training, plan sessions and draft materials — inside DCT Learn.','أدوات تساعدك على إعداد التدريب وتخطيط الجلسات وصياغة المواد — داخل DCT Learn.'),
        l:[L('Start from a short brief','ابدأ بوصف قصير'),L('Edit and download the result','عدّل النتيجة ونزّلها')],
        rows:[{ t:L('AI Lesson Planner','مخطط الدروس الذكي'), m:L('Draft a training session in minutes','صمّم جلسة تدريبية في دقائق'), c:'#EE3E43', mand:false }] }
    };
    const tab = this.state.tab || this.props.tab || 'courses';
    const offers = OK.map((k, i) => ({ n:'0'+(i+1), t:O[k].t, d:O[k].d, cls: k === tab ? 'on' : '', sel: k === tab ? 'true' : 'false', pick: () => this.setState({ tab:k }) }));
    const cur = O[tab];
    const curL = [{ img:cur.img, alt:cur.alt, k:cur.t, h:cur.h, p:cur.p, l:cur.l, rows:cur.rows }];
    const specTabs = OK.map((k) => ({ l:O[k].t, cls: k === tab ? 'is-on' : '', pick: () => this.setState({ tab:k }) }));

    /* mandatory */
    const mand = [
      { t:L('DCT World','عالم الدائرة'), d:L('Who we are, our sectors and your role in the visitor journey. The most-taken course on DCT Learn.','من نحن وقطاعاتنا ودورك في رحلة الزائر. الدورة الأكثر إقبالاً على DCT Learn.'), img:B('fa500a874150b2a1769785936a6d7785'), level:L('Beginner','مبتدئ'), min:L('45 min','45 دقيقة'), un:L('4 units','4 دروس'),
        units:[L('Who we are','من نحن'),L('Our sectors','قطاعاتنا'),L('Abu Dhabi’s cultural sites','المواقع الثقافية في أبوظبي'),L('Your role in the visitor journey','دورك في رحلة الزائر')] },
      { t:L('DCTLEARN','منصة DCT Learn'), d:L('A quick tour of the platform: your hub, your progress, certificates and points.','جولة سريعة في المنصة: مركزك وتقدّمك وشهاداتك ونقاطك.'), img:B('1309cd48586ad6e5374578ed63abc172'), level:L('Beginner','مبتدئ'), min:L('20 min','20 دقيقة'), un:L('2 units','درسان'),
        units:[L('Finding your way around','التعرّف على المنصة'),L('Progress, certificates and points','التقدّم والشهادات والنقاط')] }
    ].map((m) => ({ ...m, aria: m.t + ' — ' + t.mandatory + ', ' + m.min }));

    const steps = (ar ? [
      ['افتح صفحة تسجيل الموظفين','من زر «سجّل كموظف» في هذه الصفحة أو من رابط «موظف في الدائرة؟ سجّل» في صفحة الدخول.'],
      ['استخدم بريدك \u2066@dctabudhabi.ae\u2069','يُقبل بريد العمل في الدائرة فقط، ويُرفض أي نطاق آخر.'],
      ['أخبرنا عن دورك','اسمك الكامل وكلمة المرور ومستواك ومدة عملك في الدائرة: أقل من 6 أشهر، من سنة إلى سنتين، أو أكثر من سنتين.'],
      ['أكّد بريدك ثم سجّل الدخول','افتح رابط التحقق الذي نرسله إليك، ثم سجّل الدخول وابدأ «عالم الدائرة».']
    ] : [
      ['Open employee registration','Use “Register as an employee” on this page, or “DCT employee? Register” on the sign-in page.'],
      ['Use your @dctabudhabi.ae e-mail','Only DCT work e-mails are accepted. Any other domain is refused.'],
      ['Tell us about your role','Your full name, a password, your level and time in DCT: less than 6 months, 1–2 years or more than 2 years.'],
      ['Verify, then sign in','Open the verification link we e-mail you, sign in and start DCT World.']
    ]).map((x, i) => ({ n:'0'+(i+1), t:x[0], b:x[1] }));

    /* e-mail checker */
    const mail = this.state.mail, res = this.state.res;
    const badMsg = res === 'empty' ? t.errEmpty : res === 'format' ? t.errFormat : '';

    /* courses C01–C08 */
    const CS = [
      ['C01','DCT World','عالم الدائرة','All about DCT','كل ما يخص الدائرة','dct',1,45,4,'fa500a874150b2a1769785936a6d7785',true],
      ['C02','Museum 101','المتاحف 101','The World of Museums','عالم المتاحف','museums',1,60,5,'d99ea09adede7395461223b429f24cf4',false],
      ['C03','DCTLEARN','منصة DCT Learn','All about DCT','كل ما يخص الدائرة','dct',1,20,2,'1309cd48586ad6e5374578ed63abc172',true],
      ['C04','Understanding Cultural Heritage','فهم التراث الثقافي','Cultural Heritage','التراث الثقافي','heritage',1,50,4,'592272d2d94f43d123cbcdda07b02178',false],
      ['C05','Sustainable Tourism','السياحة المستدامة','Tourism Management','إدارة السياحة','heritage',2,60,4,'d01461a3f6ad3ced258aac4713f94408',false],
      ['C06','The World of Curation','عالم التقييم الفني','The World of Museums','عالم المتاحف','museums',2,55,4,'cf69d2b8596f972f4af9fc63c0137303',false],
      ['C07','Creative Tourism: What is it?','السياحة الإبداعية','Creative and Cultural Industries','الصناعات الثقافية والإبداعية','heritage',1,40,3,'f1cfe235742010d5ac7c29f64fa633a0',false],
      ['C08','Data Protection for People and Performance','حماية البيانات','Corporate Knowledge and Compliance','المعرفة المؤسسية والامتثال','dct',1,30,3,'d87a92b0c7b42fcdfdc06b70145ff332',false]
    ];
    const FK = ['all','mand','museums','heritage','dct'];
    const match = (c, f) => f === 'all' || (f === 'mand' ? c[10] : c[5] === f);
    const fil = this.state.fil;
    const fchips = FK.map((k, i) => ({ l:t.fl[i], n: CS.filter((c) => match(c, k)).length, cls: k === fil ? 'on' : '', on: k === fil ? 'true' : 'false', pick: () => this.setState({ fil:k }) }));
    const lvl = [L('Beginner','مبتدئ'), L('Intermediate','متوسط')];
    const courses = CS.filter((c) => match(c, fil)).map((c, i) => ({ key:c[0], title: ar ? c[2] : c[1], cat: ar ? c[4] : c[3], level: lvl[c[6]-1], min: L(c[7]+' min', c[7]+' دقيقة'), units: L(c[8]+' units', c[8]+' دروس'), img:B(c[9]), mand:c[10], dl:(i*0.05)+'s', aria:(ar ? c[2] : c[1]) + ' — ' + L('sign in to start','سجّل الدخول للبدء') }));

    return {
      lang, dir: ar?'rtl':'ltr', t, words, ch: this.chrome(ar, 'professionals'),
      protoCls: this.props.proto ? 'proto' : '',
      offers, cur, curL, specTabs, mand, steps,
      mail, onMail: (e) => this.setState({ mail: e.target.value, res:'' }),
      check: () => { const v = (this.state.mail || '').trim().toLowerCase(); let r = 'ok'; if (!v) r = 'empty'; else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) r = 'format'; else if (!/@dctabudhabi\.ae$/.test(v)) r = 'warn'; this.setState({ res:r }); },
      resOk: res === 'ok', resWarn: res === 'warn', resBad: res === 'empty' || res === 'format', badMsg,
      chkInp: res === 'ok' ? 'is-valid' : (res === 'empty' || res === 'format' || res === 'warn') ? 'is-error' : '',
      chkInvalid: (res === 'empty' || res === 'format' || res === 'warn') ? 'true' : 'false',
      fchips, courses, shown: t.showing(courses.length, CS.length),
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }), langLabel: ar ? 'EN' : 'عربي',
      skipMain: this.scrollTo('main')
    };
  }
}
