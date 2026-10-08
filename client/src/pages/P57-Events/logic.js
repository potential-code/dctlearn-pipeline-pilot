// Ported verbatim from the Claude Design artboard P57-Events (DCLogic class).
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
      spec:'الفعاليات وورش العمل', ey:'التعلّم · الفعاليات', h1:'الفعاليات وورش العمل', sub:'أنشئ الجلسات وورش العمل والتقييمات لكل موقع مصغّر، وألغِ ما يلزم، وأرفق التسجيلات بعد انتهائها.', create:'إنشاء فعالية', tabsLbl:'حالة الفعالية',
      tabs:['الكل','قادمة','مباشرة','سابقة','ملغاة'], search:'ابحث في الفعاليات', msLbl:'الموقع المصغّر', allMs:'كل المواقع المصغّرة', of:'من', evW:'فعالية',
      kp:['قادمة','مباشرة اليوم','سابقة','التسجيلات'], kn:['خلال 30 يوماً','تُعرض الآن','هذا العام','منشورة للمتعلّمين'],
      st:{ upcoming:'قادمة', live:'مباشرة الآن', past:'سابقة', cancelled:'ملغاة' }, cats:{ workshops:'ورش العمل', sessions:'الجلسات', assessments:'التقييمات', masterclass:'صف متقدم' },
      gulf:'بتوقيت الخليج', recording:'التسجيل', recPubL:'منشور', recDraftL:'غير منشور', reason:'سبب الإلغاء', edit:'تحرير', cancelEv:'إلغاء الفعالية', addRec:'إرفاق تسجيل', repRec:'تغيير التسجيل', cancelledNote:'أُبلغ المشاركون بالبريد',
      noRes:'لا توجد فعاليات هنا', noResB:'غيّر التبويب أو عامل التصفية، أو أنشئ فعالية جديدة.',
      newEy:'فعالية جديدة', newH:'إنشاء فعالية', editEy:'تحرير', createBtn:'إنشاء الفعالية', saveBtn:'حفظ التغييرات', close:'إغلاق', cancel:'إلغاء',
      fEn:'العنوان (بالإنجليزية)', fAr:'العنوان (بالعربية)', fCat:'الفئة', fDate:'التاريخ', fStart:'البداية', fEnd:'النهاية', tz:'الأوقات بتوقيت الخليج (UTC+4) وتُخزَّن بالتوقيت العالمي.', fMs:'المواقع المصغّرة', fWhere:'المكان', mVenue:'في الموقع', mOnline:'عبر Zoom', fVenue:'المكان', phVenue:'مثال: متحف زايد الوطني، السعديات', fZoom:'رابط Zoom',
      errH:'راجِع الحقول المظلّلة', errP:'لم تُحفظ الفعالية بعد.', req:'هذا الحقل مطلوب', dErr:'اختر تاريخاً', tErr:'يجب أن تكون النهاية بعد البداية', msErr:'اختر موقعاً مصغّراً واحداً على الأقل', httpsErr:'أدخل رابطاً يبدأ بـ https://',
      cxEy:'إلغاء الفعالية', cxH:'إلغاء «%s»؟', cxP:'تصبح الفعالية «ملغاة» ويتلقى المسجّلون رسالة بالسبب. يُسجَّل هذا الإجراء في سجل التدقيق.', keep:'الإبقاء على الفعالية', cxBtn:'إلغاء الفعالية', rReq:'اذكر سبب الإلغاء', rLong:'1,000 حرف كحد أقصى',
      recEy:'التسجيل', recH:'تسجيل «%s»', recUrl:'رابط التسجيل', recHint:'روابط https فقط، من مضيف فيديو معتمد.', recPub:'نشر للمتعلّمين', recPubH:'يظهر في تبويب ورش العمل كـ«تسجيل»', recSave:'حفظ التسجيل',
      created:'تم إنشاء «%s»', updated:'تم حفظ «%s»', cancelled:'تم إلغاء «%s» وإبلاغ المشاركين', recSaved:'تم إرفاق التسجيل بـ«%s»',
      days:['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'], mons:['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    } : {
      spec:'Events & workshops', ey:'Learning · Events', h1:'Events & workshops', sub:'Create sessions, workshops and assessments for each microsite, cancel when plans change and attach recordings afterwards.', create:'Create event', tabsLbl:'Event status',
      tabs:['All','Upcoming','Live','Past','Cancelled'], search:'Search events', msLbl:'Microsite', allMs:'All microsites', of:'of', evW:'events',
      kp:['Upcoming','Live today','Past','Recordings'], kn:['in the next 30 days','happening now','this year','published to learners'],
      st:{ upcoming:'Upcoming', live:'Live now', past:'Past', cancelled:'Cancelled' }, cats:{ workshops:'Workshops', sessions:'Sessions', assessments:'Assessments', masterclass:'Masterclass' },
      gulf:'Gulf', recording:'Recording', recPubL:'Published', recDraftL:'Not published', reason:'Cancellation reason', edit:'Edit', cancelEv:'Cancel event', addRec:'Attach recording', repRec:'Change recording', cancelledNote:'Participants were e-mailed',
      noRes:'No events here', noResB:'Change the tab or filter, or create a new event.',
      newEy:'New event', newH:'Create event', editEy:'Edit', createBtn:'Create event', saveBtn:'Save changes', close:'Close', cancel:'Cancel',
      fEn:'Title (English)', fAr:'Title (Arabic)', fCat:'Category', fDate:'Date', fStart:'Starts', fEnd:'Ends', tz:'Times are in Gulf time (UTC+4) and stored in UTC.', fMs:'Microsites', fWhere:'Where', mVenue:'In person', mOnline:'On Zoom', fVenue:'Venue', phVenue:'e.g. Zayed National Museum, Saadiyat', fZoom:'Zoom link',
      errH:'Check the highlighted fields', errP:'The event hasn’t been saved yet.', req:'This field is required', dErr:'Choose a date', tErr:'The end time must be after the start', msErr:'Choose at least one microsite', httpsErr:'Enter a link starting with https://',
      cxEy:'Cancel event', cxH:'Cancel “%s”?', cxP:'The event becomes “cancelled” and registered participants get an e-mail with your reason. This is recorded in the audit log.', keep:'Keep event', cxBtn:'Cancel event', rReq:'Give a reason for cancelling', rLong:'1,000 characters max',
      recEy:'Recording', recH:'Recording for “%s”', recUrl:'Recording link', recHint:'https links only, from an approved video host.', recPub:'Publish to learners', recPubH:'Shown in the Workshops tab as a recording', recSave:'Save recording',
      created:'“%s” created', updated:'“%s” saved', cancelled:'“%s” cancelled — participants notified', recSaved:'Recording attached to “%s”',
      days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], mons:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    };
    const SEEDEV = [
      { id:'e1', en:'Mentoring Kick-off Session', ar:'جلسة انطلاق الإرشاد', cat:'sessions', ms:['elevate'], date:'2026-10-08', s:'10:00', e:'11:00', mode:'online', zoom:'https://zoom.example/kickoff', venue:'', st:'upcoming' },
      { id:'e2', en:'Museum Safety Briefing', ar:'إحاطة السلامة في المتحف', cat:'assessments', ms:['znm'], date:'2026-10-06', s:'09:00', e:'10:00', mode:'venue', venue:'Zayed National Museum, Saadiyat', venueAr:'متحف زايد الوطني، السعديات', zoom:'', st:'live' },
      { id:'e3', en:'Creative Economy Masterclass', ar:'الصف المتقدم في الاقتصاد الإبداعي', cat:'workshops', ms:['employees'], date:'2026-09-10', s:'11:00', e:'13:00', mode:'online', zoom:'https://zoom.example/masterclass', venue:'', st:'past', rec:'https://video.example/masterclass', recPub:true }
    ];
    const screen = st('screen') || 'list';
    const evMods = this.state.evMods || {};
    const added = this.state.added || [];
    const EV = added.concat(SEEDEV).map(e => Object.assign({}, e, evMods[e.id] || {}));
    const tab = this.state.tab || 'all';
    const q = (this.state.q || '').toLowerCase(), ms = this.state.ms || 'all';
    const base0 = EV.filter(e => (ms === 'all' || e.ms.indexOf(ms) >= 0) && (!q || (e.en + ' ' + e.ar).toLowerCase().indexOf(q) >= 0));
    const list = base0.filter(e => tab === 'all' || e.st === tab);
    // dialogs
    let dlg = this.state.dlg, target = this.state.target;
    if (dlg === undefined) { dlg = { create:'form', edit:'form', cancel:'cancel', recording:'rec' }[screen] || null; target = { edit:'e1', cancel:'e1', recording:'e2' }[screen] || null; }
    const tgt = EV.find(e => e.id === target);
    const blank = { en:'', ar:'', cat:'workshops', ms:[], date:'2026-10-20', s:'10:00', e:'11:00', mode:'venue', venue:'', zoom:'' };
    const f = Object.assign({}, tgt && dlg === 'form' ? tgt : blank, this.state.f || {});
    const tried = !!this.state.tried;
    const setF = (o) => S({ f: Object.assign({}, this.state.f || {}, o) });
    const httpsOk = (u) => /^https:\/\/[^\s.]+\.[^\s]+$/.test((u || '').trim());
    const er = { en: !f.en.trim(), ar: !f.ar.trim(), d: !f.date, t: !(f.e > f.s), ms: f.ms.length === 0, v: f.mode === 'venue' && !(f.venue || '').trim(), z: f.mode === 'online' && !httpsOk(f.zoom) };
    const anyErr = Object.keys(er).some(k => er[k]);
    const fe = {}; Object.keys(er).forEach(k => { fe[k] = tried && er[k]; fe[k + 'Cls'] = tried && er[k] ? 'is-error' : ''; }); fe.any = tried && anyErr;
    const on = {}; ['en','ar','cat','date','s','e','venue','zoom'].forEach(k => { on[k] = (ev) => setF({ [k]: ev.target.value }); });
    const togMs = (k) => setF({ ms: f.ms.indexOf(k) >= 0 ? f.ms.filter(x => x !== k) : f.ms.concat([k]) });
    const close = () => S({ dlg:null, target:null, f:null, tried:false, reason:'', rTried:false, recUrl:null, ruTried:false });
    const submit = () => {
      if (anyErr) { S({ tried:true }); return; }
      const rec = { en:f.en.trim(), ar:f.ar.trim(), cat:f.cat, ms:f.ms, date:f.date, s:f.s, e:f.e, mode:f.mode, venue:f.venue, venueAr:f.venue, zoom:f.zoom };
      if (tgt) { S({ evMods: Object.assign({}, evMods, { [tgt.id]: Object.assign({}, evMods[tgt.id] || {}, rec) }) }); close(); flash(t.updated.replace('%s', ar ? rec.ar : rec.en)); }
      else { const id = 'n' + (added.length + 1); S({ added: [Object.assign({ id, st:'upcoming' }, rec)].concat(added), tab:'all' }); close(); flash(t.created.replace('%s', ar ? rec.ar : rec.en)); }
    };
    // cancel
    const reason = this.state.reason || '';
    const rTried = !!this.state.rTried;
    const rBad = !reason.trim() || reason.length > 1000;
    const doCancel = () => { if (rBad) { S({ rTried:true }); return; } S({ evMods: Object.assign({}, evMods, { [tgt.id]: Object.assign({}, evMods[tgt.id] || {}, { st:'cancelled', reason: reason.trim() }) }) }); const n = ar ? tgt.ar : tgt.en; close(); flash(t.cancelled.replace('%s', n)); };
    // recording
    const recUrl = this.state.recUrl != null ? this.state.recUrl : (tgt && tgt.rec) || '';
    const ruTried = !!this.state.ruTried, ruBad = !httpsOk(recUrl);
    const recPub = this.state.recPub !== undefined ? this.state.recPub : true;
    const doRec = () => { if (ruBad) { S({ ruTried:true }); return; } S({ evMods: Object.assign({}, evMods, { [tgt.id]: Object.assign({}, evMods[tgt.id] || {}, { rec: recUrl.trim(), recPub }) }) }); const n = ar ? tgt.ar : tgt.en; close(); flash(t.recSaved.replace('%s', n)); };
    const P = { venue:'M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', online:'M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z' };
    const stCls = { upcoming:'info', live:'bad', past:'mut', cancelled:'mut' };
    const evs = list.map(e => { const d = new Date(e.date + 'T00:00:00Z'); const c = MS[e.ms[0]][2];
      return { hid:'ev-' + e.id, title: ar ? e.ar : e.en, alt: ar ? e.en : e.ar, altLang: ar ? 'en' : 'ar', altDir: ar ? 'ltr' : 'rtl',
        wd: t.days[d.getUTCDay()], day: String(d.getUTCDate()).padStart(2, '0'), mon: t.mons[d.getUTCMonth()], yr: String(d.getUTCFullYear()), c, lt: c === '#F7C337' ? 'lt' : '',
        stL: t.st[e.st], stCls: stCls[e.st], liveCls: e.st === 'live' ? 'live' : '', cat: t.cats[e.cat], ms: e.ms.map(m => ({ n: L(MS[m][0], MS[m][1]), c: MS[m][2] })),
        when: e.s + '–' + e.e, placeD: P[e.mode], place: e.mode === 'venue' ? (ar ? (e.venueAr || e.venue) : e.venue) : e.zoom, placeCls: e.mode === 'venue' ? '' : 'mono',
        hasRec: !!e.rec, rec: e.rec || '', recL: e.recPub ? t.recPubL : t.recDraftL, recCls: e.recPub ? 'ok' : 'warn', hasReason: e.st === 'cancelled' && !!e.reason, reason: e.reason || '',
        cx: e.st === 'cancelled' ? 'cx' : '', canEdit: e.st !== 'cancelled', canCancel: e.st === 'upcoming', canRec: e.st === 'past' || e.st === 'live', recBtn: e.rec ? t.repRec : t.addRec,
        edit: () => S({ dlg:'form', target:e.id, f:null, tried:false }), cancel: () => S({ dlg:'cancel', target:e.id, reason:'', rTried:false }), recDlg: () => S({ dlg:'rec', target:e.id, recUrl:null, ruTried:false, recPub: e.rec ? !!e.recPub : true }) }; });
    const cnt = (s) => base0.filter(e => s === 'all' || e.st === s).length;
    const tabsK = ['all','upcoming','live','past','cancelled'];
    const KI = { cal:'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM12 13v4M10 15h4', live:'M2 12a10 10 0 0 1 3-7M22 12a10 10 0 0 0-3-7M6 12a6 6 0 0 1 2-4.5M18 12a6 6 0 0 0-2-4.5M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 14v8', past:'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2', rec:'M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z' };
    const kpis = [ [EV.filter(e => e.st === 'upcoming').length,'k-ink',KI.cal], [EV.filter(e => e.st === 'live').length,'k-red',KI.live], [EV.filter(e => e.st === 'past').length,'k-rasp',KI.past], [EV.filter(e => e.rec && e.recPub).length,'k-yel',KI.rec] ].map((x, i) => ({ l:t.kp[i], v:fmt(x[0]), n:t.kn[i], cls:x[1], d:x[2] }));
    const sh = this.shell(ar, 'admin', 'events', null, [ { label: L('Admin','الإدارة'), href:'/admin' }, { label: L('Events','الفعاليات') } ]);
    const tN = tgt ? (ar ? tgt.ar : tgt.en) : '';
    const rLen = reason.length;
    return Object.assign(base, {
      t, sh, kpis, evs, route:'/admin/events', q: this.state.q || '', ms,
      tabs: tabsK.map((k, i) => ({ l: t.tabs[i], n: fmt(cnt(k)), cls: tab === k ? 'on' : '', cur: tab === k ? 'page' : 'false', pick: () => S({ tab:k }) })),
      msOpts: [{ v:'all', l:t.allMs }].concat(Object.keys(MS).map(k => ({ v:k, l: L(MS[k][0], MS[k][1]) }))),
      onQ: (e) => S({ q: e.target.value }), onMs: (e) => S({ ms: e.target.value }),
      countTxt: fmt(list.length) + ' ' + t.of + ' ' + fmt(EV.length) + ' ' + t.evW, noRes: list.length === 0,
      openCreate: () => S({ dlg:'form', target:null, f:null, tried:false }), closeDlg: close,
      formOpen: dlg === 'form', fm: tgt ? { ey:t.editEy, h:tN, btn:t.saveBtn } : { ey:t.newEy, h:t.newH, btn:t.createBtn }, f, fe, on, submit,
      catOpts: Object.keys(t.cats).map(k => ({ v:k, l:t.cats[k] })),
      msChips: Object.keys(MS).map(k => ({ l: L(MS[k][0], MS[k][1]), c: MS[k][2], on: f.ms.indexOf(k) >= 0 ? 'true' : 'false', tog: () => togMs(k) })),
      modeSeg: [['venue',t.mVenue],['online',t.mOnline]].map(x => ({ l:x[1], cls: f.mode === x[0] ? 'is-on' : '', on: f.mode === x[0] ? 'true' : 'false', pick: () => setF({ mode:x[0] }) })),
      isVenue: f.mode === 'venue', isOnline: f.mode === 'online',
      cxOpen: dlg === 'cancel' && !!tgt, cxH: t.cxH.replace('%s', tN), reason, onReason: (e) => S({ reason: e.target.value }), rErr: rTried && rBad, rCls: rTried && rBad ? 'is-error' : '', rMsg: rLen > 1000 ? t.rLong : t.rReq, rCtr: fmt(rLen) + ' / ' + fmt(1000), rCtrCls: rLen > 1000 ? 'over' : '', doCancel,
      recOpen: dlg === 'rec' && !!tgt, recH: t.recH.replace('%s', tN), recUrl, onRecUrl: (e) => S({ recUrl: e.target.value }), ruErr: ruTried && ruBad, ruCls: ruTried && ruBad ? 'is-error' : '', recPub: recPub ? 'true' : 'false', recPubCls: recPub ? 'on' : '', togRecPub: () => S({ recPub: !recPub }), doRec,
      specSegs: [ seg('State','screen',[['list','List',{ dlg:undefined }],['create','Create dialog',{ dlg:undefined, f:null, tried:false }],['edit','Edit dialog',{ dlg:undefined, f:null, tried:false }],['cancel','Cancel confirm',{ dlg:undefined, reason:'', rTried:false }],['recording','Attach recording',{ dlg:undefined, recUrl:null }]]) ]
    });
  }

}
