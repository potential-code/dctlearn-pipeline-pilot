// Ported verbatim from the Claude Design artboard P04-FAQ (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){
    super(p);
    const v = p.view || 'default';
    this.state = Object.assign({ locale:null, view:v, open:{ 0:true }, voted:{} }, this.viewState(v, p.locale === 'ar'));
  }
  viewState(v, ar){
    if (v === 'filtered') return { fq:'', cat:'cert', open:{ 10:true } };
    if (v === 'search') return { fq: ar ? 'كلمة المرور' : 'password', cat:'all', open:{ 4:true } };
    if (v === 'empty') return { fq: ar ? 'مواقف السيارات' : 'parking', cat:'all', open:{} };
    return { fq:'', cat:'all', open:{ 0:true } };
  }
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
    const EN = { spec:'FAQ', ey:'Help centre', h1:'Questions, answered', sub:'Everything people ask about signing in, programmes, mentoring and certificates. Search, or browse by topic.',
      ph:'Search the FAQ, e.g. password', clear:'Clear search', popular:'Popular:', pops:['password','certificate','invitation'],
      s1:'questions', s2:'topics', s3:'working day to reply',
      topics:'Topics', cn:['All topics','Getting started','Accounts and sign-in','Programmes','Mentoring','Certificates','Language and accessibility'],
      helpT:'Can’t find it?', helpB:'Write to the DCT Learn team. We reply within one working day.',
      expand:'Expand all', collapse:'Collapse all', qs:'questions', q1:'question', useful:'Was this helpful?', yes:'Yes', no:'No', thxY:'Thanks for letting us know.', thxN:'Thanks — we’ll improve this answer.',
      noTag:'No results', noT:(q) => 'No questions match “' + q + '”', noTopic:'No questions in this topic', noB:'Try a different word, check the spelling, or browse all topics. You can also write to us and we’ll answer directly.', showAll:'Show all questions', write:'E-mail learn@dctabudhabi.ae',
      cEy:'Still need help?', cTitle:'Talk to the right people', cSub:'Most questions are answered above. For anything else, here is who can help.',
      c1t:'DCT Learn team', c1b:'Platform questions, technical problems and feedback. We reply within one working day, Sunday to Thursday.',
      c2t:'Your programme coordinator', c2b:'Invitations, programme dates, sessions and assessments are handled by the team that runs your programme.', c2l:'Find your programme',
      c3t:'Account help', c3b:'Do it yourself in a minute:', l1:'Reset your password', l2:'Register as a DCT employee', l3:'Sign in' };
    const AR = { spec:'الأسئلة الشائعة', ey:'مركز المساعدة', h1:'أسئلتك، مُجابة', sub:'كل ما يسأل عنه الناس حول تسجيل الدخول والبرامج والإرشاد والشهادات. ابحث أو تصفّح حسب الموضوع.',
      ph:'ابحث في الأسئلة، مثل: كلمة المرور', clear:'مسح البحث', popular:'الأكثر بحثاً:', pops:['كلمة المرور','شهادة','دعوة'],
      s1:'سؤالاً', s2:'مواضيع', s3:'يوم عمل للرد',
      topics:'المواضيع', cn:['كل المواضيع','البداية','الحساب وتسجيل الدخول','البرامج','الإرشاد','الشهادات','اللغة وإمكانية الوصول'],
      helpT:'لم تجد إجابتك؟', helpB:'راسل فريق DCT Learn. نرد خلال يوم عمل واحد.',
      expand:'فتح الكل', collapse:'إغلاق الكل', qs:'أسئلة', q1:'سؤال', useful:'هل كانت الإجابة مفيدة؟', yes:'نعم', no:'لا', thxY:'شكراً لإخبارنا.', thxN:'شكراً — سنحسّن هذه الإجابة.',
      noTag:'لا نتائج', noT:(q) => 'لا توجد أسئلة تطابق «' + q + '»', noTopic:'لا توجد أسئلة في هذا الموضوع', noB:'جرّب كلمة أخرى أو تحقق من الإملاء أو تصفّح كل المواضيع. يمكنك أيضاً مراسلتنا وسنجيبك مباشرة.', showAll:'عرض كل الأسئلة', write:'راسل \u2066learn@dctabudhabi.ae\u2069',
      cEy:'ما زلت تحتاج مساعدة؟', cTitle:'تواصل مع الجهة المناسبة', cSub:'معظم الأسئلة مُجابة أعلاه. ولأي أمر آخر، هذه الجهات تساعدك.',
      c1t:'فريق DCT Learn', c1b:'أسئلة المنصة والمشكلات التقنية والملاحظات. نرد خلال يوم عمل واحد، من الأحد إلى الخميس.',
      c2t:'منسّق برنامجك', c2b:'الدعوات ومواعيد البرنامج والجلسات والتقييمات يتولاها الفريق المسؤول عن برنامجك.', c2l:'ابحث عن برنامجك',
      c3t:'مساعدة الحساب', c3b:'أنجزها بنفسك في دقيقة:', l1:'أعد تعيين كلمة المرور', l2:'سجّل كموظف في الدائرة', l3:'تسجيل الدخول' };
    const t = ar ? AR : EN;
    const K = ['all','start','account','prog','ment','cert','lang'];
    const FQ = ar ? [
      ['start','ما هي DCT Learn؟','DCT Learn هي منصة التعلم التابعة لدائرة الثقافة والسياحة – أبوظبي. تجمع الدورات وورش العمل والإرشاد والمدربين الأذكياء والمسابقات لزملاء الدائرة وفرق المتاحف والشركاء والطلاب.','',''],
      ['start','أنا موظف جديد في الدائرة. من أين أبدأ؟','سجّل ببريدك ⁦\u2066@dctabudhabi.ae\u2069⁩ وأكّده، ثم ابدأ بالدورتين الإلزاميتين «عالم الدائرة» و«منصة DCT Learn».','تسجيل الموظفين','/employee-registration'],
      ['start','هل أحتاج إلى حساب منفصل لكل برنامج؟','لا. حساب واحد يوصلك إلى كل البرامج التي تنتمي إليها. وإن كنت في أكثر من برنامج، تختار مركز التعلم بعد تسجيل الدخول.','',''],
      ['account','كيف أسجّل الدخول؟','يسجّل زملاء الدائرة الدخول ببريد ⁦\u2066@dctabudhabi.ae\u2069⁩ وكلمة المرور. أما أعضاء البرامج الأخرى فيستخدمون البريد الذي أُرسلت إليه الدعوة. لا يمكن التسجيل الذاتي بالبريد الشخصي.','تسجيل الدخول','/login'],
      ['account','نسيت كلمة المرور. ماذا أفعل؟','اختر «نسيت كلمة المرور» في صفحة الدخول وأدخل بريدك. نرسل لك رابطاً لإعادة تعيين كلمة المرور يعمل مرة واحدة وتنتهي صلاحيته بعد 24 ساعة.','إعادة تعيين كلمة المرور','/reset-password'],
      ['account','انتهت صلاحية رابط الدعوة. ماذا الآن؟','روابط الدعوة صالحة لمدة 14 يوماً. اطلب من منسّق برنامجك إرسال دعوة جديدة — يتوقف الرابط القديم عن العمل بمجرد إرسال الجديد.','',''],
      ['prog','ما البرامج المتاحة على DCT Learn؟','موظفو الدائرة، وبرنامج إرتقاء للإرشاد، وتهيئة متحف زايد الوطني، وتحدي جامعة زايد لـ24 ساعة، وميوزيو برو، ونبراس — أبطال الذكاء الاصطناعي، ومنتدى التراث الثقافي. ولبرنامجَي رواد وإدارة المواقع الثقافية صفحات تعريفية.','استكشف البرامج','/'],
      ['prog','لم تصلني دعوة. ماذا أفعل؟','معظم البرامج بالدعوة. تواصل مع منسّق برنامجك، أو راسلنا على \u2066learn@dctabudhabi.ae\u2069 مع اسم البرنامج وبريد عملك.','',''],
      ['ment','كيف تتم مطابقة المرشدين في إرتقاء؟','بعد إكمال نموذج المتدرب القصير، تقترح DCT Learn ثلاثة مرشدين حسب مجالاتك المفضلة ولغتك وأهدافك. تختار واحداً منهم وتتم المطابقة فوراً.','برنامج إرتقاء','/elevate'],
      ['ment','كيف أحجز جلسة إرشاد أو أغيّر موعدها؟','احجز موعداً متاحاً من جدول مرشدك — تظهر المواعيد بتوقيت الخليج وتُعقد الجلسات عبر Zoom. يمكنك تغيير الموعد أو إلغاؤه حتى 24 ساعة قبل الجلسة.','',''],
      ['cert','كيف أحصل على شهادتي؟','تصدر الشهادة تلقائياً عند إكمال كل دروس الدورة واجتياز الاختبار النهائي إن وُجد. نزّلها من صفحة الإنجازات.','',''],
      ['cert','بعض دورات نبراس خارجية. كيف تُحتسب؟','في الدورات الخارجية، ارفع الشهادة التي حصلت عليها من الجهة المقدّمة. بعد موافقة فريق نبراس، تظهر الدورة مكتملة.','',''],
      ['lang','هل المنصة متاحة بالعربية؟','نعم. كل الصفحات والدورات متاحة بالعربية والإنجليزية. بدّل اللغة من الشريط العلوي في أي وقت، ويبقى تقدّمك كما هو.','',''],
      ['lang','هل DCT Learn سهلة الوصول؟ وهل تعمل على الجوال؟','تعمل الصفحات بلوحة المفاتيح وقارئات الشاشة، وللفيديوهات ترجمة نصية، ويطابق التباين معيار WCAG 2.1 AA. وتعمل المنصة على الجوال والحاسوب مع حفظ تقدّمك. أخبرنا إن واجهتك أي عقبة.','','']
    ] : [
      ['start','What is DCT Learn?','DCT Learn is the learning platform of the Department of Culture and Tourism – Abu Dhabi. It brings together courses, workshops, mentoring, AI coaches and competitions for DCT colleagues, museum teams, partners and students.','',''],
      ['start','I’m new at DCT. Where do I start?','Register with your @dctabudhabi.ae e-mail, verify it, then start the two mandatory courses: DCT World and DCTLEARN.','Employee registration','/employee-registration'],
      ['start','Do I need a separate account for each programme?','No. One account reaches every programme you belong to. If you are in more than one, you choose your learning hub after signing in.','',''],
      ['account','How do I sign in?','DCT colleagues sign in with their @dctabudhabi.ae e-mail and password. Members of other programmes use the e-mail address their invitation was sent to. Personal e-mail addresses can’t self-register.','Sign in','/login'],
      ['account','I forgot my password. What do I do?','Choose “Forgot password” on the sign-in page and enter your e-mail. We send a password reset link that works once and expires after 24 hours.','Reset password','/reset-password'],
      ['account','My invitation link has expired. What now?','Invitation links are valid for 14 days. Ask your programme coordinator to send a new one — the old link stops working as soon as a new one is sent.','',''],
      ['prog','Which programmes are on DCT Learn?','DCT Employees, Elevate mentorship, Zayed National Museum onboarding, the Zayed University 24-Hour Challenge, MuseoPro, Nibras — DCT AI Champions, and the Cultural Heritage & Knowledge Development Forum. Ruwaad and the Cultural Sites Management Department have information pages.','Explore programmes','/'],
      ['prog','I didn’t get an invitation. What should I do?','Most programmes are by invitation. Contact your programme coordinator, or write to learn@dctabudhabi.ae with the programme name and your work e-mail.','',''],
      ['ment','How does mentor matching work in Elevate?','After you complete the short mentee form, DCT Learn suggests three mentors based on your preferred areas, language and goals. You choose one, and the match is made straight away.','Elevate programme','/elevate'],
      ['ment','How do I book or reschedule a mentoring session?','Book a free slot from your mentor’s availability — times are shown in Gulf time and sessions run on Zoom. You can reschedule or cancel up to 24 hours before the session.','',''],
      ['cert','How do I get my certificate?','Certificates are issued automatically when you finish every unit in a course and pass its final quiz, if it has one. Download them from your Achievements page.','',''],
      ['cert','Some Nibras courses are external. How do they count?','For external courses, upload the certificate you received from the provider. Once the Nibras team approves it, the course shows as complete.','',''],
      ['lang','Is DCT Learn available in Arabic?','Yes. Every page and course is available in Arabic and English. Switch language from the top bar at any time — your progress stays the same.','',''],
      ['lang','Is DCT Learn accessible, and does it work on my phone?','Pages work with a keyboard and screen readers, videos have captions, and text meets WCAG 2.1 AA contrast. DCT Learn works on mobile and desktop, and your progress saves on every device. Tell us if anything gets in your way.','','']
    ];
    const cat = this.state.cat, q = (this.state.fq || '').trim().toLowerCase();
    const all = FQ.map((x, i) => ({ i, c:x[0], q:x[1], a:x[2], link:x[3], href:x[4] }));
    const hit = all.filter((x) => (cat === 'all' || x.c === cat) && (!q || (x.q + ' ' + x.a).toLowerCase().indexOf(q) >= 0));
    const open = this.state.open, voted = this.state.voted;
    const setOpen = (i) => { const o = { ...this.state.open }; if (o[i]) delete o[i]; else o[i] = true; this.setState({ open:o }); };
    let n = 0;
    const groups = K.slice(1).map((k, gi) => {
      const items = hit.filter((x) => x.c === k).map((x) => { n++; const v = voted[x.i]; return { n:String(n).padStart(2,'0'), q:x.q, a:x.a, aid:'fa-' + x.i, cls: open[x.i] ? 'on' : '', exp: open[x.i] ? 'true' : 'false', pick: () => setOpen(x.i), hasLink: !!x.link, link:x.link, href:x.href, ask: !v, voted: !!v, thx: v === 'y' ? t.thxY : t.thxN, yes: () => this.setState({ voted:{ ...this.state.voted, [x.i]:'y' } }), no: () => this.setState({ voted:{ ...this.state.voted, [x.i]:'n' } }) }; });
      return { l:t.cn[gi+1], n:items.length, items };
    }).filter((g) => g.items.length);
    const cats = K.map((k, i) => ({ l:t.cn[i], n: k === 'all' ? FQ.length : FQ.filter((x) => x[0] === k).length, cls: k === cat ? 'on' : '', on: k === cat ? 'true' : 'false', pick: () => this.setState({ cat:k, view:'custom' }) }));
    const VW = [['default', ar?'افتراضي':'Default'],['filtered', ar?'مصفّى':'Filtered'],['search', ar?'بحث':'Search'],['empty', ar?'بلا نتائج':'No results']];
    const views = VW.map((v) => ({ l:v[1], cls: this.state.view === v[0] ? 'is-on' : '', pick: () => this.setState(Object.assign({ view:v[0], voted:{} }, this.viewState(v[0], ar))) }));
    const pops = t.pops.map((p) => ({ l:p, pick: () => this.setState({ fq:p, cat:'all', view:'custom', open:{} }) }));
    return {
      lang, dir: ar?'rtl':'ltr', t, ch: this.chrome(ar, 'faq'),
      protoCls: this.props.proto ? 'proto' : '',
      views, pops, cats, groups, fq: this.state.fq, hasQ: !!q,
      count: hit.length, countL: hit.length === 1 ? t.q1 : t.qs,
      noRes: hit.length === 0, noTitle: q ? t.noT(this.state.fq.trim()) : t.noTopic,
      onFq: (e) => this.setState({ fq: e.target.value, view:'custom' }),
      clearQ: () => this.setState({ fq:'', view:'custom' }),
      resetAll: () => this.setState({ fq:'', cat:'all', view:'custom' }),
      expandAll: () => { const o = {}; hit.forEach((x) => { o[x.i] = true; }); this.setState({ open:o }); },
      collapseAll: () => this.setState({ open:{} }),
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }), langLabel: ar ? 'EN' : 'عربي',
      skipMain: this.scrollTo('main')
    };
  }
}
