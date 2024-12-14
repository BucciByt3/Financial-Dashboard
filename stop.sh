#!/bin/bash

# Colors for the output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Stopping Finance Dashboard...${NC}"

# Stop the server process
SERVER_PID=$(pgrep -f "finance-dashboard/server")
if [ -n "$SERVER_PID" ]; then
    echo -e "${BLUE}Stopping server...${NC}"
    sudo kill $SERVER_PID
    sleep 2
    if ! pgrep -f "finance-dashboard/server" > /dev/null; then
        echo -e "${GREEN}Server stopped successfully${NC}"
    else
        echo -e "${RED}Failed to stop server${NC}"
    fi
else
    echo -e "${GREEN}Server is not running${NC}"
fi

# Stop the client process
CLIENT_PID=$(pgrep -f "finance-dashboard/client")
if [ -n "$CLIENT_PID" ]; then
    echo -e "${BLUE}Stopping client...${NC}"
    sudo kill $CLIENT_PID
    sleep 2
    if ! pgrep -f "finance-dashboard/client" > /dev/null; then
        echo -e "${GREEN}Client stopped successfully${NC}"
    else
        echo -e "${RED}Failed to stop client${NC}"
    fi
else
    echo -e "${GREEN}Client is not running${NC}"
fi

echo -e "${GREEN}Finance Dashboard stopped successfully${NC}"
