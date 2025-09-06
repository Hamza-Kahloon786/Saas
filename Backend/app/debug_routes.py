# backend/debug_flows.py - Create this file to check your database
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def debug_flows():
    # Connect to your MongoDB
    client = AsyncIOMotorClient("mongodb+srv://hamza:hamza@cluster0.n44j3.mongodb.net/crm_platform")
    db = client["crm_platform"]
    
    company_id = "68af46dab1355f0072ad6fa1"
    
    print(f"🔍 Debugging flows for company: {company_id}")
    print("=" * 50)
    
    # 1. Check what collections exist
    collections = await db.list_collection_names()
    print(f"📋 Available collections: {collections}")
    
    # 2. Check if flows collection exists and has data
    if "flows" in collections:
        total_flows = await db.flows.count_documents({})
        print(f"📊 Total flows in database: {total_flows}")
        
        # Get all flows for this company (ignore active status for now)
        all_company_flows = await db.flows.find({
            "company_id": ObjectId(company_id)
        }).to_list(length=100)
        
        print(f"🏢 Total flows for company {company_id}: {len(all_company_flows)}")
        
        if all_company_flows:
            for i, flow in enumerate(all_company_flows):
                print(f"\n📄 Flow {i+1}:")
                print(f"   - ID: {flow.get('_id')}")
                print(f"   - Name: {flow.get('name')}")
                print(f"   - Active: {flow.get('active')}")
                print(f"   - Company ID: {flow.get('company_id')}")
                print(f"   - Nodes count: {len(flow.get('nodes', []))}")
                print(f"   - Connections count: {len(flow.get('connections', []))}")
        
        # Check active flows specifically
        active_flows = await db.flows.find({
            "company_id": ObjectId(company_id),
            "active": True
        }).to_list(length=100)
        
        print(f"\n✅ Active flows for company: {len(active_flows)}")
        
    else:
        print("❌ 'flows' collection not found!")
        
        # Check for alternative collection names
        possible_names = ["flow", "conversation_flows", "ai_flows", "canvas_flows"]
        for name in possible_names:
            if name in collections:
                count = await db[name].count_documents({})
                print(f"🔍 Found '{name}' collection with {count} documents")
    
    # 3. Check the specific flow you showed me earlier
    specific_flow = await db.flows.find_one({"_id": ObjectId("68bbf1a7fdebf5429d3db385")})
    if specific_flow:
        print(f"\n🎯 Your specific flow found:")
        print(f"   - Name: {specific_flow.get('name')}")
        print(f"   - Active: {specific_flow.get('active')}")
        print(f"   - Company ID: {specific_flow.get('company_id')}")
        print(f"   - Nodes: {len(specific_flow.get('nodes', []))}")
        
        # Check if company IDs match
        flow_company_id = str(specific_flow.get('company_id'))
        print(f"   - Company ID matches: {flow_company_id == company_id}")
        
    else:
        print(f"\n❌ Specific flow 68bbf1a7fdebf5429d3db385 not found")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_flows())