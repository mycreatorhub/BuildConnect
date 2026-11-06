import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { BriefcaseBusiness, MapPin, Plus, Search, Hammer, LogOut, UserRound, Languages, X, Send, CheckCircle2, LoaderCircle } from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

type Role = "client" | "worker";
type Profile = {
  id: string; role: Role; full_name: string; phone_number: string | null;
  region: string | null; province: string | null; city_municipality: string | null;
  barangay: string | null; bio: string | null; years_experience: number | null;
};
type Category = { id: number; name: string; name_fil: string };
type Job = {
  id: string; client_id: string; category_id: number; title: string; description: string;
  budget_min: number | null; budget_max: number | null; region: string; province: string;
  city_municipality: string; barangay: string; status: string; created_at: string;
  job_categories?: Category;
};
type Bid = { id: string; job_id: string; worker_id: string; proposed_price: number; estimated_days: number; proposal: string; status: string; created_at: string; profiles?: { full_name: string } };

const copy = {
  en: {
    tagline: "Find work. Find skilled people.", intro: "A simpler way to connect Filipino clients and construction workers.",
    signIn: "Sign in", signUp: "Create account", email: "Email address", password: "Password",
    fullName: "Full name", phone: "Phone number (optional)", client: "I need a worker", worker: "I am a worker",
    jobs: "Find jobs", myJobs: "My job posts", bids: "My proposals", post: "Post a job",
    search: "Search by job or location", openJobs: "Available jobs", noJobs: "No jobs posted yet. Check back soon.",
    area: "Work area", budget: "Budget", details: "Job details", category: "Type of work",
    title: "Job title", description: "Describe the work", region: "Region", province: "Province",
    city: "City / Municipality", barangay: "Barangay", min: "Minimum budget (₱)", max: "Maximum budget (₱)",
    publish: "Publish job", cancel: "Cancel", proposal: "Your proposal", price: "Your price (₱)",
    days: "Estimated days", send: "Send proposal", sent: "Proposal submitted", posted: "Job posted successfully",
    signOut: "Sign out", welcome: "Welcome", loading: "Loading…", setup: "Connect Supabase to continue",
    setupText: "Add your Supabase project URL and publishable key as GitHub Actions variables before deployment.",
    authError: "Please check your details and try again.", required: "Please complete all required fields.",
    clientOnly: "Only clients can post jobs.", workerOnly: "Only workers can send proposals.",
    noAccount: "Don't have an account?", haveAccount: "Already have an account?", switch: "Switch language",
    chooseRole: "Choose your account type", pending: "Pending", approved: "Approved", approve: "Approve worker",
    postedBy: "Posted", budgetUnspecified: "Budget not specified", signUpNote: "Email confirmation may be required.",
    filterAll: "All jobs", yourRole: "Account type", noPosts: "You have not posted any jobs yet.",
    noBids: "No proposals yet.", applications: "Proposals", jobAreaPrivacy: "Only the general work area is shown publicly. Exact addresses stay private.",
    errors: "Something went wrong. Please try again.", accountCreated: "Account created. Check your email if confirmation is required."
  },
  fil: {
    tagline: "Maghanap ng trabaho. Makahanap ng mahusay na manggagawa.", intro: "Mas madaling paraan para pag-ugnayin ang mga kliyente at construction worker sa Pilipinas.",
    signIn: "Mag-sign in", signUp: "Gumawa ng account", email: "Email address", password: "Password",
    fullName: "Buong pangalan", phone: "Numero ng telepono (opsyonal)", client: "Kailangan ko ng manggagawa", worker: "Ako ay manggagawa",
    jobs: "Maghanap ng trabaho", myJobs: "Mga job post ko", bids: "Mga proposal ko", post: "Mag-post ng trabaho",
    search: "Maghanap ayon sa trabaho o lugar", openJobs: "Mga available na trabaho", noJobs: "Wala pang naka-post na trabaho.",
    area: "Lugar ng trabaho", budget: "Badyet", details: "Detalye ng trabaho", category: "Uri ng trabaho",
    title: "Pamagat ng trabaho", description: "Ilarawan ang trabaho", region: "Rehiyon", province: "Probinsya",
    city: "Lungsod / Munisipalidad", barangay: "Barangay", min: "Pinakamababang badyet (₱)", max: "Pinakamataas na badyet (₱)",
    publish: "I-post ang trabaho", cancel: "Kanselahin", proposal: "Iyong proposal", price: "Presyo mo (₱)",
    days: "Tinatayang araw", send: "Ipadala ang proposal", sent: "Naipadala ang proposal", posted: "Matagumpay na na-post",
    signOut: "Mag-sign out", welcome: "Maligayang pagdating", loading: "Naglo-load…", setup: "Ikonekta ang Supabase para magpatuloy",
    setupText: "Idagdag ang Supabase project URL at publishable key sa GitHub Actions variables bago i-deploy.",
    authError: "Suriin ang iyong impormasyon at subukan muli.", required: "Punan ang lahat ng kinakailangang detalye.",
    clientOnly: "Kliyente lamang ang maaaring mag-post.", workerOnly: "Manggagawa lamang ang maaaring magpadala ng proposal.",
    noAccount: "Wala ka pang account?", haveAccount: "May account ka na?", switch: "Palitan ang wika",
    chooseRole: "Piliin ang uri ng account", pending: "Pending", approved: "Naaprubahan", approve: "Aprubahan ang manggagawa",
    postedBy: "Na-post", budgetUnspecified: "Walang nakasaad na badyet", signUpNote: "Maaaring kailanganin ang email confirmation.",
    filterAll: "Lahat ng trabaho", yourRole: "Uri ng account", noPosts: "Wala ka pang naka-post na trabaho.",
    noBids: "Wala pang proposal.", applications: "Mga proposal", jobAreaPrivacy: "Pangkalahatang lugar lamang ang makikita ng publiko. Mananatiling pribado ang eksaktong address.",
    errors: "May naganap na error. Subukan muli.", accountCreated: "Nagawa ang account. Tingnan ang email kung kailangan ng confirmation."
  }
};

export default function App() {
  const [lang, setLang] = useState<"en" | "fil">("fil");
  const t = copy[lang];
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [tab, setTab] = useState<"jobs" | "mine" | "bids">("jobs");
  const [query, setQuery] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [auth, setAuth] = useState({ email: "", password: "", fullName: "", phone: "", role: "worker" as Role });
  const [jobForm, setJobForm] = useState({ category_id: "", title: "", description: "", budget_min: "", budget_max: "", region: "", province: "", city_municipality: "", barangay: "" });
  const [bidForm, setBidForm] = useState({ proposed_price: "", estimated_days: "", proposal: "" });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) { setProfile(null); return; }
    void loadAccount();
  }, [session?.user?.id]);

  async function loadAccount() {
    if (!supabase || !session?.user) return;
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
      supabase.from("job_categories").select("id,name,name_fil").order("name")
    ]);
    setProfile(p as Profile | null);
    setCategories((c || []) as Category[]);
    await loadData(p as Profile | null);
  }

  async function loadData(p = profile) {
    if (!supabase) return;
    const { data: open } = await supabase.from("job_posts").select("*,job_categories(id,name,name_fil)").eq("status", "open").order("created_at", { ascending: false });
    setJobs((open || []) as Job[]);
    if (!session?.user) return;
    if (p?.role === "client") {
      const { data } = await supabase.from("job_posts").select("*,job_categories(id,name,name_fil)").eq("client_id", session.user.id).order("created_at", { ascending: false });
      setMyJobs((data || []) as Job[]);
    } else if (p?.role === "worker") {
      const { data } = await supabase.from("bids").select("*,job_posts(title,city_municipality,province)").eq("worker_id", session.user.id).order("created_at", { ascending: false });
      setMyBids((data || []) as Bid[]);
    }
  }

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(j => [j.title, j.description, j.region, j.province, j.city_municipality, j.barangay, j.job_categories?.name].some(v => (v || "").toLowerCase().includes(q)));
  }, [jobs, query]);

  async function handleAuth(e: FormEvent) {
    e.preventDefault(); setError(""); setNotice(""); setBusy(true);
    if (!supabase) { setError(t.setup); setBusy(false); return; }
    try {
      if (authMode === "signup") {
        const { error: e1 } = await supabase.auth.signUp({
          email: auth.email, password: auth.password,
          options: { data: { role: auth.role, full_name: auth.fullName.trim(), phone_number: auth.phone.trim() || null } }
        });
        if (e1) throw e1;
        setNotice(t.accountCreated);
      } else {
        const { error: e1 } = await supabase.auth.signInWithPassword({ email: auth.email, password: auth.password });
        if (e1) throw e1;
      }
    } catch (e: any) { setError(e.message || t.authError); }
    finally { setBusy(false); }
  }

  async function handlePost(e: FormEvent) {
    e.preventDefault(); setError(""); setNotice("");
    if (!supabase || !profile || profile.role !== "client") { setError(t.clientOnly); return; }
    if (!jobForm.category_id || !jobForm.title.trim() || !jobForm.description.trim() || !jobForm.region.trim() || !jobForm.province.trim() || !jobForm.city_municipality.trim() || !jobForm.barangay.trim()) { setError(t.required); return; }
    setBusy(true);
    const { error: e1 } = await supabase.from("job_posts").insert({
      client_id: session.user.id, category_id: Number(jobForm.category_id), title: jobForm.title.trim(),
      description: jobForm.description.trim(), budget_min: jobForm.budget_min ? Number(jobForm.budget_min) : null,
      budget_max: jobForm.budget_max ? Number(jobForm.budget_max) : null,
      region: jobForm.region.trim(), province: jobForm.province.trim(), city_municipality: jobForm.city_municipality.trim(),
      barangay: jobForm.barangay.trim(), status: "open"
    });
    setBusy(false);
    if (e1) { setError(e1.message); return; }
    setNotice(t.posted); setJobForm({ category_id: "", title: "", description: "", budget_min: "", budget_max: "", region: "", province: "", city_municipality: "", barangay: "" });
    await loadData(); setTab("mine");
  }

  async function handleBid(e: FormEvent) {
    e.preventDefault(); setError(""); setNotice("");
    if (!supabase || !profile || profile.role !== "worker" || !selectedJob) { setError(t.workerOnly); return; }
    if (!bidForm.proposed_price || !bidForm.estimated_days || !bidForm.proposal.trim()) { setError(t.required); return; }
    setBusy(true);
    const { error: e1 } = await supabase.from("bids").insert({
      job_id: selectedJob.id, worker_id: session.user.id, proposed_price: Number(bidForm.proposed_price),
      estimated_days: Number(bidForm.estimated_days), proposal: bidForm.proposal.trim(), status: "pending"
    });
    setBusy(false);
    if (e1) { setError(e1.message); return; }
    setNotice(t.sent); setSelectedJob(null); setBidForm({ proposed_price: "", estimated_days: "", proposal: "" }); await loadData();
  }

  async function approveBid(bidId: string) {
    if (!supabase) return;
    setBusy(true);
    const { error: e1 } = await supabase.from("bids").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", bidId);
    setBusy(false);
    if (e1) setError(e1.message); else { setNotice(t.approved); await loadData(); }
  }

  if (!isSupabaseConfigured) return <main className="setup-screen"><div className="brand-mark"><Hammer size={30}/></div><h1>BuildConnect</h1><h2>{t.setup}</h2><p>{t.setupText}</p><button className="language" onClick={() => setLang(lang === "fil" ? "en" : "fil")}><Languages size={16}/>{t.switch}</button></main>;

  if (!session) return <main className="auth-layout">
    <section className="hero-panel"><div className="brand"><span className="brand-mark"><Hammer size={24}/></span><b>BuildConnect</b></div><div className="hero-copy"><span className="eyebrow">TRABAHO • KONEKSYON • PAG-ASA</span><h1>{t.tagline}</h1><p>{t.intro}</p><div className="hero-points"><span><CheckCircle2/> Walang diploma requirement</span><span><CheckCircle2/> Direktang koneksyon</span><span><CheckCircle2/> Para sa lokal na manggagawa</span></div></div><div className="hero-foot">Made for Filipino communities</div></section>
    <section className="auth-panel"><button className="language" onClick={() => setLang(lang === "fil" ? "en" : "fil")}><Languages size={16}/>{t.switch}</button><form className="auth-card" onSubmit={handleAuth}>
      <div className="mobile-brand"><span className="brand-mark"><Hammer size={22}/></span><b>BuildConnect</b></div>
      <span className="eyebrow">{authMode === "signin" ? "WELCOME BACK" : "JOIN THE COMMUNITY"}</span><h2>{authMode === "signin" ? t.signIn : t.signUp}</h2>
      {authMode === "signup" && <><label>{t.fullName}<input required value={auth.fullName} onChange={e=>setAuth({...auth,fullName:e.target.value})} placeholder="Juan Dela Cruz"/></label><label>{t.phone}<input value={auth.phone} onChange={e=>setAuth({...auth,phone:e.target.value})} placeholder="09XX XXX XXXX"/></label><label>{t.chooseRole}<select value={auth.role} onChange={e=>setAuth({...auth,role:e.target.value as Role})}><option value="worker">{t.worker}</option><option value="client">{t.client}</option></select></label></>}
      <label>{t.email}<input required type="email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})} placeholder="you@example.com"/></label>
      <label>{t.password}<input required minLength={6} type="password" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})} placeholder="••••••••"/></label>
      {error && <p className="alert error">{error}</p>}{notice && <p className="alert success">{notice}</p>}
      <button className="primary full" disabled={busy}>{busy ? <LoaderCircle className="spin"/> : null}{authMode === "signin" ? t.signIn : t.signUp}</button>
      <p className="switch-auth">{authMode === "signin" ? t.noAccount : t.haveAccount} <button type="button" onClick={()=>{setAuthMode(authMode==="signin"?"signup":"signin");setError("");setNotice("");}}>{authMode === "signin" ? t.signUp : t.signIn}</button></p>
      {authMode === "signup" && <small>{t.signUpNote}</small>}
    </form></section>
  </main>;

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Hammer size={22}/></span><b>BuildConnect</b></div><div className="top-actions"><span className="user-label"><UserRound size={16}/>{profile?.full_name || session.user.email}</span><button className="icon-button" title={t.switch} onClick={()=>setLang(lang==="fil"?"en":"fil")}><Languages size={18}/></button><button className="icon-button" title={t.signOut} onClick={()=>supabase?.auth.signOut()}><LogOut size={18}/></button></div></header>
    <main className="dashboard">
      <div className="welcome-row"><div><span className="eyebrow">{t.welcome.toUpperCase()}</span><h1>{profile?.full_name || session.user.email}</h1><p>{profile?.role === "client" ? t.client : t.worker}</p></div>{profile?.role === "client" && <button className="primary" onClick={()=>setTab("mine")}><Plus size={18}/>{t.post}</button>}</div>
      {error && <p className="alert error">{error}</p>}{notice && <p className="alert success">{notice}</p>}
      <nav className="tabs">
        <button className={tab==="jobs"?"active":""} onClick={()=>setTab("jobs")}><Search size={17}/>{t.jobs}</button>
        {profile?.role==="client" && <button className={tab==="mine"?"active":""} onClick={()=>setTab("mine")}><BriefcaseBusiness size={17}/>{t.myJobs}</button>}
        {profile?.role==="worker" && <button className={tab==="bids"?"active":""} onClick={()=>setTab("bids")}><Send size={17}/>{t.bids}</button>}
      </nav>
      {tab==="jobs" && <section><div className="section-heading"><div><h2>{t.openJobs}</h2><p>{t.jobAreaPrivacy}</p></div><div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/></div></div>
        {filteredJobs.length===0 ? <div className="empty"><BriefcaseBusiness size={30}/><p>{t.noJobs}</p></div> : <div className="job-grid">{filteredJobs.map(job=><article className="job-card" key={job.id}><div className="card-top"><span className="category-pill">{lang==="fil"?(job.job_categories?.name_fil || job.job_categories?.name):(job.job_categories?.name || "Construction")}</span><span className="status-dot">● {t.pending}</span></div><h3>{job.title}</h3><p className="job-description">{job.description}</p><div className="meta"><MapPin size={16}/>{[job.barangay,job.city_municipality,job.province].filter(Boolean).join(", ")}</div><div className="card-bottom"><b>{job.budget_min || job.budget_max ? `₱${Number(job.budget_min||0).toLocaleString()} – ₱${Number(job.budget_max||0).toLocaleString()}` : t.budgetUnspecified}</b>{profile?.role==="worker" && <button className="primary small" onClick={()=>setSelectedJob(job)}>{t.send}</button>}</div></article>)}</div>}
      </section>}
      {tab==="mine" && profile?.role==="client" && <section><div className="section-heading"><div><h2>{t.myJobs}</h2><p>{t.jobAreaPrivacy}</p></div></div><div className="content-grid"><form className="form-card" onSubmit={handlePost}><h3><Plus size={19}/>{t.post}</h3><label>{t.category}<select required value={jobForm.category_id} onChange={e=>setJobForm({...jobForm,category_id:e.target.value})}><option value="">—</option>{categories.map(c=><option key={c.id} value={c.id}>{lang==="fil"?c.name_fil:c.name}</option>)}</select></label><label>{t.title}<input required value={jobForm.title} onChange={e=>setJobForm({...jobForm,title:e.target.value})}/></label><label>{t.description}<textarea required rows={4} value={jobForm.description} onChange={e=>setJobForm({...jobForm,description:e.target.value})}/></label><div className="two-col"><label>{t.min}<input type="number" min="0" value={jobForm.budget_min} onChange={e=>setJobForm({...jobForm,budget_min:e.target.value})}/></label><label>{t.max}<input type="number" min="0" value={jobForm.budget_max} onChange={e=>setJobForm({...jobForm,budget_max:e.target.value})}/></label></div><h4>{t.area}</h4><div className="two-col"><label>{t.region}<input required value={jobForm.region} onChange={e=>setJobForm({...jobForm,region:e.target.value})}/></label><label>{t.province}<input required value={jobForm.province} onChange={e=>setJobForm({...jobForm,province:e.target.value})}/></label><label>{t.city}<input required value={jobForm.city_municipality} onChange={e=>setJobForm({...jobForm,city_municipality:e.target.value})}/></label><label>{t.barangay}<input required value={jobForm.barangay} onChange={e=>setJobForm({...jobForm,barangay:e.target.value})}/></label></div><button className="primary full" disabled={busy}>{busy?<LoaderCircle className="spin"/>:<Plus size={17}/>}{t.publish}</button></form><div className="my-posts"><h3>{t.myJobs}</h3>{myJobs.length===0?<div className="empty compact">{t.noPosts}</div>:myJobs.map(j=><div className="mini-job" key={j.id}><b>{j.title}</b><span>{j.city_municipality}, {j.province} · {j.status}</span><button className="text-button" onClick={async()=>{setSelectedJob(j);if(supabase){const {data}=await supabase.from("bids").select("*,profiles(full_name)").eq("job_id",j.id);setMyBids((data||[]) as Bid[]);}}}>{t.applications}</button>{selectedJob?.id===j.id && <div className="bid-list">{myBids.length===0?<small>{t.noBids}</small>:myBids.map(b=><div className="bid-row" key={b.id}><b>{b.profiles?.full_name || "Worker"}</b><span>₱{Number(b.proposed_price).toLocaleString()} · {b.estimated_days} days</span><p>{b.proposal}</p>{b.status==="pending"&&<button className="primary small" disabled={busy} onClick={()=>approveBid(b.id)}>{t.approve}</button>}<small>{b.status}</small></div>)}</div>}</div>)}</div></div></section>}
      {tab==="bids" && profile?.role==="worker" && <section><div className="section-heading"><div><h2>{t.bids}</h2></div></div>{myBids.length===0?<div className="empty">{t.noBids}</div>:myBids.map(b=><div className="bid-row standalone" key={b.id}><b>{(b as any).job_posts?.title || "Job"}</b><span>₱{Number(b.proposed_price).toLocaleString()} · {b.estimated_days} days</span><p>{b.proposal}</p><small>{b.status}</small></div>)}</section>}
    </main>
    {selectedJob && profile?.role==="worker" && <div className="modal-backdrop" onClick={()=>setSelectedJob(null)}><form className="modal" onSubmit={handleBid} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setSelectedJob(null)}><X/></button><span className="eyebrow">{t.proposal}</span><h2>{selectedJob.title}</h2><label>{t.price}<input required type="number" min="0" value={bidForm.proposed_price} onChange={e=>setBidForm({...bidForm,proposed_price:e.target.value})}/></label><label>{t.days}<input required type="number" min="1" value={bidForm.estimated_days} onChange={e=>setBidForm({...bidForm,estimated_days:e.target.value})}/></label><label>{t.proposal}<textarea required rows={4} value={bidForm.proposal} onChange={e=>setBidForm({...bidForm,proposal:e.target.value})}/></label>{error&&<p className="alert error">{error}</p>}<button className="primary full" disabled={busy}>{busy?<LoaderCircle className="spin"/>:<Send size={17}/>}{t.send}</button></form></div>}
    <footer className="footer">BuildConnect · Trabaho. Koneksyon. Pag-asa.</footer>
  </div>;
}
