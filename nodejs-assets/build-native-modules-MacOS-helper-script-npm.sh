#!/bin/bash
      # Helper script for Gradle to call npm on macOS in case it is not found
      export PATH=$PATH:/usr/local/lib/node_modules/npm/bin/node-gyp-bin:/Users/rahulkumar/Documents/vsmart/node_modules/nodejs-mobile-react-native/node_modules/.bin:/Users/rahulkumar/Documents/vsmart/node_modules/.bin:/Users/admin/npm/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
      npm $@
    