"""Smoke paired vehicle calendar and square actions without logging account content."""
import argparse,os,subprocess,re,time,json
from pathlib import Path
import xml.etree.ElementTree as E
p=argparse.ArgumentParser();p.add_argument('--serial',required=True);a=p.parse_args();root=Path(__file__).resolve().parents[1];out=root/'tmp'/'pleos-calendar-smoke';out.mkdir(parents=True,exist_ok=True);(out/'result.json').unlink(missing_ok=True);adb=Path(os.environ['ANDROID_HOME'])/'platform-tools'/'adb.exe'
def run(*args):return subprocess.run([str(adb),'-s',a.serial,*args],check=True,capture_output=True,text=True,encoding='utf-8',timeout=60).stdout
def tree():
 run('shell','uiautomator','dump','/sdcard/preve-calendar-smoke.xml');run('pull','/sdcard/preve-calendar-smoke.xml',str(out/'ui.xml'));return E.parse(out/'ui.xml').getroot()
def label(node):return node.get('content-desc') or node.get('text','')
def click(node):
 l,t,r,b=map(int,re.findall(r'\d+',node.get('bounds')));assert r>l and b>t;run('shell','input','tap',str((l+r)//2),str((t+b)//2));time.sleep(1)
def find(text):
 for _ in range(4):
  node=next((n for n in tree().iter('node') if text in [n.get('text'),n.get('content-desc')]),None)
  if node is not None:return node
  time.sleep(1)
 return None
def capture(name):
 run('shell','screencap','-p','/sdcard/preve-calendar-smoke.png');run('pull','/sdcard/preve-calendar-smoke.png',str(out/(name+'.png')))
run('shell','am','force-stop','com.jb8.preve.pleos');run('shell','am','start','-n','com.jb8.preve.pleos/.MainActivity');time.sleep(2)
calendar=None
for _ in range(10):
 ui=tree();calendar=next((n for n in ui.iter('node') if label(n)=='캘린더'),None)
 if calendar is not None:break
 time.sleep(1)
assert calendar is not None,'Calendar dashboard tile missing after startup'
l,t,r,b=map(int,re.findall(r'\d+',calendar.get('bounds')));assert abs((r-l)-(b-t))<=2,'Dashboard tile is not square';capture('dashboard');click(calendar)
assert find('오늘') is not None,'Calendar did not open';dated=None
for _ in range(4):
 ui=tree();dated=next((n for n in ui.iter('node') if re.fullmatch(r'\d{4}-\d{2}-\d{2} 일정 [1-9]\d*개',label(n))),None)
 if dated is not None:break
 next_month=next(n for n in ui.iter('node') if label(n)=='다음 달');click(next_month)
assert dated is not None,'No dated meeting in the next four loaded months';click(dated);capture('calendar')
stacks=run('shell','am','stack','list');m=re.search(r'taskId=\d+: com\.jb8\.preve\.pleos/[^\n]+bounds=\[(\d+),(\d+)\]\[(\d+),(\d+)\]',stacks);assert m;left,top,right,bottom=map(int,m.groups())
for _ in range(8):
 button=find('이 일정 준비하기')
 if button is not None:break
 run('shell','input','swipe',str((left+right)//2),str(bottom-70),str((left+right)//2),str(top+80),'300')
else:raise AssertionError('Selected day meeting cannot be opened')
click(button);assert find('결과 새로고침') is not None,'Meeting briefing did not open';capture('selected-meeting');exit_button=find('내 미팅으로');assert exit_button is not None;click(exit_button)
(out/'result.json').write_text(json.dumps({'squareDashboard':True,'calendarNavigation':True,'datedMeetingOpened':True,'returnedHome':True},indent=2));print('Paired calendar smoke passed: square dashboard, month navigation, selected-day meeting briefing, return home. Account content omitted.')
