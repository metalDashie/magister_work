#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from PIL import Image
import os

def analyze_images(folder_path):
    """Analyze extracted images"""

    images = []
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            filepath = os.path.join(folder_path, filename)
            try:
                with Image.open(filepath) as img:
                    width, height = img.size
                    filesize = os.path.getsize(filepath)
                    images.append({
                        'name': filename,
                        'width': width,
                        'height': height,
                        'size_kb': filesize // 1024,
                        'aspect': width / height if height > 0 else 0
                    })
            except Exception as e:
                print(f"Error reading {filename}: {e}")

    # Sort by size (larger images are likely screenshots or diagrams)
    images.sort(key=lambda x: x['size_kb'], reverse=True)

    print("=== IMAGES SORTED BY SIZE ===\n")
    for img in images:
        print(f"{img['name']:20} {img['width']:4}x{img['height']:4} {img['size_kb']:6} KB")

    # Look for likely technology stack images (usually wide)
    print("\n=== WIDE IMAGES (likely diagrams/screenshots) ===\n")
    for img in images:
        if img['width'] > 800 or img['aspect'] > 2:
            print(f"{img['name']:20} {img['width']:4}x{img['height']:4}")

    # Look for tall images (screenshots)
    print("\n=== TALL IMAGES (likely mobile screenshots) ===\n")
    for img in images:
        if img['aspect'] < 0.7 and img['height'] > 500:
            print(f"{img['name']:20} {img['width']:4}x{img['height']:4}")

if __name__ == "__main__":
    folder_path = r"C:\Users\Iurii\Desktop\magister\extracted_images"
    analyze_images(folder_path)
