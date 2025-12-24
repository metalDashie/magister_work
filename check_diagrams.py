#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os

diagrams = {
    "use-case": r"C:\Users\Iurii\Desktop\magister\diagrams\use-case-diagram.drawio.png",
    "class": r"C:\Users\Iurii\Desktop\magister\diagrams\class_diagram\class-diagram-v2.drawio.png",
    "package": r"C:\Users\Iurii\Desktop\magister\diagrams\package_diagram\package-diagram.drawio.png",
    "database": r"C:\Users\Iurii\Desktop\magister\diagrams\database_conceptual.drawio.png",
}

print("Checking diagrams...")
for name, path in diagrams.items():
    exists = "YES" if os.path.exists(path) else "NO"
    print(f"{name}: {exists}")
