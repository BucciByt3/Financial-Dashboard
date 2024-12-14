# Financial Dashboard

A full-stack web application for managing personal finances with admin panel capabilities. Built with React, Node.js, MongoDB, and Express.

## Features

- 🔐 User Authentication & Authorization
- 💰 Account Management
- 💳 Card Management
- 📊 Transaction Tracking
- 📈 Financial Statistics & Analytics
- 🛡️ Admin Panel with User Management
- 🔍 System Logs & Monitoring
- 🌓 Dark/Light Mode
- 📱 Responsive Design

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v16.20.1 or higher)
- npm (Node Package Manager)
- Git

## Installation Steps

### 1. Install MongoDB

```bash
# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Reload package database
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Enable MongoDB to start on boot
sudo systemctl enable mongod
```

### 2. Configure Network and Firewall

1. First, get your IP address:
```bash
ip a
```

2. Configure firewall:
```bash
# Check firewall status
sudo ufw status

# Open necessary ports
sudo ufw allow 5173  # For Vite dev server
sudo ufw allow 5000  # For API server
sudo ufw allow 27017 
sudo ufw reload

# Verify the rules were added
sudo ufw status
```

### 3. Configure MongoDB Security

First, stop MongoDB:
```bash
sudo systemctl stop mongod
```

Edit MongoDB configuration:
```bash
sudo nano /etc/mongod.conf

# Add/modify these lines under security:
security:
  authorization: enabled
```

Start MongoDB again:
```bash
sudo systemctl start mongod
```

### 4. Create Database Users

1. Access MongoDB shell:
```bash
mongosh
```

2. Create admin user with required roles:
```javascript
use admin
db.createUser(
  {
    user: "adminUser",
    pwd: "your_secure_password",
    roles: [
      { role: "dbAdminAnyDatabase", db: "admin" },
      { role: "readWrite", db: "finance-dashboard" },
      { role: "userAdminAnyDatabase", db: "admin" }
    ]
  }
)
```

3. Connect with admin credentials:
```bash
mongosh admin -u adminUser -p 'your_secure_password'
```

4. Create application user:
```javascript
use finance-dashboard
db.createUser(
  {
    user: "financeUser",
    pwd: "your_secure_password",
    roles: [
      { role: "dbAdmin", db: "finance-dashboard" },
      { role: "readWrite", db: "finance-dashboard" }
    ]
  }
)
```

### 5. Setup Application

1. Clone the repository:
```bash
git clone https://github.com/BucciByt3/Financial-Dashboard.git
cd finance-dashboard
```

2. Install server dependencies (optional, if the automatic download doesn't work):
```bash
cd server
npm install
```

3. Install client dependencies (optional, if the automatic download doesn't work):
```bash
cd ../client
npm install
```

### 6. Setup Admin User

1. First, create and hash the admin password:
```bash
# Install the package for password hashing
cd finance-dashboard
npm install 

# Edit hashPassword.js
nano hashPassword.js

# Replace the password in hashPassword.js with your desired password:
const bcrypt = require('bcryptjs');
const password = 'your_chosen_password';  // Change this

bcrypt.hash(password, 10).then(hash => {
  console.log('Hashed password:', hash);
});

# Generate the hash
node hashPassword.js

# Copy the generated hash for the next step
```

2. Create the admin user in MongoDB:
```bash
# Connect to MongoDB
mongosh admin -u adminUser -p 'your_secure_password'

# Switch to finance-dashboard database
use finance-dashboard

# Create admin user (replace YOUR_HASHED_PASSWORD with the hash from previous step)
db.admins.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "YOUR_HASHED_PASSWORD",
  role: "super"
})
```

### 7. Configure Application

1. Update server configuration (server.js):
```javascript
// Replace YOUR_IP_ADDRESS with your actual IP
const serverIP = 'YOUR_IP_ADDRESS';
// Replace YOUR_IP_ADDRESS with your actual IP (optional, 0.0.0.0 if everyone should have access)
const server = app.listen(PORT, 'YOUR_IP_ADDRESS', () => { ...
```

2. Generate JWT secret key (choose one method):

```bash
# Using OpenSSL (recommended) 
openssl rand -hex 32 

# Using Node.js 
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 

# Using Python 
python3 -c "import secrets; print(secrets.token_hex(32))"
```


3. Create `.env` file in the server directory:
```env
MONGODB_URI=mongodb://financeUser:your_secure_password@localhost:27017/finance-dashboard?authSource=finance-dashboard
JWT_SECRET=your_generated_secret_from_step_2
PORT=5000
```

### 8. Running the Application

1. Update the start.sh:
```bash
# Change "YOUR_PATH_TO_THE_FINANCIAL_DASHBOARD" to the correct Path
BASE_DIR="YOUR_PATH_TO_THE_FINANCIAL_DASHBOARD"
```

2. Make scripts executable:
```bash
chmod +x start.sh stop.sh
```

3. Start the application:
```bash
./start.sh
```

4. Stop the application:
```bash
./stop.sh
```

## Access the Application

After starting the application, you can access it at:
- Frontend: `http://YOUR_IP_ADDRESS:5173`
- Admin Panel: `http://YOUR_IP_ADDRESS:5173/admin`
- Backend API: `http://YOUR_IP_ADDRESS:5000`

## API Endpoints
### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user

### Account Routes
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Card Routes
- `GET /api/cards` - Get all cards
- `POST /api/cards` - Add new card
- `DELETE /api/cards/:id` - Delete card

### Transaction Routes
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add new transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Admin Routes
- `POST /api/admin/login` - Admin login
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/block-user` - Block user
- `GET /api/admin/blocked-users` - Get blocked users
- `DELETE /api/admin/blocked-users/:id` - Unblock user
- `GET /api/admin/logs` - Get system logs

## Troubleshooting

1. **MongoDB user verification**:
```bash
# Connect as admin
mongosh admin -u adminUser -p 'your_password'

# Check users in admin database
use admin
db.getUsers()

# Check users in finance-dashboard database
use finance-dashboard
db.getUsers()
```

2. **Can't connect to frontend**:
   - Verify ports are open: `sudo ufw status`
   - Check if Vite is running: `ps aux | grep vite`
   - Verify IP address configuration in both server.js and config.js
   - Try accessing the application using the IP address instead of localhost

3. **MongoDB connection issues**:
   - Check MongoDB status: `sudo systemctl status mongod`
   - Verify credentials in `.env` file
   - Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`

4. **Admin login issues**:
   - Verify admin user creation in MongoDB: `db.admins.find()`
   - Check if password was hashed correctly
   - Verify all roles are set correctly

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.







