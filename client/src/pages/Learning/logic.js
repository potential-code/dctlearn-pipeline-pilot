// Ported verbatim from the Claude Design artboard Learning (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, unit:2, audio:false, vid:0 }; }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const EN = { sys:'Design system · Learning', eyebrow:'Unit layout', title:'Outline · content · summary', note:'Three columns on desktop, stacked on mobile. Every block type from SPEC M4 is drawn below in the order a unit would show them. The video and SCORM frames are placeholders for the real embeds.', unitsDone:'units done', pts:'pts', module:'Module', unit:'Unit', vTitle:'Who we are', summary:'Summary', textBody:'The Department of Culture and Tourism – Abu Dhabi drives the sustainable growth of the emirate’s culture and tourism sectors. Its work spans museums, heritage sites, libraries, events and the visitor economy — and every colleague, whatever their role, is part of the visitor journey.', ourSectors:'Our sectors', scormTitle:'Abu Dhabi’s cultural sites', notAttempted:'Not attempted', scormBody:'Interactive module · opens in this window', scormHint:'Progress and score are reported back when you close it.', launch:'Launch module', plTitle:'Site visits', videos:'videos', watched:'Watched', quotesTitle:'Voices from DCT', q1:'Every visitor leaves with a story. Our job is to make sure it is a good one.', q1by:'Visitor Experience team, Louvre Abu Dhabi', q2:'Heritage is not what we keep in storage. It is what we hand on.', q2by:'Al Ain Oasis guide', caseTitle:'Case study', caseScenario:'Scenario', caseBody:'A family arrives at Qasr Al Hosn thirty minutes before closing. The ticketing host hesitates — the last tour has started.', caseQ:'Your call', caseQBody:'Which option protects both the visitor experience and the site’s operating rules? Write your answer in the action plan at the end of this unit.', resTitle:'Resources', res1:'Sector map', res2:'Action plan template', res3:'ICOM museum definition', pages:'pages', newTab:'new tab', prevUnit:'Previous unit', markDone:'Mark unit complete', courseProgress:'Course progress', thisUnit:'This unit', blocks:'blocks', estTime:'Estimated time', min:'min', pointsOnDone:'Points on completion', nextUp:'Next', quizBlocking:'Blocking quiz', certTitle:'Certificate on completion', certBody:'Finish all four units and pass the final check (70 %) to receive your DCT World certificate.', askCoach:'Ask the AI coach' };
    const AR = { sys:'نظام التصميم · التعلم', eyebrow:'تخطيط الوحدة', title:'المخطط · المحتوى · الملخص', note:'ثلاثة أعمدة على سطح المكتب، ومكدّسة على الهاتف. كل أنواع الكتل من المواصفة M4 مرسومة أدناه بالترتيب الذي تعرضه الوحدة. إطارا الفيديو وSCORM بديلان عن التضمينات الحقيقية.', unitsDone:'وحدات مكتملة', pts:'نقطة', module:'الوحدة التعليمية', unit:'الدرس', vTitle:'من نحن', summary:'الملخص', textBody:'تقود دائرة الثقافة والسياحة – أبوظبي النمو المستدام لقطاعي الثقافة والسياحة في الإمارة. يمتد عملها عبر المتاحف ومواقع التراث والمكتبات والفعاليات واقتصاد الزوار — وكل زميل، أياً كان دوره، جزء من رحلة الزائر.', ourSectors:'قطاعاتنا', scormTitle:'المواقع الثقافية في أبوظبي', notAttempted:'لم تُجرَّب', scormBody:'وحدة تفاعلية · تُفتح في هذه النافذة', scormHint:'يُبلَّغ عن التقدم والدرجة عند إغلاقها.', launch:'تشغيل الوحدة', plTitle:'زيارات ميدانية', videos:'مقاطع', watched:'تمت المشاهدة', quotesTitle:'أصوات من الدائرة', q1:'يغادر كل زائر بقصة. مهمتنا أن نضمن أنها قصة جيدة.', q1by:'فريق تجربة الزائر، اللوفر أبوظبي', q2:'التراث ليس ما نحتفظ به في المخازن، بل ما نورّثه.', q2by:'مرشد واحة العين', caseTitle:'دراسة حالة', caseScenario:'الموقف', caseBody:'تصل عائلة إلى قصر الحصن قبل الإغلاق بثلاثين دقيقة. يتردد مضيف التذاكر — فقد بدأت الجولة الأخيرة.', caseQ:'قرارك', caseQBody:'أي خيار يحمي تجربة الزائر وقواعد تشغيل الموقع معاً؟ اكتب إجابتك في خطة العمل في نهاية هذا الدرس.', resTitle:'الموارد', res1:'خريطة القطاعات', res2:'قالب خطة العمل', res3:'تعريف المتحف — ICOM', pages:'صفحات', newTab:'نافذة جديدة', prevUnit:'الدرس السابق', markDone:'إكمال الدرس', courseProgress:'تقدم الدورة', thisUnit:'هذا الدرس', blocks:'كتل', estTime:'الوقت المقدر', min:'دقيقة', pointsOnDone:'نقاط عند الإكمال', nextUp:'التالي', quizBlocking:'اختبار إلزامي', certTitle:'شهادة عند الإكمال', certBody:'أكمل الدروس الأربعة واجتز الاختبار النهائي (70٪) للحصول على شهادة عالم الدائرة.', askCoach:'اسأل المدرب الذكي' };
    const t = ar ? AR : EN;
    const units = ar ? [ { m:'الوحدة 1 · مرحباً بك في الدائرة' }, { u:'من نحن', len:'12 د', st:'done' }, { u:'قطاعاتنا', len:'18 د', st:'done' }, { m:'الوحدة 2 · الثقافة والسياحة' }, { u:'المواقع الثقافية في أبوظبي', len:'15 د', st:'cur' }, { u:'دورك في رحلة الزائر', len:'20 د', st:'todo' }, { u:'الاختبار النهائي', len:'5 أسئلة', st:'lock' } ] : [ { m:'Module 1 · Welcome to DCT' }, { u:'Who we are', len:'12 min', st:'done' }, { u:'Our sectors', len:'18 min', st:'done' }, { m:'Module 2 · Culture & Tourism' }, { u:'Abu Dhabi’s cultural sites', len:'15 min', st:'cur' }, { u:'Your role in the visitor journey', len:'20 min', st:'todo' }, { u:'DCT World final check', len:'5 Q', st:'lock' } ];
    let n = 0;
    const outline = units.map((x) => {
      if (x.m) return { mod:true, unit:false, label:x.m, cls:'', st:'', ico:'', len:'', pick:()=>{} };
      n += 1; const k = n; const on = k === this.state.unit;
      const ico = x.st === 'done' ? '✓' : x.st === 'lock' ? '' : String(k);
      return { mod:false, unit:true, label:x.u, len:x.len, st:x.st, ico:ico, cls: on ? 'is-on' : '', pick: () => this.setState({ unit:k }) };
    });
    const titles = units.filter((x) => x.u).map((x) => x.u);
    const vids = ar ? ['اللوفر أبوظبي','قصر الحصن','واحة العين'] : ['Louvre Abu Dhabi','Qasr Al Hosn','Al Ain Oasis'];
    const imgs = ['/_blob/92c83a667e1befe5661dab8c7ebca349','/_blob/d99ea09adede7395461223b429f24cf4','/_blob/592272d2d94f43d123cbcdda07b02178'];
    const playlist = vids.map((v, i) => ({ title:v, len: ['3:48','5:10','2:55'][i], img: imgs[i], done: i < 1, cls: i === this.state.vid ? 'is-on' : '', pick: () => this.setState({ vid:i }) }));
    return {
      lang: lang, dir: ar?'rtl':'ltr', t: t,
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      outline: outline, unitNo: this.state.unit, unitTitle: titles[this.state.unit - 1],
      audioOn: this.state.audio, audioOff: !this.state.audio, waveCls: this.state.audio ? 'on' : '', audioTime: this.state.audio ? '2:14' : '0:00', audioLabel: this.state.audio ? 'Pause' : 'Play',
      togAudio: () => this.setState({ audio: !this.state.audio }),
      playlist: playlist
    };
  }
}
