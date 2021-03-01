#/bin/bash

psql postgres://${HEROKU_USER}:${HEROKU_PASSWORD}@${HEROKU_HOST}:${HEROKU_PORT}/${HEROKU_DB} < test.sql
