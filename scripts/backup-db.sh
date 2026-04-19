#!/bin/bash
# Configuration
BACKUP_DIR="/home/ubuntu/backups"
DATA_DIR="/home/ubuntu/plant_disease_detector/data"
DB_NAME="plant_disease.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "--- Starting Backup of $DB_NAME ---"

# Use sqlite3 to create a safe backup even if the DB is in use
sudo sqlite3 "$DATA_DIR/$DB_NAME" ".backup '$BACKUP_DIR/omnivax_backup_$TIMESTAMP.db'"

# Compress the backup
gzip "$BACKUP_DIR/omnivax_backup_$TIMESTAMP.db"

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -type f -name "*.db.gz" -mtime +7 -delete

echo "--- Backup Complete: $BACKUP_DIR/omnivax_backup_$TIMESTAMP.db.gz ---"
