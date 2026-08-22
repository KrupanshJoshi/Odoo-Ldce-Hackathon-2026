import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import { AuthPage, Admin, Budget, Calendar, Cities, CreateTrip, Dashboard, Itinerary, Profile, PublicTrip, Trips } from './pages'
import './styles.css'

function Protected(){const {user,loading}=useAuth();const loc=useLocation();if(loading)return <div className="fullscreen-loading">Loading GlobeTrotter…</div>;if(!user)return <Navigate to="/login" replace state={{from:loc.pathname}}/>;return <Outlet/>}
function AdminOnly(){const {user}=useAuth();return user?.role==='ADMIN'?<Outlet/>:<Navigate to="/" replace/>}
function App(){return <Routes><Route path="/login" element={<AuthPage/>}/><Route path="/signup" element={<AuthPage mode="signup"/>}/><Route path="/public/trips/:slug" element={<PublicTrip/>}/><Route element={<Protected/>}><Route path="/" element={<Dashboard/>}/><Route path="/trips" element={<Trips/>}/><Route path="/trips/new" element={<CreateTrip/>}/><Route path="/trips/:id" element={<Itinerary/>}/><Route path="/trips/:id/budget" element={<Budget/>}/><Route path="/trips/:id/calendar" element={<Calendar/>}/><Route path="/cities" element={<Cities/>}/><Route path="/budget" element={<Budget/>}/><Route path="/calendar" element={<Calendar/>}/><Route path="/profile" element={<Profile/>}/><Route element={<AdminOnly/>}><Route path="/admin" element={<Admin/>}/></Route></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter></React.StrictMode>)
