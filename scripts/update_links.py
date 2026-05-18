import os
import re

html_files = ["dashboard.html", "analytic.html", "map.html", "incidents.html"]
base_dir = r"d:\workspace\workspace\dev\projects\estec-wildfire-code\estec---wildfire---code\frontend-code"

link_map = {
    "Tổng quan": "/dashboard.html",
    "Bản đồ trực tuyến": "/map.html",
    "Quản lý Sự cố": "/incidents.html",
    "Thống kê & Báo cáo": "/analytic.html"
}

for file in html_files:
    file_path = os.path.join(base_dir, file)
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Very specific replacement to avoid messing up other things.
        for label, href in link_map.items():
            # Matches: <a ... href="#" ...> ... label ... </a>
            # We want to replace href="#" with href="href" but only for the specific label.
            # A simpler way is to find the block containing the label and replace href="#" inside it.
            
            pattern = re.compile(r'(<a[^>]*href=")("#)("[^>]*>\s*<span[^>]*>[^<]*</span>\s*' + label + r'\s*</a>)', re.DOTALL)
            content = pattern.sub(r'\g<1>' + href + r'\g<3>', content)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated links in {file}")
