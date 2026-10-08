// Ported verbatim from the Claude Design artboard P46-Catalog (DCLogic class).
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
      spec:'كتالوج الدورات', ey:'التعلّم · الكتالوج', h1:'كتالوج الدورات', sub:'كل دورات DCT Learn في مكان واحد: الحالة والشهادات والمواقع المصغّرة التي تستخدم كل دورة.', create:'إنشاء دورة',
      ey2:'الكتالوج', h2:'جميع الدورات', viewLbl:'طريقة العرض', vTable:'جدول', vCards:'بطاقات', search:'ابحث بالعنوان أو الرمز أو الفئة', msLbl:'الموقع المصغّر', certLbl:'الشهادة', statusLbl:'الحالة',
      allMs:'كل المواقع المصغّرة', allCert:'كل أنواع الشهادات', certYes:'شهادة', certNo:'بلا شهادة', certExt:'شهادة خارجية',
      stAll:'الكل', stPub:'منشورة', stDraft:'مسودة', stSoon:'قريباً',
      thCourse:'الدورة', thLevel:'المستوى', thCert:'الشهادة', thStatus:'الحالة', thMs:'المواقع المصغّرة', thLearners:'المتعلّمون', thAct:'إجراءات', edit:'تحرير',
      noRes:'لا توجد دورات مطابقة', noResB:'جرّب كلمة بحث أخرى أو امسح عوامل التصفية.', clear:'مسح عوامل التصفية',
      dEy:'دورة جديدة', dH:'إنشاء دورة', dP:'تُحفظ الدورة كمسودة. أضف الوحدات والكتل في المحرّر ثم انشرها.', close:'إغلاق',
      fEn:'العنوان (بالإنجليزية)', fAr:'العنوان (بالعربية)', fMin:'المدة (بالدقائق)', fCats:'الفئات', fMs:'المواقع المصغّرة', msHint:'يُسجَّل أعضاء هذه المواقع تلقائياً عند النشر.', fSeq:'تسلسلية', fSeqH:'تُفتح الوحدات بالترتيب',
      phEn:'e.g. Visitor Experience Essentials', phAr:'مثال: أساسيات تجربة الزائر',
      errH:'راجِع الحقول المظلّلة', errP:'لا يمكن إنشاء الدورة قبل تصحيحها.', reqT:'العنوان مطلوب', longT:'160 حرفاً كحد أقصى', minErr:'أدخل مدة بين 1 و600 دقيقة', catErr:'اختر فئة واحدة على الأقل',
      cancel:'إلغاء', createDraft:'إنشاء كمسودة', created:'تم إنشاء «%s» كمسودة', min:'د', units:'وحدات', enrolled:'مسجّل', done:'أكملوا', none:'—',
      kp:['الدورات','منشورة','قريباً','الإكمالات'], kn:['في الكتالوج','متاحة للمتعلّمين','دورة واحدة · ميوزيو برو','في كل المواقع المصغّرة']
    } : {
      spec:'Course catalogue', ey:'Learning · Catalogue', h1:'Course catalogue', sub:'Every DCT Learn course in one place — status, certificates and the microsites that use each one.', create:'Create course',
      ey2:'Catalogue', h2:'All courses', viewLbl:'View', vTable:'Table', vCards:'Cards', search:'Search by title, key or category', msLbl:'Microsite', certLbl:'Certificate', statusLbl:'Status',
      allMs:'All microsites', allCert:'All certificate types', certYes:'Certificate', certNo:'No certificate', certExt:'External certificate',
      stAll:'All', stPub:'Published', stDraft:'Draft', stSoon:'Coming soon',
      thCourse:'Course', thLevel:'Level', thCert:'Certificate', thStatus:'Status', thMs:'Microsites', thLearners:'Learners', thAct:'Actions', edit:'Edit',
      noRes:'No courses match', noResB:'Try another search term or clear the filters.', clear:'Clear filters',
      dEy:'New course', dH:'Create course', dP:'The course is saved as a draft. Add modules, units and blocks in the editor, then publish.', close:'Close',
      fEn:'Title (English)', fAr:'Title (Arabic)', fMin:'Duration (minutes)', fCats:'Categories', fMs:'Microsites', msHint:'Members of these microsites are enrolled automatically once it is published.', fSeq:'Sequential', fSeqH:'Units unlock in order',
      phEn:'e.g. Visitor Experience Essentials', phAr:'مثال: أساسيات تجربة الزائر',
      errH:'Check the highlighted fields', errP:'The course can’t be created until they are fixed.', reqT:'Title is required', longT:'160 characters max', minErr:'Enter a duration between 1 and 600 minutes', catErr:'Choose at least one category',
      cancel:'Cancel', createDraft:'Create as draft', created:'“%s” created as a draft', min:'min', units:'units', enrolled:'enrolled', done:'completed', none:'—',
      kp:['Courses','Published','Coming soon','Completions'], kn:['in the catalogue','visible to learners','C17 · MuseoPro','across all microsites']
    };
    const screen = st('screen') || 'list';
    const q = this.state.q !== undefined ? this.state.q : (screen === 'empty' ? 'Astronomy' : '');
    const status = this.state.status || 'all', ms = this.state.ms || 'all', cert = this.state.cert || 'all';
    const view = st('view') || 'table';
    const dlg = this.state.dlg !== undefined ? this.state.dlg : (screen === 'create' ? 'create' : null);
    const extra = this.state.extra || [];
    const all = extra.concat(COURSES.map(c => ({ key:c[0], en:c[1], ar:c[2], cats:c[3], level:c[4], min:c[5], units:c[6], cert:c[7], status:c[8], ms:c[9], enr:c[10], done:c[11], img:B(IMGS[c[0]]) })));
    const SHORT = { employees:['Employees','الموظفون'], elevate:['Elevate','إرتقاء'], znm:['ZNM','متحف زايد'], zu:['ZU','جامعة زايد'], museopro:['MuseoPro','ميوزيو برو'], nibras:['Nibras','نبراس'], chkforum:['Forum','المنتدى'] };
    const certShort = { yes: L('Certificate','شهادة'), no: L('No certificate','بلا شهادة'), external: L('External','خارجية') };
    const stOf = { published:[t.stPub,'ok'], draft:[t.stDraft,'warn'], coming_soon:[t.stSoon,'yel'] };
    const certOf = { yes:[t.certYes,'ok'], no:[t.certNo,'mut'], external:[t.certExt,'info'] };
    const ql = q.trim().toLowerCase();
    const match = (c, ignoreStatus) => (ignoreStatus || status === 'all' || c.status === status) && (ms === 'all' || c.ms.indexOf(ms) >= 0) && (cert === 'all' || c.cert === cert) &&
      (!ql || (c.key + ' ' + c.en + ' ' + c.ar + ' ' + c.cats.map(k => CATS[k].join(' ')).join(' ')).toLowerCase().indexOf(ql) >= 0);
    const list = all.filter(c => match(c, false));
    const rows = list.map(c => ({ key:c.key, title: ar ? c.ar : c.en, alt: ar ? c.en : c.ar, altLang: ar ? 'en' : 'ar', altDir: ar ? 'ltr' : 'rtl', img:c.img,
      cats: c.cats.map(k => ({ l: L(CATS[k][0], CATS[k][1]) })), cat0: L(CATS[c.cats[0]][0], CATS[c.cats[0]][1]),
      level: L(LEVEL[c.level][0], LEVEL[c.level][1]), meta: fmt(c.min) + ' ' + t.min + ' · ' + fmt(c.units) + ' ' + t.units,
      certL: certOf[c.cert][0], certCls: certOf[c.cert][1], stL: stOf[c.status][0], stCls: stOf[c.status][1],
      ms: c.ms.map(m => ({ n: L(MS[m][0], MS[m][1]), s: L(SHORT[m][0], SHORT[m][1]), c: MS[m][2] })), certS: certShort[c.cert],
      enr: c.enr ? fmt(c.enr) + ' ' + t.enrolled : t.none, done: c.enr ? fmt(c.done) + ' ' + t.done : '',
      href: '/admin/catalog/editor/' + c.key, editAria: t.edit + ' ' + (ar ? c.ar : c.en), rowCls: c.isNew ? 'new' : '' }));
    const cnt = (s) => all.filter(c => match(c, true) && (s === 'all' || c.status === s)).length;
    const stChips = [['all',t.stAll],['published',t.stPub],['draft',t.stDraft],['coming_soon',t.stSoon]].map(x => ({ l:x[1], n: fmt(cnt(x[0])), on: status === x[0] ? 'true' : 'false', pick: () => S({ status:x[0] }) }));
    const KI = { book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5M9 7h7M9 11h5', live:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', soon:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', award:'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 23l5-3 5 3-1.2-9.1' };
    const totalDone = all.reduce((a, c) => a + c.done, 0);
    const kpis = [ [all.length,'k-ink',KI.book], [all.filter(c => c.status === 'published').length,'k-rasp',KI.live], [all.filter(c => c.status === 'coming_soon').length,'k-yel',KI.soon], [totalDone,'k-red',KI.award] ]
      .map((x, i) => ({ l:t.kp[i], v:fmt(x[0]), n:t.kn[i], cls:x[1], d:x[2] }));
    // create form
    const f = Object.assign({ en:'', ar:'', level:'beginner', min:'30', cats:[], ms:[], cert:'yes', seq:true }, this.state.f || {});
    const tried = !!this.state.tried;
    const setF = (o) => S({ f: Object.assign({}, f, o) });
    const enE = !f.en.trim() ? t.reqT : f.en.length > 160 ? t.longT : '';
    const arE = !f.ar.trim() ? t.reqT : f.ar.length > 160 ? t.longT : '';
    const mn = Number(f.min); const minE = !(mn >= 1 && mn <= 600);
    const catE = f.cats.length === 0;
    const e = { en: tried && !!enE, enMsg: enE, enCls: tried && enE ? 'is-error' : '', ar: tried && !!arE, arMsg: arE, arCls: tried && arE ? 'is-error' : '', min: tried && minE, minCls: tried && minE ? 'is-error' : '', cats: tried && catE };
    const tog = (arr, v) => arr.indexOf(v) >= 0 ? arr.filter(x => x !== v) : arr.concat([v]);
    const catChips = Object.keys(CATS).map(k => ({ l: L(CATS[k][0], CATS[k][1]), on: f.cats.indexOf(k) >= 0 ? 'true' : 'false', tog: () => setF({ cats: tog(f.cats, k) }) }));
    const msChips = ['employees','elevate','znm','zu','museopro','nibras','chkforum'].map(k => ({ l: L(MS[k][0], MS[k][1]), c: MS[k][2], on: f.ms.indexOf(k) >= 0 ? 'true' : 'false', tog: () => setF({ ms: tog(f.ms, k) }) }));
    const certSeg = [['yes',t.certYes],['no',t.certNo],['external',t.certExt]].map(x => ({ l:x[1], cls: f.cert === x[0] ? 'is-on' : '', on: f.cert === x[0] ? 'true' : 'false', pick: () => setF({ cert:x[0] }) }));
    const submit = () => {
      if (enE || arE || minE || catE) { S({ tried:true }); return; }
      const key = 'C' + (24 + extra.length);
      const nc = { key, en:f.en.trim(), ar:f.ar.trim(), cats:f.cats, level:f.level, min:mn, units:0, cert:f.cert, status:'draft', ms:f.ms, enr:0, done:0, img:B('eb80e68b5f407df8f3c317956007a5a2'), isNew:true };
      S({ extra:[nc].concat(extra), dlg:null, f:null, tried:false, status:'all', q:'', screen:'list' });
      flash(t.created.replace('%s', ar ? nc.ar : nc.en));
    };
    const sh = this.shell(ar, 'admin', 'catalog', null, [ { label: L('Admin','الإدارة'), href:'/admin' }, { label: L('Catalog','الكتالوج') } ]);
    const msOpts = [{ v:'all', l:t.allMs }].concat(['employees','elevate','znm','zu','museopro','nibras','chkforum'].map(k => ({ v:k, l: L(MS[k][0], MS[k][1]) })));
    const certOpts = [['all',t.allCert],['yes',t.certYes],['no',t.certNo],['external',t.certExt]].map(x => ({ v:x[0], l:x[1] }));
    const lvOpts = ['beginner','intermediate','advanced'].map(k => ({ v:k, l: L(LEVEL[k][0], LEVEL[k][1]) }));
    return Object.assign(base, {
      t, sh, kpis, rows, stChips, msOpts, certOpts, lvOpts, q, ms, cert, route:'/admin/catalog',
      countTxt: ar ? (fmt(rows.length) + ' من ' + fmt(all.length) + ' دورة') : (rows.length + ' of ' + all.length + ' courses'),
      noRes: rows.length === 0, showTable: rows.length > 0 && view === 'table', showCards: rows.length > 0 && view === 'cards',
      tblCls: view === 'table' ? 'is-on' : '', cardCls: view === 'cards' ? 'is-on' : '', isTable: view === 'table' ? 'true' : 'false', isCards: view === 'cards' ? 'true' : 'false',
      setTable: () => S({ view:'table' }), setCards: () => S({ view:'cards' }),
      onQ: (ev) => S({ q: ev.target.value }), onMs: (ev) => S({ ms: ev.target.value }), onCert: (ev) => S({ cert: ev.target.value }),
      clearF: () => S({ q:'', ms:'all', cert:'all', status:'all' }),
      dlgOpen: dlg === 'create', openCreate: () => S({ dlg:'create', tried:false, f:null }), closeDlg: () => S({ dlg:null, tried:false }),
      f, e, hasErr: tried && !!(enE || arE || minE || catE), enCtr: fmt(f.en.length) + ' / 160', arCtr: fmt(f.ar.length) + ' / 160',
      catChips, msChips, certSeg, seqCls: f.seq ? 'on' : '', togSeq: () => setF({ seq: !f.seq }),
      onEn: (ev) => setF({ en: ev.target.value }), onAr: (ev) => setF({ ar: ev.target.value }), onMin: (ev) => setF({ min: ev.target.value }), onLevel: (ev) => setF({ level: ev.target.value }),
      submit,
      specSegs: [ seg('State','screen',[['list','Catalogue',{ dlg:undefined, q:undefined }],['create','Create dialog',{ dlg:undefined, tried:false }],['empty','No results',{ dlg:undefined, q:undefined }]]), seg('View','view',[['table','Table'],['cards','Cards']]) ]
    });
  }

}
