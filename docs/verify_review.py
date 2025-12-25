# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from docx import Document

doc = Document(r'C:\Users\Iurii\Music\Review_Khomenko_FullMag.docx')
print('=== ОНОВЛЕНА РЕЦЕНЗІЯ ===\n')
for para in doc.paragraphs:
    if para.text.strip():
        print(para.text)
