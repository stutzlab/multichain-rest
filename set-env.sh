#!/bin/bash

local_ip=$(ifconfig | grep -oE "\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b" | grep -E "(192|10|172).*$" | grep -E -v "^.*(255)$")

echo "Setting .env HOST_IP to $local_ip"
echo "HOST_IP=$local_ip" > .env
