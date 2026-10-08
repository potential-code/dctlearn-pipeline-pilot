// Ported verbatim from the Claude Design artboard P31-Availability (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){
    super(p);
    this.state = { locale:null, init:null, rules:null, tz:'Asia/Dubai', toff:null, bk:{ B2:'confirmed', B4:'requested' }, wk:1, tried:false, dirty:false, dlg:null, toast:null };
  }

    /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  base(st){
    const R = { 0:[[600,780]], 1:[[600,780]], 2:[[600,780]], 3:[[600,780]], 4:[[600,780]], 5:[], 6:[] };
    if (st === 'overlap') R[1] = [[600,780],[720,840]];
    return R;
  }

  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const L = (en, a) => ar ? a : en;
    const S = this.state;
    const st = S.init || this.props.state || 'default';
    const set = (o) => this.setState(o);
    const rules = S.rules || this.base(st);
    const toff0 = [{ from:'2026-10-22', to:'2026-10-22', note:L('Abu Dhabi Museum Summit','قمة أبوظبي للمتاحف') }];
    const toff = S.toff || toff0;
    const tried = S.tried || st === 'overlap';
    const dlgSt = S.dlg === null ? (st === 'timeoff' ? { from:'2026-11-01', to:'2026-11-05', note:'', tried:false } : null) : S.dlg;
    const toastSt = S.toast === null && st === 'saved' ? { t:L('Availability saved','تم حفظ أوقات التوفر'), m:L('Mentees can now book 15 weekly slots. Existing bookings are unchanged.','يمكن للمتدرّبين الآن حجز 15 موعداً أسبوعياً. لم تتغيّر الحجوزات الحالية.') } : S.toast;

    const t = ar ? {
      spec:'أوقات التوفر', ey:'بوابة المرشدين', h1:'أوقات التوفر', sub:'حدّدي الساعات الأسبوعية التي يمكن للمتدرّبين الحجز فيها. مدة كل موعد 60 دقيقة بتوقيتك المحلي.',
      unsaved:'تغييرات غير محفوظة', discard:'تجاهل', save:'حفظ التغييرات', errSub:'صحّحي الفترات المتداخلة أو غير الصحيحة المحددة بالأحمر ثم احفظي مرة أخرى.',
      wrTitle:'القواعد الأسبوعية', wrSub:'تتكرر كل أسبوع حتى تغيّريها', unavailable:'غير متاحة', to:'إلى', addRange:'إضافة فترة',
      tzTitle:'المنطقة الزمنية', tzLabel:'منطقتك الزمنية', slotLen:'مدة الموعد', min60:'60 دقيقة',
      rqTitle:'الحجوزات', confirm:'تأكيد', decline:'رفض', cancel:'إلغاء', room:'غرفة الجلسة',
      toTitle:'الإجازات', addTo:'إضافة إجازة', noTo:'لا توجد إجازات مجدولة.',
      spTitle:'معاينة المواعيد', spSub:'مواعيد 60 دقيقة كما يراها المتدرّبون (تتحدّث مباشرة مع قواعدك)', prevWk:'الأسبوع السابق', nextWk:'الأسبوع التالي',
      toDlg:'إضافة إجازة', toDlgSub:'لن تظهر أي مواعيد في هذه الأيام.', from:'من', until:'حتى (شاملاً)', reason:'الملاحظة', optional:'(اختياري)', reasonPh:'مثلاً: إجازة سنوية', reasonHint:'لا تظهر للمتدرّبين.',
      clashT:'يوجد حجز في هذه الفترة', back:'رجوع', addToBtn:'إضافة الإجازة', close:'إغلاق'
    } : {
      spec:'Availability', ey:'Mentor portal', h1:'Availability', sub:'Set the weekly hours mentees can book. Every slot is 60 minutes, in your own time zone.',
      unsaved:'Unsaved changes', discard:'Discard', save:'Save changes', errSub:'Fix the overlapping or invalid ranges marked in red, then save again.',
      wrTitle:'Weekly rules', wrSub:'Repeats every week until you change it', unavailable:'Unavailable', to:'to', addRange:'Add range',
      tzTitle:'Time zone', tzLabel:'Your time zone', slotLen:'Slot length', min60:'60 min',
      rqTitle:'Bookings', confirm:'Confirm', decline:'Decline', cancel:'Cancel', room:'Session room',
      toTitle:'Time off', addTo:'Add time off', noTo:'No time off scheduled.',
      spTitle:'Slot preview', spSub:'60-minute slots as mentees see them (updates live with your rules)', prevWk:'Previous week', nextWk:'Next week',
      toDlg:'Add time off', toDlgSub:'No slots are offered on these days.', from:'From', until:'Until (inclusive)', reason:'Note', optional:'(optional)', reasonPh:'e.g. Annual leave', reasonHint:'Not shown to mentees.',
      clashT:'You have a booking in this range', back:'Back', addToBtn:'Add time off', close:'Close'
    };
    const sh = this.shell(ar, 'mentor', 'availability', null, [ { label: L('Mentor portal','بوابة المرشدين'), href:'/mentor' }, { label: L('Availability','أوقات التوفر') } ]);

    const DAYS = ar ? ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'] : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const DS = ar ? ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const hm = (m) => String(Math.floor(m / 60)).padStart(2,'0') + ':' + String(m % 60).padStart(2,'0');
    const toast = (tt, m) => { set({ toast:{ t:tt, m } }); clearTimeout(this._tt); this._tt = setTimeout(() => set({ toast:false }), 6000); };
    const upd = (o) => set({ ...o, dirty:true, init: st === 'saved' ? 'default' : (S.init || st) });

    /* validation per day */
    const dayErr = (rs) => {
      for (const r of rs) if (r[1] <= r[0]) return { bad:[r], msg:L('End time must be after start time (' + hm(r[0]) + ').','يجب أن يكون وقت الانتهاء بعد وقت البدء (' + hm(r[0]) + ').') };
      for (const r of rs) if (r[1] - r[0] < 60) return { bad:[r], msg:L('A range must fit at least one 60-minute slot.','يجب أن تتسع الفترة لموعد واحد على الأقل مدته 60 دقيقة.') };
      const so = rs.slice().sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < so.length; i++) if (so[i][0] < so[i-1][1]) return { bad:[so[i-1], so[i]], msg:L('Ranges overlap: ' + hm(so[i-1][0]) + '–' + hm(so[i-1][1]) + ' and ' + hm(so[i][0]) + '–' + hm(so[i][1]) + '. Merge them or change the times.','الفترتان متداخلتان: ' + hm(so[i-1][0]) + '–' + hm(so[i-1][1]) + ' و' + hm(so[i][0]) + '–' + hm(so[i][1]) + '. ادمجيهما أو غيّري الأوقات.') };
      return null;
    };
    let nErr = 0;
    const days = DAYS.map((name, i) => {
      const rs = rules[i] || [];
      const e = dayErr(rs); if (e) nErr++;
      const setR = (ri, k, v) => { const n = { ...rules, [i]: rs.map((r, j) => j === ri ? (k === 0 ? [v, r[1]] : [r[0], v]) : r) }; upd({ rules:n }); };
      return { name, on: rs.length ? 'true' : 'false', swCls: rs.length ? 'on' : '', off: rs.length === 0, swAria: L('Available on ' + name, 'متاحة يوم ' + name),
        cls: e && tried ? 'err' : (e ? 'err' : ''), err: !!e, errMsg: e ? e.msg : '',
        toggle: () => upd({ rules:{ ...rules, [i]: rs.length ? [] : [[600,780]] } }),
        add: () => { const last = rs.length ? Math.max(...rs.map(r => r[1])) : 540; const s0 = Math.min(last, 1200); upd({ rules:{ ...rules, [i]: rs.concat([[s0, Math.min(s0 + 60, 1260)]]) } }); },
        ranges: rs.map((r, j) => { const bad = !!(e && e.bad.includes(r)); return { s:String(r[0]), e:String(r[1]), cls: bad ? 'is-error' : '', bad: bad ? 'true' : 'false',
          dur: r[1] - r[0] >= 60 ? (n => L(n + (n === 1 ? ' slot' : ' slots'), n + (n === 1 ? ' موعد' : ' مواعيد')))(Math.floor((r[1] - r[0]) / 60)) : '—',
          sAria: L(name + ' start time','وقت البدء ' + name), eAria: L(name + ' end time','وقت الانتهاء ' + name), rmAria: L('Remove ' + hm(r[0]) + '–' + hm(r[1]) + ' on ' + name, 'حذف ' + hm(r[0]) + '–' + hm(r[1]) + ' يوم ' + name),
          setS: (ev) => setR(j, 0, +ev.target.value), setE: (ev) => setR(j, 1, +ev.target.value), rm: () => upd({ rules:{ ...rules, [i]: rs.filter((x, k) => k !== j) } }) }; }) };
    });

    /* slots */
    const slotsOf = (i) => { const out = []; (rules[i] || []).forEach(r => { if (r[1] <= r[0]) return; for (let s = r[0]; s + 60 <= r[1]; s += 60) if (!out.includes(s)) out.push(s); }); return out.sort((a, b) => a - b); };
    const weekly = [0,1,2,3,4,5,6].reduce((a, i) => a + slotsOf(i).length, 0);
    const hours = [0,1,2,3,4,5,6].reduce((a, i) => a + (rules[i] || []).reduce((x, r) => x + Math.max(0, r[1] - r[0]), 0), 0) / 60;
    const WEEKS = ['2026-10-04','2026-10-11','2026-10-18','2026-10-25'];
    const MON = ar ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const addD = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
    const wk0 = WEEKS[S.wk];
    const dates = [0,1,2,3,4,5,6].map(i => addD(wk0, i));
    const BOOK = { B2:{ date:'2026-10-12', s:660, ttl:L('Session 2 · Saeed Al Hammadi','الجلسة 2 · سعيد الحمادي'), when:L('Mon 12 Oct · 11:00–12:00 Gulf','الإثنين 12 أكتوبر · 11:00–12:00 بتوقيت الخليج') },
                   B4:{ date:'2026-10-14', s:600, ttl:L('Session 3 · Saeed Al Hammadi','الجلسة 3 · سعيد الحمادي'), when:L('Wed 14 Oct · 10:00–11:00 Gulf','الأربعاء 14 أكتوبر · 10:00–11:00 بتوقيت الخليج'), topic:L('“Review my one-page project brief” · requested Mon 5 Oct','«مراجعة موجز المشروع» · طُلبت الإثنين 5 أكتوبر') } };
    const inOff = (iso) => toff.some(o => iso >= o.from && iso <= o.to);
    const daySlots = dates.map((iso, i) => slotsOf(i));
    const rowsT = Array.from(new Set([540,600,660,720,780].concat(...daySlots))).sort((a, b) => a - b);
    let wkFree = 0, wkBooked = 0;
    const wkRows = rowsT.map(m => ({ tm: hm(m), cells: dates.map((iso, i) => {
      const bkId = Object.keys(BOOK).find(k => BOOK[k].date === iso && BOOK[k].s === m && (S.bk[k] === 'confirmed' || S.bk[k] === 'requested'));
      const isSlot = daySlots[i].includes(m);
      const past = iso < '2026-10-06' || (iso === '2026-10-06' && m < 780);
      let k = 'none', tx = '', aria = DS[i] + ' ' + hm(m) + ' · ' + L('not offered','غير متاح');
      if (bkId) { const conf = S.bk[bkId] === 'confirmed'; k = conf ? 'booked' : 'req'; tx = conf ? L('Saeed A.','سعيد ح.') : L('Request','طلب'); aria = DS[i] + ' ' + hm(m) + ' · ' + (conf ? L('booked by Saeed Al Hammadi','محجوز لسعيد الحمادي') : L('requested by Saeed Al Hammadi','طلب من سعيد الحمادي')); if (conf) wkBooked++; }
      else if (isSlot && inOff(iso)) { k = 'off'; tx = L('Time off','إجازة'); aria = DS[i] + ' ' + hm(m) + ' · ' + L('time off','إجازة'); }
      else if (isSlot && past) { k = 'past'; tx = L('Past','مضى'); aria = DS[i] + ' ' + hm(m) + ' · ' + L('past','مضى'); }
      else if (isSlot) { k = 'free'; tx = L('Free','متاح'); aria = DS[i] + ' ' + hm(m) + ' · ' + L('free','متاح'); wkFree++; }
      return { k, tx, aria };
    }) }));
    const wkHead = dates.map((iso, i) => ({ d:DS[i], n:String(+iso.slice(8)), cls: iso === '2026-10-06' ? 'today' : '' }));
    const dd = (iso) => +iso.slice(8) + ' ' + MON[+iso.slice(5,7) - 1];
    const wkLabel = dd(dates[0]) + ' – ' + dd(dates[6]) + ' 2026';
    const legend = [['free',L('Free','متاح')],['booked',L('Booked','محجوز')],['req',L('Requested','بانتظار التأكيد')],['off',L('Time off','إجازة')],['past',L('Past','مضى')]].map(x => ({ k:x[0], tx:x[1] }));

    const nReq = Object.values(S.bk).filter(v => v === 'requested').length;
    const KI = { clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', grid:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', cal:'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 14h3v3H8z', inbox:'M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z' };
    const kpis = [
      { l:L('Weekly hours','الساعات الأسبوعية'), v:String(hours), u:L('h','س'), n:L('across ' + days.filter(d => !d.off).length + ' days','على ' + days.filter(d => !d.off).length + ' أيام'), cls:'k-ink', d:KI.clock },
      { l:L('Weekly slots','المواعيد الأسبوعية'), v:String(weekly), u:'', n:L('60 minutes each','60 دقيقة لكل موعد'), cls:'k-rasp', d:KI.grid },
      { l:L('Free this week','متاح هذا الأسبوع'), v:String(wkFree), u:'', n:wkLabel, cls:'k-yel', d:KI.cal },
      { l:L('Requests','طلبات الحجز'), v:String(nReq), u:'', n: nReq ? L('waiting for you','بانتظارك') : L('all handled','تمت معالجتها'), cls:'k-red', d:KI.inbox }
    ];

    const stTag = { requested:[L('Requested','بانتظار التأكيد'),'warn'], confirmed:[L('Confirmed','مؤكدة'),'info'], cancelled:[L('Cancelled','ملغاة'),'bad'] };
    const reqs = ['B4','B2'].map(k => ({ title:BOOK[k].ttl, when:BOOK[k].when, topic: S.bk[k] === 'requested' ? BOOK[k].topic : '', tag:stTag[S.bk[k]][0], tagCls:stTag[S.bk[k]][1],
      isReq: S.bk[k] === 'requested', isConf: S.bk[k] === 'confirmed', joinHref:'/mentoring/session/' + k,
      confirm: () => { set({ bk:{ ...S.bk, [k]:'confirmed' }, wk:1 }); toast(L('Booking confirmed','تم تأكيد الحجز'), L('Saeed has been notified. Reminders go out 24 h and 1 h before.','أُبلغ سعيد. تُرسل التذكيرات قبل 24 ساعة وساعة واحدة.')); },
      cancel: () => { set({ bk:{ ...S.bk, [k]:'cancelled' } }); toast(S.bk[k] === 'requested' ? L('Request declined','تم رفض الطلب') : L('Session cancelled','أُلغيت الجلسة'), L('Saeed has been notified and the slot is free again.','أُبلغ سعيد وأصبح الموعد متاحاً من جديد.')); } }));

    const fmtR = (o) => { const a = new Date(o.from + 'T00:00:00Z'), b = new Date(o.to + 'T00:00:00Z'); const W = ar ? ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const one = (d) => W[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); return o.from === o.to ? one(a) : one(a) + ' – ' + one(b); };
    const toffs = toff.map((o, i) => ({ range:fmtR(o), note: o.note || L('No note','بدون ملاحظة'), rmAria: L('Remove time off ' + fmtR(o), 'حذف إجازة ' + fmtR(o)), rm: () => upd({ toff: toff.filter((x, j) => j !== i) }) }));

    let dlg = { on:false };
    if (dlgSt) {
      const D = dlgSt, setD = (o) => set({ dlg:{ ...D, ...o } });
      const fErr = D.tried && (!D.from || D.from < '2026-10-06'); const tErr = D.tried && (!D.to || (D.from && D.to < D.from));
      const clashK = Object.keys(BOOK).find(k => (S.bk[k] === 'confirmed' || S.bk[k] === 'requested') && D.from && D.to && BOOK[k].date >= D.from && BOOK[k].date <= D.to);
      dlg = { on:true, from:D.from, to:D.to, note:D.note, nLen: D.note.length + ' / 120', fErr, tErr, fCls: fErr ? 'is-error' : '', tCls: tErr ? 'is-error' : '',
        fMsg: !D.from ? L('Choose a start date.','اختاري تاريخ البدء.') : L('Time off can’t start in the past.','لا يمكن أن تبدأ الإجازة في الماضي.'), tMsg: !D.to ? L('Choose an end date.','اختاري تاريخ الانتهاء.') : L('End date must be on or after the start date.','يجب أن يكون تاريخ الانتهاء في يوم البدء أو بعده.'),
        clash: !!clashK, clashMsg: clashK ? L(BOOK[clashK].ttl + ' is on ' + BOOK[clashK].when + '. Cancel or move it first.', BOOK[clashK].ttl + ' في ' + BOOK[clashK].when + '. ألغيها أو انقليها أولاً.') : '',
        onFrom: (e) => setD({ from:e.target.value }), onTo: (e) => setD({ to:e.target.value }), onNote: (e) => setD({ note:e.target.value }),
        add: () => { const ok = D.from && D.from >= '2026-10-06' && D.to && D.to >= D.from && !clashK; if (!ok) return setD({ tried:true });
          upd({ toff: toff.concat({ from:D.from, to:D.to, note:D.note.trim() }).sort((a, b) => a.from < b.from ? -1 : 1), dlg:false }); toast(L('Time off added','تمت إضافة الإجازة'), L('No slots will be offered on these days. Remember to save.','لن تُعرض مواعيد في هذه الأيام. لا تنسي الحفظ.')); } };
    }

    const tzNames = { 'Asia/Dubai':'GST · UTC+4', 'Asia/Riyadh':'AST · UTC+3', 'Europe/London':'BST · UTC+1', 'Europe/Paris':'CEST · UTC+2' };
    const stSeg = [['default','Default'],['overlap','Overlap error'],['timeoff','Add time off'],['saved','Saved']].map(x => ({ label:x[1], cls: (S.init || this.props.state || 'default') === x[0] && !S.dirty ? 'is-on' : '', pick: () => set({ init:x[0], rules:null, toff:null, tried:false, dirty:false, dlg:null, toast:null, bk:{ B2:'confirmed', B4:'requested' }, wk:1 }) }));

    return {
      lang, dir: ar ? 'rtl' : 'ltr', t, sh, kpis, days, reqs, toffs, noToff: toffs.length === 0, wkRows, wkHead, wkLabel, legend, dlg, stSeg,
      rqTag: nReq ? L(nReq + ' to confirm', nReq + ' بانتظار التأكيد') : L('Up to date','محدّثة'), rqTagCls: nReq ? 'warn' : 'ok',
      tz:S.tz, tzShort: S.tz + ' · ' + tzNames[S.tz], tzHint: S.tz === 'Asia/Dubai' ? L('Gulf time. Mentees see slots converted to their own time zone.','بتوقيت الخليج. يرى المتدرّبون المواعيد بتوقيتهم المحلي.') : L('Your rules will be read in ' + S.tz + '. Mentees still see slots in their own time zone.','ستُقرأ قواعدك بتوقيت ' + S.tz + '. يرى المتدرّبون المواعيد بتوقيتهم المحلي.'),
      setTz: (e) => upd({ tz:e.target.value }),
      showErr: tried && nErr > 0, errTitle: L(nErr === 1 ? '1 day has a problem — not saved' : nErr + ' days have problems — not saved', nErr === 1 ? 'يوجد خطأ في يوم واحد — لم يتم الحفظ' : 'توجد أخطاء في ' + nErr + ' أيام — لم يتم الحفظ'),
      dirty: !!S.dirty,
      save: () => { if (nErr) return set({ tried:true, init: S.init || st }); set({ tried:false, dirty:false, init: S.init || st }); toast(L('Availability saved','تم حفظ أوقات التوفر'), L('Mentees can now book ' + weekly + ' weekly slots. Existing bookings are unchanged.','يمكن للمتدرّبين الآن حجز ' + weekly + ' موعداً أسبوعياً. لم تتغيّر الحجوزات الحالية.')); },
      discard: () => set({ rules:null, toff:null, tz:'Asia/Dubai', tried:false, dirty:false, init:'default' }),
      openTo: () => set({ dlg:{ from:'', to:'', note:'', tried:false } }), closeDlg: () => set({ dlg:false }),
      prevWk: () => set({ wk: Math.max(0, S.wk - 1) }), nextWk: () => set({ wk: Math.min(3, S.wk + 1) }),
      toast: toastSt ? { on:true, title:toastSt.t, msg:toastSt.m, close: () => set({ toast:false }) } : { on:false, title:'', msg:'', close:null },
      protoCls: this.props.proto ? 'proto' : '',
      enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => set({ locale:'en' }), setAr: () => set({ locale:'ar' }), toggleLang: () => set({ locale: ar ? 'en' : 'ar' })
    };
  }
}
