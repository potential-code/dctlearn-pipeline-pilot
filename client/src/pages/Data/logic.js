// Ported verbatim from the Claude Design artboard Data (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, sort:'name', dir:1, sel:{}, page:1 }; }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const EN = { sys:'Design system · Data', table:'Data table', tableNote:'Sortable headers, row selection with a bulk action bar, inline progress, status chips and a row menu. Wide tables scroll inside the card; on a phone they become cards.', members:'Members', selected:'selected', sendReminder:'Send reminder', invite:'Invite members', name:'Name', microsite:'Microsite', progress:'Progress', points:'Points', status:'Status', showing:'Showing', of:'of', chipsProgress:'Chips, progress, rings', chipsNote:'Every status chip pairs a colour with a dot and a word — never colour alone. Progress uses primary while running and success once complete.', statusChips:'Status chips', learning:'Learning', notStarted:'Not started', inProgress:'In progress', completedS:'Completed', comingSoon:'Coming soon', mandatory:'Mandatory', people:'People', active:'Active', invited:'Invited', disabled:'Disabled', pendingReview:'Pending review', events:'Events', live:'Live', upcoming:'Upcoming', past:'Past', cancelled:'Cancelled', roles:'Roles', learner:'Learner', mentor:'Mentor', judge:'Judge', subadmin:'Sub admin', admin:'Admin', counts:'Meta', beginner:'Beginner', min:'min', units:'units', progressBars:'Progress bars', stepped:'Units · stepped', rings:'Progress rings', course:'course', done:'done', ringNote:'96 / 72 / 48 px. Stroke draws in over 1.2 s; aria-label carries the value.' };
    const AR = { sys:'نظام التصميم · البيانات', table:'جدول البيانات', tableNote:'عناوين قابلة للفرز، تحديد الصفوف مع شريط إجراءات جماعية، تقدم مضمّن، شرائح الحالة وقائمة لكل صف. تتمرر الجداول العريضة داخل البطاقة؛ وعلى الهاتف تتحول إلى بطاقات.', members:'الأعضاء', selected:'محدد', sendReminder:'إرسال تذكير', invite:'دعوة أعضاء', name:'الاسم', microsite:'الموقع الفرعي', progress:'التقدم', points:'النقاط', status:'الحالة', showing:'عرض', of:'من', chipsProgress:'الشرائح والتقدم والحلقات', chipsNote:'كل شريحة حالة تجمع لوناً مع نقطة وكلمة — لا اللون وحده أبداً. يستخدم التقدم اللون الأساسي أثناء التنفيذ والأخضر عند الإكمال.', statusChips:'شرائح الحالة', learning:'التعلم', notStarted:'لم تبدأ', inProgress:'قيد التقدم', completedS:'مكتملة', comingSoon:'قريباً', mandatory:'إلزامية', people:'الأشخاص', active:'نشط', invited:'مدعو', disabled:'معطّل', pendingReview:'قيد المراجعة', events:'الفعاليات', live:'مباشر', upcoming:'قادمة', past:'سابقة', cancelled:'ملغاة', roles:'الأدوار', learner:'متعلم', mentor:'مرشد', judge:'محكّم', subadmin:'مشرف فرعي', admin:'مدير', counts:'بيانات وصفية', beginner:'مبتدئ', min:'دقيقة', units:'وحدات', progressBars:'أشرطة التقدم', stepped:'الوحدات · متدرج', rings:'حلقات التقدم', course:'الدورة', done:'مكتمل', ringNote:'96 / 72 / 48 بكسل. يُرسم الخط خلال 1.2 ثانية؛ وتحمل aria-label القيمة.' };
    const t = ar ? AR : EN;
    const data = [
      { id:1, name:'Saeed Al Hammadi', email:'saeed.h@dctlearn.example', micro: ar?'موظفو الدائرة':'DCT Employees', pct:87, pts:280, st:'active' },
      { id:2, name:'Mona Al Ameri', email:'mona.a@dctlearn.example', micro: ar?'موظفو الدائرة':'DCT Employees', pct:12, pts:40, st:'active' },
      { id:3, name:'Yousef Al Zaabi', email:'yousef.z@dctlearn.example', micro: ar?'متحف زايد الوطني':'Zayed National Museum', pct:80, pts:310, st:'active' },
      { id:4, name:'Reem Al Shamsi', email:'reem.s@dctlearn.example', micro: ar?'متحف زايد الوطني':'Zayed National Museum', pct:100, pts:200, st:'active' },
      { id:5, name:'Hamad Al Mazrouei', email:'hamad.m@dctlearn.example', micro: ar?'نبراس':'Nibras', pct:50, pts:150, st:'active' },
      { id:6, name:'New member', email:'new.member@dctlearn.example', micro: ar?'برنامج إرتقاء':'Elevate 2026', pct:0, pts:0, st:'invited' },
      { id:7, name:'Former staff', email:'former.staff@dctlearn.example', micro: ar?'موظفو الدائرة':'DCT Employees', pct:35, pts:60, st:'disabled' },
      { id:8, name:'Élise Martin', email:'elise.m@example.com', micro:'MuseoPro', pct:65, pts:140, st:'active' }
    ];
    const s = this.state.sort, d = this.state.dir;
    const sorted = data.slice().sort((a,b) => { const va = s==='name' ? a.name : s==='prog' ? a.pct : a.pts; const vb = s==='name' ? b.name : s==='prog' ? b.pct : b.pts; return (va > vb ? 1 : va < vb ? -1 : 0) * d; });
    const sel = this.state.sel;
    const stMap = { active:['chip-success', t.active], invited:['chip-warn', t.invited], disabled:['chip-muted', t.disabled] };
    const pal = [['#FFF5F5','#D63539'],['#EEEBF8','#3B2F92'],['#EAF7EA','#15801A'],['#E3DCD3','#333333']];
    const rows = sorted.map((r) => { const p = pal[r.id % 4]; const on = !!sel[r.id]; return { ...r, ini: r.name.split(' ').map((w)=>w[0]).slice(0,2).join('').toUpperCase(), avBg:p[0], avFg:p[1], sel:on, cls: on ? 'is-sel' : '', barCls: r.pct === 100 ? 'ok' : '', stCls: stMap[r.st][0], st: stMap[r.st][1], tog: () => { const n = { ...sel }; if (on) delete n[r.id]; else n[r.id] = true; this.setState({ sel:n }); } }; });
    const selCount = Object.keys(sel).length;
    const sortBy = (k) => () => this.setState({ sort:k, dir: s === k ? -d : 1 });
    const cls = (k) => (s === k ? 'is-sorted' : '') + (s === k && d === -1 ? ' desc' : '');
    const page = this.state.page, total = 6;
    const list = [1,2,3,'gap',total].filter((v,i,a) => a.indexOf(v) === i);
    const pages = list.map((v) => v === 'gap' ? { gap:true, num:false, n:'', cls:'', cur:'false', go:()=>{} } : { gap:false, num:true, n:v, cls: v === page ? 'is-on' : '', cur: v === page ? 'page' : 'false', go: () => this.setState({ page:v }) });
    return {
      lang: lang, dir: ar?'rtl':'ltr', t: t,
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      rows: rows, anySel: selCount > 0, selCount: selCount, allSel: selCount === data.length,
      togAll: () => { if (selCount === data.length) this.setState({ sel:{} }); else { const n = {}; data.forEach((r) => n[r.id] = true); this.setState({ sel:n }); } },
      sName: cls('name'), sProg: cls('prog'), sPts: cls('pts'), sortName: sortBy('name'), sortProg: sortBy('prog'), sortPts: sortBy('pts'),
      pages: pages, pageFrom: (page-1)*8+1, pageTo: Math.min(page*8, 42), noPrev: page === 1, noNext: page === total,
      prev: () => this.setState({ page: Math.max(1, page-1) }), next: () => this.setState({ page: Math.min(total, page+1) })
    };
  }
}
