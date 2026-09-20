"""Isolated browser regression: no production hosts or credentials are used.
Run Vite with VITE_SUPABASE_URL=https://oppnote-test.invalid and
VITE_SUPABASE_ANON_KEY=public-test-key, then: python tests/browser_smoke.py
Requires Python Playwright + Chromium. All service traffic is intercepted.
"""
import base64
import json
import re
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:5173'
USER = '11111111-1111-4111-8111-111111111111'
now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
def iso(days): return (now + timedelta(days=days)).isoformat().replace('+00:00', 'Z')
def opp(id, title, days, status='need_to_apply'):
    return dict(id=id,user_id=USER,title=title,url='https://example.com/'+id,deadline=iso(days),status=status,funding_type='fully_funded',location='Remote / international',travel_accommodation='Travel and housing covered',category='fellowship',notes='Next: update my CV and prepare a motivation letter.',applied_date=None,created_at=iso(-15),updated_at=iso(-2))
items = [opp('next','Creative Futures Fellowship',2),opp('later','Global Research Residency',14),opp('past','Community Leadership Program',-3),opp('applied','Open Science Internship',1,'applied'),opp('interview','Climate Innovation Fellowship',-5,'interview')]
state = {'fail_reads':False, 'fail_writes':False, 'fail_profile':False, 'ai':'chat', 'writes':[], 'fail_notebook':False, 'missing_notebook':False, 'version':0, 'fail_ai':False, 'fail_reply_save':False, 'prompts':[]}
notebooks = {'ai_conversations': [], 'preparation_plans': []}
def jwt():
    enc=lambda data:base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip('=')
    return enc({'alg':'HS256','typ':'JWT'})+'.'+enc({'sub':USER,'exp':int(time.time())+3600,'aud':'authenticated','role':'authenticated'})+'.fake'
user={'id':USER,'aud':'authenticated','role':'authenticated','email':'test@example.com','app_metadata':{},'user_metadata':{},'created_at':iso(-30)}
session={'access_token':jwt(),'refresh_token':'fake-refresh','expires_at':int(time.time())+3600,'expires_in':3600,'token_type':'bearer','user':user}

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1100},timezone_id='Africa/Casablanca',accept_downloads=True)
    context.add_init_script("localStorage.setItem('sb-oppnote-test-auth-token',"+json.dumps(json.dumps(session))+");")
    unexpected=[]
    def route(request):
        req=request.request
        url=urlparse(req.url)
        def respond(body,status=200): request.fulfill(status=status,content_type='application/json',body=json.dumps(body),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'})
        if url.netloc=='oppnote-test.invalid':
            if req.method=='OPTIONS': return respond({})
            if url.path.startswith('/auth/'): return respond(user)
            table=url.path.rsplit('/',1)[-1]
            if table in notebooks:
                if state['missing_notebook']: return respond({'code':'PGRST205','message':'Table missing'},404)
                assert parse_qs(url.query).get('user_id')==['eq.'+USER] or req.method=='POST'
                if req.method=='GET': return respond(notebooks[table])
                if state['fail_notebook']: return respond({'message':'Save failed'},400)
                payload=req.post_data_json
                if state['fail_reply_save'] and table=='ai_conversations' and payload['messages'][-1]['role']=='assistant': return respond({'message':'Save failed'},400)
                assert payload['user_id']==USER
                assert req.method in ['POST','PATCH'], 'Never delete notebooks'
                state['version']+=1
                if req.method=='POST':
                    assert not any(x['id']==payload['id'] for x in notebooks[table])
                    item={**payload,'created_at':iso(0)};notebooks[table].append(item)
                else:
                    query=parse_qs(url.query)
                    item=next(x for x in notebooks[table] if x['id']==query['id'][0].removeprefix('eq.'))
                    if query['updated_at'][0].removeprefix('eq.')!=item['updated_at']: return respond(None)
                    item.update(payload)
                item['updated_at']=(now+timedelta(seconds=state['version'])).isoformat()
                return respond(item)
            if url.path.endswith('/opportunities'):
                if req.method=='GET':
                    if state['fail_reads']: return respond({'message':'Unavailable'},503)
                    return respond(items)
                state['writes'].append((req.method,req.post_data_json))
                if state['fail_writes']: return respond({'message':'Write failed'},503)
                if req.method=='PATCH':
                    id=parse_qs(url.query)['id'][0].removeprefix('eq.')
                    item=next(x for x in items if x['id']==id)
                    item.update(req.post_data_json);item['updated_at']=iso(0)
                    return respond(item)
                if req.method=='POST':
                    item={**req.post_data_json,'id':'created-test','created_at':iso(0),'updated_at':iso(0)}
                    items.append(item); return respond(item)
                raise AssertionError('Deletion must not be invoked in this test')
            if url.path.endswith('/profiles'):
                if state['fail_profile']: return respond({'message':'Profile unavailable'},503)
                return respond({'id':USER,'name':'Notebook Tester','email':'test@example.com','skills':'Research','background':'Student','interests':'Learning'})
            raise AssertionError(req.url)
        if url.netloc=='127.0.0.1:5173':
            if url.path=='/api/ai':
                state['prompts'].append(req.post_data_json['prompt'])
                assert len(req.post_data_json['prompt']) <= 40000
                if state['fail_ai']: return respond({'error':'AI temporarily unavailable'},502)
                if state['ai']=='invalid': return respond({'text':'{"summary": "missing fields"}'})
                if state['ai']=='extract': return respond({'text':json.dumps({'title':'Test Draft Fellowship','url':'https://example.com/draft','deadline':'2027-02-12','funding_type':'fully_funded','location':'Remote','category':'fellowship','travel_accommodation':None,'requirements':['CV','Letter'],'scam_score':20,'red_flags':[],'summary':'A research opportunity from pasted text.'})})
                return respond({'text':'**Your next step**\n<img src=x onerror="window.__xss=true">\nPrepare your CV.'})
            return request.continue_()
        unexpected.append(req.url);request.abort()
    context.route('**/*',route)
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE);page.wait_for_load_state('networkidle')
    expect(page.get_by_role('heading',name='Creative Futures Fellowship').first).to_be_visible()
    section=page.locator('section').filter(has=page.get_by_role('heading',name='Coming up',exact=True))
    expect(section.get_by_text('Community Leadership Program')).to_have_count(0)
    expect(section.get_by_text('Open Science Internship')).to_have_count(0)
    expect(page.get_by_role('heading',name='1 deadline has passed')).to_be_visible()
    page.screenshot(path='/tmp/oppnote-desktop.png',full_page=True)
    page.get_by_role('link',name='Opportunities',exact=True).click();page.wait_for_load_state('networkidle')
    with page.expect_download() as dl: page.get_by_role('button',name='Export backup').click()
    exported=json.loads(Path(dl.value.path()).read_text())
    assert len(exported['opportunities'])==5
    page.get_by_label('Search',exact=True).fill('Creative Futures')
    expect(page.locator('.opportunity-row')).to_have_count(1)
    page.locator('.opportunity-row').click()
    expect(page.get_by_role('heading',name='Creative Futures Fellowship').first).to_be_visible()
    page.get_by_role('link',name='Edit details').click()
    deadline=page.get_by_label('Application deadline',exact=True)
    before=next(x for x in items if x['id']=='next')['deadline']
    expect(deadline).to_have_value(re.compile(r'^\d{4}-\d{2}-\d{2}T'))
    page.get_by_role('button',name='Save changes').click()
    page.wait_for_url('**/opportunities/next')
    after=next(x for x in items if x['id']=='next')['deadline']
    assert datetime.fromisoformat(before.replace('Z','+00:00'))==datetime.fromisoformat(after.replace('Z','+00:00'))
    state['fail_writes']=True
    page.get_by_label('Application status').select_option('applied')
    expect(page.get_by_role('alert')).to_contain_text('Could not save')
    assert next(x for x in items if x['id']=='next')['status']=='need_to_apply'
    state['fail_writes']=False
    page.get_by_label('Application status').select_option('applied')
    expect(page.get_by_role('status')).to_contain_text('Status saved')
    assert next(x for x in items if x['id']=='next')['applied_date']
    page.get_by_role('link',name='AI assistant',exact=True).click()
    page.get_by_label('Message to your assistant').fill('Plan my day')
    page.get_by_role('button',name='Send message').click()
    expect(page.locator('.chat-message.assistant')).to_contain_text('<img src=x')
    assert page.locator('.chat-message img').count()==0
    assert page.evaluate('window.__xss') is None
    # Chat survives a reload; a separate conversation does not mix messages.
    page.reload();page.wait_for_load_state('networkidle')
    page.get_by_role('button',name=re.compile('Plan my day.*messages')).click()
    expect(page.locator('.chat-message.user')).to_contain_text('Plan my day')
    expect(page.locator('.chat-message.assistant')).to_have_count(1)
    page.get_by_role('button',name='+ New chat',exact=True).click()
    expect(page.locator('.chat-message')).to_have_count(0)
    state['fail_reply_save']=True
    page.get_by_label('Message to your assistant').fill('Interview practice')
    page.get_by_role('button',name='Send message').click()
    expect(page.get_by_role('alert')).to_contain_text('Could not save')
    page.reload();page.wait_for_load_state('networkidle')
    expect(page.get_by_role('alert')).to_contain_text('Recovered an unsaved conversation')
    expect(page.locator('.chat-message.assistant')).to_have_count(1)
    state['fail_reply_save']=False
    page.get_by_role('button',name='Retry saving conversation').click()
    expect(page.get_by_text('Conversation saved to your account.',exact=True)).to_be_visible()
    assert len(notebooks['ai_conversations'])==2
    assert len(notebooks['ai_conversations'][1]['messages'])==2
    state['fail_ai']=True
    page.get_by_label('Message to your assistant').fill('Ask me a question')
    page.get_by_role('button',name='Send message').click()
    expect(page.get_by_role('alert')).to_contain_text('AI temporarily unavailable')
    state['fail_ai']=False
    page.get_by_role('button',name='Get a reply to the last message').click()
    expect(page.locator('.chat-message.assistant')).to_have_count(2)
    assert len(notebooks['ai_conversations'][1]['messages'])==4
    assert 'User: Interview practice' in state['prompts'][-1]
    page.screenshot(path='/tmp/oppnote-chat-desktop.png',full_page=True)
    # Preparation: templates, changes, safe links, persistence and coaching.
    page.get_by_role('link',name='Preparation',exact=True).click()
    page.get_by_role('button',name='+ New plan',exact=True).click()
    page.get_by_label('Plan title',exact=True).fill('Cloud certificate')
    page.get_by_label('Plan title',exact=True).fill('   ')
    page.get_by_role('button',name='Save plan',exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('Give your plan')
    page.get_by_label('Plan title',exact=True).fill('Cloud certificate')
    page.get_by_label('Provider or company').fill('Example Academy')
    page.get_by_label('Target date').fill('2027-02-01')
    page.get_by_role('button',name='Use starter checklist').click()
    page.get_by_label('Complete step 1',exact=True).check()
    page.get_by_label('Resources',exact=True).fill('https://example.com/study\njavascript:alert(1)')
    page.get_by_label('Notes & reflections').fill('Review networking fundamentals.')
    state['fail_notebook']=True
    page.get_by_role('button',name='Save plan',exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('Could not save')
    page.reload();page.wait_for_load_state('networkidle')
    expect(page.get_by_label('Plan title',exact=True)).to_have_value('Cloud certificate')
    expect(page.get_by_label('Complete step 1',exact=True)).to_be_checked()
    state['fail_notebook']=False
    page.get_by_role('button',name='Save plan',exact=True).click()
    expect(page.get_by_role('status')).to_contain_text('Plan saved')
    assert len(notebooks['preparation_plans'])==1
    assert notebooks['preparation_plans'][0]['target_date']=='2027-02-01'
    assert page.locator('a[href^="javascript:"]').count()==0
    page.screenshot(path='/tmp/oppnote-preparation-desktop.png',full_page=True)
    page.get_by_role('link',name='Prepare with AI').click()
    expect(page.get_by_label('Message to your assistant')).to_have_value(re.compile('Help me prepare.*Cloud certificate', re.S))
    page.get_by_role('link',name='Preparation',exact=True).click()
    page.get_by_role('button',name=re.compile('Certificate.*Cloud certificate')).click()
    page.get_by_label('Complete step 2',exact=True).check()
    # A concurrent change is rejected, retaining the draft for export.
    notebooks['preparation_plans'][0]['updated_at']=iso(1)
    page.get_by_role('button',name='Save plan',exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('changed in another tab')
    with page.expect_download() as dl: page.get_by_role('button',name='Export draft',exact=True).click()
    assert json.loads(Path(dl.value.path()).read_text())['unsaved_draft']['tasks'][1]['done']
    page.once('dialog',lambda dialog:dialog.accept())
    page.get_by_role('button',name=re.compile('Certificate.*Cloud certificate')).click()
    # Reload now fetches the updated version instead of overwriting it.
    page.reload();page.wait_for_load_state('networkidle')
    page.get_by_role('button',name=re.compile('Certificate.*Cloud certificate')).click()
    page.get_by_label('Progress status').select_option('archived')
    page.get_by_role('button',name='Save plan',exact=True).click()
    expect(page.get_by_role('status')).to_contain_text('Plan saved')
    page.get_by_label('Show').select_option('archived')
    expect(page.get_by_role('button',name=re.compile('Certificate.*Cloud certificate'))).to_be_visible()
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path='/tmp/oppnote-preparation-mobile.png',full_page=True)
    page.set_viewport_size({'width':1440,'height':1100})
    state['missing_notebook']=True
    page.reload();page.wait_for_load_state('networkidle')
    expect(page.get_by_role('alert')).to_contain_text('migration 002')
    page.get_by_role('link',name='AI assistant',exact=True).click()
    expect(page.get_by_role('complementary',name='Conversation history')).to_be_visible()
    expect(page.get_by_role('alert')).to_contain_text('migration 002')
    state['missing_notebook']=False
    page.get_by_role('button',name='Retry history').click()
    expect(page.get_by_role('alert')).to_have_count(0)
    page.get_by_role('button',name='Cover Letter',exact=False).click()
    page.get_by_role('button',name='Edit Profile').click()
    state['fail_profile']=True
    page.get_by_role('button',name='Save profile',exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('Could not save your profile')
    expect(page.get_by_role('button',name='Save profile',exact=True)).to_be_visible()
    state['fail_profile']=False
    page.get_by_role('button',name='Capture a draft').click()
    page.get_by_label('Official opportunity description').fill('This is an official research fellowship description requiring a CV and motivation letter.')
    page.get_by_label('Source website').fill('https://example.com/draft')
    state['ai']='invalid';page.get_by_role('button',name='Analyze',exact=True).click()
    expect(page.get_by_text('The AI returned incomplete analysis. Please try again.')).to_be_visible()
    state['ai']='extract';page.get_by_role('button',name='Analyze',exact=True).click()
    page.get_by_role('button',name='Review & save opportunity').click()
    expect(page.get_by_label('Opportunity title',exact=False)).to_have_value('Test Draft Fellowship')
    expect(page.get_by_label('Application deadline',exact=True)).to_have_value('')
    page.get_by_role('button',name='Save opportunity').click()
    page.wait_for_url('**/opportunities/created-test')
    assert any(method=='POST' and payload['title']=='Test Draft Fellowship' for method,payload in state['writes'])
    page.goto(BASE);page.wait_for_load_state('networkidle')
    page.set_viewport_size({'width':390,'height':844})
    expect(page.get_by_role('link',name='AI assistant',exact=True)).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path='/tmp/oppnote-mobile.png',full_page=True)
    page.get_by_role('link',name='Opportunities',exact=True).click();page.wait_for_load_state('networkidle')
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.get_by_role('link',name='AI assistant',exact=True).click();page.wait_for_load_state('networkidle')
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    state['fail_reads']=True
    page.goto(BASE);page.wait_for_load_state('networkidle')
    expect(page.get_by_role('alert')).to_contain_text('Could not load your opportunities', timeout=25000)
    expect(page.get_by_role('heading',name='A little breathing room.')).to_have_count(0)
    assert not unexpected,unexpected
    assert not errors,errors
    browser.close()
print('PASS: persisted chat, retry/recovery, isolated conversations, preparation/templates/export/archive/coaching, stale updates, missing migration,  dashboard, export, search, timezone, failed writes, status date, XSS, profile errors, AI validation/drafts, mobile, failed reads. No production traffic.')
