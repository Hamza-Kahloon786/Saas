import stripe

# Your Stripe secret key
stripe.api_key = "sk_test_51RwltjCcX0FmDNEaVAY8yZzROTte4uvK6BGjw43eWr4RZuFMqZXSSt4w3fxaIhyMcH25rATQTgFn4I8m97jHo2yn00RPz1nj38"

print("Testing Stripe Connection...\n")

# Test 1: Verify API key works
try:
    account = stripe.Account.retrieve()
    print(f"✅ Stripe key is valid")
    print(f"   Account ID: {account.id}")
    print(f"   Country: {account.country}\n")
except Exception as e:
    print(f"❌ Invalid Stripe key: {e}\n")
    exit()

# Test 2: Check if your Price IDs exist
price_ids = {
    "Starter Monthly": "price_1SDaaKCcX0FmDNEaqwD3MVKd",
    "Starter Yearly": "price_1SDaaKCcX0FmDNEaloarw6Xh",
    "Growth Monthly": "price_1SDaceCcX0FmDNEaGVdmWpdX",
    "Growth Yearly": "price_1SDad4CcX0FmDNEax5pbyQqB"
}

print("Checking Price IDs:\n")
for name, price_id in price_ids.items():
    try:
        price = stripe.Price.retrieve(price_id)
        print(f"✅ {name}")
        print(f"   Price ID: {price.id}")
        print(f"   Amount: ${price.unit_amount / 100}")
        print(f"   Currency: {price.currency}")
        print(f"   Recurring: {price.recurring['interval']}")
        print(f"   Product: {price.product}\n")
    except stripe.error.InvalidRequestError:
        print(f"❌ {name} - Price ID not found: {price_id}\n")
    except Exception as e:
        print(f"❌ {name} - Error: {e}\n")

print("\nIf any prices show ❌, they don't exist in this Stripe account.")
print("You need to create them at: https://dashboard.stripe.com/test/products")