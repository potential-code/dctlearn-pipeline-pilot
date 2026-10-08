// Ported verbatim from the Claude Design artboard P03-Students (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, prog:60, crit:3 }; }
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
    const EN = { spec:'Students information', kNew:'Round open', kicker:'24-Hour Challenge 2026 closes Tue 20 Oct',
      h1:'The Zayed University 24-Hour Challenge', hl:[1,2],
      sub:'A cultural heritage course that ends with your own idea. Finish the course, pitch an action plan, and a panel of judges scores it out of 100.',
      ctaSign:'Sign in to take part', ctaRubric:'See how pitches are judged', hf1:'minutes of learning', hf2:'progress to pitch', hf3:'maximum score',
      rcAria:'Current round', rcEy:'Current round', round:'24-Hour Challenge 2026', daysLeft:'days left', closes:'Submissions close Tue 20 Oct 2026', tlAria:'Round timeline: opened 15 September, today 6 October, closes 20 October', d1:'15 Sep', today:'Today', d2:'20 Oct',
      fk:['Course','Eligibility','Your pitch','Judging'], fv:['C13 · 90 min · 4 units','80 % course progress or more','3 short questions','4 criteria · out of 100'], rcCta:'Sign in with your invitation',
      hEy:'How it works', hTitle:'Three steps, one big idea', hSub:'Work at your own pace before the round closes. Everything happens on DCT Learn.',
      cEy:'The course', cTitle:'24 Hour Challenge – Introduction to Cultural Heritage', cSub:'Four units on what heritage is, why it matters in Abu Dhabi and how to share it. The last unit is where you write your pitch.', certProg:'Certificate programme',
      dLbl:'Try it: your course progress', dOpen:'Pitch unlocked — you can submit your action plan.', dLocked:(n) => 'Pitch locked — ' + n + ' % more to go.',
      rEy:'Judging', rTitle:'How pitches are judged', rSub:'Each judge scores four criteria. The weights add up to 100. Choose a criterion to see where it applies.',
      pEy:'Your pitch', pTitle:'Three questions, in the last unit', pSub:'Short answers work best. You can save a draft and come back before the round closes.',
      kEy:'Key dates', kTitle:'The 2026 round at a glance', kSub:'All dates are in Gulf time (UTC+4).',
      fEy:'Invited by Zayed University?', fTitle:'Take the 24-Hour Challenge', fSub:'Sign in with the account from your invitation e-mail. No invitation yet? Ask your course coordinator at Zayed University.', fFaq:'Read the FAQ', word:'Challenge' };
    const AR = { spec:'معلومات الطلاب', kNew:'الجولة مفتوحة', kicker:'تُغلق جولة تحدي 24 ساعة 2026 الثلاثاء 20 أكتوبر',
      h1:'تحدي جامعة زايد لـ24 ساعة', hl:[1,2],
      sub:'دورة في التراث الثقافي تنتهي بفكرتك الخاصة. أكمل الدورة، وقدّم خطة عمل، وتقيّمها لجنة تحكيم من 100.',
      ctaSign:'سجّل الدخول للمشاركة', ctaRubric:'كيف تُقيَّم العروض', hf1:'دقيقة من التعلم', hf2:'تقدّم لفتح العرض', hf3:'درجة كحد أقصى',
      rcAria:'الجولة الحالية', rcEy:'الجولة الحالية', round:'تحدي 24 ساعة 2026', daysLeft:'يوماً متبقياً', closes:'يُغلق التقديم الثلاثاء 20 أكتوبر 2026', tlAria:'الجدول الزمني: فُتحت في 15 سبتمبر، اليوم 6 أكتوبر، تُغلق في 20 أكتوبر', d1:'15 سبتمبر', today:'اليوم', d2:'20 أكتوبر',
      fk:['الدورة','الأهلية','عرضك','التحكيم'], fv:['C13 · 90 دقيقة · 4 دروس','تقدّم 80% أو أكثر في الدورة','3 أسئلة قصيرة','4 معايير · من 100'], rcCta:'سجّل الدخول بدعوتك',
      hEy:'كيف يعمل', hTitle:'ثلاث خطوات وفكرة كبيرة', hSub:'تعلّم بالسرعة التي تناسبك قبل إغلاق الجولة. كل شيء يجري على DCT Learn.',
      cEy:'الدورة', cTitle:'تحدي 24 ساعة – مقدمة في التراث الثقافي', cSub:'أربعة دروس عن معنى التراث وأهميته في أبوظبي وكيفية مشاركته. في الدرس الأخير تكتب عرضك.', certProg:'برنامج بشهادة',
      dLbl:'جرّب: تقدّمك في الدورة', dOpen:'العرض مفتوح — يمكنك تقديم خطة العمل.', dLocked:(n) => 'العرض مقفل — تبقّى ' + n + '%.',
      rEy:'التحكيم', rTitle:'كيف تُقيَّم العروض', rSub:'يقيّم كل محكّم أربعة معايير مجموع أوزانها 100. اختر معياراً لترى أين ينطبق.',
      pEy:'عرضك', pTitle:'ثلاثة أسئلة في الدرس الأخير', pSub:'الإجابات القصيرة أفضل. يمكنك حفظ مسودة والعودة قبل إغلاق الجولة.',
      kEy:'مواعيد مهمة', kTitle:'جولة 2026 في لمحة', kSub:'كل المواعيد بتوقيت الخليج (UTC+4).',
      fEy:'وصلتك دعوة من جامعة زايد؟', fTitle:'شارك في تحدي 24 ساعة', fSub:'سجّل الدخول بالحساب الوارد في رسالة الدعوة. لم تصلك دعوة بعد؟ اسأل منسّق المقرر في جامعة زايد.', fFaq:'اقرأ الأسئلة الشائعة', word:'تحدٍّ' };
    const t = ar ? AR : EN;
    const words = t.h1.split(' ').map((w, i) => ({ t:w, cls: t.hl.indexOf(i) >= 0 ? 'hl' : '', d:(0.2 + i*0.08)+'s' }));
    const facts = t.fk.map((k, i) => ({ k, v:t.fv[i] }));
    const steps = (ar ? [
      ['أكمل الدورة','أربعة دروس في التراث الثقافي، بالعربية والإنجليزية، تحفظ تقدّمك تلقائياً.',['90 دقيقة في المجموع','اختبارات قصيرة بعد كل درس','شهادة عند الإكمال'],'افتح العرض عند 80% من التقدّم'],
      ['قدّم خطة عملك','في الدرس الأخير تجيب عن ثلاثة أسئلة تشرح فكرتك لمشروع تراثي.',['الاسم والشعار','وصف قصير','لماذا ستجذب الاهتمام'],'احفظ مسودة وعد إليها لاحقاً'],
      ['يقيّمك المحكّمون','تقيّم لجنة التحكيم كل عرض وفق أربعة معايير من 100.',['محكّمون من الجامعة والدائرة','درجات وملاحظات لكل معيار','النتائج بعد إغلاق الجولة'],'تُحتسب الدرجة من 100']
    ] : [
      ['Complete the course','Four units on cultural heritage, in Arabic and English. Your progress saves as you go.',['90 minutes in total','Short quizzes after each unit','A certificate when you finish'],'Reach 80 % to unlock your pitch'],
      ['Pitch your action plan','In the last unit you answer three questions that describe your idea for a heritage project.',['Name and tagline','Short description','Why it will grab attention'],'Save a draft and come back later'],
      ['Get judged out of 100','A panel of judges scores every pitch against four weighted criteria.',['Judges from the university and DCT','A score and notes per criterion','Results after the round closes'],'Scored out of 100']
    ]).map((x, i) => ({ n:'0'+(i+1), t:x[0], b:x[1], l:x[2], k:x[3] }));
    const units = (ar ? [['ما التراث الثقافي؟','20 دقيقة'],['التراث الحي في أبوظبي','25 دقيقة'],['رواية قصص التراث','25 دقيقة'],['خطة عملك (العرض)','20 دقيقة']]
                      : [['What is cultural heritage?','20 min'],['Abu Dhabi’s living heritage','25 min'],['Telling heritage stories','25 min'],['Your action plan (the pitch)','20 min']])
      .map((x, i) => ({ n:'0'+(i+1), t:x[0], m:x[1], cls: i === 3 ? 'pit' : '' }));
    const prog = this.state.prog;
    const unlocked = prog >= 80;
    const C = [
      { w:15, c:'#F77860', t:L('Name and tagline capture the essence','الاسم والشعار يعبّران عن الجوهر'), m:L('Question 1 · Name and tagline','السؤال 1 · الاسم والشعار'), q:0 },
      { w:25, c:'#F7C337', t:L('Short description communicates the key message','الوصف القصير يوصل الرسالة الأساسية'), m:L('Question 2 · Short description','السؤال 2 · الوصف القصير'), q:1 },
      { w:20, c:'#E3DCD3', t:L('Creativity and originality','الإبداع والأصالة'), m:L('Your whole pitch','العرض كاملاً'), q:-1 },
      { w:40, c:'#FF7A70', t:L('Will it grab attention and drive participation','هل سيجذب الاهتمام ويحفّز المشاركة؟'), m:L('Question 3 · Why it will grab attention','السؤال 3 · لماذا سيجذب الاهتمام'), q:2 }
    ];
    const ci = this.state.crit;
    const crit = C.map((c, i) => ({ ...c, cls: i === ci ? 'on' : '', on: i === ci ? 'true' : 'false', bar: i === ci ? 'hi' : 'dim', pick: () => { if (this.state.crit !== i) this.setState({ crit:i }); } }));
    const PQ = ar ? [['1 · اسم المشروع وشعاره','مثال: «صوت السدو» — حكايات تُنسج من جديد',''],['2 · وصف قصير','ما الفكرة ولمن هي وكيف تعمل؟','tall'],['3 · لماذا ستجذب الاهتمام؟','ما الذي يجعل الناس يشاركون؟','tall']]
                   : [['1 · Name and tagline','e.g. “Sadu Voices” — stories woven again',''],['2 · Short description','What is the idea, who is it for and how does it work?','tall'],['3 · Why will it grab attention?','What will make people take part?','tall']];
    const pqs = PQ.map((x, i) => { const cr = C.find((c) => c.q === i); const all = ci === 2; return { t:x[0], ph:x[1], box:x[2], c:cr.c, w:cr.w + (ar ? ' من 100' : ' / 100'), cls: (all || C[ci].q === i) ? 'hi' : '' }; });
    const dates = (ar ? [['15','سبتمبر','فتح الجولة','تبدأ الدورة ويمكنك حفظ مسودة العرض.',''],['06','أكتوبر','أنت هنا','أكمل الدورة وابدأ عرضك.','now'],['20','أكتوبر','إغلاق التقديم','آخر يوم لتقديم خطة العمل.',''],['—','بعد الإغلاق','النتائج','تصلك الدرجة والملاحظات على المنصة.','']]
                       : [['15','Sep','Round opens','The course starts and you can save a pitch draft.',''],['06','Oct','You are here','Finish the course and start your pitch.','now'],['20','Oct','Submissions close','Last day to submit your action plan.',''],['—','After close','Results','Your score and judges’ notes appear on DCT Learn.','']])
      .map((x) => ({ day:x[0], mon:x[1], t:x[2], b:x[3], cls:x[4], now: x[4] === 'now' }));
    return {
      lang, dir: ar?'rtl':'ltr', t, words, ch: this.chrome(ar, 'students'),
      protoCls: this.props.proto ? 'proto' : '',
      facts, steps, units, crit, pqs, dates,
      prog, progPct: prog + '%', progTxt: prog + ' %', unlocked, locked: !unlocked, lockMsg: t.dLocked(80 - prog), fillCls: unlocked ? 'ok' : '',
      onProg: (e) => this.setState({ prog: parseInt(e.target.value, 10) || 0 }),
      toRubric: this.scrollTo('rubric'),
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }), langLabel: ar ? 'EN' : 'عربي',
      skipMain: this.scrollTo('main')
    };
  }
}
