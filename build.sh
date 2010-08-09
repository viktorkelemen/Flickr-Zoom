#!/bin/bash
# Makes it ready to be uploaded

cd ./src/chrome-extension

# version number of the extension
version=`eval cat manifest.json | grep "version" | cut -d \" -f 4`

# compressing
zip flickr-zoom-chrome_$version.zip *
mv flickr-zoom-chrome_$version.zip ../../bin
cd ../..