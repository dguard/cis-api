#/bin/bash
sudo chown -R ${USER}:${USER} /var/run/docker.sock
docker-compose up -d