#!/usr/bin/env bash

cd dist || exit
zip -r ./package.zip ./*
cd ..
zip -u ./dist/package.zip package.json
