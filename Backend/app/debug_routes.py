from pymongo import MongoClient
from datetime import datetime

# MongoDB connection (using your Atlas cluster)
client = MongoClient('mongodb+srv://hamza:hamza@cluster0.n44j3.mongodb.net/crm_platform')
db = client['crm_platform']
users_collection = db['users']

# Emails to KEEP (will NOT be deleted)
protected_emails = [
    'shahbazdev0@gmail.com',  # Shahbaz
    'faizanellahi143@gmail.com',
      'faizan@gmail.com',
       'faizan@example.com' ,
         'faizan66@gmail.com',
         'cv@gmail.com',
             # Faizan
]

# Find all users to delete (customers and technicians, excluding protected emails and admins)
users_to_delete = users_collection.find({
    'role': {'$in': ['customer', 'technician']},
    'email': {'$nin': protected_emails}
})

# Count before deletion
count_before = users_collection.count_documents({})
count_to_delete = users_collection.count_documents({
    'role': {'$in': ['customer', 'technician']},
    'email': {'$nin': protected_emails}
})

print(f"Total users before cleanup: {count_before}")
print(f"Users to be deleted: {count_to_delete}")
print("\nUsers that will be KEPT:")
print("- All admin users")
print("- shahbazdev0@gmail.com (Shahbaz)")
print("- faizanellahi143@gmail.com (Faizan)")

# Show preview of users to be deleted
print("\nPreview of users to be deleted (first 10):")
preview_users = list(users_collection.find({
    'role': {'$in': ['customer', 'technician']},
    'email': {'$nin': protected_emails}
}).limit(10))

for user in preview_users:
    print(f"- {user.get('email')} ({user.get('role')}) - {user.get('first_name')} {user.get('last_name')}")

# Ask for confirmation
confirmation = input("\nDo you want to proceed with deletion? (type 'YES' to confirm): ")

if confirmation == 'YES':
    # Perform deletion
    result = users_collection.delete_many({
        'role': {'$in': ['customer', 'technician']},
        'email': {'$nin': protected_emails}
    })
    
    count_after = users_collection.count_documents({})
    
    print(f"\n✓ Deletion complete!")
    print(f"Users deleted: {result.deleted_count}")
    print(f"Total users remaining: {count_after}")
    
    # Show remaining users
    remaining_users = list(users_collection.find({}, {'email': 1, 'role': 1, 'first_name': 1, 'last_name': 1}))
    print("\nRemaining users:")
    for user in remaining_users:
        print(f"- {user.get('email')} ({user.get('role')}) - {user.get('first_name')} {user.get('last_name')}")
else:
    print("\n✗ Deletion cancelled. No users were deleted.")

client.close()