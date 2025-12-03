#!/bin/bash

# Create Savings Account
curl --location 'http://localhost:3000/api/v1/lms/savings-accounts' \
--header 'Content-Type: application/json' \
--header 'x-correlation-id: test-123' \
--data-raw '{
    "customerId": "CUST-001",
    "loanId": "LOAN-001",
    "overdraftLimit": 5000
}'


