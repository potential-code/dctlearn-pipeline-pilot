// Ported verbatim from the Claude Design artboard P58-AchievementsAdmin (DCLogic class).
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

    const MS = { employees:['DCT Employees','موظفو الدائرة','#EE3E43'], znm:['Zayed National Museum','متحف زايد الوطني','#3B2F92'], zu:['ZU 24-Hour Challenge','تحدي جامعة زايد','#F7C337'], museopro:['MuseoPro','ميوزيو برو','#E35E3C'], nibras:['Nibras — AI Champions','نبراس','#2FC4DB'] };
    const t = ar ? {
      spec:'الإنجازات', ey:'التعلّم · الإنجازات', h1:'إدارة الإنجازات', sub:'الشارات وسجل النقاط ومراجعة الشهادات الخارجية. كل تعديل يدوي أو قرار يُسجَّل في سجل التدقيق.', tabsLbl:'أقسام الإنجازات', tabs:['الشارات','سجل النقاط','الشهادات الخارجية'],
      newBadge:'شارة جديدة', adjust:'تعديل النقاط', kp:['الشارات','النقاط الممنوحة','تعديلات يدوية','شهادات بانتظار المراجعة'], kn:['قواعد تلقائية ويدوية','لكل المتعلّمين','هذا الشهر','رفعها المتعلّمون'],
      awarded:'حاصل عليها', edit:'تحرير', rules:{ courses_completed:'إكمال %n دورة', points_total:'جمع %n نقطة', streak_days:'التعلّم %n أيام متتالية', manual:'تُمنح يدوياً' }, ruleN:{ courses_completed:'عدد الدورات المكتملة', points_total:'إجمالي النقاط', streak_days:'أيام متتالية', manual:'يدوي' },
      searchL:'ابحث باسم المتعلّم', msLbl:'الموقع المصغّر', allMs:'كل المواقع المصغّرة', srcLbl:'المصدر', all:'الكل', src:{ unit:'درس', module:'وحدة', course:'دورة', assessment:'اختبار', manual:'يدوي' }, of:'من', entriesW:'قيود',
      ledger:'سجل النقاط', ledgerH:'من 1 أغسطس إلى اليوم', thDate:'التاريخ', thLearner:'المتعلّم', thSrc:'المصدر', thDetail:'التفاصيل', thPts:'النقاط', balances:'الأرصدة', by:'بواسطة عائشة المرزوقي',
      review:'مراجعة', cqTitle:'شهادة خارجية بانتظار المراجعة', pending:'معلّقة', uploaded:'رُفعت في 5 أكتوبر 2026', openFile:'فتح الملف', hamad:'حمد المزروعي', course:'الدورة', c19:'أخلاقيات الذكاء الاصطناعي', ms:'الموقع المصغّر', nibras:'نبراس', track:'المسار', aware:'الوعي بالذكاء الاصطناعي', onTxt:'تاريخ الرفع', upOn:'5 أكتوبر 2026، 18:42 بتوقيت الخليج', docAlt:'معاينة الشهادة المرفوعة: Ethics of AI، حمد المزروعي',
      apH:'الاعتماد يُكمل الدورة', apP:'تُسجَّل الدورة C19 مكتملة، وتُمنح 50 نقطة مرة واحدة، ويُبلَّغ المتعلّم.', approve:'اعتماد', reject:'رفض مع ملاحظة', clearH:'لا توجد شهادات بانتظار المراجعة', clearP:'ستظهر هنا الشهادات التي يرفعها متعلّمو نبراس.',
      certHist:'السجل', thDec:'القرار', thNote:'ملاحظة', approved:'معتمدة', rejected:'مرفوضة', pend:'معلّقة',
      close:'إغلاق', cancel:'إلغاء', newEy:'شارة جديدة', newH:'إنشاء شارة', editEy:'تحرير شارة', createB:'إنشاء الشارة', saveB:'حفظ الشارة', nameEn:'الاسم (بالإنجليزية)', nameAr:'الاسم (بالعربية)', descL:'الوصف', ruleL:'القاعدة', thr:'الحد', thErr:'رقم صحيح من 1 إلى 10,000', req:'مطلوب', colour:'اللون', shape:'الشكل', icon:'الأيقونة', preview:'معاينة', shapes:{ quarter:'ربع دائرة', circle:'دائرة', diamond:'معيّن' },
      adjEy:'نقاط يدوية', ptsLbl:'النقاط (±)', pErr:'رقم صحيح غير صفري بين −500 و500', reason:'السبب', rReq:'اذكر سبب التعديل', rLong:'240 حرفاً كحد أقصى', audH:'يُسجَّل في سجل التدقيق', audP:'يظهر التعديل في سجل المتعلّم باسمك وسببه، ولا يمكن حذفه.', adjBtn:'تسجيل التعديل', bal:'الرصيد الحالي: %n نقطة',
      rjEy:'رفض الشهادة', rjH:'رفض شهادة «أخلاقيات الذكاء الاصطناعي»؟', rjP:'يتلقى حمد ملاحظتك ويمكنه رفع ملف جديد. تبقى الدورة غير مكتملة.', note:'ملاحظة للمتعلّم', nReq:'اكتب سبب الرفض', nLong:'1,000 حرف كحد أقصى',
      tBadge:'تم حفظ الشارة «%s»', tAdj:'تم تسجيل %p نقطة لـ%u', tAppr:'تم اعتماد الشهادة — اكتملت C19 لحمد ومُنح 50 نقطة', tRej:'تم رفض الشهادة وإرسال ملاحظتك إلى حمد', fix:'صحّح الحقول المظلّلة'
    } : {
      spec:'Achievements', ey:'Learning · Achievements', h1:'Achievements administration', sub:'Badges, the points register and external-certificate review. Every manual change or decision is written to the audit log.', tabsLbl:'Achievement sections', tabs:['Badges','Points register','External certificates'],
      newBadge:'New badge', adjust:'Adjust points', kp:['Badges','Points awarded','Manual adjustments','Certificates to review'], kn:['automatic and manual rules','across all learners','this month','uploaded by learners'],
      awarded:'awarded', edit:'Edit', rules:{ courses_completed:'Complete %n courses', courses_completed1:'Complete 1 course', points_total:'Earn %n points', streak_days:'Learn %n days in a row', manual:'Awarded manually' }, ruleN:{ courses_completed:'Courses completed', points_total:'Points total', streak_days:'Streak days', manual:'Manual' },
      searchL:'Search by learner', msLbl:'Microsite', allMs:'All microsites', srcLbl:'Source', all:'All', src:{ unit:'Unit', module:'Module', course:'Course', assessment:'Assessment', manual:'Manual' }, of:'of', entriesW:'entries',
      ledger:'Points ledger', ledgerH:'1 Aug – today', thDate:'Date', thLearner:'Learner', thSrc:'Source', thDetail:'Detail', thPts:'Points', balances:'Balances', by:'by Aisha Al Marzouqi',
      review:'Review', cqTitle:'External certificate waiting for review', pending:'Pending', uploaded:'uploaded 5 Oct 2026', openFile:'Open file', hamad:'Hamad Al Mazrouei', course:'Course', c19:'Ethics of AI', ms:'Microsite', nibras:'Nibras — AI Champions', track:'Track', aware:'AI Aware', onTxt:'Uploaded', upOn:'5 Oct 2026, 18:42 Gulf', docAlt:'Preview of the uploaded certificate: Ethics of AI, Hamad Al Mazrouei',
      apH:'Approving completes the course', apP:'C19 is marked complete, 50 points are awarded once and the learner is notified.', approve:'Approve', reject:'Reject with note', clearH:'No certificates waiting', clearP:'Certificates uploaded by Nibras learners appear here.',
      certHist:'History', thDec:'Decision', thNote:'Note', approved:'Approved', rejected:'Rejected', pend:'Pending',
      close:'Close', cancel:'Cancel', newEy:'New badge', newH:'Create badge', editEy:'Edit badge', createB:'Create badge', saveB:'Save badge', nameEn:'Name (English)', nameAr:'Name (Arabic)', descL:'Description', ruleL:'Rule', thr:'Threshold', thErr:'A whole number from 1 to 10,000', req:'Required', colour:'Colour', shape:'Shape', icon:'Icon', preview:'Preview', shapes:{ quarter:'Quarter', circle:'Circle', diamond:'Diamond' },
      adjEy:'Manual points', ptsLbl:'Points (±)', pErr:'A non-zero whole number between −500 and 500', reason:'Reason', rReq:'Give a reason for the adjustment', rLong:'240 characters max', audH:'Recorded in the audit log', audP:'The adjustment appears in the learner’s ledger with your name and reason, and cannot be deleted.', adjBtn:'Record adjustment', bal:'Current balance: %n pts',
      rjEy:'Reject certificate', rjH:'Reject the “Ethics of AI” certificate?', rjP:'Hamad receives your note and can upload a new file. The course stays incomplete.', note:'Note to the learner', nReq:'Explain why it is rejected', nLong:'1,000 characters max',
      tBadge:'Badge “%s” saved', tAdj:'%p points recorded for %u', tAppr:'Certificate approved — C19 completed for Hamad, 50 points awarded', tRej:'Certificate rejected — your note was sent to Hamad', fix:'Fix the highlighted fields'
    };
    const IC = { star:'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z', book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5', spark:'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z', chat:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', flag:'M4 22V4M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1' };
    const COLS = [['#1D1650','Indigo','نيلي'],['#CD3151','Raspberry','توتي'],['#D63539','Red','أحمر'],['#E35E3C','Coral','مرجاني'],['#F7C337','Yellow','أصفر'],['#3B2F92','Violet','بنفسجي']];
    const BD0 = [
      { key:'course-completion', en:'Course completion', ar:'إكمال الدورة', desc:L('Your first completed course on DCT Learn.','أول دورة تكملها على DCT Learn.'), rule:'courses_completed', th:1, n:6, img:true, c:'#CD3151', shape:'quarter', icon:'book' },
      { key:'culture-explorer', en:'Culture explorer', ar:'مستكشف الثقافة', desc:L('Three courses completed, in any microsite.','ثلاث دورات مكتملة في أي موقع مصغّر.'), rule:'courses_completed', th:3, n:1, c:'#3B2F92', shape:'diamond', icon:'flag' },
      { key:'points-250', en:'250 club', ar:'نادي 250', desc:L('Earned 250 points or more.','جمعت 250 نقطة أو أكثر.'), rule:'points_total', th:250, n:2, c:'#F7C337', shape:'circle', icon:'star' },
      { key:'ai-aware', en:'AI Aware', ar:'واعٍ بالذكاء الاصطناعي', desc:L('Completed the Nibras AI Aware track.','أكمل مسار الوعي بالذكاء الاصطناعي في نبراس.'), rule:'manual', th:0, n:1, c:'#E35E3C', shape:'quarter', icon:'spark' },
      { key:'mentoring-milestone', en:'Mentoring milestone', ar:'محطة الإرشاد', desc:L('First mentoring session completed with feedback.','أول جلسة إرشاد مكتملة مع التقييم.'), rule:'manual', th:0, n:1, c:'#D63539', shape:'diamond', icon:'chat' }
    ];
    const U = { saeed:['Saeed Al Hammadi','سعيد الحمادي','SA','#D63539','employees',280], mona:['Mona Al Ameri','منى العامري','MA','#E35E3C','employees',40], yousef:['Yousef Al Zaabi','يوسف الزعابي','YZ','#3B2F92','znm',310], reem:['Reem Al Shamsi','ريم الشامسي','RS','#2D2470','znm',200], ahmed:['Ahmed Khan','أحمد خان','AK','#1D1650','zu',130], sara:['Sara Haddad','سارة حداد','SH','#CD3151','zu',90], elise:['Élise Martin','إليز مارتن','EM','#E35E3C','museopro',140], hamad:['Hamad Al Mazrouei','حمد المزروعي','HM','#CD3151','nibras',150] };
    const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'], MA = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر'];
    const D = (d, m) => d + ' ' + (ar ? MA[m - 1] : M[m - 1]) + ' 2026';
    const LED0 = [ [5,10,'yousef','znm','unit',L('C11 Operational Readiness – Role-Specific','C11 الجاهزية التشغيلية – حسب الدور'),10], [4,10,'saeed','employees','unit',L('C02 Museum 101 · Unit 3','C02 المتاحف 101 · الدرس 3'),10], [30,9,'ahmed','zu','course',L('C13 24 Hour Challenge','C13 تحدي 24 ساعة'),50], [29,9,'elise','museopro','unit',L('C15 Conservation and Exhibition of Artefacts','C15 صون وعرض القطع'),10],
      [28,9,'hamad','nibras','course',L('C18 Introduction to Generative AI — external certificate approved','C18 مقدمة في الذكاء الاصطناعي التوليدي — اعتماد شهادة خارجية'),50], [22,9,'reem','employees','course',L('C01 DCT World','C01 عالم الدائرة'),50], [20,9,'saeed','employees','assessment',L('C01 DCT World final check — passed','C01 التحقق النهائي — ناجح'),20], [20,9,'saeed','employees','course',L('C01 DCT World','C01 عالم الدائرة'),50],
      [15,9,'mona','employees','unit',L('C01 DCT World · Unit 1','C01 عالم الدائرة · الدرس 1'),10], [2,9,'yousef','znm','course',L('C10 Operational Readiness – Induction','C10 الجاهزية التشغيلية – التعريف'),50], [18,8,'saeed','employees','course',L('C03 DCTLEARN','C03 منصة DCT Learn'),50], [1,8,'elise','museopro','course',L('C14 Condition Report: General Presentation','C14 تقرير الحالة'),50] ]
      .map(x => ({ at:D(x[0], x[1]), u:x[2], ms:x[3], src:x[4], detail:x[5], p:x[6] }));
    const tab = st('tab') || 'badges';
    const dlgP = this.props.dlg && this.props.dlg !== 'none' ? this.props.dlg : null;
    const dlg = this.state.dlg !== undefined ? this.state.dlg : dlgP;
    const bMods = this.state.bMods || {}; const bAdded = this.state.bAdded || [];
    const BD = BD0.map(b => Object.assign({}, b, bMods[b.key] || {})).concat(bAdded);
    const ruleTxt = (b) => (b.rule === 'courses_completed' && b.th === 1 && t.rules.courses_completed1 ? t.rules.courses_completed1 : t.rules[b.rule]).replace('%n', fmt(b.th));
    const badges = BD.map((b, i) => ({ hid:'bd-' + i, name: L(b.en, b.ar), desc: b.desc, rule: ruleTxt(b), rCls: b.rule === 'manual' ? 'warn' : 'info', n: fmt(b.n), isImg: !!b.img, isShape: !b.img, img: B('bb705401394f18f4059a3d2fb23a902e'), alt: L(b.en, b.ar), c: b.c, shape: b.shape, yel: b.c === '#F7C337' ? 'yel' : '', d: IC[b.icon], edit: () => S({ dlg:'badge', bKey:b.key, bf:null, bTried:false }) }));
    // badge form
    const bTarget = dlg === 'badge' ? (this.state.bKey !== undefined ? this.state.bKey : (dlgP === 'badge' ? 'culture-explorer' : null)) : null;
    const tb = BD.find(b => b.key === bTarget);
    const bf0 = Object.assign({}, tb || { en:'', ar:'', desc:'', rule:'courses_completed', th:5, c:'#CD3151', shape:'quarter', icon:'star' }, this.state.bf || {});
    const setBf = (o) => S({ bf: Object.assign({}, this.state.bf || {}, o) });
    const bTried = !!this.state.bTried;
    const thN = Number(bf0.th); const thBad = bf0.rule !== 'manual' && !(Number.isInteger(thN) && thN >= 1 && thN <= 10000);
    const be = { en: bTried && !String(bf0.en).trim(), ar: bTried && !String(bf0.ar).trim(), th: bTried && thBad }; be.enCls = be.en ? 'is-error' : ''; be.arCls = be.ar ? 'is-error' : ''; be.thCls = be.th ? 'is-error' : '';
    const bf = Object.assign({}, bf0, { ey: tb ? t.editEy : t.newEy, h: tb ? L(tb.en, tb.ar) : t.newH, btn: tb ? t.saveB : t.createB, hasTh: bf0.rule !== 'manual', d: IC[bf0.icon], yel: bf0.c === '#F7C337' ? 'yel' : '',
      nameShow: L(bf0.en, bf0.ar) || L('Badge name','اسم الشارة'), ruleShow: bf0.rule === 'manual' ? t.rules.manual : t.rules[bf0.rule].replace('%n', fmt(bf0.th || 0)) });
    const bOn = {}; ['en','ar','desc','rule','th'].forEach(k => { bOn[k] = (e) => setBf({ [k]: e.target.value }); });
    const saveBadge = () => { if (!String(bf0.en).trim() || !String(bf0.ar).trim() || thBad) { S({ bTried:true }); return; }
      const rec = { en:bf0.en, ar:bf0.ar, desc:bf0.desc, rule:bf0.rule, th: bf0.rule === 'manual' ? 0 : thN, c:bf0.c, shape:bf0.shape, icon:bf0.icon };
      if (tb && BD0.find(b => b.key === tb.key)) S({ bMods: Object.assign({}, bMods, { [tb.key]: Object.assign({}, bMods[tb.key] || {}, rec, { img:false }) }) });
      else if (tb) S({ bAdded: bAdded.map(b => b.key === tb.key ? Object.assign({}, b, rec) : b) });
      else S({ bAdded: bAdded.concat([Object.assign({ key:'new-' + bAdded.length, n:0 }, rec)]) });
      S({ dlg:null, bf:null, bTried:false, bKey:undefined }); flash(t.tBadge.replace('%s', L(rec.en, rec.ar))); };
    // points
    const adj = this.state.adj || [];
    const certSt = this.state.certSt || 'pending';
    const extra = certSt === 'approved' ? [{ at:D(6, 10), u:'hamad', ms:'nibras', src:'course', detail:L('C19 Ethics of AI — external certificate approved','C19 أخلاقيات الذكاء الاصطناعي — اعتماد شهادة خارجية'), p:50 }] : [];
    const LED = adj.concat(extra).concat(LED0);
    const pq = (this.state.pq || '').toLowerCase(), pms = this.state.pms || 'all', psrc = this.state.psrc || 'all';
    const ledF = LED.filter(r => (pms === 'all' || r.ms === pms) && (psrc === 'all' || r.src === psrc) && (!pq || (U[r.u][0] + ' ' + U[r.u][1]).toLowerCase().indexOf(pq) >= 0));
    const sCls = { unit:'mut', module:'mut', course:'ok', assessment:'info', manual:'warn' };
    const ledger = ledF.map(r => ({ at:r.at, name: L(U[r.u][0], U[r.u][1]), ini: U[r.u][2], c: U[r.u][3], ms: L(MS[r.ms][0], MS[r.ms][1]), mc: MS[r.ms][2], src: t.src[r.src], sCls: sCls[r.src], detail: r.detail, by: r.src === 'manual' ? t.by : false,
      pts: (r.p > 0 ? '+' : '−') + fmt(Math.abs(r.p)), pCls: r.p > 0 ? 'pos' : 'neg', cls: r.fresh ? 'new' : '' }));
    const balOf = (k) => U[k][5] + adj.filter(a => a.u === k).reduce((s, a) => s + a.p, 0) + (k === 'hamad' && certSt === 'approved' ? 50 : 0);
    const bal = Object.keys(U).sort((a, b) => balOf(b) - balOf(a)).map((k, i) => ({ rk: fmt(i + 1), name: L(U[k][0], U[k][1]), ini: U[k][2], c: U[k][3], p: fmt(balOf(k)) }));
    const af0 = Object.assign({ u:'mona', p:'', r:'' }, this.state.af || {});
    const aTried = !!this.state.aTried;
    const pN = Number(af0.p); const pBad = !(Number.isInteger(pN) && pN !== 0 && Math.abs(pN) <= 500) || String(af0.p).trim() === '';
    const rBad = !af0.r.trim() || af0.r.length > 240;
    const ae = { p: aTried && pBad, pCls: aTried && pBad ? 'is-error' : '', r: aTried && rBad, rCls: aTried && rBad ? 'is-error' : '', rMsg: af0.r.length > 240 ? t.rLong : t.rReq };
    const setAf = (o) => S({ af: Object.assign({}, af0, o) });
    const doAdjust = () => { if (pBad || rBad) { S({ aTried:true }); return; } const row = { at:D(6, 10), u:af0.u, ms:U[af0.u][4], src:'manual', detail:af0.r.trim(), p:pN, fresh:true };
      S({ adj:[row].concat(adj.map(a => Object.assign({}, a, { fresh:false }))), dlg:null, af:null, aTried:false, tab:'points', psrc:'all' }); flash(t.tAdj.replace('%p', (pN > 0 ? '+' : '−') + fmt(Math.abs(pN))).replace('%u', L(U[af0.u][0], U[af0.u][1]))); };
    // certificates
    const note = this.state.note || ''; const nTried = !!this.state.nTried; const nBad = !note.trim() || note.length > 1000;
    const chist = (certSt !== 'pending' ? [{ course: L('C19 Ethics of AI','C19 أخلاقيات الذكاء الاصطناعي'), dec: certSt === 'approved' ? t.approved : t.rejected, cls: certSt === 'approved' ? 'ok' : 'bad', on: D(6, 10) + ' · ' + L('Aisha Al Marzouqi','عائشة المرزوقي'), note: this.state.rjNote || '—' }] : [])
      .concat([{ course: L('C18 Introduction to Generative AI','C18 مقدمة في الذكاء الاصطناعي التوليدي'), dec: t.approved, cls:'ok', on: D(28, 9) + ' · ' + L('Aisha Al Marzouqi','عائشة المرزوقي'), note:'—' }]);
    const pendingN = certSt === 'pending' ? 1 : 0;
    const totalPts = Object.keys(U).reduce((s, k) => s + balOf(k), 0);
    const KI = { badge:'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 23l5-3 5 3-1.2-9.1', star:IC.star, adj:'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6', cert:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15l2 2 4-4' };
    const kpis = [ [BD.length,'k-ink',KI.badge], [totalPts,'k-red k-long',KI.star], [adj.length,'k-rasp',KI.adj], [pendingN,'k-yel',KI.cert] ].map((x, i) => ({ l:t.kp[i], v:fmt(x[0]), n:t.kn[i], cls:x[1], d:x[2] }));
    const sh = this.shell(ar, 'admin', 'achievements', null, [ { label: L('Admin','الإدارة'), href:'/admin' }, { label: L('Achievements','الإنجازات') } ]);
    const close = () => S({ dlg:null, bf:null, bTried:false, af:null, aTried:false, note:'', nTried:false, bKey:undefined });
    return Object.assign(base, {
      t, sh, kpis, badges, route:'/admin/achievements', isBadges: tab === 'badges', isPoints: tab === 'points', isCerts: tab === 'certs',
      tabs: [['badges', t.tabs[0], BD.length], ['points', t.tabs[1], LED.length], ['certs', t.tabs[2], pendingN]].map(x => ({ l:x[1], n: fmt(x[2]), cls: tab === x[0] ? 'on' : '', cur: tab === x[0] ? 'page' : 'false', pick: () => S({ tab:x[0] }) })),
      newBadge: () => S({ dlg:'badge', bKey:null, bf:null, bTried:false }), badgeOpen: dlg === 'badge', bf, be, bOn, saveBadge, closeDlg: close,
      ruleOpts: Object.keys(t.ruleN).map(k => ({ v:k, l:t.ruleN[k] })),
      swatches: COLS.map(c => ({ c:c[0], l: L(c[1], c[2]), on: bf0.c === c[0] ? 'true' : 'false', pick: () => setBf({ c:c[0] }) })),
      shapeSeg: ['quarter','circle','diamond'].map(k => ({ l:t.shapes[k], cls: bf0.shape === k ? 'is-on' : '', on: bf0.shape === k ? 'true' : 'false', pick: () => setBf({ shape:k }) })),
      iconSeg: Object.keys(IC).map(k => ({ l:k, d:IC[k], cls: bf0.icon === k ? 'is-on' : '', on: bf0.icon === k ? 'true' : 'false', pick: () => setBf({ icon:k }) })),
      pq: this.state.pq || '', pms, onPq: (e) => S({ pq: e.target.value }), onPms: (e) => S({ pms: e.target.value }),
      msOpts: [{ v:'all', l:t.allMs }].concat(Object.keys(MS).map(k => ({ v:k, l: L(MS[k][0], MS[k][1]) }))),
      srcChips: ['all','unit','course','assessment','manual'].map(k => ({ l: k === 'all' ? t.all : t.src[k], on: psrc === k ? 'true' : 'false', pick: () => S({ psrc:k }) })),
      pCount: fmt(ledF.length) + ' ' + t.of + ' ' + fmt(LED.length) + ' ' + t.entriesW, ledger, bal,
      openAdjust: () => S({ dlg:'adjust', af:null, aTried:false }), adjOpen: dlg === 'adjust',
      af: Object.assign({}, af0, { balTxt: t.bal.replace('%n', fmt(balOf(af0.u))), rCtr: fmt(af0.r.length) + ' / ' + fmt(240) }), ae, aOn: { u: (e) => setAf({ u:e.target.value }), p: (e) => setAf({ p:e.target.value }), r: (e) => setAf({ r:e.target.value }) }, doAdjust,
      userOpts: Object.keys(U).map(k => ({ v:k, l: L(U[k][0], U[k][1]) })),
      hasPending: certSt === 'pending', noPending: certSt !== 'pending', chist,
      approveCert: () => { S({ certSt:'approved' }); flash(t.tAppr); }, askReject: () => S({ dlg:'reject', note:'', nTried:false }), rjOpen: dlg === 'reject' && certSt === 'pending',
      note, onNote: (e) => S({ note: e.target.value }), nErr: nTried && nBad, nCls: nTried && nBad ? 'is-error' : '', nMsg: note.length > 1000 ? t.nLong : t.nReq, nCtr: fmt(note.length) + ' / ' + fmt(1000), nCtrCls: note.length > 1000 ? 'over' : '',
      doReject: () => { if (nBad) { S({ nTried:true }); return; } S({ certSt:'rejected', rjNote: note.trim(), dlg:null, note:'' }); flash(t.tRej); },
      specSegs: [ seg('Tab','tab',[['badges','Badges',{ dlg:undefined }],['points','Points',{ dlg:undefined }],['certs','Certificates',{ dlg:undefined }]]),
        { label:'Dialog', btns: [['none','None',null,null],['badge','Badge editor','badges',{ bKey:'culture-explorer' }],['adjust','Adjust points','points',{}],['reject','Reject cert','certs',{}]].map(x => ({ label:x[1], cls: (dlg || 'none') === x[0] ? 'is-on' : '', pick: () => S(Object.assign({ dlg: x[0] === 'none' ? null : x[0], bf:null, bTried:false, af:null, aTried:false, note:'', nTried:false }, x[2] ? { tab:x[2] } : {}, x[3] || {})) })) } ]
    });
  }

}
