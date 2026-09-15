import { type ButtonHTMLAttributes, type ComponentType, type FormEvent, type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Coins,
  CreditCard,
  FileText,
  Home,
  Languages,
  Leaf,
  LineChart,
  ListChecks,
  LoaderCircle,
  LogIn,
  Menu,
  MoreHorizontal,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sprout,
  Tractor,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import {
  getGetAdminDashboardQueryKey,
  getGetFarmerDashboardQueryKey,
  getGetLiveQueueQueryKey,
  getHealthCheckQueryKey,
  useAdvanceQueue,
  useCreateBooking,
  useGetAdminDashboard,
  useGetFarmerDashboard,
  useGetLiveQueue,
  useHealthCheck,
} from '@workspace/api-client-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import './index.css';

const queryClient = new QueryClient();

type IconType = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const demoBooking = {
  bookingNumber: 'SQ-26032-481',
  centre: 'Haritpur Block Centre',
  crop: 'Wheat',
  slot: '10:30 AM – 11:00 AM',
  token: 'HBL-A127',
  queuePosition: 8,
  farmersAhead: 6,
  estimatedWait: 42,
  status: 'Confirmed',
  paymentStatus: 'Pending',
};

const demoNotifications = [
  { id: 1, title: 'Your booking is confirmed', message: 'HBL-A127 is reserved for today at 10:30 AM.', time: '8 min ago', unread: true },
  { id: 2, title: 'Queue moving smoothly', message: 'Your estimated wait is now 42 minutes.', time: '24 min ago', unread: true },
  { id: 3, title: 'Centre opens at 8:00 AM', message: 'Please carry your farmer ID and weighment slip.', time: 'Yesterday', unread: false },
];

const demoFarmer = {
  farmer: { name: 'Anita Devi', farmerId: 'FMR-20481', village: 'Chandpur', language: 'Hindi' },
  booking: demoBooking,
  notifications: demoNotifications,
  stats: { farmersServed: 1284, averageWait: 18, paymentDue: 10616 },
};

const demoQueue = {
  centre: 'Haritpur Block Centre',
  currentlyServing: 'HBL-A119',
  yourToken: 'HBL-A127',
  farmersAhead: 7,
  estimatedWait: 42,
  updatedAt: 'Just now',
  entries: [
    { token: 'HBL-A116', name: 'Ramesh Kumar', status: 'Completed', time: '09:02' },
    { token: 'HBL-A117', name: 'Suresh Yadav', status: 'Completed', time: '09:18' },
    { token: 'HBL-A118', name: 'Meena Devi', status: 'Completed', time: '09:34' },
    { token: 'HBL-A119', name: 'Rajendra Pal', status: 'Processing', time: 'Now' },
    { token: 'HBL-A120', name: 'Sunita Bai', status: 'Waiting', time: '09:58' },
    { token: 'HBL-A121', name: 'Devendra Singh', status: 'Waiting', time: '10:03' },
    { token: 'HBL-A122', name: 'Gopal Verma', status: 'Waiting', time: '10:07' },
    { token: 'HBL-A123', name: 'Sanjay Patel', status: 'Waiting', time: '10:12' },
    { token: 'HBL-A124', name: 'Lakshmi Bai', status: 'Waiting', time: '10:18' },
    { token: 'HBL-A125', name: 'Nitin Sharma', status: 'Waiting', time: '10:21' },
    { token: 'HBL-A126', name: 'Prakash Rao', status: 'Waiting', time: '10:26' },
    { token: 'HBL-A127', name: 'Anita Devi', status: 'Your turn soon', time: '10:30' },
  ],
};

const demoAdmin = {
  centre: 'Haritpur Block Centre',
  metrics: { today: 42, waiting: 8, processing: 1, completed: 33, averageWait: 18, procurement: 284640, pendingPayments: 49680 },
  throughput: [
    { label: '8 AM', value: 3 }, { label: '9 AM', value: 8 }, { label: '10 AM', value: 14 },
    { label: '11 AM', value: 19 }, { label: '12 PM', value: 24 }, { label: '1 PM', value: 30 },
  ],
  dailyBookings: [
    { label: 'Mon', value: 34 }, { label: 'Tue', value: 42 }, { label: 'Wed', value: 38 },
    { label: 'Thu', value: 46 }, { label: 'Fri', value: 51 }, { label: 'Sat', value: 42 },
  ],
};

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${dark ? 'bg-secondary text-foreground' : 'bg-primary text-primary-foreground'}`}>
        <Sprout size={21} strokeWidth={2.2} />
      </span>
      <span className={`font-display text-lg font-bold tracking-tight ${dark ? 'text-sidebar-foreground' : 'text-foreground'}`}>
        Smart<span className={dark ? 'text-secondary' : 'text-primary'}>Queue</span>
      </span>
    </Link>
  );
}

function Button({ children, className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'outline' }) {
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:translate-y-[-1px] hover:shadow-lift',
    secondary: 'bg-secondary text-secondary-foreground hover:translate-y-[-1px]',
    quiet: 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
    outline: 'border border-border bg-card text-foreground hover:border-primary hover:text-primary',
  };
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

function StatusPill({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'green' | 'orange' | 'muted' }) {
  const tones = {
    gold: 'bg-secondary/45 text-foreground',
    green: 'bg-primary/10 text-primary',
    orange: 'bg-accent/10 text-accent',
    muted: 'bg-muted text-muted-foreground',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.08em] ${tones[tone]}`}>{children}</span>;
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-accent">{eyebrow}</p>
      <h1 className="font-display text-3xl font-bold tracking-[-.035em] text-foreground sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>;
}

function DemoNotice({ text = 'Showing a sample centre update so you can explore the flow.' }: { text?: string }) {
  return <div className="mb-5 flex items-start gap-3 rounded-xl border border-secondary/70 bg-secondary/25 px-4 py-3 text-sm text-foreground">
    <CircleAlert size={17} className="mt-0.5 shrink-0 text-accent" />
    <span><strong className="font-semibold">Demo view.</strong> {text}</span>
  </div>;
}

function LoadingState({ label = 'Getting the latest centre update…' }: { label?: string }) {
  return <div className="space-y-4" aria-label="Loading">
    <div className="h-32 animate-pulse rounded-2xl bg-muted" />
    <div className="grid gap-4 sm:grid-cols-3"><div className="h-28 animate-pulse rounded-2xl bg-muted" /><div className="h-28 animate-pulse rounded-2xl bg-muted" /><div className="h-28 animate-pulse rounded-2xl bg-muted" /></div>
    <p className="text-center text-sm text-muted-foreground">{label}</p>
  </div>;
}

function ErrorState({ retry }: { retry: () => void }) {
  return <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
    <CircleAlert className="mx-auto mb-3 text-accent" size={28} />
    <h3 className="font-display text-xl font-bold">The centre is taking a moment</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">We could not fetch the latest update. You can retry, or continue with the clearly marked demo view.</p>
    <Button className="mt-5" variant="outline" onClick={retry} data-testid="button-retry"><RefreshCw size={15} /> Try again</Button>
  </div>;
}

const farmerNav = [
  { href: '/farmer/dashboard', label: 'My overview', icon: Home },
  { href: '/farmer/book-slot', label: 'Book a slot', icon: CalendarDays },
  { href: '/farmer/queue', label: 'Live queue', icon: ListChecks },
  { href: '/farmer/bookings', label: 'My bookings', icon: FileText },
  { href: '/farmer/procurement', label: 'Procurement', icon: PackageCheck },
  { href: '/farmer/payments', label: 'Payments', icon: CreditCard },
  { href: '/farmer/notifications', label: 'Notifications', icon: Bell },
];

const adminNav = [
  { href: '/admin/dashboard', label: 'Centre overview', icon: Home },
  { href: '/admin/queue', label: 'Live queue', icon: ListChecks },
  { href: '/admin/bookings', label: 'Today’s bookings', icon: CalendarDays },
  { href: '/admin/procurement', label: 'Process a farmer', icon: Tractor },
  { href: '/admin/payments', label: 'Payment updates', icon: CreditCard },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

function AppShell({ children, role }: { children: ReactNode; role: 'farmer' | 'admin' }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const items = role === 'farmer' ? farmerNav : adminNav;
  const isActive = (href: string) => location === href;
  return <div className="grain min-h-[100dvh] bg-background">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground shadow-xl transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2 pb-8">
        <Logo dark />
        <button className="rounded-lg p-2 text-sidebar-foreground/70 lg:hidden" onClick={() => setOpen(false)} data-testid="button-close-menu"><X size={18} /></button>
      </div>
      <div className="mb-5 rounded-2xl border border-sidebar-border bg-sidebar-accent p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-sidebar-foreground/55">{role === 'farmer' ? 'Farmer account' : 'Centre desk'}</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">{role === 'farmer' ? 'KN' : 'MC'}</span>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{role === 'farmer' ? 'Kavya N.' : 'Mysuru Centre'}</p><p className="truncate text-xs text-sidebar-foreground/55">{role === 'farmer' ? 'Hunsur village' : 'Operator account'}</p></div>
        </div>
      </div>
      <nav className="space-y-1" aria-label={`${role} navigation`}>
        {items.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isActive(item.href) ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md' : 'text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={18} strokeWidth={isActive(item.href) ? 2.3 : 1.8} /><span>{item.label}</span>{item.label === 'Notifications' && <span className="ml-auto h-2 w-2 rounded-full bg-accent" />}</Link>; })}
      </nav>
      <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-secondary"><ShieldCheck size={16} /><span className="text-xs font-bold">Public service promise</span></div>
        <p className="text-xs leading-5 text-sidebar-foreground/62">Clear turn. Fair queue. No unnecessary waiting.</p>
      </div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-foreground/25 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" data-testid="button-overlay" />}
    <div className="lg:pl-[264px]">
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md sm:px-8">
        <button className="rounded-xl border border-border bg-card p-2.5 lg:hidden" onClick={() => setOpen(true)} data-testid="button-open-menu"><Menu size={20} /></button>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><span className="h-2 w-2 rounded-full bg-primary pulse-dot" />Live centre updates are on</div>
        <div className="ml-auto flex items-center gap-2">
          <Link href={role === 'farmer' ? '/farmer/notifications' : '/admin/reports'} className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="link-header-notifications"><Bell size={19} />{role === 'farmer' && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />}</Link>
          <span className="mx-1 h-7 w-px bg-border" />
          <span className="hidden text-right sm:block"><span className="block text-sm font-semibold text-foreground">{role === 'farmer' ? 'Kavya N.' : 'Mysuru operator'}</span><span className="block text-[11px] text-muted-foreground">{role === 'farmer' ? 'Farmer ID KA-MYS-0482' : 'Centre ID MYS-01'}</span></span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{role === 'farmer' ? 'KN' : 'MC'}</span>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] p-5 sm:p-8">{children}</main>
    </div>
  </div>;
}

function PublicNav() {
  return <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-10 lg:px-16">
    <Logo dark />
    <div className="flex items-center gap-3"><Link href="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-sidebar-foreground/75 hover:bg-sidebar-accent sm:inline-flex" data-testid="link-public-login">Sign in</Link><Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-public-register">Get started <ArrowRight size={15} /></Link></div>
  </header>;
}

function Landing() {
  useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: false } });
  return <div className="grain min-h-[100dvh] bg-background">
    <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
      <PublicNav />
      <div className="hero-grid absolute inset-0 opacity-70" />
      <div className="absolute -right-32 top-20 h-[420px] w-[420px] rounded-full border border-secondary/20 bg-secondary/5 blur-[1px]" />
      <div className="absolute -bottom-40 left-[-5%] h-[430px] w-[680px] rounded-[50%] border border-sidebar-border bg-sidebar-accent/30" />
      <div className="relative mx-auto grid min-h-[720px] max-w-[1440px] items-center gap-12 px-5 pb-20 pt-36 sm:px-10 lg:grid-cols-[1.08fr_.92fr] lg:px-16 lg:pt-32">
        <div className="max-w-2xl rise-in">
          <StatusPill tone="gold"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Built for the next harvest</StatusPill>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.01] tracking-[-.055em] text-sidebar-foreground sm:text-7xl">Your turn at the centre, <span className="text-secondary">without the uncertainty.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-sidebar-foreground/68 sm:text-lg">SmartQueue gives farmers a clear booking, a live token, and a fairer day at procurement centres across India.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center gap-3 rounded-xl bg-secondary px-5 py-3.5 text-sm font-bold text-secondary-foreground shadow-lift transition-transform hover:-translate-y-1" data-testid="link-hero-start">Book your first slot <ArrowRight size={17} /></Link><Link href="/login" className="inline-flex items-center justify-center gap-3 rounded-xl border border-sidebar-border px-5 py-3.5 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent" data-testid="link-hero-login">I already have an account <LogIn size={16} /></Link></div>
          <div className="mt-12 flex items-center gap-8 text-xs text-sidebar-foreground/55"><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-secondary" /> Trusted public service flow</span><span className="hidden items-center gap-2 sm:flex"><Languages size={16} className="text-secondary" /> Local-language ready</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-[480px] rise-in delay-2">
          <div className="absolute -inset-5 rounded-[2rem] bg-secondary/10 blur-2xl" />
          <div className="relative rounded-[2rem] border border-sidebar-border bg-sidebar-accent p-3 shadow-2xl">
            <div className="rounded-[1.5rem] bg-card p-5 text-foreground sm:p-6">
              <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-accent">Today at Mysuru</p><h3 className="mt-2 font-display text-2xl font-bold">Your place is held.</h3></div><span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><CircleCheck size={21} /></span></div>
              <div className="mt-7 rounded-2xl bg-primary px-5 py-5 text-primary-foreground"><div className="flex items-end justify-between"><div><p className="text-xs text-primary-foreground/65">Your token</p><p className="mt-1 font-display text-5xl font-bold tracking-tight">R-042</p></div><div className="text-right"><p className="text-xs text-primary-foreground/65">Estimated wait</p><p className="mt-1 text-xl font-bold">42 min</p></div></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-primary-foreground/15"><div className="h-full w-[58%] rounded-full bg-secondary" /></div><p className="mt-2 text-[11px] text-primary-foreground/65">7 farmers ahead · updated just now</p></div>
              <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-border p-3"><p className="text-[11px] text-muted-foreground">Crop</p><p className="mt-1 text-sm font-bold">Ragi · 240 kg</p></div><div className="rounded-xl border border-border p-3"><p className="text-[11px] text-muted-foreground">Slot</p><p className="mt-1 text-sm font-bold">09:30 – 10:00</p></div></div>
            </div>
          </div>
          <div className="absolute -bottom-8 -left-8 hidden rounded-2xl border border-sidebar-border bg-sidebar-accent px-4 py-3 shadow-xl sm:block"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-secondary-foreground"><Clock3 size={16} /></span><div><p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/55">Queue moving</p><p className="text-sm font-bold">On time today</p></div></div></div>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-10 lg:px-16"><div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-accent">One calm flow</p><h2 className="mt-3 max-w-md font-display text-4xl font-bold leading-tight tracking-[-.04em]">From field to fair payment, keep your day moving.</h2></div><div className="grid gap-4 sm:grid-cols-3"><Feature number="01" icon={CalendarDays} title="Choose a slot" text="See available times before you make the journey." /><Feature number="02" icon={ListChecks} title="Follow your token" text="Know who is being served and when you are next." /><Feature number="03" icon={Coins} title="Track payment" text="See procurement and payment status in one place." /></div></div></section>
    <section className="border-y border-border bg-muted/50"><div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-16 sm:px-10 lg:grid-cols-[1fr_1fr] lg:px-16"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-accent">Made for real mornings</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-.035em]">Less waiting. More knowing.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">Whether your centre is a short ride away or a full day’s trip, SmartQueue helps you leave with confidence and return to your work sooner.</p></div><div className="grid gap-3 sm:grid-cols-2"><QuoteCard quote="I can check the queue from my field before I leave." label="Farmer, Mandya" /><QuoteCard quote="The next farmer is clear at a glance. The desk stays calmer." label="Centre operator, Mysuru" /></div></div></section>
    <footer className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 px-5 py-9 text-sm text-muted-foreground sm:flex-row sm:px-10 lg:px-16"><Logo /><span>SmartQueue Procurement · Smart India Hackathon 2026</span><Link href="/login" className="font-semibold text-primary hover:underline" data-testid="link-footer-login">Open the app <ArrowRight className="ml-1 inline" size={14} /></Link></footer>
  </div>;
}

function Feature({ number, icon: Icon, title, text }: { number: string; icon: IconType; title: string; text: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-transform hover:-translate-y-1"><div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-accent">{number}</span><Icon size={21} className="text-primary" /></div><h3 className="mt-8 font-display text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

function QuoteCard({ quote, label }: { quote: string; label: string }) {
  return <div className="rounded-2xl bg-card p-5 shadow-soft"><p className="font-display text-lg font-bold leading-7">“{quote}”</p><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p></div>;
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [farmerId, setFarmerId] = useState('');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const submit = (event: FormEvent) => { event.preventDefault(); setLoading(true); setTimeout(() => setLocation('/farmer/dashboard'), 500); };
  return <div className="grain grid min-h-[100dvh] bg-background lg:grid-cols-[.85fr_1.15fr]">
    <div className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between"><div className="hero-grid absolute inset-0 opacity-60" /><div className="relative"><Logo dark /><div className="mt-28 max-w-md"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-secondary">A clearer day starts here</p><h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-[-.045em]">Know your place. Keep your time.</h1><p className="mt-6 text-base leading-7 text-sidebar-foreground/65">Your booking, live queue, and payment status — together, in a language that respects your day.</p></div></div><div className="relative flex gap-3 text-xs text-sidebar-foreground/55"><ShieldCheck size={16} className="text-secondary" /> Secure farmer access · Built for public procurement</div></div>
    <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-20"><div className="flex items-center justify-between lg:justify-end"><div className="lg:hidden"><Logo /></div><Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground" data-testid="link-auth-home">Back to home</Link></div><div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center py-12"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-accent">{mode === 'login' ? 'Welcome back' : 'Farmer onboarding'}</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.04em]">{mode === 'login' ? 'Sign in to your day.' : 'Start with your farmer ID.'}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{mode === 'login' ? 'Pick up exactly where you left off.' : 'It takes less than a minute. Your details stay with your centre.'}</p><form className="mt-9 space-y-5" onSubmit={submit}>{mode === 'register' && <label className="block"><span className="mb-2 block text-sm font-semibold">Your name</span><input value={name} onChange={(e) => setName(e.target.value)} required className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none ring-primary/20 transition focus:ring-4" placeholder="As on your farmer ID" data-testid="input-name" /></label>}<label className="block"><span className="mb-2 block text-sm font-semibold">Farmer ID</span><input value={farmerId} onChange={(e) => setFarmerId(e.target.value)} required className="h-12 w-full rounded-xl border border-input bg-card px-4 font-mono text-sm uppercase outline-none ring-primary/20 transition focus:ring-4" placeholder="e.g. KA-MYS-0482" data-testid="input-farmer-id" /></label>{mode === 'register' && <label className="block"><span className="mb-2 block text-sm font-semibold">Preferred language</span><select value={language} onChange={(e) => setLanguage(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none ring-primary/20 transition focus:ring-4" data-testid="select-language"><option>English</option><option>ಕನ್ನಡ</option><option>हिन्दी</option><option>मराठी</option></select></label>}<Button type="submit" className="h-12 w-full" disabled={loading} data-testid="button-auth-submit">{loading ? <LoaderCircle className="animate-spin" size={17} /> : mode === 'login' ? 'Continue to my overview' : 'Create my farmer access'}<ArrowRight size={16} /></Button></form><p className="mt-8 text-center text-sm text-muted-foreground">{mode === 'login' ? 'New to SmartQueue?' : 'Already have access?'} <Link href={mode === 'login' ? '/register' : '/login'} className="font-bold text-primary hover:underline" data-testid="link-auth-switch">{mode === 'login' ? 'Register here' : 'Sign in instead'}</Link></p><div className="mt-10 flex items-start gap-3 rounded-xl bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" /> Your centre uses this ID to show only your bookings and queue updates.</div></div></div>
  </div>;
}

function FarmerDashboard() {
  const query = useGetFarmerDashboard({ query: { queryKey: getGetFarmerDashboardQueryKey(), retry: false } });
  const data = query.data ?? demoFarmer;
  const booking = data.booking ?? demoBooking;
  return <AppShell role="farmer"><PageTitle eyebrow="Farmer overview" title={`Good morning, ${data.farmer.name.split(' ')[0]}.`} description="Here’s what your procurement day looks like." action={<Link href="/farmer/book-slot" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lift" data-testid="link-dashboard-book"><CalendarDays size={16} /> Book a slot</Link>} />{query.isError && <DemoNotice />}<div className="grid gap-5 xl:grid-cols-[1.45fr_.75fr]"><section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-lift sm:p-8"><div className="absolute -right-14 -top-20 h-60 w-60 rounded-full border border-primary-foreground/10" /><div className="absolute -bottom-28 right-20 h-64 w-64 rounded-full border border-secondary/15" /><div className="relative"><div className="flex items-start justify-between gap-4"><div><StatusPill tone="gold"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> {booking.status}</StatusPill><h2 className="mt-5 font-display text-3xl font-bold tracking-[-.04em]">Your place is held.</h2><p className="mt-2 max-w-md text-sm leading-6 text-primary-foreground/68">Keep this token handy when you arrive at the centre.</p></div><div className="text-right"><p className="text-[10px] uppercase tracking-[.16em] text-primary-foreground/55">Token</p><p className="font-display text-5xl font-bold text-secondary">{booking.token}</p></div></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-primary-foreground/55">Centre</p><p className="mt-1 text-sm font-semibold">{booking.centre}</p></div><div><p className="text-xs text-primary-foreground/55">Crop & quantity</p><p className="mt-1 text-sm font-semibold">{booking.crop} · 240 kg</p></div><div><p className="text-xs text-primary-foreground/55">Slot</p><p className="mt-1 text-sm font-semibold">{booking.slot}</p></div></div><div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-primary-foreground/12 pt-5"><div><p className="text-xs text-primary-foreground/55">Farmers ahead</p><p className="mt-1 text-2xl font-bold">{booking.farmersAhead}</p></div><div><p className="text-xs text-primary-foreground/55">Estimated wait</p><p className="mt-1 text-2xl font-bold">{booking.estimatedWait} <span className="text-sm font-medium text-primary-foreground/60">min</span></p></div><Link href="/farmer/queue" className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground" data-testid="link-dashboard-queue">View live queue <ArrowRight size={15} /></Link></div></div></section><section className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Today’s pulse</p><h2 className="mt-2 font-display text-xl font-bold">Your recent activity</h2></div><TrendingUp size={20} className="text-primary" /></div><div className="mt-7 space-y-5"><PulseRow icon={Clock3} label="Average wait" value={`${data.stats.averageWait} min`} /><PulseRow icon={PackageCheck} label="Farmers served" value={data.stats.farmersServed.toString()} /><PulseRow icon={Coins} label="Payment due" value={`₹${data.stats.paymentDue.toLocaleString('en-IN')}`} /></div><Link href="/farmer/notifications" className="mt-7 flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm font-semibold hover:bg-secondary/30" data-testid="link-dashboard-notifications"><span>See latest updates</span><ChevronRight size={16} /></Link></section></div><div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><section className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Next step</p><h2 className="mt-2 font-display text-2xl font-bold">Arrive prepared</h2></div><Sprout size={23} className="text-primary" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><ChecklistItem done label="Booking confirmed" /><ChecklistItem done label="Bring farmer ID" /><ChecklistItem label="Complete weighing" /></div><Link href="/farmer/procurement" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline" data-testid="link-dashboard-procurement">Track procurement status <ArrowRight size={15} /></Link></section><section className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Latest from centre</h2><Link href="/farmer/notifications" className="text-xs font-bold text-primary" data-testid="link-dashboard-see-all">See all</Link></div><div className="mt-4 space-y-4">{data.notifications.slice(0, 2).map((notification) => <div className="flex gap-3" key={notification.id}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.unread ? 'bg-accent' : 'bg-border'}`} /><div><p className="text-sm font-semibold">{notification.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{notification.message}</p><p className="mt-1 text-[10px] text-muted-foreground">{notification.time}</p></div></div>)}</div></section></div></AppShell>;
}

function PulseRow({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={17} /></span><span className="flex-1 text-sm text-muted-foreground">{label}</span><strong className="text-sm">{value}</strong></div>;
}
function ChecklistItem({ done = false, label }: { done?: boolean; label: string }) {
  return <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-3 text-sm"><span className={`grid h-5 w-5 place-items-center rounded-full ${done ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}>{done && <Check size={12} strokeWidth={3} />}</span><span className={done ? 'font-semibold' : 'text-muted-foreground'}>{label}</span></div>;
}

function BookSlot() {
  const [, setLocation] = useLocation();
  const createBooking = useCreateBooking();
  const [form, setForm] = useState({ centre: 'Mysuru Procurement Centre', crop: 'Ragi', date: '2026-02-18', slot: '09:30 – 10:00', quantity: '240' });
  const [confirmation, setConfirmation] = useState<{ bookingNumber: string; token: string; message: string } | null>(null);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); createBooking.mutate({ data: { ...form, quantity: Number(form.quantity) } }, { onSuccess: (result) => setConfirmation(result), onError: () => setConfirmation({ bookingNumber: 'SQ-26-0418', token: 'R-042', message: 'Demo booking held locally. Connect to the centre when service is restored.' }) }); };
  if (confirmation) return <AppShell role="farmer"><div className="mx-auto max-w-2xl py-10 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift"><Check size={30} /></span><p className="mt-7 text-[11px] font-bold uppercase tracking-[.18em] text-accent">Booking confirmed</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.04em]">Your day just got clearer.</h1><p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{confirmation.message}</p><div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3"><div className="rounded-2xl bg-primary p-5 text-left text-primary-foreground"><p className="text-xs text-primary-foreground/60">Your token</p><p className="mt-1 font-display text-4xl font-bold text-secondary">{confirmation.token}</p></div><div className="rounded-2xl border border-border bg-card p-5 text-left"><p className="text-xs text-muted-foreground">Booking number</p><p className="mt-2 font-mono text-lg font-bold">{confirmation.bookingNumber}</p></div></div><div className="mt-8 flex justify-center gap-3"><Button variant="outline" onClick={() => setConfirmation(null)} data-testid="button-book-another">Book another</Button><Button onClick={() => setLocation('/farmer/queue')} data-testid="button-view-confirmed-queue">View live queue <ArrowRight size={16} /></Button></div></div></AppShell>;
  return <AppShell role="farmer"><PageTitle eyebrow="Make a booking" title="Choose a calmer arrival." description="Tell us what you’re bringing. We’ll reserve a fair place at the centre." /><div className="grid gap-6 lg:grid-cols-[1fr_.7fr]"><form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8"><div className="mb-7 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</span><div><h2 className="font-display text-xl font-bold">Your procurement details</h2><p className="text-xs text-muted-foreground">All fields are used only to plan your visit.</p></div></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Procurement centre"><select value={form.centre} onChange={(e) => update('centre', e.target.value)} className="field" data-testid="select-centre"><option>Mysuru Procurement Centre</option><option>Mandya APMC Centre</option><option>Hunsur Collection Point</option></select></Field><Field label="Crop"><select value={form.crop} onChange={(e) => update('crop', e.target.value)} className="field" data-testid="select-crop"><option>Ragi</option><option>Paddy</option><option>Maize</option><option>Tur dal</option></select></Field><Field label="Preferred date"><input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} className="field" required data-testid="input-date" /></Field><Field label="Quantity (kg)"><input type="number" min="1" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} className="field" required data-testid="input-quantity" /></Field></div><div className="mt-7 border-t border-border pt-7"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-bold">Available time</p><p className="text-xs text-muted-foreground">Pick what suits your morning.</p></div><StatusPill tone="green"><CircleCheck size={12} /> Slots open</StatusPill></div><div className="grid gap-3 sm:grid-cols-3">{['08:30 – 09:00', '09:30 – 10:00', '10:30 – 11:00'].map((slot) => <label key={slot} className={`cursor-pointer rounded-xl border p-3 transition-colors ${form.slot === slot ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}><input type="radio" name="slot" value={slot} checked={form.slot === slot} onChange={(e) => update('slot', e.target.value)} className="sr-only" data-testid={`radio-slot-${slot.slice(0, 2)}`} /><span className="block text-sm font-bold">{slot}</span><span className="mt-1 block text-[11px] text-muted-foreground">{slot === '09:30 – 10:00' ? 'Recommended' : 'Good availability'}</span></label>)}</div></div><Button type="submit" className="mt-8 h-12 w-full" disabled={createBooking.isPending} data-testid="button-submit-booking">{createBooking.isPending ? <><LoaderCircle className="animate-spin" size={17} /> Holding your place…</> : <>Confirm my slot <ArrowRight size={16} /></>}</Button></form><div className="space-y-5"><div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-soft"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-secondary">What happens next</p><div className="mt-5 space-y-5"><Step number="01" title="We hold your slot" text="You receive a token straight away." /><Step number="02" title="You follow the queue" text="Check progress before and during travel." /><Step number="03" title="The centre processes your crop" text="Procurement and payment status stay visible." /></div></div><div className="rounded-2xl border border-border bg-card p-5"><div className="flex gap-3"><ShieldCheck className="shrink-0 text-primary" size={19} /><div><p className="text-sm font-bold">A fair place in line</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Bookings are served in token order. If plans change, your centre team can help.</p></div></div></div></div></div></AppShell>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>; }
function Step({ number, title, text }: { number: string; title: string; text: string }) { return <div className="flex gap-3"><span className="font-mono text-xs text-secondary">{number}</span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-primary-foreground/60">{text}</p></div></div>; }

function QueuePage({ admin = false }: { admin?: boolean }) {
  const queue = useGetLiveQueue({ query: { queryKey: getGetLiveQueueQueryKey(), retry: false, refetchInterval: 30000 } });
  const data = queue.data ?? demoQueue;
  const [refreshing, setRefreshing] = useState(false);
  const refresh = () => { setRefreshing(true); void queue.refetch().finally(() => setRefreshing(false)); };
  const advanceQueue = useAdvanceQueue();
  const advance = () => advanceQueue.mutate(undefined, { onSuccess: () => void queue.refetch() });
  return <AppShell role={admin ? 'admin' : 'farmer'}><PageTitle eyebrow={admin ? 'Centre operations' : 'Live now'} title="The queue, in plain view." description={admin ? 'Keep the line moving with a shared view of every token.' : `Follow ${data.centre} without guessing.`} action={<Button variant="outline" onClick={refresh} disabled={refreshing} data-testid="button-refresh-queue"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh</Button>} />{queue.isError && <DemoNotice text="The live service is unavailable, so this view is using the last known sample queue." />}<div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]"><section className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-lift sm:p-8"><div className="flex items-center justify-between"><StatusPill tone="gold"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Live queue</StatusPill><span className="text-xs text-primary-foreground/55">{data.updatedAt}</span></div><p className="mt-8 text-xs text-primary-foreground/60">Currently serving</p><p className="mt-1 font-display text-6xl font-bold tracking-[-.05em] text-secondary">{data.currentlyServing}</p><div className="mt-8 grid grid-cols-2 gap-3 border-t border-primary-foreground/12 pt-5"><div><p className="text-xs text-primary-foreground/55">{admin ? 'Waiting now' : 'Farmers ahead'}</p><p className="mt-1 text-2xl font-bold">{admin ? data.entries.filter((entry) => entry.status === 'Waiting').length : data.farmersAhead}</p></div><div><p className="text-xs text-primary-foreground/55">Estimated wait</p><p className="mt-1 text-2xl font-bold">{data.estimatedWait} <span className="text-sm font-medium text-primary-foreground/55">min</span></p></div></div>{!admin && <div className="mt-7 rounded-xl bg-secondary/15 p-4"><p className="text-xs text-primary-foreground/60">Your token</p><div className="mt-1 flex items-end justify-between"><p className="font-display text-3xl font-bold text-secondary">{data.yourToken}</p><p className="text-sm font-semibold">{data.farmersAhead} ahead</p></div><div className="mt-3 h-1.5 rounded-full bg-primary-foreground/15"><div className="h-full w-[62%] rounded-full bg-secondary" /></div></div>}{admin && <Button variant="secondary" className="mt-7 w-full" onClick={advance} disabled={advanceQueue.isPending} data-testid="button-advance-queue">{advanceQueue.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <ChevronRight size={16} />} Call next farmer</Button>}</section><section className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="mb-5 flex items-end justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Token order</p><h2 className="mt-2 font-display text-2xl font-bold">{data.entries.length} people in today’s view</h2></div><span className="text-xs text-muted-foreground">{data.centre}</span></div><div className="space-y-2">{data.entries.map((entry, index) => <div key={entry.token} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${entry.token === data.yourToken ? 'border border-secondary bg-secondary/20' : 'bg-muted/45'}`} data-testid={`row-queue-${entry.token}`}><span className="w-7 text-center font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${entry.status === 'Processing' ? 'bg-primary text-primary-foreground' : entry.token === data.yourToken ? 'bg-secondary text-secondary-foreground' : 'bg-card text-primary'}`}>{entry.token.replace(/[^\d]/g, '')}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{entry.token === data.yourToken ? 'You · ' : ''}{admin ? entry.name : entry.name}</p><p className="text-[11px] text-muted-foreground">{entry.time}</p></div><StatusPill tone={entry.status === 'Processing' ? 'green' : entry.token === data.yourToken ? 'gold' : 'muted'}>{entry.status}</StatusPill><MoreHorizontal size={17} className="hidden text-muted-foreground sm:block" /></div>)}</div></section></div></AppShell>;
}

function Bookings() {
  const data = useGetFarmerDashboard({ query: { queryKey: getGetFarmerDashboardQueryKey(), retry: false } }).data ?? demoFarmer;
  const booking = data.booking ?? demoBooking;
  return <AppShell role="farmer"><PageTitle eyebrow="Your records" title="My bookings" description="A simple record of the visits you have planned." action={<Link href="/farmer/book-slot" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-bookings-new"><CalendarDays size={16} /> New booking</Link>} /><div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"><div className="hidden grid-cols-[1.15fr_1fr_.8fr_.8fr_auto] gap-4 border-b border-border bg-muted/50 px-5 py-4 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground sm:grid"><span>Booking</span><span>Centre & crop</span><span>Slot</span><span>Status</span><span /></div><div className="grid gap-4 p-5 sm:grid-cols-[1.15fr_1fr_.8fr_.8fr_auto] sm:items-center"><div><p className="text-xs text-muted-foreground sm:hidden">Booking</p><p className="font-mono text-sm font-bold">{booking.bookingNumber}</p><p className="mt-1 text-xs text-muted-foreground">Token {booking.token}</p></div><div><p className="text-xs text-muted-foreground sm:hidden">Centre & crop</p><p className="text-sm font-semibold">{booking.centre}</p><p className="mt-1 text-xs text-muted-foreground">{booking.crop} · 240 kg</p></div><div><p className="text-xs text-muted-foreground sm:hidden">Slot</p><p className="text-sm font-semibold">{booking.slot}</p><p className="mt-1 text-xs text-muted-foreground">18 Feb 2026</p></div><div><p className="text-xs text-muted-foreground sm:hidden">Status</p><StatusPill tone="gold">{booking.status}</StatusPill></div><Link href="/farmer/queue" className="inline-flex items-center gap-1 text-sm font-bold text-primary" data-testid="link-booking-view">View <ChevronRight size={15} /></Link></div></div><div className="mt-5 rounded-2xl border border-dashed border-border p-6 text-center"><FileText className="mx-auto text-muted-foreground" size={24} /><p className="mt-3 text-sm font-semibold">Need a different date?</p><p className="mt-1 text-xs text-muted-foreground">Keep your current booking or make a new one — your choice.</p></div></AppShell>;
}

function Procurement() {
  return <AppShell role="farmer"><PageTitle eyebrow="After arrival" title="Procurement status" description="A clear handoff from weighing to accepted produce." /><div className="grid gap-5 lg:grid-cols-[1fr_.75fr]"><section className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">SQ-26-0418</p><h2 className="mt-2 font-display text-2xl font-bold">Ragi procurement</h2></div><StatusPill tone="gold">Waiting for arrival</StatusPill></div><div className="relative mt-10 space-y-0">{[['Booking confirmed', 'Your token is reserved for 09:30 – 10:00', true], ['Arrive & verify', 'Show your farmer ID at the desk', true], ['Weighing', 'The centre records your actual quantity', false], ['Quality check', 'Produce is checked against the centre standard', false], ['Payment released', 'Payment status appears here after approval', false]].map(([title, text, done], index) => <div className="relative flex gap-4 pb-8 last:pb-0" key={String(title)}><div className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 bg-card text-xs font-bold" style={{ borderColor: done ? 'hsl(var(--primary))' : 'hsl(var(--border))', color: done ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>{done ? <Check size={14} strokeWidth={3} /> : index + 1}</div>{index < 4 && <span className={`absolute left-[15px] top-8 h-full w-px ${done ? 'bg-primary/45' : 'bg-border'}`} />}<div><p className={`text-sm font-bold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div></div>)}</div></section><div className="space-y-5"><div className="rounded-2xl bg-secondary/45 p-6"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Helpful before you go</p><h2 className="mt-3 font-display text-xl font-bold">Bring these along</h2><ul className="mt-4 space-y-3 text-sm"><li className="flex gap-2"><Check size={16} className="mt-0.5 text-primary" /> Farmer ID or registered mobile</li><li className="flex gap-2"><Check size={16} className="mt-0.5 text-primary" /> Clean, accessible produce bags</li><li className="flex gap-2"><Check size={16} className="mt-0.5 text-primary" /> Bank details for payment</li></ul></div><div className="rounded-2xl border border-border bg-card p-6"><Phone size={19} className="text-primary" /><p className="mt-3 text-sm font-bold">Need help at the centre?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Ask the SmartQueue desk. Your token is enough for us to find your booking.</p></div></div></div></AppShell>;
}

function Payments() {
  return <AppShell role="farmer"><PageTitle eyebrow="Money, made visible" title="Payment status" description="No need to wonder whether your crop payment has moved." /><div className="grid gap-5 md:grid-cols-2"><div className="rounded-2xl bg-primary p-7 text-primary-foreground shadow-lift"><p className="text-xs text-primary-foreground/60">Current payment due</p><p className="mt-2 font-display text-4xl font-bold text-secondary">₹48,750</p><p className="mt-2 text-sm text-primary-foreground/65">For today’s Ragi procurement · SQ-26-0418</p><div className="mt-8 border-t border-primary-foreground/12 pt-5"><div className="flex justify-between text-xs"><span className="text-primary-foreground/60">Status</span><strong>Pending weighing</strong></div><div className="mt-3 h-1.5 rounded-full bg-primary-foreground/15"><div className="h-full w-1/2 rounded-full bg-secondary" /></div></div></div><div className="rounded-2xl border border-border bg-card p-7 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Payment journey</p><h2 className="mt-2 font-display text-xl font-bold">Almost there</h2></div><Coins className="text-secondary-foreground" size={25} /></div><div className="mt-6 space-y-4"><PayRow label="Quantity recorded" done /><PayRow label="Quality approved" /><PayRow label="Payment released" /></div></div></div><div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Past payments</h2><span className="text-xs text-muted-foreground">Last 90 days</span></div><div className="mt-5 divide-y divide-border"><div className="flex items-center justify-between py-4"><div><p className="text-sm font-semibold">Paddy · 320 kg</p><p className="mt-1 text-xs text-muted-foreground">06 Jan 2026 · Mandya APMC</p></div><div className="text-right"><p className="text-sm font-bold">₹61,440</p><StatusPill tone="green">Paid</StatusPill></div></div><div className="flex items-center justify-between py-4"><div><p className="text-sm font-semibold">Ragi · 180 kg</p><p className="mt-1 text-xs text-muted-foreground">14 Dec 2025 · Mysuru Centre</p></div><div className="text-right"><p className="text-sm font-bold">₹36,450</p><StatusPill tone="green">Paid</StatusPill></div></div></div></div></AppShell>;
}
function PayRow({ label, done = false }: { label: string; done?: boolean }) { return <div className="flex items-center gap-3 text-sm"><span className={`grid h-6 w-6 place-items-center rounded-full ${done ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}>{done ? <Check size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-border" />}</span><span className={done ? 'font-semibold' : 'text-muted-foreground'}>{label}</span></div>; }

function Notifications() {
  const [items, setItems] = useState(demoNotifications);
  return <AppShell role="farmer"><PageTitle eyebrow="Keep in the loop" title="Notifications" description="Small updates that help you make better decisions about your day." action={<Button variant="outline" onClick={() => setItems((current) => current.map((item) => ({ ...item, unread: false })))} data-testid="button-mark-read">Mark all as read</Button>} /><div className="max-w-3xl space-y-3">{items.map((item) => <div key={item.id} className={`flex gap-4 rounded-2xl border p-5 shadow-soft ${item.unread ? 'border-secondary/80 bg-secondary/15' : 'border-border bg-card'}`} data-testid={`card-notification-${item.id}`}><span className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.unread ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}><Bell size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold">{item.title}</p><span className="text-[11px] text-muted-foreground">{item.time}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.message}</p></div>{item.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />}</div>)}</div></AppShell>;
}

function AdminDashboard() {
  const query = useGetAdminDashboard({ query: { queryKey: getGetAdminDashboardQueryKey(), retry: false } });
  const data = query.data ?? demoAdmin;
  const max = Math.max(...data.throughput.map((point) => point.value));
  return <AppShell role="admin"><PageTitle eyebrow="Centre overview" title="Good morning, operator." description={`${data.centre} · Friday, 18 February 2026`} action={<Link href="/admin/queue" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-admin-open-queue"><ListChecks size={16} /> Open live queue</Link>} />{query.isError && <DemoNotice text="Centre metrics are being shown from a recent demo snapshot while the operations service reconnects." />}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={CalendarDays} label="Today’s bookings" value={data.metrics.today} note="Across all slots" /><Metric icon={UsersRound} label="Waiting now" value={data.metrics.waiting} note="Keep an eye on the line" tone="gold" /><Metric icon={PackageCheck} label="Completed" value={data.metrics.completed} note={`Avg. wait ${data.metrics.averageWait} min`} tone="green" /><Metric icon={CreditCard} label="Pending payments" value={data.metrics.pendingPayments} note="Need review today" tone="orange" /></div><div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><section className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Throughput today</p><h2 className="mt-2 font-display text-xl font-bold">Steady progress through noon</h2></div><LineChart size={20} className="text-primary" /></div><div className="mt-8 flex h-48 items-end gap-3 border-b border-border pb-0">{data.throughput.map((point) => <div key={point.label} className="flex h-full flex-1 flex-col justify-end gap-2"><div className="relative rounded-t-lg bg-primary transition-all hover:bg-secondary" style={{ height: `${(point.value / max) * 100}%` }}><span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground">{point.value}</span></div><span className="text-center text-[10px] text-muted-foreground">{point.label}</span></div>)}</div></section><section className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-lift"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-secondary">Centre rhythm</p><h2 className="mt-2 font-display text-xl font-bold">A line people can trust.</h2></div><BarChart3 size={22} className="text-secondary" /></div><div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6"><AdminStat label="Processing" value={data.metrics.processing} /><AdminStat label="Procured today" value={`${data.metrics.procurement} kg`} /><AdminStat label="Average wait" value={`${data.metrics.averageWait} min`} /><AdminStat label="Queue health" value="On track" /></div><Link href="/admin/reports" className="mt-8 flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground" data-testid="link-dashboard-reports">View centre report <ArrowRight size={15} /></Link></section></div><section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Six day view</p><h2 className="mt-2 font-display text-xl font-bold">Bookings by day</h2></div><span className="text-xs text-muted-foreground">This week</span></div><div className="mt-6 grid grid-cols-6 gap-3">{data.dailyBookings.map((point) => <div key={point.label} className="text-center"><div className="mx-auto flex h-24 items-end justify-center"><div className="w-full max-w-[44px] rounded-t-lg bg-secondary" style={{ height: `${Math.max(16, point.value / 1.1)}%` }} /></div><p className="mt-2 text-xs font-semibold">{point.label}</p><p className="mt-1 text-[10px] text-muted-foreground">{point.value} bookings</p></div>)}</div></section></AppShell>;
}
function Metric({ icon: Icon, label, value, note, tone = 'green' }: { icon: IconType; label: string; value: number; note: string; tone?: 'green' | 'gold' | 'orange' }) { const color = { green: 'bg-primary/10 text-primary', gold: 'bg-secondary text-secondary-foreground', orange: 'bg-accent/10 text-accent' }[tone]; return <div className="rounded-2xl border border-border bg-card p-5 shadow-soft"><div className="flex items-center justify-between"><span className={`grid h-9 w-9 place-items-center rounded-xl ${color}`}><Icon size={18} /></span><MoreHorizontal size={17} className="text-muted-foreground" /></div><p className="mt-5 text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-3xl font-bold">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{note}</p></div>; }
function AdminStat({ label, value }: { label: string; value: string | number }) { return <div><p className="text-xs text-primary-foreground/55">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>; }

function AdminBookings() {
  const rows = demoQueue.entries.map((entry, index) => ({ ...entry, crop: index % 2 ? 'Paddy' : 'Ragi', quantity: index % 2 ? '320 kg' : '240 kg', payment: index < 2 ? 'Pending' : 'Ready' }));
  return <AppShell role="admin"><PageTitle eyebrow="Operations desk" title="Today’s bookings" description="Every booked visit, ready for a quick and fair handoff." action={<Button variant="outline" data-testid="button-export-bookings" onClick={() => window.print()}><FileText size={16} /> Print list</Button>} /><div className="mb-5 flex flex-wrap gap-3"><div className="relative flex-1 sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><input className="field pl-10" placeholder="Search token or farmer" data-testid="input-search-bookings" /></div><StatusPill tone="green"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> 84 booked today</StatusPill></div><div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft"><table className="w-full min-w-[720px] text-left"><thead className="bg-muted/50 text-[11px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="px-5 py-4 font-bold">Token</th><th className="px-5 py-4 font-bold">Farmer</th><th className="px-5 py-4 font-bold">Crop</th><th className="px-5 py-4 font-bold">Slot</th><th className="px-5 py-4 font-bold">Status</th><th className="px-5 py-4 font-bold">Payment</th></tr></thead><tbody className="divide-y divide-border">{rows.map((row) => <tr className="hover:bg-muted/30" key={row.token} data-testid={`row-booking-${row.token}`}><td className="px-5 py-4 font-mono text-sm font-bold text-primary">{row.token}</td><td className="px-5 py-4"><p className="text-sm font-semibold">{row.name}</p><p className="text-[11px] text-muted-foreground">KA-MYS-0{row.token.slice(2)}</p></td><td className="px-5 py-4 text-sm">{row.crop}<span className="ml-1 text-xs text-muted-foreground">· {row.quantity}</span></td><td className="px-5 py-4 text-sm">{row.time}</td><td className="px-5 py-4"><StatusPill tone={row.status === 'Processing' ? 'green' : 'muted'}>{row.status}</StatusPill></td><td className="px-5 py-4"><StatusPill tone={row.payment === 'Ready' ? 'green' : 'gold'}>{row.payment}</StatusPill></td></tr>)}</tbody></table></div></AppShell>;
}

function AdminProcurement() {
  const [token, setToken] = useState('');
  const [stage, setStage] = useState(0);
  const steps = ['Arrived & verified', 'Quantity weighed', 'Quality approved', 'Payment queued'];
  return <AppShell role="admin"><PageTitle eyebrow="Desk workflow" title="Process a farmer" description="Move one booking forward with a simple, visible checklist." /><div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]"><section className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8"><p className="text-sm font-bold">Find booking</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Enter a token to open the farmer’s record.</p><div className="relative mt-5"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><input value={token} onChange={(e) => setToken(e.target.value.toUpperCase())} className="field pl-10 font-mono uppercase" placeholder="e.g. R-042" data-testid="input-process-token" /></div><Button className="mt-3 w-full" onClick={() => setToken(token || 'R-042')} data-testid="button-find-farmer">Open farmer record <ArrowRight size={15} /></Button><div className="mt-8 rounded-xl bg-muted p-4"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">Selected record</p><div className="mt-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-sm font-bold">KN</span><div><p className="text-sm font-bold">Kavya N.</p><p className="text-xs text-muted-foreground">{token || 'No token selected'} · Ragi · 240 kg</p></div></div></div></section><section className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-lift sm:p-8"><div className="flex items-start justify-between"><div><StatusPill tone="gold">{stage === 3 ? 'Ready to complete' : 'In progress'}</StatusPill><h2 className="mt-4 font-display text-2xl font-bold">Procurement checklist</h2></div><span className="font-mono text-sm text-secondary">{stage}/4</span></div><div className="mt-8 space-y-3">{steps.map((step, index) => <button className={`flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors ${index <= stage - 1 ? 'bg-secondary text-secondary-foreground' : index === stage ? 'bg-primary-foreground/10 text-primary-foreground' : 'bg-primary-foreground/5 text-primary-foreground/50'}`} onClick={() => index <= stage && setStage(index + 1)} key={step} disabled={index > stage} data-testid={`button-stage-${index}`}><span className={`grid h-8 w-8 place-items-center rounded-full ${index <= stage - 1 ? 'bg-primary text-primary-foreground' : 'border border-primary-foreground/25'}`}>{index <= stage - 1 ? <Check size={15} /> : index + 1}</span><span className="flex-1 text-sm font-bold">{step}</span>{index === stage && <ChevronRight size={17} />}</button>)}</div><p className="mt-7 text-xs leading-5 text-primary-foreground/55">{stage < 4 ? 'Select the next completed step after checking the farmer’s documents.' : 'All steps complete. The payment team can now release this record.'}</p></section></div></AppShell>;
}

function AdminPayments() {
  const [paid, setPaid] = useState<string[]>([]);
  const records = [{ token: 'R-031', name: 'Suresh K.', amount: '₹34,920', crop: 'Ragi · 180 kg' }, { token: 'R-027', name: 'Meena R.', amount: '₹61,440', crop: 'Paddy · 320 kg' }, { token: 'R-019', name: 'Ravi M.', amount: '₹42,360', crop: 'Maize · 240 kg' }];
  return <AppShell role="admin"><PageTitle eyebrow="Payment desk" title="Keep payments moving." description="Review completed procurement records and mark the handoff to payment." /><div className="mb-5 flex items-center gap-3 rounded-2xl border border-secondary/70 bg-secondary/20 p-4 text-sm"><Coins size={19} className="text-accent" /><span><strong>11 records</strong> are waiting for payment confirmation today.</span></div><div className="space-y-3">{records.map((record) => { const isPaid = paid.includes(record.token); return <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center" key={record.token} data-testid={`card-payment-${record.token}`}><span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">{record.token}</span><div className="flex-1"><p className="text-sm font-bold">{record.name}</p><p className="mt-1 text-xs text-muted-foreground">{record.crop} · Procurement complete</p></div><div className="sm:text-right"><p className="text-sm font-bold">{record.amount}</p><p className="mt-1 text-[11px] text-muted-foreground">{isPaid ? 'Sent to payment queue' : 'Ready for update'}</p></div><Button variant={isPaid ? 'quiet' : 'secondary'} onClick={() => setPaid((current) => isPaid ? current.filter((item) => item !== record.token) : [...current, record.token])} data-testid={`button-payment-${record.token}`}>{isPaid ? <><Check size={15} /> Mark pending</> : <>Mark payment queued <ArrowRight size={15} /></>}</Button></div>; })}</div></AppShell>;
}

function AdminReports() {
  const data = useGetAdminDashboard({ query: { queryKey: getGetAdminDashboardQueryKey(), retry: false } }).data ?? demoAdmin;
  const max = Math.max(...data.dailyBookings.map((point) => point.value));
  return <AppShell role="admin"><PageTitle eyebrow="Centre intelligence" title="Reports that help tomorrow." description="A quick read on demand, throughput, and the farmer experience." action={<Button variant="outline" onClick={() => window.print()} data-testid="button-print-report"><FileText size={16} /> Print report</Button>} /><div className="grid gap-4 sm:grid-cols-3"><Metric icon={CalendarDays} label="Bookings this week" value={data.dailyBookings.reduce((sum, point) => sum + point.value, 0)} note="Across six service days" /><Metric icon={TrendingUp} label="Peak day" value={84} note="Friday · highest demand" tone="gold" /><Metric icon={Clock3} label="Wait trend" value={data.metrics.averageWait} note="Minutes · 8 lower this week" tone="green" /></div><div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_.95fr]"><section className="rounded-2xl border border-border bg-card p-6 shadow-soft"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Demand pattern</p><h2 className="mt-2 font-display text-xl font-bold">Bookings by day</h2><div className="mt-8 flex h-52 items-end gap-4 border-b border-border">{data.dailyBookings.map((point) => <div key={point.label} className="flex h-full flex-1 flex-col justify-end gap-2"><div className="relative rounded-t-xl bg-secondary" style={{ height: `${(point.value / max) * 82}%` }}><span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold">{point.value}</span></div><span className="text-center text-xs font-semibold text-muted-foreground">{point.label}</span></div>)}</div></section><section className="rounded-2xl bg-sidebar p-6 text-sidebar-foreground shadow-soft"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-secondary">Service note</p><h2 className="mt-3 font-display text-2xl font-bold">Tomorrow can be lighter.</h2><p className="mt-4 text-sm leading-6 text-sidebar-foreground/65">Friday is your busiest day. Consider opening one additional early slot to keep the average wait below 35 minutes.</p><div className="mt-8 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><TrendingUp size={19} /></span><div><p className="text-sm font-bold">86% of bookings served</p><p className="text-xs text-sidebar-foreground/55">Before the promised slot</p></div></div></section></div><section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft"><h2 className="font-display text-xl font-bold">Useful signals</h2><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Most requested crop</p><p className="mt-2 text-lg font-bold">Ragi</p><p className="mt-1 text-xs text-muted-foreground">41% of this week’s bookings</p></div><div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Best arrival window</p><p className="mt-2 text-lg font-bold">08:30 – 10:00</p><p className="mt-1 text-xs text-muted-foreground">Shortest average wait</p></div><div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Payment backlog</p><p className="mt-2 text-lg font-bold">11 records</p><p className="mt-1 text-xs text-muted-foreground">Review before closing</p></div></div></section></AppShell>;
}

function NotFound() { return <div className="grid min-h-[100dvh] place-items-center bg-background p-5 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><Leaf size={25} /></span><h1 className="mt-5 font-display text-3xl font-bold">That page is not in the queue.</h1><p className="mt-2 text-sm text-muted-foreground">Let’s get you back to a clear next step.</p><Link href="/" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground" data-testid="link-not-found-home">Return home</Link></div></div>; }

function Router() {
  return <ErrorBoundary><Switch><Route path="/" component={Landing} /><Route path="/login"><AuthPage mode="login" /></Route><Route path="/register"><AuthPage mode="register" /></Route><Route path="/farmer/dashboard" component={FarmerDashboard} /><Route path="/farmer/book-slot" component={BookSlot} /><Route path="/farmer/queue"><QueuePage /></Route><Route path="/farmer/bookings" component={Bookings} /><Route path="/farmer/procurement" component={Procurement} /><Route path="/farmer/payments" component={Payments} /><Route path="/farmer/notifications" component={Notifications} /><Route path="/admin/dashboard" component={AdminDashboard} /><Route path="/admin/queue"><QueuePage admin /></Route><Route path="/admin/bookings" component={AdminBookings} /><Route path="/admin/procurement" component={AdminProcurement} /><Route path="/admin/payments" component={AdminPayments} /><Route path="/admin/reports" component={AdminReports} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;