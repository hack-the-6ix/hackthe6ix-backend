#!/bin/bash
file="\.env"

rm .env.example
while read line; do
    echo "${line%%=*}=xxxxxx" >> .env.example
done < $file