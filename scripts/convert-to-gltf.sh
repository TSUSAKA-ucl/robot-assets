#!/bin/bash
if readlink "$0" >/dev/null
then ThisCmd=`readlink "$0"`
else ThisCmd="$0"
fi
cd `dirname "$ThisCmd"`
ThisDir=`pwd -P`
cd -
#
#
if [ "$BLENDER" = "" ]
then BLENDER=~/Downloads/blender-3.6.23-linux-x64/blender
fi
PyScript="$ThisDir"/convert-to-gltf.py
while [ $# -gt 0 ]
do echo "$BLENDER" --background --python "$PyScript" -- \
	     --input "$1" \
	     --output ./out/
   "$BLENDER" --background --python "$PyScript" -- \
	     --input "$1" \
	     --output ./out/ || exit 1
   shift
done
