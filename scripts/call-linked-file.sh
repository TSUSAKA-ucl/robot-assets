#!/bin/bash
# determine the js file to run from the name of the link
# that DIRECTLY LINKS TO THIS SCRIPT, and run it with node.
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
# Convert to equivalent JavaScript script and run it
JsScript=`basename "${y%.sh}.js"`
exec node "$ThisDir/$JsScript" "$@"
