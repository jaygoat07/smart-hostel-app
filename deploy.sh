#!/bin/bash
# ==============================================================================
# Automated Release Script for Smart Hostel Management System on AWS EC2
# Usage: ./deploy.sh develop   (on dev-server)
#        ./deploy.sh main      (on prod-server)
# Candidate: A. Jayaraajan (24MIS0052)
# ==============================================================================

BRANCH=${1:-main}

echo "--------------------------------------------------------"
echo "Starting deployment for branch: $BRANCH on $(date)"
echo "--------------------------------------------------------"

# Navigate to app directory
cd /home/ubuntu/smart-hostel-app || exit 1

# Pull latest code from specified branch
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Install/update dependencies
npm install

# Stop existing running node instance gracefully
pkill -f "node server.js" || true
sleep 2

# Start the application in background with logging
nohup node server.js > app.log 2>&1 &

echo "Deployment completed successfully! Process ID: $(pgrep -f 'node server.js')"
echo "Deployed branch $BRANCH at $(date)" >> deploy.log
echo "Health check:"
sleep 2
curl -s http://localhost:3000/health || echo "Waiting for server to warm up..."
echo ""
