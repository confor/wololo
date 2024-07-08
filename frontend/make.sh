#!/usr/bin/bash

esbuild \
	--format=iife \
	--platform=browser \
	--loader:.js=jsx \
	--outfile=dist/bundle.js \
	--bundle src/index.jsx

sass \
	--load-path node_modules \
	src/styles.sass dist/bundle.css
