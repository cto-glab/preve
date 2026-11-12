"""Read-only layout smoke for an already paired Pleos emulator; never logs account data."""
import argparse, json, os, re, subprocess, time
from pathlib import Path
import xml.etree.ElementTree as ET
parser=argparse.ArgumentParser();parser.add_argument('--serial',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];out=root/'tmp'/'pleos-live-smoke';out.mkdir(parents=True,exist_ok=True)
result_file=out/'result.json'
result_file.unlink(missing_ok=True)
adb=Path(os.environ['ANDROID_HOME'])/'platform-tools'/'adb.exe';package='com.jb8.preve.pleos'
def run(*parts):return subprocess.run([str(adb),'-s',args.serial,*parts],check=True,capture_output=True,text=True,encoding='utf-8',timeout=60).stdout
def tree():
 run('shell','uiautomator','dump','/sdcard/preve-live-smoke.xml');run('pull','/sdcard/preve-live-smoke.xml',str(out/'ui.xml'));return ET.parse(out/'ui.xml').getroot()
def capture(name):
 run('shell','screencap','-p','/sdcard/preve-live-smoke.png');run('pull','/sdcard/preve-live-smoke.png',str(out/(name+'.png')))
run('shell','am','start','-a','android.intent.action.VIEW','-d','preve-pleos://',package)
for _ in range(10):
 ui=tree()
 if any(n.get('text')=='휴대폰 계정과 연결됨' for n in ui.iter('node')):break
 time.sleep(1)
else:raise AssertionError('An existing paired session is required')
stacks=run('shell','am','stack','list');match=re.search(r'taskId=(\d+): '+re.escape(package)+r'/[^\n]+bounds=\[(\d+),(\d+)\]\[(\d+),(\d+)\]',stacks)
assert match,'App task bounds unavailable';task,left,top,right,bottom=map(int,match.groups());checks=[]
try:
 ui=tree();rows={};aligned=0
 for label in ['미팅 준비하기','이전 일정','다음 일정','캘린더','일정 새로고침','연결 관리']:
  button=next((n for n in ui.iter('node') if n.get('content-desc')==label and n.get('clickable')=='true'),None)
  text=next((n for n in ui.iter('node') if ' '.join(n.get('text','').split())==label),None)
  if button is None:continue
  assert text is not None,'Tile label missing'
  bx,by,br,bb=map(int,re.findall(r'\d+',button.get('bounds')));tx,ty,tr,tb=map(int,re.findall(r'\d+',text.get('bounds')))
  assert abs((br-bx)-(bb-by))<=2,'Dashboard tile is not square'
  assert abs((tx+tr)-(bx+br))<=4,'Tile label not horizontally centered'
  rows.setdefault(by,[]).append((ty+tb)/2);aligned+=1
 assert aligned>=3,'Not enough dashboard actions to verify alignment'
 assert all(max(values)-min(values)<=2 for values in rows.values()),'Tile labels do not share a vertical center'
 capture('aligned-dashboard')
 for width,height in [(420,720),(900,720),(640,360),(420,360)]:
  run('shell','am','task','resize',str(task),str(left),str(top),str(left+width),str(top+height));time.sleep(1)
  found=False
  for _ in range(6):
   ui=tree()
   visible=False
   for node in ui.iter('node'):
    if ' '.join(node.get('text','').split())!='연결 관리':continue
    bounds=list(map(int,re.findall(r'\d+',node.get('bounds',''))))
    if len(bounds)==4 and bounds[2]>bounds[0] and bounds[3]>bounds[1] and bounds[0]>=left and bounds[1]>=top and bounds[2]<=left+width and bounds[3]<=top+height:visible=True
   if visible:found=True;break
   run('shell','input','swipe',str(left+width//2),str(top+height-35),str(left+width//2),str(top+40),'300')
  assert found,'Last vehicle action unreachable after resize'
  label_rows={}
  for name in ['미팅 준비하기','이전 일정','다음 일정','캘린더','일정 새로고침','연결 관리']:
   button=next((n for n in ui.iter('node') if n.get('content-desc')==name and n.get('clickable')=='true'),None)
   text=next((n for n in ui.iter('node') if ' '.join(n.get('text','').split())==name),None)
   if button is None or text is None:continue
   bx,by,br,bb=map(int,re.findall(r'\d+',button.get('bounds')));tx,ty,tr,tb=map(int,re.findall(r'\d+',text.get('bounds')))
   if tr<=tx or tb<=ty or tx<left or ty<top or tr>left+width or tb>top+height:continue
   assert abs((tx+tr)-(bx+br))<=4,'Resized tile label is not centered'
   label_rows.setdefault(by,[]).append((ty+tb)/2)
  assert all(max(values)-min(values)<=2 for values in label_rows.values()),'Resized row label centers differ'
  capture(str(width)+'x'+str(height));checks.append({'width':width,'height':height,'lastActionReachable':True,'labelVisible':True})
finally:
 run('shell','am','task','resize',str(task),str(left),str(top),str(right),str(bottom))
 for _ in range(3):run('shell','input','swipe',str((left+right)//2),str(top+80),str((left+right)//2),str(bottom-80),'200')
(out/'result.json').write_text(json.dumps({'alignedLabels':True,'checks':checks,'originalBoundsRestored':True},indent=2),encoding='utf-8');print('Paired Pleos layout smoke passed: narrow, short-wide, three-way size; actions reachable; original bounds restored.')
