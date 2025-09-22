#!/bin/bash

# ----------------------
# KUDU Deployment Script
# Version: 1.0.17
# ----------------------

# Helpers
# -------

exitWithMessageOnError () {
  if [ ! $? -eq 0 ]; then
    echo "An error has occurred during web site deployment."
    echo $1
    exit 1
  fi
}

# Prerequisites
# -------------

# Verify node.js installed
hash node 2>/dev/null
exitWithMessageOnError "Missing node.js executable, please install node.js, if already installed make sure it can be reached from current environment."

# Setup
# -----

SCRIPT_DIR="${BASH_SOURCE[0]%\\*}"
SCRIPT_DIR="${SCRIPT_DIR%/*}"
ARTIFACTS=$SCRIPT_DIR/../artifacts
KUDU_SYNC_CMD=${KUDU_SYNC_CMD//\"}

if [[ ! -n "$KUDU_SERVICE" ]]; then
  # Install kudu sync
  echo Installing Kudu Sync
  npm install kudusync -g --silent
  exitWithMessageOnError "installing Kudu Sync failed"
fi

##################################################################################################################################
# Deployment
# ----------

echo Handling node.js deployment.

# 1. KuduSync
if [[ "$IN_PLACE_DEPLOYMENT" -ne "1" ]]; then
  "$KUDU_SYNC_CMD" -v 50 -f "$ARTIFACTS" -t "$DEPLOYMENT_TARGET" -n "$NEXT_MANIFEST_PATH" -p "$PREVIOUS_MANIFEST_PATH" -i "$IGNORE_MANIFEST_PATH"
  exitWithMessageOnError "Kudu Sync failed"
fi

# 2. Select node version
if [ -f "$DEPLOYMENT_TARGET/package.json" ]; then
  NODE_VERSION=$(cat "$DEPLOYMENT_TARGET/package.json" | grep -oP '"node":\s*"\K[^"]*')
  if [ ! -z "$NODE_VERSION" ]; then
    echo "Using node version: $NODE_VERSION"
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
  fi
fi

# 3. Install npm packages
if [ -e "$DEPLOYMENT_TARGET/package.json" ]; then
  cd "$DEPLOYMENT_TARGET"
  echo "Running npm install"
  npm install --production
  exitWithMessageOnError "npm failed"
  cd - > /dev/null
fi

##################################################################################################################################
echo "Finished successfully."
