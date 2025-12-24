# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document

# Читаємо магістерську роботу
doc = Document(r'C:\Users\Iurii\Downloads\ХОМЕНКО_521_МАГІСТЕРСЬКА_FINAL3.docx')

with open('thesis_info.txt', 'w', encoding='utf-8') as f:
    f.write('=== МАГІСТЕРСЬКА РОБОТА ===\n\n')

    # Читаємо перші 150 параграфів для розуміння структури
    count = 0
    for para in doc.paragraphs:
        if para.text.strip():
            f.write(para.text + '\n')
            count += 1
            if count > 200:
                break

print('Done!')
