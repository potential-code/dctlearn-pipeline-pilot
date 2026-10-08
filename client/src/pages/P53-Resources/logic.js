// client: hand-edited (shell identity from the session, not a hard-coded ZU override)
// Ported verbatim from the Claude Design artboard P53-Resources (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, site:null, screen:null, toast:null }; }

  /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  /* ===== builder-E helpers (sub-admin pages) ===== */
  _base(defSite, active, crumbEn, crumbAr){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const site = this.state.site || this.props.site || defSite;
    const L = (en, a) => ar ? a : en;
    const SN = { employees:['DCT Employees','موظفو الدائرة'], elevate:['Elevate 2026','إرتقاء 2026'], znm:['Zayed National Museum','متحف زايد الوطني'], zu:['ZU 24-Hour Challenge','تحدي جامعة زايد'], museopro:['MuseoPro','ميوزيو برو'], nibras:['Nibras','نبراس'] }[site] || ['Elevate 2026','إرتقاء 2026'];
    const crumbs = active === 'dashboard'
      ? [ { label: L(SN[0], SN[1]), href:'/platforms' }, { label: L(crumbEn, crumbAr) } ]
      : [ { label: L(SN[0], SN[1]), href:'/'+site+'/admin' }, { label: L(crumbEn, crumbAr) } ];
    const sh = this.shell(ar, 'sub_admin', active, site, crumbs);
    /* client: the shell identity comes from the signed-in session in shellHelper (a platform admin
       viewing a microsite admin, e.g. ZU which has no sub admin, shows as "Platform admin · covering …"). */
    const fmt = (n, d) => Number(n).toLocaleString('en-US', d == null ? {} : { minimumFractionDigits:d, maximumFractionDigits:d });
    return { lang, ar, site, L, sh, fmt, siteName: L(SN[0], SN[1]) };
  }
  _common(ar){
    const tt = this.state.toast;
    return {
      dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '',
      enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }),
      hasToast: !!tt, toastText: tt ? (ar ? tt[1] : tt[0]) : '', closeToast: () => this.setState({ toast:null }),
      t0: { close: ar ? 'إغلاق' : 'Close' }
    };
  }
  _toast(en, a){ this.setState({ toast:[en, a] }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast:null }), 5000); }
  _screen(def){ /* specbar / prop driven presets */
    const ps = this.props.screen || def;
    if (this._ps !== ps) { this._ps = ps; Object.assign(this.state, this.preset(ps)); }
    return this.state.screen || ps;
  }
  _go(s){ this.setState({ toast:null, ...this.preset(s), screen:s }); }
  _seg(list, cur, ar){ return list.map(x => ({ label: x[1], cls: x[0] === cur ? 'is-on' : '', pick: () => this._go(x[0]) })); }
  _ltr(s){ return '\u2066' + s + '\u2069'; }
  _isEmail(e){ return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e) && e.length <= 254; }
  _isHttps(u){ return /^https:\/\/[^\s/$.?#][^\s]*\.[^\s]{2,}/i.test(u); }
  /* ===== end builder-E helpers ===== */


  seed(site){
    if (site === 'employees') return [ { id:'sp', en:'Internal SharePoint link', ar:'رابط SharePoint داخلي', type:'link', url:'https://dctabudhabi.sharepoint.com/sites/Learning/Shared%20Documents', status:'rejected', note:['Use a public https link; SharePoint needs login','استخدم رابط https عاماً؛ يتطلب SharePoint تسجيل الدخول'], by:'Aisha Al Marzouqi', byAr:'عائشة المرزوقي', at:'2026-09-29', revAt:'2026-09-30' } ];
    return [
      { id:'coc', en:'ZNM Visitor Code of Conduct', ar:'مدونة سلوك زوار متحف زايد الوطني', type:'pdf', file:'znm-visitor-code-of-conduct.pdf', size:'1.2 MB', status:'approved', at:'2026-06-28', revAt:'2026-07-01' },
      { id:'faq', en:'Ticketing FAQ sheet', ar:'ملف الأسئلة الشائعة عن التذاكر', type:'link', url:'https://znm.example/ticketing-faq', status:'pending', at:'2026-10-05' }
    ];
  }
  preset(s){
    const base = { site:null, list:null, flt:'all', dlg:null, form:null, fTried:false, rm:null };
    const add = { mode:'add', type:'link', tEn:'', tAr:'', url:'', file:null, pdfErr:'' };
    if (s === 'add') return { ...base, dlg:'form', form:{ ...add, tEn:'Opening-day checklist', tAr:'قائمة التحقق ليوم الافتتاح', url:'https://znm.example/opening-day-checklist' } };
    if (s === 'addError') return { ...base, dlg:'form', fTried:true, form:{ ...add, tEn:'Opening-day checklist', tAr:'', url:'http://znm.example/opening-day-checklist' } };
    if (s === 'rejected') return { ...base, site:'employees' };
    if (s === 'fix') { const r = this.seed('employees')[0]; return { ...base, site:'employees', dlg:'form', form:{ mode:'fix', id:r.id, type:'link', tEn:r.en, tAr:r.ar, url:'https://learn.dctabudhabi.ae/guides/working-at-dct', file:null, pdfErr:'', note:r.note } }; }
    if (s === 'resubmitted') { const r = this.seed('employees')[0]; return { ...base, site:'employees', list:[ { ...r, url:'https://learn.dctabudhabi.ae/guides/working-at-dct', status:'pending', at:'2026-10-06', note:null, resub:true } ], _for:'employees' }; }
    if (s === 'remove') return { ...base, dlg:'remove', rm:'faq' };
    return base;
  }
  renderVals(){
    const scr = this._screen('list');
    const { lang, ar, site, L, sh, fmt, siteName } = this._base('znm', 'resources', 'Resources', 'الموارد');
    const st = this.state;
    if (!st.list || st._for !== site) { st.list = this.seed(site); st._for = site; }
    const list = st.list;
    const MON = ar ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const D = (iso) => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MON[m-1] + ' ' + y; };
    const t = ar ? {
      spec:'الموارد', ey: siteName + ' · المحتوى', h1:'الموارد', sub:'أضف روابط https أو ملفات PDF لمتعلمي هذا الموقع. يراجع مسؤول المنصة كل مورد قبل ظهوره.', add:'إضافة مورد',
      listT:'موارد الموقع', flowAria:'مسار المراجعة', fPending:'قيد المراجعة', fApproved:'معتمد', fRejected:'مرفوض', filter:'تصفية حسب الحالة', reviewNote:'ملاحظة المراجِع', fix:'إصلاح وإعادة الإرسال', edit:'تعديل',
      noneT:'لا توجد موارد بهذه الحالة', noneB:'غيّر عامل التصفية أو أضف مورداً جديداً.',
      formSub:'يظهر في تبويب «الموارد» بعد اعتماده.', resetT:'سيعود المورد إلى المراجعة', resetB:'تعديل مورد معتمد يعيده إلى «قيد المراجعة»، ولن يراه المتعلمون حتى يُعتمد مجدداً.',
      type:'النوع', tLink:'رابط https', tPdf:'ملف PDF', title:'العنوان', url:'الرابط', urlHint:'روابط https:// العامة فقط — لا روابط تتطلب تسجيل الدخول.', pdf:'الملف', replace:'استبدال', dz:'اختر ملف PDF', dzB:'PDF فقط · حتى 10 ميغابايت',
      reviewInfo:'يُرسل إلى مسؤول منصة DCT Learn للمراجعة. يُسجَّل الإرسال في سجل التدقيق.', cancel:'إلغاء', rmBody:'يُزال المورد من هذا الموقع ومن تبويب «الموارد» لدى المتعلمين.', rmBtn:'حذف المورد'
    } : {
      spec:'Resources', ey: siteName + ' · Content', h1:'Resources', sub:'Add https links or PDFs for this microsite’s learners. The platform admin reviews each one before it appears.', add:'Add resource',
      listT:'Microsite resources', flowAria:'Review flow', fPending:'Pending review', fApproved:'Approved', fRejected:'Rejected', filter:'Filter by status', reviewNote:'Reviewer’s note', fix:'Fix and resubmit', edit:'Edit',
      noneT:'No resources with this status', noneB:'Change the filter or add a new resource.',
      formSub:'Shows on the Resources tab once approved.', resetT:'This sends it back to review', resetB:'Editing an approved resource resets it to “Pending review”; learners won’t see it until it is approved again.',
      type:'Type', tLink:'https link', tPdf:'PDF file', title:'Title', url:'Link', urlHint:'Public https:// links only — nothing that needs a login.', pdf:'File', replace:'Replace', dz:'Choose a PDF file', dzB:'PDF only · up to 10 MB',
      reviewInfo:'Goes to the DCT Learn platform admin for review. Submitting is recorded in the audit log.', cancel:'Cancel', rmBody:'The resource is removed from this microsite and from learners’ Resources tab.', rmBtn:'Delete resource'
    };
    const STL = { approved:[L('Approved','معتمد'),'ok'], pending:[L('Pending review','قيد المراجعة'),'warn'], rejected:[L('Rejected','مرفوض'),'bad'] };
    const IC = { pdf:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4', link:'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7' };
    const cnt = (s) => list.filter(r => s === 'all' || r.status === s).length;
    const show = list.filter(r => st.flt === 'all' || r.status === st.flt);
    const openForm = (r, mode) => this.setState({ dlg:'form', fTried:false, form:{ mode, id:r.id, type:r.type, tEn:r.en, tAr:r.ar, url:r.url || '', file: r.file ? { name:r.file, size:r.size } : null, pdfErr:'', note: mode === 'fix' ? r.note : null, wasApproved: r.status === 'approved' } });
    const items = show.map(r => ({
      hid:'res-' + r.id, type:r.type, icon:IC[r.type], title:L(r.en, r.ar), alt:L(r.ar, r.en), altDir: ar ? 'ltr' : 'rtl', altLang: ar ? 'en' : 'ar',
      typeL: r.type === 'pdf' ? 'PDF' : L('Link','رابط'), where: r.type === 'pdf' ? r.file + ' · ' + r.size : r.url,
      when: r.status === 'approved' ? L('Approved ' + D(r.revAt), 'اعتُمد ' + D(r.revAt)) : r.status === 'rejected' ? L('Rejected ' + D(r.revAt), 'رُفض ' + D(r.revAt)) : (r.resub ? L('Resubmitted ' + D(r.at) + ' by ' + sh.userName, 'أُعيد إرساله ' + D(r.at) + ' بواسطة ' + sh.userName) : L('Submitted ' + D(r.at) + ' by ' + sh.userName + ' · waiting for the admin', 'أُرسل ' + D(r.at) + ' بواسطة ' + sh.userName + ' · بانتظار المسؤول')),
      st:STL[r.status][0], stCls:STL[r.status][1], rejected: r.status === 'rejected', notRejected: r.status !== 'rejected',
      note: r.note ? L(r.note[0], r.note[1]) : '', by: r.by ? L('— ' + r.by + ', DCT Learn admin · ' + D(r.revAt), '— ' + r.byAr + '، مسؤولة DCT Learn · ' + D(r.revAt)) : '',
      fix: () => openForm(r, 'fix'), edit: () => openForm(r, 'edit'), del: () => this.setState({ dlg:'remove', rm:r.id }), delAria: L('Delete ' + r.en, 'حذف ' + r.ar)
    }));
    const KI = { ok:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', x:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6' };
    const kpis = [
      { l:L('Approved','معتمدة'), v:fmt(cnt('approved')), n:L('visible to learners','ظاهرة للمتعلمين'), cls:'k-ink', d:KI.ok },
      { l:L('Pending review','قيد المراجعة'), v:fmt(cnt('pending')), n:L('with the platform admin','لدى مسؤول المنصة'), cls:'k-yel', d:KI.clock },
      { l:L('Rejected','مرفوضة'), v:fmt(cnt('rejected')), n: cnt('rejected') ? L('needs your fix','تحتاج إلى إصلاحك') : L('nothing to fix','لا شيء لإصلاحه'), cls:'k-red', d:KI.x }
    ];
    const chips = [['all',L('All','الكل')],['approved',L('Approved','معتمد')],['pending',L('Pending','قيد المراجعة')],['rejected',L('Rejected','مرفوض')]].map(c => ({ label:c[1], n:fmt(cnt(c[0])), cls: st.flt === c[0] ? 'on' : '', pr: st.flt === c[0] ? 'true' : 'false', pick: () => this.setState({ flt:c[0] }) }));
    /* form */
    const f = st.form || { type:'link' };
    const fe = {};
    ['tEn','tAr'].forEach(k => { const v = (f[k] || '').trim(); if (!v) fe[k] = L('Enter the title in ' + (k === 'tEn' ? 'English' : 'Arabic') + '.', 'أدخل العنوان ' + (k === 'tEn' ? 'بالإنجليزية' : 'بالعربية') + '.'); else if (v.length > 160) fe[k] = L('Keep it under 160 characters.','اجعله أقل من 160 حرفاً.'); });
    if (f.type === 'link') { const u = (f.url || '').trim(); if (!u) fe.url = L('Enter the link.','أدخل الرابط.'); else if (/^http:\/\//i.test(u)) fe.url = L('Only https:// links are allowed. Change http:// to https://.','يُسمح بروابط https:// فقط. غيّر http:// إلى https://.'); else if (!this._isHttps(u)) fe.url = L('Enter a full link that starts with https://','أدخل رابطاً كاملاً يبدأ بـ https://'); }
    if (f.type === 'pdf' && !f.file) fe.pdf = L('Choose a PDF file.','اختر ملف PDF.');
    const H = {};
    [['tEn',160],['tAr',160],['url',2000]].forEach(([k, max]) => { const v = f[k] || ''; const e = st.fTried && fe[k] ? fe[k] : ''; H[k] = { v, n: fmt(v.length) + ' / ' + fmt(max), cc: v.length > max ? 'over' : '', err:e, ec: e ? 'is-error' : '', on: (ev) => this.setState({ form:{ ...this.state.form, [k]:ev.target.value } }) }; });
    const onPdf = (e) => { const fl = e.target.files && e.target.files[0]; if (!fl) return; if (!/\.pdf$/i.test(fl.name) && fl.type !== 'application/pdf') return this.setState({ form:{ ...f, pdfErr:L(fl.name + ' is not a PDF.','الملف ' + fl.name + ' ليس PDF.') } }); if (fl.size > 10 * 1024 * 1024) return this.setState({ form:{ ...f, pdfErr:L(fl.name + ' is larger than 10 MB.','الملف ' + fl.name + ' أكبر من 10 ميغابايت.') } });
      this.setState({ form:{ ...f, file:{ name:fl.name, size:(fl.size / 1024 / 1024).toFixed(1) + ' MB' }, pdfErr:'' } }); };
    const submit = () => {
      if (Object.keys(fe).length) return this.setState({ fTried:true });
      const rec = { en:f.tEn.trim(), ar:f.tAr.trim(), type:f.type, url: f.type === 'link' ? f.url.trim() : '', file: f.type === 'pdf' ? f.file.name : '', size: f.type === 'pdf' ? f.file.size : '', status:'pending', at:'2026-10-06', note:null };
      if (f.mode === 'add') { this.setState({ dlg:null, form:null, flt:'all', list:[ { id:'n' + Date.now(), ...rec }, ...list ] }); this._toast('Sent for review · the platform admin will approve or reject it', 'أُرسل للمراجعة · سيعتمده مسؤول المنصة أو يرفضه'); }
      else { this.setState({ dlg:null, form:null, list: list.map(r => r.id === f.id ? { ...r, ...rec, resub: f.mode === 'fix', by:null } : r) }); this._toast(f.mode === 'fix' ? 'Resubmitted · status is back to Pending review' : 'Saved · status reset to Pending review', f.mode === 'fix' ? 'أُعيد الإرسال · الحالة الآن قيد المراجعة' : 'حُفظ · أُعيدت الحالة إلى قيد المراجعة'); }
    };
    const rmR = list.find(r => r.id === st.rm) || { en:'', ar:'' };
    const SCR = [['list','List (ZNM)'],['add','Add'],['addError','Add · http error'],['rejected','Rejected (Employees)'],['fix','Fix & resubmit'],['resubmitted','Resubmitted'],['remove','Delete']];
    return {
      lang, t, sh, ...this._common(ar), route:'/' + site + '/admin/resources', scrBtns:this._seg(SCR, scr, ar),
      siteBtns: [['znm','ZNM'],['employees','Employees']].map(x => ({ label:x[1], cls: x[0] === site ? 'is-on' : '', pick: () => this.setState({ site:x[0], list:null, flt:'all', dlg:null }) })),
      kpis, chips, items, noItems: items.length === 0,
      openAdd: () => this.setState({ dlg:'form', fTried:false, form:{ mode:'add', type:'link', tEn:'', tAr:'', url:'', file:null, pdfErr:'' } }),
      dForm: st.dlg === 'form', formTitle: f.mode === 'fix' ? L('Fix and resubmit','إصلاح وإعادة الإرسال') : f.mode === 'edit' ? L('Edit resource','تعديل المورد') : L('Add resource','إضافة مورد'),
      fixNote: f.mode === 'fix' && f.note ? L(f.note[0], f.note[1]) : '', warnReset: f.mode === 'edit' && !!f.wasApproved,
      isLink: f.type === 'link', isPdf: f.type === 'pdf', isLinkS: f.type === 'link' ? 'true' : 'false', isPdfS: f.type === 'pdf' ? 'true' : 'false',
      setLink: () => this.setState({ form:{ ...f, type:'link' } }), setPdf: () => this.setState({ form:{ ...f, type:'pdf' } }),
      H, hasFile: !!f.file, noFile: !f.file, fileName: f.file ? f.file.name : '', fileSize: f.file ? f.file.size : '', clearFile: () => this.setState({ form:{ ...f, file:null } }), onPdf,
      pdfErr: f.pdfErr || (st.fTried && fe.pdf ? fe.pdf : ''), pdfErrCls: (f.pdfErr || (st.fTried && fe.pdf)) ? 'is-error' : '',
      submit, submitLabel: f.mode === 'fix' ? L('Resubmit for review','إعادة الإرسال للمراجعة') : f.mode === 'edit' ? L('Save and send to review','حفظ وإرسال للمراجعة') : L('Send for review','إرسال للمراجعة'),
      dRemove: st.dlg === 'remove', rmTitle: L('Delete “' + rmR.en + '”?', 'حذف «' + rmR.ar + '»؟'),
      confirmRemove: () => { this.setState({ dlg:null, list: list.filter(r => r.id !== rmR.id) }); this._toast('Resource deleted · recorded in the audit log','حُذف المورد · سُجّل في سجل التدقيق'); },
      closeDlg: () => this.setState({ dlg:null }), stop: (e) => e.stopPropagation()
    };
  }
}
