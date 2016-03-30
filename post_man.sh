#!/bin/bash

# VARS
SAVEFILE="post_man.conf"
EDITOR=""
HOST=""

# Define usage text
function usage {
  printf "postman - A simple interface to use Thingy\n"
  printf "\n"
  printf "Usage: postman <service>\n"
  printf "Services:\n"
  printf "\thelp                : Display this help\n"
  printf "\tpost                : Start the posting service\n"
  printf "\tdelete <id>         : Delete one post\n"
  printf "\tstatus              : Display the configuration status\n"
  printf "\tset-editor <editor> : Set the Editor used when posting\n"
  printf "\tset-host <host>     : Set the Host\n"
  printf "\n"
}

# Show usage text if no args
if [ $# -eq 0 ]; then
  usage
  exit 0
fi

if [ -e "$SAVEFILE" ];
then
  while IFS=$';' read savededitor savedhost
  do
    EDITOR=$savededitor
    HOST=$savedhost
  done < "$SAVEFILE"
else
  echo "nano;" > "$SAVEFILE"
fi

case $1 in
  help)
    usage
    ;;
  post)
    touch .tmp
    $EDITOR .tmp
    text=$(<.tmp)
    printf "Text aquired.\n"
    read -p "Username: " user
    read -p "Password: " -s pass
    rm .tmp
    printf "\n"
    curl $HOST --data "text=$text" --user $user:$pass -w "%{http_code}\n\n"
    ;;
  delete)
    read -p "Username: " user
    read -p "Password: " -s pass
    printf "\n"
    curl $HOST -X "DELETE" --data "id=$2" --user $user:$pass -w "%{http_code}\n\n"
    ;;
  status)
    printf "PostMan Status:\n"
    printf "\tHost   : $HOST\n"
    printf "\tEditor : $EDITOR\n"
    printf "\n"
    ;;
  set-editor)
    echo "$2;$HOST;$KEY" > "$SAVEFILE"
    printf "Editor saved\n\n"
    ;;
  set-host)
    echo "$EDITOR;$2;$KEY" > "$SAVEFILE"
    printf "Host saved\n\n"
    ;;
esac
