// Ported verbatim from the Claude Design artboard P15-Profile (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, tab:null, edit:false, f:null, draft:null, tried:false, busy:false, saved:'', pw:{ cur:'', nw:'', rep:'' }, pwTried:false, pwShow:false, pwDone:false, n:null, nDirty:false, ex:false, exBusy:false, del:false, delDlg:false, delText:'', delTried:false, toast:'' }; }

  /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  flash(msg){ this.setState({ toast: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast:'' }), 2800); }

  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const site = this.props.site || 'employees';
    const tab = this.state.tab || this.props.tab || 'details';
    const L = (en, a) => ar ? a : en;
    const t = ar ? {
      spec:'الملف الشخصي', ey:'حسابك', h1:'الملف الشخصي', sub:'بياناتك الشخصية وأمان حسابك والإشعارات وحقوقك في بياناتك.', signOut:'تسجيل الخروج',
      pdH:'البيانات الشخصية', edit:'تعديل', editing:'وضع التعديل', emailNote:'يديره المسؤول', photo:'تغيير الصورة', fixErr:'صحّح الحقول المحددة', cancel:'إلغاء', save:'حفظ التغييرات', prefLang:'لغة المنصة والرسائل', langHint:'تُستخدم لواجهة المنصة والرسائل الإلكترونية.',
      roH:'من سجلات الموارد البشرية', roNote:'للقراءة فقط · تواصل مع الموارد البشرية للتصحيح', msH:'عضوياتك', switch:'تبديل المركز', ceH:'الشهادات', all:'الكل',
      pwH:'تغيير كلمة المرور', show:'إظهار', hide:'إخفاء', pwCur:'كلمة المرور الحالية', pwNew:'كلمة المرور الجديدة', pwRep:'أعد كتابة كلمة المرور الجديدة', pwSave:'تحديث كلمة المرور', pwOk:'تم تغيير كلمة المرور', pwOkP:'سُجّل خروجك من الجلسات الأخرى. تبقى مسجلاً هنا.',
      ssH:'الجلسات النشطة', ssNote:'عند تغيير كلمة المرور يتم إنهاء كل الجلسات الأخرى.',
      ntH:'إشعارات البريد الإلكتروني', ntTo:'إلى saeed.h@dctlearn.example', nlH:'مركز الإشعارات', nlP:'تظهر كل الإشعارات أيضاً في مركز الإشعارات داخل المنصة، بغض النظر عن إعدادات البريد.', nlLink:'افتح مركز الإشعارات', nSaved:'تم حفظ تفضيلات الإشعارات', dirty:'لديك تغييرات غير محفوظة', clean:'كل التغييرات محفوظة',
      dtH:'بياناتك وخصوصيتك', exH:'تنزيل بياناتي', exP:'نجهّز ملفاً يحتوي ملفك الشخصي وتقدّمك ونقاطك وإجاباتك (JSON) مع شهاداتك (PDF)، ونرسل الرابط إلى بريدك خلال 24 ساعة.', exBtn:'طلب نسخة من بياناتي', exOk:'تم استلام طلبك', exOkP:'سيصل رابط التنزيل إلى saeed.h@dctlearn.example خلال 24 ساعة، ويبقى صالحاً 7 أيام.',
      delH:'طلب حذف الحساب', delP:'يراجع مسؤول المنصة طلبك ويؤكده. بعد ذلك تُجهَّل بياناتك ولا يمكن التراجع.', delBtn:'طلب الحذف', delOk:'طلب الحذف قيد المراجعة', delOkP:'أُرسل في 6 أكتوبر 2026. سيتواصل معك مسؤول المنصة قبل التنفيذ. يمكنك متابعة استخدام حسابك حتى ذلك الحين.',
      delWarnH:'لا يمكن التراجع بعد التأكيد', delWarn:'عند موافقة المسؤول:', typeDel:'اكتب DELETE للتأكيد', typeDelErr:'اكتب DELETE بالأحرف الكبيرة للمتابعة.', delConfirm:'إرسال طلب الحذف', close:'إغلاق',
      rtH:'كيف نحتفظ بالبيانات', saved:'تم حفظ بياناتك الشخصية', photoOk:'تم تحديث الصورة', photoBad:'استخدم صورة PNG أو JPG حتى 5 ميجابايت', pwChanged:'تم تحديث كلمة المرور', exSent:'تم إرسال طلب البيانات', delSent:'تم إرسال طلب الحذف'
    } : {
      spec:'Profile', ey:'Your account', h1:'Profile', sub:'Your personal details, account security, notifications and your rights over your data.', signOut:'Sign out',
      pdH:'Personal details', edit:'Edit details', editing:'Editing', emailNote:'managed by your admin', photo:'Change photo', fixErr:'Fix the highlighted fields', cancel:'Cancel', save:'Save changes', prefLang:'Platform and e-mail language', langHint:'Used for the platform and for e-mails we send you.',
      roH:'From HR records', roNote:'Read-only · contact HR to correct', msH:'Your memberships', switch:'Switch hub', ceH:'Certificates', all:'All',
      pwH:'Change password', show:'Show', hide:'Hide', pwCur:'Current password', pwNew:'New password', pwRep:'Repeat new password', pwSave:'Update password', pwOk:'Password changed', pwOkP:'You were signed out of your other sessions. You stay signed in here.',
      ssH:'Active sessions', ssNote:'Changing your password signs out every other session.',
      ntH:'E-mail notifications', ntTo:'to saeed.h@dctlearn.example', nlH:'Notification centre', nlP:'Every notification also appears in the in-platform notification centre, whatever your e-mail settings.', nlLink:'Open notification centre', nSaved:'Notification preferences saved', dirty:'You have unsaved changes', clean:'All changes saved',
      dtH:'Your data and privacy', exH:'Download my data', exP:'We prepare a file with your profile, progress, points and answers (JSON) plus your certificates (PDF), and e-mail you a link within 24 hours.', exBtn:'Request a copy of my data', exOk:'Request received', exOkP:'A download link will reach saeed.h@dctlearn.example within 24 hours. It stays valid for 7 days.',
      delH:'Request account deletion', delP:'A platform admin reviews and confirms your request. After that your data is anonymised and this can’t be undone.', delBtn:'Request deletion', delOk:'Deletion request under review', delOkP:'Sent on 6 October 2026. A platform admin will contact you before it is carried out. You can keep using your account until then.',
      delWarnH:'This can’t be undone once confirmed', delWarn:'When an admin approves it:', typeDel:'Type DELETE to confirm', typeDelErr:'Type DELETE in capital letters to continue.', delConfirm:'Send deletion request', close:'Close',
      rtH:'How we keep data', saved:'Your personal details were saved', photoOk:'Photo updated', photoBad:'Use a PNG or JPG image up to 5 MB', pwChanged:'Password updated', exSent:'Data request sent', delSent:'Deletion request sent'
    };
    const SN = { employees:['DCT Employees','موظفو الدائرة'], elevate:['Elevate 2026','إرتقاء 2026'] }[site] || ['DCT Employees','موظفو الدائرة'];
    const sh = this.shell(ar, 'learner', 'profile', site, [ { label:L(SN[0],SN[1]), href:'/'+site+'/dashboard' }, { label:L('Profile','الملف الشخصي') } ]);
    const base = { first:L('Saeed','سعيد'), last:L('Al Hammadi','الحمادي'), country:L('United Arab Emirates','الإمارات العربية المتحدة'), position:L('Specialist','أخصائي'), department:L('DCT Culture','قطاع الثقافة'), employment:L('Full-time','دوام كامل'), seniority:L('Specialist','أخصائي'), linkedin:'https://www.linkedin.com/in/saeed-alhammadi', mobile:'+971 50 123 4567', plang:'en' };
    const f = this.state.f || base;
    const d = this.state.draft || f;
    const editing = this.state.edit;
    const tried = this.state.tried;
    const errs = {};
    if (!d.first.trim()) errs.first = L('Enter your first name.','أدخل اسمك الأول.'); else if (d.first.length > 80) errs.first = L('Use 80 characters or fewer.','استخدم 80 حرفاً أو أقل.');
    if (!d.last.trim()) errs.last = L('Enter your last name.','أدخل اسم العائلة.');
    if (!d.position.trim()) errs.position = L('Enter your position.','أدخل مسماك الوظيفي.');
    if (d.linkedin && !/^https:\/\/(www\.)?linkedin\.com\/.+/i.test(d.linkedin.trim())) errs.linkedin = L('Use a full https://www.linkedin.com/… link.','استخدم رابطاً كاملاً يبدأ بـ https://www.linkedin.com/');
    if (d.mobile && !/^\+?[0-9 ]{9,16}$/.test(d.mobile.trim())) errs.mobile = L('Use digits with the country code, e.g. +971 50 123 4567.','استخدم الأرقام مع رمز الدولة، مثل ‎+971 50 123 4567');
    const setD = (k) => (e) => this.setState({ draft:Object.assign({}, d, { [k]: e.target.value }) });
    const F = [ ['first',L('First name','الاسم الأول'),'text'], ['last',L('Last name','اسم العائلة'),'text'], ['position',L('Position','المسمى الوظيفي'),'text'], ['department',L('Department','الإدارة'),'text'],
      ['country',L('Country','الدولة'),'sel',[L('United Arab Emirates','الإمارات العربية المتحدة'),L('Saudi Arabia','السعودية'),L('Oman','عُمان'),L('Other','أخرى')]],
      ['employment',L('Employment type','نوع التوظيف'),'sel',[L('Full-time','دوام كامل'),L('Part-time','دوام جزئي'),L('Contractor','متعاقد'),L('Secondment','إعارة')]],
      ['seniority',L('Seniority level','المستوى الوظيفي'),'sel',[L('Officer','موظف'),L('Specialist','أخصائي'),L('Senior Specialist','أخصائي أول'),L('Section Head','رئيس قسم'),L('Manager','مدير'),L('Director','مدير إدارة')]],
      ['mobile',L('Mobile','الهاتف المحمول'),'tel'], ['linkedin',L('LinkedIn profile','ملف LinkedIn'),'url'] ];
    const fields = F.map(x => { const e = tried && errs[x[0]]; return { id:'pf-' + x[0], l:x[1], type:x[2] === 'sel' ? 'text' : x[2], isInput:x[2] !== 'sel', isSelect:x[2] === 'sel', opts:x[3] || [], v:d[x[0]], set:setD(x[0]), err: e || false, inv: e ? 'true' : 'false', cls: e ? 'is-error' : '', hid:'pf-h-' + x[0], wide: x[0] === 'linkedin' ? 'full' : '', dir: (x[0] === 'linkedin' || x[0] === 'mobile') ? 'ltr' : 'auto', ph: x[0] === 'linkedin' ? 'https://www.linkedin.com/in/…' : '', hint: x[0] === 'mobile' && !e ? L('Only used for session reminders by SMS if you turn them on.','يُستخدم فقط لتذكيرات الجلسات عبر الرسائل إن فعّلتها.') : false }; });
    const view = F.map(x => ({ k:x[1], v: f[x[0]] || '—', dir: (x[0] === 'mobile' || x[0] === 'linkedin') ? 'ltr' : 'auto' })).concat([{ k:t.prefLang, v: f.plang === 'ar' ? 'العربية' : 'English', dir:'auto' }]);
    const errKeys = Object.keys(errs);
    const ro = [ [L('Employee ID','الرقم الوظيفي'),'DCT-10482'], [L('Sector','القطاع'),L('Culture','الثقافة')], [L('Hire date','تاريخ التعيين'),L('March 2024','مارس 2024')], [L('Job level','المستوى الوظيفي'),L('Specialist (grade 9)','أخصائي (الدرجة 9)')], [L('Time at DCT','مدة الخدمة'),L('2 years 7 months · “1–3 years” at registration','سنتان و7 أشهر · «1–3 سنوات» عند التسجيل')], [L('E-mail','البريد الإلكتروني'),'saeed.h@dctlearn.example'] ].map(x => ({ k:x[0], v:x[1] }));
    const memberships = [ { name:L('DCT Employees','موظفو الدائرة'), meta:L('Joined March 2024 · invite (dctabudhabi.ae)','انضم مارس 2024 · دعوة (dctabudhabi.ae)'), role:L('Learner','متعلّم'), c:'#EE3E43', href:'/employees/dashboard' }, { name:L('Elevate 2026','إرتقاء 2026'), meta:L('Joined 20 Sep 2026 · mentee','انضم 20 سبتمبر 2026 · متدرّب'), role:L('Mentee','متدرّب'), c:'#CD3151', href:'/elevate/dashboard' } ];
    const certs = [ [L('DCT World','عالم الدائرة'),'DCT-2026-C01-000184 · 25/08/2026'], [L('DCTLEARN','منصة DCT Learn'),'DCT-2026-C03-000097 · 03/08/2026'] ].map(c => ({ t:c[0], m:c[1], aria:L('Download PDF: ','تنزيل PDF: ') + c[0], dl: () => this.flash(L('Downloading certificate (PDF)','جارٍ تنزيل الشهادة')) }));

    // password
    const pw = this.state.pw, pwT = this.state.pwTried;
    const r1 = pw.nw.length >= 10, r2 = !!pw.nw && pw.nw !== pw.cur, r3 = /[0-9]/.test(pw.nw) && /[A-Za-z]/.test(pw.nw);
    const score = [r1, r2, r3, pw.nw.length >= 14].filter(Boolean).length;
    const mc = ['#D63539','#E35E3C','#F7C337','#15801A'][Math.max(0, score - 1)];
    const meter = [0,1,2,3].map(i => i < score ? mc : '#E9ECEF');
    const pw0Err = pwT && !pw.cur ? L('Enter your current password.','أدخل كلمة المرور الحالية.') : false;
    const pw2Err = pwT && pw.rep !== pw.nw ? L('The passwords don’t match.','كلمتا المرور غير متطابقتين.') : false;
    const pwOk = r1 && r2 && r3 && !!pw.cur && pw.rep === pw.nw;

    // notifications
    const NB = { remind:true, grow:true, cert:true, invite:true, content:false, digest:false, account:true };
    const n = this.state.n || NB;
    const NL = [ ['remind',L('Session reminders','تذكيرات الجلسات'),L('24 hours and 1 hour before a mentoring session or workshop.','قبل 24 ساعة وساعة من جلسة إرشاد أو ورشة.')], ['grow',L('Mentor notes (GROW log)','ملاحظات المرشد (GROW)'),L('When your mentor adds notes after a session.','عندما يضيف مرشدك ملاحظات بعد الجلسة.')], ['cert',L('Course completion and certificates','إكمال الدورات والشهادات'),L('When you finish a course or an external certificate is reviewed.','عند إكمال دورة أو مراجعة شهادة خارجية.')], ['invite',L('Invitations','الدعوات'),L('When you’re invited to a new programme.','عند دعوتك إلى برنامج جديد.')], ['content',L('New courses, workshops and resources','دورات وورش وموارد جديدة'),L('When something new is published in your hubs.','عند نشر محتوى جديد في مراكزك.')], ['digest',L('Weekly progress summary','ملخص أسبوعي للتقدّم'),L('Sunday mornings, a short summary of your week.','صباح كل أحد، ملخص قصير لأسبوعك.')], ['account',L('Account and security','الحساب والأمان'),L('Password changes and sign-ins from a new device. Always on.','تغيير كلمة المرور وتسجيل الدخول من جهاز جديد. مفعّلة دائماً.'),true] ];
    const notifs = NL.map(x => ({ id:'nt-' + x[0], l:x[1], d:x[2], on:!!n[x[0]], lockCls: x[3] ? 'lock' : '', tog: () => { if (x[3]) return; this.setState({ n:Object.assign({}, n, { [x[0]]: !n[x[0]] }), nDirty:true }); } }));

    const TABS = [['details',L('Personal details','البيانات الشخصية')],['security',L('Password and security','كلمة المرور والأمان')],['notifications',L('Notifications','الإشعارات')],['data',L('Your data','بياناتك')]];
    const go = (k) => this.setState({ tab:k, saved:'', edit:false, draft:null, tried:false });
    const ST = [['details','Details'],['edit','Edit + errors'],['security','Security'],['notifications','Notifications'],['data','Data'],['delete','Delete dialog'],['requested','Requested']];
    const cur = this.state.delDlg ? 'delete' : (tab === 'data' && (this.state.ex || this.state.del)) ? 'requested' : (tab === 'details' && editing) ? 'edit' : tab;
    return {
      lang, dir: ar?'rtl':'ltr', t, sh, protoCls: this.props.proto ? 'proto' : '', route:'/'+site+'/profile' + (tab === 'details' ? '' : '#' + tab),
      ptabs: TABS.map(x => ({ label:x[1], cls: x[0] === tab ? 'on' : '', cur: x[0] === tab ? 'page' : 'false', pick: () => go(x[0]) })),
      isDetails: tab === 'details', isSecurity: tab === 'security', isNotif: tab === 'notifications', isData: tab === 'data',
      saved: this.state.saved || false, f, ini:'SA', fullName: f.first + ' ' + f.last,
      viewMode: !editing, editMode: editing, view, fields, ro, memberships, certs, achHref:'/'+site+'/achievements',
      hasErr: tried && errKeys.length > 0, errSummary: errKeys.length + L(' field(s) need attention.',' حقول تحتاج إلى تصحيح.'),
      langOpts: [['en','English'],['ar','العربية']].map(x => ({ l:x[1], on: d.plang === x[0], cls: d.plang === x[0] ? 'on' : '', pick: () => this.setState({ draft:Object.assign({}, d, { plang:x[0] }) }) })),
      startEdit: () => this.setState({ edit:true, draft:Object.assign({}, f), tried:false, saved:'' }), cancelEdit: () => this.setState({ edit:false, draft:null, tried:false }),
      busyCls: this.state.busy ? 'is-loading' : '',
      saveEdit: () => { if (errKeys.length) { this.setState({ tried:true }); return; } this.setState({ busy:true }); setTimeout(() => { this.setState({ busy:false, edit:false, f:Object.assign({}, d), draft:null, tried:false, saved:t.saved, locale: d.plang !== lang ? d.plang : this.state.locale }); }, 600); },
      onPhoto: (e) => { const x = e.target.files && e.target.files[0]; if (!x) return; this.flash(/\.(png|jpe?g)$/i.test(x.name) && x.size <= 5242880 ? t.photoOk : t.photoBad); },
      pw, pwType: this.state.pwShow ? 'text' : 'password', pwShown: this.state.pwShow ? 'true' : 'false', showL: this.state.pwShow ? t.hide : t.show, togShow: () => this.setState({ pwShow:!this.state.pwShow }),
      setCur: (e) => this.setState({ pw:Object.assign({}, pw, { cur:e.target.value }), pwDone:false }), setNew: (e) => this.setState({ pw:Object.assign({}, pw, { nw:e.target.value }), pwDone:false }), setRep: (e) => this.setState({ pw:Object.assign({}, pw, { rep:e.target.value }), pwDone:false }),
      meter, rules: [[r1,L('At least 10 characters','10 أحرف على الأقل')],[r3,L('Letters and numbers','أحرف وأرقام')],[r2,L('Different from your current password','مختلفة عن كلمة المرور الحالية')]].map(x => ({ cls: x[0] ? 'ok' : '', l:x[1] })),
      pw0Err, pw0Inv: pw0Err ? 'true' : 'false', pw0Cls: pw0Err ? 'is-error' : '', pw2Err, pw2Inv: pw2Err ? 'true' : 'false', pw2Cls: pw2Err ? 'is-error' : (pw.rep && pw.rep === pw.nw ? 'is-valid' : ''), pw1Cls: pwT && !(r1 && r2 && r3) ? 'is-error' : '',
      pwDone: this.state.pwDone, savePw: () => { if (!pwOk) { this.setState({ pwTried:true }); return; } this.setState({ pwDone:true, pwTried:false, pw:{ cur:'', nw:'', rep:'' } }); this.flash(t.pwChanged); },
      sessions: [ { d:L('This browser · Abu Dhabi','هذا المتصفح · أبوظبي'), m:L('Chrome on Windows · active now','Chrome على Windows · نشط الآن'), c:'#15801A' }, { d:L('iPhone · Dubai','iPhone · دبي'), m:L('DCT Learn on Safari · 2 days ago','DCT Learn على Safari · قبل يومين'), c:'#9A9188' } ],
      notifs, dirtyL: this.state.nDirty ? t.dirty : t.clean, saveN: () => { this.setState({ nDirty:false }); this.flash(t.nSaved); },
      exDone: this.state.ex, exOpen: !this.state.ex, exBusy: this.state.exBusy ? 'is-loading' : '', reqExport: () => { this.setState({ exBusy:true }); setTimeout(() => { this.setState({ ex:true, exBusy:false }); this.flash(t.exSent); }, 600); },
      delDone: this.state.del, delOpen: !this.state.del, delDlg: this.state.delDlg, openDel: () => this.setState({ delDlg:true, delText:'', delTried:false }), closeDel: () => this.setState({ delDlg:false }),
      delText: this.state.delText, setDel: (e) => this.setState({ delText:e.target.value }), delErr: this.state.delTried && this.state.delText !== 'DELETE', delInv: this.state.delTried && this.state.delText !== 'DELETE' ? 'true' : 'false', delCls: this.state.delTried && this.state.delText !== 'DELETE' ? 'is-error' : '',
      confirmDel: () => { if (this.state.delText !== 'DELETE') { this.setState({ delTried:true }); return; } this.setState({ delDlg:false, del:true }); this.flash(t.delSent); },
      delList: [ L('Your name becomes “Deleted user” and your e-mail is replaced by a code.','يصبح اسمك «مستخدم محذوف» ويُستبدل بريدك برمز.'), L('Your profile, answers and action plans are cleared.','تُمسح بياناتك الشخصية وإجاباتك وخطط عملك.'), L('Certificates keep their serial number but no longer show your name.','تحتفظ الشهادات برقمها التسلسلي دون اسمك.') ],
      retention: [ L('Inactive accounts are reviewed after 3 years.','تُراجع الحسابات غير النشطة بعد 3 سنوات.'), L('Security audit records are kept for 2 years.','تُحفظ سجلات التدقيق الأمني لمدة سنتين.'), L('We follow the UAE Personal Data Protection Law (PDPL).','نلتزم بقانون حماية البيانات الشخصية في دولة الإمارات.') ],
      toast: this.state.toast || false,
      stBtns: ST.map(x => ({ label:x[1], cls: x[0] === cur ? 'is-on' : '', pick: () => {
        if (x[0] === 'edit') this.setState({ tab:'details', edit:true, draft:Object.assign({}, f, { first:'', linkedin:'linkedin.com/saeed', mobile:'050-abc' }), tried:true, saved:'' });
        else if (x[0] === 'delete') this.setState({ tab:'data', delDlg:true, delText:'', delTried:false, del:false });
        else if (x[0] === 'requested') this.setState({ tab:'data', delDlg:false, ex:true, del:true });
        else this.setState({ tab:x[0], edit:false, draft:null, tried:false, delDlg:false, saved:'', ex:false, del:false }); } })),
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' })
    };
  }
}
