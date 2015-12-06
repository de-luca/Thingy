#!/bin/bash

# VARS
SAVEFILE="post_man.conf"
EDITOR=""
KEY=""
HOST=""

# Define usage text
function usage {
  printf "postman - A simple interface to use Thingy\n"
  printf "\n"
  printf "Usage: postman <service>\n"
  printf "Services:\n"
  printf "\thelp                : Display this help\n"
  printf "\tpost                : Start the posting service\n"
  printf "\tdelete <timestamp>  : Delete one post\n"
  printf "\tlist                : List all the posts\n"
  printf "\tstatus              : Display the consfiguration status\n"
  printf "\tset-editor <editor> : Set the Editor used when posting\n"
  printf "\tset-host <host>     : Set the Host\n"
  printf "\tset-key <key>       : Set the Key\n"
}

# Show usage text if no args
if [ $# -eq 0 ]; then
  usage
  exit 0
fi

if [ -e "$SAVEFILE" ];
then
  while IFS=$';' read savededitor savedhost savedkey
  do
    EDITOR=$savededitor
    HOST=$savedhost
    KEY=$savedkey
  done < "$SAVEFILE"
else
  echo "nano;;" > "$SAVEFILE"
fi

case $1 in
  help)
    usage
    ;;
  post)
    touch .tmp
    $EDITOR .tmp
    text=$(<.tmp)
    rm .tmp
    curl -X "POST" -d "key=$KEY&text=$text" $HOST
    ;;
  delete)
    curl -X "DELETE" -d "key=$KEY&id=$2" $HOST
    ;;
  list)
    list=$(curl -s "$HOST/list/$KEY")
    if [ $list = ""]; then
      printf "No post found\n"
    else
      printf "###########################################\n"
      printf "Timestamp     | Text\n"
      printf "###########################################\n"
      while IFS=: read timestamp text
      do
        printf "$timestamp | $text\n"
      done <<< "$list"
    fi
    ;;
  status)
    printf "PostMan Status:\n"
    printf "\tHost: $HOST\n"
    printf "\tKey: $KEY\n"
    printf "\tEditor: $EDITOR\n"
    ;;
  set-editor)
    echo "$2;$HOST;$KEY" > "$SAVEFILE"
    printf "Editor saved\n"
    ;;
  set-host)
    echo "$EDITOR;$2;$KEY" > "$SAVEFILE"
    printf "Host saved\n"
    ;;
  set-key)
    echo "$EDITOR;$HOST;$2" > "$SAVEFILE"
    printf "Key saved\n"
    ;;
esac
