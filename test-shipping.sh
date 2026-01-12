#!/bin/bash

# Shipping Method Implementation - Test Script
# This script helps test the shipping method implementation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000/api"
TOKEN=""

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to check if backend is running
check_backend() {
    print_info "Checking if backend is running..."
    if curl -s "${API_URL}/health" > /dev/null; then
        print_success "Backend is running"
        return 0
    else
        print_error "Backend is not running. Please start with: cd backend && npm run dev"
        exit 1
    fi
}

# Function to login and get token
login() {
    print_info "Login to get authentication token..."
    echo -n "Email: "
    read EMAIL
    echo -n "Password: "
    read -s PASSWORD
    echo ""
    
    RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
    
    TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        print_error "Login failed. Please check credentials."
        exit 1
    fi
    
    print_success "Logged in successfully"
}

# Function to get client ID
get_client_id() {
    print_info "Fetching your client ID..."
    
    RESPONSE=$(curl -s -X GET "${API_URL}/clients" \
        -H "Authorization: Bearer ${TOKEN}")
    
    CLIENT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -z "$CLIENT_ID" ]; then
        print_error "Could not get client ID"
        exit 1
    fi
    
    print_success "Client ID: ${CLIENT_ID}"
}

# Test 1: Sync shipping methods from JTL
test_sync_shipping_methods() {
    print_info "Test 1: Syncing shipping methods from JTL FFN..."
    
    RESPONSE=$(curl -s -X POST "${API_URL}/shipping-methods/jtl/${CLIENT_ID}/sync" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json")
    
    if echo $RESPONSE | grep -q '"success":true'; then
        SYNCED_COUNT=$(echo $RESPONSE | grep -o '"synced":[0-9]*' | cut -d':' -f2)
        print_success "Synced ${SYNCED_COUNT} shipping methods from JTL FFN"
    else
        print_error "Failed to sync shipping methods"
        echo $RESPONSE
    fi
}

# Test 2: Get all shipping methods
test_get_shipping_methods() {
    print_info "Test 2: Getting all shipping methods..."
    
    RESPONSE=$(curl -s -X GET "${API_URL}/shipping-methods" \
        -H "Authorization: Bearer ${TOKEN}")
    
    if echo $RESPONSE | grep -q '"id"'; then
        METHOD_COUNT=$(echo $RESPONSE | grep -o '"id":"' | wc -l)
        print_success "Found ${METHOD_COUNT} shipping methods"
        
        # Show first method
        print_info "Sample shipping method:"
        echo $RESPONSE | python3 -m json.tool | head -20
    else
        print_error "No shipping methods found"
    fi
}

# Test 3: Create a test mapping
test_create_mapping() {
    print_info "Test 3: Creating a test shipping method mapping..."
    
    # Get first shipping method ID
    METHODS=$(curl -s -X GET "${API_URL}/shipping-methods" \
        -H "Authorization: Bearer ${TOKEN}")
    
    SHIPPING_METHOD_ID=$(echo $METHODS | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -z "$SHIPPING_METHOD_ID" ]; then
        print_error "No shipping methods available. Run sync first."
        return 1
    fi
    
    print_info "Using shipping method ID: ${SHIPPING_METHOD_ID}"
    
    RESPONSE=$(curl -s -X POST "${API_URL}/shipping-methods/mappings" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"channelShippingCode\": \"test_standard\",
            \"channelShippingTitle\": \"Test Standard Shipping\",
            \"channelType\": \"SHOPIFY\",
            \"shippingMethodId\": \"${SHIPPING_METHOD_ID}\",
            \"clientId\": \"${CLIENT_ID}\"
        }")
    
    if echo $RESPONSE | grep -q '"id"'; then
        print_success "Created test mapping"
    else
        print_error "Failed to create mapping"
        echo $RESPONSE
    fi
}

# Test 4: Set default shipping method
test_set_default_shipping() {
    print_info "Test 4: Setting default shipping method for client..."
    
    # Get first shipping method ID
    METHODS=$(curl -s -X GET "${API_URL}/shipping-methods" \
        -H "Authorization: Bearer ${TOKEN}")
    
    SHIPPING_METHOD_ID=$(echo $METHODS | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -z "$SHIPPING_METHOD_ID" ]; then
        print_error "No shipping methods available. Run sync first."
        return 1
    fi
    
    RESPONSE=$(curl -s -X PUT "${API_URL}/shipping-methods/client/${CLIENT_ID}/default" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"shippingMethodId\": \"${SHIPPING_METHOD_ID}\"}")
    
    if echo $RESPONSE | grep -q 'defaultShippingMethodId'; then
        print_success "Set default shipping method"
    else
        print_error "Failed to set default shipping method"
        echo $RESPONSE
    fi
}

# Test 5: Get notifications
test_get_notifications() {
    print_info "Test 5: Getting notifications..."
    
    RESPONSE=$(curl -s -X GET "${API_URL}/notifications?unreadOnly=true" \
        -H "Authorization: Bearer ${TOKEN}")
    
    if echo $RESPONSE | grep -q '"notifications"'; then
        NOTIF_COUNT=$(echo $RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)
        print_success "Found ${NOTIF_COUNT} unread notifications"
        
        if [ "$NOTIF_COUNT" != "0" ]; then
            print_info "Recent notifications:"
            echo $RESPONSE | python3 -m json.tool | head -30
        fi
    else
        print_error "Failed to get notifications"
    fi
}

# Test 6: Get unread count
test_unread_count() {
    print_info "Test 6: Getting unread notification count..."
    
    RESPONSE=$(curl -s -X GET "${API_URL}/notifications/unread-count" \
        -H "Authorization: Bearer ${TOKEN}")
    
    if echo $RESPONSE | grep -q '"totalCount"'; then
        print_success "Unread notification count retrieved"
        echo $RESPONSE | python3 -m json.tool
    else
        print_error "Failed to get unread count"
    fi
}

# Test 7: Get mismatches
test_get_mismatches() {
    print_info "Test 7: Getting shipping method mismatches..."
    
    RESPONSE=$(curl -s -X GET "${API_URL}/shipping-methods/mismatches" \
        -H "Authorization: Bearer ${TOKEN}")
    
    if echo $RESPONSE | grep -q '\['; then
        MISMATCH_COUNT=$(echo $RESPONSE | grep -o '"id":"' | wc -l)
        print_success "Found ${MISMATCH_COUNT} unresolved mismatches"
        
        if [ "$MISMATCH_COUNT" != "0" ]; then
            print_info "Mismatches:"
            echo $RESPONSE | python3 -m json.tool
        fi
    else
        print_error "Failed to get mismatches"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "======================================="
    echo "Shipping Method Testing Menu"
    echo "======================================="
    echo "1. Check Backend Status"
    echo "2. Login and Setup"
    echo "3. Sync Shipping Methods from JTL"
    echo "4. View Shipping Methods"
    echo "5. Create Test Mapping"
    echo "6. Set Default Shipping Method"
    echo "7. View Notifications"
    echo "8. Check Unread Count"
    echo "9. View Mismatches"
    echo "10. Run All Tests"
    echo "0. Exit"
    echo "======================================="
    echo -n "Select option: "
}

# Run all tests
run_all_tests() {
    print_info "Running all tests..."
    test_sync_shipping_methods
    sleep 1
    test_get_shipping_methods
    sleep 1
    test_create_mapping
    sleep 1
    test_set_default_shipping
    sleep 1
    test_get_notifications
    sleep 1
    test_unread_count
    sleep 1
    test_get_mismatches
    print_success "All tests completed!"
}

# Main script
main() {
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║  Shipping Method Implementation Tester    ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    
    check_backend
    
    while true; do
        show_menu
        read OPTION
        
        case $OPTION in
            1)
                check_backend
                ;;
            2)
                login
                get_client_id
                ;;
            3)
                if [ -z "$TOKEN" ]; then
                    print_error "Please login first (option 2)"
                else
                    test_sync_shipping_methods
                fi
                ;;
            4)
                if [ -z "$TOKEN" ]; then
                    print_error "Please login first (option 2)"
                else
                    test_get_shipping_methods
                fi
                ;;
            5)
                if [ -z "$TOKEN" ]; then
                    print_error "Please login first (option 2)"
                else
                    test_create_mapping
                fi
                ;;
            6)
                if [ -z "$TOKEN" ]; then
                    print_error "Please login first (option 2)"
                else
                    test_set_default_shipping
                fi
                ;;
            7)
                if [ -z "$TOKEN" ]; then
                    print_error "Please login first (option 2)"
                else
                    test_get_notifications
                fi
                ;;
            8)
                if [ -z "$TOKEN" ]; then
                    print_error "Please login first (option 2)"
                else
                    test_unread_count
                fi
                ;;
            9)
                if [ -z "$TOKEN" ]; then
                    print_error "Please login first (option 2)"
                else
                    test_get_mismatches
                fi
                ;;
            10)
                if [ -z "$TOKEN" ]; then
                    print_error "Please login first (option 2)"
                else
                    run_all_tests
                fi
                ;;
            0)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main
main
