#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="YOUR_PATH_TO_THE_FINANCIAL_DASHBOARD"
CLIENT_DIR="$BASE_DIR/client"
SERVER_DIR="$BASE_DIR/server"

# Function to check and terminate old server processes
cleanup_server() {
    local server_pids
    server_pids=$(pgrep -f "node.*server.js")
    if [ -n "$server_pids" ]; then
        echo -e "${BLUE}Cleaning up old server processes...${NC}"
        echo "$server_pids" | while read -r pid; do
            sudo kill -9 "$pid" 2>/dev/null
        done
        sleep 2
    fi
}

# Function to check and terminate old client processes
cleanup_client() {
    local client_pids
    client_pids=$(pgrep -f "vite")
    if [ -n "$client_pids" ]; then
        echo -e "${BLUE}Cleaning up old client processes...${NC}"
        echo "$client_pids" | while read -r pid; do
            sudo kill -9 "$pid" 2>/dev/null
        done
        sleep 2
    fi
}

# Function to install packages
install_packages() {
    local dir=$1
    local name=$2
    
    cd "$dir" || exit
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing $name packages...${NC}"
        sudo npm install
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}$name packages installed successfully${NC}"
        else
            echo -e "${RED}Failed to install $name packages${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}$name packages already installed${NC}"
    fi
}

# Function to display available routes
show_routes() {
    echo -e "\n${CYAN}Available Routes:${NC}"
    echo -e "${BLUE}Authentication Routes:${NC}"
    echo "- POST    /api/auth/register"
    echo "- POST    /api/auth/login"
    echo "- GET     /api/auth/user"
    
    echo -e "\n${BLUE}Account Routes:${NC}"
    echo "- GET     /api/accounts"
    echo "- POST    /api/accounts"
    echo "- PUT     /api/accounts/:id"
    echo "- DELETE  /api/accounts/:id"
    
    echo -e "\n${BLUE}Card Routes:${NC}"
    echo "- GET     /api/cards"
    echo "- POST    /api/cards"
    echo "- PUT     /api/cards/:id"
    echo "- DELETE  /api/cards/:id"
    
    echo -e "\n${BLUE}Transaction Routes:${NC}"
    echo "- GET     /api/transactions"
    echo "- POST    /api/transactions"
    echo "- PUT     /api/transactions/:id"
    echo "- DELETE  /api/transactions/:id"
    
    echo -e "\n${BLUE}Admin Routes:${NC}"
    echo "- POST    /api/admin/login"
    echo "- GET     /api/admin/users"
    echo "- DELETE  /api/admin/users/:id"
    echo "- POST    /api/admin/block-user"
    echo "- GET     /api/admin/blocked-users"
    echo "- DELETE  /api/admin/blocked-users/:id"
    
    echo -e "\n${BLUE}Log Routes:${NC}"
    echo "- GET     /api/admin/logs"
}

# Function to display access information
show_access_info() {
    local ip_address
    ip_address=$(hostname -I | awk '{print $1}')
    
    echo -e "\n${CYAN}Access Information:${NC}"
    
    echo -e "${BLUE}Main Application:${NC}"
    echo -e "- Local:   ${GREEN}http://localhost:5173${NC}"
    echo -e "- Network: ${GREEN}http://$ip_address:5173${NC}"
    
    echo -e "\n${BLUE}Admin Panel:${NC}"
    echo -e "- Local:   ${GREEN}http://localhost:5173/admin${NC}"
    echo -e "- Network: ${GREEN}http://$ip_address:5173/admin${NC}"
    
    echo -e "\n${BLUE}Backend API:${NC}"
    echo -e "- Local:   ${GREEN}http://localhost:5000${NC}"
    echo -e "- Network: ${GREEN}http://$ip_address:5000${NC}"
}

# Start of the main script
echo -e "${BLUE}Starting Finance Dashboard...${NC}"

# Check if MongoDB is running
if ! pgrep -x "mongod" >/dev/null; then
    echo -e "${RED}MongoDB is not running. Starting MongoDB...${NC}"
    sudo systemctl start mongod
    sleep 2
fi

# Verify if MongoDB started successfully
if ! pgrep -x "mongod" >/dev/null; then
    echo -e "${RED}Failed to start MongoDB. Exiting...${NC}"
    exit 1
else
    echo -e "${GREEN}MongoDB is running${NC}"
fi

# Install server packages
install_packages "$SERVER_DIR" "Server"

# Install client packages
install_packages "$CLIENT_DIR" "Client"

# Navigate to server directory and start the server
cd "$SERVER_DIR" || exit

# Ensure the logs directories exist
sudo mkdir -p logs
sudo chmod 777 logs

# Cleanup old processes
cleanup_server

echo -e "${BLUE}Starting server...${NC}"
sudo npm start > logs/out.log 2> logs/error.log &
server_pid=$!
sleep 5

if ps -p $server_pid > /dev/null; then
    echo -e "${GREEN}Server started successfully${NC}"
else
    echo -e "${RED}Failed to start server. Check logs/error.log for details${NC}"
    cat logs/error.log
    exit 1
fi

# Navigate to client directory and start the client
cd "$CLIENT_DIR" || exit

# Cleanup old client processes
cleanup_client

echo -e "${BLUE}Starting client...${NC}"
sudo npm run dev > /dev/null 2>&1 &
client_pid=$!
sleep 5

if ps -p $client_pid > /dev/null; then
    echo -e "${GREEN}Client started successfully${NC}"
else
    echo -e "${RED}Failed to start client${NC}"
    exit 1
fi

# Display routes and access information
show_routes
show_access_info

echo -e "\n${BLUE}Server logs:${NC}"
tail -f "$SERVER_DIR/logs/out.log"