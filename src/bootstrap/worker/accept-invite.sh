#!/bin/bash

# This file will be copied to CNDI_HOME/src/bootstrap/worker/accept-invite.sh
# It will never be executed or templated, only replaced.
echo "accept-invite called untemplated"
exit 191
echo "accepting node invite with token _TOKEN_"
microk8s join _IP_ADDRESS_:25000/_TOKEN_ --worker