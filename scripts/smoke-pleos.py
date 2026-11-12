"""Run the installed Pleos app's demo smoke flow. Uses only Android SDK adb."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument('--serial', required=True)
parser.add_argument('--resize-test', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
output = root / 'tmp' / 'pleos-smoke'
output.mkdir(parents=True, exist_ok=True)
adb = Path(os.environ['ANDROID_HOME']) / 'platform-tools' / 'adb.exe'
package = 'com.jb8.preve.pleos'
checks = []

def run(*parts):
    return subprocess.run([str(adb), '-s', args.serial, *parts], check=True, capture_output=True, text=True, encoding='utf-8', timeout=30).stdout

def tree():
    run('shell', 'uiautomator', 'dump', '/sdcard/preve-smoke.xml')
    run('pull', '/sdcard/preve-smoke.xml', str(output / 'ui.xml'))
    return ET.parse(output / 'ui.xml').getroot()

def find(label, attempts=5):
    for _ in range(attempts):
        for node in tree().iter('node'):
            if label in [node.get('text'), node.get('content-desc')]:
                return node
        time.sleep(1)
    raise AssertionError(f'UI element missing: {label}')

def click(label):
    node = find(label)
    left, top, right, bottom = map(int, re.findall(r'\d+', node.get('bounds')))
    if right <= left or bottom <= top:
        raise AssertionError(f'Invalid element bounds: {label}')
    run('shell', 'input', 'tap', str((left + right) // 2), str((top + bottom) // 2))
    time.sleep(0.5)

def capture(name):
    run('shell', 'screencap', '-p', '/sdcard/preve-smoke.png')
    run('pull', '/sdcard/preve-smoke.png', str(output / f'{name}.png'))

def expect(label):
    find(label)
    checks.append(label)
    print(f'PASS {label}', flush=True)

if 'android.hardware.type.automotive' not in run('shell', 'pm', 'list', 'features'):
    raise AssertionError('Target is not an automotive emulator')
run('shell', 'am', 'force-stop', package)
run('shell', 'am', 'start', '-n', package + '/.MainActivity')
expect('휴대폰과 연결해 미팅을 준비하세요')
expect('샘플 일정 체험하기')
for node in tree().iter('node'):
    if node.get('package') == package and node.get('text') in ['거래처', 'Google Calendar', '캘린더를 연결해 주세요']:
        raise AssertionError('Mobile management screen leaked into Pleos')
capture('vehicle-entry')
click('샘플 일정 체험하기')
expect('서비스 도입 제안 미팅')
capture('schedule-demo')
click('미팅 준비하기')
expect('요청서의 납기는 4주, 제안서는 6주입니다. 납기 기준을 먼저 확인하세요.')
capture('briefing')
click('장소 확인')
expect('가상 장소입니다. 실제 길안내는 제공하지 않습니다.')
capture('destination')
click('종료')
expect('체험 종료')
click('체험 종료')
expect('샘플 일정 체험하기')
if args.resize_test:
    stacks = run('shell', 'am', 'stack', 'list')
    match = re.search(r'taskId=(\d+): ' + re.escape(package) + r'/[^\n]+bounds=\[(\d+),(\d+)\]\[(\d+),(\d+)\]', stacks)
    if not match:
        raise AssertionError('App task bounds not found')
    task, left, top, right, bottom = map(int, match.groups())
    def resize(width, height):
        run('shell', 'am', 'task', 'resize', str(task), str(left), str(top), str(left + width), str(top + height))
        time.sleep(1)
    click('샘플 일정 체험하기')
    click('미팅 준비하기')
    try:
        resize(420, 720)
        expect('요청서의 납기는 4주, 제안서는 6주입니다. 납기 기준을 먼저 확인하세요.')
        capture('narrow')
        resize(640, 360)
        expect('요청서의 납기는 4주입니다.')
        click('다음')
        expect('제안서는 6주입니다. 납기 기준을 확인하세요.')
        capture('short-wide')
        resize(right - left, bottom - top)
        expect('자료 확인')
        resize(420, 360)
        expect('제안서는 6주입니다. 납기 기준을 확인하세요.')
        capture('short-narrow')
        click('종료')
        expect('체험 종료')
    finally:
        run('shell', 'am', 'task', 'resize', str(task), str(left), str(top), str(right), str(bottom))

(output / 'result.json').write_text(json.dumps({'serial': args.serial, 'package': package, 'checks': checks}, ensure_ascii=False, indent=2), encoding='utf-8')
print('Smoke complete', flush=True)
