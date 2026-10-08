// Ported verbatim from the Claude Design artboard P20-Match (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, screen:null, phase:null, step:0, pick:null, chosen:null, toast:false, busy:false }; }
  componentDidMount(){ const s = this.props.screen || 'results'; if (s === 'loading') this.run(); }
  componentWillUnmount(){ clearInterval(this.iv); clearTimeout(this.tt); clearTimeout(this.tb); }
  run(){
    clearInterval(this.iv); this.setState({ phase:'loading', step:0 });
    let n = 0; this.iv = setInterval(() => { n++; if (n >= 3) { clearInterval(this.iv); this.setState({ phase:'results', step:3 }); } else this.setState({ step:n }); }, 650);
  }
  /* spec-bar segment helper (mockup chrome only) */
  seg(label, cur, opts, fn){ return { label, btns: opts.map(o => ({ label:o[1], cls: o[0] === cur ? 'is-on' : '', pick: () => fn(o[0]) })) }; }

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
    const fmt = (n) => Number(n).toLocaleString('en-US');
    const base = { lang, dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '', enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }) };
    /* ---- seed: mentor categories (SEED §3) and mentors (SEED §4.2) ---- */
    const CAT = { 'Strategy and Planning':'الاستراتيجية والتخطيط', 'Culture and Heritage':'الثقافة والتراث', 'Museums and Curation':'المتاحف والتقييم الفني', 'Marketing and Communications':'التسويق والاتصال', 'People and Performance':'الأفراد والأداء', 'Finance and Revenue':'المالية والإيرادات', 'Visitor Experience and Events':'تجربة الزوار والفعاليات', 'Libraries and Publishing':'المكتبات والنشر', 'Tourism and International Operations':'السياحة والعمليات الدولية', 'Legal and Governance':'الشؤون القانونية والحوكمة', 'Sustainability':'الاستدامة', 'Business Excellence and Quality':'التميز المؤسسي والجودة', 'Youth and Community Engagement':'إشراك الشباب والمجتمع', 'Research':'البحث' };
    const catL = (c) => ar ? CAT[c] : c;
    const COURSE = {
      C06:{ t:['The World of Curation','عالم التقييم الفني'], cat:['The World of Museums','عالم المتاحف'], min:55, img:'cf69d2b8596f972f4af9fc63c0137303', slug:'the-world-of-curation' },
      C16:{ t:['Curating an Exhibition: From Concept to Production','تنظيم المعارض: من الفكرة إلى التنفيذ'], cat:['Conservation and exhibition of artefacts','صون القطع وعرضها'], min:70, img:'403bd7970d9211d5acd7b2806550e6a7', slug:'curating-an-exhibition' },
      C05:{ t:['Sustainable Tourism','السياحة المستدامة'], cat:['Tourism Management','إدارة السياحة'], min:60, img:'d01461a3f6ad3ced258aac4713f94408', slug:'sustainable-tourism' },
      C07:{ t:['Creative Tourism: What is it?','السياحة الإبداعية'], cat:['Creative and Cultural Industries','الصناعات الثقافية والإبداعية'], min:40, img:'f1cfe235742010d5ac7c29f64fa633a0', slug:'creative-tourism' },
      C08:{ t:['Data Protection for People and Performance','حماية البيانات'], cat:['Corporate Knowledge and Compliance','المعرفة المؤسسية والامتثال'], min:30, img:'f53e39067997d52c15204d509b52dd30', slug:'data-protection' },
      C01:{ t:['DCT World','عالم الدائرة'], cat:['All about DCT','كل ما يخص الدائرة'], min:45, img:'fa500a874150b2a1769785936a6d7785', slug:'dct-world' }
    };
    const MENTORS = {
      hessa:{ id:'hessa', fem:true, ini:'HN', c:'#CD3151', name:['Dr. Hessa Al Nuaimi','د. حصة النعيمي'], first:['Dr. Hessa','د. حصة'], title:['Director, Museums Strategy','مديرة استراتيجية المتاحف'],
        cats:['Museums and Curation','Strategy and Planning'], rating:'5.0', reviews:1, sessions:1,
        next:['Wed 7 Oct · 10:00 Gulf','الأربعاء 7 أكتوبر · 10:00 بتوقيت الخليج'], avail:['Sun–Thu · 10:00–13:00 Gulf','الأحد–الخميس · 10:00–13:00 بتوقيت الخليج'], days:[0,1,2,3,4], from:10, to:13,
        langs:['Arabic, English','العربية، الإنجليزية'], linkedin:'https://www.linkedin.com/in/hessa-alnuaimi-example', courses:['C06','C16'],
        bio:['Dr. Hessa leads museum strategy at DCT Abu Dhabi, guiding how the emirate’s museums plan their collections, programmes and audiences for the long term. Over fifteen years in curation she has opened exhibitions across the region, and she enjoys helping emerging leaders turn a good idea into a well-run project.',
             'تقود د. حصة استراتيجية المتاحف في دائرة الثقافة والسياحة – أبوظبي، وتوجّه طريقة تخطيط متاحف الإمارة لمقتنياتها وبرامجها وجماهيرها على المدى الطويل. وخلال خمسة عشر عاماً في التقييم الفني أشرفت على افتتاح معارض في أنحاء المنطقة، وتحرص على مساعدة القادة الناشئين في تحويل الفكرة الجيدة إلى مشروع ناجح.'] },
      rashid:{ id:'rashid', fem:false, ini:'RB', c:'#3B2F92', name:['Rashid Al Blooshi','راشد البلوشي'], first:['Rashid','راشد'], title:['Head of Visitor Experience','رئيس تجربة الزوار'],
        cats:['Visitor Experience and Events','Tourism and International Operations'], rating:'', reviews:0, sessions:0,
        next:['Wed 7 Oct · 14:00 Gulf','الأربعاء 7 أكتوبر · 14:00 بتوقيت الخليج'], avail:['Mon, Wed · 14:00–17:00 Gulf','الإثنين، الأربعاء · 14:00–17:00 بتوقيت الخليج'], days:[1,3], from:14, to:17,
        langs:['Arabic, English','العربية، الإنجليزية'], linkedin:'https://www.linkedin.com/in/rashid-alblooshi-example', courses:['C05','C07'],
        bio:['Rashid heads visitor experience across DCT Abu Dhabi’s cultural sites, from ticketing and wayfinding to the major seasonal events. He previously ran international guest operations in hospitality and mentors colleagues who want to design experiences around what visitors really need.',
             'يرأس راشد تجربة الزوار في المواقع الثقافية التابعة لدائرة الثقافة والسياحة – أبوظبي، بدءاً من التذاكر والإرشاد داخل المواقع وصولاً إلى الفعاليات الموسمية الكبرى. وقد أدار سابقاً عمليات الضيوف الدولية في قطاع الضيافة، ويرشد الزملاء الراغبين في تصميم تجارب تنطلق من احتياجات الزوار الفعلية.'] },
      mariam:{ id:'mariam', fem:true, ini:'MK', c:'#E35E3C', name:['Mariam Khoury','مريم خوري'], first:['Mariam','مريم'], title:['Senior Manager, People & Performance','مديرة أولى، الأفراد والأداء'],
        cats:['People and Performance','Marketing and Communications'], rating:'', reviews:0, sessions:0,
        next:['Thu 8 Oct · 09:00 Gulf','الخميس 8 أكتوبر · 09:00 بتوقيت الخليج'], avail:['Tue, Thu · 09:00–12:00 Gulf','الثلاثاء، الخميس · 09:00–12:00 بتوقيت الخليج'], days:[2,4], from:9, to:12,
        langs:['Arabic, English, French','العربية، الإنجليزية، الفرنسية'], linkedin:'https://www.linkedin.com/in/mariam-khoury-example', courses:['C08','C01'],
        bio:['Mariam leads the people and performance programmes at DCT Abu Dhabi, including leadership development and internal communications. She coaches managers on giving clear, useful feedback and helps first-time team leads build confident, well-organised teams.',
             'تقود مريم برامج الأفراد والأداء في دائرة الثقافة والسياحة – أبوظبي، ومنها تطوير القيادات والاتصال الداخلي. وتدرّب المديرين على تقديم ملاحظات واضحة ومفيدة، وتساعد قادة الفرق الجدد على بناء فرق واثقة ومنظّمة.'] }
    };
    const MIDS = ['hessa','rashid','mariam'];
    const scr = this.state.screen || this.props.screen || 'results';
    const phase = this.state.phase || (scr === 'loading' ? 'loading' : 'results');
    const chosen = this.state.chosen || (scr === 'matched' ? 'hessa' : null);
    const pick = this.state.pick || (scr === 'confirm' && !this.state.chosen ? 'hessa' : null);
    const t = {
      spec: L('Mentor match','مطابقة المرشد'), ey: L('Elevate 2026 · Mentor match','إرتقاء 2026 · مطابقة المرشد'), h1: L('Your mentor match','نتائج مطابقة المرشد'),
      sub: L('Suggested from your registration answers of 20 Sep 2026. Choose one — you’re allocated at once.','مقترحة بناءً على إجابات تسجيلك في 20 سبتمبر 2026. اختر مرشداً، ويتم التخصيص فوراً.'),
      editAns: L('Edit answers','تعديل الإجابات'), rerun: L('Re-run matching','إعادة المطابقة'),
      ldH: L('Matching…','جارٍ البحث عن المطابقة…'), ldP: L('Comparing your answers with 3 Elevate mentors. This takes a few seconds.','نقارن إجاباتك مع 3 مرشدين في إرتقاء، ويستغرق ذلك ثوانيَ معدودة.'),
      srcH: L('How this was ranked','كيف تم الترتيب'), srcTag: L('Source · AI','المصدر · الذكاء الاصطناعي'),
      srcP: L('An AI model compared your goals, areas and language with each mentor. If AI is off, rules give the same kind of score: area overlap 60 %, language 30 %, availability 10 %.','قارن نموذج ذكاء اصطناعي أهدافك ومجالاتك ولغتك مع كل مرشد. وعند إيقاف الذكاء الاصطناعي تُحسب النتيجة بالقواعد: تطابق المجالات 60%، واللغة 30%، والتوفر 10%.'),
      yourAns: L('Your answers','إجاباتك'), sugEy: L('2 suggestions','اقتراحان'), sugH: L('Suggested mentors','المرشدون المقترحون'), sugNote: L('Ranked by match score','مرتبون حسب نسبة التطابق'),
      best: L('Best match','الأنسب'), yours: L('Your mentor','مرشدك الحالي'), why: L('Why this match','سبب المطابقة'), match: L('match','تطابق'),
      profile: L('View profile','عرض الملف'), bookShort: L('Book a session','احجز جلسة'),
      foot: L('Mariam Khoury wasn’t suggested because none of your preferred areas overlap with hers. You can still view every mentor in the directory.','لم تُقترح مريم خوري لعدم تطابق مجالاتك المفضلة مع مجالاتها، ويمكنك الاطلاع على جميع المرشدين في الدليل.'),
       bookFirst: L('Book first session','احجز الجلسة الأولى'),
      dlgEy: L('Confirm your choice','تأكيد الاختيار'), dl1: L('You’re allocated at once — no approval step.','يتم التخصيص فوراً دون خطوة موافقة.'), dl3: L('You can book 60-minute sessions straight after.','يمكنك حجز جلسات مدتها 60 دقيقة مباشرة بعد ذلك.'),
      cancel: L('Cancel','إلغاء'), confirm: L('Confirm and allocate','تأكيد وتخصيص'), close: L('Close','إغلاق')
    };
    const sh = this.shell(ar, 'learner', 'mentoring', 'elevate', [ { label: L('Elevate 2026','إرتقاء 2026'), href:'/elevate/dashboard' }, { label: L('Mentoring','الإرشاد'), href:'/elevate/mentoring' }, { label: L('Mentor match','مطابقة المرشد') } ]);
    const SUG = [ { id:'hessa', score:0.87, r:[['Museums and Curation overlap','تطابق في مجال المتاحف والتقييم الفني'],['Arabic + English','العربية + الإنجليزية']] },
                  { id:'rashid', score:0.71, r:[['Visitor Experience and Events overlap','تطابق في مجال تجربة الزوار والفعاليات'],['Arabic + English','العربية + الإنجليزية']] } ];
    const C = 2 * Math.PI * 52;
    const sugs = SUG.map((x, i) => { const M = MENTORS[x.id]; const pct = Math.round(x.score * 100); const mine = chosen === x.id; return {
      hid:'s-'+x.id, rk:'0' + (i + 1), rkSr: L('Rank ' + (i + 1) + ': ','الترتيب ' + (i + 1) + ': '), cls: i === 0 ? 'top' : '', qcls: i === 0 ? 'q' : '', best: i === 0, mine, ini:M.ini, c:M.c,
      name:L(M.name[0], M.name[1]), title:L(M.title[0], M.title[1]), cats: M.cats.map(catL).join(' · '), reasons: x.r.map(r => L(r[0], r[1])),
      pct: pct + '%', dash: (C * x.score).toFixed(1), scoreAria: L(pct + ' percent match', 'تطابق بنسبة ' + pct + '%'),
      canChoose: !mine, btnCls: i === 0 && !chosen ? 'btn-primary' : 'btn-line', chooseLbl: chosen ? L('Switch to ' + M.first[0], 'التبديل إلى ' + M.first[1]) : L('Choose ' + M.first[0], 'اختر ' + M.first[1]),
      choose: () => this.setState({ pick:x.id }), href:'/elevate/mentoring/mentor/' + x.id }; });
    const inputs = [L('Goal: lead a small exhibition project by Q2 2027','الهدف: قيادة مشروع معرض صغير بحلول الربع الثاني 2027'), L('1–3 years at DCT','1–3 سنوات في الدائرة'), catL('Museums and Curation'), catL('Strategy and Planning'), catL('Visitor Experience and Events'), L('Arabic and English','العربية والإنجليزية')];
    const step = this.state.step;
    const ldSteps = [L('Reading your registration answers','قراءة إجابات التسجيل'), L('Comparing areas, language and availability','مقارنة المجالات واللغة والتوفر'), L('Ranking mentors and writing reasons','ترتيب المرشدين وكتابة الأسباب')]
      .map((l, i) => ({ l, ok: i < step, on: i === step, wait: i > step, cls: i < step ? 'ok' : (i === step ? 'on' : '') }));
    const PM = pick ? MENTORS[pick] : MENTORS.hessa;
    const PS = SUG.filter(x => x.id === (pick || 'hessa'))[0];
    const confirm = () => {
      this.setState({ busy:true });
      clearTimeout(this.tb); this.tb = setTimeout(() => { this.setState({ busy:false, chosen: pick, pick:null, toast:true, screen:'matched', phase:'results' }); clearTimeout(this.tt); this.tt = setTimeout(() => this.setState({ toast:false }), 2800); }, 800);
    };
    const go = (v) => { clearInterval(this.iv); clearTimeout(this.tb); this.setState({ screen:v, chosen:null, pick:null, toast:false, busy:false }); if (v === 'loading') this.run(); else this.setState({ phase:'results' }); };
    const CM = MENTORS[chosen || 'hessa'];
    return { ...base, t, sh, sugs, inputs, ldSteps,
      specName: t.spec, route: '/elevate/mentoring/match',
      loading: phase === 'loading', ready: phase !== 'loading', isMatched: !!chosen,
      matchedP: CM.fem ? L('Allocated at once — she’s been notified by e-mail. Book your first 60-minute session from her calendar.','تم التخصيص فوراً وأُبلغت بالبريد الإلكتروني. احجز جلستك الأولى (60 دقيقة) من تقويمها.') : L('Allocated at once — he’s been notified by e-mail. Book your first 60-minute session from his calendar.','تم التخصيص فوراً وأُبلغ بالبريد الإلكتروني. احجز جلستك الأولى (60 دقيقة) من تقويمه.'),
      matchedH: L('You’re matched with ' + CM.name[0], 'تمت مطابقتك مع ' + CM.name[1]),
      rerun: () => { this.setState({ chosen: chosen, screen: chosen ? 'matched' : 'results' }); this.run(); },
      dlg: !!pick && phase !== 'loading', d: { ini:PM.ini, c:PM.c, name:L(PM.name[0], PM.name[1]), title:L(PM.title[0], PM.title[1]), pct: Math.round(PS.score * 100) + '%' },
      dlgH: L('Choose ' + PM.name[0] + ' as your mentor?', 'هل تختار ' + PM.name[1] + ' مرشداً لك؟'),
      dl2: L(PM.first[0] + ' is notified by e-mail and sees your goals — never your e-mail or phone.', (PM.fem ? 'تُبلَّغ ' : 'يُبلَّغ ') + PM.first[1] + ' بالبريد الإلكتروني ' + (PM.fem ? 'وتطّلع' : 'ويطّلع') + ' على أهدافك فقط، دون بريدك أو هاتفك.'),
      closeDlg: () => this.setState({ pick:null, screen: scr === 'confirm' ? 'results' : scr }), stop: (e) => e.stopPropagation(), confirm, busyCls: this.state.busy ? 'is-loading' : '',
      toast: this.state.toast, toastMsg: L('Matched with ' + CM.name[0], 'تمت المطابقة مع ' + CM.name[1]),
      segs: [ this.seg('State', scr, [['loading','Matching…'],['results','Results'],['confirm','Confirm dialog'],['matched','Matched']], go) ]
    };
  }
}
