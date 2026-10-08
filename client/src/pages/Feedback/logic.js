// Ported verbatim from the Claude Design artboard Feedback (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, toasts:[], dlg:true, err:'error' }; this.n = 0; }
  push(kind, title, body){
    const id = ++this.n;
    this.setState({ toasts: this.state.toasts.concat([{ id:id, kind:kind, title:title, body:body }]).slice(-3) });
    setTimeout(() => this.setState({ toasts: this.state.toasts.filter((x) => x.id !== id) }), 4000);
  }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const EN = { sys:'Design system · Feedback', alerts:'Alerts', alertsNote:'Inline, inside the page flow, for conditions the user should read before acting. Icon + title + one sentence; the colour never carries the meaning on its own.', infoT:'Mentee registration is open', infoB:'Elevate 2026 is accepting applications until 15 October.', okT:'Certificate issued', okB:'Your DCT World certificate is ready to download from Achievements.', warnT:'Your invitation expires in 3 days', warnB:'Accept before 15 October to keep your place in the Elevate cohort.', renew:'Accept now', errT:'Quiz attempt not saved', errB:'The connection dropped during submission. Your answers are kept locally — retry to submit.', toastDialog:'Toast and dialog', toastNote:'A toast confirms something that already happened and leaves on its own. A dialog interrupts for a decision that cannot be undone.', toast:'Toast', toastHint:'Bottom-end corner, stacks up to three, 4 s timer bar, dismissible. The static one below is the anatomy.', showSuccess:'Show success toast', showInfo:'Show info toast', tOkT:'Session booked', tOkB:'Sun 12 Oct · 11:00 with Dr. Hessa Al Nuaimi', dialog:'Dialog', dialogHint:'Scrim with blur, 520 px panel, destructive action on the primary button with a plain verb.', cancelBooking:'Cancel booking', dlgT:'Cancel this session?', dlgB:'Dr. Hessa Al Nuaimi will be notified. Sessions cancelled less than 24 hours ahead count towards your no-show limit.', keep:'Keep session', confirmCancel:'Cancel session', states:'Empty, loading, error', statesNote:'Every list and page shows these three states. Loading mirrors the shape of the content that will arrive, never a spinner on a blank page.', empty:'Empty', emptyT:'No sessions yet', emptyB:'Once you book a mentor, your upcoming sessions appear here.', findMentor:'Find a mentor', loading:'Loading', error:'Error', withRetry:'with retry', errorT:'Could not load your courses', errorB:'The catalogue did not respond. Check your connection and try again.', retry:'Try again', recoveredT:'Back online', recoveredB:'Your courses loaded. This is the success state after retry.', reset:'Reset demo' };
    const AR = { sys:'نظام التصميم · التغذية الراجعة', alerts:'التنبيهات', alertsNote:'مضمّنة داخل تدفق الصفحة، للحالات التي ينبغي قراءتها قبل التصرف. أيقونة + عنوان + جملة واحدة؛ لا يحمل اللون المعنى وحده أبداً.', infoT:'التسجيل للمتدربين مفتوح', infoB:'يقبل برنامج إرتقاء 2026 الطلبات حتى 15 أكتوبر.', okT:'صدرت الشهادة', okB:'شهادة عالم الدائرة جاهزة للتنزيل من صفحة الإنجازات.', warnT:'تنتهي دعوتك خلال 3 أيام', warnB:'اقبلها قبل 15 أكتوبر للاحتفاظ بمقعدك في دفعة إرتقاء.', renew:'اقبل الآن', errT:'لم تُحفظ محاولة الاختبار', errB:'انقطع الاتصال أثناء الإرسال. إجاباتك محفوظة محلياً — أعد المحاولة للإرسال.', toastDialog:'الإشعار المنبثق ومربع الحوار', toastNote:'يؤكد الإشعار المنبثق أمراً حدث بالفعل ويختفي وحده. يقاطع مربع الحوار من أجل قرار لا يمكن التراجع عنه.', toast:'إشعار منبثق', toastHint:'في الزاوية السفلية، يتراكم حتى ثلاثة، شريط مؤقت 4 ثوانٍ، قابل للإغلاق. النموذج الثابت أدناه يوضح البنية.', showSuccess:'أظهر إشعار نجاح', showInfo:'أظهر إشعار معلومات', tOkT:'تم حجز الجلسة', tOkB:'الأحد 12 أكتوبر · 11:00 مع د. حصة النعيمي', dialog:'مربع حوار', dialogHint:'خلفية معتمة مع ضبابية، لوحة بعرض 520 بكسل، الإجراء الحذفي على الزر الأساسي بفعل واضح.', cancelBooking:'إلغاء الحجز', dlgT:'إلغاء هذه الجلسة؟', dlgB:'ستُبلَّغ د. حصة النعيمي. تُحتسب الجلسات الملغاة قبل أقل من 24 ساعة ضمن حد الغياب.', keep:'الاحتفاظ بالجلسة', confirmCancel:'إلغاء الجلسة', states:'فارغ، تحميل، خطأ', statesNote:'تعرض كل قائمة وصفحة هذه الحالات الثلاث. يحاكي التحميل شكل المحتوى القادم، وليس مؤشراً دوّاراً على صفحة فارغة.', empty:'فارغ', emptyT:'لا جلسات بعد', emptyB:'بمجرد حجز مرشد، تظهر جلساتك القادمة هنا.', findMentor:'ابحث عن مرشد', loading:'تحميل', error:'خطأ', withRetry:'مع إعادة المحاولة', errorT:'تعذّر تحميل دوراتك', errorB:'لم يستجب الكتالوج. تحقق من اتصالك وحاول مرة أخرى.', retry:'حاول مجدداً', recoveredT:'عاد الاتصال', recoveredB:'تم تحميل دوراتك. هذه حالة النجاح بعد إعادة المحاولة.', reset:'إعادة العرض' };
    const t = ar ? AR : EN;
    const icons = { ok:['#5BD562','M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14.01 9 11.01'], info:['#8FD4E3','M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01'] };
    const toasts = this.state.toasts.map((x) => ({ ...x, cls: x.kind === 'ok' ? 'ok' : '', stroke: icons[x.kind][0], d: icons[x.kind][1], close: () => this.setState({ toasts: this.state.toasts.filter((y) => y.id !== x.id) }) }));
    const err = this.state.err;
    return {
      lang: lang, dir: ar?'rtl':'ltr', t: t,
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      toasts: toasts,
      toastOk: () => this.push('ok', t.tOkT, t.tOkB),
      toastInfo: () => this.push('info', t.infoT, t.infoB),
      dlgOpen: this.state.dlg, openDlg: () => this.setState({ dlg:true }), closeDlg: () => this.setState({ dlg:false }),
      confirmDlg: () => { this.setState({ dlg:false }); this.push('ok', ar?'تم إلغاء الجلسة':'Session cancelled', ar?'أُبلغت د. حصة النعيمي':'Dr. Hessa Al Nuaimi has been notified'); },
      errShow: err !== 'ok', errOk: err === 'ok', retryCls: err === 'loading' ? 'is-loading' : '',
      retry: () => { if (err !== 'error') return; this.setState({ err:'loading' }); setTimeout(() => this.setState({ err:'ok' }), 1300); },
      resetErr: () => this.setState({ err:'error' })
    };
  }
}
