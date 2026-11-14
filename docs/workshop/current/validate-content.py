from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
from lxml import etree as E
from PIL import Image
import argparse,json,re

p=argparse.ArgumentParser()
p.add_argument('pptx',type=Path)
a=p.parse_args()
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
with ZipFile(a.pptx) as z:
    slides=sorted([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)],key=lambda n:int(re.search(r'(\d+)\.xml',n).group(1)))
    assert len(slides)==43
    all_text=[]
    for part in slides:
        node=E.fromstring(z.read(part))
        assert node.get('show')!='0',part
        all_text.append('\n'.join(node.xpath('//a:t/text()',namespaces=ns)))
    assert all_text[30].strip()=='Short Break'
    assert 'I build useful agent systems.' not in all_text[1]
    for number,name in [(17,'1. The sensor'),(19,'2. Regression protection'),(21,'3. The controller'),(23,'4. The actuator'),(25,'5. Workflow execution'),(27,'6. Human feedback'),(29,'7. Flow control')]:
        assert name in all_text[number-1],number
    for part in z.namelist():
        if part.endswith('.rels'):
            assert all(e.get('TargetMode')!='External' for e in E.fromstring(z.read(part))),part
        if re.fullmatch(r'ppt/notesSlides/notesSlide\d+\.xml',part):
            t='\n'.join(E.fromstring(z.read(part)).xpath('//a:t/text()',namespaces=ns))
            assert not re.search(r'https?://|\bSources?:',t),part
            all_text.append(t)
    assert not any('\u2014' in t for t in all_text)
    media=[n for n in z.namelist() if n.startswith('ppt/media/') and not n.endswith('/')]
    for n in media:
        data=z.read(n)
        if n.endswith('.svg'):
            E.fromstring(data)
        else:
            Image.open(BytesIO(data)).verify()
    for number in [15,16,26,30]:
        root=E.fromstring(z.read(slides[number-1]))
        assert root.findall('.//p:cxnSp',ns),number
    assert E.fromstring(z.read(slides[19])).findall('.//a:tbl',ns)
    for number in [6,15,16]:
        for c in E.fromstring(z.read(slides[number-1])).findall('.//p:cxnSp',ns):
            g=c.find('p:spPr/a:prstGeom',ns)
            assert g is not None and g.get('prst')=='straightConnector1',(number,'Unexpected bent connector')
print(json.dumps({'slides':43,'hidden':0,'hands_on':[17,30],'short_break':31,'external_links':0,'media_verified':len(media),'native_table':20,'editable_diagrams':[15,16,26,30]}))
