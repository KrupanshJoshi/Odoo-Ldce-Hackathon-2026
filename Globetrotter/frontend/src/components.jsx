import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Compass, LayoutDashboard, Map, Plus, Search, CalendarDays, WalletCards, UserRound, Settings, LogOut, Menu, X, Globe2, Sparkles, ShieldCheck, ArrowRight, Trash2, Share2, Copy, Check, ChevronRight, Sun, Moon } from 'lucide-react'
import { useAuth } from './auth'

export function Shell({children}){
  const {user,logout}=useAuth(); const [open,setOpen]=useState(false); const nav=useNavigate()
  const [lightTheme, setLightTheme] = useState(document.body.classList.contains('light-theme'))
  const toggleTheme = () => {
    document.body.classList.toggle('light-theme');
    setLightTheme(x => !x);
  }
  const links=[['/','Dashboard',LayoutDashboard],['/trips','My Trips',Map],['/cities','Explore',Compass],['/calendar','Calendar',CalendarDays],['/budget','Budget',WalletCards]]
  return <div className="app-shell">
    <aside className={`sidebar ${open?'open':''}`}>
      <div className="brand"><div className="brand-mark"><Globe2 size={20}/></div><div><strong>Globe<span>Trotter</span></strong><small>Plan beyond borders</small></div></div>
      <nav>{links.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/' } onClick={()=>setOpen(false)} className={({isActive})=>isActive?'active':''}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom">
        <NavLink to="/profile" onClick={()=>setOpen(false)}><UserRound size={18}/><span>Profile</span></NavLink>
        {user?.role==='ADMIN' && <NavLink to="/admin" onClick={()=>setOpen(false)}><ShieldCheck size={18}/><span>Admin</span></NavLink>}
        <button className="nav-button" onClick={toggleTheme}>{lightTheme ? <Sun size={18}/> : <Moon size={18}/>}<span>{lightTheme ? 'Dark Mode' : 'Light Mode'}</span></button>
        <button className="nav-button" onClick={()=>{logout();nav('/login')}}><LogOut size={18}/><span>Log out</span></button>
        <div className="user-mini"><div className="avatar">{user?.name?.slice(0,1)||'G'}</div><div><b>{user?.name||'Traveler'}</b><small>{user?.email}</small></div></div>
      </div>
    </aside>
    <button className="mobile-menu" onClick={()=>setOpen(v=>!v)}>{open?<X/>:<Menu/>}</button>
    <main className="main-content">{children}</main>
  </div>
}

export function Topbar({eyebrow,title,description,action}){ return <header className="topbar"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</header> }
export function Button({children,variant='primary',icon:Icon,loading=false,...props}){ return <button className={`btn ${variant}`} disabled={loading||props.disabled} {...props}>{Icon&&<Icon size={17}/>} {loading?'Working…':children}</button> }
export function Empty({icon:Icon=Compass,title,text,action,className=""}){return <div className={`empty ${className}`}>{Icon&&<div className="empty-icon"><Icon/></div>}{title&&<h3>{title}</h3>}<p>{text}</p>{action}</div>}
export function Stat({label,value,detail,icon:Icon}){return <div className="stat"><div className="stat-top"><span>{label}</span><div className="stat-icon"><Icon size={18}/></div></div><strong>{value}</strong>{detail&&<small>{detail}</small>}</div>}
export function Toast({message,onClose}){if(!message)return null;return <div className="toast"><Check size={16}/>{message}<button onClick={onClose}>×</button></div>}
export function CityCard({city,onSave,saved=false,onAdd,onClick}){return <article className="city-card" onClick={onClick} style={{cursor:'pointer'}}>
  <div className="city-image" style={{backgroundImage:`url(${city.imageUrl||'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80'})`}}><span className="pill">{city.region||city.country}</span><button className={`save ${saved?'saved':''}`} onClick={(e)=>{e.stopPropagation();onSave?.(city)}}>{saved?'♥':'♡'}</button></div>
  <div className="city-body"><div><h3>{city.name}</h3><p>{city.country}</p></div><div className="city-meta"><span>Cost {city.costIndex}/100</span><span>★ {city.popularity}</span></div>{onAdd&&<Button variant="soft" icon={Plus} onClick={(e)=>{e.stopPropagation();onAdd(city)}}>Add to trip</Button>}</div>
</article>}
export function TripCard({trip,onDelete,onShare}){const [copied,setCopied]=useState(false);return <article className="trip-card">
  <div className="trip-cover" style={{backgroundImage:`url(${trip.coverPhotoUrl||'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80'})`}}><span className="trip-status">{trip.isPublic?'Public':'Private'}</span></div>
  <div className="trip-body"><div className="trip-head"><div><h3>{trip.name}</h3><p>{fmtDate(trip.startDate)} — {fmtDate(trip.endDate)}</p></div><Link className="icon-btn" to={`/trips/${trip.id}`}><ChevronRight size={18}/></Link></div>
  <div className="trip-cities">{trip.cities?.slice(0,3).map(c=><span key={c}>{c}</span>)}{trip.destinationCount>3&&<span>+{trip.destinationCount-3}</span>}</div>
  <div className="trip-actions"><Link to={`/trips/${trip.id}`} className="btn soft">View itinerary</Link>{onShare&&<button className="icon-btn" title="Share" onClick={()=>onShare(trip)}><Share2 size={16}/></button>}{onDelete&&<button className="icon-btn danger" title="Delete" onClick={()=>onDelete(trip)}><Trash2 size={16}/></button>}</div></div>
</article>}
export function SectionTitle({title,action}){return <div className="section-title"><h2>{title}</h2>{action}</div>}
export function fmtDate(v){if(!v)return '—';return new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}
export function money(v){return `₹${Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:0})}`}
