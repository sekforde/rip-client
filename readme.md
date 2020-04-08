Docker Commands
===============

# building container
$ docker build-t  sekforde/rip-client .

# cross platform version
$ docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t sekforde/rip-client --push .

# push to docker hub
$ docker push sekforde/rip-client

# run the image
$ docker run sekforde/rip-client

# Get container ID
$ docker ps

# Print app output
$ docker logs <container id>

# create a service on a swarm
$ docker service create --name rip-client --replicas 3 sekforde/rip-client:latest

# list running services
$ docker service ls

# remove a service
$ docker service rm [service-id]

# run the visualiser service
docker service create \
  --name=viz \
  --publish=8080:8080/tcp \
  --constraint=node.role==manager \
  --mount=type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
  alexellis2/visualizer-arm:latest
