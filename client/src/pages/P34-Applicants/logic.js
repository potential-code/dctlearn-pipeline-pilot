// Ported verbatim from the Claude Design artboard P34-Applicants (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){
    super(p);
    this.state = { locale:null, round:null, sel:null, dlg:undefined, filter:'all', q:'', page:1,
      scores:{ ahmed:{ s:[8,8,6,7], fb:'Clear, community-led idea with a strong hook. The tagline could be sharper, and the pitch would be stronger with a simple budget and a plan for shopkeepers who don’t want to record.' }, sara:null },
      draft:null, toast:null };
  }

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
    const S = this.state;
    const set = (o) => this.setState(o);
    const round = S.round || this.props.round || 'judging';
    const ro = round !== 'judging';
    const selKey = S.sel || this.props.applicant || 'sara';
    const dlgOn = S.dlg === undefined ? this.props.dialog === 'grade' : S.dlg;

    const t = ar ? {
      spec:'المتقدمون والتقييم', ey:'بوابة المحكّمين · تحدي جامعة زايد', h1:'المتقدمون', sub:'قيّمي المشاركات المسندة إليك. يظهر المتقدمون بالاسم والموقع المصغّر فقط.', back:'لوحة المحكّم',
      round:'الجولة', rdOpt:'تحدي الـ24 ساعة 2026 · جامعة زايد', chips:['الكل','بانتظار التقييم','مقيّمة'], search:'ابحثي بالاسم', listTitle:'المسندة إليك', noMatch:'لا يوجد متقدمون مطابقون', clear:'مسح عوامل التصفية',
      site:'تحدي جامعة زايد', qaTitle:'خطة العمل', qaSub:'الدرس الأخير في C13 · ثلاث إجابات', pdfTitle:'ملف العرض', pdfSub:'رابط موقّع · ينتهي بعد 5 دقائق', prevPg:'الصفحة السابقة', nextPg:'الصفحة التالية', openPdf:'فتح في علامة تبويب جديدة', pages:'صفحات العرض',
      privacy:'لا تظهر عناوين البريد الإلكتروني أو أرقام الهواتف أو بيانات الجامعة للمحكّمين.',
      gSub:'تحدي الـ24 ساعة 2026 · قيّمي كل معيار من 1 إلى 10', wTotal:'المجموع المرجّح', roDlgT:'للعرض فقط', fb:'ملاحظات للمشرف', optional:'(اختياري)', fbPh:'ما الذي نجح؟ ما الذي يمكن تحسينه؟', fbErr:'الحد الأقصى 1,000 حرف.', fbHint:'تظهر للمشرف الفرعي في صفحة الدرجات، ولا تظهر للمتقدم.', close:'إغلاق'
    } : {
      spec:'Applicants & grading', ey:'Judge portal · ZU 24-Hour Challenge', h1:'Applicants', sub:'Score the submissions assigned to you. Applicants are shown by name and microsite only.', back:'Judge dashboard',
      round:'Round', rdOpt:'24-Hour Challenge 2026 · ZU', chips:['All','Pending','Graded'], search:'Search by name', listTitle:'Assigned to you', noMatch:'No applicants match', clear:'Clear filters',
      site:'ZU 24-Hour Challenge', qaTitle:'Action plan', qaSub:'Final unit of C13 · three answers', pdfTitle:'Pitch PDF', pdfSub:'Signed link · expires in 5 minutes', prevPg:'Previous page', nextPg:'Next page', openPdf:'Open in a new tab', pages:'Pitch pages',
      privacy:'Judges never see applicants’ e-mail addresses, phone numbers or university records.',
      gSub:'24-Hour Challenge 2026 · score each criterion from 1 to 10', wTotal:'Weighted total', roDlgT:'View only', fb:'Feedback for the sub admin', optional:'(optional)', fbPh:'What worked? What could be stronger?', fbErr:'Keep it under 1,000 characters.', fbHint:'Shown to the sub admin on the scores page, not to the applicant.', close:'Close'
    };

    const RUB = [ [L('Name/tagline captures the essence','الاسم/الشعار يعبّر عن الجوهر'),15,'#1D1650'], [L('Short description communicates the key message','الوصف المختصر يوصل الرسالة الأساسية'),25,'#CD3151'], [L('Creativity and originality','الإبداع والأصالة'),20,'#E35E3C'], [L('Will it grab attention and drive participation','هل سيجذب الانتباه ويحفّز المشاركة'),40,'#D63539'] ];
    const QS = [L('Name and tagline of your campaign','اسم حملتك وشعارها'), L('Short description — what is it and who is it for?','وصف مختصر — ما هي ولمن؟'), L('Why will it grab attention and drive participation?','لماذا ستجذب الانتباه وتحفّز المشاركة؟')];
    const AP = {
      ahmed:{ name:L('Ahmed Khan','أحمد خان'), ini:'AK', c:'#E35E3C', accent:'#E35E3C', sub:L('Submitted Wed 30 Sep 2026 · 14:20 Gulf','قُدّمت الأربعاء 30 سبتمبر 2026 · 14:20 بتوقيت الخليج'), short:L('Submitted 30 Sep','قُدّمت 30 سبتمبر'), pdf:'Souq-Stories-pitch.pdf · 6 pages · 2.4 MB', pages:6,
        a:[ L('Souq Stories — Every stall has a story','حكايات السوق — لكل دكّان حكاية'),
            L('A 24-hour pop-up trail through Al Ain’s old souq. Students record 60-second audio stories with shopkeepers and link them to QR codes on each stall. Visitors scan, listen and collect stamps in a printed heritage passport; the best stories are shared on the university’s social channels.','مسار مؤقت لمدة 24 ساعة في سوق العين القديم. يسجّل الطلاب حكايات صوتية مدتها 60 ثانية مع أصحاب المحلات ويربطونها برموز QR على كل دكّان. يمسح الزوار الرمز ويستمعون ويجمعون الأختام في جواز تراثي مطبوع، وتُنشر أفضل الحكايات على حسابات الجامعة.'),
            L('People love real voices and a reason to explore. The passport turns the visit into a game, QR codes cost almost nothing, and shopkeepers share their own clips with family and customers — so the campaign spreads through the community, not just through ads.','يحب الناس الأصوات الحقيقية وسبباً للاستكشاف. يحوّل الجواز الزيارة إلى لعبة، ورموز QR شبه مجانية، ويشارك أصحاب المحلات مقاطعهم مع عائلاتهم وزبائنهم — فتنتشر الحملة عبر المجتمع لا عبر الإعلانات فقط.') ],
        slides:[ [L('Pitch · ZU 24-Hour Challenge','عرض · تحدي جامعة زايد'), L('Souq Stories','حكايات السوق'), L('Every stall has a story.','لكل دكّان حكاية.')], [L('The problem','المشكلة'), L('Young people walk past the souq','الشباب يمرّون بالسوق دون توقف'), L('Heritage feels distant; stories stay with the shopkeepers.','يبدو التراث بعيداً، وتبقى الحكايات مع أصحاب المحلات.')], [L('The idea','الفكرة'), L('60-second voices','أصوات في 60 ثانية'), L('QR codes on every stall link to a short recorded story.','رموز QR على كل دكّان تقود إلى حكاية قصيرة مسجّلة.')], [L('The journey','الرحلة'), L('Scan · listen · stamp','امسح · استمع · اختم'), L('A printed heritage passport turns the visit into a game.','جواز تراثي مطبوع يحوّل الزيارة إلى لعبة.')], [L('Reach','الوصول'), L('Shared by the souq itself','ينشره السوق بنفسه'), L('Shopkeepers forward their clips; ZU channels share the best.','يشارك أصحاب المحلات مقاطعهم وتنشر الجامعة الأفضل.')], [L('Next steps','الخطوات التالية'), L('Pilot with 12 stalls','تجربة مع 12 دكّاناً'), L('One weekend in November, then the whole souq.','عطلة أسبوعية واحدة في نوفمبر، ثم السوق كله.')] ] },
      sara:{ name:L('Sara Haddad','سارة حداد'), ini:'SH', c:'#3B2F92', accent:'#3B2F92', sub:L('Submitted Sun 4 Oct 2026 · 21:05 Gulf','قُدّمت الأحد 4 أكتوبر 2026 · 21:05 بتوقيت الخليج'), short:L('Submitted 4 Oct','قُدّمت 4 أكتوبر'), pdf:'Threads-of-Sadu-pitch.pdf · 5 pages · 1.9 MB', pages:5,
        a:[ L('Threads of Sadu — Weave yourself into heritage','خيوط السدو — انسج نفسك في التراث'),
            L('A one-day campus installation where students and visitors add a strip of coloured fabric to a giant collaborative Al Sadu loom, guided by weavers from the Women’s Association. Each strip carries a handwritten wish for the UAE’s future, and the finished piece is displayed in the library.','عمل تركيبي ليوم واحد في الحرم الجامعي، يضيف فيه الطلاب والزوار شريطاً ملوّناً إلى نول سدو جماعي كبير بإرشاد نسّاجات من جمعية المرأة. يحمل كل شريط أمنية مكتوبة بخط اليد لمستقبل الإمارات، وتُعرض القطعة المكتملة في المكتبة.'),
            L('It is hands-on, photogenic and personal: everyone leaves a visible mark. Live weaving demonstrations draw a crowd, the growing loom gives people a reason to come back during the day, and the finished artwork keeps the story alive after the event.','تجربة عملية وجذابة بصرياً وشخصية: يترك كل مشارك أثراً واضحاً. تجذب عروض النسيج الحيّة الجمهور، ويمنح النول المتنامي سبباً للعودة خلال اليوم، وتُبقي القطعة المكتملة الحكاية حيّة بعد الفعالية.') ],
        slides:[ [L('Pitch · ZU 24-Hour Challenge','عرض · تحدي جامعة زايد'), L('Threads of Sadu','خيوط السدو'), L('Weave yourself into heritage.','انسج نفسك في التراث.')], [L('Why Sadu','لماذا السدو'), L('A UNESCO-listed craft','حرفة مدرجة لدى اليونسكو'), L('Few students have ever touched a loom.','قلّة من الطلاب لمسوا نولاً من قبل.')], [L('The installation','العمل التركيبي'), L('One loom, a thousand hands','نول واحد وألف يد'), L('Strips of fabric, each with a written wish.','شرائط قماش يحمل كل منها أمنية مكتوبة.')], [L('The day','اليوم'), L('Watch · weave · return','شاهد · انسج · عُد'), L('Live demos every two hours keep people coming back.','عروض حيّة كل ساعتين تعيد الناس مجدداً.')], [L('Legacy','الأثر'), L('A library centrepiece','قطعة محورية في المكتبة'), L('The finished weave tells the campus story all year.','تروي القطعة المكتملة حكاية الحرم طوال العام.')] ] }
    };
    const sc = S.scores;
    const totalOf = (arr) => arr.reduce((a, v, i) => a + (v ? v / 10 * RUB[i][1] : 0), 0);
    const fmt1 = (n) => n.toFixed(1);
    const isGraded = (k) => !!sc[k];

    const pendN = ['sara','ahmed'].filter(k => !isGraded(k)).length;
    const sh = this.shell(ar, 'judge', 'applicants', null, [ { label: L('Judge portal','بوابة المحكّمين'), href:'/judge' }, { label: L('Applicants','المتقدمون') } ]);
    sh.nav = sh.nav.map(n => n.key === 'applicants' ? { ...n, cnt: pendN && !ro ? String(pendN) : false } : n);

    const stTag = (k) => isGraded(k) ? [L('Graded','مقيّمة'),'ok'] : ro ? [L('Not scored','لم تُقيَّم'),'mut'] : [L('Pending','بانتظار التقييم'),'warn'];
    const keys = ['ahmed','sara'];
    const counts = { all:2, pending:pendN, graded:2 - pendN };
    const chips = ['all','pending','graded'].map((f, i) => ({ label:t.chips[i], n:String(counts[f]), cls: S.filter === f ? 'on' : '', sel: S.filter === f ? 'true' : 'false', pick: () => set({ filter:f }) }));
    const q = S.q.trim().toLowerCase();
    const vis = keys.filter(k => (S.filter === 'all' || (S.filter === 'graded') === isGraded(k)) && (!q || AP[k].name.toLowerCase().includes(q) || L('','').includes(q)));
    const list = vis.map(k => { const tg = stTag(k); return { name:AP[k].name, ini:AP[k].ini, c:AP[k].c, site:t.site, sub:AP[k].short, tag:tg[0], tagCls:tg[1], graded:isGraded(k), score: isGraded(k) ? fmt1(totalOf(sc[k].s)) : '', cls: k === selKey ? 'on' : '', sel: k === selKey ? 'true' : 'false', pick: () => set({ sel:k, page:1 }) }; });

    const k = selKey, A = AP[k], tg = stTag(k);
    const cur = { name:A.name, ini:A.ini, c:A.c, accent:A.accent, sub:A.sub, tag:tg[0], tagCls:tg[1], graded:isGraded(k), pdf:A.pdf,
      score: isGraded(k) ? fmt1(totalOf(sc[k].s)) : '', scoreAria: isGraded(k) ? L('Your score ' + fmt1(totalOf(sc[k].s)) + ' out of 100','درجتك ' + fmt1(totalOf(sc[k].s)) + ' من 100') : '',
      cta: ro ? (isGraded(k) ? L('View score','عرض الدرجة') : L('View rubric','عرض المعايير')) : isGraded(k) ? L('Edit score','تعديل الدرجة') : L('Grade','تقييم'), btnCls: !ro && !isGraded(k) ? 'btn-primary' : 'btn-line',
      mine: isGraded(k) ? sc[k].s.map((v, i) => ({ q:RUB[i][0] + ' · ' + RUB[i][1] + '%', v: v + ' / 10', pp: '= ' + fmt1(v / 10 * RUB[i][1]) + L(' pts',' نقطة'), p:(v * 10) + '%', c:RUB[i][2] })) : [],
      answers: A.a.map((a, i) => ({ n:String(i + 1), q:QS[i], a, cls: i === 0 ? 'hl' : '', c:['#1D1650','#CD3151','#E35E3C'][i], cc: a.length + ' / 500' })) };
    const page = Math.min(S.page, A.pages);
    const sl = A.slides[page - 1];
    const slide = { k:sl[0], h:sl[1], p:sl[2], aria: L('Page ' + page + ': ' + sl[1], 'الصفحة ' + page + ': ' + sl[1]) };
    const thumbs = A.slides.map((x, i) => ({ n:String(i + 1), cls: i + 1 === page ? 'on' : '', cur: i + 1 === page ? 'page' : 'false', aria: L('Page ' + (i + 1), 'الصفحة ' + (i + 1)), pick: () => set({ page:i + 1 }) }));

    /* grade dialog */
    const D = (S.draft && S.draft.key === k) ? S.draft : (isGraded(k) ? { s:sc[k].s.slice(), touched:[true,true,true,true], fb:sc[k].fb, tried:false, key:k } : { s:[5,5,5,5], touched:[false,false,false,false], fb:'', tried:false, key:k });
    const setD = (o) => set({ draft:{ ...D, ...o } });
    const eff = D.s.map((v, i) => D.touched[i] ? v : 0);
    const tot = totalOf(eff);
    const nT = D.touched.filter(Boolean).length;
    const FB_MAX = 1000;
    const fbOver = D.fb.length > FB_MAX;
    const showUn = !ro || isGraded(k);
    const g = { on: !!dlgOn, ro, title: ro ? L(A.name + ' · your score', A.name + ' · درجتك') : isGraded(k) ? L('Edit score · ' + A.name,'تعديل الدرجة · ' + A.name) : L('Score ' + A.name,'تقييم ' + A.name),
      total: fmt1(tot), totalPct: tot + '%',
      totalSub: nT === 4 ? L('All 4 criteria scored','تم تقييم المعايير الأربعة') : L(nT + ' of 4 criteria scored — move each slider to score it', 'تم تقييم ' + nT + ' من 4 — حرّكي كل مؤشر لتقييمه'),
      crit: RUB.map((r, i) => { const tch = D.touched[i] && showUn; const v = D.s[i];
        const upd = (val) => { if (ro) return; const s = D.s.slice(); s[i] = val; const tc = D.touched.slice(); tc[i] = true; setD({ s, touched:tc }); };
        return { id:'cr' + i, q:r[0], w:r[1] + '%', c:r[2], v:String(v), p: ((v - 1) / 9 * 100) + '%', rCls: tch ? '' : 'un', valCls: tch ? '' : 'un',
          val: tch ? v + ' / 10' : L('Not scored','لم يُقيَّم'), vt: tch ? L(v + ' out of 10',v + ' من 10') : L('Not scored','لم يُقيَّم'),
          pts: tch ? '= ' + fmt1(v / 10 * r[1]) + L(' pts',' نقطة') : '— / ' + r[1], on: (e) => upd(+e.target.value), touch: () => { if (!D.touched[i]) upd(v); } }; }),
      missErr: D.tried && nT < 4, missMsg: L('Score every criterion before submitting (' + (4 - nT) + ' left).','قيّمي كل المعايير قبل الإرسال (متبقٍ ' + (4 - nT) + ').'),
      fb:D.fb, fbLen: D.fb.length.toLocaleString('en-US') + ' / 1,000', fbCnt: fbOver ? 'over' : D.fb.length > 900 ? 'warn' : '', fbErr: D.tried && fbOver, fbCls: D.tried && fbOver ? 'is-error' : '',
      onFb: (e) => setD({ fb:e.target.value }),
      canSubmit: !ro, closeLbl: ro ? t.close : L('Cancel','إلغاء'), submitLbl: isGraded(k) ? L('Update score','تحديث الدرجة') : L('Submit score','إرسال الدرجة'),
      submit: () => { if (nT < 4 || fbOver) return setD({ tried:true });
        set({ scores:{ ...sc, [k]:{ s:D.s.slice(), fb:D.fb.trim() } }, draft:null, dlg:false });
        clearTimeout(this._tt); this._tt = setTimeout(() => set({ toast:null }), 6000);
        set({ toast:{ t: L('Score submitted · ' + fmt1(tot) + ' / 100','تم إرسال الدرجة · ' + fmt1(tot) + ' / 100'), m: L(A.name + ' is now graded. You can edit it until the round closes.','أصبحت مشاركة ' + A.name + ' مقيّمة. يمكنك التعديل حتى تُغلق الجولة.') } }); } };

    const roT = round === 'open' ? L('Scoring hasn’t started','لم يبدأ التقييم بعد') : L('This round is closed','أُغلقت الجولة');
    const roP = round === 'open' ? L('The round is still open for submissions. You can read submissions now; scoring opens when the round moves to judging.','ما زالت الجولة مفتوحة لاستقبال المشاركات. يمكنك قراءة المشاركات الآن، ويبدأ التقييم عند انتقال الجولة إلى مرحلة التحكيم.') : L('Scores are locked and visible to the sub admin and, with ranks, to learners. You can view but not change them.','أُقفلت الدرجات وأصبحت مرئية للمشرف الفرعي، ومع الترتيب للمتعلمين. يمكنك عرضها دون تعديلها.');

    return {
      lang, dir: ar ? 'rtl' : 'ltr', t, sh, chips, list, noList: list.length === 0, listCnt: L(list.length + ' of 2', list.length + ' من 2'), cur, slide, thumbs, g,
      pgLabel: page + ' / ' + A.pages, prevPg: () => set({ page: Math.max(1, page - 1) }), nextPg: () => set({ page: Math.min(A.pages, page + 1) }),
      q:S.q, onQ: (e) => set({ q:e.target.value }), clearF: () => set({ q:'', filter:'all' }),
      ro, roCls: round === 'open' ? 'alert-warn' : 'alert-info', roT, roP,
      openGrade: () => set({ dlg:true, draft:null }), closeDlg: () => set({ dlg:false, draft:null }),
      toast: S.toast ? { on:true, title:S.toast.t, msg:S.toast.m, close: () => set({ toast:null }) } : { on:false, title:'', msg:'', close:null },
      aSeg: [['sara','Sara (pending)'],['ahmed','Ahmed (graded)']].map(x => ({ label:x[1], cls: selKey === x[0] ? 'is-on' : '', pick: () => set({ sel:x[0], draft:null, page:1 }) })),
      dSeg: [['none','No dialog'],['grade','Grade dialog']].map(x => ({ label:x[1], cls: (!!dlgOn) === (x[0] === 'grade') ? 'is-on' : '', pick: () => set({ dlg: x[0] === 'grade', draft:null }) })),
      rSeg: [['judging','Judging'],['open','Open'],['closed','Closed']].map(x => ({ label:x[1], cls: round === x[0] ? 'is-on' : '', pick: () => set({ round:x[0], draft:null }) })),
      protoCls: this.props.proto ? 'proto' : '',
      enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => set({ locale:'en' }), setAr: () => set({ locale:'ar' }), toggleLang: () => set({ locale: ar ? 'en' : 'ar' })
    };
  }
}
