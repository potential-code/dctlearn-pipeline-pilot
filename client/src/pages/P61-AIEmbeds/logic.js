// Ported verbatim from the Claude Design artboard P61-AIEmbeds (DCLogic class).
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

    const MS = { employees:['DCT Employees','موظفو الدائرة','#EE3E43'], elevate:['Elevate 2026','إرتقاء 2026','#CD3151'], znm:['Zayed National Museum','متحف زايد الوطني','#3B2F92'], zu:['ZU 24-Hour Challenge','تحدي جامعة زايد','#F7C337'], museopro:['MuseoPro','ميوزيو برو','#E35E3C'], nibras:['Nibras — AI Champions','نبراس','#2FC4DB'], chkforum:['Cultural Heritage Forum','منتدى التراث الثقافي','#6D7782'] };
    const t = ar ? {
      spec:'أدوات الذكاء الاصطناعي', ey:'الإعدادات · الذكاء الاصطناعي', h1:'تضمينات الذكاء الاصطناعي', sub:'المدربون الأذكياء والأدوات ووكيل التوظيف الصوتي: المزوّد، والمواقع المصغّرة التي تعرضها، وما إذا كانت تتطلب تسجيل الدخول.', add:'إضافة تضمين',
      offH:'مزوّد الذكاء الاصطناعي معطّل', offP:'AI_PROVIDER_ENABLED=false. التضمينات مخفية عن المتعلّمين، ورؤى الذكاء الاصطناعي في لوحة التحكم تُرجع 503 حتى يُعاد تفعيله.',
      kp:['التضمينات','مفعّلة','مواقع تستخدمها','عامة'], kn:['محادثة وأداة وصوت','ظاهرة للمتعلّمين','موقعان مصغّران','دون تسجيل دخول'],
      kinds:{ chat:'محادثة', iframe:'إطار مضمّن', voice:'صوت' }, on:'مفعّل', offL:'معطّل', key:'المفتاح', provider:'معرّف المزوّد', url:'الرابط', ms:'المواقع المصغّرة', login:'يتطلب تسجيل الدخول', yes:'نعم', no:'لا — صفحة عامة', publicPage:'صفحة عامة', test:'اختبار الاتصال', edit:'تحرير',
      idle:'لم يُختبر اليوم', testing:'جارٍ الاختبار…', okR:'متصل · %n ms', badR:'المزوّد معطّل (503)', togOn:'تفعيل %s', togOff:'تعطيل %s',
      newEy:'تضمين جديد', newH:'إضافة تضمين', editEy:'تحرير التضمين', saveB:'حفظ التضمين', createB:'إضافة التضمين', close:'إغلاق', cancel:'إلغاء', errH:'راجِع الحقول المظلّلة', errP:'لم يُحفظ التضمين.',
      nameEn:'الاسم (بالإنجليزية)', nameAr:'الاسم (بالعربية)', keyErr:'أحرف صغيرة وأرقام وشرطات فقط', keyHint:'يُستخدم في الرابط: /ai/coach/{key}', pidErr:'أحرف صغيرة وأرقام وشرطة سفلية', kindL:'النوع', scriptUrl:'رابط السكربت', iframeUrl:'رابط الإطار', urlHint:'https فقط ومن مضيف معتمد: *.ai-provider.example', httpsErr:'أدخل رابطاً يبدأ بـ https://', hostErr:'المضيف غير معتمد — استخدم *.ai-provider.example',
      colour:'اللون', hex:'لون مخصص (HEX)', hexErr:'استخدم صيغة ‎#RRGGBB', msHint:'دون مواقع مصغّرة = صفحة عامة فقط.', loginH:'يجب تسجيل الدخول قبل استخدام التضمين', req:'مطلوب',
      saved:'تم حفظ «%s»', enabledT:'تم تفعيل «%s»', disabledT:'تم تعطيل «%s» — أُخفي عن المتعلّمين'
    } : {
      spec:'AI embeds', ey:'Settings · AI', h1:'AI embeds', sub:'AI coaches, tools and the voice hiring agent — their provider, the microsites that show them, and whether they need a sign-in.', add:'Add AI embed',
      offH:'AI provider disabled', offP:'AI_PROVIDER_ENABLED=false. Embeds are hidden from learners and AI insights on the dashboard return 503 until it is switched back on.',
      kp:['Embeds','Enabled','Microsites','Public'], kn:['chat, tool and voice','visible to learners','using an embed','no sign-in needed'],
      kinds:{ chat:'Chat', iframe:'Iframe', voice:'Voice' }, on:'Enabled', offL:'Disabled', key:'Key', provider:'Provider id', url:'URL', ms:'Microsites', login:'Login required', yes:'Yes', no:'No — public page', publicPage:'Public page', test:'Test connection', edit:'Edit',
      idle:'Not tested today', testing:'Testing…', okR:'Connected · %n ms', badR:'Provider disabled (503)', togOn:'Enable %s', togOff:'Disable %s',
      newEy:'New embed', newH:'Add AI embed', editEy:'Edit embed', saveB:'Save embed', createB:'Add embed', close:'Close', cancel:'Cancel', errH:'Check the highlighted fields', errP:'The embed hasn’t been saved.',
      nameEn:'Name (English)', nameAr:'Name (Arabic)', keyErr:'Lower-case letters, numbers and hyphens only', keyHint:'Used in the URL: /ai/coach/{key}', pidErr:'Lower-case letters, numbers and underscores', kindL:'Kind', scriptUrl:'Script URL', iframeUrl:'Iframe URL', urlHint:'https only, from an allow-listed host: *.ai-provider.example', httpsErr:'Enter a link starting with https://', hostErr:'Host not allow-listed — use *.ai-provider.example',
      colour:'Colour', hex:'Custom colour (HEX)', hexErr:'Use the #RRGGBB format', msHint:'No microsite = public page only.', loginH:'Users must sign in before using the embed', req:'Required',
      saved:'“%s” saved', enabledT:'“%s” enabled', disabledT:'“%s” disabled — hidden from learners'
    };
    const KD = { chat:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', iframe:'M3 3h18v18H3zM3 9h18M9 21V9', voice:'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3' };
    const E0 = [
      { key:'culture-bot', en:'Abu Dhabi Culture Bot', ar:'روبوت ثقافة أبوظبي', kind:'chat', pid:'bot_culture_demo', c:'#A39089', ms:['employees'], login:true, url:'https://embed.ai-provider.example/v1/chat.js', on:true, ms0:184 },
      { key:'career-coach', en:'Career Coach', ar:'مدرّب المسار المهني', kind:'chat', pid:'bot_career_demo', c:'#CE3F3F', ms:['employees','elevate'], login:true, url:'https://embed.ai-provider.example/v1/chat.js', on:true, ms0:201 },
      { key:'lesson-planner', en:'AI Lesson Planner', ar:'مخطّط الدروس الذكي', kind:'iframe', pid:'tool_lesson_demo', c:'#EE3E43', ms:['employees'], login:true, url:'https://tools.ai-provider.example/lesson-planner', on:true, ms0:236 },
      { key:'voice-hiring', en:'Al Ain Museum Voice Hiring Agent', ar:'وكيل التوظيف الصوتي لمتحف العين', kind:'voice', pid:'assistant_hiring_demo', c:'#EE3E43', ms:[], login:false, url:'https://voice.ai-provider.example/agent.js', on:true, ms0:312 }
    ];
    const screen = st('screen') || 'list';
    const provOff = screen === 'disabled';
    const mods = this.state.mods || {}; const added = this.state.added || [];
    const EM = E0.map(e => Object.assign({}, e, mods[e.key] || {})).concat(added);
    const tests = this.state.tests || (screen === 'testing' ? { 'career-coach':'testing', 'culture-bot':'ok' } : {});
    const runTest = (k) => { S({ tests: Object.assign({}, this.state.tests || tests, { [k]:'testing' }) }); setTimeout(() => this.setState({ tests: Object.assign({}, this.state.tests || {}, { [k]: provOff ? 'bad' : 'ok' }) }), 1100); };
    const embeds = EM.map((e, i) => { const ts = tests[e.key] || 'idle'; const on = e.on && !provOff;
      return { hid:'em-' + i, name: L(e.en, e.ar), alt: ar ? e.en : e.ar, altLang: ar ? 'en' : 'ar', altDir: ar ? 'ltr' : 'rtl', c: e.c, d: KD[e.kind], kind: t.kinds[e.kind], kCls: { chat:'info', iframe:'mut', voice:'warn' }[e.kind],
        sL: on ? t.on : t.offL, sCls: on ? 'ok' : 'mut', off: on ? '' : 'off', on: e.on ? 'true' : 'false', onCls: e.on ? 'on' : '',
        togA: (e.on ? t.togOff : t.togOn).replace('%s', L(e.en, e.ar)), tog: () => { S({ mods: Object.assign({}, mods, { [e.key]: Object.assign({}, mods[e.key] || {}, { on: !e.on }) }) }); flash((e.on ? t.disabledT : t.enabledT).replace('%s', L(e.en, e.ar))); },
        key: e.key, pid: e.pid, url: e.url, ms: e.ms.length ? e.ms.map(m => ({ n: L(MS[m][0], MS[m][1]), c: MS[m][2] })) : [{ n: t.publicPage, c:'#6D7782' }], login: e.login ? t.yes : t.no,
        rCls: ts === 'ok' ? 'ok' : ts === 'bad' ? 'bad' : 'idle', rL: ts === 'ok' ? t.okR.replace('%n', fmt(e.ms0 || 190)) : ts === 'bad' ? t.badR : ts === 'testing' ? t.testing : t.idle, ldCls: ts === 'testing' ? 'is-loading' : '',
        test: () => runTest(e.key), edit: () => S({ dlg:true, target:e.key, f:null, tried:false }) }; });
    // dialog
    const dlg = this.state.dlg !== undefined ? this.state.dlg : screen === 'edit';
    const target = this.state.target !== undefined ? this.state.target : (screen === 'edit' ? 'career-coach' : null);
    const te = EM.find(e => e.key === target);
    const f0 = Object.assign({}, te || { key:'', en:'', ar:'', kind:'chat', pid:'', c:'#3B2F92', ms:[], login:true, url:'https://embed.ai-provider.example/v1/chat.js' }, this.state.f || {});
    const setF = (o) => S({ f: Object.assign({}, this.state.f || {}, o) });
    const tried = !!this.state.tried;
    const uHttps = /^https:\/\/[^\s]+$/.test(f0.url || ''); const uHost = /^https:\/\/[a-z0-9-]+\.ai-provider\.example(\/|$)/.test(f0.url || '');
    const er = { en: !f0.en.trim(), ar: !f0.ar.trim(), k: !/^[a-z0-9-]{2,40}$/.test(f0.key), p: !/^[a-z0-9_]{3,60}$/.test(f0.pid), u: !uHttps || !uHost, cc: !/^#[0-9A-Fa-f]{6}$/.test(f0.c) };
    const any = Object.keys(er).some(k => er[k]);
    const fe = {}; Object.keys(er).forEach(k => { fe[k] = tried && er[k]; }); fe.enCls = fe.en ? 'is-error' : ''; fe.arCls = fe.ar ? 'is-error' : ''; fe.kCls = fe.k ? 'is-error' : ''; fe.pCls = fe.p ? 'is-error' : ''; fe.uCls = fe.u ? 'is-error' : ''; fe.cCls = fe.cc ? 'is-error' : ''; fe.any = tried && any; fe.uMsg = !uHttps ? t.httpsErr : t.hostErr;
    const on = {}; ['en','ar','key','pid','url','c'].forEach(k => { on[k] = (e) => setF({ [k]: e.target.value }); }); on.login = () => setF({ login: !f0.login });
    const save = () => { if (any) { S({ tried:true }); return; } const rec = { key:f0.key, en:f0.en, ar:f0.ar, kind:f0.kind, pid:f0.pid, c:f0.c, ms:f0.ms, login:f0.login, url:f0.url };
      if (te && E0.find(e => e.key === te.key)) S({ mods: Object.assign({}, mods, { [te.key]: Object.assign({}, mods[te.key] || {}, rec) }) });
      else if (te) S({ added: added.map(a => a.key === te.key ? Object.assign({}, a, rec) : a) });
      else S({ added: added.concat([Object.assign({ on:true, ms0:220 }, rec)]) });
      S({ dlg:false, target:null, f:null, tried:false }); flash(t.saved.replace('%s', L(rec.en, rec.ar))); };
    const nOn = provOff ? 0 : EM.filter(e => e.on).length;
    const msUsed = {}; EM.forEach(e => e.ms.forEach(m => { msUsed[m] = 1; }));
    const KI = { all:'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z', on:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', globe:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z', pub:'M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2' };
    const kpis = [ [EM.length,'k-ink',KI.all], [nOn, provOff ? 'k-red' : 'k-rasp',KI.on], [Object.keys(msUsed).length,'k-coral',KI.globe], [EM.filter(e => !e.login).length,'k-yel',KI.pub] ].map((x, i) => ({ l:t.kp[i], v:fmt(x[0]), n:t.kn[i], cls:x[1], d:x[2] }));
    const sh = this.shell(ar, 'admin', 'ai', null, [ { label: L('Admin','الإدارة'), href:'/admin' }, { label: L('AI embeds','أدوات الذكاء الاصطناعي') } ]);
    const COLS = ['#A39089','#CE3F3F','#EE3E43','#CD3151','#3B2F92','#2FC4DB'];
    return Object.assign(base, {
      t, sh, kpis, embeds, provOff, route:'/admin/ai-embeds',
      newEmbed: () => S({ dlg:true, target:null, f:null, tried:false }), dlgOpen: !!dlg, closeDlg: () => S({ dlg:false, target:null, f:null, tried:false }),
      fm: te ? { ey:t.editEy, h: L(te.en, te.ar), btn:t.saveB } : { ey:t.newEy, h:t.newH, btn:t.createB },
      f: Object.assign({}, f0, { loginCls: f0.login ? 'on' : '', loginA: f0.login ? 'true' : 'false' }), fe, on, save, urlLbl: f0.kind === 'iframe' ? t.iframeUrl : t.scriptUrl,
      kindSeg: ['chat','iframe','voice'].map(k => ({ l:t.kinds[k], cls: f0.kind === k ? 'is-on' : '', on: f0.kind === k ? 'true' : 'false', pick: () => setF({ kind:k }) })),
      swatches: COLS.map(c => ({ c, on: f0.c.toUpperCase() === c ? 'true' : 'false', pick: () => setF({ c }) })),
      msChips: Object.keys(MS).map(k => ({ l: L(MS[k][0], MS[k][1]), c: MS[k][2], on: f0.ms.indexOf(k) >= 0 ? 'true' : 'false', tog: () => setF({ ms: f0.ms.indexOf(k) >= 0 ? f0.ms.filter(x => x !== k) : f0.ms.concat([k]) }) })),
      specSegs: [ seg('State','screen',[['list','List',{ dlg:undefined, target:undefined, tests:undefined }],['edit','Edit dialog',{ dlg:undefined, target:undefined, f:null, tried:false }],['testing','Testing',{ dlg:undefined, target:undefined, tests:undefined }],['disabled','Provider disabled',{ dlg:undefined, target:undefined, tests:undefined }]]) ]
    });
  }

}
