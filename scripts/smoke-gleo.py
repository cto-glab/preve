"""ADB-only Gleo action smoke. Callback logs contain action/status only, never account content."""
import argparse,json,os,pathlib,re,shlex,subprocess,time
parser=argparse.ArgumentParser();parser.add_argument('--serial',default='emulator-5554');parser.add_argument('--user',default='10');parser.add_argument('--meeting-id');args=parser.parse_args()
sdk=os.environ.get('ANDROID_HOME',r'C:\Users\jonghyeon\AppData\Local\Android\Sdk');adb=str(pathlib.Path(sdk)/'platform-tools'/'adb.exe')
def run(*items):return subprocess.run([adb,'-s',args.serial,*items],capture_output=True,text=True,encoding='utf-8',check=True,timeout=60).stdout
def logs():return run('logcat','-d','-v','epoch','-s','PreveGleo:I')
def invoke(action,params,expected,cold=False,direct=False):
 before=set(logs().splitlines())
 if cold:run('shell','am','force-stop','--user',args.user,'com.jb8.preve.pleos')
 started=time.monotonic();extras=[part for key,value in params.items() for part in ['--es',key,value]] if direct else ['--es','ACTION_PARAM',json.dumps(params,separators=(',',':'))];command=shlex.join(['am','start','--user',args.user,'-p','com.jb8.preve.pleos','-a',action]+extras);result=run('shell',"date '+%s.%N'; "+command);sent=float(result.splitlines()[0])
 assert 'Error' not in result,'Action launch failed'
 while time.monotonic()-started<20:
  fresh=[line for line in logs().splitlines() if line not in before and 'callback_sent function='+action+' status=' in line]
  if fresh:
   assert 'status='+expected in fresh[-1],'Unexpected callback status'
   stamp=re.match(r'\s*(\d+\.\d+)',fresh[-1]);assert stamp is not None;elapsed=round(float(stamp.group(1))-sent,3);print(action+': '+expected+' ('+str(elapsed)+'s device dispatch-to-callback; '+('cold' if cold else 'warm')+')',flush=True);assert 0<=elapsed<7,'Callback exceeded the documented 7 second deadline';return elapsed
  time.sleep(.3)
 raise AssertionError('No native callback observed')
try:
 invoke('GET_PREVE_MEETINGS',{'period':'next'},'success',True)
 invoke('GET_PREVE_MEETINGS',{'period':'today'},'success')
 invoke('GET_PREVE_MEETINGS',{'period':'today'},'success',direct=True)
 invoke('GET_PREVE_MEETINGS',{'period':'invalid'},'asking',direct=True)
 invoke('GET_PREVE_BRIEFING',{'userId':'injected'},'asking',direct=True)
 invoke('GET_PREVE_MEETINGS',json.dumps({'period':'next'}),'success')
 invoke('GET_PREVE_BRIEFING',{'userId':'injected'},'asking')
 invoke('GET_PREVE_BRIEFING',{'meetingId':'not-owned'},'fail')
 if args.meeting_id:
  assert re.fullmatch(r'[A-Za-z0-9_-]{1,64}',args.meeting_id)
  invoke('GET_PREVE_BRIEFING',{'meetingId':args.meeting_id},'success')
  invoke('GET_PREVE_EVIDENCE',{},'success')
 print('Native Intent/callback smoke passed. This does not confirm Gleo speech recognition or schema approval.')
except Exception:
 print('Gleo native smoke failed. No parameters, account contents or callback payloads are printed.');raise SystemExit(1)
