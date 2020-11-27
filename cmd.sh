#!/bin/sh

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
result="$(node $DIR/../vercel-is-pull-request/index.js $@)"

# If the result starts with a bash comment, evaluate the result.
if [[ $result =~ ^#.* ]]
then
  eval "${result}"
# Otherwise, pass on the output.
else
  echo "${result}"
fi