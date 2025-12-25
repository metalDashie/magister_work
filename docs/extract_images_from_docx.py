#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from docx import Document
from docx.oxml import parse_xml
import os
import zipfile
import shutil

def extract_images_from_docx(docx_path, output_folder):
    """Extract all images from DOCX file"""

    # Create output folder
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # DOCX is actually a zip file
    doc = Document(docx_path)

    # Try to extract images
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        # List all files in the archive
        files = zip_ref.namelist()

        # Filter image files
        image_files = [f for f in files if f.startswith('word/media/')]

        print(f"Found {len(image_files)} images in document")

        # Extract images
        for img_file in image_files:
            filename = os.path.basename(img_file)
            target_path = os.path.join(output_folder, filename)

            with zip_ref.open(img_file) as source, open(target_path, 'wb') as target:
                shutil.copyfileobj(source, target)

            print(f"Extracted: {filename}")

    # Also try to find captions
    print("\n=== Image captions in document ===")
    for para in doc.paragraphs:
        text = para.text.strip()
        if text and ('рис' in text.lower() or 'fig' in text.lower() or 'малюнок' in text.lower()):
            if len(text) < 200:  # Skip long paragraphs
                print(text)

if __name__ == "__main__":
    docx_path = r"C:\Users\Iurii\Desktop\magister\ФКНТ_2025_121_магістр_Хоменко Ю.Ю..docx"
    output_folder = r"C:\Users\Iurii\Desktop\magister\extracted_images"

    try:
        extract_images_from_docx(docx_path, output_folder)
        print(f"\nImages extracted to: {output_folder}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
