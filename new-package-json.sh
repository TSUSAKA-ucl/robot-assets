#!/usr/bin/bash
# mv package.json{,.ORIG}
# ../new-package-json.sh package.json.ORIG > package.json
#
while [ $# -gt 0 ]
do PACKAGEJSON="$1"
   sed -e '/^ *"public\//,$d' "$PACKAGEJSON"
   find ./public -type f ! -path '*.ORIG/*' ! -name '*~' ! -name '*.ORIG' | \
       sed -e 's/^/"/;:a;N;s/\n/","/g;ta' |sed 's/,/,\n/g;$s/$/"/'
   sed -e '1,/^ *"public\//d;/^ *"public\//d' "$PACKAGEJSON"
   shift
done
