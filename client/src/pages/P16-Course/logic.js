// Ported verbatim from the Claude Design artboard P16-Course (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = this.fresh(p); this.state.locale = null; this.state.course = null; }
  fresh(p){
    const sc = (p && p.screen) || 'outline';
    const s = { screen:null, unit:1, done:null, vid:{}, more:{}, aud:{ playing:false, pos:0, speed:1, tr:false }, scorm:0, pl:0, survey:{}, surveyErr:false, surveySent:false, ap:{}, apSaved:false, missing:false, qa:{}, qErr:false, attempts:0, result:null, busy:false, toast:'' };
    return s;
  }

  /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  flash(msg){ this.setState({ toast: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast:'' }), 3200); }

  // apply a specbar / prop screen preset
  preset(name, course){
    const st = this.fresh();
    const nU = course === 'museum-101' ? 5 : 4;
    const all = Array.from({ length:nU }, (_, i) => i + 1);
    const ok = { q1:'a', q2:'a', q3:'a', q4:'t', q5:'I welcome visitors at Qasr Al Hosn and help them plan their next cultural visit.' };
    if (name === 'outline') { st.screen = 'outline'; }
    else if (/^unit/.test(name)) { const u = +name.slice(4); st.screen = 'unit'; st.unit = u; st.done = all.filter(x => x < u); }
    else if (name === 'quiz') { st.screen = 'quiz'; st.done = all; }
    else if (name === 'pass') { st.screen = 'result'; st.done = all; st.qa = Object.assign({}, ok, { q3:'b' }); st.attempts = 1; st.result = { score:80, passed:true }; }
    else if (name === 'fail') { st.screen = 'result'; st.done = all; st.qa = Object.assign({}, ok, { q2:'c', q3:'b' }); st.attempts = 1; st.result = { score:60, passed:false }; }
    else if (name === 'complete') { st.screen = 'complete'; st.done = all; st.result = { score:80, passed:true }; st.attempts = 1; }
    return st;
  }

  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const L = (en, a) => ar ? a : en;
    const B = (id) => '/_blob/' + id;
    const fmt = (n) => Number(n).toLocaleString(ar ? 'ar-AE' : 'en-US');
    const site = this.props.site || 'employees';
    const slug = this.state.course || this.props.course || 'dct-world';
    const full = slug === 'dct-world';
    const S = this.state;
    const propScreen = this.props.screen || 'outline';
    // initial state from props on first render
    const P0 = S.screen === null ? this.preset(propScreen, slug) : null;
    const st = P0 ? Object.assign({}, S, P0, { locale:S.locale, course:S.course, toast:S.toast }) : S;
    const set = (o) => { if (S.screen === null) this.setState(Object.assign({}, P0, o)); else this.setState(o); };

    const t = ar ? {
      spec:'الدورة ومشغّل الدروس', progress:'تقدّم الدورة', allCourses:'كل الدورات', outlineEy:'محتوى الدورة', outlineH:'الوحدات والدروس', seqNote:'تُفتح الدروس بالترتيب.',
      certH:'الشهادة', certLocked:'تُفتح عند الإكمال', ptsH:'النقاط', perUnit:'لكل درس مكتمل', onDone:'عند إكمال الدورة', total:'مجموع الدورة', aboutH:'عن الدورة',
      speed:'سرعة التشغيل', savedNow:'تم الحفظ تلقائياً · الآن', autosave:'يُحفظ تلقائياً أثناء الكتابة', dlPdf:'تنزيل خطة العمل PDF', pdfDone:'تم تجهيز ملف PDF لخطة العمل',
      pickOne:'اختر إجابة.', sendSurvey:'إرسال الاستبيان', surveyThanks:'شكراً لك', surveyThanksP:'تم حفظ إجاباتك. يمكنك الآن إكمال الدرس.',
      notYet:'لم يكتمل الدرس بعد', prev:'السابق', outlineBtn:'محتوى الدورة', completed:'مكتمل',
      quizEy:'اختبار إلزامي · عالم الدائرة', quizH:'الاختبار النهائي لعالم الدائرة', quizP:'أجب عن 5 أسئلة. تحتاج إلى 70% لإكمال الدورة والحصول على شهادتك.', backU4:'العودة إلى الدرس 4',
      answerAll:'أجب عن كل الأسئلة', required:'هذا السؤال مطلوب.', submitQuiz:'إرسال الإجابات', rulesH:'قواعد الاختبار', passMark:'درجة النجاح', attempts:'المحاولات', questions:'الأسئلة', answered:'تمت الإجابة',
      quizNote:'لا تظهر الإجابات الصحيحة قبل النجاح أو استنفاد المحاولات. يتم التصحيح على الخادم.',
      passAt:'النجاح من 70%', finishCourse:'إنهاء الدورة واستلام الشهادة', retry:'حاول مرة أخرى', reviewUnits:'راجع الدروس', contactAdmin:'تواصل مع مسؤول البرنامج', yourAnswers:'إجاباتك', keysHidden:'الإجابات الصحيحة مخفية',
      doneEy:'اكتملت الدورة', ptsEarnedNow:'نقطة مكافأة الإكمال', dlCert:'تنزيل الشهادة PDF', viewAch:'عرض الإنجازات', shareL:'شارك إنجازك', copyLink:'نسخ رابط التحقق', certAlt:'معاينة الشهادة',
      certDetails:'تفاصيل الشهادة', serialL:'الرقم التسلسلي', issuedL:'تاريخ الإصدار', issuedV:'الثلاثاء 6 أكتوبر 2026', verifyL:'رابط التحقق العام', nextH:'ما التالي', dlDone:'جارٍ تنزيل الشهادة (PDF)', copied:'تم نسخ رابط التحقق'
    } : {
      spec:'Course & unit player', progress:'Course progress', allCourses:'All courses', outlineEy:'Course outline', outlineH:'Modules and units', seqNote:'Units unlock in order.',
      certH:'Certificate', certLocked:'Unlocks on completion', ptsH:'Points', perUnit:'Each completed unit', onDone:'Course completion', total:'Course total', aboutH:'About this course',
      speed:'Playback speed', savedNow:'Saved automatically · just now', autosave:'Saves automatically as you type', dlPdf:'Download action plan (PDF)', pdfDone:'Your action plan PDF is ready',
      pickOne:'Choose an answer.', sendSurvey:'Send survey', surveyThanks:'Thank you', surveyThanksP:'Your answers are saved. You can now complete the unit.',
      notYet:'This unit isn’t finished yet', prev:'Previous', outlineBtn:'Course outline', completed:'Completed',
      quizEy:'Blocking quiz · DCT World', quizH:'DCT World final check', quizP:'Answer 5 questions. You need 70% to complete the course and receive your certificate.', backU4:'Back to unit 4',
      answerAll:'Answer every question', required:'This question is required.', submitQuiz:'Submit answers', rulesH:'Quiz rules', passMark:'Pass mark', attempts:'Attempts', questions:'Questions', answered:'Answered',
      quizNote:'Correct answers are not shown until you pass or use all attempts. Scoring happens on the server.',
      passAt:'pass at 70%', finishCourse:'Finish course and get certificate', retry:'Try again', reviewUnits:'Review the units', contactAdmin:'Contact your programme admin', yourAnswers:'Your answers', keysHidden:'Correct answers hidden',
      doneEy:'Course complete', ptsEarnedNow:'completion points', dlCert:'Download certificate (PDF)', viewAch:'View achievements', shareL:'Share your achievement', copyLink:'Copy verification link', certAlt:'Certificate preview',
      certDetails:'Certificate details', serialL:'Serial number', issuedL:'Issued', issuedV:'Tuesday 6 October 2026', verifyL:'Public verification link', nextH:'What’s next', dlDone:'Downloading your certificate (PDF)', copied:'Verification link copied'
    };

    // learner per site
    const U = { employees:['Saeed Al Hammadi','سعيد الحمادي','SA','Specialist, DCT Culture','أخصائي، قطاع الثقافة'], znm:['Yousef Al Zaabi','يوسف الزعابي','YZ','Gallery Host, ZNM','مضيف صالة عرض، المتحف'], zu:['Ahmed Khan','أحمد خان','AK','ZU student','طالب في جامعة زايد'], museopro:['Élise Martin','إليز مارتن','EM','Collections officer','مسؤولة مجموعات'], nibras:['Hamad Al Mazrouei','حمد المزروعي','HM','Data analyst','محلل بيانات'] }[site] || ['Saeed Al Hammadi','سعيد الحمادي','SA','Specialist, DCT Culture','أخصائي، قطاع الثقافة'];
    const SN = { employees:['DCT Employees','موظفو الدائرة'], znm:['Zayed National Museum','متحف زايد الوطني'], zu:['ZU 24-Hour Challenge','تحدي جامعة زايد'], museopro:['MuseoPro','ميوزيو برو'], nibras:['Nibras — AI Champions','نبراس'] }[site] || ['DCT Employees','موظفو الدائرة'];

    // ---------- course structures ----------
    const IMG = { C01:B('fa500a874150b2a1769785936a6d7785'), C02:B('d99ea09adede7395461223b429f24cf4'), team:B('eb80e68b5f407df8f3c317956007a5a2'), home:B('1309cd48586ad6e5374578ed63abc172'), ay:B('880a72d5794fad0ac73793c03f37c852'), znm:B('6a330c17598da2f1e81b82711e1c5e9a'), C04:B('592272d2d94f43d123cbcdda07b02178'), C06:B('cf69d2b8596f972f4af9fc63c0137303'), emp:B('92c83a667e1befe5661dab8c7ebca349') };
    const CRS = full ? {
      title:L('DCT World','عالم الدائرة'), img:IMG.C01, cats:L('All about DCT · Welcome to DCT','كل شيء عن الدائرة · مرحباً بك في الدائرة'),
      desc:L('Who we are, what our sectors do and how every role at DCT Abu Dhabi shapes a visitor’s experience of the emirate.','من نحن، وماذا تفعل قطاعاتنا، وكيف يسهم كل دور في الدائرة في تجربة الزائر في الإمارة.'),
      facts:[L('Beginner','مبتدئ'), L('45 min','45 دقيقة'), L('4 units · final check','4 دروس · اختبار نهائي'), L('Certificate','شهادة')],
      mods:[ { en:'Module 1 · Welcome to DCT', ar:'الوحدة 1 · مرحباً بك في الدائرة', units:[[1,'Who we are','من نحن',10],[2,'Our sectors','قطاعاتنا',12]] }, { en:'Module 2 · Culture & Tourism', ar:'الوحدة 2 · الثقافة والسياحة', units:[[3,'Abu Dhabi’s cultural sites','المواقع الثقافية في أبوظبي',13],[4,'Your role in the visitor journey','دورك في رحلة الزائر',10]] } ],
      quiz:true, certRule:L('Complete all 4 units and pass the final check (70%) to receive your certificate.','أكمل الدروس الأربعة واجتز الاختبار النهائي (70%) لتحصل على شهادتك.'),
      info:[ [L('Categories','الفئات'), L('All about DCT; Welcome to DCT','كل شيء عن الدائرة؛ مرحباً بك')], [L('Order','الترتيب'), L('Sequential','متسلسل')], [L('Mandatory','إلزامية'), L('Yes · DCT Employees','نعم · موظفو الدائرة')], [L('Languages','اللغات'), L('English, Arabic','العربية، الإنجليزية')] ],
      serial:'DCT-2026-C01-000213', next:['museum-101',L('Museum 101','المتاحف 101'),L('The World of Museums · 60 min','عالم المتاحف · 60 دقيقة')]
    } : {
      title:L('Museum 101','المتاحف 101'), img:IMG.C02, cats:L('The World of Museums','عالم المتاحف'),
      desc:L('What a museum is, how collections are cared for and how exhibitions come together — with examples from Saadiyat Cultural District.','ما هو المتحف، وكيف تُصان المجموعات، وكيف تُبنى المعارض — مع أمثلة من المنطقة الثقافية في السعديات.'),
      facts:[L('Beginner','مبتدئ'), L('60 min','60 دقيقة'), L('5 units','5 دروس'), L('Certificate','شهادة')],
      mods:[ { en:'Module 1 · Museums today', ar:'الوحدة 1 · المتاحف اليوم', units:[[1,'What is a museum?','ما هو المتحف؟',12],[2,'A short history of museums','تاريخ موجز للمتاحف',12]] }, { en:'Module 2 · Inside the museum', ar:'الوحدة 2 · داخل المتحف', units:[[3,'Collections and care','المجموعات وصونها',12],[4,'Exhibitions and visitors','المعارض والزوار',12]] }, { en:'Module 3 · Museums in Abu Dhabi', ar:'الوحدة 3 · المتاحف في أبوظبي', units:[[5,'Saadiyat Cultural District','المنطقة الثقافية في السعديات',12]] } ],
      quiz:false, certRule:L('Complete all 5 units to receive your certificate.','أكمل الدروس الخمسة لتحصل على شهادتك.'),
      info:[ [L('Category','الفئة'), L('The World of Museums','عالم المتاحف')], [L('Order','الترتيب'), L('Sequential','متسلسل')], [L('Mandatory','إلزامية'), L('No','لا')], [L('Languages','اللغات'), L('English, Arabic','العربية، الإنجليزية')] ],
      serial:'DCT-2026-C02-000388', next:['cultural-heritage',L('Understanding Cultural Heritage','فهم التراث الثقافي'),L('Cultural Heritage · 50 min','التراث الثقافي · 50 دقيقة')]
    };
    const nU = full ? 4 : 5;
    const done = st.done || (full ? [1] : [1,2,3]);
    const isDone = (n) => done.indexOf(n) > -1;
    const avail = (n) => n === 1 || isDone(n - 1);
    const allUnits = done.length >= nU;
    const passed = !!(st.result && st.result.passed);
    const complete = full ? passed && allUnits : allUnits;
    const pctN = complete ? 100 : (full && allUnits) ? 90 : Math.round(done.length / nU * 100);
    const screen = st.screen === null ? 'outline' : st.screen;
    const unitN = st.unit;
    const unitTitle = (n) => { let r = ''; CRS.mods.forEach(m => m.units.forEach(u => { if (u[0] === n) r = L(u[1], u[2]); })); return r; };
    const openUnit = (n) => () => { if (!avail(n) && !isDone(n)) return; set({ screen:'unit', unit:n, missing:false }); };
    const quizStatus = passed ? 'passed' : (allUnits ? 'available' : 'locked');
    const mods = CRS.mods.map((m, mi) => {
      const units = m.units.map(u => {
        const n = u[0], d = isDone(n), a = avail(n), cur = !d && a, locked = !d && !a;
        return { n:fmt(n), title:L(u[1],u[2]), sub: L(u[3]+' min', u[3]+' دقيقة') + (full && n === 4 ? L(' · action plan',' · خطة عمل') : ''), st: d ? 'done' : cur ? 'cur' : locked ? 'lock' : 'avail', isDone:d, isLock:locked, isNum:!d && !locked, isQuiz:false,
          tag: d ? L('Done','مكتمل') : cur ? L('Up next','التالي') : L('Locked','مقفل'), tagCls: d ? 'ok' : cur ? 'red' : 'mut', cls: locked ? 'locked' : '', locked: locked ? 'true' : 'false',
          onCls: (screen === 'unit' && unitN === n) ? 'on' : '', cur: (screen === 'unit' && unitN === n) ? 'step' : 'false', sr: d ? L('completed','مكتمل') : locked ? L('locked','مقفل') : L('available','متاح'), open: openUnit(n) };
      });
      if (CRS.quiz && mi === CRS.mods.length - 1) units.push({ n:'', title:L('DCT World final check','الاختبار النهائي لعالم الدائرة'), sub:L('Quiz · pass 70% · 2 attempts','اختبار · النجاح 70% · محاولتان'), st: passed ? 'quizok' : (allUnits ? 'quiz' : 'lock'), isDone:false, isLock:!allUnits && !passed, isNum:false, isQuiz: allUnits || passed,
        tag: passed ? L('Passed','ناجح') : allUnits ? L('Available','متاح') : L('Locked','مقفل'), tagCls: passed ? 'ok' : allUnits ? 'yel' : 'mut', cls: (!allUnits && !passed) ? 'locked' : '', locked: (!allUnits && !passed) ? 'true' : 'false', onCls: screen === 'quiz' ? 'on' : '', cur: screen === 'quiz' ? 'step' : 'false', sr:'',
        open: () => { if (passed) set({ screen:'result' }); else if (allUnits) set({ screen:'quiz', qErr:false }); } });
      const md = m.units.filter(u => isDone(u[0])).length;
      return { title:L(m.en, m.ar), units, tag: md === m.units.length ? L('Complete','مكتملة') : fmt(md) + ' / ' + fmt(m.units.length), tagCls: md === m.units.length ? 'ok' : 'mut' };
    });
    const nextUnit = [1,2,3,4,5].filter(n => n <= nU && !isDone(n))[0];
    const resumeL = complete ? L('Review course','مراجعة الدورة') : (allUnits && full) ? L('Take the final check','ابدأ الاختبار النهائي') : (done.length ? L('Continue · Unit ','تابع · الدرس ') : L('Start · Unit ','ابدأ · الدرس ')) + fmt(nextUnit);
    const resume = () => { if (complete) set({ screen:'complete' }); else if (allUnits && full) set({ screen:'quiz' }); else set({ screen:'unit', unit:nextUnit, missing:false }); };

    // ---------- blocks ----------
    const vid = st.vid, more = st.more, aud = st.aud;
    const mkVideo = (key, poster, vt, durS, required) => {
      const p = vid[key] || 0, playing = vid[key + '_p'];
      const mm = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      return { isVideo:true, kind:L('Video','فيديو'), title:false, poster, vtitle:vt, paused:!playing, playing:!!playing, playL: playing ? L('Pause video','إيقاف الفيديو مؤقتاً') : L('Play video','تشغيل الفيديو'),
        time: mm(Math.round(durS * p / 100)), dur: mm(durS), vpct: p + '%', tag: p >= 100 ? L('Watched','تمت المشاهدة') : required ? L('Required','مطلوب') : false, tagCls: p >= 100 ? 'ok' : 'warn',
        play: () => { const v = Object.assign({}, vid); if (playing) { v[key + '_p'] = false; set({ vid:v }); return; } v[key + '_p'] = true; v[key] = 100; set({ vid:v }); this.flash(L('Video watched — marked as complete','تمت مشاهدة الفيديو وتسجيله كمكتمل')); } };
    };
    const mkText = (key, title, p1, p2) => ({ isText:true, kind:L('Summary','ملخص'), title, p1, p2, hasMore:!!p2, more:!!more[key], moreX: more[key] ? 'true' : 'false', moreL: more[key] ? L('Show less','عرض أقل') : L('Read more','اقرأ المزيد'), togMore: () => { const m = Object.assign({}, more); m[key] = !m[key]; set({ more:m }); }, tag:false });
    const surveyBlock = (qs) => {
      const sv = st.survey, err = st.surveyErr;
      return { isSurvey:true, kind:L('Survey','استبيان'), title:L('Quick check-in','استطلاع سريع'), tag: st.surveySent ? L('Sent','مُرسل') : L('Required','مطلوب'), tagCls: st.surveySent ? 'ok' : 'warn', open:!st.surveySent, sent:st.surveySent,
        qs: qs.map((q, i) => { const k = 's' + i; return { text:q.text, name:'sv-' + i, isOpts:!!q.opts, isText:!q.opts, err: err && q.opts && !sv[k], val: sv[k] || '', set: (e) => { const s = Object.assign({}, sv); s[k] = e.target.value; set({ survey:s }); },
          opts:(q.opts || []).map((o, j) => ({ l:o, on: sv[k] === j, cls: sv[k] === j ? 'sel' : '', pick: () => { const s = Object.assign({}, sv); s[k] = j; set({ survey:s }); } })) }; }),
        submit: () => { const miss = qs.some((q, i) => q.opts && sv['s' + i] === undefined); if (miss) { set({ surveyErr:true }); return; } set({ surveySent:true, surveyErr:false, missing:false }); this.flash(L('Survey sent','تم إرسال الاستبيان')); } };
    };
    const surveyQs = [ { text:L('How familiar were you with DCT’s sectors before this unit?','ما مدى معرفتك بقطاعات الدائرة قبل هذا الدرس؟'), opts:[L('Not at all','لا أعرفها'),L('Somewhat','إلى حد ما'),L('Very','جيداً جداً')] },
      { text:L('Which sector would you like to learn more about?','أي قطاع تودّ معرفة المزيد عنه؟'), opts:[L('Culture','الثقافة'),L('Tourism','السياحة'),L('Both','كلاهما')] },
      { text:L('One thing you’ll share with your team (optional)','أمر واحد ستشاركه مع فريقك (اختياري)') } ];
    const AP = [ L('In 3 years, on the professional side, I want to have done…','خلال 3 سنوات، على الصعيد المهني، أريد أن أكون قد أنجزت…'), L('The visitor moment I most want to improve in my role is…','لحظة الزائر التي أريد تحسينها أكثر في دوري هي…'), L('Three people at DCT I will learn from are…','ثلاثة أشخاص في الدائرة سأتعلم منهم هم…'), L('The first step I will take this month is…','الخطوة الأولى التي سأتخذها هذا الشهر هي…'), L('I will know I’m making progress when…','سأعرف أنني أتقدم عندما…') ];
    let blocks = [], required = [];
    if (full) {
      if (unitN === 1) {
        blocks = [ mkVideo('u1v', IMG.home, L('DCT Abu Dhabi — who we are','دائرة الثقافة والسياحة — من نحن'), 520, true),
          mkText('u1t', L('Who we are','من نحن'), L('The Department of Culture and Tourism – Abu Dhabi preserves the emirate’s heritage, develops its cultural landscape and promotes Abu Dhabi as a destination for visitors from around the world.','تحافظ دائرة الثقافة والسياحة – أبوظبي على تراث الإمارة، وتطوّر مشهدها الثقافي، وتروّج لأبوظبي وجهةً للزوار من أنحاء العالم.'), L('Our teams work across museums, heritage sites, libraries, festivals and tourism services — from Qasr Al Hosn to the Saadiyat Cultural District and Al Ain Oasis.','تعمل فرقنا في المتاحف والمواقع التراثية والمكتبات والمهرجانات وخدمات السياحة — من قصر الحصن إلى المنطقة الثقافية في السعديات وواحة العين.')),
          { isCase:true, kind:L('Case study','دراسة حالة'), title:false, tag:false, ch:L('Reopening Qasr Al Hosn','إعادة افتتاح قصر الحصن'), p1:L('When Qasr Al Hosn reopened, teams from conservation, visitor services, marketing and tourism worked as one. Front-of-house colleagues trained on the fort’s story so every visitor heard it consistently.','عند إعادة افتتاح قصر الحصن عملت فرق الصون وخدمات الزوار والتسويق والسياحة كفريق واحد، وتدرّب موظفو الواجهة على قصة الحصن ليسمعها كل زائر بالطريقة نفسها.'), p2:L('Ask yourself: which teams would you need to work with to deliver a moment like this?','اسأل نفسك: مع أي فرق ستحتاج إلى العمل لتقديم لحظة كهذه؟') },
          { isQuotes:true, kind:L('Quotes','اقتباسات'), title:false, tag:false, items:[ { text:L('Culture is the bridge between our past and the future we are building.','الثقافة جسر بين ماضينا والمستقبل الذي نبنيه.'), by:L('DCT Abu Dhabi leadership','قيادة الدائرة') }, { text:L('Every visitor remembers how we made them feel.','كل زائر يتذكر الشعور الذي منحناه إياه.'), by:L('Visitor Experience team','فريق تجربة الزوار') } ] } ];
        required = [ vid.u1v >= 100 ? null : L('watch the video','شاهد الفيديو') ];
      } else if (unitN === 2) {
        const pos = aud.pos, playing = aud.playing;
        blocks = [ { isAudio:true, kind:L('Podcast','بودكاست'), title:false, tag:false, atitle:L('DCT Flow — Our sectors','DCT Flow — قطاعاتنا'), paused:!playing, playing, playL: playing ? L('Pause','إيقاف مؤقت') : L('Play','تشغيل'), time: Math.floor(pos * 6 / 100) + ':' + String(Math.round(pos * 360 / 100) % 60).padStart(2,'0'), dur:'6:00',
            wave: Array.from({ length:48 }, (_, i) => ({ h: (30 + Math.round(Math.abs(Math.sin(i * 1.7) * 60) + (i % 5) * 3)) + '%', cls: i / 48 * 100 < pos ? 'on' : '' })),
            speeds:[0.75,1,1.25,1.5,2].map(s => ({ l: fmt(s) + '×', cls: aud.speed === s ? 'is-on' : '', on: aud.speed === s ? 'true' : 'false', pick: () => set({ aud:Object.assign({}, aud, { speed:s }) }) })),
            play: () => set({ aud:Object.assign({}, aud, { playing:!playing, pos: playing ? pos : Math.max(pos, 35) }) }), tr:aud.tr, trX: aud.tr ? 'true' : 'false', trL: aud.tr ? L('Hide transcript','إخفاء النص') : L('Show transcript','عرض النص'), togTr: () => set({ aud:Object.assign({}, aud, { tr:!aud.tr }) }),
            trText:L('Welcome to DCT Flow. In this episode we walk through our sectors: Culture, which looks after museums, heritage and the arts; Tourism, which brings visitors to Abu Dhabi and looks after them; and the shared services that make both possible…','مرحباً بكم في DCT Flow. في هذه الحلقة نستعرض قطاعاتنا: الثقافة التي ترعى المتاحف والتراث والفنون، والسياحة التي تستقطب الزوار إلى أبوظبي وتعتني بهم، والخدمات المشتركة التي تجعل ذلك ممكناً…') },
          mkText('u2t', L('Our sectors at a glance','قطاعاتنا بلمحة'), L('DCT brings culture and tourism together so that what we preserve and what we promote tell one story. Each sector has its own teams, but most projects cross between them.','تجمع الدائرة الثقافة والسياحة لتروي ما نحافظ عليه وما نروّج له قصة واحدة. لكل قطاع فرقه، لكن معظم المشاريع تتقاطع بينهما.'), ''),
          { isRes:true, kind:L('Resources','الموارد'), title:false, tag:false, items:[ { ty:'PDF', cls:'', title:L('Sector map','خريطة القطاعات'), meta:L('PDF · 840 KB','PDF · 840 كيلوبايت'), cta:L('Download','تنزيل'), dl: () => this.flash(L('Downloading Sector map (PDF)','جارٍ تنزيل خريطة القطاعات')) } ] },
          surveyBlock(surveyQs) ];
        required = [ st.surveySent ? null : L('send the survey','أرسل الاستبيان') ];
      } else if (unitN === 3) {
        const sc = st.scorm;
        const SL = [ [L('Qasr Al Hosn','قصر الحصن'), L('Abu Dhabi’s oldest stone building, once home to the ruling family and today a national monument.','أقدم مبنى حجري في أبوظبي، كان مقراً للأسرة الحاكمة وهو اليوم معلم وطني.')], [L('Al Ain Oasis','واحة العين'), L('A UNESCO World Heritage site with a working falaj irrigation system that is thousands of years old.','موقع تراث عالمي لليونسكو يضم نظام ري بالأفلاج عمره آلاف السنين.')], [L('Saadiyat Cultural District','المنطقة الثقافية في السعديات'), L('Home to Louvre Abu Dhabi, Zayed National Museum and teamLab Phenomena.','موطن اللوفر أبوظبي ومتحف زايد الوطني وتيم لاب فينومينا.')], [L('Module finished','انتهت الوحدة التفاعلية'), L('Great work — your progress has been sent to DCT Learn.','عمل رائع — تم إرسال تقدّمك إلى DCT Learn.')] ];
        const cur = Math.max(0, Math.min(sc - 1, 3));
        blocks = [ { isScorm:true, kind:L('Interactive module','وحدة تفاعلية'), title:false, poster:IMG.ay, tag: sc >= 4 ? L('Completed','مكتمل') : L('Required','مطلوب'), tagCls: sc >= 4 ? 'ok' : 'warn',
            sstat: sc === 0 ? L('Not started','لم يبدأ') : sc >= 4 ? 'completion_status: completed' : 'completion_status: incomplete · ' + sc + '/3', notLaunched: sc === 0, launched: sc > 0,
            stitle:L('Abu Dhabi’s cultural sites','المواقع الثقافية في أبوظبي'), sdesc:L('An interactive tour of three landmark sites. About 8 minutes. Your place is saved if you leave.','جولة تفاعلية في ثلاثة مواقع بارزة. نحو 8 دقائق، ويُحفظ مكانك إن غادرت.'), launchL:L('Launch module','تشغيل الوحدة'), launch: () => set({ scorm:1 }),
            slideEy: sc >= 4 ? L('Done','تم') : L('Site ','الموقع ') + fmt(cur + 1) + L(' of 3',' من 3'), slideH:SL[cur][0], slideP:SL[cur][1], sdots:[0,1,2,3].map(i => ({ cls: i <= cur ? 'on' : '' })),
            snextL: sc >= 4 ? L('Replay','إعادة') : sc === 3 ? L('Finish module','إنهاء الوحدة') : L('Next site','الموقع التالي'), snext: () => { if (sc >= 4) set({ scorm:1 }); else { set({ scorm: sc + 1 }); if (sc === 3) this.flash(L('Interactive module completed','اكتملت الوحدة التفاعلية')); } } },
          mkText('u3t', L('Why these sites matter','لماذا تهمّ هذه المواقع'), L('Our cultural sites are where visitors meet Abu Dhabi’s story in person. Knowing them well helps you answer questions, recommend visits and spot ways to make each visit better.','مواقعنا الثقافية هي المكان الذي يلتقي فيه الزوار بقصة أبوظبي. معرفتك الجيدة بها تساعدك على الإجابة عن الأسئلة واقتراح الزيارات وتحسين كل زيارة.'), L('After the module, watch the short playlist below for behind-the-scenes stories from site teams.','بعد الوحدة شاهد قائمة الفيديو القصيرة أدناه لقصص من خلف الكواليس من فرق المواقع.')),
          { isPlaylist:true, kind:L('Related videos','فيديوهات ذات صلة'), title:false, tag:false, items:[ [L('A morning at Qasr Al Hosn','صباح في قصر الحصن'), '4:12', IMG.C04], [L('Inside the falaj','داخل الفلج'), '3:40', IMG.emp], [L('Building Zayed National Museum','بناء متحف زايد الوطني'), '5:05', IMG.znm] ].map((v, i) => ({ title:v[0], meta:L('Video · ','فيديو · ') + v[1], img:v[2], cls: st.pl === i ? 'on' : '', on: st.pl === i ? 'true' : 'false', pick: () => { set({ pl:i }); this.flash(L('Now playing: ','يُعرض الآن: ') + v[0]); } })) } ];
        required = [ sc >= 4 ? null : L('finish the interactive module','أنهِ الوحدة التفاعلية') ];
      } else {
        const ap = st.ap;
        const filled = [0,1,2,3,4].filter(i => (ap[i] || '').trim().length >= 10).length;
        blocks = [ mkText('u4t', L('You are part of the visitor journey','أنت جزء من رحلة الزائر'), L('A visitor’s journey starts long before they arrive — with inspiration and planning — and continues after they leave, when they share and recommend. Every DCT role touches at least one of these moments.','تبدأ رحلة الزائر قبل وصوله بكثير — بالإلهام والتخطيط — وتستمر بعد مغادرته حين يشارك تجربته ويوصي بها. كل دور في الدائرة يلامس واحدة على الأقل من هذه اللحظات.'), L('Use the action plan below to connect what you learned to your own work. Your answers are private to you and can be downloaded as a PDF.','استخدم خطة العمل أدناه لربط ما تعلمته بعملك. إجاباتك خاصة بك ويمكن تنزيلها PDF.')),
          { isAP:true, kind:L('Action plan','خطة العمل'), title:L('My DCT action plan','خطة عملي في الدائرة'), tag: filled === 5 ? L('Complete','مكتملة') : fmt(filled) + ' / 5', tagCls: filled === 5 ? 'ok' : 'warn', apIntro:L('Answer all five questions (at least 10 characters each, up to 500).','أجب عن الأسئلة الخمسة (10 أحرف على الأقل لكل سؤال وحتى 500).'),
            saved: st.apSaved, notSaved: !st.apSaved, pdf: () => this.flash(t.pdfDone),
            qs: AP.map((q, i) => { const v = ap[i] || '', n = v.length, short = st.missing && v.trim().length < 10; return { no:fmt(i + 1), text:q, id:'ap-' + i, cid:'ap-c-' + i, val:v, cls: short ? 'is-error' : (v.trim().length >= 10 ? 'is-valid' : ''), count: fmt(n) + ' / ' + fmt(500), hint: short ? L('Write at least 10 characters','اكتب 10 أحرف على الأقل') : n >= 450 ? L('Nearly at the limit','اقتربت من الحد الأقصى') : '', wcls: (short || n >= 450) ? 'warn' : '',
              set: (e) => { const a = Object.assign({}, ap); a[i] = e.target.value.slice(0, 500); set({ ap:a, apSaved:true }); } }; }) },
          { isRes:true, kind:L('Resources','الموارد'), title:false, tag:false, items:[ { ty:'DOC', cls:'tp', title:L('Action plan template','قالب خطة العمل'), meta:L('Template · DOCX · 64 KB','قالب · DOCX · 64 كيلوبايت'), cta:L('Download','تنزيل'), dl: () => this.flash(L('Downloading action plan template','جارٍ تنزيل قالب خطة العمل')) } ] } ];
        required = [ filled === 5 ? null : L('answer all five action plan questions','أجب عن أسئلة خطة العمل الخمسة') ];
      }
    } else {
      const posters = [IMG.C02, IMG.C06, IMG.team, IMG.ay, IMG.znm];
      const vt = unitTitle(unitN);
      blocks = [ mkVideo('m' + unitN, posters[unitN - 1], vt, 480, true), mkText('mt' + unitN, vt, L('Museums collect, care for and share objects that tell human stories. In this unit we look at how that work shapes what visitors see and feel.','تجمع المتاحف القطع التي تروي قصص الإنسان وتصونها وتشاركها. في هذا الدرس نرى كيف يشكّل هذا العمل ما يراه الزوار ويشعرون به.'), L('Think about the last museum you visited: what made one object stay in your memory?','فكّر في آخر متحف زرته: ما الذي جعل قطعة واحدة تبقى في ذاكرتك؟')) ];
      if (unitN === 5) blocks.push(surveyBlock(surveyQs.slice(0, 2)));
      required = [ (vid['m' + unitN] || 0) >= 100 ? null : L('watch the video','شاهد الفيديو'), unitN === 5 && !st.surveySent ? L('send the survey','أرسل الاستبيان') : null ];
    }
    blocks = blocks.map(b => Object.assign({ isVideo:false, isText:false, isCase:false, isQuotes:false, isAudio:false, isScorm:false, isPlaylist:false, isRes:false, isAP:false, isSurvey:false, title:false, tag:false, tagCls:'' }, b));
    const missList = required.filter(Boolean);
    const thisDone = isDone(unitN);
    const lastUnit = unitN === nU;
    const markDone = () => {
      if (missList.length) { set({ missing:true }); return; }
      const d = done.concat([unitN]).filter((x, i, a) => a.indexOf(x) === i);
      if (lastUnit && full) { set({ done:d, missing:false, screen:'quiz', qErr:false }); this.flash(L('+10 points · Unit complete. Now take the final check.','+10 نقاط · اكتمل الدرس. ابدأ الآن الاختبار النهائي.')); return; }
      if (lastUnit) { set({ done:d, missing:false, screen:'complete' }); this.flash(L('+60 points · Course complete and certificate issued','+60 نقطة · اكتملت الدورة وصدرت الشهادة')); return; }
      set({ done:d, missing:false, unit:unitN + 1, surveySent: false, surveyErr:false }); this.flash(L('+10 points · Unit ','+10 نقاط · الدرس ') + fmt(unitN) + L(' complete',' مكتمل'));
    };

    // ---------- quiz ----------
    const QZ = [
      { k:'q1', text:L('Which two sectors does DCT Abu Dhabi bring together?','ما القطاعان اللذان تجمعهما الدائرة؟'), opts:[['a',L('Culture and Tourism','الثقافة والسياحة')],['b',L('Health and Education','الصحة والتعليم')],['c',L('Energy and Transport','الطاقة والنقل')],['d',L('Finance and Trade','المالية والتجارة')]], ok:'a', type:L('Multiple choice','اختيار من متعدد') },
      { k:'q2', text:L('Where is Zayed National Museum?','أين يقع متحف زايد الوطني؟'), opts:[['a',L('Saadiyat Cultural District','المنطقة الثقافية في السعديات')],['b',L('Al Ain Oasis','واحة العين')],['c',L('Yas Island','جزيرة ياس')],['d',L('Al Maryah Island','جزيرة الماريه')]], ok:'a', type:L('Multiple choice','اختيار من متعدد') },
      { k:'q3', text:L('Which stage of the visitor journey happens before arrival?','أي مرحلة من رحلة الزائر تسبق وصوله؟'), opts:[['a',L('Inspiration and planning','الإلهام والتخطيط')],['b',L('The on-site experience','التجربة في الموقع')],['c',L('Sharing and recommending','المشاركة والتوصية')]], ok:'a', type:L('Multiple choice','اختيار من متعدد') },
      { k:'q4', text:L('True or false: every DCT employee is part of the visitor journey, even in back-office roles.','صح أم خطأ: كل موظف في الدائرة جزء من رحلة الزائر، حتى في الأدوار المساندة.'), opts:[['t',L('True','صح')],['f',L('False','خطأ')]], ok:'t', type:L('True / false','صح / خطأ'), row:true },
      { k:'q5', text:L('In one or two sentences, how does your role support a visitor’s experience?','في جملة أو جملتين: كيف يدعم دورك تجربة الزائر؟'), open:true, type:L('Open text','إجابة مفتوحة') }
    ];
    const qa = st.qa;
    const quiz = QZ.map((q, i) => ({ n:L('Question ','السؤال ') + fmt(i + 1) + ' · ' + q.type, text:q.text, name:'qz-' + q.k, isOpts:!q.open, isText:!!q.open, row: q.row ? 'row' : '', err: st.qErr && !(q.open ? (qa[q.k] || '').trim().length >= 10 : qa[q.k]),
      cls: st.qErr && q.open && (qa[q.k] || '').trim().length < 10 ? 'is-error' : '', val: qa[q.k] || '', count: fmt((qa[q.k] || '').length) + ' / ' + fmt(500), set: (e) => set({ qa:Object.assign({}, qa, { [q.k]: e.target.value.slice(0,500) }) }),
      opts:(q.opts || []).map(o => ({ l:o[1], on: qa[q.k] === o[0], cls: qa[q.k] === o[0] ? 'sel' : '', pick: () => set({ qa:Object.assign({}, qa, { [q.k]: o[0] }) }) })) }));
    const answered = QZ.filter(q => q.open ? (qa[q.k] || '').trim().length >= 10 : qa[q.k]).length;
    const attempts = st.attempts;
    const submitQuiz = () => {
      if (answered < 5) { set({ qErr:true }); return; }
      set({ busy:true });
      setTimeout(() => {
        const correct = QZ.filter(q => q.open ? (qa[q.k] || '').trim().length >= 10 : qa[q.k] === q.ok).length;
        const score = correct * 20;
        this.setState({ busy:false, qErr:false, attempts: attempts + 1, result:{ score, passed: score >= 70 }, screen:'result' });
      }, 700);
    };
    const res = st.result || { score:0, passed:false };
    const outOf = !res.passed && attempts >= 2;
    const rc = 2 * Math.PI * 64;
    const review = QZ.map((q, i) => { const a = qa[q.k]; const ok = q.open ? (a || '').trim().length >= 10 : a === q.ok; const txt = q.open ? (a || '—') : ((q.opts.filter(o => o[0] === a)[0] || ['', '—'])[1]);
      return { n:fmt(i + 1), q:q.text, a:txt, st: res.passed ? (ok ? 'done' : 'lock') : 'avail', tag: res.passed ? (ok ? L('Correct','صحيحة') : L('Incorrect','خاطئة')) : L('Answered','تمت الإجابة'), tagCls: res.passed ? (ok ? 'ok' : 'bad') : 'mut' }; });

    const unitsPts = done.length * 10;
    const sh = this.shell(ar, 'learner', 'hub_courses', site, [ { label:L(SN[0],SN[1]), href:'/'+site+'/dashboard' }, { label:L('Courses','الدورات'), href:'/'+site+'/hub/courses' }, { label:CRS.title } ]);
    sh.userName = L(U[0],U[1]); sh.initials = U[2]; sh.userSub = L(U[3],U[4]);
    const SCR = full ? ['outline','unit1','unit2','unit3','unit4','quiz','pass','fail','complete'] : ['outline','unit1','unit2','unit3','unit4','complete'];
    const SCL = { outline:'Outline', unit1:'U1', unit2:'U2', unit3:'U3', unit4:'U4', quiz:'Quiz', pass:'Passed', fail:'Failed', complete:'Complete' };
    const curScr = screen === 'unit' ? 'unit' + unitN : screen === 'result' ? (res.passed ? 'pass' : 'fail') : screen;
    const firstName = L(U[0].split(' ')[0], U[1].split(' ')[0]);
    return {
      lang, dir: ar?'rtl':'ltr', t, sh, protoCls: this.props.proto ? 'proto' : '', route:'/'+site+'/learn/'+slug + (screen === 'unit' ? '/u' + unitN : screen === 'quiz' || screen === 'result' ? '/final-check' : ''),
      c:{ title:CRS.title, img:CRS.img, cats:CRS.cats, desc:CRS.desc, facts:CRS.facts, certRule:CRS.certRule, info:CRS.info.map(x => ({ k:x[0], v:x[1] })) },
      isOutline: screen === 'outline', isUnit: screen === 'unit', isQuiz: screen === 'quiz', isResult: screen === 'result', isComplete: screen === 'complete',
      pct: pctN + '%', pctN:String(pctN), pctL: fmt(pctN) + '%', progTxt: complete ? L('Completed','مكتملة') : fmt(done.length) + L(' of ',' من ') + fmt(nU) + L(' units done',' دروس مكتملة'),
      resumeL, resume, hubHref:'/'+site+'/hub/courses', achHref:'/'+site+'/achievements', mods,
      certLock: complete ? '' : 'lockd', isLocked: !complete, certTag: complete ? L('Issued','صادرة') : L('Locked','مقفلة'), certTagCls: complete ? 'ok' : 'mut',
      ptsEarned: fmt(unitsPts + (complete ? 50 : 0)) + L(' earned',' مكتسبة'), ptsTotal: fmt(nU * 10 + 50) + L(' pts',' نقطة'),
      unit:{ ey: L('Module ','الوحدة ') + fmt(unitN <= 2 ? 1 : (full || unitN <= 4 ? 2 : 3)) + L(' · Unit ',' · الدرس ') + fmt(unitN) + L(' of ',' من ') + fmt(nU), title: unitTitle(unitN), sub: full && unitN === 4 ? L('Final unit — complete it to unlock the final check.','الدرس الأخير — أكمله لفتح الاختبار النهائي.') : L('Complete the required blocks, then mark the unit complete.','أكمل الأجزاء المطلوبة ثم سجّل الدرس كمكتمل.') },
      blocks, missing: st.missing && missList.length ? L('To finish: ','لإكمال الدرس: ') + missList.join(L(', ','، ')) + '.' : false,
      hasPrev: unitN > 1, noPrev: unitN === 1, goPrev: () => set({ unit:unitN - 1, missing:false }), toOutline: () => set({ screen:'outline' }),
      unitDone: thisDone, unitOpen: !thisDone, markDone, markL: lastUnit && full ? L('Mark complete & take final check','سجّل كمكتمل وابدأ الاختبار') : L('Mark complete','سجّل كمكتمل'),
      showNext: thisDone, nextL: lastUnit ? (full ? L('Final check','الاختبار النهائي') : L('Finish','إنهاء')) : L('Next unit','الدرس التالي'),
      goNext: () => { if (lastUnit) set(full ? (passed ? { screen:'complete' } : { screen:'quiz' }) : { screen:'complete' }); else set({ unit:unitN + 1, missing:false }); },
      quiz, qErr: st.qErr ? L('Questions without an answer are marked below. Open answers need at least 10 characters.','الأسئلة بلا إجابة موضحة أدناه. الإجابة المفتوحة تحتاج 10 أحرف على الأقل.') : false, submitQuiz, busy: st.busy ? 'true' : 'false', busyCls: st.busy ? 'is-loading' : '',
      attemptsL: fmt(attempts) + L(' of ',' من ') + fmt(2) + L(' used',' مستخدمة'), answeredL: fmt(answered) + ' / ' + fmt(5), backU4: () => set({ screen:'unit', unit:4, missing:false }),
      scoreL: fmt(res.score) + '%', ringC: res.passed ? '#15801A' : '#D63539', ringDash: (rc * res.score / 100).toFixed(1) + ' ' + rc.toFixed(1),
      passed: res.passed, canRetry: !res.passed && attempts < 2, outOf,
      resTag: res.passed ? L('Passed','ناجح') : outOf ? L('No attempts left','لا محاولات متبقية') : L('Not passed','لم تنجح'), resTagCls: res.passed ? 'ok' : 'bad',
      resH: res.passed ? L('Well done, you passed','أحسنت، لقد نجحت') : outOf ? L('You’ve used both attempts','استخدمت المحاولتين') : L('Not quite — 1 attempt left','لم تصل بعد — بقيت محاولة واحدة'),
      resBody: res.passed ? L('You scored above the 70% pass mark. Finish the course to receive your certificate and 50 completion points.','حصلت على أعلى من درجة النجاح 70%. أنهِ الدورة لتحصل على شهادتك و50 نقطة إكمال.') : outOf ? L('Your programme admin can review your attempts and reset the quiz. Your unit progress is saved.','يمكن لمسؤول البرنامج مراجعة محاولاتك وإعادة فتح الاختبار. تقدّمك في الدروس محفوظ.') : L('You need 70% to pass. Review units 3 and 4, then try again — correct answers stay hidden until you pass.','تحتاج إلى 70% للنجاح. راجع الدرسين 3 و4 ثم حاول مجدداً — تبقى الإجابات الصحيحة مخفية حتى تنجح.'),
      resP: L('Attempt ','المحاولة ') + fmt(attempts) + L(' of 2 · pass mark 70%',' من 2 · درجة النجاح 70%'), review,
      finish: () => { set({ screen:'complete' }); this.flash(L('+50 points · Certificate issued','+50 نقطة · صدرت الشهادة')); },
      retry: () => set({ screen:'quiz', qa:{}, qErr:false }),
      doneH: L('Congratulations, ','مبروك يا ') + firstName, doneP: L('You completed ','أكملت ') + CRS.title + L('. Your certificate is ready and the course now shows as complete on your dashboard.','. شهادتك جاهزة، وتظهر الدورة الآن مكتملة في لوحة التحكم.'),
      bonus: fmt(50), serial: CRS.serial, unitsPts:'+' + fmt(unitsPts), unitsPtsL: fmt(done.length) + L(' units × 10',' دروس × 10'),
      dlCert: () => this.flash(t.dlDone), copyLink: () => this.flash(t.copied),
      nextHref:'/'+site+'/learn/'+CRS.next[0], nextTitle:CRS.next[1], nextMeta:CRS.next[2],
      toast: st.toast || false,
      courseBtns: [['dct-world','C01 DCT World'],['museum-101','C02 Museum 101']].map(x => ({ label:x[1], cls: x[0] === slug ? 'is-on' : '', pick: () => this.setState(Object.assign(this.preset('outline', x[0]), { course:x[0], locale:this.state.locale })) })),
      screenBtns: SCR.map(k => ({ label:SCL[k], cls: k === curScr ? 'is-on' : '', pick: () => { this.setState(Object.assign(this.preset(k, slug), { course:this.state.course, locale:this.state.locale })); if (k === 'complete') this.flash(L('+50 points · Certificate issued','+50 نقطة · صدرت الشهادة')); } })),
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => set({ locale:'en' }), setAr: () => set({ locale:'ar' }), toggleLang: () => set({ locale: ar ? 'en' : 'ar' })
    };
  }
}
