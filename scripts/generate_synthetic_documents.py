#!/usr/bin/env python3
"""Render fixed synthetic inputs; verify visible text before indexing artifacts.
Dependencies: reportlab, Pillow; system tools: pdftoppm, pdftotext.
"""
import hashlib
import json
import sqlite3
import shutil
import subprocess
import unicodedata
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
VERSION = 'synthetic-documents-1'
MARK = 'SINTÉTICO — SIN VALIDEZ OFICIAL'

def norm(text):
    return ' '.join(unicodedata.normalize('NFC', text).split())

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    cases = json.loads((ROOT/'src/data/documents/cases.json').read_text())
    oracles = {o['caseId']: o for o in json.loads((ROOT/'tests/documents/oracles.json').read_text())}
    api = json.loads((ROOT/'src/data/documents/api-check.json').read_text())
    appearance = api.get('documentAppearance', {'accent': 'navy', 'layout': 'cards'})
    if appearance.get('accent') not in ['navy','teal','plum'] or appearance.get('layout') not in ['cards','ruled']:
        raise ValueError('Unapproved appearance configuration')
    color = {'navy':'#173458','teal':'#12635D','plum':'#633458'}[appearance['accent']]
    out = ROOT/'src/data/documents/artifacts'
    deliverables = ROOT/'output/pdf/synthetic-documents'
    deliverables.mkdir(parents=True, exist_ok=True)
    out.mkdir(parents=True, exist_ok=True)
    preview = ROOT/'tmp/pdfs'
    preview.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont('Demo', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
    pdfmetrics.registerFont(TTFont('DemoBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
    conn = sqlite3.connect(ROOT/'rsi/history.sqlite')
    conn.execute('''CREATE TABLE IF NOT EXISTS synthetic_document_artifacts (
      sha256 TEXT PRIMARY KEY, case_id TEXT NOT NULL, suite TEXT NOT NULL,
      document_id TEXT, artifact_path TEXT NOT NULL, format TEXT NOT NULL,
      page_count INTEGER NOT NULL, generator_version TEXT NOT NULL,
      generation_mode TEXT NOT NULL, appearance_model TEXT,
      ground_truth_json TEXT NOT NULL, checked_at TEXT NOT NULL)''')
    manifest=[]
    for case in cases:
        cid=case['caseId']; oracle=oracles[cid]
        registered=conn.execute('SELECT expected_behavior FROM test_cases WHERE case_id=?',(cid,)).fetchone()
        if not registered or json.loads(registered[0]) != oracle:
            raise ValueError('Register ground truth first: '+cid)
        pdf=out/(cid+'.pdf')
        if pdf.exists(): raise FileExistsError('Use a new output version instead of overwriting '+str(pdf))
        c=canvas.Canvas(str(pdf), pagesize=A4, invariant=1)
        c.setTitle('SRI Finance | expediente sintético '+cid)
        w,h=A4
        for page,doc in enumerate(case['documents'],1):
            c.setFillColorRGB(0.965,0.974,0.985);c.rect(0,0,w,h,fill=1,stroke=0)
            c.setFillColor(color);c.rect(0,h-106,w,106,fill=1,stroke=0)
            c.setFont('DemoBold',19);c.setFillColorRGB(1,1,1);c.drawString(38,h-44,'SRI Finance / Laboratorio documental')
            c.setFont('Demo',10);c.drawString(38,h-72,'Expediente ficticio para desarrollo y evaluación')
            c.setFillColorRGB(1,.93,.74);c.roundRect(32,h-156,w-64,32,6,fill=1,stroke=0)
            c.setFillColorRGB(.37,.25,.06);c.setFont('DemoBold',12);c.drawCentredString(w/2,h-145,MARK)
            c.setFillColor(color);c.setFont('DemoBold',20);c.drawString(38,h-202,doc['title'])
            c.setFont('Demo',9);c.setFillColorRGB(.35,.4,.47)
            c.drawString(38,h-226,cid+'  /  '+doc['kind'])
            c.drawString(38,h-244,'Documento: '+doc['id'])
            y=h-286
            for label,value in doc['fields'].items():
                if appearance['layout']=='cards':
                    c.setFillColorRGB(1,1,1);c.roundRect(32,y-68,w-64,66,6,fill=1,stroke=0)
                else:
                    c.setStrokeColorRGB(.75,.79,.84);c.line(38,y-66,w-38,y-66)
                c.setFont('Demo',10);c.setFillColorRGB(.38,.43,.5);c.drawString(46,y-22,label.upper())
                c.setFont('DemoBold',14);c.setFillColorRGB(.1,.15,.23)
                visible='(sin dato)' if value is None else value
                if pdfmetrics.stringWidth(visible,'DemoBold',14)>w-92: raise ValueError('Field overflows page')
                c.drawString(46,y-47,visible);y-=82
            c.setFont('Demo',9);c.setFillColorRGB(.35,.4,.47)
            for i,line in enumerate(['Datos y nombres inventados. Identificadores DEMO sin validez.',
                                     'Diseño original: no reproduce formatos ni logos oficiales.',
                                     'No acredita identidad, ingresos, domicilio ni elegibilidad crediticia.']):
                c.drawString(38,112-i*16,line)
            c.setFont('DemoBold',9);c.drawString(38,42,MARK)
            c.setFont('Demo',9);c.drawRightString(w-38,42,f'{page} / {len(case["documents"])}')
            c.showPage()
        c.save()
        shutil.copy2(pdf, deliverables/pdf.name)
        for page,doc in enumerate(case['documents'],1):
            text=subprocess.check_output(['pdftotext','-f',str(page),'-l',str(page),str(pdf),'-'],text=True)
            normalized=norm(text)
            if norm(MARK) not in normalized: raise ValueError('Missing synthetic mark')
            for field in [x for x in oracle['fields'] if x['page']==page]:
                if norm(field['fieldName'].upper()) not in normalized or norm(field['evidenceText']) not in normalized:
                    raise ValueError('Visible text differs from frozen oracle: '+cid)
            # No invisible values are supplied to OCR: render the actual PDF page.
        subprocess.run(['pdftoppm','-r','110','-png',str(pdf),str(out/cid)],check=True,stdout=subprocess.DEVNULL)
        artifacts=[(pdf,'pdf',None,len(case['documents']))]
        for page,doc in enumerate(case['documents'],1):
            png=out/(cid+'-'+str(page)+'.png')
            artifacts.append((png,'png',doc['id'],1))
        for path,fmt,docid,pages in artifacts:
            entry={'caseId':cid,'suite':case['suite'],'documentId':docid,'path':str(path.relative_to(ROOT)),
                   'format':fmt,'pageCount':pages,'sha256':sha(path),'generatorVersion':VERSION,
                   'generationMode':'local_deterministic','appearanceModel':api.get('model') if api.get('inferenceCompleted') else None,
                   'appearance':appearance,'textVerification':'passed'}
            manifest.append(entry)
            conn.execute('''INSERT INTO synthetic_document_artifacts VALUES(?,?,?,?,?,?,?,?,?,?,?,?)''',
                         (entry['sha256'],cid,case['suite'],docid,entry['path'],fmt,pages,VERSION,'local_deterministic',entry['appearanceModel'],json.dumps(oracle,ensure_ascii=False),datetime.now(timezone.utc).isoformat()))
        # Every rendered page is included in a case contact sheet for visual review.
        thumbs=[]
        for path,fmt,_,_ in artifacts:
            if fmt=='png':
                im=Image.open(path).convert('RGB');im.thumbnail((420,595));thumbs.append(im.copy())
        sheet=Image.new('RGB',(840,640*((len(thumbs)+1)//2)), '#dce3eb')
        for i,im in enumerate(thumbs): sheet.paste(im,((i%2)*420,(i//2)*640))
        sheet.save(preview/(cid+'-contact.png'))
    conn.commit();conn.close()
    (ROOT/'src/data/documents/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    with zipfile.ZipFile(ROOT/'output/synthetic-documents.zip','w',zipfile.ZIP_DEFLATED) as z:
        for item in manifest:
            path=ROOT/item['path'];z.write(path,'documents/'+path.name)
        z.write(ROOT/'src/data/documents/manifest.json','manifest.json')
    print(json.dumps({'pdfs':len(cases),'pages':sum(len(c['documents']) for c in cases),'artifacts':len(manifest),'textVerification':'passed'}))

if __name__=='__main__': main()
