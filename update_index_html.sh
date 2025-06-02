#!/bin/bash

INDEX_HTML_PATH="client/public/index.html"
if [ ! -f "$INDEX_HTML_PATH" ]; then
  echo "Error: $INDEX_HTML_PATH not found."
  exit 1
fi

# Ensure this is treated as a literal block of text for insertion.
# Using it in awk -v var="$text" is fine.
NEW_FAVICON_LINKS='<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">'

# Awk script to process the index.html file
# - Lines outside the <head>...</head> block are printed as is.
# - When <head> is encountered, it's printed, and a flag (in_head_section) is set.
# - While in_head_section is true, lines are checked:
#   - If they are old favicon links (contain rel="icon" or rel="apple-touch-icon"), they are skipped.
#   - Otherwise (e.g. meta tags, title), they are printed.
# - When </head> is encountered:
#   - The NEW_FAVICON_LINKS are printed.
#   - The </head> line itself is printed.
#   - The in_head_section flag is unset.
awk -v new_links="$NEW_FAVICON_LINKS" '
    BEGIN { in_head_section = 0; }
    /<head>/ {
        print;
        in_head_section = 1;
        next;
    }
    /<\/head>/ {
        print new_links;
        print; # This prints the original </head> line
        in_head_section = 0;
        next;
    }
    in_head_section {
        if ($0 !~ /rel="icon"/ && $0 !~ /rel="apple-touch-icon"/) {
            print;
        }
        next;
    }
    { print; }
' "$INDEX_HTML_PATH" > "${INDEX_HTML_PATH}.tmp" && mv "${INDEX_HTML_PATH}.tmp" "$INDEX_HTML_PATH"

echo "Successfully updated favicon links in $INDEX_HTML_PATH"
