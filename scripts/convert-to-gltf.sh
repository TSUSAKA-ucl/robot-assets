#!/bin/bash
x="$0"
y="$x"
Here=`pwd -P`
while [ -L "$x" ]
do y="$x"
   x=`readlink "$x"`
   cd `dirname "$y"`
done
cd `dirname "$x"`
ThisDir=`pwd -P`
cd "$Here"
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
