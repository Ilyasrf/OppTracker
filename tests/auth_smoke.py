"""Isolated auth regression. Use the same dummy Vite settings as browser_smoke.py.
No real accounts, confirmation emails, or external service requests are created.
Configuration regression: start Vite with VITE_SUPABASE_URL=' https://opptracker-test.invalid '
and VITE_SUPABASE_ANON_KEY=' public-test-key ' to verify pasted whitespace is ignored.
"""
import base64
import json
import re
import time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:5173'
USER = '11111111-1111-4111-8111-111111111111'
def token():
    def enc(value): return base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')
    return enc({'alg':'HS256','typ':'JWT'}) + '.' + enc({'sub':USER,'exp':int(time.time())+3600,'aud':'authenticated','role':'authenticated'}) + '.fake'
user = {'id':USER,'aud':'authenticated','role':'authenticated','email':'test@example.com','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
state = {'fail_login':True, 'fail_signup':False, 'instant_signup':False, 'fail_logout':False, 'signup_calls':0}
unexpected, errors = [], []

def route(request):
    req=request.request
    url=urlparse(req.url)
    def respond(body,status=200): request.fulfill(status=status,content_type='application/json',body=json.dumps(body),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'})
    if url.netloc=='127.0.0.1:5173': return request.continue_()
    if url.netloc!='opptracker-test.invalid': unexpected.append(req.url); return request.abort()
    if req.method=='OPTIONS': return respond({})
    session={'access_token':token(),'refresh_token':'fake-refresh','expires_in':3600,'token_type':'bearer','user':user}
    if url.path.endswith('/token'):
        if state['fail_login']: return respond({'code':'invalid_credentials','msg':'Invalid login credentials'},400)
        assert req.post_data_json['email']=='test@example.com'
        return respond(session)
    if url.path.endswith('/signup'):
        state['signup_calls']+=1
        if state['fail_signup']: return respond({'msg':'Signup temporarily unavailable'},400)
        return respond(session if state['instant_signup'] else user)
    if url.path.endswith('/logout'):
        if state['fail_logout']: return respond({'msg':'Sign out unavailable'},500)
        return respond({})
    if url.path.endswith('/user'): return respond(user)
    if url.path.startswith('/rest/v1/'):
        assert req.method=='GET', 'Auth must not mutate application data'
        return respond([])
    raise AssertionError(req.url)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000})
    context.route('**/*',route)
    page=context.new_page();page.on('pageerror',lambda err:errors.append(str(err)))
    page.goto(BASE+'/preparation');page.wait_for_load_state('networkidle')
    expect(page).to_have_url(BASE+'/login')
    expect(page.get_by_role('heading',name='Welcome back.')).to_be_visible()
    page.screenshot(path='/tmp/opptracker-auth-desktop.png',full_page=True)
    page.get_by_label('Email',exact=True).fill('test@example.com')
    page.get_by_label('Password',exact=True).fill('example-password')
    expect(page.get_by_label('Password',exact=True)).to_have_attribute('autocomplete','current-password')
    page.get_by_role('button',name='Show password',exact=True).click()
    expect(page.get_by_label('Password',exact=True)).to_have_attribute('type','text')
    page.get_by_role('button',name='Hide password',exact=True).click()
    page.get_by_role('button',name='Sign in',exact=False).click()
    expect(page.get_by_role('alert')).to_contain_text('Invalid login credentials')
    expect(page.get_by_role('button',name='Sign in',exact=False)).to_be_enabled()
    state['fail_login']=False
    page.get_by_role('button',name='Sign in',exact=False).click()
    expect(page).to_have_url(BASE+'/preparation')
    expect(page.get_by_role('heading',name='Your plans')).to_be_visible()
    page.reload();page.wait_for_load_state('networkidle')
    expect(page).to_have_url(BASE+'/preparation')
    state['fail_logout']=True
    page.get_by_role('button',name='Sign out').click()
    expect(page.get_by_role('alert')).to_contain_text('signed out on this device')
    expect(page).to_have_url(BASE+'/login')
    state['fail_logout']=False
    page.get_by_label('Email',exact=True).fill('test@example.com')
    page.get_by_label('Password',exact=True).fill('example-password')
    page.get_by_role('button',name='Sign in',exact=False).click()
    expect(page).to_have_url(BASE+'/preparation')
    page.get_by_role('button',name='Sign out').click()
    expect(page).to_have_url(BASE+'/login')
    page.get_by_role('link',name='Create an account').click()
    expect(page.get_by_role('heading',name='Start your notebook.')).to_be_visible()
    expect(page.get_by_role('heading',name='Start your notebook.')).to_be_visible()
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path='/tmp/opptracker-auth-mobile.png',full_page=True)
    page.get_by_label('Email',exact=True).fill('test@example.com')
    page.get_by_label('Password',exact=True).fill('example-password')
    page.get_by_label('Confirm password',exact=True).fill('different-password')
    page.get_by_role('button',name='Create account').click()
    expect(page.get_by_role('alert')).to_contain_text('Passwords do not match')
    assert state['signup_calls']==0
    page.get_by_label('Confirm password',exact=True).fill('example-password')
    state['fail_signup']=True
    page.get_by_role('button',name='Create account').click()
    expect(page.get_by_role('alert')).to_contain_text('Signup temporarily unavailable')
    state['fail_signup']=False
    page.get_by_role('button',name='Create account').click()
    expect(page).to_have_url(BASE+'/login')
    expect(page.get_by_role('status')).to_contain_text('Check your inbox')
    page.get_by_role('link',name='Create an account').click()
    expect(page.get_by_role('heading',name='Start your notebook.')).to_be_visible()
    state['instant_signup']=True
    page.get_by_label('Email',exact=True).fill('test@example.com')
    page.get_by_label('Password',exact=True).fill('example-password')
    page.get_by_label('Confirm password',exact=True).fill('example-password')
    page.get_by_role('button',name='Create account').click()
    expect(page).to_have_url(BASE+'/preparation')
    page.goto(BASE+'/login');page.wait_for_load_state('networkidle')
    expect(page).to_have_url(BASE+'/')
    page.goto(BASE+'/auth/callback');page.wait_for_load_state('networkidle')
    expect(page).to_have_url(BASE+'/')
    page.get_by_role('button',name='Sign out').click()
    expect(page).to_have_url(BASE+'/login')
    page.goto(BASE+'/auth/callback?error=access_denied&error_description=untrusted-text')
    expect(page.get_by_role('alert')).to_contain_text('could not be verified')
    expect(page.get_by_text('untrusted-text')).to_have_count(0)
    # A supplied external return URL must never navigate away after signing in.
    page.evaluate("history.replaceState({...history.state,usr:{from:'//evil.invalid/path'}},'')")
    page.reload();page.wait_for_load_state('networkidle')
    page.get_by_label('Email',exact=True).fill('test@example.com')
    page.get_by_label('Password',exact=True).fill('example-password')
    page.get_by_role('button',name='Sign in',exact=False).click()
    expect(page).to_have_url(BASE+'/')
    assert not unexpected,unexpected
    assert not errors,errors
    browser.close()
print('PASS: protected redirects, sign-in errors/retry, password visibility, persisted session, sign-out failure/success, signup validation/confirmation/instant session, callback errors, external redirect rejection, desktop/mobile. No production traffic.')
