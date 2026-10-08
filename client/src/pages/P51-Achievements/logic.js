// Ported verbatim from the Claude Design artboard P51-Achievements (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, site:null, tab:null, pv:null, up:false, file:null, fileErr:'', confirm:false, confErr:false, ext19:'none', busy:false, toast:'' }; }

  /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  flash(msg){ this.setState({ toast: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast:'' }), 2800); }
  checkFile(name, size, ar){
    const ok = /\.(pdf|png|jpe?g)$/i.test(name);
    if (!ok) return ar ? 'نوع الملف غير مدعوم. استخدم PDF أو PNG أو JPG.' : 'This file type isn’t supported. Use PDF, PNG or JPG.';
    if (size > 5 * 1024 * 1024) return ar ? 'الملف أكبر من 5 ميجابايت. اختر ملفاً أصغر.' : 'This file is larger than 5 MB. Choose a smaller file.';
    return '';
  }

  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const site = this.state.site || this.props.site || 'employees';
    const tab = this.state.tab || this.props.tab || 'points';
    const L = (en, a) => ar ? a : en;
    const fmt = (n) => Number(n).toLocaleString(ar ? 'ar-AE' : 'en-US');
    const SN = { employees:['DCT Employees','موظفو الدائرة'], elevate:['Elevate 2026','إرتقاء 2026'], znm:['Zayed National Museum','متحف زايد الوطني'], zu:['ZU 24-Hour Challenge','تحدي جامعة زايد'], museopro:['MuseoPro','ميوزيو برو'], nibras:['Nibras — AI Champions','نبراس'] }[site];
    const siteName = L(SN[0], SN[1]);
    const t = ar ? {
      spec:'الإنجازات', h1:'إنجازاتك', sub:'نقاطك وشاراتك وشهاداتك وترتيبك بين أعضاء هذا البرنامج.', ledgerH:'سجل النقاط', last20:'آخر 20 حركة', trendH:'النقاط حسب الشهر', waysH:'كيف تكسب النقاط',
      dlPdf:'تنزيل PDF', preview:'معاينة', shareLi:'مشاركة على LinkedIn', certOf:'شهادة إتمام', close:'إغلاق', certAlt:'معاينة الشهادة', verify:'رابط التحقق العام:', dlDone:'جارٍ تنزيل الشهادة (PDF)',
      extH:'الشهادات الخارجية', extRule:'PDF أو PNG أو JPG · حتى 5 ميجابايت · يعتمدها المسؤول', upload:'ارفع الشهادة', withdraw:'سحب', upH:'ارفع شهادة خارجية', course:'الدورة', c19:'أخلاقيات الذكاء الاصطناعي', file:'ملف الشهادة', types:'PDF أو PNG أو JPG، حتى 5 ميجابايت',
      sampleOk:'استخدم ملفاً تجريبياً صالحاً', sampleBad:'جرّب ملفاً كبيراً جداً', confirmL:'أؤكد أن هذه شهادتي الصادرة من الشريك.', confErr:'يرجى التأكيد قبل الإرسال.', cancel:'إلغاء', submitUp:'إرسال للمراجعة', needFile:'اختر ملفاً للرفع.', sent:'تم إرسال الشهادة — ستصلك رسالة عند اعتمادها', withdrawn:'تم سحب الشهادة',
      lbH:'لوحة المتصدرين', lbNote:'أعضاء هذا البرنامج · الاسم والنقاط فقط', meH:'ترتيبك', earnMore:'اكسب المزيد من النقاط', noCerts:'لا توجد شهادات بعد'
    } : {
      spec:'Achievements', h1:'Your achievements', sub:'Your points, badges, certificates and where you stand among members of this programme.', ledgerH:'Points history', last20:'Last 20 entries', trendH:'Points by month', waysH:'How to earn points',
      dlPdf:'Download PDF', preview:'Preview', shareLi:'Share on LinkedIn', certOf:'Certificate of completion', close:'Close', certAlt:'Certificate preview', verify:'Public verification link:', dlDone:'Downloading your certificate (PDF)',
      extH:'External certificates', extRule:'PDF, PNG or JPG · max 5 MB · approved by an admin', upload:'Upload certificate', withdraw:'Withdraw', upH:'Upload an external certificate', course:'Course', c19:'Ethics of AI', file:'Certificate file', types:'PDF, PNG or JPG, up to 5 MB',
      sampleOk:'Use a valid sample file', sampleBad:'Try a file that’s too large', confirmL:'I confirm this is my own certificate issued by the partner.', confErr:'Please confirm before sending.', cancel:'Cancel', submitUp:'Send for review', needFile:'Choose a file to upload.', sent:'Certificate sent — we’ll e-mail you when it’s approved', withdrawn:'Certificate withdrawn',
      lbH:'Leaderboard', lbNote:'Members of this programme · name and points only', meH:'Your rank', earnMore:'Earn more points', noCerts:'No certificates yet'
    };
    const U = { employees:['Saeed Al Hammadi','سعيد الحمادي','SA','Specialist, DCT Culture','أخصائي، قطاع الثقافة'], elevate:['Saeed Al Hammadi','سعيد الحمادي','SA','Specialist, DCT Culture','أخصائي، قطاع الثقافة'], znm:['Yousef Al Zaabi','يوسف الزعابي','YZ','Gallery Host, ZNM','مضيف صالة عرض، المتحف'], zu:['Ahmed Khan','أحمد خان','AK','ZU student','طالب في جامعة زايد'], museopro:['Élise Martin','إليز مارتن','EM','Collections officer','مسؤولة مجموعات'], nibras:['Hamad Al Mazrouei','حمد المزروعي','HM','Data analyst','محلل بيانات'] }[site];
    const sh = this.shell(ar, 'learner', 'achievements', site, [ { label:siteName, href:'/'+site+'/dashboard' }, { label:L('Achievements','الإنجازات') } ]);
    sh.userName = L(U[0],U[1]); sh.initials = U[2]; sh.userSub = L(U[3],U[4]);

    const D_UNIT = 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5', D_DONE = 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 23l5-3 5 3-1.2-9.1', D_BADGE = 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z', D_EV = 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z';
    // ledger rows: [iso date, pts, kind(u|c|b|e), en, ar, course en, course ar]
    const LED = {
      saeed:[ ['2026-10-04',10,'u','Unit completed: Collections and care','درس مكتمل: المجموعات وصونها','Museum 101','المتاحف 101'], ['2026-09-29',10,'u','Unit completed: A short history of museums','درس مكتمل: تاريخ موجز للمتاحف','Museum 101','المتاحف 101'], ['2026-09-21',10,'u','Unit completed: What is a museum?','درس مكتمل: ما هو المتحف؟','Museum 101','المتاحف 101'], ['2026-09-10',30,'e','Workshop attended','حضور ورشة عمل','Creative Economy Masterclass','الصف المتقدم في الاقتصاد الإبداعي'],
        ['2026-08-25',40,'b','Badge earned: Culture explorer','شارة: مستكشف الثقافة','',''], ['2026-08-25',50,'c','Course completed','إكمال دورة','DCT World','عالم الدائرة'], ['2026-08-25',10,'u','Unit completed: Your role in the visitor journey','درس مكتمل: دورك في رحلة الزائر','DCT World','عالم الدائرة'], ['2026-08-25',10,'u','Unit completed: Abu Dhabi’s cultural sites','درس مكتمل: المواقع الثقافية في أبوظبي','DCT World','عالم الدائرة'],
        ['2026-08-18',10,'u','Unit completed: Our sectors','درس مكتمل: قطاعاتنا','DCT World','عالم الدائرة'], ['2026-08-18',10,'u','Unit completed: Who we are','درس مكتمل: من نحن','DCT World','عالم الدائرة'], ['2026-08-03',20,'b','Badge earned: Welcome aboard','شارة: أهلاً بك','',''], ['2026-08-03',50,'c','Course completed','إكمال دورة','DCTLEARN','منصة DCT Learn'], ['2026-08-03',10,'u','Unit completed: Your learning hub','درس مكتمل: مركز التعلّم','DCTLEARN','منصة DCT Learn'], ['2026-08-03',10,'u','Unit completed: Getting started','درس مكتمل: البداية','DCTLEARN','منصة DCT Learn'] ],
      yousef:[ ['2026-10-02',10,'u','Unit completed: Your role on the floor','درس مكتمل: دورك في الصالة','Operational Readiness – Role-Specific','الجاهزية التشغيلية – حسب الدور'], ['2026-09-24',60,'c','Assessment completed','إكمال تقييم','VS Knowledge Assessment','تقييم المعرفة'], ['2026-09-15',60,'b','Badge earned: Museum ready','شارة: جاهز للمتحف','',''], ['2026-09-15',80,'c','Course completed (3 units + bonus)','إكمال دورة (3 دروس + مكافأة)','Operational Readiness – Induction','الجاهزية التشغيلية – التعريف'], ['2026-08-27',80,'c','Course completed (3 units + bonus)','إكمال دورة (3 دروس + مكافأة)','Introduction to Ticketing','مقدمة في التذاكر'], ['2026-08-20',20,'b','Badge earned: Welcome aboard','شارة: أهلاً بك','',''] ],
      ahmed:[ ['2026-09-30',40,'e','Action plan submitted','إرسال خطة العمل','24-Hour Challenge 2026','تحدي 24 ساعة 2026'], ['2026-09-29',90,'c','Course completed (4 units + bonus)','إكمال دورة (4 دروس + مكافأة)','24 Hour Challenge','تحدي 24 ساعة'] ],
      elise:[ ['2026-10-01',10,'u','Unit completed: Handling artefacts','درس مكتمل: التعامل مع القطع','Conservation and Exhibition of Artefacts','صون وعرض القطع'], ['2026-09-18',30,'b','Badge earned: Conservation starter','شارة: بداية الصون','',''], ['2026-09-18',80,'c','Course completed (3 units + bonus)','إكمال دورة (3 دروس + مكافأة)','Condition Report','تقرير الحالة'], ['2026-09-01',20,'b','Badge earned: Welcome aboard','شارة: أهلاً بك','',''] ],
      hamad:[ ['2026-09-16',50,'c','External certificate approved','اعتماد شهادة خارجية','Introduction to Generative AI','مقدمة في الذكاء الاصطناعي التوليدي'], ['2026-08-12',10,'b','Badge earned: Welcome aboard','شارة: أهلاً بك','',''], ['2026-08-12',90,'c','Course completed (4 units + bonus)','إكمال دورة (4 دروس + مكافأة)','DCT World','عالم الدائرة'] ]
    };
    const who = { employees:'saeed', elevate:'saeed', znm:'yousef', zu:'ahmed', museopro:'elise', nibras:'hamad' }[site];
    const rows = LED[who];
    const total = rows.reduce((a, r) => a + r[1], 0);
    const MONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], MONA = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const MONF = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const byMon = {}; rows.forEach(r => { const m = +r[0].slice(5,7); byMon[m] = (byMon[m] || 0) + r[1]; });
    const thisMonth = byMon[10] || 0;
    const KC = { u:['#1D1650',D_UNIT], c:['#15801A',D_DONE], b:['#CD3151',D_BADGE], e:['#E35E3C',D_EV] };
    const ledger = []; let lastM = 0;
    rows.forEach(r => { const m = +r[0].slice(5,7); if (m !== lastM) { ledger.push({ isMon:true, isRow:false, mon:L(MONF[m-1], MONA[m-1]) + ' 2026', monPts:'+' + fmt(byMon[m]), c:'', d:'', reason:'', sub:'', pts:'' }); lastM = m; }
      const d = +r[0].slice(8,10);
      ledger.push({ isMon:false, isRow:true, mon:'', monPts:'', c:KC[r[2]][0], d:KC[r[2]][1], reason:L(r[3], r[4]), sub: (r[5] ? L(r[5], r[6]) + ' · ' : '') + fmt(d) + ' ' + L(MONS[m-1], MONA[m-1]), pts:'+' + fmt(r[1]) }); });
    const maxM = Math.max(byMon[8] || 0, byMon[9] || 0, byMon[10] || 0, 1);
    const trend = [8,9,10].map(m => ({ m:L(MONS[m-1], MONA[m-1]), v:fmt(byMon[m] || 0), h: Math.max(4, Math.round((byMon[m] || 0) / maxM * 120)) + 'px' }));

    // badges
    const BD = [ ['welcome','Welcome aboard','أهلاً بك','Finish your first onboarding course.','أكمل أول دورة تهيئة.','#D63539','#1D1650','M20 6 9 17 4 12'],
      ['explorer','Culture explorer','مستكشف الثقافة','Earn two certificates.','احصل على شهادتين.','#CD3151','#F77860','M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM16 8l-2 6-6 2 2-6z'],
      ['workshop','Workshop regular','زائر الورش','Attend a live workshop.','احضر ورشة مباشرة.','#3B2F92','#2FC4DB','M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
      ['museum','Museum master','خبير المتاحف','Complete Museum 101 and The World of Curation.','أكمل «المتاحف 101» و«عالم التقييم الفني».','#1D1650','#E35E3C','M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-7 10 7z'],
      ['heritage','Heritage keeper','حارس التراث','Complete Understanding Cultural Heritage.','أكمل «فهم التراث الثقافي».','#E35E3C','#F7C337','M4 21V9l8-6 8 6v12M9 21v-6h6v6'],
      ['perfect','Perfect score','الدرجة الكاملة','Score 100% on any quiz.','احصل على 100% في أي اختبار.','#15801A','#1D1650','M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z'] ];
    const EARN = { saeed:{ welcome:'3 Aug 2026', explorer:'25 Aug 2026', workshop:'10 Sep 2026' }, yousef:{ welcome:'20 Aug 2026', explorer:'15 Sep 2026' }, ahmed:{}, elise:{ welcome:'1 Sep 2026' }, hamad:{ welcome:'12 Aug 2026' } }[who];
    const badges = BD.map(b => { const e = EARN[b[0]]; return { name:L(b[1],b[2]), desc:L(b[3],b[4]), a:b[5], b:b[6], d:b[7], cls: e ? '' : 'locked', tag: e ? L('Earned ','حصلت عليها ') + e : L('Locked','مقفلة'), tagCls: e ? 'ok' : 'mut' }; });
    const nBadges = badges.filter(b => b.cls === '').length;

    // certificates
    const CERTS = { saeed:[ ['DCT World','عالم الدائرة','25/08/2026','25 Aug 2026','DCT-2026-C01-000184'], ['DCTLEARN','منصة DCT Learn','03/08/2026','3 Aug 2026','DCT-2026-C03-000097'] ],
      yousef:[ ['Operational Readiness – Induction','الجاهزية التشغيلية – التعريف','15/09/2026','15 Sep 2026','DCT-2026-C10-000052'], ['Introduction to Ticketing','مقدمة في التذاكر','27/08/2026','27 Aug 2026','DCT-2026-C09-000031'] ],
      ahmed:[ ['24 Hour Challenge – Introduction to Cultural Heritage','تحدي 24 ساعة – مقدمة في التراث الثقافي','29/09/2026','29 Sep 2026','DCT-2026-C13-000041'] ],
      elise:[ ['Condition Report: General Presentation','تقرير الحالة: عرض عام','18/09/2026','18 Sep 2026','DCT-2026-C14-000012'] ],
      hamad:[] }[who];
    const certs = CERTS.map(c => ({ title:L(c[0],c[1]), date:c[2], serial:c[4], tag:L('Issued','صادرة'), meta:L('Issued ','صدرت ') + c[3] + ' · ' + c[4], dl: () => this.flash(t.dlDone), view: () => this.setState({ pv:{ title:L(c[0],c[1]), date:c[2], serial:c[4] } }) }));
    const isNib = site === 'nibras';
    const e19 = this.state.ext19;
    const ext = isNib ? [ { ty:'PDF', docCls:'', title:L('Introduction to Generative AI','مقدمة في الذكاء الاصطناعي التوليدي'), meta:L('genai-certificate.pdf · uploaded 14 Sep 2026 · approved 16 Sep 2026','genai-certificate.pdf · رُفعت 14 سبتمبر 2026 · اعتُمدت 16 سبتمبر 2026'), tag:L('Approved','معتمدة'), tagCls:'ok', canUp:false, canDel:false },
      e19 === 'pending' ? { ty:'PDF', docCls:'', title:L('Ethics of AI','أخلاقيات الذكاء الاصطناعي'), meta:(this.state.file ? this.state.file.name : 'ethics-of-ai-certificate.pdf') + L(' · uploaded today · waiting for admin review',' · رُفعت اليوم · بانتظار مراجعة المسؤول'), tag:L('Pending review','قيد المراجعة'), tagCls:'warn', canUp:false, canDel:true }
                        : { ty:'—', docCls:'no', title:L('Ethics of AI','أخلاقيات الذكاء الاصطناعي'), meta:L('Not uploaded yet · AI Aware track','لم تُرفع بعد · مسار الوعي بالذكاء الاصطناعي'), tag:L('Awaiting upload','بانتظار الرفع'), tagCls:'mut', canUp:true, canDel:false } ] : [];

    // leaderboard
    const LB = { employees:[ ['Saeed Al Hammadi','سعيد الحمادي','SA',280,'#D63539',1], ['Reem Al Shamsi','ريم الشامسي','RS',200,'#3B2F92'], ['Hamad Al Mazrouei','حمد المزروعي','HM',150,'#CD3151'], ['Mona Al Ameri','منى العامري','MA',40,'#E35E3C'] ],
      elevate:[ ['Saeed Al Hammadi','سعيد الحمادي','SA',280,'#D63539',1] ], znm:[ ['Yousef Al Zaabi','يوسف الزعابي','YZ',310,'#D63539',1], ['Reem Al Shamsi','ريم الشامسي','RS',200,'#3B2F92'] ],
      zu:[ ['Ahmed Khan','أحمد خان','AK',130,'#D63539',1], ['Sara Haddad','سارة حداد','SH',90,'#3B2F92'] ], museopro:[ ['Élise Martin','إليز مارتن','EM',140,'#D63539',1] ], nibras:[ ['Hamad Al Mazrouei','حمد المزروعي','HM',150,'#D63539',1] ] }[site];
    const leaders = LB.map((x, i) => ({ rk:fmt(i + 1), name:L(x[0],x[1]) + (x[5] ? L(' (you)',' (أنت)') : ''), first:L(x[0].split(' ')[0], x[1].split(' ')[0]), ini:x[2], pts:fmt(x[3]) + L(' pts',' نقطة'), c:x[4], cls: x[5] ? 'me' : '' }));
    const podium = leaders.length >= 3 ? [ Object.assign({}, leaders[1], { cls:'p2' }), Object.assign({}, leaders[0], { cls:'p1' }), Object.assign({}, leaders[2], { cls:'p3' }) ] : [];
    const meIdx = LB.findIndex(x => x[5]);
    const gap = meIdx === 0 && LB.length > 1 ? LB[0][3] - LB[1][3] : 0;

    const KI = { star:'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z', up:'M3 17l6-6 4 4 8-8M14 7h7v7', award:'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 23l5-3 5 3-1.2-9.1M12 6.5l1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6 2.2-.3z', trophy:'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3' };
    const nCerts = certs.length + (isNib ? 1 : 0);
    const kpis = [ [L('Total points','مجموع النقاط'), fmt(total), L('pts','نقطة'), L('since ','منذ ') + L(MONS[+rows[rows.length-1][0].slice(5,7)-1], MONA[+rows[rows.length-1][0].slice(5,7)-1]) + ' 2026', 'k-red', KI.star],
      [L('This month','هذا الشهر'), fmt(thisMonth), L('pts','نقطة'), L('October 2026','أكتوبر 2026'), 'k-ink', KI.up],
      [L('Certificates','الشهادات'), fmt(nCerts), '', isNib ? L('1 external · approved','خارجية معتمدة') : L('ready to download','قابلة للتنزيل'), 'k-yel', KI.award],
      [L('Rank','الترتيب'), '#' + fmt(meIdx + 1), '', L('of ','من ') + fmt(LB.length) + L(' in ',' في ') + siteName, 'k-rasp', KI.trophy] ].map(k => ({ l:k[0], v:k[1], u:k[2], n:k[3], cls:k[4], d:k[5] }));

    const TABS = [['points',L('Points','النقاط'),rows.length],['badges',L('Badges','الشارات'),nBadges],['certificates',L('Certificates','الشهادات'),nCerts],['leaderboard',L('Leaderboard','المتصدرون'),0]];
    const ptabs = TABS.map(x => ({ label:x[1], n: x[2] ? fmt(x[2]) : false, cls: x[0] === tab ? 'on' : '', cur: x[0] === tab ? 'page' : 'false', pick: () => this.setState({ tab:x[0] }) }));
    const f = this.state.file;
    const fileErr = this.state.fileErr;
    const ST = isNib ? [['certificates',L('Certificates','الشهادات')],['upload','Upload dialog'],['pending','Pending']] : [];
    return {
      lang, dir: ar?'rtl':'ltr', t, sh, siteName, ptabs, kpis, protoCls: this.props.proto ? 'proto' : '', route:'/'+site+'/achievements',
      isPoints: tab === 'points', isBadges: tab === 'badges', isCerts: tab === 'certificates', isLb: tab === 'leaderboard',
      ledger, trend, trendAria: trend.map(x => x.m + ' ' + x.v).join(', '),
      ways: [[L('Complete a unit','إكمال درس'),'+10'],[L('Complete a course','إكمال دورة'),'+50'],[L('Attend a workshop','حضور ورشة'),'+30'],[L('Earn a badge','الحصول على شارة'),L('+10 to +60','+10 إلى +60')]].map(x => ({ l:x[0], v:x[1] })),
      badges, certs, hasCerts: certs.length > 0, hasExt: isNib, ext,
      leaders, podium, hasPodium: podium.length > 0, myRank:'#' + fmt(meIdx + 1), myRankL: L('of ','من ') + fmt(LB.length) + L(' members',' أعضاء'),
      meP: gap ? L('You lead by ','أنت في الصدارة بفارق ') + fmt(gap) + L(' points. Keep going — finishing a course adds 50.',' نقطة. استمر — إكمال دورة يضيف 50.') : L('You’re the only ranked member so far. Points from units and courses will keep you on top.','أنت العضو الوحيد في الترتيب حتى الآن. ستبقيك نقاط الدروس والدورات في المقدمة.'),
      coursesHref:'/'+site+'/hub/' + (site === 'elevate' ? 'mentors' : 'courses'),
      pv: this.state.pv || false, closePv: () => this.setState({ pv:null }), pvDl: () => { this.setState({ pv:null }); this.flash(t.dlDone); },
      upOpen: this.state.up, openUp: () => this.setState({ up:true, file:null, fileErr:'', confirm:false, confErr:false }), closeUp: () => this.setState({ up:false }),
      dropCls: fileErr ? 'err' : f ? 'ok' : '', dropH: f ? f.name + ' · ' + (f.size / 1048576).toFixed(1) + ' MB' : L('Drop a file here or click to choose','أفلت الملف هنا أو انقر للاختيار'), fileErr: fileErr || false,
      onFile: (e) => { const x = e.target.files && e.target.files[0]; if (!x) return; const er = this.checkFile(x.name, x.size, ar); this.setState({ file: er ? null : { name:x.name, size:x.size }, fileErr:er }); },
      sampleOk: () => this.setState({ file:{ name:'ethics-of-ai-certificate.pdf', size:1258291 }, fileErr:'' }),
      sampleBad: () => this.setState({ file:null, fileErr:this.checkFile('ethics-scan.png', 7340032, ar) }),
      confirm: this.state.confirm, togConfirm: () => this.setState({ confirm:!this.state.confirm, confErr:false }), confErr: this.state.confErr,
      busyCls: this.state.busy ? 'is-loading' : '',
      submitUp: () => { const er = f ? '' : t.needFile; if (er || !this.state.confirm) { this.setState({ fileErr: er || fileErr, confErr: !this.state.confirm }); return; } this.setState({ busy:true }); setTimeout(() => { this.setState({ busy:false, up:false, ext19:'pending' }); this.flash(t.sent); }, 700); },
      withdraw: () => { this.setState({ ext19:'none', file:null }); this.flash(t.withdrawn); },
      toast: this.state.toast || false,
      siteBtns: [['employees','Employees'],['elevate','Elevate'],['znm','ZNM'],['zu','ZU'],['museopro','MuseoPro'],['nibras','Nibras']].map(x => ({ label:x[1], cls: x[0] === site ? 'is-on' : '', pick: () => this.setState({ site:x[0], ext19:'none', up:false, pv:null }) })),
      stBtns: [['points','Points'],['badges','Badges'],['certificates','Certificates'],['leaderboard','Leaderboard'],['preview','Cert preview']].concat(isNib ? [['upload','Upload dialog'],['pending','Pending']] : []).map(x => ({ label:x[1], cls: (x[0] === tab && !this.state.up && !this.state.pv && !(x[0] === 'certificates' && e19 === 'pending')) || (x[0] === 'upload' && this.state.up) || (x[0] === 'pending' && e19 === 'pending' && !this.state.up) || (x[0] === 'preview' && this.state.pv) ? 'is-on' : '',
        pick: () => { if (x[0] === 'upload') this.setState({ tab:'certificates', up:true, file:null, fileErr:'', confirm:false, pv:null }); else if (x[0] === 'pending') this.setState({ tab:'certificates', up:false, ext19:'pending', file:{ name:'ethics-of-ai-certificate.pdf', size:1258291 }, pv:null }); else if (x[0] === 'preview') { if (CERTS[0]) this.setState({ tab:'certificates', up:false, pv:{ title:L(CERTS[0][0],CERTS[0][1]), date:CERTS[0][2], serial:CERTS[0][4] } }); else this.setState({ tab:'certificates' }); } else this.setState({ tab:x[0], up:false, pv:null, ext19: x[0] === 'certificates' ? 'none' : e19 }); } })),
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' })
    };
  }
}
