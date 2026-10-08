// Ported verbatim from the Claude Design artboard ShellMobile (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, open:null, active:1, tab:0 }; }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const isOpen = this.state.open === null ? (this.props.sheetOpen !== false) : this.state.open;
    const t = ar ? { courses:'الدورات', title:'عالم الدائرة', desc:'4 وحدات · 45 دقيقة · شهادة عند الإكمال', cta:'متابعة الوحدة 3', progress:'تقدمك', progressNote:'وحدتان من 4 مكتملتان · 20 نقطة مكتسبة', next:'التالي', unit3:'المواقع الثقافية في أبوظبي', microsite:'الموقع الفرعي', employees:'موظفو الدائرة', learn:'التعلم', learner:'متعلم' } : { courses:'Courses', title:'DCT World', desc:'4 units · 45 min · certificate on completion', cta:'Continue unit 3', progress:'Your progress', progressNote:'2 of 4 units complete · 20 points earned', next:'Up next', unit3:'Abu Dhabi’s cultural sites', microsite:'Microsite', employees:'DCT Employees', learn:'Learn', learner:'Learner' };
    const I = { dash:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z', book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5', cal:'M3 6h18v15H3zM16 2v4M8 2v4M3 10h21', users:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', award:'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89 7 23l5-3 5 3-1.21-9.12', user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' };
    const items = ar ? [['لوحة التحكم','dash'],['الدورات','book'],['ورش العمل','cal'],['المرشدون','users'],['الإنجازات','award'],['الملف الشخصي','user']] : [['Dashboard','dash'],['Courses','book'],['Workshops','cal'],['Mentors','users'],['Achievements','award'],['Profile','user']];
    const nav = items.map((x, i) => ({ label:x[0], d:I[x[1]], cls: i === this.state.active ? 'is-active' : '', pick: () => this.setState({ active:i, open:false }) }));
    const tabNames = ar ? ['نظرة عامة','الوحدات','الموارد','خطة العمل'] : ['Overview','Units','Resources','Action plan'];
    const tabs = tabNames.map((l, i) => ({ label:l, cls: i === this.state.tab ? 'is-active' : '', pick: () => this.setState({ tab:i }) }));
    return {
      lang: lang, dir: ar?'rtl':'ltr', t: t, from: ar ? '100%' : '-100%',
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      isOpen: isOpen, open: () => this.setState({ open:true }), close: () => this.setState({ open:false }),
      nav: nav, tabs: tabs
    };
  }
}
