#!/bin/bash

# This script is for initializing the profiles manually for development purpose.
# This is iportant just for devloping initialization process
# Thereafter it will be depricated

# Define directory and file paths
CD_CLI_DIR="$HOME/.cd-cli" # Ensure this resolves correctly
CONFIG_FILE="$CD_CLI_DIR/cd-cli.config.json"
ENV_FILE="$CD_CLI_DIR/.env"

# Create the .cd-cli directory if it doesn't exist
if [ ! -d "$CD_CLI_DIR" ]; then
  echo "Creating $CD_CLI_DIR directory..."
  mkdir -p "$CD_CLI_DIR" || { echo "Failed to create $CD_CLI_DIR"; exit 1; }
else
  echo "$CD_CLI_DIR already exists."
fi

# Set the directory permissions to 700 (read/write/execute for the owner)
chmod 700 "$CD_CLI_DIR" || { echo "Failed to set permissions for $CD_CLI_DIR"; exit 1; }

# Create and populate the configuration file
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Creating $CONFIG_FILE..."
  cat <<EOL > "$CONFIG_FILE"
{
  "items": [
    {
      "cdCliProfileId": 1,
      "cdCliProfileGuid": "a9246764-f6b7-4b63-93c1-12fb24f88c8f",
      "cdCliProfileName": "devServer-ssh-profile",
      "cdCliProfileDescription": "A profile for ssh connection to dev server",
      "cdCliProfileData": {
        "owner": {
          "userId": 1010,
          "groupId": 0
        },
        "details": {
          "sshKey": null,
          "cdApiDir": "~/cd-api",
          "devServer": "192.168.1.70",
          "remoteUser": "devops"
        },
        "permissions": {
          "userPermissions": [
            {
              "read": true,
              "field": "sshKey",
              "write": true,
              "hidden": false,
              "userId": 1000,
              "execute": false
            }
          ],
          "groupPermissions": [
            {
              "read": true,
              "field": "sshKey",
              "write": false,
              "hidden": false,
              "execute": false,
              "groupId": 0
            }
          ]
        }
      },
      "cdCliProfileEnabled": 1,
      "cdCliProfileTypeId": 2,
      "cdCliProfileTypeGuid": "5948e678-8a7a-4305-a87d-4ccd078fdd83",
      "userId": 1010
    },
    {
      "cdCliProfileId": 2,
      "cdCliProfileGuid": "3ff7f765-0bbf-4c6f-920c-14bcfa63da1d",
      "cdCliProfileName": "cd-git-config",
      "cdCliProfileDescription": "Github config for corpdesk projects",
      "cdCliProfileData": {
        "owner": {
          "userId": 1010,
          "groupId": 0
        },
        "details": {
          "gitAccess": {
            "baseRepoUrl": "https:/github.com",
            "username": "georemo",
            "cd-vault": {
              "name": "gitHubToken",
              "description": "github access token",
              "encryptedVaue": "<encrypted-token>",
              "isEncrypted:": true,
              "EncryptionMeta": {
                "encryptedToken": "3a94d8c6b7...e04a",
                "algorithm": "aes-256-cbc",
                "encoding": "hex",
                "iv": "1a94d8c6b7e8...901f"
              }
            }
          },
          "gitRepos": [
            {
              "projName": "coop",
              "gitHost": "corpdesk"
            },
            {
              "projName": "coop",
              "gitHost": "corpdesk"
            }
          ]
        },
        "permissions": {
          "userPermissions": [
            {
              "read": true,
              "field": "sshKey",
              "write": true,
              "hidden": false,
              "userId": 1000,
              "execute": false
            }
          ],
          "groupPermissions": [
            {
              "read": true,
              "field": "sshKey",
              "write": false,
              "hidden": false,
              "execute": false,
              "groupId": 0
            }
          ]
        }
      },
      "cdCliProfileEnabled": 1,
      "cdCliProfileTypeId": 3,
      "cdCliProfileTypeGuid": "af99473c-ed8b-4579-b945-97c77b36efb9",
      "userId": 1010
    },
    {
      "cdCliProfileId": 3,
      "cdCliProfileGuid": "1baab097-4d34-4e12-a9c2-d5f8d1c73583",
      "cdCliProfileName": "frontend-aws-prod",
      "cdCliProfileDescription": "Profile for the development server",
      "cdCliProfileData": {
        "owner": {
          "userId": 1010,
          "groupId": 0
        },
        "details": {
          "sshKey": "~/.ssh/aws_frontend.pem",
          "cdApiDir": "~/",
          "devServer": "asdap.net",
          "remoteUser": "ubuntu"
        },
        "permissions": {
          "userPermissions": [
            {
              "read": true,
              "field": "sshKey",
              "write": true,
              "hidden": false,
              "userId": 1000,
              "execute": false
            }
          ],
          "groupPermissions": [
            {
              "read": true,
              "field": "sshKey",
              "write": false,
              "hidden": false,
              "execute": false,
              "groupId": 0
            }
          ]
        }
      },
      "cdCliProfileEnabled": 1,
      "cdCliProfileTypeId": 3,
      "cdCliProfileTypeGuid": "af99473c-ed8b-4579-b945-97c77b36efb9",
      "userId": 1010
    },
    {
      "cdCliProfileId": 4,
      "cdCliProfileGuid": "7e972f45-528e-4cac-ad02-6bdb100f901f",
      "cdCliProfileName": "cd-api-local",
      "cdCliProfileDescription": "Profile for the development server",
      "cdCliProfileData": {
        "owner": {
          "userId": 1010,
          "groupId": 0
        },
        "details": {
          "cdEndpoint": "https://localhost:3001/api",
          "consumerToken": "#cdVault['consumerToken']",
          "session": {
            "token": "#cdVault['token']",
            "userId": 1010,
            "expiry": "2025-01-06T10:00:00Z"
          },
          "cdVault": [
            {
              "name": "token",
              "description": "cd-api token",
              "value": "d33bb2d3-f4d5-42b4-8e31-44fed3e29826",
              "encryptedValue": null,
              "isEncrypted": false,
              "encryptionMeta": null
            },
            {
              "name": "consumerToken",
              "description": "cd-api consumerToken",
              "value": "B0B3DA99-1859-A499-90F6-1E3F69575DCD",
              "encryptedValue": null,
              "isEncrypted": false,
              "encryptionMeta": null
            }
          ],
          "permissions": {
            "userPermissions": [
              {
                "read": true,
                "field": "cdCliProfileData",
                "write": true,
                "hidden": false,
                "userId": 1000,
                "execute": false
              }
            ],
            "groupPermissions": [
              {
                "read": true,
                "field": "cdCliProfileData",
                "write": false,
                "hidden": false,
                "execute": false,
                "groupId": 0
              }
            ]
          }
        }
      },
      "cdCliProfileEnabled": 1,
      "cdCliProfileTypeId": 10,
      "cdCliProfileTypeGuid": "a20f81fb-4be1-4161-800c-3def9223eb32",
      "userId": 1010
    }
  ],
  "count": 3
}

EOL
  chmod 600 "$CONFIG_FILE" || { echo "Failed to set permissions for $CONFIG_FILE"; exit 1; }
else
  echo "$CONFIG_FILE already exists. Skipping creation."
fi

# Handle .env file
if [ -f "$ENV_FILE" ]; then
  echo "$ENV_FILE already exists. Checking for CD_CLI_ENCRYPT_KEY..."

  # Check if the key exists and is valid
  if grep -q "CD_CLI_ENCRYPT_KEY" "$ENV_FILE"; then
    EXISTING_KEY=$(grep "CD_CLI_ENCRYPT_KEY" "$ENV_FILE" | cut -d '=' -f2)
    if [[ -n "$EXISTING_KEY" && ${#EXISTING_KEY} -eq 64 ]]; then
      echo "Valid CD_CLI_ENCRYPT_KEY already exists in $ENV_FILE."
    else
      echo "CD_CLI_ENCRYPT_KEY in $ENV_FILE is invalid."
      read -p "Do you want to overwrite it? (y/n): " OVERWRITE_ENV
      if [[ "$OVERWRITE_ENV" == "y" ]]; then
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        sed -i "/CD_CLI_ENCRYPT_KEY/d" "$ENV_FILE"
        echo "CD_CLI_ENCRYPT_KEY=$ENCRYPTION_KEY" >> "$ENV_FILE"
        chmod 600 "$ENV_FILE" || { echo "Failed to set permissions for $ENV_FILE"; exit 1; }
        echo "CD_CLI_ENCRYPT_KEY has been updated."
      else
        echo "Keeping the existing invalid key."
      fi
    fi
  else
    echo "No CD_CLI_ENCRYPT_KEY found in $ENV_FILE."
    read -p "Do you want to generate a new key? (y/n): " GENERATE_KEY
    if [[ "$GENERATE_KEY" == "y" ]]; then
      ENCRYPTION_KEY=$(openssl rand -hex 32)
      echo "CD_CLI_ENCRYPT_KEY=$ENCRYPTION_KEY" >> "$ENV_FILE"
      chmod 600 "$ENV_FILE" || { echo "Failed to set permissions for $ENV_FILE"; exit 1; }
      echo "CD_CLI_ENCRYPT_KEY has been added to $ENV_FILE."
    else
      echo "No changes made to $ENV_FILE."
    fi
  fi
else
  echo "Creating $ENV_FILE..."
  ENCRYPTION_KEY=$(openssl rand -hex 32)
  echo "CD_CLI_ENCRYPT_KEY=$ENCRYPTION_KEY" > "$ENV_FILE" || { echo "Failed to create $ENV_FILE"; exit 1; }
  chmod 600 "$ENV_FILE" || { echo "Failed to set permissions for $ENV_FILE"; exit 1; }
  echo "CD_CLI_ENCRYPT_KEY has been created in $ENV_FILE."
fi

# Output confirmation message
echo "Initialization complete. The directory and configuration files have been set up."
