#!/bin/sh

result="$(node index.js $@)"

# If the result starts with a bash comment, evaluate the result.
if [[ $result =~ ^#.* ]]
then
  eval "${result}"
# Otherwise, pass on the output.
else
  echo "${result}"
fi