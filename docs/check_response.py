# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document

doc = Document(r'C:\Users\Iurii\Downloads\ВІДГУК_ХОМЕНКО.docx')

with open('created_response.txt', 'w', encoding='utf-8') as f:
    f.write('=== СТВОРЕНИЙ ВІДГУК ===\n')
    for para in doc.paragraphs:
        if para.text.strip():
            f.write(para.text + '\n')

print('Done!')
