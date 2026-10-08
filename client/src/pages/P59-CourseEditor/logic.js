// Ported verbatim from the Claude Design artboard P59-CourseEditor (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = {"locale": null}; }

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
    const fmt = (n) => Number(n).toLocaleString(ar ? 'ar-AE' : 'en-US');
    const S = (o) => this.setState(o);
    const st = (k) => (this.state[k] !== undefined && this.state[k] !== null) ? this.state[k] : this.props[k];
    const seg = (label, key, opts) => ({ label, btns: opts.map(o => ({ label:o[1], cls: st(key) === o[0] ? 'is-on' : '', pick: () => S(Object.assign({ [key]: o[0] }, o[2] || {})) })) });
    const flash = (msg) => { S({ toast: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast: null }), 3600); };
    const base = { toast: this.state.toast || false, lang, dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '', enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => S({ locale:'en' }), setAr: () => S({ locale:'ar' }), toggleLang: () => S({ locale: ar ? 'en' : 'ar' }) };

        // SEED §2 — 23 courses: key, EN, AR, categories [en, ar], level, min, units, cert, status, microsites, enrolled, completed, img
    const IMGS = { C01:'fa500a874150b2a1769785936a6d7785', C02:'d99ea09adede7395461223b429f24cf4', C04:'592272d2d94f43d123cbcdda07b02178', C05:'d01461a3f6ad3ced258aac4713f94408', C06:'cf69d2b8596f972f4af9fc63c0137303', C07:'f1cfe235742010d5ac7c29f64fa633a0', C09:'91fa1af72d1e01df9c41fd3bfd8dc824', C13:'40780df486810d248ab2ca9a23d58dcb', C14:'403bd7970d9211d5acd7b2806550e6a7', C17:'17f39841203c4958a320c0442a073383', C18:'f53e39067997d52c15204d509b52dd30', C22:'d87a92b0c7b42fcdfdc06b70145ff332',
      C03:'fa500a874150b2a1769785936a6d7785', C08:'92c83a667e1befe5661dab8c7ebca349', C10:'6a330c17598da2f1e81b82711e1c5e9a', C11:'6a330c17598da2f1e81b82711e1c5e9a', C12:'91fa1af72d1e01df9c41fd3bfd8dc824', C15:'403bd7970d9211d5acd7b2806550e6a7', C16:'2ff5095865986643708258995c8a0113', C19:'f53e39067997d52c15204d509b52dd30', C20:'7430eed874cd248e04160ae211dc6b79', C21:'7430eed874cd248e04160ae211dc6b79', C23:'d87a92b0c7b42fcdfdc06b70145ff332' };
    const CATS = { about:['All about DCT','كل ما يخص الدائرة'], welcome:['Welcome to DCT','مرحباً بك في الدائرة'], museums:['The World of Museums','عالم المتاحف'], heritage:['Cultural Heritage','التراث الثقافي'], tourism:['Tourism Management','إدارة السياحة'], creative:['Creative and Cultural Industries','الصناعات الثقافية والإبداعية'], compliance:['Corporate Knowledge and Compliance','المعرفة المؤسسية والامتثال'], znm:['ZNM onboarding','التهيئة في متحف زايد الوطني'], post:['Post-Assessment','التقييم اللاحق'], doc:['Fundamentals – Documentation of Cultural Heritage','أساسيات توثيق التراث الثقافي'], cons:['Conservation and exhibition of artefacts','صون القطع الأثرية وعرضها'], interp:['Interpretation and audience management','التفسير وإدارة الجمهور'], aware:['AI Aware','الوعي بالذكاء الاصطناعي'], pract:['AI Practitioner','ممارس الذكاء الاصطناعي'], builder:['AI Builder','مطوّر الذكاء الاصطناعي'], div:['Protection and Promotion of the Diversity of Cultural Expression','حماية تنوع أشكال التعبير الثقافي وتعزيزه'] };
    const COURSES = [
      ['C01','DCT World','عالم الدائرة',['about','welcome'],'beginner',45,4,'yes','published',['employees','znm'],5,3],
      ['C02','Museum 101','المتاحف 101',['museums'],'beginner',60,5,'yes','published',['employees','znm'],5,0],
      ['C03','DCTLEARN','منصة DCT Learn',['about'],'beginner',20,2,'yes','published',['employees'],4,1],
      ['C04','Understanding Cultural Heritage','فهم التراث الثقافي',['heritage'],'beginner',50,4,'yes','published',['employees'],4,0],
      ['C05','Sustainable Tourism','السياحة المستدامة',['tourism'],'intermediate',60,4,'yes','published',['employees'],4,0],
      ['C06','The World of Curation','عالم التقييم الفني',['museums'],'intermediate',55,4,'yes','published',['employees'],4,0],
      ['C07','Creative Tourism: What is it?','السياحة الإبداعية',['creative'],'beginner',40,3,'yes','published',['employees'],4,0],
      ['C08','Data Protection for People and Performance','حماية البيانات',['compliance'],'beginner',30,3,'yes','published',['employees'],4,0],
      ['C09','Introduction to Ticketing','مقدمة في التذاكر',['znm'],'beginner',35,3,'yes','published',['znm'],2,2],
      ['C10','Operational Readiness – Induction','الجاهزية التشغيلية – التعريف',['znm'],'beginner',40,3,'yes','published',['znm'],2,1],
      ['C11','Operational Readiness – Role-Specific','الجاهزية التشغيلية – حسب الدور',['znm'],'intermediate',45,3,'yes','published',['znm'],2,0],
      ['C12','VS Knowledge Assessment','تقييم المعرفة',['post'],'beginner',15,1,'no','published',['znm'],2,1],
      ['C13','24 Hour Challenge – Introduction to Cultural Heritage','تحدي 24 ساعة',['heritage'],'beginner',90,4,'yes','published',['zu'],2,1],
      ['C14','Condition Report: General Presentation','تقرير الحالة',['doc'],'intermediate',50,3,'yes','published',['museopro'],1,1],
      ['C15','Conservation and Exhibition of Artefacts','صون وعرض القطع',['cons'],'intermediate',60,4,'yes','published',['museopro'],1,0],
      ['C16','Curating an Exhibition: From Concept to Production','تنظيم المعارض',['cons'],'advanced',70,4,'yes','published',['museopro'],1,0],
      ['C17','Written and Oral Interpretation Tools in Heritage','أدوات التفسير',['interp'],'intermediate',45,3,'yes','coming_soon',['museopro'],0,0],
      ['C18','Introduction to Generative AI','مقدمة في الذكاء الاصطناعي التوليدي',['aware'],'beginner',120,1,'external','published',['nibras'],1,1],
      ['C19','Ethics of AI','أخلاقيات الذكاء الاصطناعي',['aware'],'beginner',90,1,'external','published',['nibras'],1,0],
      ['C20','Foundations of Prompt Engineering','أساسيات هندسة الأوامر',['pract'],'intermediate',180,1,'external','published',['nibras'],1,0],
      ['C21','LLMOps','عمليات نماذج اللغة',['builder'],'advanced',240,1,'external','published',['nibras'],1,0],
      ['C22','UNESCO: Implementation of the Convention on Diversity of Cultural Expressions','اتفاقية اليونسكو',['div'],'intermediate',60,3,'yes','published',['chkforum'],0,0],
      ['C23','Abu Dhabi Creative City and Its Cooperation with Other Cities','أبوظبي مدينة مبدعة',['div'],'intermediate',45,3,'yes','published',['chkforum'],0,0]
    ];
    const MS = { employees:['DCT Employees','موظفو الدائرة','#EE3E43'], elevate:['Elevate 2026','إرتقاء 2026','#CD3151'], znm:['Zayed National Museum','متحف زايد الوطني','#3B2F92'], zu:['ZU 24-Hour Challenge','تحدي جامعة زايد','#F7C337'], museopro:['MuseoPro','ميوزيو برو','#E35E3C'], nibras:['Nibras — AI Champions','نبراس','#2FC4DB'], chkforum:['Cultural Heritage Forum','منتدى التراث الثقافي','#6D7782'], ruwaad:['Ruwaad','رواد','#F77860'], csmd:['Cultural Sites Management','إدارة المواقع الثقافية','#C9BFB2'] };
    const LEVEL = { beginner:['Beginner','مبتدئ'], intermediate:['Intermediate','متوسط'], advanced:['Advanced','متقدم'] };

    const t = ar ? {
      spec:'محرّر الدورة', fmtL:{ b:'غامق', i:'مائل', h:'عنوان', l:'قائمة', k:'رابط' }, ey:'محرّر الدورة', preview:'معاينة كمتعلّم', saveDraft:'حفظ المسودة', publish:'نشر الدورة', saveCh:'حفظ التغييرات', tabsLbl:'أقسام المحرّر',
      tabs:['المحتوى','الاختبار والتقييم','بطاقة الدورة','الشهادة','النقاط والإعدادات'],
      banH:'أنت تحرّر دورة منشورة', banP:'يتعلّم منها متعلّمون الآن. هكذا تُطبَّق تعديلاتك:',
      banL:[{l:'تغييرات النصوص والوسائط والعناوين تظهر فوراً للجميع.'},{l:'إضافة وحدة أو كتلة: من أكمل الدورة يبقى مكتملاً.'},{l:'حذف وحدة أو كتلة: يُحفظ التقدّم ويُعاد احتساب نسبة الإكمال.'},{l:'تعديل اختبار له محاولات يُنشئ إصداراً جديداً؛ والشهادات الصادرة لا تُلغى.'}],
      structure:'هيكل الدورة', addModule:'+ وحدة رئيسية', addUnit:'إضافة درس', addBlock:'إضافة كتلة', blockTypes:'نوع الكتلة', new:'جديد', required:'إلزامية', moveUp:'نقل لأعلى', moveDown:'نقل لأسفل', remove:'حذف',
      titleEn:'العنوان (بالإنجليزية)', titleAr:'العنوان (بالعربية)', vidUrl:'رابط الفيديو أو المعرّف', vidHint:'روابط يوتيوب https فقط.', vidErr:'أدخل رابط يوتيوب صالحاً (https) أو معرّفاً من 11 حرفاً', watchEnd:'يجب مشاهدة 90% من الفيديو لإكمال الكتلة',
      body:'النص', lang:'اللغة', format:'التنسيق', scenario:'السيناريو', reflect:'سؤال التأمّل', reflectH:'يكتب المتعلّم إجابته ولا تُقيَّم.', author:'القائل', removeQuote:'حذف الاقتباس', addQuote:'إضافة اقتباس', quoteN:'الاقتباس',
      play:'تشغيل', replace:'استبدال', transcript:'النص المكتوب', optional:'(اختياري)', audioMeta:'6:04 · 5.6 م.ب · MP3', audioHint:'ملفات MP3 أو M4A حتى 50 م.ب.',
      addFile:'إضافة ملف', fileHint:'PDF حتى 10 م.ب، أو رابط https', scormMeta:'48 م.ب · SCORM 1.2 · تم الفك في بيئة معزولة', manifestOk:'البيان صالح', launch:'ملف التشغيل', compRule:'قاعدة الإكمال', ruleC:'عند حالة «مكتمل»', ruleP:'عند حالة «ناجح»', uploadZip:'رفع حزمة جديدة', zipHint:'ملف ZIP حتى 200 م.ب',
      addVideo:'إضافة فيديو إلى القائمة', add:'إضافة', intro:'مقدّمة', questions:'الأسئلة', question:'السؤال', charLimit:'حد الأحرف', pdf:'السماح للمتعلّم بتنزيل خطته بصيغة PDF', surveyHint:'الاستطلاع لا يُقيَّم ولا يمنع التقدّم.',
      openQuiz:'إعدادات الاختبار', quizHint:'الاختبار المانع يجب اجتيازه قبل إكمال الدورة وإصدار الشهادة.', saveBlock:'حفظ الكتلة',
      verH:'للاختبار محاولات سابقة', verP:'حفظ التغييرات يُنشئ الإصدار 2. تحتفظ المحاولات السابقة بدرجاتها وفق الإصدار 1.',
      quizSettings:'إعدادات الاختبار', blocking:'مانع', qType:'النوع', qtB:'اختبار مانع', qtNB:'اختبار غير مانع', qtS:'استطلاع', passMark:'درجة النجاح (%)', attempts:'المحاولات المسموحة', pmErr:'بين 1 و100', atErr:'بين 1 و5',
      timeLimit:'الحد الزمني (دقائق)', shuffle:'ترتيب عشوائي', shuffleH:'تبديل ترتيب الأسئلة والخيارات', final:'التقييم النهائي', finalH:'يجب اجتيازه لإكمال الدورة', saveQuiz:'حفظ الاختبار',
      addQ:'إضافة سؤال', qtMC:'اختيار من متعدد', qtTF:'صح أو خطأ', qtOT:'إجابة مفتوحة', qtSO:'ترتيب', editQ:'تحرير السؤال', qText:'نص السؤال', optsLbl:'الخيارات — حدّد الإجابة الصحيحة', correct:'صحيحة', openH:'تصحيح يدوي', openP:'تظهر الإجابات المفتوحة للمسؤول لمراجعتها، ولا تُحتسب في درجة النجاح التلقائية.', pts:'نقاط',
      noQuizH:'لا يوجد اختبار بعد', noQuizP:'أضف اختباراً نهائياً مانعاً ليجتازه المتعلّمون قبل الحصول على الشهادة.', addQuiz:'إضافة اختبار نهائي',
      cardSettings:'إعدادات البطاقة', cardImg:'صورة البطاقة', imgHint:'PNG أو JPG أو WebP حتى 5 م.ب، بنسبة 16:9.', cats:'الفئات', level:'المستوى', duration:'المدة (دقائق)', overviewEn:'نبذة (بالإنجليزية)', overviewAr:'نبذة (بالعربية)',
      soon:'قريباً', soonH:'تظهر البطاقة دون إمكانية البدء', certProg:'برنامج شهادة', certProgH:'يظهر شعار «برنامج شهادة» على البطاقة', saveCard:'حفظ البطاقة', livePrev:'معاينة مباشرة', soonTag:'قريباً',
      certPrev:'معاينة الشهادة', sampleFor:'مثال: سعيد الحمادي', certAlt:'خلفية شهادة DCT Learn', sampleName:'سعيد الحمادي', issued:'6 أكتوبر 2026', certOff:'الشهادة معطّلة لهذه الدورة',
      certSettings:'تصميم الشهادة', certOn:'إصدار شهادة', certOnH:'تُصدر عند إكمال الدورة (مرة واحدة)', sigName:'اسم الموقّع', sigTitle:'منصب الموقّع', serial:'إظهار الرقم التسلسلي ورابط التحقق', saveCert:'حفظ الشهادة', certNote:'تبقى الشهادات الصادرة صالحة ولا تتأثر بتعديل التصميم.',
      points:'النقاط', pointsH:'تُمنح مرة واحدة لكل متعلّم', ptsL:['لكل درس','لكل وحدة رئيسية','عند إكمال الدورة','عند اجتياز الاختبار'], ptsH:['عند إكمال الدرس','عند إكمال كل دروسها','مع إصدار الشهادة','أول اجتياز فقط'], ptsErr:'0–500',
      behaviour:'السلوك', seq:'دورة تسلسلية', seqH:'تُفتح الدروس بالترتيب', usedBy:'المواقع المصغّرة', mand:'إلزامية', opt:'اختيارية',
      archiveH:'أرشفة الدورة', archiveP:'تختفي الدورة من المراكز ولا يمكن التسجيل فيها. يحتفظ المتعلّمون بتقدّمهم وشهاداتهم.', archive:'أرشفة الدورة',
      close:'إغلاق', cancel:'إلغاء', saved:'تم الحفظ — التغييرات ظاهرة للمتعلّمين الآن', draftSaved:'تم حفظ المسودة', published:'تم نشر الدورة', archived:'تمت أرشفة الدورة', blockSaved:'تم حفظ الكتلة', added:'تمت إضافة كتلة جديدة', removed:'تم حذف الكتلة', quizSaved:'تم حفظ الاختبار — الإصدار 2', cardSaved:'تم حفظ البطاقة', certSaved:'تم حفظ تصميم الشهادة', fixErr:'صحّح الحقول المظلّلة أولاً',
      stPub:'منشورة', stDraft:'مسودة', stArch:'مؤرشفة', lastSaved:'آخر حفظ 5 أكتوبر 2026، 14:20 بتوقيت الخليج', justNow:'تم الحفظ الآن', unsaved:'تغييرات غير محفوظة',
      applyNow:'منشورة: تظهر التغييرات للمتعلّمين فور الحفظ.', applyDraft:'مسودة: لا يراها المتعلّمون قبل النشر.', min:'د', unitsW:'دروس', ptsW:'نقاط', blocksW:'كتل',
      delEy:'حذف كتلة', delH:'حذف «%s»؟', delP:'يُحفظ تقدّم المتعلّمين في هذه الكتلة لكن يتم تجاهله، ويُعاد احتساب تقدّم الدورة في الخلفية. الشهادات الصادرة تبقى صالحة.', delBtn:'حذف الكتلة',
      pubEy:'نشر', pubH:'نشر «%s»؟', pubP:'تم التحقق من التالي:', pubBtn:'نشر الآن', pubL:['%u دروس تحتوي على محتوى','الاختبار النهائي: %q أسئلة، النجاح 70%','البطاقة والشهادة جاهزتان','يُسجَّل أعضاء المواقع المصغّرة تلقائياً'],
      arcEy:'أرشفة', arcH:'أرشفة «%s»؟', arcBtn:'أرشفة', maxTxt:'أقصى نقاط يمكن للمتعلّم كسبها في هذه الدورة'
    } : {
      spec:'Course editor', fmtL:{ b:'Bold', i:'Italic', h:'Heading', l:'List', k:'Link' }, ey:'Course editor', preview:'Preview as learner', saveDraft:'Save draft', publish:'Publish course', saveCh:'Save changes', tabsLbl:'Editor sections',
      tabs:['Content','Quiz & assessments','Course card','Certificate','Points & settings'],
      banH:'You are editing a published course', banP:'Learners are taking it right now. This is how your edits apply:',
      banL:[{l:'Text, media and title changes apply immediately for everyone.'},{l:'Adding a unit or block: learners who completed the course stay completed.'},{l:'Removing a unit or block: progress is kept but ignored; completion is recalculated.'},{l:'Changing an assessment with attempts creates a new version; issued certificates are never revoked.'}],
      structure:'Course structure', addModule:'+ Module', addUnit:'Add unit', addBlock:'Add block', blockTypes:'Block type', new:'New', required:'Required', moveUp:'Move up', moveDown:'Move down', remove:'Remove',
      titleEn:'Title (English)', titleAr:'Title (Arabic)', vidUrl:'Video URL or ID', vidHint:'YouTube https links only.', vidErr:'Enter a valid YouTube https link or an 11-character video ID', watchEnd:'Learners must watch 90% of the video to complete the block',
      body:'Body', lang:'Language', format:'Formatting', scenario:'Scenario', reflect:'Reflection question', reflectH:'Learners write an answer; it is not graded.', author:'Attributed to', removeQuote:'Remove quote', addQuote:'Add quote', quoteN:'Quote',
      play:'Play', replace:'Replace', transcript:'Transcript', optional:'(optional)', audioMeta:'6:04 · 5.6 MB · MP3', audioHint:'MP3 or M4A up to 50 MB.',
      addFile:'Add a file', fileHint:'PDF up to 10 MB, or an https link', scormMeta:'48 MB · SCORM 1.2 · unpacked in isolation', manifestOk:'Manifest valid', launch:'Launch file', compRule:'Completion rule', ruleC:'When status is “completed”', ruleP:'When status is “passed”', uploadZip:'Upload a new package', zipHint:'ZIP up to 200 MB',
      addVideo:'Add a video to the playlist', add:'Add', intro:'Introduction', questions:'Questions', question:'Question', charLimit:'Character limit', pdf:'Let learners download their plan as a PDF', surveyHint:'Surveys are not graded and never block progress.',
      openQuiz:'Quiz settings', quizHint:'A blocking quiz must be passed before the course completes and the certificate is issued.', saveBlock:'Save block',
      verH:'This quiz already has attempts', verP:'Saving changes creates version 2. Past attempts keep their score against version 1.',
      quizSettings:'Quiz settings', blocking:'Blocking', qType:'Type', qtB:'Blocking quiz', qtNB:'Non-blocking quiz', qtS:'Survey', passMark:'Pass mark (%)', attempts:'Attempts allowed', pmErr:'Between 1 and 100', atErr:'Between 1 and 5',
      timeLimit:'Time limit (minutes)', shuffle:'Shuffle', shuffleH:'Randomise question and option order', final:'Final assessment', finalH:'Must be passed to complete the course', saveQuiz:'Save quiz',
      addQ:'Add question', qtMC:'Multiple choice', qtTF:'True / false', qtOT:'Open text', qtSO:'Sorting', editQ:'Editing question', qText:'Question text', optsLbl:'Options — mark the correct answer', correct:'Correct', openH:'Manual review', openP:'Open answers are shown to admins for review and are not counted in the automatic pass mark.', pts:'pts',
      noQuizH:'No assessment yet', noQuizP:'Add a final blocking quiz that learners must pass before they get the certificate.', addQuiz:'Add final quiz',
      cardSettings:'Card settings', cardImg:'Card image', imgHint:'PNG, JPG or WebP up to 5 MB, 16:9.', cats:'Categories', level:'Level', duration:'Duration (minutes)', overviewEn:'Overview (English)', overviewAr:'Overview (Arabic)',
      soon:'Coming soon', soonH:'Card is shown but cannot be started', certProg:'Certificate programme', certProgH:'Shows the “Certificate programme” label on the card', saveCard:'Save card', livePrev:'Live preview', soonTag:'Coming soon',
      certPrev:'Certificate preview', sampleFor:'Sample: Saeed Al Hammadi', certAlt:'DCT Learn certificate background', sampleName:'Saeed Al Hammadi', issued:'6 October 2026', certOff:'Certificate disabled for this course',
      certSettings:'Certificate design', certOn:'Issue a certificate', certOnH:'Issued once when the course completes', sigName:'Signatory name', sigTitle:'Signatory title', serial:'Show serial number and verification link', saveCert:'Save certificate', certNote:'Certificates already issued stay valid and are not changed by design edits.',
      points:'Points', pointsH:'Awarded once per learner', ptsL:['Per unit','Per module','Course completion','Assessment pass'], ptsH:['when a unit completes','when all its units complete','with the certificate','first pass only'], ptsErr:'0–500',
      behaviour:'Behaviour', seq:'Sequential course', seqH:'Units unlock in order', usedBy:'Microsites', mand:'Mandatory', opt:'Optional',
      archiveH:'Archive course', archiveP:'The course disappears from hubs and no one new can start it. Learners keep their progress and certificates.', archive:'Archive course',
      close:'Close', cancel:'Cancel', saved:'Saved — changes are live for learners', draftSaved:'Draft saved', published:'Course published', archived:'Course archived', blockSaved:'Block saved', added:'New block added', removed:'Block removed', quizSaved:'Quiz saved as version 2', cardSaved:'Card saved', certSaved:'Certificate design saved', fixErr:'Fix the highlighted fields first',
      stPub:'Published', stDraft:'Draft', stArch:'Archived', lastSaved:'Last saved 5 Oct 2026, 14:20 Gulf', justNow:'Saved just now', unsaved:'Unsaved changes',
      applyNow:'Published: changes are visible to learners as soon as you save.', applyDraft:'Draft: learners won’t see this until you publish.', min:'min', unitsW:'units', ptsW:'pts', blocksW:'blocks',
      delEy:'Remove block', delH:'Remove “%s”?', delP:'Learners’ progress on this block is kept but ignored, and course progress is recalculated in the background. Certificates already issued stay valid.', delBtn:'Remove block',
      pubEy:'Publish', pubH:'Publish “%s”?', pubP:'These checks passed:', pubBtn:'Publish now', pubL:['%u units with content','Final quiz: %q questions, pass mark 70%','Course card and certificate set','Members of the selected microsites are enrolled automatically'],
      arcEy:'Archive', arcH:'Archive “%s”?', arcBtn:'Archive', maxTxt:'maximum points a learner can earn in this course'
    };
    const T = { youtube:['YouTube video','فيديو يوتيوب','#D63539','M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z','Embed one YouTube video','تضمين فيديو واحد'],
      text:['Text','نص','#3B2F92','M4 6h16M4 10h16M4 14h10M4 18h12','Rich text, EN and AR','نص منسّق بالعربية والإنجليزية'],
      case_study:['Case study','دراسة حالة','#CD3151','M3 7h18v13H3zM8 7V4h8v3M3 12h18','Scenario and reflection question','سيناريو وسؤال تأمّل'],
      quotes:['Quotes','اقتباسات','#E35E3C','M3 21c3 0 7-1 7-8V5H3v7h4c0 4-2 5-4 5zM14 21c3 0 7-1 7-8V5h-7v7h4c0 4-2 5-4 5z','Highlighted quotes with attribution','اقتباسات بارزة مع أصحابها'],
      audio:['Audio','صوت','#CD3151','M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z','MP3 / M4A with transcript','ملف صوتي مع نص مكتوب'],
      resources:['Resources','موارد','#3B2F92','M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5','Downloadable files and links','ملفات وروابط للتنزيل'],
      scorm:['SCORM package','حزمة SCORM','#1D1650','M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7 12 12l8.7-5M12 22V12','Interactive SCORM 1.2 module','وحدة تفاعلية SCORM 1.2'],
      youtube_playlist:['YouTube playlist','قائمة تشغيل','#D63539','M3 6h12M3 12h12M3 18h8M17 14l5 3-5 3z','Several videos in order','عدة فيديوهات بالترتيب'],
      action_plan:['Action plan','خطة عمل','#BF2E32','M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z','Guided questions, PDF export','أسئلة موجّهة وتصدير PDF'],
      survey:['Survey','استطلاع','#15801A','M9 2h6v4H9zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4','Ungraded questions','أسئلة غير مقيّمة'],
      quiz_blocking:['Blocking quiz','اختبار مانع','#1D1650','M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M10 16l1.5 1.5L14 15','Must be passed to continue','يجب اجتيازه للمتابعة'] };
    const key = (this.props.course || 'C01').toUpperCase();
    const row = COURSES.find(r => r[0] === key) || COURSES[0];
    const isC01 = row[0] === 'C01';
    // ---- base structure
    let MODS, UNITS, BL;
    if (isC01) {
      MODS = [ { id:'M1', en:'Welcome to DCT', ar:'مرحباً بك في الدائرة' }, { id:'M2', en:'Culture & Tourism', ar:'الثقافة والسياحة' } ];
      UNITS = [ { id:'U1', m:'M1', en:'Who we are', ar:'من نحن' }, { id:'U2', m:'M1', en:'Our sectors', ar:'قطاعاتنا' }, { id:'U3', m:'M2', en:'Abu Dhabi’s cultural sites', ar:'المواقع الثقافية في أبوظبي' }, { id:'U4', m:'M2', en:'Your role in the visitor journey', ar:'دورك في رحلة الزائر' } ];
      BL = {
        b1:{ u:'U1', type:'youtube', ten:'DCT in three minutes', tar:'الدائرة في ثلاث دقائق', vid:'dQw4w9WgXcQ', req:true, watch:true },
        b2:{ u:'U1', type:'text', ten:'Summary: who we are', tar:'ملخّص: من نحن', req:true, en:'The Department of Culture and Tourism – Abu Dhabi brings culture and tourism together under one roof. We protect the emirate’s heritage, grow its creative industries and welcome millions of visitors every year.\n\nIn this course you will meet our sectors, visit our cultural sites and see where your role fits in the visitor journey.', ar:'تجمع دائرة الثقافة والسياحة – أبوظبي الثقافة والسياحة تحت سقف واحد. نحمي تراث الإمارة، وننمّي صناعاتها الإبداعية، ونستقبل ملايين الزوار كل عام.\n\nستتعرّف في هذه الدورة إلى قطاعاتنا، وتزور مواقعنا الثقافية، وترى موقع دورك في رحلة الزائر.' },
        b3:{ u:'U1', type:'case_study', ten:'Case study: a first visit to Qasr Al Hosn', tar:'دراسة حالة: الزيارة الأولى لقصر الحصن', req:true, scen:L('A family arrives at Qasr Al Hosn on a Friday afternoon. They booked online, but the children are tired and the parents want to understand the fort’s story in under an hour. Three DCT colleagues — ticketing, a guide and a café host — each meet them once.','تصل عائلة إلى قصر الحصن عصر يوم جمعة. حجزوا عبر الإنترنت، لكن الأطفال متعبون والوالدان يريدان فهم قصة الحصن في أقل من ساعة. يلتقيهم ثلاثة من زملاء الدائرة — في التذاكر، والإرشاد، والمقهى — كلٌّ مرة واحدة.'), refl:L('Which of the three moments would you improve first, and how?','أيّ اللحظات الثلاث ستحسّنها أولاً، وكيف؟') },
        b4:{ u:'U1', type:'quotes', ten:'Voices from DCT', tar:'أصوات من الدائرة', req:false, quotes:[ { text:L('Every visitor should leave with a story they want to tell.','يجب أن يغادر كل زائر ومعه قصة يرغب في روايتها.'), author:L('Visitor Experience team','فريق تجربة الزوار') }, { text:L('Heritage is not behind glass — it is what we do every day.','التراث ليس خلف الزجاج، بل هو ما نفعله كل يوم.'), author:L('Cultural Heritage sector','قطاع التراث الثقافي') } ] },
        b5:{ u:'U2', type:'audio', ten:'DCT Flow — Our sectors', tar:'تدفّق الدائرة — قطاعاتنا', req:true, tr:L('Welcome to DCT Flow. In the next six minutes we walk through how our sectors work together…','مرحباً بك في «تدفّق الدائرة». في الدقائق الست القادمة نتعرّف إلى طريقة عمل قطاعاتنا معاً…') },
        b6:{ u:'U2', type:'text', ten:'Our sectors at a glance', tar:'قطاعاتنا بإيجاز', req:true, en:'Culture, tourism, heritage and creative industries each have their own teams — and they meet in every visitor experience.', ar:'لكل من الثقافة والسياحة والتراث والصناعات الإبداعية فرقها الخاصة — وتلتقي جميعها في كل تجربة زائر.' },
        b7:{ u:'U2', type:'resources', ten:'Sector map', tar:'خريطة القطاعات', req:false, files:[ { n:'Sector map.pdf', ext:'PDF', m:'1.2 MB', c:'#D63539' } ] },
        b8:{ u:'U2', type:'survey', ten:'Quick check-in', tar:'استطلاع سريع', req:true, qs:[ [L('Which sector did you know least about before this unit?','ما القطاع الذي كنت تعرف عنه أقل قبل هذا الدرس؟'),'single'], [L('How clear is the sector map? (1–5)','ما مدى وضوح خريطة القطاعات؟ (1–5)'),'scale'], [L('What would you like to learn next?','ماذا تودّ أن تتعلّم بعد ذلك؟'),'open'] ] },
        b9:{ u:'U3', type:'scorm', ten:'Cultural sites explorer', tar:'مستكشف المواقع الثقافية', req:true },
        b10:{ u:'U3', type:'text', ten:'Beyond the landmarks', tar:'ما وراء المعالم', req:true, en:'From Al Ain Oasis to the Saadiyat Cultural District, each site has its own visitors, rhythms and stories.', ar:'من واحة العين إلى المنطقة الثقافية في السعديات، لكل موقع زواره وإيقاعه وحكاياته.' },
        b11:{ u:'U3', type:'youtube_playlist', ten:'Site stories', tar:'حكايات المواقع', req:false, vids:[ [L('Qasr Al Hosn — the story of a fort','قصر الحصن — حكاية حصن'),'X7kq2LmP0aQ','4:10'], [L('Al Ain Oasis at dawn','واحة العين عند الفجر'),'T3vN8rWb1sE','3:05'], [L('Inside the Saadiyat Cultural District','داخل المنطقة الثقافية في السعديات'),'H6pZ4yUc9oK','5:40'] ] },
        b12:{ u:'U4', type:'text', ten:'Every role shapes the visit', tar:'كل دور يصنع الزيارة', req:true, en:'Whether you sell tickets, write policy or build systems, your work reaches a visitor somewhere along their journey.', ar:'سواء كنت تبيع التذاكر أو تكتب السياسات أو تبني الأنظمة، يصل عملك إلى الزائر في مرحلة ما من رحلته.' },
        b13:{ u:'U4', type:'action_plan', ten:'My action plan', tar:'خطة عملي', req:true, intro:L('Answer five short questions. Your plan is private and you can download it as a PDF.','أجب عن خمسة أسئلة قصيرة. خطتك خاصة بك ويمكنك تنزيلها بصيغة PDF.'), plan:[ L('In 3 years, on the professional side, I want to have done…','بعد 3 سنوات، على الصعيد المهني، أريد أن أكون قد أنجزت…'), L('In 3 years, on the personal side, I want to have learned…','بعد 3 سنوات، على الصعيد الشخصي، أريد أن أكون قد تعلّمت…'), L('One thing I will change in how I welcome visitors is…','أمر واحد سأغيّره في طريقة استقبالي للزوار هو…'), L('The colleague or team I will learn from is…','الزميل أو الفريق الذي سأتعلّم منه هو…'), L('My first step, starting this month, is…','خطوتي الأولى، ابتداءً من هذا الشهر، هي…') ] },
        b14:{ u:'U4', type:'resources', ten:'Action plan template', tar:'نموذج خطة العمل', req:false, files:[ { n:'Action plan template.docx', ext:'DOC', m:'48 KB', c:'#3B2F92' } ] },
        b15:{ u:'U4', type:'quiz_blocking', ten:'DCT World final check', tar:'التحقق النهائي – عالم الدائرة', req:true }
      };
    } else {
      const n = row[6];
      MODS = [ { id:'M1', en:'Introduction', ar:'مقدّمة' } ].concat(n > 1 ? [ { id:'M2', en:'Going further', ar:'التعمّق' } ] : []);
      const UN = [['Overview','نظرة عامة'],['Key ideas','الأفكار الرئيسية'],['In practice','في الممارسة'],['Case examples','أمثلة تطبيقية'],['Check your understanding','تحقّق من فهمك']];
      UNITS = []; BL = {}; let bi = 1;
      for (let i = 0; i < n; i++) {
        const u = 'U' + (i + 1); const nm = UN[Math.min(i, UN.length - 1)];
        UNITS.push({ id:u, m: i < Math.ceil(n / 2) ? 'M1' : 'M2', en: i === n - 1 && n > 1 ? UN[4][0] : nm[0], ar: i === n - 1 && n > 1 ? UN[4][1] : nm[1] });
        BL['b' + bi++] = { u, type:'text', ten:nm[0], tar:nm[1], req:true, en:'Unit introduction for ' + row[1] + '.', ar:'مقدّمة الدرس في «' + row[2] + '».' };
        BL['b' + bi++] = { u, type:'youtube', ten:nm[0] + ' — video', tar:'فيديو: ' + nm[1], vid:'dQw4w9WgXcQ', req:true, watch:true };
        if (i === n - 1 && n > 1) BL['b' + bi++] = { u, type:'survey', ten:'Feedback survey', tar:'استطلاع الرأي', req:false, qs:[ [L('What was most useful?','ما الأكثر فائدة؟'),'open'], [L('Rate this course (1–5)','قيّم هذه الدورة (1–5)'),'scale'] ] };
      }
    }
    // ---- state
    const tab = st('tab') || 'content';
    const status = this.state.status || this.props.status || 'published';
    const isPub = status === 'published';
    const ed = this.state.ed || {};
    const setEd = (k, v) => S({ ed: Object.assign({}, ed, { [k]: v }), dirty:true });
    const addedB = this.state.addedB || {};
    const removed = this.state.removed || {};
    const addedU = this.state.addedU || [];
    const addedM = this.state.addedM || [];
    const order = this.state.order || {};
    const allB = Object.assign({}, BL, addedB);
    const allU = UNITS.concat(addedU), allM = MODS.concat(addedM);
    const blocksOf = (u) => (order[u] || Object.keys(allB).filter(id => allB[id].u === u)).filter(id => !removed[id]);
    const firstId = Object.keys(allB).filter(id => !removed[id])[0];
    let sel = this.state.sel && allB[this.state.sel] && !removed[this.state.sel] ? this.state.sel : (isC01 ? 'b1' : firstId);
    const openM = this.state.openM || {};
    const menuU = this.state.menuU || null;
    const gv = (id, f) => ed[id + '.' + f] !== undefined ? ed[id + '.' + f] : (allB[id] || {})[f];
    const ptsUnit = this.state.pts ? this.state.pts.unit : '10';
    const mods = allM.map((m, mi) => {
      const units = allU.filter(u => u.m === m.id);
      const open = openM[m.id] !== false;
      return { k: m.id, title: L(m.en, m.ar), exp: open ? 'true' : 'false', open, cnt: fmt(units.length) + ' ' + t.unitsW,
        tog: () => S({ openM: Object.assign({}, openM, { [m.id]: !open }) }),
        addUnit: () => { const id = 'U' + (allU.length + 1); S({ addedU: addedU.concat([{ id, m:m.id, en:'New unit', ar:'درس جديد' }]), dirty:true, menuU:id }); },
        units: units.map(u => ({ k: u.id, title: L(u.en, u.ar), pts: '+' + fmt(ptsUnit) + ' ' + t.ptsW,
          menuOpen: menuU === u.id ? 'true' : 'false', showMenu: menuU === u.id, togMenu: () => S({ menuU: menuU === u.id ? null : u.id }),
          menu: Object.keys(T).map(ty => ({ l: L(T[ty][0], T[ty][1]), h: L(T[ty][4], T[ty][5]), c: T[ty][2], d: T[ty][3], pick: () => {
            const id = 'n' + (Object.keys(addedB).length + 1);
            const nb = { u:u.id, type:ty, ten:'New ' + T[ty][0].toLowerCase(), tar: T[ty][1] + ' جديد', req: ty !== 'resources', isNew:true, files:[], quotes:[ { text:'', author:'' } ], vids:[], plan:['','',''], qs:[['','open']], en:'', ar:'', vid:'' };
            const ord = Object.assign({}, order, { [u.id]: blocksOf(u.id).concat([id]) });
            S({ addedB: Object.assign({}, addedB, { [id]: nb }), order: ord, sel:id, menuU:null, dirty:true }); flash(t.added);
          } })),
          blocks: blocksOf(u.id).map(id => { const b = allB[id]; return { title: ar ? gv(id, 'tar') : gv(id, 'ten'), ty: L(T[b.type][0], T[b.type][1]), c: T[b.type][2], d: T[b.type][3], isNew: !!b.isNew,
            cls: id === sel ? 'on' : '', cur: id === sel ? 'true' : 'false', pick: () => S({ sel:id, menuU:null }) }; }) }))
      };
    });
    // ---- selected block
    const sb = allB[sel] || {};
    const sU = allU.find(u => u.id === sb.u) || allU[0];
    const sibs = blocksOf(sb.u);
    const si = sibs.indexOf(sel);
    const mv = (d) => { const j = si + d; if (j < 0 || j >= sibs.length) return; const a = sibs.slice(); a[si] = a[j]; a[j] = sel; S({ order: Object.assign({}, order, { [sb.u]: a }), dirty:true }); };
    const reqV = gv(sel, 'req');
    const bk = { tyL: L(T[sb.type][0], T[sb.type][1]), where: sU.m + ' · ' + sU.id, title: ar ? gv(sel, 'tar') : gv(sel, 'ten'),
      req: reqV ? 'true' : 'false', reqCls: reqV ? 'on' : '', togReq: () => setEd(sel + '.req', !reqV),
      up: () => mv(-1), down: () => mv(1), noUp: si <= 0 ? 'true' : 'false', noDown: si >= sibs.length - 1 ? 'true' : 'false' };
    ['youtube','text','case_study','quotes','audio','resources','scorm','youtube_playlist','action_plan','survey','quiz_blocking'].forEach((k, i) => { bk[['isYoutube','isText','isCase','isQuotes','isAudio','isRes','isScorm','isPlaylist','isPlan','isSurvey','isQuiz'][i]] = sb.type === k; });
    const fx = {};
    ['ten','tar','vid','scen','refl','tr','intro'].forEach(f => { fx[f] = { v: gv(sel, f) || '', on: (e) => setEd(sel + '.' + f, e.target.value) }; });
    ['watch','pdf'].forEach(f => { const c = gv(sel, f) !== undefined ? !!gv(sel, f) : true; fx[f] = { c, tog: () => setEd(sel + '.' + f, !c) }; });
    const vidRaw = (gv(sel, 'vid') || '').trim();
    const vidOk = (s) => /^[A-Za-z0-9_-]{11}$/.test(s) || /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]{11}/.test(s);
    const vidErr = sb.type === 'youtube' && !vidOk(vidRaw);
    const vidId = (vidRaw.match(/[A-Za-z0-9_-]{11}$/) || [vidRaw])[0] || '…';
    const txtLang = this.state.txtLang || (ar ? 'ar' : 'en');
    const txtVal = gv(sel, txtLang) || '';
    const arrK = (f) => sel + '.' + f;
    const quotesA = gv(sel, 'quotes') || [];
    const setArr = (f, a) => setEd(arrK(f), a);
    const quotes = quotesA.map((q, i) => ({ id:'qt' + i, aid:'qa' + i, lbl: t.quoteN + ' ' + fmt(i + 1), text:q.text, author:q.author,
      onText: (e) => setArr('quotes', quotesA.map((x, j) => j === i ? Object.assign({}, x, { text:e.target.value }) : x)),
      onAuthor: (e) => setArr('quotes', quotesA.map((x, j) => j === i ? Object.assign({}, x, { author:e.target.value }) : x)),
      rm: () => setArr('quotes', quotesA.filter((x, j) => j !== i)) }));
    const filesA = gv(sel, 'files') || [];
    const files = filesA.map((f, i) => Object.assign({}, f, { rm: () => setArr('files', filesA.filter((x, j) => j !== i)) }));
    const vidsA = gv(sel, 'vids') || [];
    const IMG3 = [B('fa500a874150b2a1769785936a6d7785'), B('880a72d5794fad0ac73793c03f37c852'), B('6a330c17598da2f1e81b82711e1c5e9a')];
    const playlist = vidsA.map((v, i) => ({ n: fmt(i + 1), title:v[0], id:v[1], dur:v[2], img: IMG3[i % 3], rm: () => setArr('vids', vidsA.filter((x, j) => j !== i)) }));
    const plNew = this.state.plNew || '';
    const plTried = !!this.state.plTried;
    const plErr = plTried && !vidOk(plNew.trim());
    const planA = gv(sel, 'plan') || [];
    const lims = gv(sel, 'lims') || planA.map(() => '500');
    const plan = planA.map((q, i) => ({ n: fmt(i + 1), q, lim: lims[i] || '500', aq: t.question + ' ' + (i + 1), al: t.charLimit + ' ' + (i + 1),
      onQ: (e) => setArr('plan', planA.map((x, j) => j === i ? e.target.value : x)), onLim: (e) => setArr('lims', lims.map((x, j) => j === i ? e.target.value : x)) }));
    const QT = { single:L('Single choice','اختيار واحد'), scale:L('Scale 1–5','مقياس 1–5'), open:L('Open text','نص مفتوح') };
    const svA = gv(sel, 'qs') || [];
    const survey = svA.map((q, i) => ({ n: fmt(i + 1), q:q[0], ty: QT[q[1]], aq: t.question + ' ' + (i + 1), onQ: (e) => setArr('qs', svA.map((x, j) => j === i ? [e.target.value, x[1]] : x)) }));
    const playing = !!this.state.playing;
    const wave = [14,22,30,18,34,26,12,28,36,20,16,30,24,38,22,14,26,32,18,24,30,16,28,20].map((h, i) => ({ h: h + 'px', cls: playing ? (i < 9 ? '' : 'dim') : (i < 1 ? '' : 'dim') }));
    // ---- quiz
    const QD = isC01 ? [
      { ty:'multiple_choice', text:L('Which two areas does DCT Abu Dhabi bring together?','ما المجالان اللذان تجمعهما دائرة الثقافة والسياحة – أبوظبي؟'), opts:[L('Culture and tourism','الثقافة والسياحة'),L('Sport and health','الرياضة والصحة'),L('Transport and housing','النقل والإسكان'),L('Education and research','التعليم والبحث')], ok:0, pts:2 },
      { ty:'multiple_choice', text:L('Where is the Zayed National Museum?','أين يقع متحف زايد الوطني؟'), opts:[L('Saadiyat Cultural District','المنطقة الثقافية في السعديات'),L('Al Ain Oasis','واحة العين'),L('Yas Island','جزيرة ياس'),L('Al Dhafra','الظفرة')], ok:0, pts:2 },
      { ty:'multiple_choice', text:L('Which stage of the visitor journey comes first?','ما المرحلة الأولى في رحلة الزائر؟'), opts:[L('Inspiration and planning','الإلهام والتخطيط'),L('Arrival','الوصول'),L('The visit','الزيارة'),L('Sharing the memory','مشاركة الذكرى')], ok:0, pts:2 },
      { ty:'true_false', text:L('Every DCT employee plays a part in the visitor journey.','لكل موظف في الدائرة دور في رحلة الزائر.'), opts:[L('True','صح'),L('False','خطأ')], ok:0, pts:1 },
      { ty:'open_text', text:L('Describe one way your role improves a visitor’s experience.','صف طريقة واحدة يُحسّن بها دورك تجربة الزائر.'), opts:[], ok:-1, pts:3 } ] : [];
    const qAdded = this.state.qAdded || [];
    const qEd = this.state.qEd || {};
    const QS = QD.concat(qAdded).map((q, i) => Object.assign({}, q, qEd[i] || {}));
    const hasQuiz = QS.length > 0;
    const qSel = Math.min(this.state.qSel || 0, Math.max(QS.length - 1, 0));
    const QTY = { multiple_choice:t.qtMC, true_false:t.qtTF, open_text:t.qtOT, sorting:t.qtSO };
    const setQ = (i, o) => S({ qEd: Object.assign({}, qEd, { [i]: Object.assign({}, qEd[i] || {}, o) }), dirty:true });
    const qs = QS.map((q, i) => ({ n: fmt(i + 1), text: q.text || '—', ty: QTY[q.ty], pts: fmt(q.pts) + ' ' + t.pts, cls: i === qSel ? 'on' : '', cur: i === qSel ? 'true' : 'false', pick: () => S({ qSel:i }) }));
    const cq = QS[qSel] || { ty:'multiple_choice', text:'', opts:[], ok:0 };
    const qq = { n: fmt(qSel + 1), ty: QTY[cq.ty], text: cq.text, onText: (e) => setQ(qSel, { text:e.target.value }), hasOpts: cq.ty !== 'open_text', isOpen: cq.ty === 'open_text',
      opts: (cq.opts || []).map((o, j) => ({ l:o, on: cq.ok === j, cls: cq.ok === j ? 'ok' : '', aria: t.correct + ': ' + o, lab: t.optsLbl + ' ' + (j + 1), pick: () => setQ(qSel, { ok:j }), onL: (e) => setQ(qSel, { opts: cq.opts.map((x, k) => k === j ? e.target.value : x) }) })) };
    const addQ = (e) => { const v = e.target.value; if (!v) return; const nq = { ty:v, text:'', pts:1, ok:0, opts: v === 'true_false' ? [L('True','صح'), L('False','خطأ')] : v === 'open_text' ? [] : [L('Option 1','الخيار 1'), L('Option 2','الخيار 2'), L('Option 3','الخيار 3')] }; S({ qAdded: qAdded.concat([nq]), qSel: QS.length, dirty:true }); };
    const qzD = { title: isC01 ? 'DCT World final check' : 'Final check', titleAr: isC01 ? 'التحقق النهائي – عالم الدائرة' : 'التحقق النهائي', type:'quiz_blocking', pass:'70', att:'2', tl:'', sh:true, fi:true };
    const qz0 = Object.assign({}, qzD, this.state.qz || {});
    const setQz = (o) => S({ qz: Object.assign({}, qz0, o), dirty:true });
    const pmBad = !(Number(qz0.pass) >= 1 && Number(qz0.pass) <= 100), atBad = !(Number(qz0.att) >= 1 && Number(qz0.att) <= 5 && Number.isInteger(Number(qz0.att)));
    const qz = Object.assign({}, qz0, { shCls: qz0.sh ? 'on' : '', fiCls: qz0.fi ? 'on' : '', sh: qz0.sh ? 'true' : 'false', fi: qz0.fi ? 'true' : 'false' });
    const qzOn = {}; ['title','titleAr','type','pass','att','tl'].forEach(f => { qzOn[f] = (e) => setQz({ [f]: e.target.value }); }); qzOn.sh = () => setQz({ sh: !qz0.sh }); qzOn.fi = () => setQz({ fi: !qz0.fi });
    const qe = { pm: pmBad, pmCls: pmBad ? 'is-error' : '', at: atBad, atCls: atBad ? 'is-error' : '' };
    // ---- card
    const GAL = [['C01','fa500a874150b2a1769785936a6d7785'],['team','eb80e68b5f407df8f3c317956007a5a2'],['ayyala','880a72d5794fad0ac73793c03f37c852'],['employees','92c83a667e1befe5661dab8c7ebca349']];
    const cd0 = Object.assign({ img: isC01 ? 'C01' : 'own', cats: row[3].slice(), level: row[4], min: String(row[5]), ov: isC01 ? 'Get to know DCT Abu Dhabi: who we are, our sectors, our cultural sites and your part in every visitor’s journey.' : 'An introduction to ' + row[1] + '.', ova: isC01 ? 'تعرّف إلى دائرة الثقافة والسياحة – أبوظبي: من نحن، وقطاعاتنا، ومواقعنا الثقافية، ودورك في رحلة كل زائر.' : 'مقدّمة في «' + row[2] + '».', soon: row[8] === 'coming_soon', cp:false }, this.state.cd || {});
    const setCd = (o) => S({ cd: Object.assign({}, cd0, o), dirty:true });
    const imgSrc = cd0.img === 'own' ? B(IMGS[row[0]]) : B((GAL.find(g => g[0] === cd0.img) || GAL[0])[1]);
    const gal = (isC01 ? GAL : [['own', IMGS[row[0]]]].concat(GAL.slice(1))).map(g => ({ src: B(g[1]), on: cd0.img === g[0] ? 'true' : 'false', l: L('Use image ','استخدام الصورة ') + g[0], pick: () => setCd({ img:g[0] }) }));
    const catChips = Object.keys(CATS).map(k => ({ l: L(CATS[k][0], CATS[k][1]), on: cd0.cats.indexOf(k) >= 0 ? 'true' : 'false', tog: () => setCd({ cats: cd0.cats.indexOf(k) >= 0 ? cd0.cats.filter(x => x !== k) : cd0.cats.concat([k]) }) }));
    const certKind = row[7];
    const cd = Object.assign({}, cd0, { img: imgSrc, cat: cd0.cats.length ? L(CATS[cd0.cats[0]][0], CATS[cd0.cats[0]][1]) : '—', levelL: L(LEVEL[cd0.level][0], LEVEL[cd0.level][1]), minL: fmt(cd0.min || 0) + ' ' + t.min,
      certL: certKind === 'yes' ? L('Certificate','شهادة') : certKind === 'external' ? L('External certificate','شهادة خارجية') : L('No certificate','بلا شهادة'), ovShow: ar ? cd0.ova : cd0.ov,
      soonCls: cd0.soon ? 'on' : '', cpCls: cd0.cp ? 'on' : '', soon: cd0.soon ? 'true' : 'false', cp: cd0.cp ? 'true' : 'false' });
    cd.soonOn = cd0.soon;
    const cdOn = { level: (e) => setCd({ level:e.target.value }), min: (e) => setCd({ min:e.target.value }), ov: (e) => setCd({ ov:e.target.value }), ova: (e) => setCd({ ova:e.target.value }), soon: () => setCd({ soon:!cd0.soon }), cp: () => setCd({ cp:!cd0.cp }) };
    // ---- certificate
    const ce0 = Object.assign({ on: certKind !== 'no', name: L('Aisha Al Marzouqi','عائشة المرزوقي'), title: L('Learning & Development, DCT Abu Dhabi','التعلّم والتطوير، دائرة الثقافة والسياحة'), serial:true }, this.state.ce || {});
    const setCe = (o) => S({ ce: Object.assign({}, ce0, o), dirty:true });
    const ce = { on: ce0.on ? 'true' : 'false', onCls: ce0.on ? 'on' : '', off: !ce0.on, name: ce0.name, title: ce0.title, serial: ce0.serial };
    const ceOn = { on: () => setCe({ on:!ce0.on }), name: (e) => setCe({ name:e.target.value }), title: (e) => setCe({ title:e.target.value }), serial: () => setCe({ serial:!ce0.serial }) };
    // ---- points
    const p0 = Object.assign({ unit:'10', module:'0', course:'50', assess:'20' }, this.state.pts || {});
    const pBad = (v) => !(/^\d+$/.test(String(v)) && Number(v) <= 500);
    const ptsF = ['unit','module','course','assess'].map((k, i) => ({ id:'pt-' + k, l: t.ptsL[i], h: t.ptsH[i], v: p0[k], err: pBad(p0[k]) ? 'true' : 'false', cls: pBad(p0[k]) ? 'is-error' : '', on: (e) => S({ pts: Object.assign({}, p0, { [k]: e.target.value }), dirty:true }) }));
    const nUnits = allU.length, nMods = allM.length;
    const maxPts = nUnits * (Number(p0.unit) || 0) + nMods * (Number(p0.module) || 0) + (Number(p0.course) || 0) + (hasQuiz ? (Number(p0.assess) || 0) : 0);
    const seq = this.state.seq !== undefined ? this.state.seq : true;
    const usedBy = row[9].map(m => { const man = (m === 'employees' && (row[0] === 'C01' || row[0] === 'C03')) || m === 'znm' || (m === 'museopro' && (row[0] === 'C14' || row[0] === 'C15')); return { n: L(MS[m][0], MS[m][1]), c: MS[m][2], l: man ? t.mand : t.opt, cls: man ? 'red' : 'mut' }; });
    // ---- dialogs
    const title = ar ? row[2] : row[1];
    const dlg = this.state.dlg || null;
    const closeDlg = () => S({ dlg:null });
    const doDel = () => { const nr = Object.assign({}, removed, { [sel]: true }); const left = sibs.filter(x => x !== sel); S({ removed:nr, dlg:null, sel: left[0] || Object.keys(allB).filter(id => !nr[id])[0], dirty:true }); flash(t.removed); };
    const doPub = () => { S({ status:'published', dlg:null, dirty:false, savedNow:true }); flash(t.published); };
    const doArc = () => { S({ status:'archived', dlg:null }); flash(t.archived); };
    const DL = {
      del: { ey:t.delEy, h: t.delH.replace('%s', bk.title), p: t.delP, list:[], btn:t.delBtn, btnCls:'btn-danger', go:doDel },
      pub: { ey:t.pubEy, h: t.pubH.replace('%s', title), p: t.pubP, list: t.pubL.map(x => ({ l: x.replace('%u', fmt(nUnits)).replace('%q', fmt(QS.length)) })).filter((x, i) => i !== 1 || hasQuiz), btn:t.pubBtn, btnCls:'btn-primary', go:doPub },
      arc: { ey:t.arcEy, h: t.arcH.replace('%s', title), p: t.archiveP, list:[], btn:t.arcBtn, btnCls:'btn-danger', go:doArc }
    };
    const dl = DL[dlg] || DL.del;
    const valid = () => !(pmBad || atBad || ptsF.some(x => x.err === 'true') || vidErr);
    const saveAll = () => { if (!valid()) { flash(t.fixErr); return; } S({ dirty:false, savedNow:true }); flash(isPub ? t.saved : t.draftSaved); };
    const dirty = !!this.state.dirty;
    const stL = { published:t.stPub, draft:t.stDraft, archived:t.stArch }[status], stCls = { published:'ok', draft:'warn', archived:'mut' }[status];
    const sh = this.shell(ar, 'admin', 'catalog', null, [ { label: L('Admin','الإدارة'), href:'/admin' }, { label: L('Catalog','الكتالوج'), href:'/admin/catalog' }, { label: title } ]);
    const slug = row[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const nBlocks = Object.keys(allB).filter(id => !removed[id]).length;
    const c = { key: row[0], title, levelL: L(LEVEL[row[4]][0], LEVEL[row[4]][1]), ms: row[9].map(m => ({ n: L(MS[m][0], MS[m][1]), c: MS[m][2] })),
      sub: fmt(nMods) + ' ' + L('modules','وحدات رئيسية') + ' · ' + fmt(nUnits) + ' ' + t.unitsW + ' · ' + fmt(nBlocks) + ' ' + t.blocksW + ' · ' + fmt(row[5]) + ' ' + t.min };
    const tabsK = ['content','quiz','card','certificate','settings'];
    return Object.assign(base, {
      t, sh, c, route: '/admin/catalog/editor/' + row[0], isPub, isDraft: status === 'draft', stL, stCls,
      savedTxt: dirty ? t.unsaved : (this.state.savedNow ? t.justNow : t.lastSaved), saveLbl: t.saveCh,
      previewHref: '/' + row[9][0] + '/learn/' + slug,
      tabs: tabsK.map((k, i) => ({ l: t.tabs[i], cls: tab === k ? 'on' : '', cur: tab === k ? 'page' : 'false', pick: () => S({ tab:k, menuU:null }) })),
      tContent: tab === 'content', tQuiz: tab === 'quiz' && hasQuiz, tNoQuiz: tab === 'quiz' && !hasQuiz, tCard: tab === 'card', tCert: tab === 'certificate', tSet: tab === 'settings',
      mods, bk, fx, vidErr, vidCls: vidErr ? 'is-error' : '', vidId, img: { c01: B('1309cd48586ad6e5374578ed63abc172'), cert: B('a08dcc0e73027985e0c330d26c246a01') },
      txtLangs: [['en','English'],['ar','العربية']].map(x => ({ l:x[1], cls: txtLang === x[0] ? 'is-on' : '', pick: () => S({ txtLang:x[0] }) })),
      txtDir: txtLang === 'ar' ? 'rtl' : 'ltr', txtLang, txtVal, txtOn: (e) => setEd(sel + '.' + txtLang, e.target.value), txtCtr: fmt(txtVal.length) + ' / ' + fmt(20000),
      quotes, addQuote: () => setArr('quotes', quotesA.concat([{ text:'', author:'' }])),
      files, addFile: () => { setArr('files', filesA.concat([{ n: L('Supporting reading.pdf','قراءة داعمة.pdf'), ext:'PDF', m:'640 KB', c:'#D63539' }])); flash(L('File uploaded','تم رفع الملف')); },
      playlist, plNew, plErr, plCls: plErr ? 'is-error' : '', onPlNew: (e) => S({ plNew: e.target.value }),
      addVideo: () => { const v = plNew.trim(); if (!vidOk(v)) { S({ plTried:true }); return; } setArr('vids', vidsA.concat([[L('New video','فيديو جديد'), v.slice(-11), '—']])); S({ plNew:'', plTried:false }); },
      plan, survey, wave, playing: playing ? 'true' : 'false', playD: playing ? 'M6 4h4v16H6zM14 4h4v16h-4z' : 'M8 5v14l11-7z', togPlay: () => S({ playing: !playing }),
      quizTitle: ar ? qz0.titleAr : qz0.title, quizSum: L('Pass ' + qz0.pass + '% · ' + qz0.att + ' attempts · ' + QS.length + ' questions', 'النجاح ' + qz0.pass + '% · ' + qz0.att + ' محاولات · ' + QS.length + ' أسئلة'),
      goQuiz: () => S({ tab:'quiz' }), applyNote: isPub ? t.applyNow : t.applyDraft,
      saveBlock: () => { if (vidErr) { flash(t.fixErr); return; } S({ dirty:false, savedNow:true }); flash(t.blockSaved); },
      askDelete: () => S({ dlg:'del' }), askPublish: () => S({ dlg:'pub' }), askArchive: () => S({ dlg:'arc' }), dlgOpen: !!dlg, dl, closeDlg, saveAll,
      addModule: () => { const id = 'M' + (allM.length + 1); const uid = 'U' + (allU.length + 1); S({ addedM: addedM.concat([{ id, en:'New module', ar:'وحدة رئيسية جديدة' }]), addedU: addedU.concat([{ id:uid, m:id, en:'New unit', ar:'درس جديد' }]), dirty:true, menuU:uid }); },
      qz, qzOn, qe, qs, qq, addQ, qCountTxt: L(QS.length + ' questions', fmt(QS.length) + ' أسئلة'),
      addQuizNow: () => S({ qAdded: [{ ty:'multiple_choice', text:'', pts:1, ok:0, opts:[L('Option 1','الخيار 1'), L('Option 2','الخيار 2'), L('Option 3','الخيار 3')] }], dirty:true }),
      saveQuiz: () => { if (pmBad || atBad) { flash(t.fixErr); return; } S({ dirty:false, savedNow:true }); flash(isPub ? t.quizSaved : t.draftSaved); },
      cd, cdOn, gal, catChips, lv: { beginner: L('Beginner','مبتدئ'), intermediate: L('Intermediate','متوسط'), advanced: L('Advanced','متقدم') }, saveCard: () => { S({ dirty:false, savedNow:true }); flash(t.cardSaved); },
      ce, ceOn, saveCert: () => { S({ dirty:false, savedNow:true }); flash(t.certSaved); },
      ptsF, maxPts: fmt(maxPts), maxTxt: t.maxTxt, seq: seq ? 'true' : 'false', seqCls: seq ? 'on' : '', togSeq: () => S({ seq: !seq, dirty:true }), usedBy,
      specSegs: [ seg('Tab','tab',tabsK.map((k, i) => [k, ['Content','Quiz','Card','Certificate','Settings'][i], { dlg:null }])), seg('Status','status',[['published','Published'],['draft','Draft']]), seg('Overlay','ovl',[['none','None',{ dlg:null, menuU:null }],['menu','Add-block menu',{ tab:'content', menuU:'U2', dlg:null }],['del','Remove dialog',{ tab:'content', dlg:'del' }],['pub','Publish dialog',{ status:'draft', dlg:'pub' }]]) ]
    });
  }

}
