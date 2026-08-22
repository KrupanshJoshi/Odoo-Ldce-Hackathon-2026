const API_URL = import.meta.env.VITE_API_URL || '/api'

export function getToken(){ return localStorage.getItem('gt_token') }
export function setSession(token,user){ localStorage.setItem('gt_token',token); localStorage.setItem('gt_user',JSON.stringify(user)) }
export function clearSession(){ localStorage.removeItem('gt_token'); localStorage.removeItem('gt_user') }

export async function api(path, options={}){
  const token = getToken()
  const headers = { 'Content-Type':'application/json', ...(options.headers||{}) }
  if(token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  let body = null
  try { body = await res.json() } catch {}
  if(!res.ok){
    if(res.status === 401){ clearSession() }
    throw new Error(body?.message || `Request failed (${res.status})`)
  }
  return body
}

export const get = (path) => api(path)
export const post = (path,data) => api(path,{method:'POST',body:JSON.stringify(data)})
export const put = (path,data) => api(path,{method:'PUT',body:JSON.stringify(data)})
export const del = (path) => api(path,{method:'DELETE'})
export { API_URL }
