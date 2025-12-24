# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document

doc = Document(r'C:\Users\Iurii\Downloads\ХОМЕНКО_521_МАГІСТЕРСЬКА_UPDATED4.docx')

print("=== РОЗДІЛ 3.6 ОГЛЯД ЗАСТОСУНКУ ===\n")

# Знайти розділ 3.6
in_section_36 = False
for i, para in enumerate(doc.paragraphs):
    text = para.text.strip()
    style = para.style.name if para.style else "None"

    if '3.6' in text and 'Огляд' in text:
        in_section_36 = True
        print(f"=== ПОЧАТОК РОЗДІЛУ 3.6 (індекс {i}) ===\n")

    if in_section_36:
        if text:
            print(f"[{i}] ({style}): {text}")
            print()
        if ('3.7' in text or '3.8' in text) and 'Heading' in style:
            print(f"=== КІНЕЦЬ РОЗДІЛУ 3.6 ===")
            break
