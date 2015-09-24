#!/bin/bash

# trap ctrl-c and call bye()
trap bye INT

function bye() {
    printf "\nBye!\n"
    exit
}

# The key required to post
key='a-key-that-should-be-stupidly-long-and-complex'
host='http://your.host.cake'

clear
printf "#######################################################\n"
printf "     Thingy PostMan\n"
printf "#######################################################\n"

while [ 1 ]
do
    printf "\n"
    printf "#######################################################\n"
    printf "     1: POST\n"
    printf "     2: DELETE\n"
    printf "     ctrl+c to exit\n"
    printf "#######################################################\n"
    printf "Choice: "
    read action

    printf "\n"
    if [ $action = "1" ]; then
        printf "Text (Plain Text and MD supported): \n"
        read text
        printf "\n"
        printf "Server answer: "
        curl -X "POST" -d "key=$key&text=$text" $host
    elif [ $action = "2" ]; then
        printf "Post timestamp: "
        read id
        printf "\n"
        printf "Server answer: "
        curl -X "DELETE" -d "key=$key&id=$id" $host
    fi
done
