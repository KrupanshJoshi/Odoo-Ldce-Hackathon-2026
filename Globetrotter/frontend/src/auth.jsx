import { createContext, useContext, useEffect, useState } from 'react'
import { api, clearSession, getToken, setSession } from './api'

const AuthContext = createContext(null)
export function AuthProvider({children}){
  const [user,setUser] = useState(()=>{ try{return JSON.parse(localStorage.getItem('gt_user'))}catch{return null} })
  const [loading,setLoading] = useState(!!getToken())
  useEffect(()=>{
    if(!getToken()){ setLoading(false); return }
    api('/auth/me').then(r=>{ setUser(r.data.user); localStorage.setItem('gt_user',JSON.stringify(r.data.user)) }).catch(()=>{clearSession();setUser(null)}).finally(()=>setLoading(false))
  },[])
  const login = async (email,password)=>{ const r=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})}); setSession(r.data.token,r.data.user); setUser(r.data.user); return r.data.user }
  const signup = async (name,email,password)=>{ const r=await api('/auth/signup',{method:'POST',body:JSON.stringify({name,email,password})}); setSession(r.data.token,r.data.user); setUser(r.data.user); return r.data.user }
  const logout = ()=>{clearSession();setUser(null)}
  return <AuthContext.Provider value={{user,loading,login,signup,logout}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext)
