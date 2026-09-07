#!/usr/bin/env python3
"""Fix reviews page: save V1's original reviews function and restore after V10 overrides it."""
import re

FILE = 'components/performance-v22-mock/matanho-performance-runtime.js'

with open(FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find both reviews=function lines
reviews_indices = []
for i, line in enumerate(lines):
    if 'reviews=function(){' in line:
        reviews_indices.append(i)

if len(reviews_indices) != 2:
    print(f"ERROR: Expected 2 reviews=function, found {len(reviews_indices)}")
    exit(1)

v1_line = reviews_indices[0]  # line 902 (0-indexed)
v10_line = reviews_indices[1]  # line 1006 (0-indexed)

# Find the closing };\n for each function
def find_closing(lines, start):
    for j in range(start, min(start+20, len(lines))):
        if lines[j].strip() == '};':
            return j
    return None

v1_end = find_closing(lines, v1_line)
v10_end = find_closing(lines, v10_line)

print(f"V1 reviews: line {v1_line+1}, ends at line {v1_end+1}")
print(f"V10 reviews: line {v10_line+1}, ends at line {v10_end+1}")

# Edit 1: After V1's closing }, add save statement
save_line = '  if(typeof __origReviews===\'undefined\')__origReviews=reviews;\n'
lines.insert(v1_end + 1, save_line)
print(f"Inserted save at line {v1_end + 2}")

# Edit 2: After V10's closing }, add restore statement (adjusted for insert)
restore_line = '  reviews=__origReviews;\n'
lines.insert(v10_end + 2, restore_line)  # +2 because of previous insert
print(f"Inserted restore at line {v10_end + 3}")

# Edit 3: Disable decorateReviews - find it and make it return early
for i, line in enumerate(lines):
    if 'function decorateReviews()' in line:
        # Find the next line (should be 'if(state.page!==\'reviews')return;...')
        if i + 1 < len(lines) and 'state.page' in lines[i+1] and 'decorateReviews' not in lines[i+1]:
            lines[i+1] = '    return; // Disabled: use V1 reviews layout\n'
            print(f"Disabled decorateReviews at line {i+2}")
        break

# Find and disable the V12 enrichment for reviews (decoratePageV7 adding system metadata for reviews)
for i, line in enumerate(lines):
    if 'decorateReviews()' in line and 'function' not in line:
        # This is the call site in afterRender - make it a no-op
        pass  # We already disabled the function body above

with open(FILE, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done! File updated.")
