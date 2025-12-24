# -*- coding: utf-8 -*-
"""
Перевірка всіх підписів у документі
"""

from docx import Document
import re

output_file = r'C:\Users\Iurii\Downloads\ХОМЕНКО_521_МАГІСТЕРСЬКА_FINAL3.docx'
doc = Document(output_file)

results = []
results.append("=== ALL CAPTIONS IN FINAL3 ===\n")

# Check for any remaining dashes in captions
captions_with_dash = []
captions_ok = []

for para in doc.paragraphs:
    text = para.text.strip()
    if re.match(r'^(Таблиця|Рисунок)\s+\d+\.\d+', text):
        if re.search(r'\d+\.\d+\.?\s*-', text):
            captions_with_dash.append(text[:100])
        else:
            captions_ok.append(text[:100])

results.append(f"Captions WITHOUT dash (correct): {len(captions_ok)}")
results.append(f"Captions WITH dash (need fixing): {len(captions_with_dash)}")

if captions_with_dash:
    results.append("\nCaptions still with dash:")
    for i, c in enumerate(captions_with_dash[:20], 1):
        results.append(f"  {i}. {c}")

# Write to file
with open(r'C:\magister_work\all_captions.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(results))

print("Results written to all_captions.txt")
