# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document

doc = Document(r'C:\Users\Iurii\Downloads\ВІДГУК_ХОМЕНКО.docx')

# Заміна року у всіх параграфах
for para in doc.paragraphs:
    if '2023' in para.text:
        for run in para.runs:
            if '2023' in run.text:
                run.text = run.text.replace('2023', '2025')

# Зберігаємо документ
doc.save(r'C:\Users\Iurii\Downloads\ВІДГУК_ХОМЕНКО.docx')
print('Рік виправлено на 2025!')
