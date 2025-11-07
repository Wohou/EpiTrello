'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function DebugAuth() {
  const [status, setStatus] = useState<any>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session }, error } = await supabaseBrowser.auth.getSession()

    setStatus({
      session: session ? '✅ Session exists' : '❌ No session',
      user: session?.user?.email || 'Not logged in',
      userId: session?.user?.id || 'N/A',
      cookies: document.cookie || 'No cookies',
      localStorage: typeof window !== 'undefined' ?
        Object.keys(localStorage).filter(k => k.includes('supabase')).join(', ') || 'No Supabase items'
        : 'N/A',
      error: error?.message || 'No error',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    })
  }

  const testLogin = async () => {
    const email = prompt('Email:')
    const password = prompt('Password:')

    if (!email || !password) return

    setLoading(true)

    try {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password
      })

      console.log('Login result:', { data, error })

      if (error) {
        alert(`❌ Error: ${error.message}`)
      } else {
        alert('✅ Login successful! Check console and status below.')
        await checkAuth()
      }
    } catch (err: any) {
      console.error('Login error:', err)
      alert(`❌ Exception: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testLogout = async () => {
    setLoading(true)
    await supabaseBrowser.auth.signOut()
    await checkAuth()
    setLoading(false)
    alert('✅ Logged out')
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '800px' }}>
      <h1>🔍 Auth Debug Page</h1>

      <div style={{ background: '#f5f5f5', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
        <h2>Status:</h2>
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
          {JSON.stringify(status, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={testLogin}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: '#0079bf',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          {loading ? 'Loading...' : 'Test Login'}
        </button>

        <button
          onClick={checkAuth}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: '#5aac44',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          Refresh Status
        </button>

        <button
          onClick={testLogout}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: '#eb5a46',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Test Logout
        </button>
      </div>

      <div style={{ marginTop: '40px', fontSize: '14px', lineHeight: '1.6' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Click "Test Login"</li>
          <li>Enter your email and password</li>
          <li>Check the console (F12) for detailed results</li>
          <li>Click "Refresh Status" to see if session was created</li>
          <li><strong>Key things to check:</strong>
            <ul>
              <li>Session should show ✅</li>
              <li>Cookies should contain session data</li>
              <li>localStorage should have supabase items</li>
            </ul>
          </li>
        </ol>

        <h3 style={{ marginTop: '30px' }}>Expected Results:</h3>
        <div style={{ background: '#d4edda', padding: '15px', borderRadius: '4px', border: '1px solid #c3e6cb' }}>
          <strong>After successful login:</strong>
          <ul>
            <li>session: ✅ Session exists</li>
            <li>user: your@email.com</li>
            <li>cookies: Should contain sb-* cookies</li>
            <li>localStorage: Should contain supabase keys</li>
          </ul>
        </div>

        <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '4px', border: '1px solid #f5c6cb', marginTop: '15px' }}>
          <strong>If login fails:</strong>
          <ul>
            <li>session: ❌ No session</li>
            <li>cookies: 'csrftoken=...' (wrong!)</li>
            <li>Check console for errors</li>
            <li>Check network tab for failed requests</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
        <h3>⚠️ Troubleshooting</h3>
        <p>If login doesn't work:</p>
        <ol>
          <li>Open Browser DevTools (F12)</li>
          <li>Go to <strong>Network</strong> tab</li>
          <li>Try logging in</li>
          <li>Look for POST request to Supabase</li>
          <li>Check the response - should contain access_token</li>
          <li>If no request appears, the Supabase client is not initialized</li>
        </ol>
      </div>
    </div>
  )
}
