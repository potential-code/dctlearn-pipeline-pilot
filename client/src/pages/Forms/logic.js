// Ported verbatim from the Claude Design artboard Forms (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, areas:[true,true,false,false], sw:[true,true,false], pref:'both', level:'any', cat:'any', mand:false }; }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const EN = { sys:'Design system · Form controls', inputs:'Text inputs', inputsNote:'2 px border, 8 px radius, 44 px tall. Focus is the primary border plus a 4 px soft ring. Errors are explained under the field, never only by colour.', fullName:'Full name', phName:'e.g. Saeed Al Hammadi', default:'Default', email:'Work e-mail', focus:'Focus', staffId:'Staff ID', errMsg:'Use the 6-digit ID on your badge, e.g. DCT-104532', department:'Department', deptVal:'DCT Culture', disabled:'Disabled · read-only from HR', level:'Level', anyLevel:'Any level', beginner:'Beginner', intermediate:'Intermediate', advanced:'Advanced', select:'Select · native, custom chevron', search:'Search', searchVal:'museum', searchHint:'Search · clear button appears when there is text', goals:'Your goals for this programme', phGoals:'In 3 years, on the professional side, I want to have done…', goalsHint:'Textarea · 500 characters max', choices:'Checkbox, switch, segmented', choicesNote:'Checkbox for many-of-many, switch for an immediate on/off setting, segmented control for one-of-few. All three are keyboard-operable with the red focus ring.', areas:'Preferred mentoring areas', selected:'selected', notifications:'Notifications', swEmail:'E-mail me when a session is confirmed', swReminder:'Reminder 24 h before', swDigest:'Weekly digest', language:'Session language', both:'Both', langHint:'Segmented · one of few, instant', filterRow:'Filter row with result count', filterNote:'Search and selects in one row above the content they filter. The count updates on every change and active filters become removable chips.', searchCourses:'Search courses', phSearch:'Search by title or summary', category:'Category', anyCat:'Any category', mandatoryOnly:'Mandatory only', clearAll:'Clear all', course:'course', courses:'courses' };
    const AR = { sys:'نظام التصميم · عناصر النماذج', inputs:'حقول النص', inputsNote:'حد 2 بكسل، زوايا 8 بكسل، ارتفاع 44 بكسل. التركيز هو الحد الأساسي مع حلقة ناعمة 4 بكسل. تُشرح الأخطاء تحت الحقل، وليس باللون وحده.', fullName:'الاسم الكامل', phName:'مثال: سعيد الحمادي', default:'افتراضي', email:'البريد الإلكتروني للعمل', focus:'تركيز', staffId:'الرقم الوظيفي', errMsg:'استخدم الرقم المكوّن من 6 أرقام على بطاقتك، مثل DCT-104532', department:'الإدارة', deptVal:'قطاع الثقافة', disabled:'معطّل · للقراءة فقط من الموارد البشرية', level:'المستوى', anyLevel:'أي مستوى', beginner:'مبتدئ', intermediate:'متوسط', advanced:'متقدم', select:'قائمة منسدلة · أصلية مع سهم مخصص', search:'بحث', searchVal:'متحف', searchHint:'بحث · يظهر زر المسح عند وجود نص', goals:'أهدافك من هذا البرنامج', phGoals:'خلال 3 سنوات، على الصعيد المهني، أريد أن أكون قد…', goalsHint:'منطقة نص · 500 حرف كحد أقصى', choices:'خانة الاختيار والمفتاح والمقسّم', choicesNote:'خانة الاختيار لاختيار عدة عناصر، والمفتاح لإعداد فوري تشغيل/إيقاف، والمقسّم لاختيار واحد من قليل. الثلاثة تعمل بلوحة المفاتيح مع حلقة التركيز الحمراء.', areas:'مجالات الإرشاد المفضلة', selected:'محدد', notifications:'الإشعارات', swEmail:'أرسل لي بريداً عند تأكيد الجلسة', swReminder:'تذكير قبل 24 ساعة', swDigest:'ملخص أسبوعي', language:'لغة الجلسة', both:'كلاهما', langHint:'مقسّم · واحد من قليل، فوري', filterRow:'صف التصفية مع عدد النتائج', filterNote:'البحث والقوائم في صف واحد فوق المحتوى الذي تصفّيه. يتحدث العدد مع كل تغيير وتتحول المرشحات النشطة إلى شرائح قابلة للإزالة.', searchCourses:'ابحث في الدورات', phSearch:'ابحث بالعنوان أو الملخص', category:'الفئة', anyCat:'أي فئة', mandatoryOnly:'الإلزامية فقط', clearAll:'مسح الكل', course:'دورة', courses:'دورات' };
    const t = ar ? AR : EN;
    const areaNames = ar ? ['المتاحف والتقييم الفني','الاستراتيجية والتخطيط','تجربة الزائر والفعاليات','الأفراد والأداء'] : ['Museums and Curation','Strategy and Planning','Visitor Experience and Events','People and Performance'];
    const areas = areaNames.map((label, i) => ({ label: label, on: this.state.areas[i], toggle: () => { const a = this.state.areas.slice(); a[i] = !a[i]; this.setState({ areas: a }); } }));
    const picked = this.state.areas.filter(Boolean).length;
    const sw = this.state.sw;
    const togSw = (i) => () => { const s = sw.slice(); s[i] = !s[i]; this.setState({ sw: s }); };
    const courses = [
      { l:'beginner', c:'dct', m:true },{ l:'beginner', c:'museums', m:false },{ l:'beginner', c:'dct', m:true },{ l:'beginner', c:'heritage', m:false },
      { l:'intermediate', c:'tourism', m:false },{ l:'intermediate', c:'museums', m:false },{ l:'beginner', c:'heritage', m:false },{ l:'beginner', c:'dct', m:false },
      { l:'intermediate', c:'heritage', m:false },{ l:'advanced', c:'museums', m:false },{ l:'intermediate', c:'tourism', m:true },{ l:'advanced', c:'heritage', m:false }
    ];
    const lv = this.state.level, ct = this.state.cat, md = this.state.mand;
    const count = courses.filter((c) => (lv === 'any' || c.l === lv) && (ct === 'any' || c.c === ct) && (!md || c.m)).length;
    const lvl = { beginner:t.beginner, intermediate:t.intermediate, advanced:t.advanced };
    const cats = { dct:'All about DCT', museums:'The World of Museums', heritage:'Cultural Heritage', tourism:'Tourism Management' };
    const active = [];
    if (lv !== 'any') active.push({ label: lvl[lv], remove: () => this.setState({ level:'any' }) });
    if (ct !== 'any') active.push({ label: cats[ct], remove: () => this.setState({ cat:'any' }) });
    if (md) active.push({ label: t.mandatoryOnly, remove: () => this.setState({ mand:false }) });
    const pref = this.state.pref;
    return {
      lang: lang, dir: ar?'rtl':'ltr', t: t,
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      areas: areas, picked: picked,
      sw1: sw[0], sw2: sw[1], sw3: sw[2], tog1: togSw(0), tog2: togSw(1), tog3: togSw(2),
      pEn: pref==='en'?'is-on':'', pAr: pref==='ar'?'is-on':'', pBoth: pref==='both'?'is-on':'',
      setPEn: () => this.setState({ pref:'en' }), setPAr: () => this.setState({ pref:'ar' }), setPBoth: () => this.setState({ pref:'both' }),
      level: lv, cat: ct, mand: md,
      setLevel: (e) => this.setState({ level: e.target.value }), setCat: (e) => this.setState({ cat: e.target.value }), togMand: () => this.setState({ mand: !md }),
      count: count, countLabel: count === 1 ? t.course : t.courses,
      active: active, hasActive: active.length > 0,
      clearAll: () => this.setState({ level:'any', cat:'any', mand:false })
    };
  }
}
