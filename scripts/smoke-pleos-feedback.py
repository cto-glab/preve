"""Verify pinned calendar and consistent vehicle controls with existing account data."""
import argparse,calendar,json,os,re,subprocess,time
from pathlib import Path
import xml.etree.ElementTree as E
p=argparse.ArgumentParser();p.add_argument('--serial',required=True);a=p.parse_args();root=Path(__file__).resolve().parents[1];out=root/'tmp'/'pleos-feedback-smoke';out.mkdir(parents=True,exist_ok=True);(out/'result.json').unlink(missing_ok=True);adb=Path(os.environ['ANDROID_HOME'])/'platform-tools'/'adb.exe';package='com.jb8.preve.pleos'
def run(*args):return subprocess.run([str(adb),'-s',a.serial,*args],check=True,capture_output=True,text=True,encoding='utf-8',timeout=60).stdout
def tree():
 for attempt in range(3):
  try:
   run('shell','uiautomator','dump','/sdcard/preve-feedback.xml');run('pull','/sdcard/preve-feedback.xml',str(out/'ui.xml'));return E.parse(out/'ui.xml').getroot()
  except subprocess.CalledProcessError as error:
   if error.returncode!=137 or attempt==2:raise
   time.sleep(2)
def label(n):return n.get('content-desc') or n.get('text','')
def bounds(n):return list(map(int,re.findall(r'\d+',n.get('bounds',''))))
def find(text,attempts=5):
 for _ in range(attempts):
  n=next((n for n in tree().iter('node') if label(n)==text),None)
  if n is not None:return n
  time.sleep(1)
 raise AssertionError('Expected control unavailable: '+text)
def click(n):
 l,t,r,b=bounds(n);assert r>l and b>t,'Control has no visible area';run('shell','input','tap',str((l+r)//2),str((t+b)//2));time.sleep(1)
def capture(name):
 run('shell','screencap','-p','/sdcard/preve-feedback.png');run('pull','/sdcard/preve-feedback.png',str(out/(name+'.png')))
def home(check=True):
 run('shell','am','start','-a','android.intent.action.VIEW','-d','preve-pleos://',package)
 if check:find('연결 관리')
def inside(n,box):
 l,t,r,b=bounds(n);return r>l and b>t and l>=box[0] and t>=box[1] and r<=box[2] and b<=box[3]
def verify_calendar(box):
 ui=tree();assert not any(n.get('package')==package and n.get('scrollable')=='true' for n in ui.iter('node')),'Calendar still scrolls'
 for name in ['일정 새로고침','내 미팅으로']:
  node=next(n for n in ui.iter('node') if label(n)==name and n.get('clickable')=='true');assert inside(node,box),'Pinned control clipped'
  text=next(n for n in ui.iter('node') if ' '.join(n.get('text','').split())==name);assert inside(text,box),'Pinned label clipped'
 days=[n for n in ui.iter('node') if re.fullmatch(r'\d{4}-\d{2}-\d{2} 일정 \d+개',label(n))];assert len(days)>=28,'Month days missing';assert all(inside(n,box) for n in days),'Month grid clipped'
 assert not any(n.get('text') in ['이전 달','다음 달'] for n in ui.iter('node')),'Month navigation is not icon-only'
 return ui
home();find('이전 일정');find('다음 일정');capture('dashboard')
stacks=run('shell','am','stack','list');m=re.search(r'taskId=(\d+): '+re.escape(package)+r'/[^\n]+bounds=\[(\d+),(\d+)\]\[(\d+),(\d+)\]',stacks);assert m;task,left,top,right,bottom=map(int,m.groups());checks=[]
try:
 click(find('연결 관리'));ui=tree();controls=[next(n for n in ui.iter('node') if label(n)==name and n.get('clickable')=='true') for name in ['차량 연결 해제','미팅 화면으로 돌아가기']];one,two=map(bounds,controls);assert abs(one[1]-two[1])<=2 and one[2]<=two[0],'Connection controls are not horizontal';assert all(abs((b[2]-b[0])-(b[3]-b[1]))<=2 for b in [one,two]),'Connection cards are not square';capture('connection');click(controls[1])
 for width,height in [(right-left,bottom-top),(420,720),(900,720),(640,360),(420,360)]:
  home(False);run('shell','am','task','resize',str(task),str(left),str(top),str(left+width),str(top+height));time.sleep(1)
  # Launch calendar directly; the small dashboard may itself need scrolling.
  run('shell','am','start','-a','android.intent.action.VIEW','-d','preve-pleos://vehicle/calendar',package);find('내 미팅으로');box=[left,top,left+width,top+height];ui=verify_calendar(box)
  dated=None
  for _ in range(4):
   ui=tree();dated=next((n for n in ui.iter('node') if re.fullmatch(r'\d{4}-\d{2}-\d{2} 일정 [1-9]\d*개',label(n))),None)
   if dated is not None:break
   click(find('다음 달'))
  assert dated is not None,'No loaded dated meetings found';click(dated);verify_calendar(box);assert inside(find('이 일정 준비하기'),box),'Selected meeting action clipped';capture(str(width)+'x'+str(height));checks.append({'width':width,'height':height,'noScroll':True,'allMonthDaysVisible':True,'footerAndMeetingActionVisible':True})
  if width==420 and height==360:
   # A six-week month must also fit with pinned actions.
   for _ in range(12):
    ui=tree();month=next(n.get('text') for n in ui.iter('node') if re.fullmatch(r'\d{4}년 \d{1,2}월',n.get('text','')));year,index=map(int,re.findall(r'\d+',month));first,count=calendar.monthrange(year,index)
    if (first+1)%7+count>35:break
    click(find('다음 달'))
   else:raise AssertionError('Six-week month not reached')
   verify_calendar(box);capture('six-week-month')
finally:
 run('shell','am','task','resize',str(task),str(left),str(top),str(right),str(bottom));home()
(out/'result.json').write_text(json.dumps({'connectionHorizontal':True,'sixWeekMonthFits':True,'checks':checks,'originalBoundsRestored':True},indent=2));print('Vehicle feedback smoke passed: horizontal square connection cards; calendar without scrolling, all days, pinned actions and selected meeting action at five sizes; six-week month fits.')
