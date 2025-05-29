#!/bin/bash
cd /home/kavia/workspace/code-generation/financeflow-23329-817ab18b/financeflow
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

