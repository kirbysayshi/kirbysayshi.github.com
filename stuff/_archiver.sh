#!/bin/bash

# set -x
set -e

# inspired by: https://superuser.com/a/655676

export ARCHIVE="_Archive";

function find_with_mtime() {
  find . -type f -mtime $1 -and ! \( \
    -ipath '*/.git/*' \
    -or -ipath '*/node_modules/*' \
    -or -iname '.DS_Store' \
    -or -iname _archiver.sh \
    -or -ipath '*/'"${ARCHIVE}"'/*' \
    -or -iname './_README.md' \
    \)
}

function convert_files_list_to_unique_root_folders_list() {
  FILES_LIST_FILE=$1;
  # divide the path by "/", and take the second segment (first is .). Then wrap
  # the result in slashes to still be a unique entry and distinguish between
  # similar parts of files later.
  cut -d"/" -f2 "${FILES_LIST_FILE}" \
    | while read line; do echo "./$line/"; done \
    | sort -u
}

export OLD_FILES=$(mktemp);
export NEW_FILES=$(mktemp);
export OLD_FOLDERS=$(mktemp);
export NEW_FOLDERS=$(mktemp);

DAYS=180;

# files older than days
find_with_mtime +$DAYS > "${OLD_FILES}"

# files newer than days
find_with_mtime -$DAYS > "${NEW_FILES}"

# Some light debugging to help answer questions. usage: WHY=project-name ./_archiver.sh
if [ -n "$WHY" ]; then
  echo Listing all new files containing: ${WHY};
  grep "${WHY}" "${NEW_FILES}"
  exit 1
fi

# turn into "root" folder list
convert_files_list_to_unique_root_folders_list "${OLD_FILES}" > "${OLD_FOLDERS}"
convert_files_list_to_unique_root_folders_list "${NEW_FILES}" > "${NEW_FOLDERS}"

# determine files from old that are not in new
TO_MOVE=$(grep -vf "${NEW_FOLDERS}" "${OLD_FOLDERS}")

echo OLD_FILES_LIST "${OLD_FILES}"
echo NEW_FILES_LIST "${NEW_FILES}"
echo OLD_FOLDERS_LIST "${OLD_FOLDERS}"
echo NEW_FOLDERS_LIST "${NEW_FOLDERS}"

# move projects to the archive.
mkdir -p "${ARCHIVE}"
for FOLDER in ${TO_MOVE}; do
  echo "${FOLDER}" is older than "${DAYS}", moving to archive!
  mv "${FOLDER}" "${ARCHIVE}"/;
done
