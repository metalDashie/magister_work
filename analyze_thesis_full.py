# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document

doc = Document(r'C:\Users\Iurii\Downloads\ХОМЕНКО_521_МАГІСТЕРСЬКА_UPDATED4.docx')

print("=== АНАЛІЗ СТРУКТУРИ ДОКУМЕНТА ===\n")

for i, para in enumerate(doc.paragraphs):
    text = para.text.strip()
    if text:
        # Показуємо перші 150 символів кожного параграфа
        preview = text[:150] + "..." if len(text) > 150 else text
        print(f"{i}: {preview}")
