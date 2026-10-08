// Ported verbatim from the Claude Design artboard P25-AITool (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, screen:null, phase:null, out:true, busy:false, topic:'Caring for textiles in a museum', toast:'' }; }
  componentDidMount(){ if ((this.props.screen || 'loaded') === 'loading') this.load(); }
  componentWillUnmount(){ clearTimeout(this.tl); clearTimeout(this.tg); clearTimeout(this.tt); }
  load(){ clearTimeout(this.tl); this.setState({ phase:'loading' }); this.tl = setTimeout(() => this.setState({ phase:'loaded' }), 1400); }
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
    /* ---- seed: AI embeds (SEED §9) ---- */
    const AI = {
      'culture-bot':{ key:'culture-bot', ini:'CB', name:['Abu Dhabi Culture Bot','روبوت ثقافة أبوظبي'], kind:'chat', provider:'bot_culture_demo', c:'#A39089', sites:['employees'], login:true,
        desc:['Ask about Abu Dhabi’s cultural sites, heritage and what’s on this month.','اسأل عن المواقع الثقافية في أبوظبي وتراثها وفعاليات هذا الشهر.'],
        asks:[['Plan a culture day in Al Ain','خطّط ليوم ثقافي في العين'],['What is Al Sadu weaving?','ما هو نسيج السدو؟'],['Ideas for visiting Qasr Al Hosn with family','أفكار لزيارة قصر الحصن مع العائلة']] },
      'career-coach':{ key:'career-coach', ini:'CC', name:['Career Coach','مدرّب المسار المهني'], kind:'chat', provider:'bot_career_demo', c:'#CE3F3F', sites:['employees','elevate'], login:true,
        desc:['Plan your next role at DCT and the skills and courses to get there.','خطّط لدورك القادم في الدائرة والمهارات والدورات التي توصلك إليه.'],
        asks:[['Which courses fit a project lead role?','ما الدورات المناسبة لدور قائد مشروع؟'],['Help me prepare for my mentoring session','ساعدني في التحضير لجلسة الإرشاد'],['Draft my 6-month development plan','اكتب خطة تطويري لستة أشهر']] },
      'lesson-planner':{ key:'lesson-planner', ini:'LP', name:['AI Lesson Planner','مخطِّط الدروس الذكي'], kind:'iframe', provider:'tool_lesson_demo', c:'#EE3E43', sites:['employees'], login:true,
        desc:['Turn a topic into a timed lesson plan with objectives, activities and a check for understanding.','حوّل أي موضوع إلى خطة درس موقّتة بأهداف وأنشطة وتقييم للفهم.'], asks:[] },
      'voice-hiring':{ key:'voice-hiring', ini:'VH', name:['Al Ain Museum Voice Hiring Agent','وكيل التوظيف الصوتي لمتحف العين'], kind:'voice', provider:'assistant_hiring_demo', c:'#EE3E43', sites:[], login:false,
        desc:['A public pre-screening form and short voice interview for Al Ain Museum roles.','نموذج فرز مبدئي عام ومقابلة صوتية قصيرة لوظائف متحف العين.'], asks:[] }
    };
    const SITE_NAME = { employees:['DCT Employees','موظفو الدائرة'], elevate:['Elevate 2026','إرتقاء 2026'] };
    const key = this.props.tool || 'lesson-planner';
    const A = AI[key] || AI['lesson-planner'];
    const scr = this.state.screen || this.props.screen || 'loaded';
    const phase = this.state.phase || scr;
    const t = {
      spec: L('AI tool (embedded)','أداة ذكية (مضمّنة)'), ey: L('DCT Employees · AI tool','موظفو الدائرة · أداة ذكية'), all: L('All AI tools','كل الأدوات'), full: L('Open full-page planner','افتح المخطِّط بصفحة كاملة'),
      frameTitle: L('Embedded tool','الأداة المضمّنة'), frameAria: L('Embedded tool from Potential.com','أداة مضمّنة من Potential.com'), embedTag: L('Embedded provider','مزوّد مضمّن'),
      connecting: L('Connecting to Potential.com…','جارٍ الاتصال بـ Potential.com…'),
      unaH: L('This tool isn’t available right now','هذه الأداة غير متاحة حالياً'), unaP: L('The AI provider isn’t switched on for DCT Employees. Try again later or tell the DCT Learn team.','لم يُفعَّل مزوّد الذكاء الاصطناعي لموظفي الدائرة. حاول لاحقاً أو أبلغ فريق DCT Learn.'), retry: L('Try again','إعادة المحاولة'),
      below: L('The tool inside the frame is provided by Potential.com and appears in English. The full-page planner works in English and Arabic.','الأداة داخل الإطار مقدّمة من Potential.com وتظهر بالإنجليزية، بينما يعمل المخطِّط بصفحة كاملة بالعربية والإنجليزية.'),
      about: L('About this tool','عن هذه الأداة'), kind: L('Type','النوع'), kindV: L('Embedded page (iframe)','صفحة مضمّنة (iframe)'), provider: L('Provider ID','معرّف المزوّد'),
      signin: L('Sign-in','تسجيل الدخول'), signinV: L('Required · signed token','مطلوب · رمز موقّع'), avail: L('Available in','متاحة في'), availV: L('DCT Employees','موظفو الدائرة'),
      priv: L('DCT Learn passes a short-lived token with your user ID and language only. Your e-mail and phone are never shared with the provider.','يمرّر DCT Learn رمزاً قصير الصلاحية يتضمن معرّف المستخدم واللغة فقط، ولا يُشارك بريدك الإلكتروني أو هاتفك مع المزوّد أبداً.'),
      report: L('Report a problem with this tool','الإبلاغ عن مشكلة في هذه الأداة')
    };
    const sh = this.shell(ar, 'learner', 'hub_ai_tools', 'employees', [ { label: L('DCT Employees','موظفو الدائرة'), href:'/employees/dashboard' }, { label: L('AI tools','الأدوات الذكية'), href:'/employees/ai' }, { label: L(A.name[0], A.name[1]) } ]);
    const generate = (e) => { if (e && e.preventDefault) e.preventDefault(); this.setState({ busy:true }); clearTimeout(this.tg); this.tg = setTimeout(() => this.setState({ busy:false }), 1100); };
    const go = (v) => { clearTimeout(this.tl); this.setState({ screen:v, phase:v }); if (v === 'loading') this.load(); };
    return { ...base, t, sh,
      specName: t.spec + ' · ' + A.key, route: '/employees/ai/tool/' + A.key,
      urlTxt: 'potential.com/embed/' + A.provider,
      a: { name: L(A.name[0], A.name[1]), desc: L(A.desc[0], A.desc[1]), provider: A.provider },
      isLoading: phase === 'loading', isUna: phase === 'unavailable', isLoaded: phase === 'loaded', busyA: phase === 'loading' ? 'true' : 'false',
      retry: () => this.load(), topic: this.state.topic, onTopic: (e) => this.setState({ topic: e.target.value }), generate,
      genBusy: this.state.busy, showOut: !this.state.busy, goLbl: this.state.busy ? 'Generating…' : 'Generate outline',
      report: () => { this.setState({ toast: L('Thanks — the DCT Learn team will look into it','شكراً، سيتابع فريق DCT Learn الأمر') }); clearTimeout(this.tt); this.tt = setTimeout(() => this.setState({ toast:'' }), 2400); },
      hasToast: !!this.state.toast, toast: this.state.toast,
      segs: [ this.seg('State', scr, [['loaded','Loaded'],['loading','Loading'],['unavailable','Unavailable']], go) ]
    };
  }
}
