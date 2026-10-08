// Ported verbatim from the Claude Design artboard P56-Forms (DCLogic class).
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

    const MS = { employees:['DCT Employees','موظفو الدائرة','#EE3E43'], elevate:['Elevate 2026','إرتقاء 2026','#CD3151'], znm:['Zayed National Museum','متحف زايد الوطني','#3B2F92'], nibras:['Nibras — AI Champions','نبراس','#2FC4DB'], ruwaad:['Ruwaad — landing','رواد — صفحة الهبوط','#F77860'] };
    const t = ar ? {
      spec:'النماذج', ey:'التعلّم · النماذج', h1:'النماذج والاستطلاعات', sub:'نماذج التسجيل والاستطلاعات وطلبات الالتحاق ونماذج إبداء الاهتمام لكل موقع مصغّر، مع إجاباتها وتصديرها.', create:'نموذج جديد', allForms:'كل النماذج', export:'تصدير CSV', save:'حفظ النموذج', tabsLbl:'أقسام النموذج', builder:'الحقول', entriesT:'الإجابات',
      kp:['النماذج','نشطة','الإجابات','هذا الأسبوع'], kn:['في كل المواقع','تقبل الإجابات','منذ الإطلاق','منذ الأحد'], kindLbl:'نوع النموذج', all:'الكل', of:'من', formsW:'نماذج',
      kinds:{ registration:'تسجيل', survey:'استطلاع', application:'طلب التحاق', interest:'إبداء اهتمام' }, sts:{ active:'نشط', draft:'مسودة', closed:'مغلق' },
      thForm:'النموذج', thKind:'النوع', thMs:'المواقع المصغّرة', thFields:'الحقول', thEntries:'الإجابات', thStatus:'الحالة', thAct:'إجراءات', edit:'تحرير', entries:'الإجابات', last:'آخرها', none:'لا إجابات',
      fields:'الحقول', addField:'إضافة حقل', required:'إلزامي', fieldSet:'إعدادات الحقل', up:'نقل لأعلى', down:'نقل لأسفل', labelEn:'التسمية (بالإنجليزية)', labelAr:'التسمية (بالعربية)', key:'المفتاح', type:'النوع', reqH:'لا يمكن الإرسال دونه', options:'الخيارات', addOpt:'إضافة خيار', rmField:'حذف الحقل', req:'مطلوب', keyErr:'أحرف إنجليزية وأرقام فقط، تبدأ بحرف',
      settings:'إعدادات النموذج', status:'الحالة', searchE:'ابحث بالاسم أو البريد', thWho:'المرسل', thAt:'تاريخ الإرسال', view:'عرض', noE:'لا توجد إجابات بعد', noEB:'ستظهر الإجابات هنا فور إرسالها.',
      types:{ text:'نص قصير', long:'نص طويل', select:'قائمة منسدلة', multi:'اختيار متعدد', radio:'اختيار واحد', email:'بريد إلكتروني', phone:'هاتف', number:'رقم', date:'تاريخ' },
      saved:'تم حفظ النموذج', exported:'تم تصدير %n إجابة — سُجّل التصدير في سجل التدقيق', added:'تمت إضافة حقل', removed:'تم حذف الحقل', fix:'صحّح الحقل المظلّل أولاً', newT:'نموذج جديد', newAr:'نموذج جديد', option:'الخيار', remove:'حذف',
      where:{ registration:'يظهر عند التسجيل في برنامج الإرشاد.', survey:'يظهر في لوحة التحكم للمتعلّمين.', application:'يظهر في صفحة البرنامج.', interest:'يظهر في صفحة الهبوط العامة (دون تسجيل دخول).' }
    } : {
      spec:'Forms', ey:'Learning · Forms', h1:'Forms & surveys', sub:'Registration forms, surveys, applications and register-interest forms for every microsite — with their entries and CSV export.', create:'New form', allForms:'All forms', export:'Export CSV', save:'Save form', tabsLbl:'Form sections', builder:'Fields', entriesT:'Entries',
      kp:['Forms','Active','Entries','This week'], kn:['across microsites','accepting entries','since launch','since Sunday'], kindLbl:'Form kind', all:'All', of:'of', formsW:'forms',
      kinds:{ registration:'Registration', survey:'Survey', application:'Application', interest:'Register interest' }, sts:{ active:'Active', draft:'Draft', closed:'Closed' },
      thForm:'Form', thKind:'Kind', thMs:'Microsites', thFields:'Fields', thEntries:'Entries', thStatus:'Status', thAct:'Actions', edit:'Edit', entries:'Entries', last:'latest', none:'no entries',
      fields:'Fields', addField:'Add field', required:'Required', fieldSet:'Field settings', up:'Move up', down:'Move down', labelEn:'Label (English)', labelAr:'Label (Arabic)', key:'Key', type:'Type', reqH:'The form can’t be sent without it', options:'Options', addOpt:'Add option', rmField:'Remove field', req:'Required', keyErr:'Letters and numbers only, starting with a letter',
      settings:'Form settings', status:'Status', searchE:'Search by name or e-mail', thWho:'Submitted by', thAt:'Submitted', view:'View', noE:'No entries yet', noEB:'Entries appear here as soon as they are submitted.',
      types:{ text:'Short text', long:'Long text', select:'Dropdown', multi:'Multi-select', radio:'Single choice', email:'E-mail', phone:'Phone', number:'Number', date:'Date' },
      saved:'Form saved', exported:'%n entries exported — the export is recorded in the audit log', added:'Field added', removed:'Field removed', fix:'Fix the highlighted field first', newT:'New form', newAr:'نموذج جديد', option:'Option', remove:'Remove',
      where:{ registration:'Shown when learners register for mentoring.', survey:'Shown on the learner dashboard.', application:'Shown on the programme page.', interest:'Shown on the public landing page (no sign-in).' }
    };
    const TY = { text:['#3B2F92','M4 7V4h16v3M9 20h6M12 4v16'], long:['#3B2F92','M4 6h16M4 10h16M4 14h16M4 18h10'], select:['#CD3151','M3 5h18v6H3zM15 8l2 2 2-2M3 15h12M3 19h8'], multi:['#CD3151','M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'], radio:['#E35E3C','M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'], email:['#1D1650','M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6'], phone:['#1D1650','M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z'], number:['#15801A','M4 9h16M4 15h16M10 3 8 21M16 3l-2 18'], date:['#15801A','M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'] };
    const CATS = [['Strategy and Planning','الاستراتيجية والتخطيط'],['Culture and Heritage','الثقافة والتراث'],['Museums and Curation','المتاحف والتقييم الفني'],['Marketing and Communications','التسويق والاتصال'],['People and Performance','الأفراد والأداء'],['Visitor Experience and Events','تجربة الزوار والفعاليات']];
    const o = (a) => a.map(x => L(x[0], x[1]));
    const FD = {
      f1:{ en:'Elevate mentee registration', ar:'تسجيل المتدرّبين في إرتقاء', kind:'registration', ms:['elevate'], st:'active', fields:[
        { key:'goals', en:'What do you want to achieve through mentoring?', ar:'ما الذي تريد تحقيقه من خلال الإرشاد؟', type:'long', req:true },
        { key:'yearsAtDct', en:'Years at DCT', ar:'سنوات العمل في الدائرة', type:'select', req:true, opts:o([['Less than 1','أقل من سنة'],['1–3','1–3'],['3–5','3–5'],['More than 5','أكثر من 5']]) },
        { key:'preferredAreas', en:'Preferred mentoring areas', ar:'مجالات الإرشاد المفضّلة', type:'multi', req:true, opts:o(CATS) },
        { key:'language', en:'Preferred language', ar:'اللغة المفضّلة', type:'radio', req:true, opts:o([['English','الإنجليزية'],['Arabic','العربية'],['Both','كلتاهما']]) } ],
        entries:[ { n:['Saeed Al Hammadi','سعيد الحمادي'], ini:'SA', c:'#D63539', email:'saeed.h@dctlearn.example', at:['20 Sep 2026','20 سبتمبر 2026'], a:[L('Lead a small exhibition project by Q2 2027','قيادة مشروع معرض صغير بحلول الربع الثاني 2027'), '1–3', L('Museums and Curation; Strategy and Planning','المتاحف والتقييم الفني؛ الاستراتيجية والتخطيط'), L('Both','كلتاهما')] } ] },
      f2:{ en:'Learning needs pulse 2026', ar:'استطلاع احتياجات التعلّم 2026', kind:'survey', ms:['employees'], st:'active', fields:[
        { key:'topics', en:'Which topics should we add next?', ar:'ما الموضوعات التي نضيفها لاحقاً؟', type:'multi', req:true, opts:o([['Visitor experience','تجربة الزوار'],['AI at work','الذكاء الاصطناعي في العمل'],['Heritage','التراث'],['Leadership','القيادة']]) },
        { key:'format', en:'How do you prefer to learn?', ar:'كيف تفضّل أن تتعلّم؟', type:'radio', req:true, opts:o([['Self-paced','ذاتياً'],['Workshops','ورش العمل'],['Mentoring','الإرشاد']]) },
        { key:'comment', en:'Anything else?', ar:'أي ملاحظات أخرى؟', type:'long', req:false } ],
        entries:[ { n:['Hamad Al Mazrouei','حمد المزروعي'], ini:'HM', c:'#CD3151', email:'hamad.m@dctlearn.example', at:['22 Sep 2026','22 سبتمبر 2026'], a:[L('AI at work','الذكاء الاصطناعي في العمل'), L('Self-paced','ذاتياً'), L('More short videos, please.','المزيد من الفيديوهات القصيرة من فضلكم.')] },
          { n:['Mona Al Ameri','منى العامري'], ini:'MA', c:'#E35E3C', email:'mona.a@dctlearn.example', at:['16 Sep 2026','16 سبتمبر 2026'], a:[L('Leadership; Visitor experience','القيادة؛ تجربة الزوار'), L('Workshops','ورش العمل'), '—'] },
          { n:['Saeed Al Hammadi','سعيد الحمادي'], ini:'SA', c:'#D63539', email:'saeed.h@dctlearn.example', at:['14 Sep 2026','14 سبتمبر 2026'], a:[L('Heritage','التراث'), L('Mentoring','الإرشاد'), '—'] } ] },
      f3:{ en:'Nibras AI Champions application', ar:'طلب الالتحاق ببرنامج نبراس', kind:'application', ms:['nibras'], st:'closed', fields:[
        { key:'role', en:'Current role', ar:'المسمّى الوظيفي الحالي', type:'text', req:true },
        { key:'track', en:'Track', ar:'المسار', type:'select', req:true, opts:o([['AI Aware','الوعي بالذكاء الاصطناعي'],['AI Practitioner','ممارس الذكاء الاصطناعي'],['AI Builder','مطوّر الذكاء الاصطناعي']]) },
        { key:'motivation', en:'Why do you want to join?', ar:'لماذا تريد الانضمام؟', type:'long', req:true },
        { key:'managerEmail', en:'Line manager e-mail', ar:'بريد المدير المباشر', type:'email', req:true } ],
        entries:[ { n:['Hamad Al Mazrouei','حمد المزروعي'], ini:'HM', c:'#CD3151', email:'hamad.m@dctlearn.example', at:['28 Aug 2026','28 أغسطس 2026'], a:[L('Data analyst','محلّل بيانات'), L('AI Aware','الوعي بالذكاء الاصطناعي'), L('I want to automate our monthly visitor reports.','أريد أتمتة تقارير الزوار الشهرية.'), 'manager@dctlearn.example'] } ] },
      f4:{ en:'Ruwaad — register interest', ar:'رواد — إبداء الاهتمام', kind:'interest', ms:['ruwaad'], st:'active', fields:[
        { key:'name', en:'Full name', ar:'الاسم الكامل', type:'text', req:true }, { key:'email', en:'E-mail', ar:'البريد الإلكتروني', type:'email', req:true }, { key:'phone', en:'Phone', ar:'الهاتف', type:'phone', req:false }, { key:'message', en:'Message', ar:'الرسالة', type:'long', req:false } ],
        entries:[ { n:['Priya Nair','بريا ناير'], ini:'PN', c:'#3B2F92', email:'priya.n@example.com', at:['5 Oct 2026','5 أكتوبر 2026'], a:['Priya Nair','priya.n@example.com','+971 55 987 6543', L('Interested in guest relations roles.','مهتمة بوظائف علاقات الضيوف.')] },
          { n:['Rashed Khalifa','راشد خليفة'], ini:'RK', c:'#F77860', email:'rashed.k@example.com', at:['4 Oct 2026','4 أكتوبر 2026'], a:['Rashed Khalifa','rashed.k@example.com','—', L('When does the next cohort start?','متى تبدأ الدفعة القادمة؟')] },
          { n:['Noor Al Ali','نور العلي'], ini:'NA', c:'#CD3151', email:'noor.ali@example.com', at:['3 Oct 2026','3 أكتوبر 2026'], a:['Noor Al Ali','noor.ali@example.com','+971 50 123 4567', L('I would like to work in front office.','أودّ العمل في الاستقبال.')] } ] },
      f5:{ en:'ZNM onboarding feedback', ar:'ملاحظات التهيئة في متحف زايد الوطني', kind:'survey', ms:['znm'], st:'draft', fields:[
        { key:'rating', en:'How ready do you feel for opening day? (1–5)', ar:'ما مدى جاهزيتك ليوم الافتتاح؟ (1–5)', type:'number', req:true }, { key:'gaps', en:'What would help you most?', ar:'ما الذي سيساعدك أكثر؟', type:'long', req:false } ], entries:[] }
    };
    const screen = st('screen') || 'list';
    const fid = this.state.form || this.props.form || 'f1';
    const fMods = this.state.fMods || {};
    const fieldsOf = (id) => fMods[id] && fMods[id].fields ? fMods[id].fields : FD[id].fields;
    const stOf = (id) => (fMods[id] && fMods[id].st) || FD[id].st;
    const kCls = { registration:'info', survey:'ok', application:'warn', interest:'mut' };
    const stCls = { active:'ok', draft:'warn', closed:'mut' };
    const kf = this.state.kf || 'all';
    const ids = Object.keys(FD);
    const list = ids.filter(id => kf === 'all' || FD[id].kind === kf);
    const go = (id, sc) => S({ form:id, screen:sc, fsel:0, eq:'', openE:{} });
    const forms = list.map(id => { const F = FD[id]; return { title: L(F.en, F.ar), alt: ar ? F.en : F.ar, altLang: ar ? 'en' : 'ar', altDir: ar ? 'ltr' : 'rtl', kindL: t.kinds[F.kind], kCls: kCls[F.kind],
      ms: F.ms.map(m => ({ n: L(MS[m][0], MS[m][1]), c: MS[m][2] })), nf: fmt(fieldsOf(id).length), ne: fmt(F.entries.length), last: F.entries.length ? t.last + ' ' + (ar ? F.entries[0].at[1] : F.entries[0].at[0]) : t.none,
      stL: t.sts[stOf(id)], stCls: stCls[stOf(id)], build: () => go(id, 'builder'), entries: () => go(id, 'entries') }; });
    const totalE = ids.reduce((a, id) => a + FD[id].entries.length, 0);
    const KI = { form:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5', on:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', inbox:'M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z', wk:'M3 3v18h18M7 15v2M11 11v6M15 7v10M19 13v4' };
    const kpis = [ [ids.length,'k-ink',KI.form], [ids.filter(id => stOf(id) === 'active').length,'k-rasp',KI.on], [totalE,'k-red',KI.inbox], [3,'k-yel',KI.wk] ].map((x, i) => ({ l:t.kp[i], v:fmt(x[0]), n:t.kn[i], cls:x[1], d:x[2] }));
    const kChips = ['all','registration','survey','application','interest'].map(k => ({ l: k === 'all' ? t.all : t.kinds[k], n: fmt(k === 'all' ? ids.length : ids.filter(id => FD[id].kind === k).length), on: kf === k ? 'true' : 'false', pick: () => S({ kf:k }) }));
    // detail
    const F = FD[fid];
    const flds = fieldsOf(fid);
    const fsel = Math.min(this.state.fsel || 0, Math.max(flds.length - 1, 0));
    const setFields = (arr) => S({ fMods: Object.assign({}, fMods, { [fid]: Object.assign({}, fMods[fid] || {}, { fields: arr }) }) });
    const cf0 = flds[fsel] || { key:'', en:'', ar:'', type:'text', req:false };
    const upd = (o2) => setFields(flds.map((x, i) => i === fsel ? Object.assign({}, x, o2) : x));
    const keyBad = !/^[a-z][a-zA-Z0-9_]*$/.test(cf0.key || '');
    const fe = { en: !(cf0.en || '').trim(), ar: !(cf0.ar || '').trim(), k: keyBad }; fe.enCls = fe.en ? 'is-error' : ''; fe.arCls = fe.ar ? 'is-error' : ''; fe.kCls = fe.k ? 'is-error' : '';
    const hasOpts = ['select','multi','radio'].indexOf(cf0.type) >= 0;
    const opts = cf0.opts || [];
    const cf = { en: cf0.en, ar: cf0.ar, key: cf0.key, type: cf0.type, reqCls: cf0.req ? 'on' : '', reqA: cf0.req ? 'true' : 'false', hasOpts,
      opts: opts.map((x, i) => ({ l:x, aria: t.option + ' ' + (i + 1), rmA: t.remove + ' ' + x, on: (e) => upd({ opts: opts.map((y, j) => j === i ? e.target.value : y) }), rm: () => upd({ opts: opts.filter((y, j) => j !== i) }) })) };
    const cfOn = { en: (e) => upd({ en:e.target.value }), ar: (e) => upd({ ar:e.target.value }), key: (e) => upd({ key:e.target.value }), type: (e) => upd({ type:e.target.value, opts: cf0.opts || [L('Option 1','الخيار 1'), L('Option 2','الخيار 2')] }), req: () => upd({ req: !cf0.req }) };
    const mv = (d) => { const j = fsel + d; if (j < 0 || j >= flds.length) return; const a = flds.slice(); a[fsel] = a[j]; a[j] = cf0; setFields(a); S({ fsel:j }); };
    const fields = flds.map((x, i) => ({ label: L(x.en, x.ar) || '—', key: x.key || '—', tyL: t.types[x.type], c: TY[x.type][0], d: TY[x.type][1], req: !!x.req, cls: i === fsel ? 'on' : '', cur: i === fsel ? 'true' : 'false', pick: () => S({ fsel:i }) }));
    const typeOpts = Object.keys(t.types).map(k => ({ v:k, l:t.types[k] }));
    const addField = (e) => { const v = e.target.value; if (!v) return; const n = flds.length + 1; setFields(flds.concat([{ key:'field' + n, en:'New question', ar:'سؤال جديد', type:v, req:false, opts: ['select','multi','radio'].indexOf(v) >= 0 ? [L('Option 1','الخيار 1'), L('Option 2','الخيار 2')] : undefined }])); S({ fsel: flds.length }); flash(t.added); };
    const curSt = stOf(fid);
    const stSeg = ['draft','active','closed'].map(k => ({ l:t.sts[k], cls: curSt === k ? 'is-on' : '', on: curSt === k ? 'true' : 'false', pick: () => S({ fMods: Object.assign({}, fMods, { [fid]: Object.assign({}, fMods[fid] || {}, { st:k }) }) }) }));
    // entries
    const eq = (this.state.eq || '').toLowerCase();
    const openE = this.state.openE || {};
    const ents = F.entries.filter(r => !eq || (r.n[0] + ' ' + r.n[1] + ' ' + r.email).toLowerCase().indexOf(eq) >= 0);
    const showCols = flds.slice(0, 2);
    const entries = ents.map((r, i) => ({ name: L(r.n[0], r.n[1]), ini: r.ini, c: r.c, email: r.email, at: ar ? r.at[1] : r.at[0], cols: showCols.map((x, j) => ({ v: r.a[j] || '—' })),
      exp: openE[i] ? 'true' : 'false', open: !!openE[i], tog: () => S({ openE: Object.assign({}, openE, { [i]: !openE[i] }) }), span: String(showCols.length + 3),
      all: flds.map((x, j) => ({ k: L(x.en, x.ar), v: r.a[j] || '—' })) }));
    const csvEsc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = ['submitted_at','name','email'].concat(flds.map(x => x.key)).map(csvEsc).join(',') + '\n' + F.entries.map(r => [r.at[0], r.n[0], r.email].concat(flds.map((x, j) => r.a[j] || '')).map(csvEsc).join(',')).join('\n');
    const sh = this.shell(ar, 'admin', 'forms', null, screen === 'list' ? [ { label: L('Admin','الإدارة'), href:'/admin' }, { label: L('Forms','النماذج') } ] : [ { label: L('Admin','الإدارة'), href:'/admin' }, { label: L('Forms','النماذج'), href:'/admin/surveys' }, { label: L(F.en, F.ar) } ]);
    return Object.assign(base, {
      t, sh, route:'/admin/surveys', kpis, kChips, forms, countTxt: fmt(list.length) + ' ' + t.of + ' ' + fmt(ids.length) + ' ' + t.formsW,
      isList: screen === 'list', isDetail: screen !== 'list', isBuilder: screen === 'builder', isEntries: screen === 'entries',
      goList: () => S({ screen:'list' }), newForm: () => { flash(L('Draft form created — add fields to get started','تم إنشاء مسودة نموذج — أضف الحقول للبدء')); go('f5', 'builder'); },
      fm: { title: L(F.en, F.ar), kindL: t.kinds[F.kind], stL: t.sts[curSt], stCls: stCls[curSt], ms: F.ms.map(m => ({ n: L(MS[m][0], MS[m][1]), c: MS[m][2] })), meta: fmt(flds.length) + ' ' + L('fields','حقول') + ' · ' + fmt(F.entries.length) + ' ' + (F.entries.length === 1 ? L('entry','إجابة') : L('entries','إجابات')), where: t.where[F.kind] },
      dtabs: [['builder', t.builder, flds.length], ['entries', t.entriesT, F.entries.length]].map(x => ({ l:x[1], n: fmt(x[2]), cls: screen === x[0] ? 'on' : '', cur: screen === x[0] ? 'page' : 'false', pick: () => S({ screen:x[0] }) })),
      csvHref: 'data:text/csv;charset=utf-8,' + encodeURIComponent('﻿' + csv), csvName: F.en.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-entries.csv', onExport: () => flash(t.exported.replace('%n', fmt(F.entries.length))),
      saveForm: () => { if (fe.en || fe.ar || fe.k) { flash(t.fix); return; } flash(t.saved); },
      fields, cf, cfOn, fe, typeOpts, addField, fUp: () => mv(-1), fDown: () => mv(1), addOpt: () => upd({ opts: opts.concat([L('Option ','الخيار ') + (opts.length + 1)]) }),
      rmField: () => { if (flds.length <= 1) return; setFields(flds.filter((x, i) => i !== fsel)); S({ fsel: Math.max(0, fsel - 1) }); flash(t.removed); }, stSeg,
      eq: this.state.eq || '', onEq: (e) => S({ eq: e.target.value }), eCount: fmt(ents.length) + ' ' + t.of + ' ' + fmt(F.entries.length), noEntries: ents.length === 0, hasEntries: ents.length > 0,
      eCols: showCols.map(x => ({ l: L(x.en, x.ar) })), entries,
      specSegs: [ seg('Screen','screen',[['list','Forms list'],['builder','Form builder'],['entries','Entries']]), seg('Form','form',[['f1','Elevate reg.'],['f2','Pulse survey'],['f3','Nibras app.'],['f4','Ruwaad'],['f5','Draft']]) ]
    });
  }

}
