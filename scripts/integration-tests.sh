#!/bin/bash

source /scripts/common.sh
source /scripts/bootstrap-helm.sh


run_tests() {
    echo Running tests...

    kubectl create job --from=cronjob/kusama-voter kusama-voter-manual

    wait_pod_ready kusama-voter
}

teardown() {
    helm delete kusama-voter
}

main(){
    if [ -z "$KEEP_W3F_POLKADOT_WATCHER" ]; then
        trap teardown EXIT
    fi

    /scripts/build-helmfile.sh

    run_tests
}

main
