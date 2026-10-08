// Ported verbatim from the Claude Design artboard P27-VoiceHiring (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, screen:null, init:false, f:null, tried:false, busy:false, phase:'intro', q:0, sec:0, muted:false, spk:true }; }
  setup(scr){
    const FILLED = { first:'Noor', last:'Al Ketbi', email:'noor.alketbi@example.com', phone:'+971 50 123 4567', uni:'UAE University', major:'Tourism and Heritage Management', grad:'2025', res:'yes', fam:'yes', avail:'1m', notice:'2w', years:'1', consent:true };
    const EMPTY = { first:'', last:'', email:'', phone:'', uni:'', major:'', grad:'', res:'', fam:'', avail:'', notice:'', years:'', consent:false };
    const ph = scr === 'errors' ? 'form' : scr;
    return { screen:scr, init:true, tried: scr === 'errors', busy:false, phase: ph, q: scr === 'live' ? 1 : 0, sec: scr === 'live' ? 74 : 0, muted:false, spk:true, f: (scr === 'intro' || scr === 'form' || scr === 'errors') ? { ...EMPTY } : { ...FILLED } };
  }
  componentDidMount(){ this.iv = setInterval(() => { if (this.state.phase === 'live') { const s = this.state.sec + 1; this.setState({ sec: s, spk: Math.floor(s / 5) % 2 === 0, q: Math.min(3, Math.floor(s / 45)) }); } }, 1000); }
  componentWillUnmount(){ clearInterval(this.iv); clearTimeout(this.tb); }
  /* spec-bar segment helper (mockup chrome only) */
  seg(label, cur, opts, fn){ return { label, btns: opts.map(o => ({ label:o[1], cls: o[0] === cur ? 'is-on' : '', pick: () => fn(o[0]) })) }; }



  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const L = (en, a) => ar ? a : en;
    const B = (id) => '/_blob/' + id;
    const fmt = (n) => Number(n).toLocaleString('en-US');
    const base = { lang, dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '', enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }) };
    const scr = this.state.screen || this.props.screen || 'intro';
    if (!this.state.init) Object.assign(this.state, this.setup(scr));
    const st = this.state; const f = st.f; const ph = st.phase;
    const setF = (o) => this.setState({ f: { ...f, ...o } });
    const t = {
      spec: L('Voice hiring (public)','التوظيف الصوتي (عام)'), skip: L('Skip to content','تخطَّ إلى المحتوى'), homeAria: L('DCT Learn home','الصفحة الرئيسية لـ DCT Learn'), hdrSub: L('Al Ain Museum · Careers','متحف العين · الوظائف'),
      langAria: L('Switch to Arabic','التبديل إلى الإنجليزية'), signIn: L('Sign in','تسجيل الدخول'),
      ey: L('Al Ain Museum · Visitor experience roles','متحف العين · وظائف تجربة الزوار'), h1: L('Voice Hiring Agent','وكيل التوظيف الصوتي'),
      sub: L('Apply for front-of-house roles at Al Ain Museum. Answer a few eligibility questions, then talk with our AI interviewer for about 10 minutes — in Arabic or English.','قدّم على وظائف الاستقبال وتجربة الزوار في متحف العين. أجب عن بعض أسئلة الأهلية، ثم تحدّث مع المحاور الذكي لمدة 10 دقائق تقريباً بالعربية أو الإنجليزية.'),
      progress: L('Application steps','خطوات التقديم'), startApp: L('Start application','ابدأ التقديم'),
      formH: L('Your details and eligibility','بياناتك والأهلية'), req: L('All fields required','جميع الحقول مطلوبة'), errSub: L('Check the highlighted fields below.','راجع الحقول المحددة أدناه.'),
      secYou: L('About you','عنك'), secElig: L('Eligibility','الأهلية'), choose: L('Choose an option.','اختر خياراً.'),
      years: L('Years of work experience','سنوات الخبرة العملية'), yrsErr: L('Enter a number from 0 to 40.','أدخل رقماً من 0 إلى 40.'), yrsHint: L('Include part-time and internships.','احتسب العمل الجزئي والتدريب.'),
      consent: L('I agree that DCT Abu Dhabi may record and process my answers and voice interview for this application. My data is deleted after 12 months.','أوافق على أن تسجّل دائرة الثقافة والسياحة – أبوظبي إجاباتي ومقابلتي الصوتية وتعالجها لغرض هذا الطلب، وتُحذف بياناتي بعد 12 شهراً.'),
      cErr: L('You need to agree before the interview can start.','يجب الموافقة قبل بدء المقابلة.'), back: L('Back','رجوع'), continue: L('Continue to interview','المتابعة إلى المقابلة'),
      startCall: L('Start interview','ابدأ المقابلة'), endCall: L('End interview','إنهاء المقابلة'), qTitle: L('Interview outline','محاور المقابلة'),
      provider: L('Voice interview by Potential.com · provider keys stay on DCT servers','المقابلة الصوتية عبر Potential.com · تبقى مفاتيح المزوّد على خوادم الدائرة'),
      thxP: L('Al Ain Museum’s recruitment team reviews every interview. If you’re shortlisted, we’ll contact you by e-mail within 5 working days.','يراجع فريق التوظيف في متحف العين كل المقابلات، وإذا اجتزت الفرز سنتواصل معك عبر البريد الإلكتروني خلال 5 أيام عمل.'),
      refH: L('Application received','تم استلام الطلب'), home: L('Back to DCT Learn','العودة إلى DCT Learn'), faq: L('Questions? Read the FAQ','لديك أسئلة؟ اقرأ الأسئلة الشائعة'),
      privacy: L('No account needed. Your answers are used only for this application and deleted after 12 months.','لا حاجة إلى حساب. تُستخدم إجاباتك لهذا الطلب فقط وتُحذف بعد 12 شهراً.'),
      copy: L('Department of Culture and Tourism – Abu Dhabi','دائرة الثقافة والسياحة – أبوظبي'), powered: L('Powered by','بدعم من')
    };
    const order = ['intro','form','ready','live','ended'];
    const idx = Math.max(0, order.indexOf(ph));
    const steps = [[L('Introduction','المقدمة'),0],[L('Your details','بياناتك'),1],[L('Voice interview','المقابلة الصوتية'),2],[L('Done','تم'),4]].map(x => { const i = x[1]; const on = (i === 2 ? (idx === 2 || idx === 3) : idx === i); const ok = idx > (i === 2 ? 3 : i); return { l:x[0], cls: on ? 'on' : (ok ? 'ok' : ''), cur: on ? 'step' : 'false' }; });
    const intro = [
      { c:'#EE3E43', h:L('What to expect','ماذا تتوقع'), li:[L('5 short eligibility questions','5 أسئلة أهلية قصيرة'), L('A 10-minute voice interview with an AI interviewer','مقابلة صوتية مدتها 10 دقائق مع محاور ذكي'), L('A reply by e-mail within 5 working days','رد عبر البريد خلال 5 أيام عمل')] },
      { c:'#F7C337', h:L('What you need','ما تحتاجه'), li:[L('A quiet place and a working microphone','مكان هادئ وميكروفون يعمل'), L('About 15 minutes in total','نحو 15 دقيقة إجمالاً'), L('Chrome, Edge or Safari on a phone or laptop','متصفح Chrome أو Edge أو Safari على هاتف أو حاسوب')] },
      { c:'#3B2F92', h:L('Your data','بياناتك'), li:[L('Used only for this application','تُستخدم لهذا الطلب فقط'), L('Interview audio is not shared outside DCT','لا يُشارك صوت المقابلة خارج الدائرة'), L('Deleted after 12 months','تُحذف بعد 12 شهراً')] }
    ];
    const tried = st.tried;
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim());
    const phoneOk = f.phone.replace(/\D/g, '').length >= 9;
    const gradN = parseInt(f.grad, 10); const gradOk = gradN >= 1980 && gradN <= 2030;
    const yrsN = Number(f.years); const yrsOk = f.years !== '' && yrsN >= 0 && yrsN <= 40;
    const TX = [
      ['v-first','first',L('First name','الاسم الأول'),'text','given-name','text','auto','', !!f.first.trim(), L('Enter your first name.','أدخل اسمك الأول.')],
      ['v-last','last',L('Last name','اسم العائلة'),'text','family-name','text','auto','', !!f.last.trim(), L('Enter your last name.','أدخل اسم العائلة.')],
      ['v-email','email',L('E-mail','البريد الإلكتروني'),'email','email','email','ltr','name@example.com', emailOk, L('Enter an e-mail like name@example.com.','أدخل بريداً مثل name@example.com.')],
      ['v-phone','phone',L('Mobile number','رقم الهاتف المتحرك'),'tel','tel','tel','ltr','+971 5X XXX XXXX', phoneOk, L('Enter a mobile number with at least 9 digits.','أدخل رقماً من 9 أرقام على الأقل.')],
      ['v-uni','uni',L('University','الجامعة'),'text','organization','text','auto','', !!f.uni.trim(), L('Enter your university.','أدخل اسم الجامعة.')],
      ['v-major','major',L('Major','التخصص'),'text','off','text','auto','', !!f.major.trim(), L('Enter your major.','أدخل تخصصك.')],
      ['v-grad','grad',L('Graduation year','سنة التخرج'),'text','off','numeric','ltr','2025', gradOk, L('Enter a year between 1980 and 2030.','أدخل سنة بين 1980 و2030.')]
    ];
    const txt = TX.map(x => { const bad = tried && !x[8]; return { id:x[0], l:x[2], type:x[3], ac:x[4], im:x[5], dir:x[6], ph:x[7], v: f[x[1]], bad, cls: bad ? 'is-error' : '', msg:x[9], on: (e) => setF({ [x[1]]: e.target.value }) }; });
    const YN = [['res', L('Do you live in Al Ain?','هل تقيم في العين؟'), L('alAinResident','alAinResident'), L('Al Ain residents are preferred for these roles.','تُفضَّل الإقامة في العين لهذه الوظائف.')], ['fam', L('Do you hold a UAE family book (Khulasat Al Qaid)?','هل لديك خلاصة القيد (الخلاصة)؟'), '', L('Asked for Emiratisation reporting only.','لأغراض تقارير التوطين فقط.')]];
    const yns = YN.map(y => ({ l:y[1], h:y[3], name:'yn-' + y[0], bad: tried && !f[y[0]], opts: [['yes', L('Yes','نعم')], ['no', L('No','لا')]].map(o => ({ l:o[1], on: f[y[0]] === o[0], pick: () => setF({ [y[0]]: o[0] }) })) }));
    const SL = [ ['v-av','avail',L('When can you start?','متى يمكنك البدء؟'), [['', L('Choose…','اختر…')], ['now', L('Immediately','فوراً')], ['1m', L('Within 1 month','خلال شهر')], ['3m', L('Within 3 months','خلال 3 أشهر')]]],
                 ['v-np','notice',L('Notice period','فترة الإشعار'), [['', L('Choose…','اختر…')], ['none', L('None','لا يوجد')], ['2w', L('2 weeks','أسبوعان')], ['1mo', L('1 month','شهر واحد')], ['2m', L('2 months or more','شهران أو أكثر')]]] ];
    const sels = SL.map(x => { const bad = tried && !f[x[1]]; return { id:x[0], l:x[2], v:f[x[1]], bad, cls: bad ? 'is-error' : '', opts: x[3].map(o => ({ v:o[0], l:o[1] })), on: (e) => setF({ [x[1]]: e.target.value }) }; });
    const badCount = txt.filter(x => x.bad).length + yns.filter(y => y.bad).length + sels.filter(s => s.bad).length + (tried && !yrsOk ? 1 : 0) + (tried && !f.consent ? 1 : 0);
    const valid = TX.every(x => x[8]) && f.res && f.fam && f.avail && f.notice && yrsOk && f.consent;
    const submit = (e) => { if (e && e.preventDefault) e.preventDefault(); if (!valid) { this.setState({ tried:true }); return; } this.setState({ busy:true }); clearTimeout(this.tb); this.tb = setTimeout(() => this.setState({ busy:false, phase:'ready', tried:false }), 1100); };
    const QS = [L('Tell us a little about yourself.','حدّثنا قليلاً عن نفسك.'), L('Why would you like to work at Al Ain Museum?','لماذا ترغب في العمل في متحف العين؟'), L('Describe a time you helped a visitor or customer with a problem.','صف موقفاً ساعدت فيه زائراً أو عميلاً في حل مشكلة.'), L('Which languages can you use with visitors?','ما اللغات التي يمكنك التحدث بها مع الزوار؟')];
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const live = ph === 'live';
    const name = f.first.trim();
    const go = (v) => { clearTimeout(this.tb); this.setState(this.setup(v)); };
    return { ...base, t, f, steps, intro, txt, yns, sels,
      specName: t.spec, route: '/ai/voice-hiring', langLbl: ar ? 'EN' : 'عربي',
      isIntro: ph === 'intro', isForm: ph === 'form', isCall: ph === 'ready' || live, isReady: ph === 'ready', isLive: live, isEnded: ph === 'ended',
      start: () => this.setState({ phase:'form' }), back: () => this.setState({ phase:'intro', tried:false }),
      yrsBad: tried && !yrsOk, yrsCls: tried && !yrsOk ? 'is-error' : '', onYears: (e) => setF({ years: e.target.value }),
      cBad: tried && !f.consent, togConsent: () => setF({ consent: !f.consent }),
      hasErr: tried && badCount > 0, errTitle: L(badCount + (badCount === 1 ? ' field needs attention' : ' fields need attention'), 'يحتاج ' + badCount + ' من الحقول إلى مراجعة'),
      submit, busyCls: st.busy ? 'is-loading' : '',
      statLbl: live ? (st.muted ? L('· You are muted','· الميكروفون مكتوم') : (st.spk ? L('· Interviewer speaking','· المحاور يتحدث') : L('· Listening…','· يستمع…'))) : L('Interviewer ready','المحاور جاهز'),
      clock: pad(Math.floor(st.sec / 60)) + ':' + pad(st.sec % 60),
      agentCls: live && st.spk ? 'talk' : '', waveCls: live ? ('on' + (st.spk ? '' : ' me')) : '',
      caption: live ? QS[st.q] : (name ? L('Hi ' + name + ', I’m ready when you are.','مرحباً ' + name + '، أنا جاهز متى شئت.') : L('I’m ready when you are.','أنا جاهز متى شئت.')),
      callNote: live ? L('Speak naturally. You can pause — the interviewer waits for you to finish.','تحدّث بشكل طبيعي، ويمكنك التوقف، فالمحاور ينتظر حتى تنتهي.') : L('Your browser will ask to use the microphone. The interview takes about 10 minutes.','سيطلب المتصفح إذن استخدام الميكروفون، وتستغرق المقابلة نحو 10 دقائق.'),
      startCall: () => this.setState({ phase:'live', sec:0, q:0, spk:true }), endCall: () => this.setState({ phase:'ended' }),
      mutedP: st.muted ? 'true' : 'false', muteLbl: st.muted ? L('Unmute','إلغاء الكتم') : L('Mute','كتم'), togMute: () => this.setState({ muted: !st.muted }),
      qs: QS.map((q, i) => ({ l:q, cls: live ? (i < st.q ? 'ok' : (i === st.q ? 'on' : '')) : '' })),
      thxH: name ? L('Thank you, ' + name, 'شكراً لك يا ' + name) : L('Thank you for applying','شكراً لتقديمك'),
      refP: L('Reference VH-2026-0418 · a copy has been sent to ' + (f.email || 'your e-mail') + '.', 'الرقم المرجعي VH-2026-0418 · أُرسلت نسخة إلى ' + (f.email || 'بريدك الإلكتروني') + '.'),
      segs: [ this.seg('State', scr, [['intro','Intro'],['form','Form'],['errors','Errors'],['ready','Call ready'],['live','Live call'],['ended','Thank you']], go) ]
    };
  }
}
